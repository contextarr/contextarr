import fs from "node:fs";
import path from "node:path";
import type { ContextarrDatabase } from "../db";
import {
  ExposureReadinessError,
  getPackExposureReadiness,
  type PackExposureReadiness
} from "../exposure-readiness";
import { getPackHealth, getPackPath } from "../indexer";
import type { PackHealthDetail, ReviewItem, ServerConfig } from "../types";
import {
  readinessDimensionDefinitions,
  statusForIssueSeverities,
  type ReadinessDimensionId,
  type ReadinessStatus
} from "./dimensions";
import { readinessIssueCodes } from "./issue-codes";

export const READINESS_REPORT_SCHEMA_VERSION = "contextarr.readiness-report.v1";

export type ReadinessIssueSeverity = "blocker" | "warning";

export interface ReadinessIssue {
  code: string;
  severity: ReadinessIssueSeverity;
  message: string;
  evidence: Record<string, unknown>;
}

export interface ReadinessDimension {
  id: ReadinessDimensionId;
  label: string;
  status: ReadinessStatus;
  score: number;
  evidence: Record<string, unknown>;
}

export type ReadinessDimensions = Record<ReadinessDimensionId, ReadinessDimension>;

export interface ContextReadinessReport {
  schemaVersion: typeof READINESS_REPORT_SCHEMA_VERSION;
  packId: string;
  status: ReadinessStatus;
  score: number;
  dimensions: ReadinessDimensions;
  issues: ReadinessIssue[];
  generatedAt: string;
}

export class ReadinessReportError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ReadinessReportError";
  }
}

interface DimensionResult {
  dimension: ReadinessDimension;
  issues: ReadinessIssue[];
}

export function getPackReadinessReport(
  db: ContextarrDatabase,
  config: ServerConfig,
  packId: string,
  generatedAt = new Date().toISOString()
): ContextReadinessReport | undefined {
  const health = getPackHealth(db, packId);
  if (!health) {
    return undefined;
  }

  const exposure = getPackExposureReadiness(db, config, packId);
  if (!exposure) {
    return undefined;
  }

  const dimensionResults = [
    buildSourceDimension(exposure),
    buildReviewDimension(health),
    buildGovernanceDimension(db, config, packId),
    buildRedactionDimension(exposure),
    buildExportDimension(exposure),
    buildMcpDimension(exposure)
  ];
  const dimensions = Object.fromEntries(
    dimensionResults.map((result) => [result.dimension.id, result.dimension])
  ) as ReadinessDimensions;
  const issues = dimensionResults.flatMap((result) => result.issues);

  return {
    schemaVersion: READINESS_REPORT_SCHEMA_VERSION,
    packId,
    status: statusForIssueSeverities(issues.map((issue) => issue.severity)),
    score: weightedScore(dimensions),
    dimensions,
    issues,
    generatedAt
  };
}

function buildSourceDimension(exposure: PackExposureReadiness): DimensionResult {
  const issues: ReadinessIssue[] = [];
  const recordCount = exposure.summary.recordCount;
  const missingCoverage = exposure.summary.recordsMissingSourceCoverage;
  const sourceWarningRecords = exposure.records.filter((record) =>
    record.warnings.some((warning) => isSourceIssue(warning.code))
  ).length;
  const packSourceWarnings = exposure.warnings.filter((warning) => isSourceIssue(warning.code));

  if (missingCoverage > 0) {
    issues.push(
      issue(
        readinessIssueCodes.sourceCoverageIncomplete,
        "warning",
        "Some records are not source-backed.",
        {
          dimension: "source",
          recordCount,
          sourceBackedRecords: exposure.summary.sourceBackedRecords,
          recordsMissingSourceCoverage: missingCoverage
        }
      )
    );
  }

  if (sourceWarningRecords > 0 || packSourceWarnings.length > 0) {
    issues.push(
      issue(readinessIssueCodes.sourceWarnings, "warning", "Source freshness or license warnings need review.", {
        dimension: "source",
        warningRecordCount: sourceWarningRecords,
        packWarningCodes: packSourceWarnings.map((warning) => warning.code)
      })
    );
  }

  const coveragePenalty = recordCount > 0 ? Math.round((missingCoverage / recordCount) * 35) : 35;
  const warningPenalty = Math.min(25, sourceWarningRecords * 5 + packSourceWarnings.length * 5);
  return {
    dimension: dimension("source", clampScore(100 - coveragePenalty - warningPenalty), issues, {
      recordCount,
      sourceBackedRecords: exposure.summary.sourceBackedRecords,
      recordsMissingSourceCoverage: missingCoverage
    }),
    issues
  };
}

function buildReviewDimension(health: PackHealthDetail): DimensionResult {
  const issues = health.items
    .filter((item) => item.status !== "ignored" && item.status !== "resolved")
    .map((item) => reviewItemIssue(item));

  return {
    dimension: dimension("review", health.score, issues, {
      healthStatus: health.status,
      reviewQueueCount: health.reviewQueueCount,
      activeReviewItemCount: issues.length
    }),
    issues
  };
}

function buildGovernanceDimension(db: ContextarrDatabase, config: ServerConfig, packId: string): DimensionResult {
  const rulesFile = "rules/governance.yaml";
  const governancePath = resolveRulesFile(db, config, packId, rulesFile);
  const present = Boolean(governancePath && fs.existsSync(governancePath));
  const issues = present
    ? []
    : [
        issue(
          readinessIssueCodes.governanceMissing,
          "warning",
          "No explicit governance rules file is present for this Context Pack.",
          {
            dimension: "governance",
            rulesFile,
            present: false
          }
        )
      ];

  return {
    dimension: dimension("governance", present ? 100 : 80, issues, {
      rulesFile,
      present,
      evaluation: "presence_only"
    }),
    issues
  };
}

function buildRedactionDimension(exposure: PackExposureReadiness): DimensionResult {
  const packRedactionWarnings = exposure.warnings.filter((warning) => isRedactionIssue(warning.code));
  const recordRedactionWarnings = exposure.records.filter((record) =>
    record.warnings.some((warning) => isRedactionIssue(warning.code))
  ).length;
  const warningCount = packRedactionWarnings.length + recordRedactionWarnings;
  const issues =
    warningCount > 0
      ? [
          issue(readinessIssueCodes.redactionWarnings, "warning", "Redaction warnings should be reviewed before reuse.", {
            dimension: "redaction",
            packWarningCodes: packRedactionWarnings.map((warning) => warning.code),
            warningRecordCount: recordRedactionWarnings
          })
        ]
      : [];

  return {
    dimension: dimension("redaction", clampScore(100 - Math.min(50, warningCount * 10)), issues, {
      warningCount,
      policy: exposure.policies.export.defaultPrivacyMode
    }),
    issues
  };
}

function buildExportDimension(exposure: PackExposureReadiness): DimensionResult {
  const issues: ReadinessIssue[] = [];

  if (exposure.blockers.length > 0) {
    issues.push(
      issue(readinessIssueCodes.exportPackBlocked, "blocker", "Pack-level blockers prevent default export readiness.", {
        dimension: "export",
        blockerCodes: exposure.blockers.map((blocker) => blocker.code)
      })
    );
  }

  if (exposure.summary.exportProfileCount === 0) {
    issues.push(issue(readinessIssueCodes.exportNoProfiles, "blocker", "No export profiles are indexed for this pack.", {
      dimension: "export"
    }));
  }

  if (exposure.summary.exportEligibleProfiles === 0 && exposure.summary.exportProfileCount > 0) {
    issues.push(
      issue(readinessIssueCodes.exportNoEligibleProfiles, "blocker", "No export profiles are currently eligible.", {
        dimension: "export",
        exportProfileCount: exposure.summary.exportProfileCount
      })
    );
  }

  if (exposure.summary.blockedProfiles > 0) {
    issues.push(
      issue(readinessIssueCodes.exportProfileBlocked, "blocker", "One or more export profiles have readiness blockers.", {
        dimension: "export",
        blockedProfiles: exposure.summary.blockedProfiles,
        profileIds: exposure.exportProfiles.filter((profile) => profile.blockers.length > 0).map((profile) => profile.id)
      })
    );
  }

  if (exposure.summary.warningProfiles > 0) {
    issues.push(
      issue(readinessIssueCodes.exportProfileWarnings, "warning", "One or more export profiles have readiness warnings.", {
        dimension: "export",
        warningProfiles: exposure.summary.warningProfiles
      })
    );
  }

  if (exposure.summary.exportEligibleRecords === 0 && exposure.summary.recordCount > 0) {
    issues.push(
      issue(readinessIssueCodes.exportNoEligibleRecords, "blocker", "No records are eligible for default export.", {
        dimension: "export",
        recordCount: exposure.summary.recordCount
      })
    );
  } else if (exposure.summary.blockedRecords > 0) {
    issues.push(
      issue(readinessIssueCodes.exportRecordIneligible, "warning", "Some records are excluded from default export eligibility.", {
        dimension: "export",
        blockedRecords: exposure.summary.blockedRecords,
        exportEligibleRecords: exposure.summary.exportEligibleRecords,
        recordCount: exposure.summary.recordCount
      })
    );
  }

  return {
    dimension: dimension("export", exportScore(exposure.summary), issues, {
      exportProfileCount: exposure.summary.exportProfileCount,
      exportEligibleProfiles: exposure.summary.exportEligibleProfiles,
      exportEligibleRecords: exposure.summary.exportEligibleRecords,
      recordCount: exposure.summary.recordCount
    }),
    issues
  };
}

function buildMcpDimension(exposure: PackExposureReadiness): DimensionResult {
  const issues: ReadinessIssue[] = [];

  if (exposure.blockers.length > 0) {
    issues.push(
      issue(readinessIssueCodes.mcpPackBlocked, "blocker", "Pack-level blockers prevent MCP readiness.", {
        dimension: "mcp",
        blockerCodes: exposure.blockers.map((blocker) => blocker.code)
      })
    );
  }

  if (exposure.summary.mcpEligibleRecords === 0 && exposure.summary.recordCount > 0) {
    issues.push(
      issue(readinessIssueCodes.mcpNoEligibleRecords, "blocker", "No records are eligible for default read-only MCP exposure.", {
        dimension: "mcp",
        recordCount: exposure.summary.recordCount
      })
    );
  } else if (exposure.summary.blockedRecords > 0) {
    issues.push(
      issue(readinessIssueCodes.mcpRecordIneligible, "warning", "Some records are excluded from default read-only MCP exposure.", {
        dimension: "mcp",
        blockedRecords: exposure.summary.blockedRecords,
        mcpEligibleRecords: exposure.summary.mcpEligibleRecords,
        recordCount: exposure.summary.recordCount
      })
    );
  }

  if (exposure.summary.warningRecords > 0) {
    issues.push(
      issue(readinessIssueCodes.mcpRecordWarnings, "warning", "MCP-eligible records include review warnings.", {
        dimension: "mcp",
        warningRecords: exposure.summary.warningRecords
      })
    );
  }

  return {
    dimension: dimension("mcp", exposureScore(exposure.summary.mcpEligibleRecords, exposure.summary.recordCount), issues, {
      transport: exposure.policies.mcp.transport,
      defaultBodyPolicy: exposure.policies.mcp.defaultBodyPolicy,
      allowPrivateByDefault: exposure.policies.mcp.allowPrivateByDefault,
      mcpEligibleRecords: exposure.summary.mcpEligibleRecords,
      recordCount: exposure.summary.recordCount
    }),
    issues
  };
}

function dimension(
  id: ReadinessDimensionId,
  score: number,
  issues: ReadinessIssue[],
  evidence: Record<string, unknown>
): ReadinessDimension {
  const definition = readinessDimensionDefinitions.find((candidate) => candidate.id === id);
  if (!definition) {
    throw new ReadinessReportError("readiness.dimension_unknown", `Unknown readiness dimension: ${id}`, 500);
  }

  return {
    id,
    label: definition.label,
    status: statusForIssueSeverities(issues.map((issue) => issue.severity)),
    score: clampScore(score),
    evidence
  };
}

function reviewItemIssue(item: ReviewItem): ReadinessIssue {
  return issue(
    readinessIssueCodes.reviewItem,
    item.severity === "error" ? "blocker" : "warning",
    item.message,
    {
      dimension: "review",
      itemId: item.id,
      type: item.type,
      status: item.status,
      severity: item.severity,
      recordId: item.recordId,
      sourceId: item.sourceId
    }
  );
}

function issue(
  code: string,
  severity: ReadinessIssueSeverity,
  message: string,
  evidence: Record<string, unknown>
): ReadinessIssue {
  return { code, severity, message, evidence };
}

function resolveRulesFile(
  db: ContextarrDatabase,
  config: ServerConfig,
  packId: string,
  relativeRulesFile: string
): string | undefined {
  const packPath = getPackPath(db, packId);
  if (!packPath) {
    return undefined;
  }

  const activeRoot = path.resolve(config.packsDir);
  const resolvedPackPath = path.resolve(packPath);
  assertInsideRoot(activeRoot, resolvedPackPath, "Pack path escaped the active Context Pack root.");
  return path.join(resolvedPackPath, relativeRulesFile);
}

function weightedScore(dimensions: ReadinessDimensions): number {
  const totalWeight = readinessDimensionDefinitions.reduce((sum, definition) => sum + definition.weight, 0);
  const weightedTotal = readinessDimensionDefinitions.reduce(
    (sum, definition) => sum + dimensions[definition.id].score * definition.weight,
    0
  );
  return clampScore(Math.round(weightedTotal / totalWeight));
}

function exposureScore(eligible: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return clampScore(Math.round((eligible / total) * 100));
}

function exportScore(summary: PackExposureReadiness["summary"]): number {
  if (summary.exportProfileCount === 0 || summary.recordCount === 0) {
    return 0;
  }

  return clampScore(
    Math.round(
      (exposureScore(summary.exportEligibleProfiles, summary.exportProfileCount) +
        exposureScore(summary.exportEligibleRecords, summary.recordCount)) /
        2
    )
  );
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function isSourceIssue(code: string): boolean {
  return (
    code.includes("source") ||
    code.includes("license") ||
    code === "pack.validation_warnings"
  );
}

function isRedactionIssue(code: string): boolean {
  return code.includes("redaction");
}

function assertInsideRoot(root: string, target: string, message: string): void {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return;
  }
  throw new ExposureReadinessError("path_escape", message, 400);
}
