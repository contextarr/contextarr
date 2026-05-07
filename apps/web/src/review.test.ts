import { describe, expect, it } from "vitest";
import { filterReviewItems, reviewPackName, summarizeReviewItems } from "./review";
import type { PackSummary, ReviewItem } from "./types";

const items: ReviewItem[] = [
  reviewItem({ id: "one", status: "open", severity: "error", type: "validation", packId: "pack-a" }),
  reviewItem({ id: "two", status: "ignored", severity: "warning", type: "freshness", packId: "pack-a" }),
  reviewItem({ id: "three", status: "reviewed", severity: "info", type: "source_coverage", packId: "pack-b" })
];

describe("review utilities", () => {
  it("filters by status, severity, type, and pack", () => {
    expect(filterReviewItems(items, { status: "open", severity: "all", type: "all", packId: "all" })).toEqual([
      items[0]
    ]);
    expect(filterReviewItems(items, { status: "all", severity: "warning", type: "freshness", packId: "pack-a" })).toEqual([
      items[1]
    ]);
  });

  it("summarizes review item counts", () => {
    expect(summarizeReviewItems(items)).toEqual({
      total: 3,
      open: 1,
      errors: 1,
      warnings: 1,
      infos: 1
    });
  });

  it("resolves pack names", () => {
    expect(reviewPackName("pack-a", [pack({ id: "pack-a", name: "Pack A" })])).toBe("Pack A");
    expect(reviewPackName("missing", [])).toBe("missing");
  });
});

function reviewItem(overrides: Partial<ReviewItem>): ReviewItem {
  return {
    id: "item",
    fingerprint: "fingerprint",
    type: "validation",
    severity: "warning",
    packId: "pack-a",
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
