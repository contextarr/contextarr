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
