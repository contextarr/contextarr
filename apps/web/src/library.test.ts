import { describe, expect, it } from "vitest";
import {
  createCoverVisual,
  filterAndSortPacks,
  formatPackType,
  getFilterOptions,
  getInitialLibraryView,
  persistLibraryView
} from "./library";
import type { PackSummary } from "./types";

const packs: PackSummary[] = [
  pack({
    id: "jellyfin-media-server-pack",
    name: "Jellyfin Media Server Pack",
    type: "self_hosted_media",
    healthScore: 88,
    recordCount: 8
  }),
  pack({
    id: "ai-workstation-pack",
    name: "AI Workstation Pack",
    type: "technical_system",
    healthScore: 92,
    recordCount: 12,
    accentColor: "#3b82f6"
  }),
  pack({
    id: "internal-support-kb-pack",
    name: "Internal Support KB Pack",
    type: "internal_kb",
    trustLevel: "verified",
    healthStatus: "degraded",
    healthScore: 72,
    recordCount: 7
  })
];

describe("Pack library utilities", () => {
  it("filters by query, type, trust, and health", () => {
    expect(filterAndSortPacks(packs, filters({ query: "workstation" })).map((item) => item.id)).toEqual([
      "ai-workstation-pack"
    ]);
    expect(filterAndSortPacks(packs, filters({ type: "self_hosted_media" })).map((item) => item.id)).toEqual([
      "jellyfin-media-server-pack"
    ]);
    expect(filterAndSortPacks(packs, filters({ trustLevel: "verified" })).map((item) => item.id)).toEqual([
      "internal-support-kb-pack"
    ]);
    expect(filterAndSortPacks(packs, filters({ trustLevel: "curated" })).map((item) => item.id)).toEqual([
      "ai-workstation-pack",
      "jellyfin-media-server-pack"
    ]);
    expect(filterAndSortPacks(packs, filters({ healthStatus: "degraded" })).map((item) => item.id)).toEqual([
      "internal-support-kb-pack"
    ]);
  });

  it("filters starter, local, and imported pack groups", () => {
    const groupPacks = [
      ...packs,
      pack({
        id: "openai-prompt-engineering-pack",
        name: "OpenAI Prompt Engineering Pack",
        type: "ai_prompting",
        starterPack: true,
        starterCategory: "ai_prompting",
        starterSortOrder: 1,
        healthScore: 96,
        recordCount: 8
      }),
      pack({ id: "imported-pack", name: "Imported Pack", trustLevel: "imported" })
    ];

    expect(filterAndSortPacks(groupPacks, filters({ group: "starter" })).map((item) => item.id)).toEqual([
      "openai-prompt-engineering-pack"
    ]);
    expect(filterAndSortPacks(groupPacks, filters({ group: "imported" })).map((item) => item.id)).toEqual([
      "imported-pack"
    ]);
    expect(filterAndSortPacks(groupPacks, filters({ group: "local" })).map((item) => item.id)).not.toContain(
      "openai-prompt-engineering-pack"
    );
  });

  it("normalizes official trust values out of pack filter options", () => {
    expect(getFilterOptions(packs).trustLevels).toEqual(["curated", "verified"]);
  });

  it("uses search result pack ids when local summary text does not match", () => {
    const results = [{ id: "record-1", kind: "record" as const, title: "Record", packId: "jellyfin-media-server-pack" }];

    expect(filterAndSortPacks(packs, filters({ query: "playback" }), results).map((item) => item.id)).toEqual([
      "jellyfin-media-server-pack"
    ]);
  });

  it("sorts by health and records", () => {
    expect(filterAndSortPacks(packs, filters({ sortBy: "health" })).map((item) => item.id)).toEqual([
      "ai-workstation-pack",
      "jellyfin-media-server-pack",
      "internal-support-kb-pack"
    ]);
    expect(filterAndSortPacks(packs, filters({ sortBy: "records" })).map((item) => item.id)).toEqual([
      "ai-workstation-pack",
      "jellyfin-media-server-pack",
      "internal-support-kb-pack"
    ]);
  });

  it("creates deterministic fallback cover metadata", () => {
    expect(createCoverVisual(packs[1])).toMatchObject({
      accentColor: "#3b82f6",
      coverImage: null,
      icon: "monitor",
      initials: "AW"
    });
  });

  it("falls back instead of rendering remote or absolute pack cover image refs", () => {
    expect(createCoverVisual(pack({ coverImage: "assets/local-cover.svg" })).coverImage).toBe("assets/local-cover.svg");
    expect(createCoverVisual(pack({ coverImage: "https://example.invalid/pixel.png" })).coverImage).toBeNull();
    expect(createCoverVisual(pack({ coverImage: "D:\\private\\cover.png" })).coverImage).toBeNull();
    expect(createCoverVisual(pack({ coverImage: "../private/cover.png" })).coverImage).toBeNull();
  });

  it("persists only valid library views", () => {
    const storage = createMemoryStorage();
    expect(getInitialLibraryView(storage)).toBe("compact");

    persistLibraryView("table", storage);
    expect(getInitialLibraryView(storage)).toBe("table");

    storage.setItem("contextarr.library.view", "invalid");
    expect(getInitialLibraryView(storage)).toBe("compact");
  });

  it("formats pack types for display", () => {
    expect(formatPackType("technical_system")).toBe("Technical System");
  });
});

function filters(overrides: Partial<Parameters<typeof filterAndSortPacks>[1]> = {}) {
  return {
    query: "",
    group: "all" as const,
    type: "all",
    trustLevel: "all",
    healthStatus: "all",
    sortBy: "name" as const,
    ...overrides
  };
}

function pack(overrides: Partial<PackSummary>): PackSummary {
  return {
    id: "pack",
    name: "Pack",
    version: "1.0.0",
    description: "Demo pack",
    type: "demo",
    visibility: "local",
    trustLevel: "official",
    healthScore: 90,
    healthStatus: "healthy",
    validationErrors: 0,
    validationWarnings: 0,
    recordCount: 0,
    sourceCount: 0,
    exportProfileCount: 0,
    accentColor: null,
    coverImage: null,
    starterPack: false,
    starterCategory: null,
    starterSortOrder: null,
    reviewQueueCount: 0,
    lastReviewedAt: "2026-05-07T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z",
    ...overrides
  };
}

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value)
  };
}
