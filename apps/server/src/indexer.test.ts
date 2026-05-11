import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { openDatabase } from "./db";
import {
  getIndexStats,
  getAgentKitHealth,
  getPackHealth,
  getReviewItems,
  getSkillHealth,
  rebuildIndex,
  searchIndex,
  updateReviewItemStatus
} from "./indexer";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const demoSkillsDir = path.join(repoRoot, "demo-skills");
const demoAgentKitsDir = path.join(repoRoot, "demo-agent-kits");
const validatorFixturesDir = path.join(repoRoot, "packages/pack-validator/test/fixtures");

describe("SQLite indexer", () => {
  it("rebuilds the index with expected demo totals", () => {
    const db = openDatabase(":memory:");

    try {
      const result = rebuildIndex(db, demoPacksDir, demoSkillsDir, demoAgentKitsDir);
      const stats = getIndexStats(db);

      expect(result).toMatchObject({
        packsIndexed: 15,
        packsSkipped: 0,
        recordsIndexed: 111,
        sourcesIndexed: 111,
        exportProfilesIndexed: 120,
        skillsIndexed: 8,
        skillsSkipped: 0,
        skillInstructionsIndexed: 24,
        skillExamplesIndexed: 16,
        skillSourcesIndexed: 24,
        skillExportProfilesIndexed: 48,
        agentKitsIndexed: 8,
        agentKitsSkipped: 0,
        agentKitContextPackRefsIndexed: 15,
        agentKitSkillRefsIndexed: 17,
        agentKitExportProfilesIndexed: 24
      });
      expect(stats).toMatchObject({
        packs: 15,
        records: 111,
        sources: 111,
        exportProfiles: 120,
        skills: 8,
        skillInstructions: 24,
        skillExamples: 16,
        skillSources: 24,
        skillExportProfiles: 48,
        agentKits: 8,
        agentKitContextPackRefs: 15,
        agentKitSkillRefs: 17,
        agentKitExportProfiles: 24,
        reviewItems: 0,
        openReviewItems: 0
      });
    } finally {
      db.close();
    }
  });

  it("is idempotent and does not duplicate indexed rows", () => {
    const db = openDatabase(":memory:");

    try {
      rebuildIndex(db, demoPacksDir, demoSkillsDir, demoAgentKitsDir);
      rebuildIndex(db, demoPacksDir, demoSkillsDir, demoAgentKitsDir);

      expect(getIndexStats(db)).toMatchObject({
        packs: 15,
        records: 111,
        sources: 111,
        exportProfiles: 120,
        skills: 8,
        skillInstructions: 24,
        skillExamples: 16,
        skillSources: 24,
        skillExportProfiles: 48,
        agentKits: 8,
        agentKitContextPackRefs: 15,
        agentKitSkillRefs: 17,
        agentKitExportProfiles: 24,
        reviewItems: 0,
        openReviewItems: 0
      });
    } finally {
      db.close();
    }
  });

  it("allows instruction and example IDs to repeat across different Skills", () => {
    const db = openDatabase(":memory:");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-skill-collision-"));
    const fixtureRoot = path.join(repoRoot, "packages/skill-validator/test/fixtures/valid-skill");
    const firstSkill = path.join(tempRoot, "valid-skill");
    const secondSkill = path.join(tempRoot, "valid-skill-copy");

    try {
      fs.cpSync(fixtureRoot, firstSkill, { recursive: true });
      fs.cpSync(fixtureRoot, secondSkill, { recursive: true });
      const manifestPath = path.join(secondSkill, "contextarr-skill.json");
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { id: string; name: string };
      manifest.id = "valid-skill-copy";
      manifest.name = "Valid Demo Skill Copy";
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

      for (const file of [path.join(secondSkill, "instructions", "core.md"), path.join(secondSkill, "examples", "good.md")]) {
        fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("skill: valid-skill", "skill: valid-skill-copy"), "utf8");
      }

      const result = rebuildIndex(db, demoPacksDir, tempRoot);

      expect(result.skillsIndexed).toBe(2);
      expect(result.skillInstructionsIndexed).toBe(2);
      expect(result.skillExamplesIndexed).toBe(2);
      expect(getIndexStats(db)).toMatchObject({
        skills: 2,
        skillInstructions: 2,
        skillExamples: 2
      });
    } finally {
      db.close();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("indexes valid packs while reporting invalid packs", () => {
    const db = openDatabase(":memory:");

    try {
      const result = rebuildIndex(db, validatorFixturesDir);

      expect(result.packsIndexed).toBeGreaterThan(1);
      expect(result.packsSkipped).toBeGreaterThan(1);
      expect(getIndexStats(db).packs).toBe(result.packsIndexed);
      expect(getReviewItems(db, { type: "validation" }).length).toBeGreaterThan(1);
    } finally {
      db.close();
    }
  });

  it("skips Agent Kits whose referenced packs or Skills are not in the loaded index", () => {
    const db = openDatabase(":memory:");

    try {
      const result = rebuildIndex(db, validatorFixturesDir, demoSkillsDir, demoAgentKitsDir);

      expect(result.agentKitsIndexed).toBe(0);
      expect(result.agentKitsSkipped).toBeGreaterThan(0);
      expect(result.skippedAgentKits).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            issues: expect.arrayContaining([
              expect.objectContaining({ code: "agent_kit_reference.unindexed_context_pack" })
            ])
          })
        ])
      );
      expect(getIndexStats(db).agentKits).toBe(0);
    } finally {
      db.close();
    }
  });

  it("reports duplicate Agent Kit IDs without aborting rebuild", () => {
    const db = openDatabase(":memory:");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-agent-kit-index-duplicates-"));

    try {
      fs.cpSync(path.join(demoAgentKitsDir, "support-ticket-writing-kit"), path.join(tempRoot, "support-ticket-writing-kit-a"), {
        recursive: true
      });
      fs.cpSync(path.join(demoAgentKitsDir, "support-ticket-writing-kit"), path.join(tempRoot, "support-ticket-writing-kit-b"), {
        recursive: true
      });

      const result = rebuildIndex(db, demoPacksDir, demoSkillsDir, tempRoot);

      expect(result.agentKitsIndexed).toBe(1);
      expect(result.agentKitsSkipped).toBe(1);
      expect(result.skippedAgentKits[0].issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: "agent_kit_manifest.duplicate_id" })])
      );
      expect(getIndexStats(db).agentKits).toBe(1);
    } finally {
      db.close();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("preserves review item statuses across rescans and resolves obsolete items", () => {
    const db = openDatabase(":memory:");

    try {
      rebuildIndex(db, validatorFixturesDir);
      const item = getReviewItems(db, { status: "open" })[0];
      expect(item).toBeDefined();

      updateReviewItemStatus(db, item.id, "ignored", "2026-05-07T00:00:00.000Z");
      rebuildIndex(db, validatorFixturesDir);

      expect(getReviewItems(db).find((candidate) => candidate.id === item.id)?.status).toBe("ignored");

      rebuildIndex(db, demoPacksDir);

      expect(getReviewItems(db).find((candidate) => candidate.id === item.id)?.status).toBe("resolved");
    } finally {
      db.close();
    }
  });

  it("tracks open review queue counts for valid unhealthy packs", () => {
    const db = openDatabase(":memory:");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-health-"));
    const packRoot = path.join(tempRoot, "valid-minimal-pack");

    try {
      fs.cpSync(path.join(validatorFixturesDir, "valid-minimal-pack"), packRoot, { recursive: true });
      const recordPath = path.join(packRoot, "records", "overview.md");
      fs.writeFileSync(
        recordPath,
        fs.readFileSync(recordPath, "utf8").replace("review_status: approved", "review_status: draft"),
        "utf8"
      );

      rebuildIndex(db, tempRoot);
      const health = getPackHealth(db, "valid-minimal-pack");

      expect(health).toMatchObject({
        packId: "valid-minimal-pack",
        reviewQueueCount: 1
      });
      expect(health?.items[0]).toMatchObject({ type: "review_status", status: "open" });

      updateReviewItemStatus(db, health!.items[0].id, "reviewed", "2026-05-07T00:00:00.000Z");

      expect(getPackHealth(db, "valid-minimal-pack")?.reviewQueueCount).toBe(0);
    } finally {
      db.close();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("tracks open review queue counts for valid unhealthy Skills", () => {
    const db = openDatabase(":memory:");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-skill-health-"));
    const skillRoot = path.join(tempRoot, "valid-skill");

    try {
      fs.cpSync(path.join(repoRoot, "packages/skill-validator/test/fixtures/valid-skill"), skillRoot, { recursive: true });
      const instructionPath = path.join(skillRoot, "instructions", "core.md");
      fs.writeFileSync(
        instructionPath,
        fs.readFileSync(instructionPath, "utf8").replace("review_status: approved", "review_status: draft"),
        "utf8"
      );

      rebuildIndex(db, demoPacksDir, tempRoot);
      const health = getSkillHealth(db, "valid-skill");
      const items = getReviewItems(db, { objectType: "skill", objectId: "valid-skill" });

      expect(health).toMatchObject({
        skillId: "valid-skill"
      });
      expect(health!.reviewQueueCount).toBeGreaterThanOrEqual(1);
      expect(health!.score).toBeLessThan(100);
      expect(health!.status).not.toBe("healthy");
      expect(items).toEqual(expect.arrayContaining([expect.objectContaining({
        objectType: "skill",
        objectId: "valid-skill",
        skillId: "valid-skill",
        type: "review_status",
        status: "open"
      })]));

      const statusItem = items.find((item) => item.type === "review_status");
      expect(statusItem).toBeDefined();
      updateReviewItemStatus(db, statusItem!.id, "ignored", "2026-05-07T00:00:00.000Z");

      const updatedHealth = getSkillHealth(db, "valid-skill");
      expect(updatedHealth?.items.find((item) => item.id === statusItem!.id)?.status).toBe("ignored");
      expect(updatedHealth?.reviewQueueCount).toBe(health!.reviewQueueCount - 1);
      expect(updatedHealth!.score).toBeGreaterThan(health!.score);
      expect(updatedHealth!.status).toBe(calculateExpectedStatus(updatedHealth!.score));
    } finally {
      db.close();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("tracks open review queue counts for valid unhealthy Agent Kits", () => {
    const db = openDatabase(":memory:");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-agent-kit-health-"));
    const agentKitRoot = path.join(tempRoot, "support-ticket-writing-kit");

    try {
      fs.cpSync(path.join(demoAgentKitsDir, "support-ticket-writing-kit"), agentKitRoot, { recursive: true });
      const manifestPath = path.join(agentKitRoot, "contextarr-agent-kit.json");
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { lastReviewedAt: string };
      manifest.lastReviewedAt = "2025-01-01T00:00:00Z";
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

      rebuildIndex(db, demoPacksDir, demoSkillsDir, tempRoot);
      const health = getAgentKitHealth(db, "support-ticket-writing-kit");
      const items = getReviewItems(db, { objectType: "agent_kit", objectId: "support-ticket-writing-kit" });

      expect(health).toMatchObject({
        agentKitId: "support-ticket-writing-kit"
      });
      expect(health!.reviewQueueCount).toBeGreaterThanOrEqual(1);
      expect(health!.score).toBeLessThan(100);
      expect(health!.status).toBe(calculateExpectedStatus(health!.score));
      expect(items).toEqual(expect.arrayContaining([expect.objectContaining({
        objectType: "agent_kit",
        objectId: "support-ticket-writing-kit",
        agentKitId: "support-ticket-writing-kit",
        type: "freshness",
        status: "open"
      })]));

      const statusItem = items.find((item) => item.type === "freshness");
      expect(statusItem).toBeDefined();
      updateReviewItemStatus(db, statusItem!.id, "ignored", "2026-05-08T00:00:00.000Z");

      const updatedHealth = getAgentKitHealth(db, "support-ticket-writing-kit");
      expect(updatedHealth?.items.find((item) => item.id === statusItem!.id)?.status).toBe("ignored");
      expect(updatedHealth?.reviewQueueCount).toBe(health!.reviewQueueCount - 1);
      expect(updatedHealth!.score).toBeGreaterThan(health!.score);
      expect(updatedHealth!.status).toBe(calculateExpectedStatus(updatedHealth!.score));
    } finally {
      db.close();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it.each(["ignored", "resolved"] as const)(
    "stops Agent Kit reference health from bubbling child review items that are %s across rescans",
    (status) => {
      const db = openDatabase(":memory:");
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `contextarr-agent-kit-${status}-reference-health-`));
      const packsRoot = path.join(tempRoot, "packs");
      const agentKitRoot = path.join(tempRoot, "agent-kits", "support-ticket-writing-kit");

      try {
        fs.mkdirSync(packsRoot, { recursive: true });
        fs.cpSync(path.join(demoPacksDir, "internal-support-kb-pack"), path.join(packsRoot, "internal-support-kb-pack"), {
          recursive: true
        });
        fs.cpSync(path.join(demoPacksDir, "fake-product-line-pack"), path.join(packsRoot, "fake-product-line-pack"), {
          recursive: true
        });
        fs.cpSync(path.join(demoAgentKitsDir, "support-ticket-writing-kit"), agentKitRoot, { recursive: true });

        const recordsDir = path.join(packsRoot, "internal-support-kb-pack", "records");
        const staleRecordPath = path.join(recordsDir, fs.readdirSync(recordsDir).find((file) => file.endsWith(".md"))!);
        const staleRecord = fs.readFileSync(staleRecordPath, "utf8").replace(/last_reviewed: .+/, "last_reviewed: 2025-01-01");
        fs.writeFileSync(staleRecordPath, staleRecord, "utf8");

        rebuildIndex(db, packsRoot, demoSkillsDir, path.dirname(agentKitRoot));
        const packFreshnessItem = getReviewItems(db, {
          objectType: "pack",
          objectId: "internal-support-kb-pack",
          type: "freshness",
          status: "open"
        }).find((item) => item.recordId);
        expect(packFreshnessItem).toBeDefined();
        expect(getReviewItems(db, {
          objectType: "agent_kit",
          objectId: "support-ticket-writing-kit",
          type: "review_status",
          status: "open"
        })).toEqual(expect.arrayContaining([expect.objectContaining({
          message: expect.stringContaining("internal-support-kb-pack")
        })]));

        updateReviewItemStatus(db, packFreshnessItem!.id, status, "2026-05-08T00:00:00.000Z");
        rebuildIndex(db, packsRoot, demoSkillsDir, path.dirname(agentKitRoot));

        expect(getReviewItems(db).find((item) => item.id === packFreshnessItem!.id)?.status).toBe(status);
        expect(getReviewItems(db, {
          objectType: "agent_kit",
          objectId: "support-ticket-writing-kit",
          type: "review_status",
          status: "open"
        }).filter((item) => item.message.includes("internal-support-kb-pack"))).toEqual([]);

        const health = getAgentKitHealth(db, "support-ticket-writing-kit");
        expect(health?.items.filter((item) => item.status === "open" && item.message.includes("internal-support-kb-pack"))).toEqual([]);
      } finally {
        db.close();
        fs.rmSync(tempRoot, { recursive: true, force: true });
      }
    }
  );

  it.each(["accepted", "reviewed"] as const)(
    "keeps Agent Kit reference health active when child review items are %s across rescans",
    (status) => {
      const db = openDatabase(":memory:");
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `contextarr-agent-kit-${status}-reference-`));
      const packsRoot = path.join(tempRoot, "packs");
      const agentKitRoot = path.join(tempRoot, "agent-kits", "support-ticket-writing-kit");

      try {
        fs.mkdirSync(packsRoot, { recursive: true });
        fs.cpSync(path.join(demoPacksDir, "internal-support-kb-pack"), path.join(packsRoot, "internal-support-kb-pack"), {
          recursive: true
        });
        fs.cpSync(path.join(demoPacksDir, "fake-product-line-pack"), path.join(packsRoot, "fake-product-line-pack"), {
          recursive: true
        });
        fs.cpSync(path.join(demoAgentKitsDir, "support-ticket-writing-kit"), agentKitRoot, { recursive: true });

        const recordsDir = path.join(packsRoot, "internal-support-kb-pack", "records");
        const staleRecordPath = path.join(recordsDir, fs.readdirSync(recordsDir).find((file) => file.endsWith(".md"))!);
        const staleRecord = fs.readFileSync(staleRecordPath, "utf8").replace(/last_reviewed: .+/, "last_reviewed: 2025-01-01");
        fs.writeFileSync(staleRecordPath, staleRecord, "utf8");

        rebuildIndex(db, packsRoot, demoSkillsDir, path.dirname(agentKitRoot));
        const packFreshnessItem = getReviewItems(db, {
          objectType: "pack",
          objectId: "internal-support-kb-pack",
          type: "freshness",
          status: "open"
        }).find((item) => item.recordId);
        expect(packFreshnessItem).toBeDefined();

        updateReviewItemStatus(db, packFreshnessItem!.id, status, "2026-05-08T00:00:00.000Z");
        rebuildIndex(db, packsRoot, demoSkillsDir, path.dirname(agentKitRoot));

        expect(getReviewItems(db).find((item) => item.id === packFreshnessItem!.id)?.status).toBe(status);
        const agentKitReferenceItems = getReviewItems(db, {
          objectType: "agent_kit",
          objectId: "support-ticket-writing-kit",
          type: "review_status",
          status: "open"
        }).filter((item) => item.message.includes("internal-support-kb-pack"));
        expect(agentKitReferenceItems).toEqual([expect.objectContaining({
          message: expect.stringContaining("active accepted/reviewed review item")
        })]);

        const health = getAgentKitHealth(db, "support-ticket-writing-kit");
        expect(health?.score).toBeLessThan(100);
        expect(health?.items).toEqual(expect.arrayContaining([expect.objectContaining({
          type: "review_status",
          status: "open",
          metadata: expect.objectContaining({
            activeIssueCount: 1,
            reviewQueueCount: 0
          })
        })]));
      } finally {
        db.close();
        fs.rmSync(tempRoot, { recursive: true, force: true });
      }
    }
  );

  it("uses persisted child Skill review item statuses for Agent Kit reference health on rescan", () => {
    const db = openDatabase(":memory:");
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-agent-kit-skill-reference-health-"));
    const skillsRoot = path.join(tempRoot, "skills");
    const agentKitRoot = path.join(tempRoot, "agent-kits", "support-ticket-writing-kit");

    try {
      fs.mkdirSync(skillsRoot, { recursive: true });
      fs.cpSync(path.join(demoSkillsDir, "support-ticket-writing-skill"), path.join(skillsRoot, "support-ticket-writing-skill"), {
        recursive: true
      });
      fs.cpSync(path.join(demoSkillsDir, "bug-report-structuring-skill"), path.join(skillsRoot, "bug-report-structuring-skill"), {
        recursive: true
      });
      fs.cpSync(path.join(demoAgentKitsDir, "support-ticket-writing-kit"), agentKitRoot, { recursive: true });

      const instructionsDir = path.join(skillsRoot, "support-ticket-writing-skill", "instructions");
      const draftInstructionPath = path.join(instructionsDir, fs.readdirSync(instructionsDir).find((file) => file.endsWith(".md"))!);
      const draftInstruction = fs.readFileSync(draftInstructionPath, "utf8").replace("review_status: approved", "review_status: draft");
      fs.writeFileSync(draftInstructionPath, draftInstruction, "utf8");

      rebuildIndex(db, demoPacksDir, skillsRoot, path.dirname(agentKitRoot));
      const skillStatusItem = getReviewItems(db, {
        objectType: "skill",
        objectId: "support-ticket-writing-skill",
        type: "review_status",
        status: "open"
      }).find((item) => item.recordId);
      expect(skillStatusItem).toBeDefined();
      expect(getReviewItems(db, {
        objectType: "agent_kit",
        objectId: "support-ticket-writing-kit",
        type: "review_status",
        status: "open"
      })).toEqual(expect.arrayContaining([expect.objectContaining({
        message: expect.stringContaining("support-ticket-writing-skill")
      })]));

      updateReviewItemStatus(db, skillStatusItem!.id, "resolved", "2026-05-08T00:00:00.000Z");
      rebuildIndex(db, demoPacksDir, skillsRoot, path.dirname(agentKitRoot));

      expect(getReviewItems(db).find((item) => item.id === skillStatusItem!.id)?.status).toBe("resolved");
      expect(getReviewItems(db, {
        objectType: "agent_kit",
        objectId: "support-ticket-writing-kit",
        type: "review_status",
        status: "open"
      }).filter((item) => item.message.includes("support-ticket-writing-skill"))).toEqual([]);
    } finally {
      db.close();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("searches record title, body, and tags with FTS", () => {
    const db = openDatabase(":memory:");

    try {
      rebuildIndex(db, demoPacksDir, demoSkillsDir);
      const results = searchIndex(db, "workstation");

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "record",
            packId: "ai-workstation-pack"
          })
        ])
      );
    } finally {
      db.close();
    }
  });

  it("searches Skill names and instruction bodies with Skill search scope", () => {
    const db = openDatabase(":memory:");

    try {
      rebuildIndex(db, demoPacksDir, demoSkillsDir);
      const results = searchIndex(db, "support", "skill");

      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "skill",
            id: "support-ticket-writing-skill"
          }),
          expect.objectContaining({
            kind: "skill_instruction",
            skillId: "support-ticket-writing-skill"
          })
        ])
      );
      expect(results.every((result) => String((result as { kind: string }).kind).startsWith("skill"))).toBe(true);
    } finally {
      db.close();
    }
  });

  it("searches Agent Kit names, targets, Skills, and Context Pack references with Agent Kit scope", () => {
    const db = openDatabase(":memory:");

    try {
      rebuildIndex(db, demoPacksDir, demoSkillsDir, demoAgentKitsDir);

      expect(searchIndex(db, "ticket", "agent-kit")).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "agent-kit",
            id: "support-ticket-writing-kit"
          })
        ])
      );
      expect(searchIndex(db, "codex", "agent-kit")).toEqual(
        expect.arrayContaining([expect.objectContaining({ kind: "agent-kit", target: "codex" })])
      );
      expect(searchIndex(db, "bug-report-structuring-skill", "agent-kit")).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: "support-ticket-writing-kit" })])
      );
      expect(searchIndex(db, "fake-product-line-pack", "agent-kit")).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: "support-ticket-writing-kit" })])
      );
      expect(searchIndex(db, "ticket", "agent-kit").every((result) => (result as { kind: string }).kind === "agent-kit")).toBe(true);
    } finally {
      db.close();
    }
  });

  it("returns array results without throwing for punctuation-heavy searches", () => {
    const db = openDatabase(":memory:");

    try {
      rebuildIndex(db, demoPacksDir, demoSkillsDir, demoAgentKitsDir);

      for (const query of ["workstation", "C++", "tag:ai", "local-ai", "ai/workstation", "?", "\"quoted\""]) {
        expect(() => searchIndex(db, query)).not.toThrow();
        expect(Array.isArray(searchIndex(db, query))).toBe(true);
        expect(() => searchIndex(db, query, "agent-kit")).not.toThrow();
        expect(Array.isArray(searchIndex(db, query, "agent-kit"))).toBe(true);
      }
    } finally {
      db.close();
    }
  });
});

function calculateExpectedStatus(score: number): string {
  if (score >= 90) {
    return "healthy";
  }

  return score >= 70 ? "degraded" : "needs_review";
}
