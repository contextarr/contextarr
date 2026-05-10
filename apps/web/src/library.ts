import type { LibraryViewMode, PackSummary, SearchResult, SortKey } from "./types";

export const libraryViewStorageKey = "contextarr.library.view";
export const libraryViewModes: LibraryViewMode[] = ["cover", "compact", "table"];
export type LibraryPackGroup = "all" | "starter" | "local" | "imported";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LibraryFilters {
  query: string;
  group: LibraryPackGroup;
  type: string;
  trustLevel: string;
  healthStatus: string;
  sortBy: SortKey;
}

export interface CoverVisual {
  accentColor: string;
  coverImage: string | null;
  icon: "book" | "box" | "code" | "database" | "monitor" | "package" | "server";
  initials: string;
}

export function getInitialLibraryView(storage = getBrowserStorage()): LibraryViewMode {
  const storedValue = storage?.getItem(libraryViewStorageKey);
  return isLibraryViewMode(storedValue) ? storedValue : "compact";
}

export function persistLibraryView(mode: LibraryViewMode, storage = getBrowserStorage()): void {
  storage?.setItem(libraryViewStorageKey, mode);
}

export function isLibraryViewMode(value: unknown): value is LibraryViewMode {
  return typeof value === "string" && libraryViewModes.includes(value as LibraryViewMode);
}

export function filterAndSortPacks(
  packs: PackSummary[],
  filters: LibraryFilters,
  searchResults: SearchResult[] = []
): PackSummary[] {
  const query = normalize(filters.query);
  const searchPackIds = new Set(
    searchResults.map((result) => (result.kind === "record" ? result.packId : result.id)).filter(Boolean)
  );

  return packs
    .filter((pack) => {
      if (!matchesPackGroup(pack, filters.group)) {
        return false;
      }

      if (filters.type !== "all" && pack.type !== filters.type) {
        return false;
      }

      if (filters.trustLevel !== "all" && normalizePackTrustForFilter(pack.trustLevel) !== filters.trustLevel) {
        return false;
      }

      if (filters.healthStatus !== "all" && pack.healthStatus !== filters.healthStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      const localText = normalize(
        [pack.name, pack.description, pack.type, normalizePackTrustForFilter(pack.trustLevel), pack.healthStatus, pack.visibility].join(" ")
      );

      return localText.includes(query) || searchPackIds.has(pack.id);
    })
    .sort((left, right) => comparePacks(left, right, filters.sortBy));
}

export function getFilterOptions(packs: PackSummary[]): {
  types: string[];
  trustLevels: string[];
  healthStatuses: string[];
} {
  return {
    types: uniqueSorted(packs.map((pack) => pack.type)),
    trustLevels: uniqueSorted(packs.map((pack) => normalizePackTrustForFilter(pack.trustLevel))),
    healthStatuses: uniqueSorted(packs.map((pack) => pack.healthStatus))
  };
}

export function createCoverVisual(pack: PackSummary): CoverVisual {
  return {
    accentColor: sanitizeAccentColor(pack.accentColor),
    coverImage: sanitizeLocalCoverImage(pack.coverImage),
    icon: iconForPack(pack),
    initials: pack.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
  };
}

export function formatPackType(value: string): string {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function normalizePackTrustForFilter(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === "official") {
    return "curated";
  }
  if (normalized === "deprecated") {
    return "blocked";
  }
  return normalized;
}

function comparePacks(left: PackSummary, right: PackSummary, sortBy: SortKey): number {
  const starterOrder = compareStarterOrder(left, right);
  if (starterOrder !== 0 && sortBy === "name") {
    return starterOrder;
  }

  switch (sortBy) {
    case "health":
      return right.healthScore - left.healthScore || left.name.localeCompare(right.name);
    case "lastReviewed":
      return dateValue(right.lastReviewedAt) - dateValue(left.lastReviewedAt) || left.name.localeCompare(right.name);
    case "records":
      return right.recordCount - left.recordCount || left.name.localeCompare(right.name);
    case "name":
    default:
      return left.name.localeCompare(right.name);
  }
}

function matchesPackGroup(pack: PackSummary, group: LibraryPackGroup): boolean {
  switch (group) {
    case "starter":
      return Boolean(pack.starterPack);
    case "local":
      return !pack.starterPack && normalizePackTrustForFilter(pack.trustLevel) !== "imported";
    case "imported":
      return normalizePackTrustForFilter(pack.trustLevel) === "imported";
    case "all":
    default:
      return true;
  }
}

function compareStarterOrder(left: PackSummary, right: PackSummary): number {
  if (!left.starterPack || !right.starterPack) {
    return 0;
  }

  const leftOrder = left.starterSortOrder ?? Number.MAX_SAFE_INTEGER;
  const rightOrder = right.starterSortOrder ?? Number.MAX_SAFE_INTEGER;
  return leftOrder - rightOrder || left.name.localeCompare(right.name);
}

function iconForPack(pack: PackSummary): CoverVisual["icon"] {
  const text = normalize(`${pack.type} ${pack.name}`);

  if (text.includes("workstation") || text.includes("system")) {
    return "monitor";
  }

  if (text.includes("server") || text.includes("jellyfin")) {
    return "server";
  }

  if (text.includes("code") || text.includes("project")) {
    return "code";
  }

  if (text.includes("kb") || text.includes("knowledge") || text.includes("support")) {
    return "book";
  }

  if (text.includes("data") || text.includes("source")) {
    return "database";
  }

  if (text.includes("product")) {
    return "box";
  }

  return "package";
}

function sanitizeAccentColor(value: string | null | undefined): string {
  return value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#2563EB";
}

function sanitizeLocalCoverImage(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().replace(/\\/g, "/");
  if (
    /^[A-Za-z][A-Za-z0-9+.-]*:/i.test(normalized) ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.startsWith("/") ||
    normalized.startsWith("//") ||
    normalized.startsWith("../") ||
    normalized === ".." ||
    /[\u0000-\u001F"'<>]/.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function dateValue(value: string | null): number {
  return value ? new Date(value).getTime() : 0;
}

function getBrowserStorage(): StorageLike | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
