import { describe, expect, it } from "vitest";
import {
  buildAgentKitPreviewMetadata,
  buildAgentKitSaveRequest,
  filterAgentKitPacks,
  filterAgentKitSkills,
  getAgentKitPackFilterOptions,
  getAgentKitSkillFilterOptions,
  isAgentKitSaveDisabled,
  parseAgentKitTokenBudget,
  toggleSelectedId,
  validateAgentKitDraft
} from "./agent-kit-composer";
import type { PackSummary, SkillSummary } from "./types";

describe("Agent Kit composer utilities", () => {
  it("filters selectable context packs and skills", () => {
    expect(filterAgentKitPacks(packs, { query: "support", type: "all", trustLevel: "all", healthStatus: "all" }).map((pack) => pack.id)).toEqual([
      "support-pack"
    ]);
    expect(filterAgentKitPacks(packs, { query: "", type: "project", trustLevel: "all", healthStatus: "all" }).map((pack) => pack.id)).toEqual([
      "project-pack"
    ]);
    expect(filterAgentKitSkills(skills, { query: "", type: "all", trustLevel: "all", healthStatus: "all", target: "codex" }).map((skill) => skill.id)).toEqual([
      "support-skill"
    ]);
    expect(getAgentKitPackFilterOptions(packs).types).toEqual(["knowledge_base", "project"]);
    expect(getAgentKitSkillFilterOptions(skills).targets).toEqual(["chatgpt", "codex"]);
  });

  it("toggles selection state and parses token budgets", () => {
    expect(toggleSelectedId(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleSelectedId(["a", "b"], "a")).toEqual(["b"]);
    expect(parseAgentKitTokenBudget("12000")).toBe(12000);
    expect(parseAgentKitTokenBudget("0")).toBeUndefined();
    expect(parseAgentKitTokenBudget("nope")).toBeUndefined();
  });

  it("validates required selections and target compatibility warnings", () => {
    const invalid = validateAgentKitDraft(
      {
        name: "",
        goal: "",
        description: "",
        selectedPackIds: [],
        selectedSkillIds: [],
        target: "codex",
        format: "markdown",
        redactionMode: "redacted"
      },
      packs,
      skills
    );
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(["name_required", "goal_required", "description_required", "context_pack_required", "skill_required"])
    );

    const punctuationName = validateAgentKitDraft(validDraft({ name: "!!!" }), packs, skills);
    expect(punctuationName.isValid).toBe(false);
    expect(punctuationName.errors.map((error) => error.code)).toContain("name_slug_invalid");

    const warning = validateAgentKitDraft(validDraft({ target: "claude" }), packs, skills);
    expect(warning.isValid).toBe(true);
    expect(warning.warnings.map((item) => item.code)).toContain("target_compatibility");

    const deprecatedPack = validateAgentKitDraft(validDraft({ selectedPackIds: ["deprecated-pack"] }), packs, skills);
    expect(deprecatedPack.isValid).toBe(false);
    expect(deprecatedPack.errors.map((item) => item.code)).toContain("blocked_context_pack");

    const deprecatedSkill = validateAgentKitDraft(validDraft({ selectedSkillIds: ["deprecated-skill"] }), packs, skills);
    expect(deprecatedSkill.isValid).toBe(false);
    expect(deprecatedSkill.errors.map((item) => item.code)).toContain("blocked_skill");
  });

  it("builds preview metadata and save requests without filesystem paths", () => {
    const request = buildAgentKitSaveRequest(validDraft({ name: " Support Kit " }), packs, skills);
    const preview = buildAgentKitPreviewMetadata(validDraft({ tokenBudget: 9000 }), packs, skills);

    expect(request).toMatchObject({
      id: "support-kit",
      name: "Support Kit",
      goal: "Answer support tickets.",
      description: "Use local source context.",
      contextPacks: ["support-pack"],
      skills: ["support-skill"],
      target: "codex",
      format: "markdown",
      privacyMode: "redacted",
      exportProfile: "support-kit-codex-markdown",
      boundaries: {
        containsExecutableCode: false,
        requiresNetwork: false,
        cloudSync: false,
        telemetry: false,
        marketplacePublish: false
      }
    });
    expect(preview).toMatchObject({
      id: "support-kit",
      contextPackCount: 1,
      skillCount: 1,
      targetLabel: "Codex",
      tokenBudget: 9000
    });
    const serialized = JSON.stringify(request);
    expect(serialized).not.toContain(":\\\\");
    expect(serialized).not.toContain("../");
    expect(serialized).not.toContain("..\\\\");
  });

  it("disables save for invalid selections or in-flight saves", () => {
    expect(isAgentKitSaveDisabled(validDraft(), packs, skills)).toBe(false);
    expect(isAgentKitSaveDisabled(validDraft(), packs, skills, true)).toBe(true);
    expect(isAgentKitSaveDisabled(validDraft({ selectedSkillIds: [] }), packs, skills)).toBe(true);
    expect(isAgentKitSaveDisabled(validDraft({ selectedPackIds: ["missing-pack"] }), packs, skills)).toBe(true);
  });
});

function validDraft(overrides: Partial<Parameters<typeof validateAgentKitDraft>[0]> = {}): Parameters<typeof validateAgentKitDraft>[0] {
  return {
    name: "Support Kit",
    goal: "Answer support tickets.",
    description: "Use local source context.",
    selectedPackIds: ["support-pack"],
    selectedSkillIds: ["support-skill"],
    target: "codex",
    format: "markdown",
    redactionMode: "redacted",
    ...overrides
  };
}

const packs: PackSummary[] = [
  pack({ id: "support-pack", name: "Support Pack", type: "knowledge_base" }),
  pack({ id: "project-pack", name: "Project Pack", type: "project", healthStatus: "degraded", healthScore: 76, validationWarnings: 1 }),
  pack({ id: "deprecated-pack", name: "Deprecated Pack", type: "knowledge_base", trustLevel: "deprecated" })
];

const skills: SkillSummary[] = [
  skill({ id: "support-skill", name: "Support Skill", targets: ["codex", "chatgpt"] }),
  skill({ id: "claude-skill", name: "Claude Skill", targets: ["chatgpt"] }),
  skill({ id: "deprecated-skill", name: "Deprecated Skill", trustLevel: "deprecated", targets: ["chatgpt"] })
];

function pack(overrides: Partial<PackSummary>): PackSummary {
  return {
    id: "pack",
    name: "Pack",
    version: "1.0.0",
    description: "Demo pack.",
    type: "knowledge_base",
    visibility: "local",
    trustLevel: "local",
    healthScore: 100,
    healthStatus: "healthy",
    validationErrors: 0,
    validationWarnings: 0,
    recordCount: 3,
    sourceCount: 2,
    exportProfileCount: 1,
    accentColor: "#22d3e8",
    coverImage: null,
    reviewQueueCount: 0,
    lastReviewedAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
    ...overrides
  };
}

function skill(overrides: Partial<SkillSummary>): SkillSummary {
  return {
    id: "skill",
    name: "Skill",
    version: "1.0.0",
    description: "Demo skill.",
    type: "support",
    visibility: "local",
    trustLevel: "local",
    healthScore: 100,
    healthStatus: "healthy",
    validationErrors: 0,
    validationWarnings: 0,
    instructionCount: 2,
    exampleCount: 1,
    sourceCount: 1,
    exportProfileCount: 1,
    accentColor: "#22d3e8",
    coverImage: null,
    reviewQueueCount: 0,
    lastReviewedAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
    targets: ["codex"],
    inputs: ["notes"],
    outputs: ["brief"],
    ...overrides
  };
}
