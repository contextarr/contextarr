import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import { contextPackManifestSchema, recordFrontmatterSchema, sourceMapSchema, type ContextPackManifest } from "@contextarr/schema";
import { validatePack, type ValidationIssue, type ValidationResult } from "@contextarr/pack-validator";
import {
  createSecurityScannerReport,
  DEFAULT_SECURITY_SCANNER_VERSION,
  scanArtifact,
  type SecurityScannerFinding,
  type SecurityScannerReportV1
} from "@contextarr/security-scanner";
import type { ServerConfig } from "./types";

export type DraftPackSourceType = "collector" | "imported" | "composed";

export interface DraftPackRoot {
  sourceType: DraftPackSourceType;
  label: string;
  rootDir: string;
}

export interface DraftPackSummary {
  id: string;
  sourceType: DraftPackSourceType;
  sourceLabel: string;
  relativePath: string;
  packId: string | null;
  name: string;
  version: string | null;
  description: string;
  type: string | null;
  visibility: string | null;
  trustLevel: string | null;
  recordCount: number;
  sourceCount: number;
  exportProfileCount: number;
  contentHash: string;
  validation: DraftValidationSummary;
  security: DraftSecuritySummary;
  activation: DraftActivationSummary;
}

export interface DraftPackDetail extends DraftPackSummary {
  records: DraftRecordSummary[];
  validationIssues: ValidationIssue[];
  securityFindings: SecurityScannerFinding[];
}

export interface DraftValidationSummary {
  valid: boolean;
  status: ValidationResult["validationStatus"] | "read_failed";
  errors: number;
  warnings: number;
  infos: number;
}

export interface DraftSecuritySummary {
  status: SecurityScannerReportV1["status"];
  recommendedAction: SecurityScannerReportV1["recommendedAction"];
  critical: number;
  high: number;
  medium: number;
  low: number;
  blocked: boolean;
}

export interface DraftActivationSummary {
  canActivate: boolean;
  status: "ready_for_review" | "review_required" | "blocked";
  targetPackId: string | null;
  blockingReasons: string[];
  warnings: string[];
}

export interface DraftRecordSummary {
  id: string;
  title: string;
  type: string;
  privacy: string;
  reviewStatus: string;
  tags: string[];
  sources: string[];
}

export interface DraftActivationResult {
  ok: true;
  draftId: string;
  packId: string;
  sourceType: DraftPackSourceType;
  contentHash: string;
  activated: {
    status: "activated_for_review";
    indexed: false;
    approvalChanged: false;
    exportReady: false;
    mcpReady: false;
  };
  validation: DraftValidationSummary;
  security: DraftSecuritySummary;
  warnings: string[];
}

export class DraftPackError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "DraftPackError";
  }
}

export function getDraftPackRoots(config: Pick<ServerConfig, "draftPacksDir" | "importedPacksDir" | "composedPacksDir">): DraftPackRoot[] {
  return [
    {
      sourceType: "collector",
      label: "Collector Drafts",
      rootDir: config.draftPacksDir
    },
    {
      sourceType: "imported",
      label: "Imported Packs",
      rootDir: config.importedPacksDir
    },
    {
      sourceType: "composed",
      label: "Composed Packs",
      rootDir: config.composedPacksDir
    }
  ];
}

export function listContextPackDrafts(config: Pick<ServerConfig, "packsDir" | "draftPacksDir" | "importedPacksDir" | "composedPacksDir">): DraftPackSummary[] {
  assertDraftRootsSafe(config);
  return getDraftPackRoots(config)
    .flatMap((root) => findDraftPackPaths(root).map((packPath) => buildDraftPackSummary(root, packPath, config.packsDir)))
    .sort(compareDraftSummaries);
}

export function getContextPackDraft(
  config: Pick<ServerConfig, "packsDir" | "draftPacksDir" | "importedPacksDir" | "composedPacksDir">,
  draftId: string
): DraftPackDetail | undefined {
  const candidate = resolveDraftCandidate(config, draftId);
  if (!candidate) {
    return undefined;
  }

  const summary = buildDraftPackSummary(candidate.root, candidate.packPath, config.packsDir);
  return {
    ...summary,
    records: readDraftRecords(candidate.packPath),
    validationIssues: validateDraftPack(candidate.packPath).issues,
    securityFindings: scanDraftPack(candidate.packPath, summary.packId ?? path.basename(candidate.packPath)).findings
  };
}

export function activateContextPackDraft(
  config: Pick<ServerConfig, "packsDir" | "draftPacksDir" | "importedPacksDir" | "composedPacksDir">,
  draftId: string,
  options: { expectedHash?: string } = {}
): DraftActivationResult {
  assertDraftRootsSafe(config);
  const candidate = resolveDraftCandidate(config, draftId);
  if (!candidate) {
    throw new DraftPackError("draft.not_found", `Context Pack draft not found: ${draftId}`, 404);
  }

  const summary = buildDraftPackSummary(candidate.root, candidate.packPath, config.packsDir);
  if (options.expectedHash && options.expectedHash !== summary.contentHash) {
    throw new DraftPackError("draft.hash_mismatch", "Draft content changed since it was reviewed.", 409, {
      expectedHash: options.expectedHash,
      actualHash: summary.contentHash
    });
  }
  if (!summary.packId) {
    throw new DraftPackError("draft.missing_pack_id", "Draft manifest must include a valid pack id before activation.", 400);
  }
  if (!isSafePackDirectoryName(summary.packId)) {
    throw new DraftPackError("draft.unsafe_pack_id", "Draft pack id is not safe for activation.", 400, { packId: summary.packId });
  }
  const activeRoot = path.resolve(config.packsDir);
  const targetPath = path.join(activeRoot, summary.packId);
  assertInsideRoot(activeRoot, targetPath, "Activation target escaped the active Context Pack root.");
  if (fs.existsSync(targetPath)) {
    throw new DraftPackError("active_pack.exists", `Active Context Pack already exists: ${summary.packId}`, 409, {
      packId: summary.packId
    });
  }
  if (!summary.activation.canActivate) {
    throw new DraftPackError("draft.activation_blocked", "Draft failed activation gates.", 400, {
      blockingReasons: summary.activation.blockingReasons
    });
  }

  fs.mkdirSync(activeRoot, { recursive: true });
  if (!fs.statSync(activeRoot).isDirectory()) {
    throw new DraftPackError("active_root.invalid", "Active Context Pack root is not a directory.", 400);
  }

  const tempPath = fs.mkdtempSync(path.join(activeRoot, `.tmp-activate-${summary.packId}-`));
  try {
    fs.cpSync(candidate.packPath, tempPath, { recursive: true, dereference: false, errorOnExist: true });
    fs.renameSync(tempPath, targetPath);
  } catch (error) {
    fs.rmSync(tempPath, { recursive: true, force: true });
    throw error;
  }

  return {
    ok: true,
    draftId,
    packId: summary.packId,
    sourceType: summary.sourceType,
    contentHash: summary.contentHash,
    activated: {
      status: "activated_for_review",
      indexed: false,
      approvalChanged: false,
      exportReady: false,
      mcpReady: false
    },
    validation: summary.validation,
    security: summary.security,
    warnings: summary.activation.warnings
  };
}

function buildDraftPackSummary(root: DraftPackRoot, packPath: string, activePacksDir: string): DraftPackSummary {
  const manifest = readManifest(packPath);
  const validation = validateDraftPack(packPath);
  const securityScan = scanDraftPack(packPath, manifest?.id ?? path.basename(packPath));
  const contentHash = hashDraftPack(packPath);
  const relativePath = normalizePath(path.relative(root.rootDir, packPath));
  const activeConflict = Boolean(manifest?.id && fs.existsSync(path.join(activePacksDir, manifest.id)));
  const counts = manifest ? readDraftCounts(packPath, manifest) : { records: 0, sources: 0, exportProfiles: 0 };
  const activation = summarizeActivation(manifest?.id ?? null, validation, securityScan, activeConflict);

  return {
    id: encodeDraftId(root.sourceType, relativePath),
    sourceType: root.sourceType,
    sourceLabel: root.label,
    relativePath,
    packId: manifest?.id ?? validation.packId,
    name: manifest?.name ?? validation.packId ?? path.basename(packPath),
    version: manifest?.version ?? null,
    description: manifest?.description ?? "Draft Context Pack requires review.",
    type: manifest?.type ?? null,
    visibility: manifest?.visibility ?? null,
    trustLevel: manifest?.trustLevel ?? null,
    recordCount: counts.records,
    sourceCount: counts.sources,
    exportProfileCount: counts.exportProfiles,
    contentHash,
    validation: summarizeValidation(validation),
    security: summarizeSecurity(securityScan),
    activation
  };
}

function summarizeActivation(
  packId: string | null,
  validation: ValidationResult,
  securityScan: SecurityScannerReportV1,
  activeConflict: boolean
): DraftActivationSummary {
  const blockingReasons: string[] = [];
  const warnings: string[] = ["Activation copies the draft for review; it does not approve records, exports, or MCP exposure."];

  if (!packId) {
    blockingReasons.push("Draft manifest does not include a valid pack id.");
  } else if (!isSafePackDirectoryName(packId)) {
    blockingReasons.push("Draft pack id is not safe as a local directory name.");
  }
  if (activeConflict) {
    blockingReasons.push("An active Context Pack with this id already exists.");
  }
  if (validation.summary.errors > 0) {
    blockingReasons.push("Validation errors must be fixed before activation.");
  }
  if (isBlockingSecurityScan(securityScan)) {
    blockingReasons.push("Security scanner findings block activation.");
  }
  if (validation.summary.warnings > 0) {
    warnings.push("Validation warnings remain after activation and require human review.");
  }
  if (securityScan.recommendedAction === "review" || securityScan.recommendedAction === "quarantine") {
    warnings.push("Security scanner recommends review before relying on this draft.");
  }

  return {
    canActivate: blockingReasons.length === 0,
    status: blockingReasons.length > 0 ? "blocked" : warnings.length > 1 ? "review_required" : "ready_for_review",
    targetPackId: packId,
    blockingReasons,
    warnings
  };
}

function summarizeValidation(validation: ValidationResult): DraftValidationSummary {
  return {
    valid: validation.valid,
    status: validation.validationStatus,
    errors: validation.summary.errors,
    warnings: validation.summary.warnings,
    infos: validation.summary.infos
  };
}

function summarizeSecurity(securityScan: SecurityScannerReportV1): DraftSecuritySummary {
  return {
    status: securityScan.status,
    recommendedAction: securityScan.recommendedAction,
    critical: securityScan.summary.critical,
    high: securityScan.summary.high,
    medium: securityScan.summary.medium,
    low: securityScan.summary.low,
    blocked: isBlockingSecurityScan(securityScan)
  };
}

function validateDraftPack(packPath: string): ValidationResult {
  try {
    return validatePack(packPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const issues: ValidationIssue[] = [
      {
        severity: "error",
        code: "draft.read_failed",
        message
      }
    ];
    return {
      packPath,
      packId: null,
      valid: false,
      validationStatus: "invalid",
      issues,
      summary: {
        errors: 1,
        warnings: 0,
        infos: 0,
        redactionHits: 0,
        exportProfilesReady: 0,
        exportProfilesWithWarnings: 0,
        exportProfilesBlocked: 0,
        staleSources: 0,
        licenseWarnings: 0,
        licenseMissing: 0,
        licenseUnknown: 0,
        licenseRisks: 0,
        docsWarnings: 0
      },
      redactionHits: [],
      exportReadiness: {
        status: "blocked",
        profiles: []
      }
    };
  }
}

function scanDraftPack(packPath: string, artifactId: string): SecurityScannerReportV1 {
  try {
    return scanArtifact({
      path: packPath,
      artifactId,
      artifactType: "context_pack",
      sourceTrust: "imported"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createSecurityScannerReport({
      artifactId,
      artifactType: "context_pack",
      artifactVersion: "unknown",
      scannerVersion: DEFAULT_SECURITY_SCANNER_VERSION,
      status: "scanning_failed",
      limitations: [
        "A scanner is a gate, not a guarantee.",
        "The draft could not be fully scanned, so activation is blocked."
      ],
      findings: [
        {
          code: "scan.scanning_failed",
          severity: "critical",
          category: "unknown",
          file: ".",
          path: ".",
          message,
          recommendedAction: "block",
          blocking: true,
          ruleId: "scanner.failed",
          confidence: 1
        }
      ]
    });
  }
}

function isBlockingSecurityScan(securityScan: SecurityScannerReportV1): boolean {
  return (
    securityScan.recommendedAction === "block" ||
    securityScan.status === "blocked" ||
    securityScan.status === "critical_findings" ||
    securityScan.status === "scanning_failed" ||
    securityScan.findings.some((finding) => finding.blocking)
  );
}

function findDraftPackPaths(root: DraftPackRoot): string[] {
  const rootDir = path.resolve(root.rootDir);
  if (!fs.existsSync(rootDir) || !fs.statSync(rootDir).isDirectory()) {
    return [];
  }

  const candidates: string[] = [];

  function walk(directory: string): void {
    const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
    if (entries.some((entry) => entry.isFile() && entry.name === "contextarr-pack.json")) {
      candidates.push(directory);
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }
      walk(path.join(directory, entry.name));
    }
  }

  walk(rootDir);
  return candidates.sort((left, right) => left.localeCompare(right));
}

function resolveDraftCandidate(
  config: Pick<ServerConfig, "packsDir" | "draftPacksDir" | "importedPacksDir" | "composedPacksDir">,
  draftId: string
): { root: DraftPackRoot; packPath: string } | undefined {
  assertDraftRootsSafe(config);
  for (const root of getDraftPackRoots(config)) {
    for (const packPath of findDraftPackPaths(root)) {
      const relativePath = normalizePath(path.relative(root.rootDir, packPath));
      if (encodeDraftId(root.sourceType, relativePath) === draftId) {
        return { root, packPath };
      }
    }
  }

  return undefined;
}

function readManifest(packPath: string): ContextPackManifest | undefined {
  try {
    const manifestPath = path.join(packPath, "contextarr-pack.json");
    if (!fs.existsSync(manifestPath)) {
      return undefined;
    }
    const parsed = contextPackManifestSchema.safeParse(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function readDraftCounts(packPath: string, manifest: ContextPackManifest): { records: number; sources: number; exportProfiles: number } {
  const recordsDir = path.join(packPath, manifest.recordsPath);
  const exportsDir = path.join(packPath, manifest.exportsPath);
  const sourceMapPath = path.join(packPath, manifest.sourcesPath);
  let sources = 0;

  try {
    if (fs.existsSync(sourceMapPath)) {
      const parsed = sourceMapSchema.safeParse(YAML.parse(fs.readFileSync(sourceMapPath, "utf8")));
      sources = parsed.success ? parsed.data.sources.length : 0;
    }
  } catch {
    sources = 0;
  }

  return {
    records: fs.existsSync(recordsDir) ? listFiles(recordsDir).filter((file) => file.toLowerCase().endsWith(".md")).length : 0,
    sources,
    exportProfiles: fs.existsSync(exportsDir) ? listFiles(exportsDir).filter((file) => [".yaml", ".yml"].includes(path.extname(file).toLowerCase())).length : 0
  };
}

function readDraftRecords(packPath: string): DraftRecordSummary[] {
  const manifest = readManifest(packPath);
  if (!manifest) {
    return [];
  }

  const recordsDir = path.join(packPath, manifest.recordsPath);
  if (!fs.existsSync(recordsDir) || !fs.statSync(recordsDir).isDirectory()) {
    return [];
  }

  return listFiles(recordsDir)
    .filter((file) => file.toLowerCase().endsWith(".md"))
    .flatMap((file) => {
      try {
        const parsed = matter(fs.readFileSync(file, "utf8"));
        const record = recordFrontmatterSchema.safeParse(parsed.data);
        if (!record.success) {
          return [];
        }
        return [
          {
            id: record.data.id,
            title: record.data.title,
            type: record.data.type,
            privacy: record.data.privacy,
            reviewStatus: record.data.review_status,
            tags: record.data.tags,
            sources: record.data.sources
          }
        ];
      } catch {
        return [];
      }
    })
    .sort((left, right) => left.title.localeCompare(right.title));
}

function hashDraftPack(packPath: string): string {
  const hash = crypto.createHash("sha256");
  for (const file of listFiles(packPath).sort((left, right) => left.localeCompare(right))) {
    const relative = normalizePath(path.relative(packPath, file));
    const stats = fs.lstatSync(file);
    hash.update(relative);
    hash.update("\0");
    if (stats.isSymbolicLink()) {
      hash.update("symlink");
      hash.update(fs.readlinkSync(file));
    } else {
      hash.update(fs.readFileSync(file));
    }
    hash.update("\0");
  }
  return hash.digest("hex");
}

function listFiles(root: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(root)) {
    return files;
  }

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      files.push(fullPath);
    }
  }
  return files;
}

function encodeDraftId(sourceType: DraftPackSourceType, relativePath: string): string {
  return Buffer.from(`${sourceType}\0${normalizePath(relativePath)}`, "utf8").toString("base64url");
}

function compareDraftSummaries(left: DraftPackSummary, right: DraftPackSummary): number {
  return left.sourceType.localeCompare(right.sourceType) || left.name.localeCompare(right.name) || left.relativePath.localeCompare(right.relativePath);
}

function isSafePackDirectoryName(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
}

function assertDraftRootsSafe(config: Pick<ServerConfig, "packsDir" | "draftPacksDir" | "importedPacksDir" | "composedPacksDir">): void {
  const active = path.resolve(config.packsDir);
  const roots = [config.draftPacksDir, config.importedPacksDir, config.composedPacksDir].map((root) => path.resolve(root));
  for (const root of roots) {
    if (pathsOverlap(active, root)) {
      throw new DraftPackError("draft_root.overlaps_active", "Draft Context Pack roots must not overlap the active packs root.", 500);
    }
  }
  for (let left = 0; left < roots.length; left += 1) {
    for (let right = left + 1; right < roots.length; right += 1) {
      if (pathsOverlap(roots[left]!, roots[right]!)) {
        throw new DraftPackError("draft_root.overlap", "Draft Context Pack roots must not overlap each other.", 500);
      }
    }
  }
}

function assertInsideRoot(root: string, target: string, message: string): void {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return;
  }
  throw new DraftPackError("path_escape", message, 400);
}

function pathsOverlap(left: string, right: string): boolean {
  const normalizedLeft = normalizePathForCompare(left);
  const normalizedRight = normalizePathForCompare(right);
  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.startsWith(`${normalizedRight}${path.sep}`) ||
    normalizedRight.startsWith(`${normalizedLeft}${path.sep}`)
  );
}

function normalizePathForCompare(value: string): string {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}
