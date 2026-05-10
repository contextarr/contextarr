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
        expect.arrayContaining(["cover_image", "brand_id", "cover_recipe", "logo_variant", "review_queue_count"])
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

  it("adds object-aware review item columns to an existing Phase 6 database", () => {
    const db = new Database(":memory:");

    try {
      db.exec(`
        CREATE TABLE review_items (
          id TEXT PRIMARY KEY,
          fingerprint TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL,
          severity TEXT NOT NULL,
          pack_id TEXT NOT NULL,
          record_id TEXT,
          source_id TEXT,
          message TEXT NOT NULL,
          suggested_action TEXT NOT NULL,
          status TEXT NOT NULL,
          first_seen_at TEXT NOT NULL,
          last_seen_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          metadata_json TEXT NOT NULL
        );

        INSERT INTO review_items (
          id, fingerprint, type, severity, pack_id, record_id, source_id,
          message, suggested_action, status, first_seen_at, last_seen_at,
          updated_at, metadata_json
        ) VALUES (
          'ri_legacy', 'legacy-fingerprint', 'validation', 'warning', 'legacy-pack',
          NULL, NULL, 'Legacy item', 'Review it', 'open',
          '2026-05-07T00:00:00.000Z', '2026-05-07T00:00:00.000Z',
          '2026-05-07T00:00:00.000Z', '{}'
        );
      `);

      createSchema(db);

      const columns = db.prepare("PRAGMA table_info(review_items)").all() as Array<{ name: string }>;
      expect(columns.map((column) => column.name)).toEqual(
        expect.arrayContaining(["object_type", "object_id", "skill_id", "agent_kit_id"])
      );
      expect(
        db.prepare("SELECT object_type AS objectType, object_id AS objectId FROM review_items WHERE id = ?").get("ri_legacy")
      ).toEqual({
        objectType: "pack",
        objectId: "legacy-pack"
      });
      expect(
        db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_review_items_object'").get()
      ).toBeTruthy();
    } finally {
      db.close();
    }
  });

  it("creates Phase 21 Agent Kit tables and FTS search table", () => {
    const db = new Database(":memory:");

    try {
      createSchema(db);

      const expectedTables = [
        "agent_kits",
        "agent_kit_context_packs",
        "agent_kit_skills",
        "agent_kit_export_profiles",
        "agent_kits_fts"
      ];
      for (const table of expectedTables) {
        expect(db.prepare("SELECT name FROM sqlite_master WHERE name = ?").get(table)).toBeTruthy();
      }
      const agentKitColumns = db.prepare("PRAGMA table_info(agent_kits)").all() as Array<{ name: string }>;
      expect(agentKitColumns.map((column) => column.name)).toEqual(
        expect.arrayContaining(["target", "privacy_mode", "token_budget", "context_pack_count", "skill_count"])
      );
      const contextPackForeignKeys = db.prepare("PRAGMA foreign_key_list(agent_kit_context_packs)").all() as Array<{
        table: string;
        on_delete: string;
      }>;
      expect(contextPackForeignKeys).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ table: "agent_kits", on_delete: "CASCADE" }),
          expect.objectContaining({ table: "packs", on_delete: "CASCADE" })
        ])
      );
      const skillForeignKeys = db.prepare("PRAGMA foreign_key_list(agent_kit_skills)").all() as Array<{
        table: string;
        on_delete: string;
      }>;
      expect(skillForeignKeys).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ table: "agent_kits", on_delete: "CASCADE" }),
          expect.objectContaining({ table: "skills", on_delete: "CASCADE" })
        ])
      );
      expect(
        db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_agent_kit_context_packs_pack'").get()
      ).toBeTruthy();
      expect(
        db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_agent_kit_skills_skill'").get()
      ).toBeTruthy();
    } finally {
      db.close();
    }
  });
});
