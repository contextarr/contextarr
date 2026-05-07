import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import { z } from "zod";
import {
  contextPackManifestSchema,
  exportProfileSchema,
  freshnessRulesSchema,
  recordFrontmatterSchema,
  redactionRulesSchema,
  sourceMapSchema,
  validationRulesSchema,
  type ContextPackManifest,
  type RecordFrontmatter,
  type SourceMap
} from "@contextarr/schema";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  file?: string;
  path?: string;
}

export interface ValidationResult {
  packPath: string;
  valid: boolean;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

export interface ValidatePackOptions {
  scanText?: boolean;
}

export class PackReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PackReadError";
  }
}

const executableExtensions = new Set([
  ".app",
  ".apk",
  ".bat",
  ".bash",
  ".bin",
  ".cmd",
  ".com",
  ".deb",
  ".dll",
  ".exe",
  ".fish",
  ".jar",
  ".msi",
  ".ps1",
  ".rpm",
  ".scr",
  ".sh",
  ".vbs",
  ".wsf",
  ".zsh"
]);

const scriptExtensions = new Set([
  ".cjs",
  ".js",
  ".jsx",
  ".mjs",
  ".php",
  ".pl",
  ".py",
  ".rb",
  ".ts",
  ".tsx"
]);

const credentialPattern =
  /\b(api[_-]?key|secret|token|password|private[_-]?key)\b\s*[:=]\s*["']?[^\s"',}]{8,}/i;

const shellCommandPattern =
  /(?:^|[\s`])(rm\s+-rf|sudo\s+|curl\s+[^\n]*\|\s*(?:sh|bash)|powershell(?:\.exe)?\s+-|cmd(?:\.exe)?\s+\/c|bash\s+-c|sh\s+-c|Invoke-WebRequest|Start-Process|chmod\s+\+x|execSync|child_process)(?:\b|[\s`])/i;

export function validatePack(packPath: string, options: ValidatePackOptions = {}): ValidationResult {
  const resolvedPackPath = path.resolve(packPath);
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(resolvedPackPath)) {
    throw new PackReadError(`Pack path does not exist: ${resolvedPackPath}`);
  }

  if (!fs.statSync(resolvedPackPath).isDirectory()) {
    throw new PackReadError(`Pack path is not a directory: ${resolvedPackPath}`);
  }

  const allFiles = listFiles(resolvedPackPath, issues);
  scanFileTypes(resolvedPackPath, allFiles, issues);

  const manifestFile = path.join(resolvedPackPath, "contextarr-pack.json");
  const manifest = readJsonSchemaFile(
    resolvedPackPath,
    manifestFile,
    contextPackManifestSchema,
    issues,
    "manifest"
  );

  if (!manifest) {
    if (!fs.existsSync(manifestFile)) {
      addIssue(issues, "error", "manifest.missing", "Missing contextarr-pack.json.", "contextarr-pack.json");
    }

    scanTextFiles(resolvedPackPath, allFiles, issues, options.scanText ?? true);
    return finish(resolvedPackPath, issues);
  }

  validateManifestSafety(manifest, issues);
  const records = validateRecords(resolvedPackPath, manifest, issues);
  validateSourceMap(resolvedPackPath, manifest, records, issues);
  validateExportProfiles(resolvedPackPath, manifest, issues);
  validateRules(resolvedPackPath, manifest, issues);
  scanTextFiles(resolvedPackPath, allFiles, issues, options.scanText ?? true);

  return finish(resolvedPackPath, issues);
}

export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];
  const status = result.valid ? "Validation passed" : "Validation failed";

  lines.push(`${status}: ${result.packPath}`);
  lines.push(
    `Summary: ${result.summary.errors} error(s), ${result.summary.warnings} warning(s), ${result.summary.infos} info(s)`
  );

  for (const issue of result.issues) {
    const location = issue.file ? ` ${issue.file}` : "";
    const fieldPath = issue.path ? ` (${issue.path})` : "";
    lines.push(`[${issue.severity.toUpperCase()}] ${issue.code}${location}${fieldPath}: ${issue.message}`);
  }

  return `${lines.join("\n")}\n`;
}

function validateManifestSafety(manifest: ContextPackManifest, issues: ValidationIssue[]): void {
  if (manifest.containsExecutableCode !== false) {
    addIssue(
      issues,
      "error",
      "manifest.executable_code",
      "containsExecutableCode must be false for v0 packs.",
      "contextarr-pack.json",
      "containsExecutableCode"
    );
  }

  if (manifest.requiresNetwork !== false) {
    addIssue(
      issues,
      "error",
      "manifest.requires_network",
      "requiresNetwork must be false for v0 activation.",
      "contextarr-pack.json",
      "requiresNetwork"
    );
  }

  if (manifest.permissions.runCommands !== false) {
    addIssue(
      issues,
      "error",
      "manifest.run_commands",
      "permissions.runCommands must be false.",
      "contextarr-pack.json",
      "permissions.runCommands"
    );
  }

  if (manifest.permissions.networkAccess !== false) {
    addIssue(
      issues,
      "error",
      "manifest.network_access",
      "permissions.networkAccess must be false.",
      "contextarr-pack.json",
      "permissions.networkAccess"
    );
  }
}

function validateRecords(
  packPath: string,
  manifest: ContextPackManifest,
  issues: ValidationIssue[]
): RecordFrontmatter[] {
  const recordsDir = path.join(packPath, manifest.recordsPath);

  if (!fs.existsSync(recordsDir) || !fs.statSync(recordsDir).isDirectory()) {
    addIssue(
      issues,
      "error",
      "records.missing_directory",
      `Records folder does not exist: ${manifest.recordsPath}.`,
      manifest.recordsPath
    );
    return [];
  }

  const recordFiles = listFiles(recordsDir, issues).filter((file) => file.toLowerCase().endsWith(".md"));

  if (recordFiles.length === 0) {
    addIssue(issues, "warning", "records.empty", "Records folder contains no Markdown records.", manifest.recordsPath);
  }

  const records: RecordFrontmatter[] = [];
  const seenIds = new Map<string, string>();

  for (const file of recordFiles) {
    const relativeFile = relativePath(packPath, file);
    let parsed: matter.GrayMatterFile<string>;

    try {
      parsed = matter(fs.readFileSync(file, "utf8"));
    } catch (error) {
      addIssue(issues, "error", "record.read_failed", errorMessage(error), relativeFile);
      continue;
    }

    const record = parseSchemaData(recordFrontmatterSchema, parsed.data, issues, "record.schema", relativeFile);

    if (!record) {
      continue;
    }

    if (record.pack !== manifest.id) {
      addIssue(
        issues,
        "error",
        "record.pack_mismatch",
        `Record pack "${record.pack}" does not match manifest id "${manifest.id}".`,
        relativeFile,
        "pack"
      );
    }

    const existingFile = seenIds.get(record.id);
    if (existingFile) {
      addIssue(
        issues,
        "error",
        "record.duplicate_id",
        `Record id "${record.id}" is already used by ${existingFile}.`,
        relativeFile,
        "id"
      );
    } else {
      seenIds.set(record.id, relativeFile);
    }

    records.push(record);
  }

  return records;
}

function validateSourceMap(
  packPath: string,
  manifest: ContextPackManifest,
  records: RecordFrontmatter[],
  issues: ValidationIssue[]
): SourceMap | undefined {
  const sourcesFile = path.join(packPath, manifest.sourcesPath);
  const sourceMap = readYamlSchemaFile(packPath, sourcesFile, sourceMapSchema, issues, "sources");

  if (!sourceMap) {
    if (!fs.existsSync(sourcesFile)) {
      addIssue(issues, "error", "sources.missing", "Source map is required.", manifest.sourcesPath);
    }
    return undefined;
  }

  const sourceIds = new Set(sourceMap.sources.map((source) => source.id));

  for (const record of records) {
    for (const sourceId of record.sources) {
      if (!sourceIds.has(sourceId)) {
        addIssue(
          issues,
          "error",
          "record.source_missing",
          `Record "${record.id}" references missing source "${sourceId}".`,
          manifest.recordsPath,
          "sources"
        );
      }
    }
  }

  return sourceMap;
}

function validateExportProfiles(packPath: string, manifest: ContextPackManifest, issues: ValidationIssue[]): void {
  const exportsDir = path.join(packPath, manifest.exportsPath);

  if (!fs.existsSync(exportsDir) || !fs.statSync(exportsDir).isDirectory()) {
    addIssue(
      issues,
      "warning",
      "exports.missing_directory",
      `Export profiles folder does not exist: ${manifest.exportsPath}.`,
      manifest.exportsPath
    );
    return;
  }

  const exportFiles = listFiles(exportsDir, issues).filter(isYamlFile);

  if (exportFiles.length === 0) {
    addIssue(issues, "warning", "exports.empty", "Export profiles folder contains no YAML profiles.", manifest.exportsPath);
  }

  for (const file of exportFiles) {
    readYamlSchemaFile(packPath, file, exportProfileSchema, issues, "export_profile");
  }
}

function validateRules(packPath: string, manifest: ContextPackManifest, issues: ValidationIssue[]): void {
  const rulesDir = path.join(packPath, manifest.rulesPath);

  if (!fs.existsSync(rulesDir) || !fs.statSync(rulesDir).isDirectory()) {
    addIssue(
      issues,
      "warning",
      "rules.missing_directory",
      `Rules folder does not exist: ${manifest.rulesPath}.`,
      manifest.rulesPath
    );
    return;
  }

  const rules = [
    ["validation.yaml", validationRulesSchema, "rules.validation"],
    ["redaction.yaml", redactionRulesSchema, "rules.redaction"],
    ["freshness.yaml", freshnessRulesSchema, "rules.freshness"]
  ] as const;

  for (const [fileName, schema, code] of rules) {
    const file = path.join(rulesDir, fileName);
    if (fs.existsSync(file)) {
      readYamlSchemaFile(packPath, file, schema, issues, code);
    }
  }
}

function readJsonSchemaFile<TSchema extends z.ZodTypeAny>(
  packPath: string,
  file: string,
  schema: TSchema,
  issues: ValidationIssue[],
  codePrefix: string
): z.output<TSchema> | undefined {
  if (!fs.existsSync(file)) {
    return undefined;
  }

  try {
    return parseSchemaData(schema, JSON.parse(fs.readFileSync(file, "utf8")), issues, `${codePrefix}.schema`, relativePath(packPath, file));
  } catch (error) {
    addIssue(issues, "error", `${codePrefix}.parse_failed`, errorMessage(error), relativePath(packPath, file));
    return undefined;
  }
}

function readYamlSchemaFile<TSchema extends z.ZodTypeAny>(
  packPath: string,
  file: string,
  schema: TSchema,
  issues: ValidationIssue[],
  codePrefix: string
): z.output<TSchema> | undefined {
  if (!fs.existsSync(file)) {
    return undefined;
  }

  try {
    return parseSchemaData(schema, YAML.parse(fs.readFileSync(file, "utf8")), issues, `${codePrefix}.schema`, relativePath(packPath, file));
  } catch (error) {
    addIssue(issues, "error", `${codePrefix}.parse_failed`, errorMessage(error), relativePath(packPath, file));
    return undefined;
  }
}

function parseSchemaData<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown,
  issues: ValidationIssue[],
  code: string,
  file: string
): z.output<TSchema> | undefined {
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    return parsed.data;
  }

  for (const issue of parsed.error.issues) {
    addIssue(issues, "error", code, issue.message, file, issue.path.join("."));
  }

  return undefined;
}

function scanFileTypes(packPath: string, files: string[], issues: ValidationIssue[]): void {
  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    const relativeFile = relativePath(packPath, file);

    if (executableExtensions.has(extension)) {
      addIssue(issues, "error", "pack.executable_file", `Executable or binary payload file is not allowed: ${relativeFile}.`, relativeFile);
    }

    if (scriptExtensions.has(extension)) {
      addIssue(issues, "error", "pack.script_file", `Script file is not allowed in v0 packs: ${relativeFile}.`, relativeFile);
    }
  }
}

function scanTextFiles(packPath: string, files: string[], issues: ValidationIssue[], enabled: boolean): void {
  if (!enabled) {
    return;
  }

  for (const file of files.filter(isScannableTextFile)) {
    const relativeFile = relativePath(packPath, file);
    let content = "";

    try {
      content = fs.readFileSync(file, "utf8");
    } catch (error) {
      addIssue(issues, "warning", "scan.read_failed", errorMessage(error), relativeFile);
      continue;
    }

    if (credentialPattern.test(content)) {
      addIssue(
        issues,
        "error",
        "scan.credential_pattern",
        "Obvious API key, token, password, or private key pattern found.",
        relativeFile
      );
    }

    if (shellCommandPattern.test(content)) {
      addIssue(issues, "error", "scan.shell_command", "Obvious shell command pattern found.", relativeFile);
    }
  }
}

function listFiles(root: string, issues: ValidationIssue[]): string[] {
  const files: string[] = [];

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      addIssue(issues, "error", "filesystem.read_failed", errorMessage(error), dir);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) {
        addIssue(issues, "warning", "filesystem.symlink", "Symlinks are ignored during validation.", fullPath);
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  walk(root);
  return files;
}

function isYamlFile(file: string): boolean {
  return [".yaml", ".yml"].includes(path.extname(file).toLowerCase());
}

function isScannableTextFile(file: string): boolean {
  return [".json", ".md", ".yaml", ".yml", ".txt"].includes(path.extname(file).toLowerCase());
}

function finish(packPath: string, issues: ValidationIssue[]): ValidationResult {
  const summary = {
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    infos: issues.filter((issue) => issue.severity === "info").length
  };

  return {
    packPath,
    valid: summary.errors === 0,
    issues,
    summary
  };
}

function addIssue(
  issues: ValidationIssue[],
  severity: ValidationSeverity,
  code: string,
  message: string,
  file?: string,
  fieldPath?: string
): void {
  issues.push({
    severity,
    code,
    message,
    file: file ? normalizePath(file) : undefined,
    path: fieldPath
  });
}

function relativePath(root: string, file: string): string {
  return normalizePath(path.relative(root, file));
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
