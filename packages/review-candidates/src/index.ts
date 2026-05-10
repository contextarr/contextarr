import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import {
  contextPackManifestSchema,
  exportProfileSchema,
  recordFrontmatterSchema,
  sourceMapSchema,
  type ContextPackManifest,
  type ExportProfile,
  type RecordFrontmatter,
  type Source
} from "@contextarr/schema";
import { validatePack, type ValidationIssue, type ValidationResult } from "@contextarr/pack-validator";
import {
  scanArtifact,
  type SecurityFindingCategory,
  type SecurityFindingSeverity,
  type SecurityRecommendedAction,
  type SecurityScannerReportV1,
  type SecurityScannerStatus,
  type SecurityScannerSummary
} from "@contextarr/security-scanner";

export type ReviewCandidateSourceKind = "draft_pack" | "composed_pack" | "imported_pack" | "restored_quarantine" | "unknown";
export type ReviewCandidateStatus = "ready_for_review" | "invalid" | "blocked" | "duplicate_active_id";

export interface ReviewCandidateRoot {
  rootPath: string;
  sourceKind: ReviewCandidateSourceKind;
  label?: string;
}

export interface ReviewCandidateOptions {
  roots: ReviewCandidateRoot[];
  activePackIds?: Iterable<string>;
  displayRoot?: string;
}

export interface ReviewCandidateSkippedRoot {
  sourceKind: ReviewCandidateSourceKind;
  rootLabel: string;
  reason: "missing" | "not_directory" | "unreadable";
  message: string;
}

export interface ReviewCandidateSummary {
  key: string;
  sourceKind: ReviewCandidateSourceKind;
  sourceLabel: string;
  pathLabel: string;
  packId: string | null;
  name: string;
  version: string | null;
  status: ReviewCandidateStatus;
  recommendedAction: string;
  activeConflict: boolean;
  validation: {
    status: ValidationResult["validationStatus"] | "unreadable";
    errors: number;
    warnings: number;
    infos: number;
    issueCount: number;
  };
  security: {
    status: SecurityScannerStatus | "unreadable";
    recommendedAction: SecurityRecommendedAction | "review";
    blocking: boolean;
    summary: SecurityScannerSummary | null;
    findingCount: number;
  };
  counts: {
    records: number;
    sources: number;
    exportProfiles: number;
  };
}

export interface ReviewCandidateDetail extends ReviewCandidateSummary {
  validationIssues: SanitizedValidationIssue[];
  securityFindings: SanitizedSecurityFinding[];
  records: ReviewCandidateRecordSummary[];
  sources: ReviewCandidateSourceSummary[];
  exportProfiles: ReviewCandidateExportProfileSummary[];
}

export interface ReviewCandidateListResult {
  candidates: ReviewCandidateSummary[];
  skippedRoots: ReviewCandidateSkippedRoot[];
  counts: {
    total: number;
    readyForReview: number;
    invalid: number;
    blocked: number;
    duplicateActiveId: number;
    skippedRoots: number;
  };
}

export interface SanitizedValidationIssue {
  severity: ValidationIssue["severity"];
  code: string;
  message: string;
  file?: string;
  path?: string;
}

export interface SanitizedSecurityFinding {
  id: string;
  code: string;
  severity: SecurityFindingSeverity;
  category: SecurityFindingCategory;
  file: string;
  line?: number;
  message: string;
  recommendedAction: SecurityRecommendedAction;
  blocking: boolean;
}

export interface ReviewCandidateRecordSummary {
  id: string;
  title: string;
  type: string;
  privacy: string;
  reviewStatus: string;
  sourceStatus: string;
  tags: string[];
  sources: string[];
  file: string;
}

export interface ReviewCandidateSourceSummary {
  id: string;
  type: string;
  title: string;
  url?: string | null;
  path?: string | null;
  trust?: string | null;
  status?: string | null;
  licenseStatus?: string | null;
}

export interface ReviewCandidateExportProfileSummary {
  id: string;
  name: string;
  target: string;
  format: string;
  privacyMode?: string | null;
}

interface CandidateInspection {
  summary: ReviewCandidateSummary;
  detail: ReviewCandidateDetail;
}

export function listReviewCandidates(options: ReviewCandidateOptions): ReviewCandidateListResult {
  const activePackIds = new Set(options.activePackIds ?? []);
  const displayRoot = path.resolve(options.displayRoot ?? process.cwd());
  const skippedRoots: ReviewCandidateSkippedRoot[] = [];
  const candidates: ReviewCandidateSummary[] = [];
  const seenPaths = new Set<string>();

  for (const root of options.roots) {
    const resolvedRoot = path.resolve(root.rootPath);
    const rootLabel = root.label ?? displayPath(resolvedRoot, displayRoot);
    const rootStatus = readableDirectoryStatus(resolvedRoot);

    if (rootStatus !== "ok") {
      skippedRoots.push({
        sourceKind: root.sourceKind,
        rootLabel,
        reason: rootStatus,
        message:
          rootStatus === "missing"
            ? `Review candidate root is missing: ${rootLabel}`
            : `Review candidate root is not a readable directory: ${rootLabel}`
      });
      continue;
    }

    for (const candidatePath of discoverCandidatePaths(resolvedRoot)) {
      const realPath = safeRealpath(candidatePath);
      const pathKey = normalizeForCompare(realPath);
      if (seenPaths.has(pathKey)) {
        continue;
      }
      seenPaths.add(pathKey);
      candidates.push(inspectCandidate(candidatePath, root.sourceKind, rootLabel, activePackIds, displayRoot).summary);
    }
  }

  candidates.sort((left, right) => `${left.status}:${left.packId ?? ""}:${left.pathLabel}`.localeCompare(`${right.status}:${right.packId ?? ""}:${right.pathLabel}`));

  return {
    candidates,
    skippedRoots,
    counts: {
      total: candidates.length,
      readyForReview: candidates.filter((candidate) => candidate.status === "ready_for_review").length,
      invalid: candidates.filter((candidate) => candidate.status === "invalid").length,
      blocked: candidates.filter((candidate) => candidate.status === "blocked").length,
      duplicateActiveId: candidates.filter((candidate) => candidate.status === "duplicate_active_id").length,
      skippedRoots: skippedRoots.length
    }
  };
}

export function getReviewCandidate(options: ReviewCandidateOptions & { key: string }): ReviewCandidateDetail | undefined {
  const activePackIds = new Set(options.activePackIds ?? []);
  const displayRoot = path.resolve(options.displayRoot ?? process.cwd());
  const seenPaths = new Set<string>();

  for (const root of options.roots) {
    const resolvedRoot = path.resolve(root.rootPath);
    const rootStatus = readableDirectoryStatus(resolvedRoot);
    if (rootStatus !== "ok") {
      continue;
    }

    const rootLabel = root.label ?? displayPath(resolvedRoot, displayRoot);
    for (const candidatePath of discoverCandidatePaths(resolvedRoot)) {
      const realPath = safeRealpath(candidatePath);
      const pathKey = normalizeForCompare(realPath);
      if (seenPaths.has(pathKey)) {
        continue;
      }
      seenPaths.add(pathKey);

      const candidate = inspectCandidate(candidatePath, root.sourceKind, rootLabel, activePackIds, displayRoot);
      if (candidate.summary.key === options.key) {
        return candidate.detail;
      }
    }
  }

  return undefined;
}

function discoverCandidatePaths(rootPath: string): string[] {
  if (fs.existsSync(path.join(rootPath, "contextarr-pack.json"))) {
    return [rootPath];
  }

  return fs
    .readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootPath, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function inspectCandidate(
  candidatePath: string,
  sourceKind: ReviewCandidateSourceKind,
  sourceLabel: string,
  activePackIds: Set<string>,
  displayRoot: string
): CandidateInspection {
  const resolvedPath = path.resolve(candidatePath);
  const pathLabel = displayPath(resolvedPath, displayRoot);
  const key = candidateKey(sourceKind, resolvedPath);
  const manifest = readManifest(resolvedPath);
  const validation = runValidation(resolvedPath, displayRoot);
  const security = runSecurityScan(resolvedPath, manifest, displayRoot);
  const packId = manifest?.id ?? validation.result?.packId ?? null;
  const activeConflict = Boolean(packId && activePackIds.has(packId));
  const status = candidateStatus(validation, security, activeConflict);
  const records = manifest ? readRecords(resolvedPath, manifest) : [];
  const sources = manifest ? readSources(resolvedPath, manifest, displayRoot) : [];
  const exportProfiles = manifest ? readExportProfiles(resolvedPath, manifest) : [];

  const summary: ReviewCandidateSummary = {
    key,
    sourceKind,
    sourceLabel,
    pathLabel,
    packId,
    name: manifest?.name ?? packId ?? path.basename(resolvedPath),
    version: manifest?.version ?? null,
    status,
    recommendedAction: recommendedActionForStatus(status, security.report?.recommendedAction ?? "review"),
    activeConflict,
    validation: {
      status: validation.result?.validationStatus ?? "unreadable",
      errors: validation.result?.summary.errors ?? validation.issues.filter((issue) => issue.severity === "error").length,
      warnings: validation.result?.summary.warnings ?? validation.issues.filter((issue) => issue.severity === "warning").length,
      infos: validation.result?.summary.infos ?? validation.issues.filter((issue) => issue.severity === "info").length,
      issueCount: validation.issues.length
    },
    security: {
      status: security.report?.status ?? "unreadable",
      recommendedAction: security.report?.recommendedAction ?? "review",
      blocking: isBlockingSecurityReport(security.report),
      summary: security.report?.summary ?? null,
      findingCount: security.report?.findings.length ?? 0
    },
    counts: {
      records: records.length,
      sources: sources.length,
      exportProfiles: exportProfiles.length
    }
  };

  return {
    summary,
    detail: {
      ...summary,
      validationIssues: security.issue ? [...validation.issues, security.issue] : validation.issues,
      securityFindings: (security.report?.findings ?? []).map((finding) => ({
        id: finding.id,
        code: finding.code,
        severity: finding.severity,
        category: finding.category,
        file: sanitizeOptionalPath(finding.file, displayRoot) ?? "",
        line: finding.line,
        message: sanitizeMessage(finding.message, displayRoot),
        recommendedAction: finding.recommendedAction,
        blocking: finding.blocking
      })),
      records,
      sources,
      exportProfiles
    }
  };
}

function runValidation(packPath: string, displayRoot: string): { result?: ValidationResult; issues: SanitizedValidationIssue[] } {
  try {
    const result = validatePack(packPath);
    return {
      result,
      issues: result.issues.map((issue) => ({
        severity: issue.severity,
        code: issue.code,
        message: sanitizeMessage(issue.message, displayRoot),
        file: sanitizeOptionalPath(issue.file, displayRoot) ?? undefined,
        path: sanitizeOptionalPath(issue.path, displayRoot) ?? undefined
      }))
    };
  } catch (error) {
    return {
      issues: [
        {
          severity: "error",
          code: "candidate.unreadable",
          message: sanitizeMessage(error instanceof Error ? error.message : String(error), displayRoot)
        }
      ]
    };
  }
}

function runSecurityScan(
  packPath: string,
  manifest: ContextPackManifest | undefined,
  displayRoot: string
): { report?: SecurityScannerReportV1; issue?: SanitizedValidationIssue } {
  try {
    return {
      report: scanArtifact({
        path: packPath,
        artifactId: manifest?.id,
        artifactType: "context_pack",
        artifactVersion: manifest?.version,
        sourceTrust: "imported"
      })
    };
  } catch (error) {
    return {
      issue: {
        severity: "error",
        code: "candidate.security_scan_failed",
        message: sanitizeMessage(error instanceof Error ? error.message : String(error), displayRoot)
      }
    };
  }
}

function candidateStatus(
  validation: { result?: ValidationResult; issues: SanitizedValidationIssue[] },
  security: { report?: SecurityScannerReportV1; issue?: SanitizedValidationIssue },
  activeConflict: boolean
): ReviewCandidateStatus {
  if (isBlockingSecurityReport(security.report) || security.issue) {
    return "blocked";
  }

  if (!validation.result?.valid || validation.issues.some((issue) => issue.severity === "error")) {
    return "invalid";
  }

  if (activeConflict) {
    return "duplicate_active_id";
  }

  return "ready_for_review";
}

function recommendedActionForStatus(status: ReviewCandidateStatus, scannerAction: SecurityRecommendedAction | "review"): string {
  if (status === "blocked") {
    return "Block until security findings are remediated.";
  }
  if (status === "invalid") {
    return "Fix validation issues before review or activation.";
  }
  if (status === "duplicate_active_id") {
    return "Resolve the active Pack ID conflict before review.";
  }
  if (scannerAction === "quarantine") {
    return "Review manually before activation, export, or MCP exposure.";
  }
  return "Ready for human review; remains inactive until a future reviewed workflow exists.";
}

function isBlockingSecurityReport(report: SecurityScannerReportV1 | undefined): boolean {
  return report?.status === "blocked" || report?.status === "critical_findings" || report?.status === "scanning_failed";
}

function readManifest(packPath: string): ContextPackManifest | undefined {
  try {
    const manifestPath = path.join(packPath, "contextarr-pack.json");
    if (!fs.existsSync(manifestPath)) {
      return undefined;
    }
    return contextPackManifestSchema.parse(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
  } catch {
    return undefined;
  }
}

function readRecords(packPath: string, manifest: ContextPackManifest): ReviewCandidateRecordSummary[] {
  const recordsDir = path.join(packPath, manifest.recordsPath);
  if (!fs.existsSync(recordsDir) || !fs.statSync(recordsDir).isDirectory()) {
    return [];
  }

  return listFiles(recordsDir)
    .filter((file) => file.toLowerCase().endsWith(".md"))
    .flatMap((file) => {
      try {
        const parsed = matter(fs.readFileSync(file, "utf8"));
        const record = recordFrontmatterSchema.parse(parsed.data);
        return [summarizeRecord(record, normalizePath(path.relative(packPath, file)))];
      } catch {
        return [];
      }
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

function summarizeRecord(record: RecordFrontmatter, file: string): ReviewCandidateRecordSummary {
  return {
    id: record.id,
    title: record.title,
    type: record.type,
    privacy: record.privacy,
    reviewStatus: record.review_status,
    sourceStatus: record.source_status,
    tags: record.tags ?? [],
    sources: record.sources ?? [],
    file
  };
}

function readSources(packPath: string, manifest: ContextPackManifest, displayRoot: string): ReviewCandidateSourceSummary[] {
  try {
    const sourceMap = sourceMapSchema.parse(YAML.parse(fs.readFileSync(path.join(packPath, manifest.sourcesPath), "utf8")));
    return sourceMap.sources.map((source) => summarizeSource(source, displayRoot)).sort((left, right) => left.id.localeCompare(right.id));
  } catch {
    return [];
  }
}

function summarizeSource(source: Source, displayRoot: string): ReviewCandidateSourceSummary {
  return {
    id: source.id,
    type: source.type,
    title: source.title,
    url: source.url ?? null,
    path: sanitizeOptionalPath(source.path, displayRoot),
    trust: source.trust ?? null,
    status: source.status ?? null,
    licenseStatus: source.license_status ?? null
  };
}

function readExportProfiles(packPath: string, manifest: ContextPackManifest): ReviewCandidateExportProfileSummary[] {
  const exportsDir = path.join(packPath, manifest.exportsPath);
  if (!fs.existsSync(exportsDir) || !fs.statSync(exportsDir).isDirectory()) {
    return [];
  }

  return listFiles(exportsDir)
    .filter((file) => [".yaml", ".yml"].includes(path.extname(file).toLowerCase()))
    .flatMap((file) => {
      try {
        return [summarizeExportProfile(exportProfileSchema.parse(YAML.parse(fs.readFileSync(file, "utf8"))))];
      } catch {
        return [];
      }
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

function summarizeExportProfile(profile: ExportProfile): ReviewCandidateExportProfileSummary {
  return {
    id: profile.id,
    name: profile.name,
    target: profile.target,
    format: profile.format,
    privacyMode: profile.privacy_mode ?? null
  };
}

function listFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

function readableDirectoryStatus(value: string): "ok" | ReviewCandidateSkippedRoot["reason"] {
  try {
    if (!fs.existsSync(value)) {
      return "missing";
    }
    if (!fs.statSync(value).isDirectory()) {
      return "not_directory";
    }
    fs.accessSync(value, fs.constants.R_OK);
    return "ok";
  } catch {
    return "unreadable";
  }
}

function candidateKey(sourceKind: ReviewCandidateSourceKind, candidatePath: string): string {
  return crypto.createHash("sha256").update(`${sourceKind}\0${path.resolve(candidatePath)}`).digest("hex").slice(0, 16);
}

function safeRealpath(value: string): string {
  try {
    return fs.realpathSync.native(value);
  } catch {
    return path.resolve(value);
  }
}

function displayPath(value: string, displayRoot: string): string {
  const resolved = path.resolve(value);
  const relative = path.relative(displayRoot, resolved);
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return normalizePath(relative);
  }
  return path.basename(resolved);
}

function sanitizeMessage(message: string, displayRoot: string): string {
  const root = path.resolve(displayRoot);
  const variants = [root, root.replace(/\\/g, "/")];
  let sanitized = message;
  for (const variant of variants) {
    sanitized = sanitized.split(variant).join(".");
  }
  return sanitized.replace(/[A-Za-z]:[\\/][^\s"']+/g, (match) => displayPath(match, displayRoot)).replace(/\\/g, "/");
}

function sanitizeOptionalPath(value: string | undefined | null, displayRoot: string): string | null {
  if (!value) {
    return null;
  }
  if (path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value) || value.startsWith("\\\\")) {
    return displayPath(value, displayRoot);
  }
  return normalizePath(value);
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function normalizeForCompare(value: string): string {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}
