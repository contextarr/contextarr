import fs from "node:fs";
import path from "node:path";
import {
  BINARY_FILE_EXTENSIONS,
  DEFAULT_SECURITY_SCANNER_VERSION,
  SCRIPT_AND_EXECUTABLE_EXTENSIONS,
  SKIPPED_DIRECTORIES,
  TEXT_FILE_EXTENSIONS,
  TEXT_POLICIES,
  type FilePolicy,
  type TextPolicy
} from "./policies";
import { createSecurityScannerReport } from "./report";
import {
  type SecurityFindingCategory,
  type SecurityFindingSeverity,
  type SecurityRecommendedAction,
  type SecurityScannerArtifactType,
  type SecurityScannerFinding,
  type SecurityScannerReportV1
} from "./types";

export * from "./policies";
export * from "./report";
export * from "./types";

export interface ScanArtifactOptions {
  path: string;
  artifactId?: string;
  artifactType?: SecurityScannerArtifactType;
  artifactVersion?: string;
  scannerVersion?: string;
  sourceTrust?: "local" | "imported" | "registry";
}

export class SecurityScannerError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "SecurityScannerError";
  }
}

const DEFAULT_LIMITATIONS = [
  "A scanner is a gate, not a guarantee.",
  "Pattern matching cannot prove arbitrary natural-language instructions are safe in every downstream agent runtime.",
  "This local scanner does not execute files, call networks, invoke AI models, or parse binary assets.",
  "Human review remains required before registry activation, export, or MCP exposure."
];

export function scanArtifact(options: ScanArtifactOptions): SecurityScannerReportV1 {
  const rootPath = path.resolve(options.path);
  if (!fs.existsSync(rootPath)) {
    throw new SecurityScannerError("scan.input_missing", `Scan path does not exist: ${options.path}`);
  }

  const stats = fs.statSync(rootPath);
  if (!stats.isDirectory() && !stats.isFile()) {
    throw new SecurityScannerError("scan.input_unsupported", `Scan path is not a readable file or directory: ${options.path}`);
  }
  if (fs.lstatSync(rootPath).isSymbolicLink()) {
    throw new SecurityScannerError("scan.path_escape", `Scan root must not be a symlink: ${options.path}`);
  }

  const metadata = readArtifactMetadata(rootPath, stats.isDirectory());
  const findings: Omit<SecurityScannerFinding, "id">[] = stats.isDirectory() ? collectSymlinkFindings(rootPath) : [];
  const files = stats.isDirectory() ? listFiles(rootPath) : [rootPath];
  let scanningFailed = false;

  for (const file of files) {
    const relativePath = normalizePath(path.relative(rootPath, file)) || path.basename(file);
    const extension = path.extname(file).toLowerCase();
    assertInsideRoot(rootPath, file);
    const filePolicy = SCRIPT_AND_EXECUTABLE_EXTENSIONS.get(extension);

    if (filePolicy) {
      findings.push(createFileFinding(relativePath, filePolicy));
      continue;
    }

    let textLike = false;
    try {
      textLike = isTextLikeFile(file);
    } catch {
      scanningFailed = true;
      findings.push(createScanFailureFinding(relativePath, "File could not be inspected for text safety."));
      continue;
    }

    if (BINARY_FILE_EXTENSIONS.has(extension) || !textLike) {
      continue;
    }

    let bytes: Buffer;
    try {
      bytes = fs.readFileSync(file);
    } catch {
      scanningFailed = true;
      findings.push(createScanFailureFinding(relativePath, "Allowlisted text file could not be read and was not scanned."));
      continue;
    }

    if (bytes.includes(0)) {
      scanningFailed = true;
      findings.push(createScanFailureFinding(relativePath, "Allowlisted text file contains NUL bytes and was not scanned."));
      continue;
    }

    const content = bytes.toString("utf8");
    if (content.includes("\uFFFD")) {
      scanningFailed = true;
      findings.push(createScanFailureFinding(relativePath, "Allowlisted text file contains undecodable UTF-8 and was not scanned."));
      continue;
    }

    findings.push(...scanTextContent(relativePath, content));

    if (isManifestFile(relativePath)) {
      findings.push(...scanManifestPolicy(relativePath, content));
    }
  }

  return createSecurityScannerReport({
    artifactId: options.artifactId ?? metadata.artifactId,
    artifactType: options.artifactType ?? metadata.artifactType,
    artifactVersion: options.artifactVersion ?? metadata.artifactVersion,
    scannerVersion: options.scannerVersion ?? DEFAULT_SECURITY_SCANNER_VERSION,
    findings,
    limitations: DEFAULT_LIMITATIONS,
    status: scanningFailed ? "scanning_failed" : undefined,
    cleanRecommendedAction: options.sourceTrust && options.sourceTrust !== "local" ? "quarantine" : "activate"
  });
}

export function formatSecurityScannerReport(report: SecurityScannerReportV1): string {
  const lines = [
    `Security scan ${report.status === "policy_clean" ? "passed" : "completed"}: ${report.artifactId}`,
    `Status: ${report.status}`,
    `Recommended action: ${report.recommendedAction}`,
    `Summary: ${report.summary.critical} critical, ${report.summary.high} high, ${report.summary.medium} medium, ${report.summary.low} low, ${report.summary.info} info`
  ];

  for (const finding of report.findings) {
    const location = finding.line ? `${finding.file}:${finding.line}` : finding.file;
    lines.push(`[${finding.severity.toUpperCase()}] ${finding.code} ${location}: ${finding.message}`);
  }

  return `${lines.join("\n")}\n`;
}

function listFiles(rootPath: string): string[] {
  const files: string[] = [];
  const realRoot = fs.realpathSync(rootPath);

  function walk(directory: string): void {
    const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
      } else if (entry.isFile()) {
        assertInsideRoot(realRoot, absolutePath);
        files.push(absolutePath);
      }
    }
  }

  walk(rootPath);
  return files.sort((left, right) => left.localeCompare(right));
}

function scanTextContent(relativePath: string, content: string): Omit<SecurityScannerFinding, "id">[] {
  const findings: Omit<SecurityScannerFinding, "id">[] = [];
  const lines = content.split(/\r?\n/);
  const seen = new Set<string>();
  const normalized = normalizeMultilineContent(lines);
  const normalizedHasSecretHit = TEXT_POLICIES.some(
    (policy) => policy.code.startsWith("scan.secret.") && policy.pattern.test(normalized.content)
  );

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    const lineHasSecretHit = TEXT_POLICIES.some((policy) => policy.code.startsWith("scan.secret.") && policy.pattern.test(line));
    for (const policy of TEXT_POLICIES) {
      if (!policy.pattern.test(line)) {
        continue;
      }
      const key = `${relativePath}:${index + 1}:${policy.code}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      findings.push(createTextFinding(relativePath, index + 1, line, policy, lineHasSecretHit));
    }
  }

  for (const policy of TEXT_POLICIES) {
    const match = policy.pattern.exec(normalized.content);
    if (!match) {
      continue;
    }
    const lineNumber = lineForNormalizedOffset(normalized.lineOffsets, match.index);
    const key = `${relativePath}:${lineNumber}:${policy.code}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    findings.push(createTextFinding(relativePath, lineNumber, match[0], policy, normalizedHasSecretHit));
  }

  return findings;
}

function scanManifestPolicy(relativePath: string, content: string): Omit<SecurityScannerFinding, "id">[] {
  const findings: Omit<SecurityScannerFinding, "id">[] = [];
  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return findings;
  }

  if (parsed.containsExecutableCode === true) {
    findings.push(createManifestFinding(relativePath, "scan.manifest_executable_code", "containsExecutableCode must not be true."));
  }
  if (parsed.requiresNetwork === true) {
    findings.push(createManifestFinding(relativePath, "scan.manifest_requires_network", "requiresNetwork must not be true."));
  }

  const permissions = typeof parsed.permissions === "object" && parsed.permissions ? (parsed.permissions as Record<string, unknown>) : {};
  if (permissions.runCommands === true) {
    findings.push(createManifestFinding(relativePath, "scan.manifest_run_commands", "permissions.runCommands must not be true."));
  }
  if (permissions.networkAccess === true) {
    findings.push(createManifestFinding(relativePath, "scan.manifest_network_access", "permissions.networkAccess must not be true."));
  }

  return findings;
}

function createFileFinding(relativePath: string, policy: FilePolicy): Omit<SecurityScannerFinding, "id"> {
  return {
    code: policy.code,
    severity: policy.severity,
    category: policy.category,
    file: relativePath,
    path: relativePath,
    message: policy.message,
    recommendedAction: policy.recommendedAction,
    blocking: policy.blocking,
    ruleId: policy.ruleId,
    confidence: policy.confidence
  };
}

function createTextFinding(
  relativePath: string,
  lineNumber: number,
  line: string,
  policy: TextPolicy,
  lineHasSecretHit: boolean
): Omit<SecurityScannerFinding, "id"> {
  return {
    code: policy.code,
    severity: policy.severity,
    category: policy.category,
    file: relativePath,
    path: relativePath,
    line: lineNumber,
    message: policy.message,
    evidenceSnippet: redactEvidence(policy.code, line, lineHasSecretHit),
    recommendedAction: policy.recommendedAction,
    blocking: policy.blocking,
    ruleId: policy.ruleId,
    confidence: policy.confidence
  };
}

function createManifestFinding(relativePath: string, code: string, message: string): Omit<SecurityScannerFinding, "id"> {
  return {
    code,
    severity: "critical",
    category: "manifest_policy",
    file: relativePath,
    path: relativePath,
    message,
    recommendedAction: "block",
    blocking: true,
    ruleId: `manifest.${code.replace(/^scan\.manifest_/, "")}`,
    confidence: 0.95
  };
}

function createScanFailureFinding(relativePath: string, message: string): Omit<SecurityScannerFinding, "id"> {
  return {
    code: "scan.scanning_failed",
    severity: "critical",
    category: "unknown",
    file: relativePath,
    path: relativePath,
    message,
    recommendedAction: "block",
    blocking: true,
    ruleId: "scanner.text_decode_failed",
    confidence: 1
  };
}

function createPathBoundaryFinding(relativePath: string, message: string): Omit<SecurityScannerFinding, "id"> {
  return {
    code: "scan.path_escape",
    severity: "critical",
    category: "unknown",
    file: relativePath,
    path: relativePath,
    message,
    recommendedAction: "block",
    blocking: true,
    ruleId: "path.symlink_or_reparse_point",
    confidence: 0.95
  };
}

function readArtifactMetadata(rootPath: string, isDirectory: boolean): {
  artifactId: string;
  artifactType: SecurityScannerArtifactType;
  artifactVersion: string;
} {
  if (!isDirectory) {
    return {
      artifactId: path.basename(rootPath),
      artifactType: "unknown",
      artifactVersion: "unknown"
    };
  }

  const manifests: Array<{ file: string; type: SecurityScannerArtifactType }> = [
    { file: "contextarr-pack.json", type: "context_pack" },
    { file: "contextarr-skill.json", type: "skill" },
    { file: "contextarr-agent-kit.json", type: "agent_kit" },
    { file: "contextarr-registry-manifest.json", type: "registry_policy" }
  ];

  for (const manifest of manifests) {
      const manifestPath = path.join(rootPath, manifest.file);
      if (!fs.existsSync(manifestPath)) {
        continue;
      }
      if (fs.lstatSync(manifestPath).isSymbolicLink()) {
        continue;
      }
      assertInsideRoot(rootPath, manifestPath);
      const parsed = readJsonRecord(manifestPath);
      return {
      artifactId: stringValue(parsed.id, path.basename(rootPath)),
      artifactType: manifest.type,
      artifactVersion: stringValue(parsed.version, "unknown")
    };
  }

  return {
    artifactId: path.basename(rootPath),
    artifactType: "unknown",
    artifactVersion: "unknown"
  };
}

function collectSymlinkFindings(rootPath: string): Omit<SecurityScannerFinding, "id">[] {
  const findings: Omit<SecurityScannerFinding, "id">[] = [];

  function walk(directory: string): void {
    const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = normalizePath(path.relative(rootPath, absolutePath));
      if (entry.isSymbolicLink()) {
        findings.push(createPathBoundaryFinding(relativePath, "Symlinks and reparse points are not allowed in scanned artifacts."));
        continue;
      }
      if (entry.isDirectory() && !SKIPPED_DIRECTORIES.has(entry.name)) {
        walk(absolutePath);
      }
    }
  }

  walk(rootPath);
  return findings;
}

function readJsonRecord(filePath: string): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function isTextLikeFile(filePath: string): boolean {
  const extension = path.extname(filePath).toLowerCase();
  if (TEXT_FILE_EXTENSIONS.has(extension)) {
    return true;
  }
  if (extension && !TEXT_FILE_EXTENSIONS.has(extension)) {
    return false;
  }

  const bytes = fs.readFileSync(filePath);
  return !bytes.subarray(0, Math.min(bytes.length, 4096)).includes(0);
}

function assertInsideRoot(rootPath: string, candidatePath: string): void {
  const root = fs.realpathSync(rootPath);
  const candidate = fs.realpathSync(candidatePath);
  const relative = path.relative(root, candidate);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return;
  }

  throw new SecurityScannerError("scan.path_escape", `Scan path escapes artifact root: ${candidatePath}`);
}

function isManifestFile(relativePath: string): boolean {
  return ["contextarr-pack.json", "contextarr-skill.json", "contextarr-agent-kit.json"].includes(path.basename(relativePath));
}

function redactEvidence(code: string, line: string, lineHasSecretHit: boolean): string {
  if (code.startsWith("scan.secret.") || lineHasSecretHit) {
    return "[redacted]";
  }

  const compact = line.replace(/\s+/g, " ").trim();
  return compact.length > 140 ? `${compact.slice(0, 137)}...` : compact;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function normalizeMultilineContent(lines: string[]): { content: string; lineOffsets: number[] } {
  let content = "";
  const lineOffsets: number[] = [];

  for (const line of lines) {
    lineOffsets.push(content.length);
    content += `${line} `;
  }

  return {
    content,
    lineOffsets
  };
}

function lineForNormalizedOffset(lineOffsets: number[], offset: number): number {
  let lineNumber = 1;
  for (let index = 0; index < lineOffsets.length; index += 1) {
    if (lineOffsets[index]! > offset) {
      break;
    }
    lineNumber = index + 1;
  }
  return lineNumber;
}
