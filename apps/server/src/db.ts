import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type ContextarrDatabase = Database.Database;

export function openDatabase(databasePath: string): ContextarrDatabase {
  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  createSchema(db);
  return db;
}

export function createSchema(db: ContextarrDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS packs (
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

    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      tags_text TEXT NOT NULL,
      confidence TEXT NOT NULL,
      source_status TEXT NOT NULL,
      freshness TEXT NOT NULL,
      privacy TEXT NOT NULL,
      last_reviewed TEXT,
      review_status TEXT NOT NULL,
      sources_json TEXT NOT NULL,
      body TEXT NOT NULL,
      file_path TEXT NOT NULL,
      metadata_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT NOT NULL,
      pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      path TEXT,
      retrieved_at TEXT,
      license TEXT,
      trust TEXT,
      status TEXT,
      source_json TEXT NOT NULL,
      PRIMARY KEY (pack_id, id)
    );

    CREATE TABLE IF NOT EXISTS export_profiles (
      id TEXT NOT NULL,
      pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      target TEXT NOT NULL,
      format TEXT NOT NULL,
      privacy_mode TEXT,
      token_budget INTEGER,
      profile_json TEXT NOT NULL,
      PRIMARY KEY (pack_id, id)
    );

    CREATE TABLE IF NOT EXISTS pack_health (
      pack_id TEXT PRIMARY KEY REFERENCES packs(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      status TEXT NOT NULL,
      validation_errors INTEGER NOT NULL,
      validation_warnings INTEGER NOT NULL,
      record_count INTEGER NOT NULL,
      source_count INTEGER NOT NULL,
      export_profile_count INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      metadata_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS records_fts USING fts5(
      record_id UNINDEXED,
      pack_id UNINDEXED,
      title,
      body,
      tags
    );
  `);
}

export function clearDerivedIndex(db: ContextarrDatabase): void {
  db.exec(`
    DELETE FROM records_fts;
    DELETE FROM export_profiles;
    DELETE FROM sources;
    DELETE FROM records;
    DELETE FROM pack_health;
    DELETE FROM packs;
  `);
}
