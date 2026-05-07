import { describe, expect, it } from "vitest";
import {
  buildComposePreviewRequest,
  countSelectedRecords,
  filterComposerRecords,
  getComposerFilterOptions,
  summarizeSelectedPacks
} from "./composer";
import type { PackSummary, RecordSummary } from "./types";

const records: RecordSummary[] = [
  record({ id: "pack.alpha", title: "Alpha Setup", type: "runbook", tags: ["ai", "local"], privacy: "public_safe" }),
  record({ id: "pack.beta", title: "Beta Draft", type: "note", tags: ["imported_draft"], privacy: "private", reviewStatus: "draft" })
];

describe("composer utilities", () => {
  it("filters records by query, tag, type, privacy, and review status", () => {
    expect(filterComposerRecords(records, filters({ query: "alpha" })).map((item) => item.id)).toEqual(["pack.alpha"]);
    expect(filterComposerRecords(records, filters({ tag: "imported_draft" })).map((item) => item.id)).toEqual(["pack.beta"]);
    expect(filterComposerRecords(records, filters({ type: "runbook", privacy: "public_safe" })).map((item) => item.id)).toEqual([
      "pack.alpha"
    ]);
    expect(filterComposerRecords(records, filters({ reviewStatus: "draft" })).map((item) => item.id)).toEqual(["pack.beta"]);
  });

  it("builds a compose preview request with selected records only", () => {
    const request = buildComposePreviewRequest({
      title: " Handoff ",
      target: "codex",
      format: "markdown",
      privacyMode: "redacted",
      selectedByPack: {
        "pack-one": ["record-a"],
        "pack-two": []
      }
    });

    expect(request).toMatchObject({
      title: "Handoff",
      target: "codex",
      format: "markdown",
      privacyMode: "redacted",
      selections: [{ packId: "pack-one", recordIds: ["record-a"] }]
    });
  });

  it("summarizes selected counts and filter options", () => {
    const packs = [{ id: "pack-one", name: "Pack One" }, { id: "pack-two", name: "Pack Two" }] as PackSummary[];

    expect(getComposerFilterOptions(records).tags).toEqual(["ai", "imported_draft", "local"]);
    expect(countSelectedRecords({ "pack-one": ["a", "b"], "pack-two": [] })).toBe(2);
    expect(summarizeSelectedPacks(packs, { "pack-one": ["a"] })).toBe("Pack One");
  });
});

function filters(overrides: Partial<Parameters<typeof filterComposerRecords>[1]> = {}): Parameters<typeof filterComposerRecords>[1] {
  return {
    query: "",
    tag: "all",
    type: "all",
    privacy: "all",
    reviewStatus: "all",
    ...overrides
  };
}

function record(overrides: Partial<RecordSummary>): RecordSummary {
  return {
    id: "record",
    packId: "pack",
    title: "Record",
    type: "note",
    tags: [],
    confidence: "high",
    sourceStatus: "verified",
    freshness: "current",
    privacy: "public_safe",
    lastReviewed: "2026-05-07",
    reviewStatus: "approved",
    sources: [],
    filePath: "records/record.md",
    ...overrides
  };
}
