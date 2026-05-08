import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { openDatabase } from "./db";
import { getIndexStats, getPackHealth, getReviewItems, rebuildIndex, searchIndex, updateReviewItemStatus } from "./indexer";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const demoSkillsDir = path.join(repoRoot, "demo-skills");
const validatorFixturesDir = path.join(repoRoot, "packages/pack-validator/test/fixtures");

describe("SQLite indexer", () => {
  it("rebuilds the index with expected demo totals", () => {
    const db = openDatabase(":memory:");

    try {
      const result = rebuildIndex(db, demoPacksDir, demoSkillsDir);
      const stats = getIndexStats(db);

      expect(result).toMatchObject({
        packsIndexed: 5,
        packsSkipped: 0,
        recordsIndexed: 25,
        sourcesIndexed: 25,
        exportProfilesIndexed: 25,
        skillsIndexed: 8,
        skillsSkipped: 0,
        skillInstructionsIndexed: 24,
        skillExamplesIndexed: 16,
        skillSourcesIndexed: 24,
        skillExportProfilesIndexed: 32
      });
      expect(stats).toMatchObject({
        packs: 5,
        records: 25,
        sources: 25,
        exportProfiles: 25,
        skills: 8,
        skillInstructions: 24,
        skillExamples: 16,
        skillSources: 24,
        skillExportProfiles: 32,
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
      rebuildIndex(db, demoPacksDir, demoSkillsDir);
      rebuildIndex(db, demoPacksDir, demoSkillsDir);

      expect(getIndexStats(db)).toMatchObject({
        packs: 5,
        records: 25,
        sources: 25,
        exportProfiles: 25,
        skills: 8,
        skillInstructions: 24,
        skillExamples: 16,
        skillSources: 24,
        skillExportProfiles: 32,
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

      expect(result.packsIndexed).toBe(1);
      expect(result.packsSkipped).toBeGreaterThan(1);
      expect(getIndexStats(db).packs).toBe(1);
      expect(getReviewItems(db, { type: "validation" }).length).toBeGreaterThan(1);
    } finally {
      db.close();
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

  it("returns array results without throwing for punctuation-heavy searches", () => {
    const db = openDatabase(":memory:");

    try {
      rebuildIndex(db, demoPacksDir, demoSkillsDir);

      for (const query of ["workstation", "C++", "tag:ai", "local-ai", "ai/workstation", "?", "\"quoted\""]) {
        expect(() => searchIndex(db, query)).not.toThrow();
        expect(Array.isArray(searchIndex(db, query))).toBe(true);
      }
    } finally {
      db.close();
    }
  });
});
