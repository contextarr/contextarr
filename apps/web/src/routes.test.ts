import { describe, expect, it } from "vitest";
import {
  agentKitHref,
  agentKitsHref,
  collectorsHref,
  composerHref,
  exportsHref,
  healthHref,
  packHref,
  parseHashRoute,
  recordHref,
  reviewQueueHref,
  skillHref,
  skillsHref
} from "./routes";

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

  it("parses review queue, composer, exports, and health routes", () => {
    expect(parseHashRoute("#/review-queue")).toEqual({ name: "reviewQueue", tab: "items" });
    expect(parseHashRoute("#/review-queue/drafts")).toEqual({ name: "reviewQueue", tab: "drafts" });
    expect(parseHashRoute("#/composer")).toEqual({ name: "composer" });
    expect(parseHashRoute("#/composer/agent-kit")).toEqual({ name: "composer", mode: "agent-kit" });
    expect(parseHashRoute("#/composer/record-export")).toEqual({ name: "composer", mode: "record-export" });
    expect(parseHashRoute("#/exports")).toEqual({ name: "exports" });
    expect(parseHashRoute("#/health")).toEqual({ name: "health" });
  });

  it("parses Agent Kit detail routes", () => {
    expect(parseHashRoute("#/agent-kits")).toEqual({ name: "agentKits" });
    expect(parseHashRoute("#/agent-kits/support-ticket-writing-kit")).toEqual({
      name: "agentKit",
      agentKitId: "support-ticket-writing-kit"
    });
    expect(parseHashRoute("#/collectors")).toEqual({ name: "collectors" });
  });

  it("parses Skill routes", () => {
    expect(parseHashRoute("#/skills")).toEqual({ name: "skills" });
    expect(parseHashRoute("#/skills/support-ticket-writing-skill")).toEqual({
      name: "skill",
      skillId: "support-ticket-writing-skill"
    });
  });

  it("builds encoded hrefs", () => {
    expect(packHref("pack id")).toBe("#/packs/pack%20id");
    expect(recordHref("record/id")).toBe("#/records/record%2Fid");
    expect(skillsHref()).toBe("#/skills");
    expect(skillHref("skill/id")).toBe("#/skills/skill%2Fid");
    expect(agentKitsHref()).toBe("#/agent-kits");
    expect(agentKitHref("agent kit/id")).toBe("#/agent-kits/agent%20kit%2Fid");
    expect(collectorsHref()).toBe("#/collectors");
    expect(reviewQueueHref()).toBe("#/review-queue");
    expect(reviewQueueHref("drafts")).toBe("#/review-queue/drafts");
    expect(composerHref()).toBe("#/composer");
    expect(composerHref("agent-kit")).toBe("#/composer/agent-kit");
    expect(composerHref("record-export")).toBe("#/composer/record-export");
    expect(exportsHref()).toBe("#/exports");
    expect(healthHref()).toBe("#/health");
  });
});
