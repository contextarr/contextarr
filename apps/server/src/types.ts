import type { ExportProfile, Source } from "@contextarr/schema";
import type { ContextPackManifest, RecordFrontmatter } from "@contextarr/schema";
import type { ValidationIssue, ValidationResult } from "@contextarr/pack-validator";

export interface ServerConfig {
  host: string;
  port: number;
  packsDir: string;
  databasePath: string;
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
  skipped: SkippedPack[];
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
  lastReviewedAt: string | null;
  updatedAt: string;
}
