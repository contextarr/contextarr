import { describe, expect, it } from "vitest";
import { filterReviewItems, reviewPackName, reviewSkillName, summarizeReviewItems } from "./review";
import type { PackSummary, ReviewItem, SkillSummary } from "./types";

const items: ReviewItem[] = [
  reviewItem({ id: "one", status: "open", severity: "error", type: "validation", packId: "pack-a" }),
  reviewItem({ id: "two", status: "ignored", severity: "warning", type: "freshness", packId: "pack-a" }),
  reviewItem({ id: "three", status: "reviewed", severity: "info", type: "source_coverage", packId: "pack-b" }),
  reviewItem({
    id: "four",
    objectType: "skill",
    objectId: "skill-a",
    packId: "skill-a",
    skillId: "skill-a",
    status: "open",
    severity: "warning",
    type: "review_status"
  })
];

describe("review utilities", () => {
  it("filters by status, severity, type, and object", () => {
    expect(filterReviewItems(items, filters({ status: "open", objectType: "pack" }))).toEqual([items[0]]);
    expect(filterReviewItems(items, filters({ severity: "warning", type: "freshness", objectId: "pack-a" }))).toEqual([
      items[1]
    ]);
    expect(filterReviewItems(items, filters({ objectType: "skill" }))).toEqual([items[3]]);
  });

  it("summarizes review item counts", () => {
    expect(summarizeReviewItems(items)).toEqual({
      total: 4,
      open: 2,
      errors: 1,
      warnings: 2,
      infos: 1
    });
  });

  it("resolves pack names", () => {
    expect(reviewPackName("pack-a", [pack({ id: "pack-a", name: "Pack A" })])).toBe("Pack A");
    expect(reviewPackName("missing", [])).toBe("missing");
  });

  it("resolves Skill names", () => {
    expect(reviewSkillName("skill-a", [skill({ id: "skill-a", name: "Skill A" })])).toBe("Skill A");
    expect(reviewSkillName("missing", [])).toBe("missing");
  });
});

function reviewItem(overrides: Partial<ReviewItem>): ReviewItem {
  return {
    id: "item",
    fingerprint: "fingerprint",
    objectType: "pack",
    objectId: overrides.packId ?? "pack-a",
    type: "validation",
    severity: "warning",
    packId: "pack-a",
    skillId: null,
    recordId: null,
    sourceId: null,
    message: "Message",
    suggestedAction: "Action",
    status: "open",
    firstSeenAt: "2026-05-07T00:00:00.000Z",
    lastSeenAt: "2026-05-07T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z",
    metadata: {},
    ...overrides
  };
}

function filters(overrides: Partial<Parameters<typeof filterReviewItems>[1]> = {}): Parameters<typeof filterReviewItems>[1] {
  return {
    objectType: "all",
    objectId: "all",
    status: "all",
    severity: "all",
    type: "all",
    ...overrides
  };
}

function pack(overrides: Partial<PackSummary>): PackSummary {
  return {
    id: "pack",
    name: "Pack",
    version: "0.1.0",
    description: "Pack",
    type: "demo",
    visibility: "local",
    trustLevel: "local",
    healthScore: 100,
    healthStatus: "healthy",
    validationErrors: 0,
    validationWarnings: 0,
    recordCount: 0,
    sourceCount: 0,
    exportProfileCount: 0,
    accentColor: null,
    coverImage: null,
    reviewQueueCount: 0,
    lastReviewedAt: null,
    updatedAt: "2026-05-07T00:00:00.000Z",
    ...overrides
  };
}

function skill(overrides: Partial<SkillSummary>): SkillSummary {
  return {
    id: "skill",
    name: "Skill",
    version: "0.1.0",
    description: "Skill",
    type: "demo",
    visibility: "local",
    trustLevel: "local",
    healthScore: 100,
    healthStatus: "healthy",
    validationErrors: 0,
    validationWarnings: 0,
    instructionCount: 0,
    exampleCount: 0,
    sourceCount: 0,
    exportProfileCount: 0,
    accentColor: null,
    coverImage: null,
    reviewQueueCount: 0,
    lastReviewedAt: null,
    updatedAt: "2026-05-07T00:00:00.000Z",
    targets: [],
    inputs: [],
    outputs: [],
    ...overrides
  };
}
