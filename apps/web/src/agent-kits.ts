import type { AgentKitSummary, SearchResult } from "./types";

export type AgentKitLibraryViewMode = "cards" | "table";
export type AgentKitSortKey = "name" | "health" | "lastReviewed" | "contextPacks" | "skills";

export interface AgentKitFilters {
  query: string;
  type: string;
  trustLevel: string;
  healthStatus: string;
  target: string;
  sortBy: AgentKitSortKey;
}

export interface AgentKitCoverVisual {
  accentColor: string;
  coverImage: string | null;
  initials: string;
}

export function filterAndSortAgentKits(
  agentKits: AgentKitSummary[],
  filters: AgentKitFilters,
  searchResults: SearchResult[] = []
): AgentKitSummary[] {
  const query = normalize(filters.query);
  const searchAgentKitIds = new Set(
    searchResults.map((result) => (result.kind === "agent-kit" ? result.id : undefined)).filter(Boolean)
  );

  return agentKits
    .filter((agentKit) => {
      if (filters.type !== "all" && agentKit.type !== filters.type) {
        return false;
      }

      if (filters.trustLevel !== "all" && agentKit.trustLevel !== filters.trustLevel) {
        return false;
      }

      if (filters.healthStatus !== "all" && agentKit.healthStatus !== filters.healthStatus) {
        return false;
      }

      if (filters.target !== "all" && agentKit.target !== filters.target) {
        return false;
      }

      if (!query) {
        return true;
      }

      const localText = normalize(
        [
          agentKit.name,
          agentKit.description,
          agentKit.type,
          agentKit.trustLevel,
          agentKit.healthStatus,
          agentKit.visibility,
          agentKit.target,
          agentKit.privacyMode
        ].join(" ")
      );

      return localText.includes(query) || searchAgentKitIds.has(agentKit.id);
    })
    .sort((left, right) => compareAgentKits(left, right, filters.sortBy));
}

export function getAgentKitFilterOptions(agentKits: AgentKitSummary[]): {
  types: string[];
  trustLevels: string[];
  healthStatuses: string[];
  targets: string[];
} {
  return {
    types: uniqueSorted(agentKits.map((agentKit) => agentKit.type)),
    trustLevels: uniqueSorted(agentKits.map((agentKit) => agentKit.trustLevel)),
    healthStatuses: uniqueSorted(agentKits.map((agentKit) => agentKit.healthStatus)),
    targets: uniqueSorted(agentKits.map((agentKit) => agentKit.target))
  };
}

export function createAgentKitCoverVisual(agentKit: AgentKitSummary): AgentKitCoverVisual {
  return {
    accentColor: sanitizeAccentColor(agentKit.accentColor),
    coverImage: sanitizeLocalCoverImage(agentKit.coverImage),
    initials: agentKit.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
  };
}

function compareAgentKits(left: AgentKitSummary, right: AgentKitSummary, sortBy: AgentKitSortKey): number {
  switch (sortBy) {
    case "health":
      return right.healthScore - left.healthScore || left.name.localeCompare(right.name);
    case "lastReviewed":
      return dateValue(right.lastReviewedAt) - dateValue(left.lastReviewedAt) || left.name.localeCompare(right.name);
    case "contextPacks":
      return right.contextPackCount - left.contextPackCount || left.name.localeCompare(right.name);
    case "skills":
      return right.skillCount - left.skillCount || left.name.localeCompare(right.name);
    case "name":
    default:
      return left.name.localeCompare(right.name);
  }
}

function sanitizeAccentColor(value: string | null | undefined): string {
  return value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#22d3e8";
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
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function dateValue(value: string | null): number {
  return value ? new Date(value).getTime() : 0;
}
