export interface HealthResponse {
  status: string;
  authRequired: boolean;
  host: string;
  port: number;
  packsDir: string;
  databasePath: string;
  lastIndexedAt: string | null;
  counts: {
    packs: number;
    records: number;
    sources: number;
    exportProfiles: number;
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
  kind: "pack" | "record";
  title: string;
  snippet?: string;
  packId?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export type SortKey = "name" | "health" | "lastReviewed" | "records";
export type LibraryViewMode = "cover" | "compact" | "table";

export type Route =
  | { name: "library" }
  | { name: "pack"; packId: string }
  | { name: "record"; recordId: string };
