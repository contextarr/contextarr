import type {
  PackSummary,
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

export function reviewPackName(packId: string, packs: PackSummary[]): string {
  return packs.find((pack) => pack.id === packId)?.name ?? packId;
}

export function reviewSkillName(skillId: string, skills: SkillSummary[]): string {
  return skills.find((skill) => skill.id === skillId)?.name ?? skillId;
}
