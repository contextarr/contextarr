import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import { contextPackManifestSchema, recordFrontmatterSchema, type ContextPackManifest, type RecordFrontmatter } from "@contextarr/schema";
import { validatePack, type ValidationResult } from "@contextarr/pack-validator";
import { scanArtifact, type SecurityScannerReportV1 } from "@contextarr/security-scanner";
import type { ContextarrDatabase } from "./db";
import { getPackPath, getRecord, rebuildIndex } from "./indexer";
import { getAgentKitIndexDirs, getSkillIndexDirs } from "./config";
import type { RebuildIndexResult, ServerConfig } from "./types";

export const recordReviewPromotionStatuses = ["approved", "needs_review", "rejected"] as const;
export type RecordReviewPromotionStatus = (typeof recordReviewPromotionStatuses)[number];

export interface RecordReviewCandidate {
  id: string;
  packId: string;
  title: string;
  currentStatus: string;
  privacy: string;
  tags: string[];
  lastReviewed: string | null;
  filePath: string;
  contentHash: string;
  promotion: {
    canPromote: boolean;
    blockingReasons: string[];
    warnings: string[];
    exportReadyAfterApproval: boolean;
    mcpReadyAfterApproval: boolean;
  };
}

export interface PackReviewStatus {
  packId: string;
  validation: {
    valid: boolean;
    errors: number;
    warnings: number;
  };
  security: {
    status: SecurityScannerReportV1["status"];
    recommendedAction: SecurityScannerReportV1["recommendedAction"];
    blocked: boolean;
  };
  records: RecordReviewCandidate[];
}

export interface PromoteRecordReviewStatusRequest {
  reviewStatus: RecordReviewPromotionStatus;
  expectedHash: string;
  reviewedAt?: string;
}

export interface PromoteRecordReviewStatusResult {
  ok: true;
  packId: string;
  recordId: string;
  previousStatus: string;
  reviewStatus: RecordReviewPromotionStatus;
  lastReviewed: string;
  contentHash: string;
  exportReady: boolean;
  mcpReady: boolean;
  warnings: string[];
  record: unknown;
  rescan: Pick<RebuildIndexResult, "packsIndexed" | "packsSkipped" | "recordsIndexed" | "reviewItemsGenerated">;
}

interface RecordFileCandidate {
  filePath: string;
  relativeFilePath: string;
  parsed: matter.GrayMatterFile<string>;
  metadata: RecordFrontmatter;
  contentHash: string;
}

export class RecordReviewError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "RecordReviewError";
  }
}

export function getPackReviewStatus(
  db: ContextarrDatabase,
  config: ServerConfig,
  packId: string
): PackReviewStatus | undefined {
  const packPath = resolveActivePackPath(db, config, packId);
  if (!packPath) {
    return undefined;
  }

  const manifest = readManifest(packPath);
  const validation = validatePackSafely(packPath);
  const security = scanPackSafely(packPath, packId);
  const blocked = isBlockingSecurityScan(security);
  const commonBlockingReasons = commonPromotionBlockingReasons(validation, security);

  return {
    packId,
    validation: {
      valid: validation.valid,
      errors: validation.summary.errors,
      warnings: validation.summary.warnings
    },
    security: {
      status: security.status,
      recommendedAction: security.recommendedAction,
      blocked
    },
    records: listRecordFiles(packPath, manifest).map((record) =>
      toRecordReviewCandidate(packId, record, commonBlockingReasons, validation.summary.warnings, security)
    )
  };
}

export function promoteRecordReviewStatus(
  db: ContextarrDatabase,
  config: ServerConfig,
  packId: string,
  recordId: string,
  request: PromoteRecordReviewStatusRequest
): PromoteRecordReviewStatusResult {
  const packPath = resolveActivePackPath(db, config, packId);
  if (!packPath) {
    throw new RecordReviewError("pack.not_found", `Pack not found: ${packId}`, 404);
  }

  const manifest = readManifest(packPath);
  const validation = validatePackSafely(packPath);
  const security = scanPackSafely(packPath, packId);
  const blockingReasons = commonPromotionBlockingReasons(validation, security);
  if (blockingReasons.length > 0) {
    throw new RecordReviewError("review.promotion_blocked", "Record review status promotion failed safety gates.", 400, {
      blockingReasons
    });
  }

  const record = findRecordFile(packPath, manifest, recordId);
  if (!record) {
    throw new RecordReviewError("record.not_found", `Record not found: ${recordId}`, 404);
  }

  if (record.contentHash !== request.expectedHash) {
    throw new RecordReviewError("record.hash_mismatch", "Record content changed since it was reviewed.", 409, {
      expectedHash: request.expectedHash,
      actualHash: record.contentHash
    });
  }

  const reviewedAt = request.reviewedAt ?? new Date().toISOString().slice(0, 10);
  const previousStatus = record.metadata.review_status;
  const updatedMetadata: RecordFrontmatter = {
    ...record.metadata,
    review_status: request.reviewStatus,
    last_reviewed: reviewedAt
  };
  const originalText = fs.readFileSync(record.filePath, "utf8");
  const updatedText = writeMarkdownRecord(updatedMetadata, record.parsed.content);

  fs.writeFileSync(record.filePath, updatedText, "utf8");
  try {
    const postValidation = validatePackSafely(packPath);
    const postSecurity = scanPackSafely(packPath, packId);
    const postBlockingReasons = commonPromotionBlockingReasons(postValidation, postSecurity);
    if (postBlockingReasons.length > 0) {
      throw new RecordReviewError("review.post_write_invalid", "Updated record failed validation or scanner gates.", 400, {
        blockingReasons: postBlockingReasons
      });
    }
  } catch (error) {
    fs.writeFileSync(record.filePath, originalText, "utf8");
    throw error;
  }

  const rescan = rebuildIndex(db, config.packsDir, getSkillIndexDirs(config), getAgentKitIndexDirs(config));
  const updatedRecord = getRecord(db, recordId);
  const contentHash = hashText(updatedText);
  const updatedCandidate = toRecordReviewCandidate(
    packId,
    {
      ...record,
      metadata: updatedMetadata,
      parsed: matter(updatedText),
      contentHash
    },
    [],
    0,
    scanPackSafely(packPath, packId)
  );

  return {
    ok: true,
    packId,
    recordId,
    previousStatus,
    reviewStatus: request.reviewStatus,
    lastReviewed: reviewedAt,
    contentHash,
    exportReady: request.reviewStatus === "approved" && updatedCandidate.promotion.exportReadyAfterApproval,
    mcpReady: request.reviewStatus === "approved" && updatedCandidate.promotion.mcpReadyAfterApproval,
    warnings: updatedCandidate.promotion.warnings,
    record: updatedRecord ?? null,
    rescan: {
      packsIndexed: rescan.packsIndexed,
      packsSkipped: rescan.packsSkipped,
      recordsIndexed: rescan.recordsIndexed,
      reviewItemsGenerated: rescan.reviewItemsGenerated
    }
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

function readManifest(packPath: string): ContextPackManifest {
  const manifestPath = path.join(packPath, "contextarr-pack.json");
  const manifest = contextPackManifestSchema.safeParse(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
  if (!manifest.success) {
    throw new RecordReviewError("pack.manifest_invalid", "Pack manifest is invalid.", 400);
  }
  return manifest.data;
}

function validatePackSafely(packPath: string): ValidationResult {
  try {
    return validatePack(packPath);
  } catch (error) {
    throw new RecordReviewError("pack.validation_failed", error instanceof Error ? error.message : String(error), 400);
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
  } catch (error) {
    throw new RecordReviewError("pack.scanning_failed", error instanceof Error ? error.message : String(error), 400);
  }
}

function commonPromotionBlockingReasons(validation: ValidationResult, security: SecurityScannerReportV1): string[] {
  const reasons: string[] = [];
  if (validation.summary.errors > 0) {
    reasons.push("Validation errors must be fixed before review status promotion.");
  }
  if (isBlockingSecurityScan(security)) {
    reasons.push("Security scanner findings block review status promotion.");
  }
  return reasons;
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

function listRecordFiles(packPath: string, manifest: ContextPackManifest): RecordFileCandidate[] {
  const recordsDir = path.join(packPath, manifest.recordsPath);
  assertInsideRoot(packPath, recordsDir, "Records path escaped the active Context Pack root.");
  if (!fs.existsSync(recordsDir) || !fs.statSync(recordsDir).isDirectory()) {
    return [];
  }

  return listFiles(recordsDir)
    .filter((filePath) => filePath.toLowerCase().endsWith(".md"))
    .flatMap((filePath) => {
      const record = readRecordFile(packPath, filePath);
      return record ? [record] : [];
    })
    .sort((left, right) => left.metadata.title.localeCompare(right.metadata.title));
}

function findRecordFile(packPath: string, manifest: ContextPackManifest, recordId: string): RecordFileCandidate | undefined {
  return listRecordFiles(packPath, manifest).find((record) => record.metadata.id === recordId);
}

function readRecordFile(packPath: string, filePath: string): RecordFileCandidate | undefined {
  assertInsideRoot(packPath, filePath, "Record path escaped the active Context Pack root.");
  const text = fs.readFileSync(filePath, "utf8");
  const parsed = matter(text);
  const metadata = recordFrontmatterSchema.safeParse(parsed.data);
  if (!metadata.success) {
    return undefined;
  }

  return {
    filePath,
    relativeFilePath: normalizePath(path.relative(packPath, filePath)),
    parsed,
    metadata: metadata.data,
    contentHash: hashText(text)
  };
}

function toRecordReviewCandidate(
  packId: string,
  record: RecordFileCandidate,
  commonBlockingReasons: string[],
  validationWarnings: number,
  security: SecurityScannerReportV1
): RecordReviewCandidate {
  const warnings: string[] = [];
  const tags = record.metadata.tags;
  const blockedByTags = tags.some((tag) => ["never_export", "imported_draft"].includes(tag));
  const mcpReadyAfterApproval = record.metadata.privacy === "public_safe" && !tags.includes("secret");
  const exportReadyAfterApproval = mcpReadyAfterApproval && !blockedByTags;

  if (validationWarnings > 0) {
    warnings.push("Validation warnings remain and should be reviewed before relying on this record.");
  }
  if (security.recommendedAction === "review" || security.recommendedAction === "quarantine") {
    warnings.push("The security scanner recommends human review before relying on this pack.");
  }
  if (blockedByTags) {
    warnings.push("Draft-blocking tags remain; export profiles should continue to exclude this record.");
  }
  if (record.metadata.privacy !== "public_safe") {
    warnings.push("The record is not public_safe; default MCP and public-safe exports should not include its body.");
  }

  return {
    id: record.metadata.id,
    packId,
    title: record.metadata.title,
    currentStatus: record.metadata.review_status,
    privacy: record.metadata.privacy,
    tags,
    lastReviewed: record.metadata.last_reviewed ?? null,
    filePath: record.relativeFilePath,
    contentHash: record.contentHash,
    promotion: {
      canPromote: commonBlockingReasons.length === 0,
      blockingReasons: commonBlockingReasons,
      warnings,
      exportReadyAfterApproval,
      mcpReadyAfterApproval
    }
  };
}

function writeMarkdownRecord(metadata: RecordFrontmatter, body: string): string {
  return `---\n${YAML.stringify(metadata)}---\n\n${body.trim()}\n`;
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
  return files;
}

function hashText(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function assertInsideRoot(root: string, target: string, message: string): void {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return;
  }
  throw new RecordReviewError("path_escape", message, 400);
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}
