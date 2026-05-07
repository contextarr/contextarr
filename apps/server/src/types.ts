import type { ExportProfile, Source } from "@contextarr/schema";
import type { ContextPackManifest, RecordFrontmatter } from "@contextarr/schema";
import type { ValidationIssue, ValidationResult } from "@contextarr/pack-validator";

export interface ServerConfig {
  host: string;
  port: number;
  packsDir: string;
  databasePath: string;
  apiToken?: string;
}

export interface LoadedRecord {
  file: string;
  metadata: RecordFrontmatter;
  body: string;
}

export interface LoadedPack {
  packPath: string;
  manifest: ContextPackManifest;
  validation: ValidationResult;
  records: LoadedRecord[];
  sources: Source[];
  exportProfiles: ExportProfile[];
}

export interface SkippedPack {
  packPath: string;
  packId?: string;
  issues: ValidationIssue[];
}

export interface LoadPacksResult {
  packs: LoadedPack[];
  skipped: SkippedPack[];
}

export interface RebuildIndexResult {
  indexedAt: string;
  packsIndexed: number;
  packsSkipped: number;
  recordsIndexed: number;
  sourcesIndexed: number;
  exportProfilesIndexed: number;
  reviewItemsGenerated: number;
  skipped: SkippedPack[];
}

export type ReviewItemSeverity = "error" | "warning" | "info";
export type ReviewItemStatus = "open" | "ignored" | "accepted" | "reviewed" | "resolved";
export type ReviewItemType =
  | "validation"
  | "freshness"
  | "export_safety"
  | "review_status"
  | "trust"
  | "source_coverage";

export interface ReviewItem {
  id: string;
  fingerprint: string;
  type: ReviewItemType;
  severity: ReviewItemSeverity;
  packId: string;
  recordId: string | null;
  sourceId: string | null;
  message: string;
  suggestedAction: string;
  status: ReviewItemStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface ReviewItemFilters {
  status?: ReviewItemStatus;
  severity?: ReviewItemSeverity;
  type?: ReviewItemType;
  packId?: string;
}

export interface HealthCheck {
  id: ReviewItemType;
  label: string;
  status: "pass" | "warning" | "error";
  count: number;
}

export interface PackHealthDetail {
  packId: string;
  score: number;
  status: string;
  reviewQueueCount: number;
  checks: HealthCheck[];
  items: ReviewItem[];
}

export interface PackSummary {
  id: string;
  name: string;
  version: string;
  description: string;
  type: string;
  visibility: string;
  trustLevel: string;
  healthScore: number;
  healthStatus: string;
  validationErrors: number;
  validationWarnings: number;
  recordCount: number;
  sourceCount: number;
  exportProfileCount: number;
  accentColor?: string;
  coverImage: string | null;
  reviewQueueCount: number;
  lastReviewedAt: string | null;
  updatedAt: string;
}
