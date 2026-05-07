import type { ComposePreviewRequest, PackSummary, RecordSummary } from "./types";

export const composerTargets = [
  { value: "codex", label: "Codex", format: "markdown" },
  { value: "claude", label: "Claude", format: "markdown" },
  { value: "chatgpt", label: "ChatGPT", format: "markdown" },
  { value: "markdown", label: "Generic Markdown", format: "markdown" },
  { value: "json_records", label: "JSON Records", format: "json" }
] as const;

export const defaultComposerExcludeTags = ["secret", "never_export", "imported_draft"];

export interface ComposerRecordFilters {
  query: string;
  tag: string;
  type: string;
  privacy: string;
  reviewStatus: string;
}

export function filterComposerRecords(records: RecordSummary[], filters: ComposerRecordFilters): RecordSummary[] {
  const query = filters.query.trim().toLowerCase();

  return records
    .filter((record) => (query ? `${record.title} ${record.type} ${record.tags.join(" ")}`.toLowerCase().includes(query) : true))
    .filter((record) => (filters.tag === "all" ? true : record.tags.includes(filters.tag)))
    .filter((record) => (filters.type === "all" ? true : record.type === filters.type))
    .filter((record) => (filters.privacy === "all" ? true : record.privacy === filters.privacy))
    .filter((record) => (filters.reviewStatus === "all" ? true : record.reviewStatus === filters.reviewStatus))
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function getComposerFilterOptions(records: RecordSummary[]): {
  tags: string[];
  types: string[];
  privacy: string[];
  reviewStatuses: string[];
} {
  return {
    tags: unique(records.flatMap((record) => record.tags)),
    types: unique(records.map((record) => record.type)),
    privacy: unique(records.map((record) => record.privacy)),
    reviewStatuses: unique(records.map((record) => record.reviewStatus))
  };
}

export function buildComposePreviewRequest(options: {
  title: string;
  target: ComposePreviewRequest["target"];
  format: ComposePreviewRequest["format"];
  privacyMode: NonNullable<ComposePreviewRequest["privacyMode"]>;
  selectedByPack: Record<string, string[]>;
  excludeTags?: string[];
  tokenBudget?: number;
}): ComposePreviewRequest {
  return {
    title: options.title.trim() || undefined,
    target: options.target,
    format: options.format,
    privacyMode: options.privacyMode,
    selections: Object.entries(options.selectedByPack)
      .map(([packId, recordIds]) => ({ packId, recordIds }))
      .filter((selection) => selection.recordIds.length > 0),
    excludeTags: options.excludeTags ?? defaultComposerExcludeTags,
    tokenBudget: options.tokenBudget
  };
}

export function countSelectedRecords(selectedByPack: Record<string, string[]>): number {
  return Object.values(selectedByPack).reduce((count, recordIds) => count + recordIds.length, 0);
}

export function summarizeSelectedPacks(packs: PackSummary[], selectedByPack: Record<string, string[]>): string {
  const names = packs.filter((pack) => (selectedByPack[pack.id]?.length ?? 0) > 0).map((pack) => pack.name);
  return names.length === 0 ? "No packs selected" : names.join(", ");
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}
