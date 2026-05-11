import type {
  AgentKitSummary,
  PackSummary,
  ReviewCandidateSourceKind,
  ReviewCandidateStatus,
  ReviewCandidateSummary,
  ReviewItem,
  ReviewItemSeverity,
  ReviewItemStatus,
  ReviewItemType,
  ReviewObjectType,
  SkillSummary
} from "./types";

export interface ReviewFilters {
  objectType: ReviewObjectType | "all";
  objectId: string;
  status: ReviewItemStatus | "all";
  severity: ReviewItemSeverity | "all";
  type: ReviewItemType | "all";
}

export interface ReviewCandidateFilters {
  sourceKind: ReviewCandidateSourceKind | "all";
  status: ReviewCandidateStatus | "all";
  query: string;
}

export function filterReviewItems(items: ReviewItem[], filters: ReviewFilters): ReviewItem[] {
  return items.filter((item) => {
    if (filters.status !== "all" && item.status !== filters.status) {
      return false;
    }

    if (filters.severity !== "all" && item.severity !== filters.severity) {
      return false;
    }

    if (filters.type !== "all" && item.type !== filters.type) {
      return false;
    }

    if (filters.objectType !== "all" && item.objectType !== filters.objectType) {
      return false;
    }

    if (filters.objectId !== "all" && item.objectId !== filters.objectId) {
      return false;
    }

    return true;
  });
}

export function summarizeReviewItems(items: ReviewItem[]): {
  total: number;
  open: number;
  errors: number;
  warnings: number;
  infos: number;
} {
  return {
    total: items.length,
    open: items.filter((item) => item.status === "open").length,
    errors: items.filter((item) => item.severity === "error").length,
    warnings: items.filter((item) => item.severity === "warning").length,
    infos: items.filter((item) => item.severity === "info").length
  };
}

export function filterReviewCandidates(candidates: ReviewCandidateSummary[], filters: ReviewCandidateFilters): ReviewCandidateSummary[] {
  const query = filters.query.trim().toLowerCase();
  return candidates.filter((candidate) => {
    if (filters.sourceKind !== "all" && candidate.sourceKind !== filters.sourceKind) {
      return false;
    }

    if (filters.status !== "all" && candidate.status !== filters.status) {
      return false;
    }

    if (query) {
      return [candidate.packId, candidate.name, candidate.sourceLabel, candidate.pathLabel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    }

    return true;
  });
}

export function summarizeReviewCandidates(candidates: ReviewCandidateSummary[]): {
  total: number;
  ready: number;
  invalid: number;
  blocked: number;
  duplicates: number;
} {
  return {
    total: candidates.length,
    ready: candidates.filter((candidate) => candidate.status === "ready_for_review").length,
    invalid: candidates.filter((candidate) => candidate.status === "invalid").length,
    blocked: candidates.filter((candidate) => candidate.status === "blocked").length,
    duplicates: candidates.filter((candidate) => candidate.status === "duplicate_active_id").length
  };
}

export function reviewPackName(packId: string, packs: PackSummary[]): string {
  return packs.find((pack) => pack.id === packId)?.name ?? packId;
}

export function reviewSkillName(skillId: string, skills: SkillSummary[]): string {
  return skills.find((skill) => skill.id === skillId)?.name ?? skillId;
}

export function reviewAgentKitName(agentKitId: string, agentKits: AgentKitSummary[]): string {
  return agentKits.find((agentKit) => agentKit.id === agentKitId)?.name ?? agentKitId;
}
