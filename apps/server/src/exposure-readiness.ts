import path from "node:path";
import { validatePack, type ValidationResult } from "@contextarr/pack-validator";
import { scanArtifact, type SecurityScannerReportV1 } from "@contextarr/security-scanner";
import type { ContextarrDatabase } from "./db";
import { getPack, getPackPath, getPackRecords } from "./indexer";
import type { ServerConfig } from "./types";

export type ExposureIssueSeverity = "blocker" | "warning";

export interface ExposureIssue {
  code: string;
  severity: ExposureIssueSeverity;
  message: string;
}

export interface ExposureRecordReadiness {
  id: string;
  packId: string;
  title: string;
  type: string;
  privacy: string;
  reviewStatus: string;
  freshness: string;
  sourceStatus: string;
  tags: string[];
  exportEligible: boolean;
  mcpEligible: boolean;
  blockers: ExposureIssue[];
  warnings: ExposureIssue[];
}

export interface ExposureProfileReadiness {
  id: string;
  name: string;
  target: string;
  format: string;
  privacyMode: string | null;
  tokenBudget: number | null;
  status: string;
  exportEligible: boolean;
  blockers: ExposureIssue[];
  warnings: ExposureIssue[];
}

export interface PackExposureReadiness {
  packId: string;
  packName: string;
  policies: {
    export: {
      defaultPrivacyMode: "redacted";
      recordPolicy: string;
    };
    mcp: {
      transport: "stdio";
      defaultBodyPolicy: string;
      allowPrivateByDefault: false;
    };
  };
  validation: {
    valid: boolean;
    status: ValidationResult["validationStatus"];
    errors: number;
    warnings: number;
  };
  security: {
    status: SecurityScannerReportV1["status"];
    recommendedAction: SecurityScannerReportV1["recommendedAction"];
    blocked: boolean;
  };
  summary: {
    recordCount: number;
    exportEligibleRecords: number;
    mcpEligibleRecords: number;
    blockedRecords: number;
    warningRecords: number;
    sourceBackedRecords: number;
    recordsMissingSourceCoverage: number;
    exportProfileCount: number;
    exportEligibleProfiles: number;
    blockedProfiles: number;
    warningProfiles: number;
  };
  exportProfiles: ExposureProfileReadiness[];
  records: ExposureRecordReadiness[];
  blockers: ExposureIssue[];
  warnings: ExposureIssue[];
}

interface IndexedPack {
  id: string;
  name: string;
  exportProfiles?: IndexedExportProfile[];
  exportReadiness?: {
    profiles?: IndexedExportReadinessProfile[];
  };
}

interface IndexedExportProfile {
  id: string;
  name: string;
  target: string;
  format: string;
  privacyMode?: string | null;
  tokenBudget?: number | null;
}

interface IndexedExportReadinessProfile extends IndexedExportProfile {
  status?: string;
  warningIssueCodes?: string[];
  blockingIssueCodes?: string[];
}

interface IndexedRecord {
  id: string;
  packId: string;
  title: string;
  type: string;
  privacy: string;
  reviewStatus: string;
  freshness: string;
  sourceStatus: string;
  tags: string[];
  redactionWarningCount?: number;
  staleSourceCount?: number;
  licenseWarningCount?: number;
  licenseMissingCount?: number;
  licenseUnknownCount?: number;
  licenseRiskCount?: number;
}

export class ExposureReadinessError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ExposureReadinessError";
  }
}

export function getPackExposureReadiness(
  db: ContextarrDatabase,
  config: ServerConfig,
  packId: string
): PackExposureReadiness | undefined {
  const pack = getPack(db, packId) as IndexedPack | undefined;
  const packPath = resolveActivePackPath(db, config, packId);
  if (!pack || !packPath) {
    return undefined;
  }

  const validation = validatePackSafely(packPath);
  const security = scanPackSafely(packPath, packId);
  const packBlockers = getPackBlockers(validation, security);
  const packWarnings = getPackWarnings(validation, security);
  const packBlocked = packBlockers.length > 0;

  const records = (getPackRecords(db, packId) as IndexedRecord[]).map((record) =>
    toRecordReadiness(record, packBlocked ? packBlockers : [])
  );
  const exportProfiles = toProfileReadiness(pack, packBlocked ? packBlockers : []);
  const blockedRecords = records.filter((record) => record.blockers.length > 0).length;
  const warningRecords = records.filter((record) => record.warnings.length > 0).length;
  const blockedProfiles = exportProfiles.filter((profile) => profile.blockers.length > 0).length;
  const warningProfiles = exportProfiles.filter((profile) => profile.warnings.length > 0).length;
  const sourceBackedRecords = records.filter((record) => isSourceBacked(record.sourceStatus)).length;

  return {
    packId: pack.id,
    packName: pack.name,
    policies: {
      export: {
        defaultPrivacyMode: "redacted",
        recordPolicy: "approved public_safe records without secret, never_export, or imported_draft tags"
      },
      mcp: {
        transport: "stdio",
        defaultBodyPolicy: "approved public_safe records only; secret bodies are never returned",
        allowPrivateByDefault: false
      }
    },
    validation: {
      valid: validation.valid,
      status: validation.validationStatus,
      errors: validation.summary.errors,
      warnings: validation.summary.warnings
    },
    security: {
      status: security.status,
      recommendedAction: security.recommendedAction,
      blocked: isBlockingSecurityScan(security)
    },
    summary: {
      recordCount: records.length,
      exportEligibleRecords: records.filter((record) => record.exportEligible).length,
      mcpEligibleRecords: records.filter((record) => record.mcpEligible).length,
      blockedRecords,
      warningRecords,
      sourceBackedRecords,
      recordsMissingSourceCoverage: records.length - sourceBackedRecords,
      exportProfileCount: exportProfiles.length,
      exportEligibleProfiles: exportProfiles.filter((profile) => profile.exportEligible).length,
      blockedProfiles,
      warningProfiles
    },
    exportProfiles,
    records,
    blockers: packBlockers,
    warnings: packWarnings
  };
}

function resolveActivePackPath(db: ContextarrDatabase, config: ServerConfig, packId: string): string | undefined {
  const packPath = getPackPath(db, packId);
  if (!packPath) {
    return undefined;
  }

  const activeRoot = path.resolve(config.packsDir);
  const resolvedPackPath = path.resolve(packPath);
  assertInsideRoot(activeRoot, resolvedPackPath, "Pack path escaped the active Context Pack root.");
  return resolvedPackPath;
}

function validatePackSafely(packPath: string): ValidationResult {
  try {
    return validatePack(packPath);
  } catch {
    throw new ExposureReadinessError(
      "pack.validation_failed",
      "Unable to validate this Context Pack for exposure readiness.",
      400
    );
  }
}

function scanPackSafely(packPath: string, packId: string): SecurityScannerReportV1 {
  try {
    return scanArtifact({
      path: packPath,
      artifactId: packId,
      artifactType: "context_pack",
      sourceTrust: "local"
    });
  } catch {
    throw new ExposureReadinessError(
      "pack.scanning_failed",
      "Unable to scan this Context Pack for exposure readiness.",
      400
    );
  }
}

function toRecordReadiness(record: IndexedRecord, packBlockers: ExposureIssue[]): ExposureRecordReadiness {
  const blockers = [...packBlockers];
  const warnings: ExposureIssue[] = [];
  const tags = record.tags ?? [];

  if (record.reviewStatus !== "approved") {
    blockers.push(issue("record.review_status", "blocker", `Record review status is ${record.reviewStatus}.`));
  }
  if (record.privacy === "secret") {
    blockers.push(issue("record.privacy.secret", "blocker", "Secret records are never eligible for default export or MCP exposure."));
  } else if (record.privacy !== "public_safe") {
    blockers.push(
      issue("record.privacy.not_public_safe", "blocker", `Default export and MCP exposure require public_safe privacy; got ${record.privacy}.`)
    );
  }

  for (const tag of ["secret", "never_export", "imported_draft"]) {
    if (tags.includes(tag)) {
      blockers.push(issue(`record.tag.${tag}`, "blocker", `Record carries the ${tag} exclusion tag.`));
    }
  }

  if ((record.redactionWarningCount ?? 0) > 0) {
    warnings.push(issue("record.redaction_warnings", "warning", `${record.redactionWarningCount} redaction warning(s) should be reviewed before exposure.`));
  }
  if ((record.staleSourceCount ?? 0) > 0 || record.freshness === "stale") {
    warnings.push(issue("record.source_stale", "warning", "One or more sources are stale or the record freshness is stale."));
  }
  if ((record.licenseWarningCount ?? 0) > 0) {
    warnings.push(issue("record.license_warnings", "warning", `${record.licenseWarningCount} source license warning(s) should be reviewed before exposure.`));
  }
  if (!isSourceBacked(record.sourceStatus)) {
    warnings.push(issue("record.source_status", "warning", `Record source status is ${record.sourceStatus}.`));
  }

  const eligible = blockers.length === 0;
  return {
    id: record.id,
    packId: record.packId,
    title: record.title,
    type: record.type,
    privacy: record.privacy,
    reviewStatus: record.reviewStatus,
    freshness: record.freshness,
    sourceStatus: record.sourceStatus,
    tags,
    exportEligible: eligible,
    mcpEligible: eligible,
    blockers: uniqueIssues(blockers),
    warnings: uniqueIssues(warnings)
  };
}

function toProfileReadiness(pack: IndexedPack, packBlockers: ExposureIssue[]): ExposureProfileReadiness[] {
  const readinessById = new Map((pack.exportReadiness?.profiles ?? []).map((profile) => [profile.id, profile]));

  return (pack.exportProfiles ?? []).map((profile) => {
    const readiness = readinessById.get(profile.id);
    const status = readiness?.status ?? "ready";
    const blockers = [
      ...packBlockers,
      ...((readiness?.blockingIssueCodes ?? []).map((code) =>
        issue(`profile.${code}`, "blocker", `Export profile readiness blocker: ${code}.`)
      ))
    ];
    const warnings = (readiness?.warningIssueCodes ?? []).map((code) =>
      issue(`profile.${code}`, "warning", `Export profile readiness warning: ${code}.`)
    );

    if (status === "blocked" && blockers.length === 0) {
      blockers.push(issue("profile.blocked", "blocker", "Export profile readiness status is blocked."));
    }
    if (status === "ready_with_warnings" && warnings.length === 0) {
      warnings.push(issue("profile.warning_status", "warning", "Export profile readiness status has warnings."));
    }

    return {
      id: profile.id,
      name: profile.name,
      target: profile.target,
      format: profile.format,
      privacyMode: profile.privacyMode ?? null,
      tokenBudget: profile.tokenBudget ?? null,
      status,
      exportEligible: blockers.length === 0,
      blockers: uniqueIssues(blockers),
      warnings: uniqueIssues(warnings)
    };
  });
}

function getPackBlockers(validation: ValidationResult, security: SecurityScannerReportV1): ExposureIssue[] {
  const blockers: ExposureIssue[] = [];
  if (validation.summary.errors > 0) {
    blockers.push(issue("pack.validation_errors", "blocker", "Validation errors block export and MCP eligibility."));
  }
  if (isBlockingSecurityScan(security)) {
    blockers.push(issue("pack.security_blocked", "blocker", "Security scanner findings block export and MCP eligibility."));
  }
  return blockers;
}

function getPackWarnings(validation: ValidationResult, security: SecurityScannerReportV1): ExposureIssue[] {
  const warnings: ExposureIssue[] = [];
  if (validation.summary.warnings > 0) {
    warnings.push(issue("pack.validation_warnings", "warning", `${validation.summary.warnings} validation warning(s) should be reviewed before exposure.`));
  }
  if (validation.summary.redactionHits > 0) {
    warnings.push(issue("pack.redaction_hits", "warning", `${validation.summary.redactionHits} redaction warning hit(s) were found.`));
  }
  if (validation.summary.staleSources > 0) {
    warnings.push(issue("pack.stale_sources", "warning", `${validation.summary.staleSources} stale source(s) were found.`));
  }
  if (validation.summary.licenseWarnings > 0) {
    warnings.push(issue("pack.license_warnings", "warning", `${validation.summary.licenseWarnings} source license warning(s) were found.`));
  }
  if (security.recommendedAction === "review" || security.recommendedAction === "quarantine") {
    warnings.push(issue("pack.security_review", "warning", `Security scanner recommends ${security.recommendedAction}.`));
  }
  return warnings;
}

function isSourceBacked(status: string): boolean {
  return status === "source_backed" || status === "verified";
}

function isBlockingSecurityScan(scan: SecurityScannerReportV1): boolean {
  return (
    scan.recommendedAction === "block" ||
    scan.status === "blocked" ||
    scan.status === "critical_findings" ||
    scan.status === "scanning_failed" ||
    scan.findings.some((finding) => finding.blocking)
  );
}

function issue(code: string, severity: ExposureIssueSeverity, message: string): ExposureIssue {
  return { code, severity, message };
}

function uniqueIssues(issues: ExposureIssue[]): ExposureIssue[] {
  const seen = new Set<string>();
  const deduped: ExposureIssue[] = [];
  for (const item of issues) {
    const key = `${item.code}:${item.severity}:${item.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }
  return deduped;
}

function assertInsideRoot(root: string, target: string, message: string): void {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return;
  }
  throw new ExposureReadinessError("path_escape", message, 400);
}
