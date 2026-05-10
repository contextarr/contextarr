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
export type ReviewCandidateActivationPlanStatus = "ready" | "blocked";
export type ReviewCandidateActivationCheckStatus = "pass" | "warning" | "error";

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

export interface ReviewCandidateActivationCheck {
  id: string;
  label: string;
  status: ReviewCandidateActivationCheckStatus;
  message: string;
}

export interface ReviewCandidateActivationBlocker {
  code: string;
  message: string;
}

export interface ReviewCandidateActivationWarning {
  code: string;
  message: string;
}

export interface ReviewCandidateActivationPlan {
  schemaVersion: "contextarr.review-candidate-activation-plan.v1";
  candidateKey: string;
  packId: string | null;
  name: string;
  status: ReviewCandidateActivationPlanStatus;
  canActivate: boolean;
  source: {
    kind: ReviewCandidateSourceKind;
    label: string;
    pathLabel: string;
  };
  target: {
    activePacksRootLabel: string;
    packId: string | null;
    pathLabel: string | null;
    activeConflict: boolean;
  };
  checks: ReviewCandidateActivationCheck[];
  blockers: ReviewCandidateActivationBlocker[];
  warnings: ReviewCandidateActivationWarning[];
  nextSteps: string[];
  boundaries: string[];
}

export interface ReviewCandidateActivationDryRun {
  schemaVersion: "contextarr.review-candidate-activation-dry-run.v1";
  generatedAt: string;
  proofId: string;
  candidateKey: string;
  packId: string | null;
  name: string;
  status: ReviewCandidateActivationPlanStatus;
  canActivate: boolean;
  source: ReviewCandidateActivationPlan["source"];
  target: ReviewCandidateActivationPlan["target"];
  validation: ReviewCandidateSummary["validation"];
  security: ReviewCandidateSummary["security"];
  blockers: ReviewCandidateActivationBlocker[];
  warnings: ReviewCandidateActivationWarning[];
  manualActions: string[];
  effects: {
    filesMoved: false;
    sqliteMutated: false;
    exportsGenerated: false;
    mcpExposed: false;
    networkAccessed: false;
  };
  boundaries: string[];
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

export function getReviewCandidateActivationPlan(
  options: ReviewCandidateOptions & { key: string; activePacksRoot?: string }
): ReviewCandidateActivationPlan | undefined {
  const candidate = getReviewCandidate(options);
  if (!candidate) {
    return undefined;
  }

  const displayRoot = path.resolve(options.displayRoot ?? process.cwd());
  const activePacksRootLabel = displayPath(path.resolve(options.activePacksRoot ?? "demo-packs"), displayRoot);
  const targetPathLabel = candidate.packId ? normalizePath(`${activePacksRootLabel}/${candidate.packId}`) : null;
  const blockers = activationBlockers(candidate);
  const warnings = activationWarnings(candidate);
  const canActivate = candidate.status === "ready_for_review" && blockers.length === 0;

  return {
    schemaVersion: "contextarr.review-candidate-activation-plan.v1",
    candidateKey: candidate.key,
    packId: candidate.packId,
    name: candidate.name,
    status: canActivate ? "ready" : "blocked",
    canActivate,
    source: {
      kind: candidate.sourceKind,
      label: candidate.sourceLabel,
      pathLabel: candidate.pathLabel
    },
    target: {
      activePacksRootLabel,
      packId: candidate.packId,
      pathLabel: targetPathLabel,
      activeConflict: candidate.activeConflict
    },
    checks: activationChecks(candidate),
    blockers,
    warnings,
    nextSteps: activationNextSteps(candidate, canActivate, targetPathLabel),
    boundaries: [
      "Read-only plan only; no files have been moved or copied.",
      "No SQLite index mutation has run.",
      "No export, MCP exposure, registry publish, or network action has run.",
      "No record bodies are returned in this plan."
    ]
  };
}

export function dryRunReviewCandidateActivation(
  options: ReviewCandidateOptions & { key: string; activePacksRoot?: string; now?: Date }
): ReviewCandidateActivationDryRun | undefined {
  const candidate = getReviewCandidate(options);
  if (!candidate) {
    return undefined;
  }

  const displayRoot = path.resolve(options.displayRoot ?? process.cwd());
  const activePacksRootLabel = displayPath(path.resolve(options.activePacksRoot ?? "demo-packs"), displayRoot);
  const targetPathLabel = candidate.packId ? normalizePath(`${activePacksRootLabel}/${candidate.packId}`) : null;
  const blockers = activationBlockers(candidate);
  const warnings = activationWarnings(candidate);
  const canActivate = candidate.status === "ready_for_review" && blockers.length === 0;
  const generatedAt = (options.now ?? new Date()).toISOString();
  const source = {
    kind: candidate.sourceKind,
    label: candidate.sourceLabel,
    pathLabel: candidate.pathLabel
  };
  const target = {
    activePacksRootLabel,
    packId: candidate.packId,
    pathLabel: targetPathLabel,
    activeConflict: candidate.activeConflict
  };
  const proofId = activationProofId({
    candidateKey: candidate.key,
    packId: candidate.packId,
    sourcePathLabel: source.pathLabel,
    targetPathLabel,
    validationStatus: candidate.validation.status,
    validationErrors: candidate.validation.errors,
    validationWarnings: candidate.validation.warnings,
    securityStatus: candidate.security.status,
    securityRecommendedAction: candidate.security.recommendedAction,
    securityBlocking: candidate.security.blocking,
    activeConflict: candidate.activeConflict,
    blockerCodes: blockers.map((blocker) => blocker.code),
    warningCodes: warnings.map((warning) => warning.code)
  });

  return {
    schemaVersion: "contextarr.review-candidate-activation-dry-run.v1",
    generatedAt,
    proofId,
    candidateKey: candidate.key,
    packId: candidate.packId,
    name: candidate.name,
    status: canActivate ? "ready" : "blocked",
    canActivate,
    source,
    target,
    validation: candidate.validation,
    security: candidate.security,
    blockers,
    warnings,
    manualActions: activationNextSteps(candidate, canActivate, targetPathLabel),
    effects: {
      filesMoved: false,
      sqliteMutated: false,
      exportsGenerated: false,
      mcpExposed: false,
      networkAccessed: false
    },
    boundaries: [
      "Dry-run only; no candidate files were moved, copied, or deleted.",
      "Dry-run only; no SQLite index rows were inserted, updated, or deleted.",
      "Dry-run only; no export content was generated and no MCP visibility changed.",
      "Dry-run only; no network access occurred."
    ]
  };
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

function activationBlockers(candidate: ReviewCandidateDetail): ReviewCandidateActivationBlocker[] {
  const blockers: ReviewCandidateActivationBlocker[] = [];

  if (!candidate.packId) {
    blockers.push({
      code: "candidate.missing_pack_id",
      message: "Candidate does not expose a valid Context Pack ID."
    });
  }

  if (candidate.status === "invalid") {
    blockers.push({
      code: "candidate.invalid",
      message: "Validation errors must be fixed before the candidate can join the active pack root."
    });
  }

  if (candidate.status === "blocked") {
    blockers.push({
      code: "candidate.blocked",
      message: "Blocking security findings must be remediated before the candidate can join the active pack root."
    });
  }

  if (candidate.status === "duplicate_active_id" || candidate.activeConflict) {
    blockers.push({
      code: "candidate.duplicate_active_id",
      message: "An active Context Pack already uses this pack ID."
    });
  }

  if (candidate.counts.records === 0) {
    blockers.push({
      code: "candidate.no_records",
      message: "Candidate has no readable record metadata."
    });
  }

  if (candidate.counts.sources === 0) {
    blockers.push({
      code: "candidate.no_sources",
      message: "Candidate has no readable source map entries."
    });
  }

  if (candidate.counts.exportProfiles === 0) {
    blockers.push({
      code: "candidate.no_export_profiles",
      message: "Candidate has no readable export profiles."
    });
  }

  return blockers;
}

function activationWarnings(candidate: ReviewCandidateDetail): ReviewCandidateActivationWarning[] {
  const warnings: ReviewCandidateActivationWarning[] = [];

  if (candidate.validation.warnings > 0) {
    warnings.push({
      code: "candidate.validation_warnings",
      message: `${candidate.validation.warnings} validation warning(s) should be reviewed before relying on this candidate.`
    });
  }

  if (!candidate.security.blocking && candidate.security.findingCount > 0) {
    warnings.push({
      code: "candidate.security_findings",
      message: `${candidate.security.findingCount} non-blocking scanner finding(s) should be reviewed.`
    });
  }

  if (!candidate.security.blocking && candidate.security.recommendedAction === "quarantine") {
    warnings.push({
      code: "candidate.security_review_recommended",
      message: "The scanner recommends manual review before this candidate is used."
    });
  }

  if (candidate.sourceKind === "restored_quarantine") {
    warnings.push({
      code: "candidate.restored_quarantine",
      message: "Candidate came from restored quarantine and needs extra provenance review."
    });
  }

  return warnings;
}

function activationChecks(candidate: ReviewCandidateDetail): ReviewCandidateActivationCheck[] {
  return [
    {
      id: "validation",
      label: "Validation",
      status: candidate.status === "invalid" || candidate.validation.errors > 0 ? "error" : candidate.validation.warnings > 0 ? "warning" : "pass",
      message:
        candidate.validation.errors > 0
          ? `${candidate.validation.errors} validation error(s) reported.`
          : candidate.validation.warnings > 0
            ? `${candidate.validation.warnings} validation warning(s) reported.`
            : "Manifest, records, sources, and export profile metadata validate."
    },
    {
      id: "security",
      label: "Security Scan",
      status: candidate.security.blocking ? "error" : candidate.security.findingCount > 0 || candidate.security.recommendedAction === "quarantine" ? "warning" : "pass",
      message: candidate.security.blocking
        ? "Scanner reported blocking findings."
        : candidate.security.findingCount > 0
          ? `${candidate.security.findingCount} scanner finding(s) require review.`
          : candidate.security.recommendedAction === "quarantine"
            ? "Scanner recommends manual review before use."
          : "Scanner did not report findings."
    },
    {
      id: "active-conflict",
      label: "Active ID Conflict",
      status: candidate.activeConflict ? "error" : "pass",
      message: candidate.activeConflict ? "Pack ID already exists in the active index." : "Pack ID is not currently indexed as active."
    },
    {
      id: "candidate-contents",
      label: "Candidate Contents",
      status:
        candidate.counts.records === 0 || candidate.counts.sources === 0 || candidate.counts.exportProfiles === 0 ? "error" : "pass",
      message: `${candidate.counts.records} record(s), ${candidate.counts.sources} source(s), and ${candidate.counts.exportProfiles} export profile(s) found.`
    },
    {
      id: "write-boundary",
      label: "Write Boundary",
      status: "pass",
      message: "This plan does not move files, update SQLite, export content, or expose MCP records."
    }
  ];
}

function activationNextSteps(candidate: ReviewCandidateDetail, canActivate: boolean, targetPathLabel: string | null): string[] {
  if (!canActivate) {
    return [
      "Resolve every blocker listed in this plan.",
      "Refresh Draft Intake after the candidate files are corrected.",
      "Move the reviewed folder into the active packs root only after this plan reports ready."
    ];
  }

  return [
    "Inspect the candidate records, sources, export profiles, validation issues, and scanner findings.",
    `Move or copy the reviewed folder into ${targetPathLabel ?? "the active packs root"}.`,
    "Run contextarr rescan --format json.",
    "Check Pack Health and Exposure Readiness before export or MCP exposure."
  ];
}

function activationProofId(value: Record<string, unknown>): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 24);
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
