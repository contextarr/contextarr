import type { SearchResult, SkillSummary } from "./types";

export interface SkillFilters {
  query: string;
  type: string;
  trustLevel: string;
  healthStatus: string;
}

export interface SkillCoverVisual {
  accentColor: string;
  coverImage: string | null;
  icon: "book" | "code" | "database" | "monitor" | "package" | "sparkles";
  initials: string;
}

export function filterAndSortSkills(
  skills: SkillSummary[],
  filters: SkillFilters,
  searchResults: SearchResult[] = []
): SkillSummary[] {
  const query = normalize(filters.query);
  const searchSkillIds = new Set(
    searchResults
      .map((result) => {
        if (result.kind === "skill") {
          return result.id;
        }

        if (result.kind === "skill_instruction" || result.kind === "skill_example") {
          return result.skillId;
        }

        return undefined;
      })
      .filter(Boolean)
  );

  return skills
    .filter((skill) => {
      if (filters.type !== "all" && skill.type !== filters.type) {
        return false;
      }

      if (filters.trustLevel !== "all" && skill.trustLevel !== filters.trustLevel) {
        return false;
      }

      if (filters.healthStatus !== "all" && skill.healthStatus !== filters.healthStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      const localText = normalize(
        [
          skill.name,
          skill.description,
          skill.type,
          skill.trustLevel,
          skill.visibility,
          skill.targets.join(" "),
          skill.inputs.join(" "),
          skill.outputs.join(" ")
        ].join(" ")
      );

      return localText.includes(query) || searchSkillIds.has(skill.id);
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getSkillFilterOptions(skills: SkillSummary[]): {
  types: string[];
  trustLevels: string[];
  healthStatuses: string[];
} {
  return {
    types: uniqueSorted(skills.map((skill) => skill.type)),
    trustLevels: uniqueSorted(skills.map((skill) => skill.trustLevel)),
    healthStatuses: uniqueSorted(skills.map((skill) => skill.healthStatus))
  };
}

export function createSkillCoverVisual(skill: SkillSummary): SkillCoverVisual {
  return {
    accentColor: sanitizeAccentColor(skill.accentColor),
    // Skill cover assets are disabled until a strict local-only serving policy exists.
    coverImage: null,
    icon: iconForSkill(skill),
    initials: skill.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
  };
}

function iconForSkill(skill: SkillSummary): SkillCoverVisual["icon"] {
  const text = normalize(`${skill.type} ${skill.name} ${skill.targets.join(" ")}`);

  if (text.includes("homelab") || text.includes("system")) {
    return "monitor";
  }

  if (text.includes("implementation") || text.includes("bug") || text.includes("code ")) {
    return "code";
  }

  if (text.includes("kb") || text.includes("support") || text.includes("research")) {
    return "book";
  }

  if (text.includes("data") || text.includes("source")) {
    return "database";
  }

  if (text.includes("brief") || text.includes("planning")) {
    return "sparkles";
  }

  return "package";
}

function sanitizeAccentColor(value: string | null | undefined): string {
  return value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#38bdf8";
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
