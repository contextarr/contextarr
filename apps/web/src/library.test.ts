import { describe, expect, it } from "vitest";
import {
  createCoverVisual,
  filterAndSortPacks,
  formatPackType,
  getInitialLibraryView,
  persistLibraryView
} from "./library";
import type { PackSummary } from "./types";

const packs: PackSummary[] = [
  pack({ id: "jellyfin-server-pack", name: "Jellyfin Server Pack", type: "server", healthScore: 88, recordCount: 5 }),
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
    expect(filterAndSortPacks(packs, filters({ type: "server" })).map((item) => item.id)).toEqual([
      "jellyfin-server-pack"
    ]);
    expect(filterAndSortPacks(packs, filters({ trustLevel: "verified" })).map((item) => item.id)).toEqual([
      "internal-support-kb-pack"
    ]);
    expect(filterAndSortPacks(packs, filters({ healthStatus: "degraded" })).map((item) => item.id)).toEqual([
      "internal-support-kb-pack"
    ]);
  });

  it("uses search result pack ids when local summary text does not match", () => {
    const results = [{ id: "record-1", kind: "record" as const, title: "Record", packId: "jellyfin-server-pack" }];

    expect(filterAndSortPacks(packs, filters({ query: "playback" }), results).map((item) => item.id)).toEqual([
      "jellyfin-server-pack"
    ]);
  });

  it("sorts by health and records", () => {
    expect(filterAndSortPacks(packs, filters({ sortBy: "health" })).map((item) => item.id)).toEqual([
      "ai-workstation-pack",
      "jellyfin-server-pack",
      "internal-support-kb-pack"
    ]);
    expect(filterAndSortPacks(packs, filters({ sortBy: "records" })).map((item) => item.id)).toEqual([
      "ai-workstation-pack",
      "internal-support-kb-pack",
      "jellyfin-server-pack"
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
