import { describe, expect, it } from "vitest";
import { healthHref, packHref, parseHashRoute, recordHref, reviewQueueHref } from "./routes";

describe("hash routes", () => {
  it("defaults to library", () => {
    expect(parseHashRoute("")).toEqual({ name: "library" });
    expect(parseHashRoute("#/library")).toEqual({ name: "library" });
  });

  it("parses pack and record routes", () => {
    expect(parseHashRoute("#/packs/ai-workstation-pack")).toEqual({
      name: "pack",
      packId: "ai-workstation-pack"
    });
    expect(parseHashRoute("#/records/ai-workstation.local-ai-stack")).toEqual({
      name: "record",
      recordId: "ai-workstation.local-ai-stack"
    });
  });

  it("parses review queue and health routes", () => {
    expect(parseHashRoute("#/review-queue")).toEqual({ name: "reviewQueue" });
    expect(parseHashRoute("#/health")).toEqual({ name: "health" });
  });

  it("builds encoded hrefs", () => {
    expect(packHref("pack id")).toBe("#/packs/pack%20id");
    expect(recordHref("record/id")).toBe("#/records/record%2Fid");
    expect(reviewQueueHref()).toBe("#/review-queue");
    expect(healthHref()).toBe("#/health");
  });
});
