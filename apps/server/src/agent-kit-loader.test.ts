import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadAgentKits } from "./agent-kit-loader";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const demoSkillsDir = path.join(repoRoot, "demo-skills");
const demoAgentKitsDir = path.join(repoRoot, "demo-agent-kits");

describe("loadAgentKits", () => {
  it("loads all eight demo Agent Kits", () => {
    const result = loadAgentKits(demoAgentKitsDir, { contextPacksDir: demoPacksDir, skillsDir: demoSkillsDir });

    expect(result.skipped).toHaveLength(0);
    expect(result.agentKits.map((kit) => kit.manifest.id).sort()).toEqual(
      [
        "claude-code-implementation-kit",
        "contextarr-renderer-implementation-kit",
        "contractor-handoff-kit",
        "homelab-troubleshooting-kit",
        "internal-kb-answering-kit",
        "product-research-kit",
        "security-review-kit",
        "support-ticket-writing-kit"
      ].sort()
    );
  });

  it("loads expected demo Agent Kit relationship totals", () => {
    const result = loadAgentKits(demoAgentKitsDir, { contextPacksDir: demoPacksDir, skillsDir: demoSkillsDir });

    expect(result.agentKits.reduce((count, kit) => count + kit.manifest.contextPacks.length, 0)).toBe(15);
    expect(result.agentKits.reduce((count, kit) => count + kit.manifest.skills.length, 0)).toBe(17);
    expect(result.agentKits.reduce((count, kit) => count + kit.exportProfiles.length, 0)).toBe(24);
  });

  it("preserves manifest target, selected export profile, and known references", () => {
    const result = loadAgentKits(demoAgentKitsDir, { contextPacksDir: demoPacksDir, skillsDir: demoSkillsDir });
    const kit = result.agentKits.find((candidate) => candidate.manifest.id === "support-ticket-writing-kit");

    expect(kit?.manifest).toMatchObject({
      target: "codex",
      exportProfile: "support-ticket-writing-kit-codex",
      contextPacks: ["internal-support-kb-pack", "fake-product-line-pack"],
      skills: ["support-ticket-writing-skill", "bug-report-structuring-skill"]
    });
    expect(kit?.exportProfiles.map((profile) => profile.id).sort()).toEqual([
      "support-ticket-writing-kit-chatgpt",
      "support-ticket-writing-kit-claude",
      "support-ticket-writing-kit-codex"
    ]);
  });

  it("skips invalid Agent Kits without failing the whole load", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-agent-kits-"));
    const validKit = path.join(tempRoot, "contextarr-renderer-implementation-kit");
    const invalidKit = path.join(tempRoot, "invalid-agent-kit");

    try {
      fs.cpSync(path.join(demoAgentKitsDir, "contextarr-renderer-implementation-kit"), validKit, { recursive: true });
      fs.cpSync(path.join(demoAgentKitsDir, "support-ticket-writing-kit"), invalidKit, { recursive: true });
      fs.rmSync(path.join(invalidKit, "contextarr-agent-kit.json"), { force: true });

      const result = loadAgentKits(tempRoot, { contextPacksDir: demoPacksDir, skillsDir: demoSkillsDir });

      expect(result.agentKits.map((kit) => kit.manifest.id)).toEqual(["contextarr-renderer-implementation-kit"]);
      expect(result.skipped).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            issues: expect.arrayContaining([expect.objectContaining({ code: "agent_kit_manifest.missing" })])
          })
        ])
      );
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("skips duplicate Agent Kit IDs without aborting the load", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-agent-kit-duplicates-"));
    const firstKit = path.join(tempRoot, "support-ticket-writing-kit-a");
    const secondKit = path.join(tempRoot, "support-ticket-writing-kit-b");

    try {
      fs.cpSync(path.join(demoAgentKitsDir, "support-ticket-writing-kit"), firstKit, { recursive: true });
      fs.cpSync(path.join(demoAgentKitsDir, "support-ticket-writing-kit"), secondKit, { recursive: true });

      const result = loadAgentKits(tempRoot, { contextPacksDir: demoPacksDir, skillsDir: demoSkillsDir });

      expect(result.agentKits).toHaveLength(1);
      expect(result.skipped).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            agentKitId: "support-ticket-writing-kit",
            issues: expect.arrayContaining([expect.objectContaining({ code: "agent_kit_manifest.duplicate_id" })])
          })
        ])
      );
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("skips Agent Kits with duplicate export profile IDs without aborting the load", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-agent-kit-profile-duplicates-"));
    const kitRoot = path.join(tempRoot, "support-ticket-writing-kit");

    try {
      fs.cpSync(path.join(demoAgentKitsDir, "support-ticket-writing-kit"), kitRoot, { recursive: true });
      fs.copyFileSync(path.join(kitRoot, "exports", "codex.yaml"), path.join(kitRoot, "exports", "codex-copy.yaml"));

      const result = loadAgentKits(tempRoot, { contextPacksDir: demoPacksDir, skillsDir: demoSkillsDir });

      expect(result.agentKits).toHaveLength(0);
      expect(result.skipped).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            agentKitId: "support-ticket-writing-kit",
            issues: expect.arrayContaining([expect.objectContaining({ code: "agent_kit_export_profile.duplicate_id" })])
          })
        ])
      );
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("reports a missing Agent Kits directory without throwing", () => {
    const result = loadAgentKits(path.join(os.tmpdir(), "contextarr-agent-kits-does-not-exist"));

    expect(result.agentKits).toHaveLength(0);
    expect(result.skipped).toEqual(
      expect.arrayContaining([expect.objectContaining({ issues: [expect.objectContaining({ code: "agent_kits_dir.missing" })] })])
    );
  });
});
