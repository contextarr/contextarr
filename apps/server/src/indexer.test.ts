import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { openDatabase } from "./db";
import { getIndexStats, getPackHealth, getReviewItems, rebuildIndex, searchIndex, updateReviewItemStatus } from "./indexer";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const validatorFixturesDir = path.join(repoRoot, "packages/pack-validator/test/fixtures");

describe("SQLite indexer", () => {
  it("rebuilds the index with expected demo totals", () => {
    const db = openDatabase(":memory:");

    try {
      const result = rebuildIndex(db, demoPacksDir);
      const stats = getIndexStats(db);

      expect(result).toMatchObject({
        packsIndexed: 5,
        packsSkipped: 0,
        recordsIndexed: 25,
        sourcesIndexed: 25,
        exportProfilesIndexed: 15
      });
      expect(stats).toMatchObject({
        packs: 5,
        records: 25,
        sources: 25,
        exportProfiles: 15,
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
      rebuildIndex(db, demoPacksDir);
      rebuildIndex(db, demoPacksDir);

      expect(getIndexStats(db)).toMatchObject({
        packs: 5,
        records: 25,
        sources: 25,
        exportProfiles: 15,
        reviewItems: 0,
        openReviewItems: 0
      });
    } finally {
      db.close();
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
      rebuildIndex(db, demoPacksDir);
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

  it("returns array results without throwing for punctuation-heavy searches", () => {
    const db = openDatabase(":memory:");

    try {
      rebuildIndex(db, demoPacksDir);

      for (const query of ["workstation", "C++", "tag:ai", "local-ai", "ai/workstation", "?", "\"quoted\""]) {
        expect(() => searchIndex(db, query)).not.toThrow();
        expect(Array.isArray(searchIndex(db, query))).toBe(true);
      }
    } finally {
      db.close();
    }
  });
});
