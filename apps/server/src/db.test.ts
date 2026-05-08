import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { createSchema } from "./db";

describe("SQLite schema migrations", () => {
  it("adds Phase 3.1 pack columns to an existing Phase 3 database", () => {
    const db = new Database(":memory:");

    try {
      db.exec(`
        CREATE TABLE packs (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          version TEXT NOT NULL,
          description TEXT NOT NULL,
          type TEXT NOT NULL,
          visibility TEXT NOT NULL,
          trust_level TEXT NOT NULL,
          author TEXT NOT NULL,
          license TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          last_reviewed_at TEXT,
          contains_personal_data INTEGER NOT NULL,
          contains_executable_code INTEGER NOT NULL,
          requires_network INTEGER NOT NULL,
          accent_color TEXT,
          pack_path TEXT NOT NULL,
          manifest_json TEXT NOT NULL,
          validation_errors INTEGER NOT NULL,
          validation_warnings INTEGER NOT NULL,
          health_score INTEGER NOT NULL,
          health_status TEXT NOT NULL,
          record_count INTEGER NOT NULL,
          source_count INTEGER NOT NULL,
          export_profile_count INTEGER NOT NULL,
          indexed_at TEXT NOT NULL
        );
      `);

      createSchema(db);

      const columns = db.prepare("PRAGMA table_info(packs)").all() as Array<{ name: string }>;
      expect(columns.map((column) => column.name)).toEqual(
        expect.arrayContaining(["cover_image", "review_queue_count"])
      );
      expect(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'review_items'").get()).toBeTruthy();
    } finally {
      db.close();
    }
  });

  it("recreates legacy Skill document tables with per-Skill composite keys", () => {
    const db = new Database(":memory:");

    try {
      db.exec(`
        CREATE TABLE skill_instructions (
          id TEXT PRIMARY KEY,
          skill_id TEXT NOT NULL
        );

        CREATE TABLE skill_examples (
          id TEXT PRIMARY KEY,
          skill_id TEXT NOT NULL
        );
      `);

      createSchema(db);
      createSchema(db);

      const instructionColumns = db.prepare("PRAGMA table_info(skill_instructions)").all() as Array<{
        name: string;
        pk: number;
      }>;
      const exampleColumns = db.prepare("PRAGMA table_info(skill_examples)").all() as Array<{ name: string; pk: number }>;

      expect(instructionColumns.find((column) => column.name === "skill_id")?.pk).toBeGreaterThan(0);
      expect(instructionColumns.find((column) => column.name === "id")?.pk).toBeGreaterThan(0);
      expect(exampleColumns.find((column) => column.name === "skill_id")?.pk).toBeGreaterThan(0);
      expect(exampleColumns.find((column) => column.name === "id")?.pk).toBeGreaterThan(0);
      expect(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'skills_fts'").get()).toBeTruthy();
    } finally {
      db.close();
    }
  });
});
