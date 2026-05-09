import { describe, expect, it } from "vitest";
import { createAgentKitCoverVisual, filterAndSortAgentKits, getAgentKitFilterOptions } from "./agent-kits";
import type { AgentKitSummary, SearchResult } from "./types";

describe("Agent Kit library helpers", () => {
  it("filters Agent Kits by local fields and search result matches", () => {
    const agentKits = [
      agentKit({ id: "support-kit", name: "Support Kit", target: "codex", type: "support" }),
      agentKit({ id: "planning-kit", name: "Planning Kit", target: "claude", type: "planning" })
    ];
    const searchResults: SearchResult[] = [{ id: "planning-kit", kind: "agent-kit", title: "Planning Kit" }];

    expect(filterAndSortAgentKits(agentKits, filters({ query: "support" })).map((kit) => kit.id)).toEqual(["support-kit"]);
    expect(filterAndSortAgentKits(agentKits, filters({ target: "codex" })).map((kit) => kit.id)).toEqual(["support-kit"]);
    expect(filterAndSortAgentKits(agentKits, filters({ query: "roadmap" }), searchResults).map((kit) => kit.id)).toEqual([
      "planning-kit"
    ]);
  });

  it("sorts Agent Kits by Phase 23 library metrics", () => {
    const agentKits = [
      agentKit({ id: "low", name: "Low", healthScore: 60, contextPackCount: 1, skillCount: 4 }),
      agentKit({ id: "high", name: "High", healthScore: 100, contextPackCount: 3, skillCount: 1 })
    ];

    expect(filterAndSortAgentKits(agentKits, filters({ sortBy: "health" })).map((kit) => kit.id)).toEqual(["high", "low"]);
    expect(filterAndSortAgentKits(agentKits, filters({ sortBy: "contextPacks" })).map((kit) => kit.id)).toEqual([
      "high",
      "low"
    ]);
    expect(filterAndSortAgentKits(agentKits, filters({ sortBy: "skills" })).map((kit) => kit.id)).toEqual(["low", "high"]);
  });

  it("builds filter options and cover visuals", () => {
    const agentKits = [
      agentKit({ name: "Implementation Support Kit", type: "implementation", target: "codex" }),
      agentKit({ name: "Customer Review Kit", type: "review", target: "chatgpt", accentColor: "not-a-color" })
    ];

    expect(getAgentKitFilterOptions(agentKits)).toMatchObject({
      types: ["implementation", "review"],
      targets: ["chatgpt", "codex"]
    });
    expect(createAgentKitCoverVisual(agentKits[0])).toMatchObject({
      accentColor: "#2563EB",
      initials: "IS"
    });
  });

  it("falls back instead of rendering remote or absolute cover image refs", () => {
    expect(createAgentKitCoverVisual(agentKit({ coverImage: "assets/local-cover.svg" })).coverImage).toBe(
      "assets/local-cover.svg"
    );
    expect(createAgentKitCoverVisual(agentKit({ coverImage: "https://example.invalid/pixel.png" })).coverImage).toBeNull();
    expect(createAgentKitCoverVisual(agentKit({ coverImage: "D:\\private\\cover.png" })).coverImage).toBeNull();
    expect(createAgentKitCoverVisual(agentKit({ coverImage: "../private/cover.png" })).coverImage).toBeNull();
  });
});

function filters(overrides: Partial<Parameters<typeof filterAndSortAgentKits>[1]> = {}): Parameters<typeof filterAndSortAgentKits>[1] {
  return {
    query: "",
    type: "all",
    trustLevel: "all",
    healthStatus: "all",
    target: "all",
    sortBy: "name",
    ...overrides
  };
}

function agentKit(overrides: Partial<AgentKitSummary> = {}): AgentKitSummary {
  return {
    id: "agent-kit",
    name: "Agent Kit",
    version: "1.0.0",
    description: "A local Agent Kit.",
    type: "implementation",
    visibility: "local",
    trustLevel: "local",
    healthScore: 100,
    healthStatus: "healthy",
    validationErrors: 0,
    validationWarnings: 0,
    contextPackCount: 2,
    skillCount: 1,
    exportProfileCount: 1,
    accentColor: "#2563EB",
    coverImage: null,
    reviewQueueCount: 0,
    lastReviewedAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
    target: "codex",
    privacyMode: "redacted",
    ...overrides
  };
}
