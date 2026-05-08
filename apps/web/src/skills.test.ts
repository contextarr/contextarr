import { describe, expect, it } from "vitest";
import { createSkillCoverVisual, filterAndSortSkills, getSkillFilterOptions } from "./skills";
import type { SkillSummary } from "./types";

const skills: SkillSummary[] = [
  skill({ id: "support-ticket-writing-skill", name: "Support Ticket Writing Skill", type: "support_writing" }),
  skill({
    id: "security-review-skill",
    name: "Security Review Skill",
    type: "review",
    trustLevel: "verified",
    healthStatus: "degraded",
    healthScore: 78,
    targets: ["codex", "claude"]
  }),
  skill({
    id: "homelab-troubleshooting-skill",
    name: "Homelab Troubleshooting Skill",
    type: "operations",
    inputs: ["incident_notes"],
    accentColor: "#22d3e8"
  })
];

describe("Skill library utilities", () => {
  it("filters by local text, type, trust, and health", () => {
    expect(filterAndSortSkills(skills, filters({ query: "support" })).map((item) => item.id)).toEqual([
      "support-ticket-writing-skill"
    ]);
    expect(filterAndSortSkills(skills, filters({ type: "operations" })).map((item) => item.id)).toEqual([
      "homelab-troubleshooting-skill"
    ]);
    expect(filterAndSortSkills(skills, filters({ trustLevel: "verified" })).map((item) => item.id)).toEqual([
      "security-review-skill"
    ]);
    expect(filterAndSortSkills(skills, filters({ healthStatus: "degraded" })).map((item) => item.id)).toEqual([
      "security-review-skill"
    ]);
  });

  it("uses Skill search results from instruction and example matches", () => {
    const results = [
      {
        id: "support-ticket-writing-skill.customer-safe-wording",
        kind: "skill_instruction" as const,
        title: "Customer Safe Wording",
        skillId: "support-ticket-writing-skill"
      }
    ];

    expect(filterAndSortSkills(skills, filters({ query: "customer safe" }), results).map((item) => item.id)).toEqual([
      "support-ticket-writing-skill"
    ]);
  });

  it("creates deterministic fallback cover metadata", () => {
    expect(createSkillCoverVisual(skills[2])).toMatchObject({
      accentColor: "#22d3e8",
      coverImage: null,
      icon: "monitor",
      initials: "HT"
    });
  });

  it("does not expose Skill cover image URLs to the browser", () => {
    expect(createSkillCoverVisual(skill({ coverImage: "https://example.invalid/pixel.png" })).coverImage).toBeNull();
  });

  it("returns filter options", () => {
    expect(getSkillFilterOptions(skills)).toMatchObject({
      healthStatuses: ["degraded", "healthy"],
      trustLevels: ["local", "verified"],
      types: ["operations", "review", "support_writing"]
    });
  });
});

function filters(overrides: Partial<Parameters<typeof filterAndSortSkills>[1]> = {}) {
  return {
    query: "",
    type: "all",
    trustLevel: "all",
    healthStatus: "all",
    ...overrides
  };
}

function skill(overrides: Partial<SkillSummary>): SkillSummary {
  return {
    id: "skill",
    name: "Skill",
    version: "1.0.0",
    description: "Demo Skill",
    type: "demo",
    visibility: "local",
    trustLevel: "local",
    healthScore: 100,
    healthStatus: "healthy",
    validationErrors: 0,
    validationWarnings: 0,
    instructionCount: 3,
    exampleCount: 2,
    sourceCount: 3,
    exportProfileCount: 4,
    accentColor: null,
    coverImage: null,
    reviewQueueCount: 0,
    lastReviewedAt: "2026-05-07T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z",
    targets: ["codex"],
    inputs: ["notes"],
    outputs: ["draft"],
    ...overrides
  };
}
