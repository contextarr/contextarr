export interface HealthResponse {
  status: string;
  authRequired: boolean;
  lastIndexedAt: string | null;
  counts: {
    packs: number;
    records: number;
    sources: number;
    exportProfiles: number;
    skills: number;
    skillInstructions: number;
    skillExamples: number;
    skillSources: number;
    skillExportProfiles: number;
    reviewItems: number;
    openReviewItems: number;
  };
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
  accentColor?: string | null;
  coverImage: string | null;
  reviewQueueCount: number;
  lastReviewedAt: string | null;
  updatedAt: string;
}

export interface SkillSummary {
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
  instructionCount: number;
  exampleCount: number;
  sourceCount: number;
  exportProfileCount: number;
  accentColor?: string | null;
  coverImage: string | null;
  reviewQueueCount: number;
  lastReviewedAt: string | null;
  updatedAt: string;
  targets: string[];
  inputs: string[];
  outputs: string[];
}

export interface SourceSummary {
  id: string;
  type: string;
  title: string;
  url?: string | null;
  path?: string | null;
  retrievedAt?: string | null;
  license?: string | null;
  trust?: string | null;
  status?: string | null;
}

export interface ExportProfileSummary {
  id: string;
  name: string;
  target: string;
  format: string;
  privacyMode?: string | null;
  tokenBudget?: number | null;
}

export interface ExportRecordSummary {
  id: string;
  title: string;
  type: string;
  privacy: string;
  tags: string[];
  sources: string[];
}

export interface ExcludedExportRecord extends ExportRecordSummary {
  reason: string;
}

export interface ExportSourceSummary {
  id: string;
  title: string;
  type: string;
  url?: string;
  path?: string;
  trust?: string;
  status?: string;
}

export interface ExportWarning {
  code: string;
  message: string;
  recordId?: string;
  pattern?: string;
}

export interface ExportArtifact {
  packId: string;
  packName: string;
  profileId: string;
  profileName: string;
  target: string;
  format: string;
  filename: string;
  mimeType: string;
  content: string;
  includedRecords: ExportRecordSummary[];
  excludedRecords: ExcludedExportRecord[];
  sources: ExportSourceSummary[];
  warnings: ExportWarning[];
  generatedAt: string;
  byteLength: number;
  estimatedTokens: number;
}

export interface ComposeSelection {
  packId: string;
  recordIds: string[];
}

export interface ComposePreviewRequest {
  title?: string;
  target: "chatgpt" | "claude" | "codex" | "markdown" | "json_records";
  format: "markdown" | "json";
  privacyMode?: "redacted" | "public_safe";
  selections: ComposeSelection[];
  excludeTags?: string[];
  tokenBudget?: number;
}

export interface PackDetail extends PackSummary {
  author: string;
  license: string;
  createdAt: string;
  packPath: string;
  manifest: Record<string, unknown>;
  counts: {
    records: number;
    sources: number;
    exportProfiles: number;
  };
  validation: {
    errors: number;
    warnings: number;
  };
  health?: {
    score: number;
    status: string;
    validationErrors: number;
    validationWarnings: number;
    recordCount: number;
    sourceCount: number;
    exportProfileCount: number;
    updatedAt: string;
  } | null;
  sources: SourceSummary[];
  exportProfiles: ExportProfileSummary[];
}

export interface SkillDocument {
  id: string;
  skillId: string;
  title: string;
  type: string;
  confidence: string;
  sourceStatus: string;
  freshness: string;
  privacy: string;
  lastReviewed?: string | null;
  reviewStatus: string;
  tags: string[];
  sources: string[];
  body: string;
  metadata: Record<string, unknown>;
}

export interface SkillDetail extends SkillSummary {
  author: string;
  license: string;
  createdAt: string;
  manifest: Record<string, unknown>;
  counts: {
    instructions: number;
    examples: number;
    sources: number;
    exportProfiles: number;
  };
  validation: {
    errors: number;
    warnings: number;
  };
  health: {
    score: number;
    status: string;
  };
  sources: SourceSummary[];
  exportProfiles: ExportProfileSummary[];
}

export type ReviewItemSeverity = "error" | "warning" | "info";
export type ReviewItemStatus = "open" | "ignored" | "accepted" | "reviewed" | "resolved";
export type ReviewObjectType = "pack" | "skill";
export type ReviewItemType =
  | "validation"
  | "freshness"
  | "export_safety"
  | "export_readiness"
  | "example_coverage"
  | "safety_rules"
  | "target_compatibility"
  | "disallowed_pattern"
  | "ai_draft"
  | "review_status"
  | "trust"
  | "source_coverage";

export interface ReviewItem {
  id: string;
  fingerprint: string;
  objectType: ReviewObjectType;
  objectId: string;
  type: ReviewItemType;
  severity: ReviewItemSeverity;
  packId: string;
  skillId: string | null;
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

export interface ReviewItemsResponse {
  items: ReviewItem[];
  counts: {
    total: number;
    open: number;
    filtered: number;
  };
}

export interface HealthCheck {
  id: ReviewItemType;
  label: string;
  status: "pass" | "warning" | "error";
  count: number;
}

export interface PackHealthResponse {
  packId: string;
  score: number;
  status: string;
  reviewQueueCount: number;
  checks: HealthCheck[];
  items: ReviewItem[];
}

export interface SkillHealthResponse {
  skillId: string;
  score: number;
  status: string;
  reviewQueueCount: number;
  checks: HealthCheck[];
  items: ReviewItem[];
}

export interface RecordSummary {
  id: string;
  packId: string;
  title: string;
  type: string;
  confidence: string;
  sourceStatus: string;
  freshness: string;
  privacy: string;
  lastReviewed?: string | null;
  reviewStatus: string;
  tags: string[];
  sources: string[];
  filePath: string;
}

export interface RecordDetail extends RecordSummary {
  body: string;
  resolvedSources: SourceSummary[];
  metadata: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  kind: "pack" | "record" | "skill" | "skill_instruction" | "skill_example";
  title: string;
  snippet?: string;
  packId?: string;
  skillId?: string;
}

export interface SearchResponse {
  query: string;
  type?: string;
  results: SearchResult[];
}

export type SortKey = "name" | "health" | "lastReviewed" | "records";
export type LibraryViewMode = "cover" | "compact" | "table";

export type Route =
  | { name: "library" }
  | { name: "pack"; packId: string }
  | { name: "record"; recordId: string }
  | { name: "skills" }
  | { name: "skill"; skillId: string }
  | { name: "reviewQueue" }
  | { name: "composer" }
  | { name: "exports" }
  | { name: "health" };
