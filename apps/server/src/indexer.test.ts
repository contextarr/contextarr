import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { openDatabase } from "./db";
import { getIndexStats, rebuildIndex, searchIndex } from "./indexer";

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
        exportProfiles: 15
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
        exportProfiles: 15
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
    } finally {
      db.close();
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
