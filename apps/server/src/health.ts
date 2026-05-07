import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { ExportProfile } from "@contextarr/schema";
import type { ValidationIssue } from "@contextarr/pack-validator";
import type {
  HealthCheck,
  LoadedPack,
  LoadedRecord,
  ReviewItem,
  ReviewItemSeverity,
  ReviewItemStatus,
  ReviewItemType,
  SkippedPack
} from "./types";

export interface ReviewItemCandidate {
  fingerprint: string;
  type: ReviewItemType;
  severity: ReviewItemSeverity;
  packId: string;
  recordId: string | null;
  sourceId: string | null;
  message: string;
  suggestedAction: string;
  metadata: Record<string, unknown>;
}

export interface HealthScore {
  score: number;
  status: "healthy" | "degraded" | "needs_review";
  reviewQueueCount: number;
}

const healthCheckLabels: Record<ReviewItemType, string> = {
  validation: "Validation",
  freshness: "Freshness",
  export_safety: "Export Safety",
  review_status: "Review Status",
  trust: "Trust",
  source_coverage: "Source Coverage"
};

const defaultRedactTags = new Set(["secret", "never_export", "sensitive", "private"]);
const sensitivePrivacyValues = new Set(["private", "sensitive", "secret"]);

export function createReviewItemId(fingerprint: string): string {
  return `ri_${crypto.createHash("sha256").update(fingerprint).digest("hex").slice(0, 24)}`;
}

export function generatePackReviewItems(pack: LoadedPack, now = new Date()): ReviewItemCandidate[] {
  const items: ReviewItemCandidate[] = [];
  const freshnessRules = readFreshnessRules(pack);
  const redactionTags = readRedactionTags(pack);

  for (const issue of pack.validation.issues) {
    items.push(validationIssueToCandidate(pack.manifest.id, issue));
  }

  if (pack.manifest.trustLevel === "deprecated" || pack.manifest.trustLevel === "blocked") {
    const severity = pack.manifest.trustLevel === "blocked" ? "error" : "warning";
    items.push(
      candidate({
        type: "trust",
        severity,
        packId: pack.manifest.id,
        message: `Pack trust level is ${pack.manifest.trustLevel}.`,
        suggestedAction: "Review the pack trust level before relying on it.",
        parts: [pack.manifest.id, pack.manifest.trustLevel],
        metadata: { trustLevel: pack.manifest.trustLevel }
      })
    );
  }

  for (const record of pack.records) {
    items.push(...reviewRecordFreshness(pack, record, freshnessRules, now));
    items.push(...reviewRecordStatus(pack, record));
    items.push(...reviewSourceCoverage(pack, record));
  }

  items.push(...reviewExportSafety(pack, redactionTags));

  return items;
}

export function generateSkippedPackReviewItems(skipped: SkippedPack): ReviewItemCandidate[] {
  const packId = skipped.packId ?? path.basename(skipped.packPath);

  return skipped.issues.map((issue) => validationIssueToCandidate(packId, issue));
}

export function calculateHealthScore(items: Array<Pick<ReviewItem, "severity" | "status">>): HealthScore {
  const active = items.filter((item) => item.status !== "ignored" && item.status !== "resolved");
  const errors = active.filter((item) => item.severity === "error").length;
  const warnings = active.filter((item) => item.severity === "warning").length;
  const infos = active.filter((item) => item.severity === "info").length;
  const score = Math.max(0, 100 - errors * 25 - warnings * 10 - infos * 2);

  return {
    score,
    status: score >= 90 ? "healthy" : score >= 70 ? "degraded" : "needs_review",
    reviewQueueCount: items.filter((item) => item.status === "open").length
  };
}

export function buildHealthChecks(items: Array<Pick<ReviewItem, "type" | "severity" | "status">>): HealthCheck[] {
  const active = items.filter((item) => item.status !== "ignored" && item.status !== "resolved");

  return (Object.keys(healthCheckLabels) as ReviewItemType[]).map((type) => {
    const typedItems = active.filter((item) => item.type === type);
    const hasError = typedItems.some((item) => item.severity === "error");
    const hasWarning = typedItems.some((item) => item.severity === "warning");

    return {
      id: type,
      label: healthCheckLabels[type],
      status: hasError ? "error" : hasWarning ? "warning" : "pass",
      count: typedItems.length
    };
  });
}

function validationIssueToCandidate(packId: string, issue: ValidationIssue): ReviewItemCandidate {
  return candidate({
    type: "validation",
    severity: issue.severity,
    packId,
    message: issue.message,
    suggestedAction: "Fix the validation issue in the source pack before activation.",
    parts: [packId, issue.code, issue.file ?? "", issue.path ?? ""],
    metadata: { code: issue.code, file: issue.file, path: issue.path }
  });
}

function reviewRecordFreshness(
  pack: LoadedPack,
  record: LoadedRecord,
  rules: Record<string, number>,
  now: Date
): ReviewItemCandidate[] {
  const lastReviewed = record.metadata.last_reviewed;

  if (!lastReviewed) {
    return [
      candidate({
        type: "freshness",
        severity: "warning",
        packId: pack.manifest.id,
        recordId: record.metadata.id,
        message: `Record "${record.metadata.title}" is missing a last reviewed date.`,
        suggestedAction: "Review the record and add last_reviewed metadata.",
        parts: [pack.manifest.id, record.metadata.id, "missing-last-reviewed"]
      })
    ];
  }

  const staleAfterDays = rules[record.metadata.type] ?? rules.default ?? 90;
  const ageDays = daysBetween(lastReviewed, now);
  if (ageDays <= staleAfterDays) {
    return [];
  }

  return [
    candidate({
      type: "freshness",
      severity: "warning",
      packId: pack.manifest.id,
      recordId: record.metadata.id,
      message: `Record "${record.metadata.title}" was reviewed ${ageDays} days ago.`,
      suggestedAction: `Review this record because its freshness window is ${staleAfterDays} days.`,
      parts: [pack.manifest.id, record.metadata.id, "stale-review"],
      metadata: { ageDays, staleAfterDays, lastReviewed }
    })
  ];
}

function reviewRecordStatus(pack: LoadedPack, record: LoadedRecord): ReviewItemCandidate[] {
  if (record.metadata.review_status === "approved") {
    return [];
  }

  return [
    candidate({
      type: "review_status",
      severity: record.metadata.review_status === "rejected" ? "error" : "warning",
      packId: pack.manifest.id,
      recordId: record.metadata.id,
      message: `Record "${record.metadata.title}" is ${record.metadata.review_status}.`,
      suggestedAction: "Review and approve the record before it is used in trusted exports.",
      parts: [pack.manifest.id, record.metadata.id, record.metadata.review_status],
      metadata: { reviewStatus: record.metadata.review_status }
    })
  ];
}

function reviewSourceCoverage(pack: LoadedPack, record: LoadedRecord): ReviewItemCandidate[] {
  if (record.metadata.sources.length > 0 && record.metadata.source_status !== "unsourced") {
    return [];
  }

  return [
    candidate({
      type: "source_coverage",
      severity: "warning",
      packId: pack.manifest.id,
      recordId: record.metadata.id,
      message: `Record "${record.metadata.title}" has weak source coverage.`,
      suggestedAction: "Attach at least one source or mark the source status clearly before reuse.",
      parts: [pack.manifest.id, record.metadata.id, "weak-source-coverage"],
      metadata: { sourceStatus: record.metadata.source_status, sources: record.metadata.sources }
    })
  ];
}

function reviewExportSafety(pack: LoadedPack, redactionTags: Set<string>): ReviewItemCandidate[] {
  const recordsById = new Map(pack.records.map((record) => [record.metadata.id, record]));
  const items: ReviewItemCandidate[] = [];

  for (const profile of pack.exportProfiles) {
    for (const record of includedRecords(profile, pack.records, recordsById)) {
      const riskyValues = riskValuesForRecord(record, redactionTags);
      if (riskyValues.length === 0) {
        continue;
      }

      const exclusions = new Set(profile.exclude_tags ?? []);
      const hasMatchingExclusion = riskyValues.some((value) => exclusions.has(value));
      if (hasMatchingExclusion) {
        continue;
      }

      items.push(
        candidate({
          type: "export_safety",
          severity: record.metadata.privacy === "secret" ? "error" : "warning",
          packId: pack.manifest.id,
          recordId: record.metadata.id,
          message: `Export profile "${profile.name}" includes sensitive record "${record.metadata.title}".`,
          suggestedAction: "Add a matching exclusion tag or remove the record from this profile.",
          parts: [pack.manifest.id, profile.id, record.metadata.id, "sensitive-export"],
          metadata: { profileId: profile.id, riskyValues }
        })
      );
    }
  }

  return items;
}

function includedRecords(
  profile: ExportProfile,
  records: LoadedRecord[],
  recordsById: Map<string, LoadedRecord>
): LoadedRecord[] {
  const includeIds = profile.include?.records;
  if (!includeIds || includeIds.length === 0) {
    return records;
  }

  return includeIds.map((id) => recordsById.get(id)).filter((record): record is LoadedRecord => Boolean(record));
}

function riskValuesForRecord(record: LoadedRecord, redactionTags: Set<string>): string[] {
  const values = new Set<string>();

  if (sensitivePrivacyValues.has(record.metadata.privacy)) {
    values.add(record.metadata.privacy);
  }

  for (const tag of record.metadata.tags) {
    if (redactionTags.has(tag)) {
      values.add(tag);
    }
  }

  return [...values];
}

function readFreshnessRules(pack: LoadedPack): Record<string, number> {
  const file = path.join(pack.packPath, pack.manifest.rulesPath, "freshness.yaml");
  if (!fs.existsSync(file)) {
    return { default: 90 };
  }

  try {
    const parsed = YAML.parse(fs.readFileSync(file, "utf8")) as { stale_after_days?: Record<string, number> };
    return parsed.stale_after_days ?? { default: 90 };
  } catch {
    return { default: 90 };
  }
}

function readRedactionTags(pack: LoadedPack): Set<string> {
  const tags = new Set(defaultRedactTags);
  const file = path.join(pack.packPath, pack.manifest.rulesPath, "redaction.yaml");
  if (!fs.existsSync(file)) {
    return tags;
  }

  try {
    const parsed = YAML.parse(fs.readFileSync(file, "utf8")) as { redact_tags?: string[] };
    for (const tag of parsed.redact_tags ?? []) {
      tags.add(tag);
    }
  } catch {
    return tags;
  }

  return tags;
}

function daysBetween(localDate: string, now: Date): number {
  const reviewedAt = new Date(`${localDate}T00:00:00.000Z`).getTime();
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.floor((nowUtc - reviewedAt) / 86_400_000));
}

function candidate(options: {
  type: ReviewItemType;
  severity: ReviewItemSeverity;
  packId: string;
  recordId?: string;
  sourceId?: string;
  message: string;
  suggestedAction: string;
  parts: string[];
  metadata?: Record<string, unknown>;
}): ReviewItemCandidate {
  const fingerprint = options.parts.join("|");

  return {
    fingerprint,
    type: options.type,
    severity: options.severity,
    packId: options.packId,
    recordId: options.recordId ?? null,
    sourceId: options.sourceId ?? null,
    message: options.message,
    suggestedAction: options.suggestedAction,
    metadata: options.metadata ?? {}
  };
}
