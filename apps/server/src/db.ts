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
  dropLegacySkillIndexTables(db);

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
      cover_image TEXT,
      brand_id TEXT,
      cover_recipe TEXT,
      logo_variant TEXT,
      starter_pack INTEGER NOT NULL DEFAULT 0,
      starter_category TEXT,
      starter_sort_order INTEGER,
      pack_path TEXT NOT NULL,
      manifest_json TEXT NOT NULL,
      validation_status TEXT NOT NULL DEFAULT 'valid',
      export_readiness TEXT NOT NULL DEFAULT 'ready',
      validation_errors INTEGER NOT NULL,
      validation_warnings INTEGER NOT NULL,
      redaction_warning_count INTEGER NOT NULL DEFAULT 0,
      stale_source_count INTEGER NOT NULL DEFAULT 0,
      license_warning_count INTEGER NOT NULL DEFAULT 0,
      license_missing_count INTEGER NOT NULL DEFAULT 0,
      license_unknown_count INTEGER NOT NULL DEFAULT 0,
      license_risk_count INTEGER NOT NULL DEFAULT 0,
      health_score INTEGER NOT NULL,
      health_status TEXT NOT NULL,
      record_count INTEGER NOT NULL,
      source_count INTEGER NOT NULL,
      export_profile_count INTEGER NOT NULL,
      review_queue_count INTEGER NOT NULL DEFAULT 0,
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
      redaction_warning_count INTEGER NOT NULL DEFAULT 0,
      stale_source_count INTEGER NOT NULL DEFAULT 0,
      license_warning_count INTEGER NOT NULL DEFAULT 0,
      license_missing_count INTEGER NOT NULL DEFAULT 0,
      license_unknown_count INTEGER NOT NULL DEFAULT 0,
      license_risk_count INTEGER NOT NULL DEFAULT 0,
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
      license_status TEXT NOT NULL DEFAULT 'unknown',
      license_url TEXT,
      license_notes TEXT,
      content_hash_algorithm TEXT,
      content_hash TEXT,
      hash_calculated_at TEXT,
      last_checked_at TEXT,
      stale_after_days INTEGER,
      stale_reason TEXT,
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
      readiness_status TEXT NOT NULL DEFAULT 'ready',
      readiness_warning_codes_json TEXT NOT NULL DEFAULT '[]',
      readiness_blocking_codes_json TEXT NOT NULL DEFAULT '[]',
      profile_json TEXT NOT NULL,
      PRIMARY KEY (pack_id, id)
    );

    CREATE TABLE IF NOT EXISTS skills (
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
      cover_image TEXT,
      skill_path TEXT NOT NULL,
      manifest_json TEXT NOT NULL,
      validation_errors INTEGER NOT NULL,
      validation_warnings INTEGER NOT NULL,
      health_score INTEGER NOT NULL,
      health_status TEXT NOT NULL,
      instruction_count INTEGER NOT NULL,
      example_count INTEGER NOT NULL,
      source_count INTEGER NOT NULL,
      export_profile_count INTEGER NOT NULL,
      review_queue_count INTEGER NOT NULL DEFAULT 0,
      targets_json TEXT NOT NULL,
      inputs_json TEXT NOT NULL,
      outputs_json TEXT NOT NULL,
      indexed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS skill_instructions (
      id TEXT NOT NULL,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
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
      metadata_json TEXT NOT NULL,
      PRIMARY KEY (skill_id, id)
    );

    CREATE TABLE IF NOT EXISTS skill_examples (
      id TEXT NOT NULL,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
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
      metadata_json TEXT NOT NULL,
      PRIMARY KEY (skill_id, id)
    );

    CREATE TABLE IF NOT EXISTS skill_sources (
      id TEXT NOT NULL,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      path TEXT,
      retrieved_at TEXT,
      license TEXT,
      trust TEXT,
      status TEXT,
      source_json TEXT NOT NULL,
      PRIMARY KEY (skill_id, id)
    );

    CREATE TABLE IF NOT EXISTS skill_export_profiles (
      id TEXT NOT NULL,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      target TEXT NOT NULL,
      format TEXT NOT NULL,
      privacy_mode TEXT,
      token_budget INTEGER,
      profile_json TEXT NOT NULL,
      PRIMARY KEY (skill_id, id)
    );

    CREATE TABLE IF NOT EXISTS agent_kits (
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
      cover_image TEXT,
      agent_kit_path TEXT NOT NULL,
      manifest_json TEXT NOT NULL,
      validation_errors INTEGER NOT NULL,
      validation_warnings INTEGER NOT NULL,
      health_score INTEGER NOT NULL,
      health_status TEXT NOT NULL,
      context_pack_count INTEGER NOT NULL,
      skill_count INTEGER NOT NULL,
      export_profile_count INTEGER NOT NULL,
      review_queue_count INTEGER NOT NULL DEFAULT 0,
      target TEXT NOT NULL,
      privacy_mode TEXT NOT NULL,
      token_budget INTEGER,
      indexed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_kit_context_packs (
      agent_kit_id TEXT NOT NULL REFERENCES agent_kits(id) ON DELETE CASCADE,
      pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (agent_kit_id, pack_id)
    );

    CREATE TABLE IF NOT EXISTS agent_kit_skills (
      agent_kit_id TEXT NOT NULL REFERENCES agent_kits(id) ON DELETE CASCADE,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (agent_kit_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS agent_kit_export_profiles (
      id TEXT NOT NULL,
      agent_kit_id TEXT NOT NULL REFERENCES agent_kits(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      target TEXT NOT NULL,
      format TEXT NOT NULL,
      privacy_mode TEXT,
      token_budget INTEGER,
      profile_json TEXT NOT NULL,
      PRIMARY KEY (agent_kit_id, id)
    );

    CREATE TABLE IF NOT EXISTS pack_health (
      pack_id TEXT PRIMARY KEY REFERENCES packs(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      status TEXT NOT NULL,
      validation_errors INTEGER NOT NULL,
      validation_warnings INTEGER NOT NULL,
      validation_status TEXT NOT NULL DEFAULT 'valid',
      export_readiness TEXT NOT NULL DEFAULT 'ready',
      redaction_warning_count INTEGER NOT NULL DEFAULT 0,
      stale_source_count INTEGER NOT NULL DEFAULT 0,
      license_warning_count INTEGER NOT NULL DEFAULT 0,
      license_missing_count INTEGER NOT NULL DEFAULT 0,
      license_unknown_count INTEGER NOT NULL DEFAULT 0,
      license_risk_count INTEGER NOT NULL DEFAULT 0,
      record_count INTEGER NOT NULL,
      source_count INTEGER NOT NULL,
      export_profile_count INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS review_items (
      id TEXT PRIMARY KEY,
      fingerprint TEXT NOT NULL UNIQUE,
      object_type TEXT NOT NULL DEFAULT 'pack',
      object_id TEXT,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      pack_id TEXT NOT NULL,
      skill_id TEXT,
      agent_kit_id TEXT,
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

    CREATE INDEX IF NOT EXISTS idx_review_items_status ON review_items(status);
    CREATE INDEX IF NOT EXISTS idx_review_items_pack ON review_items(pack_id);
    CREATE INDEX IF NOT EXISTS idx_review_items_last_seen ON review_items(last_seen_at);

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

    CREATE TABLE IF NOT EXISTS mcp_query_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool TEXT NOT NULL,
      pack_id TEXT,
      record_id TEXT,
      profile_id TEXT,
      status TEXT NOT NULL,
      result_count INTEGER NOT NULL,
      query_hash TEXT,
      query_length INTEGER,
      duration_ms INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      metadata_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS export_briefs (
      id TEXT PRIMARY KEY,
      object_type TEXT NOT NULL,
      object_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      target TEXT NOT NULL,
      format TEXT NOT NULL,
      privacy_mode TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      byte_length INTEGER NOT NULL,
      estimated_tokens INTEGER NOT NULL,
      included_count INTEGER NOT NULL,
      excluded_count INTEGER NOT NULL,
      source_count INTEGER NOT NULL,
      warning_count INTEGER NOT NULL,
      warning_codes_json TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      saved_at TEXT NOT NULL,
      content_snapshot TEXT,
      content_snapshot_truncated INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS review_candidate_activations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proof_id TEXT NOT NULL UNIQUE,
      candidate_key TEXT NOT NULL,
      pack_id TEXT NOT NULL,
      name TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      source_label TEXT NOT NULL,
      source_path_label TEXT NOT NULL,
      target_path_label TEXT NOT NULL,
      mode TEXT NOT NULL,
      status TEXT NOT NULL,
      activated_at TEXT NOT NULL,
      index_refreshed_at TEXT,
      validation_json TEXT NOT NULL,
      security_json TEXT NOT NULL,
      warnings_json TEXT NOT NULL,
      effects_json TEXT NOT NULL,
      activation_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_mcp_query_log_tool ON mcp_query_log(tool);
    CREATE INDEX IF NOT EXISTS idx_mcp_query_log_created_at ON mcp_query_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_export_briefs_object ON export_briefs(object_type, object_id);
    CREATE INDEX IF NOT EXISTS idx_export_briefs_saved_at ON export_briefs(saved_at);
    CREATE INDEX IF NOT EXISTS idx_review_candidate_activations_pack ON review_candidate_activations(pack_id);
    CREATE INDEX IF NOT EXISTS idx_review_candidate_activations_candidate ON review_candidate_activations(candidate_key);
    CREATE INDEX IF NOT EXISTS idx_review_candidate_activations_activated_at ON review_candidate_activations(activated_at);

    CREATE VIRTUAL TABLE IF NOT EXISTS records_fts USING fts5(
      record_id UNINDEXED,
      pack_id UNINDEXED,
      title,
      body,
      tags
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
      item_id UNINDEXED,
      skill_id UNINDEXED,
      kind UNINDEXED,
      title,
      body,
      tags
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS agent_kits_fts USING fts5(
      agent_kit_id UNINDEXED,
      title,
      body,
      tags
    );
  `);

  ensureColumn(db, "packs", "cover_image", "TEXT");
  ensureColumn(db, "packs", "brand_id", "TEXT");
  ensureColumn(db, "packs", "cover_recipe", "TEXT");
  ensureColumn(db, "packs", "logo_variant", "TEXT");
  ensureColumn(db, "packs", "starter_pack", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "packs", "starter_category", "TEXT");
  ensureColumn(db, "packs", "starter_sort_order", "INTEGER");
  ensureColumn(db, "packs", "review_queue_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "packs", "validation_status", "TEXT NOT NULL DEFAULT 'valid'");
  ensureColumn(db, "packs", "export_readiness", "TEXT NOT NULL DEFAULT 'ready'");
  ensureColumn(db, "packs", "redaction_warning_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "packs", "stale_source_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "packs", "license_warning_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "packs", "license_missing_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "packs", "license_unknown_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "packs", "license_risk_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "pack_health", "validation_status", "TEXT NOT NULL DEFAULT 'valid'");
  ensureColumn(db, "pack_health", "export_readiness", "TEXT NOT NULL DEFAULT 'ready'");
  ensureColumn(db, "pack_health", "redaction_warning_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "pack_health", "stale_source_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "pack_health", "license_warning_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "pack_health", "license_missing_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "pack_health", "license_unknown_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "pack_health", "license_risk_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "records", "redaction_warning_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "records", "stale_source_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "records", "license_warning_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "records", "license_missing_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "records", "license_unknown_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "records", "license_risk_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "sources", "license_status", "TEXT NOT NULL DEFAULT 'unknown'");
  ensureColumn(db, "sources", "license_url", "TEXT");
  ensureColumn(db, "sources", "license_notes", "TEXT");
  ensureColumn(db, "sources", "content_hash_algorithm", "TEXT");
  ensureColumn(db, "sources", "content_hash", "TEXT");
  ensureColumn(db, "sources", "hash_calculated_at", "TEXT");
  ensureColumn(db, "sources", "last_checked_at", "TEXT");
  ensureColumn(db, "sources", "stale_after_days", "INTEGER");
  ensureColumn(db, "sources", "stale_reason", "TEXT");
  ensureColumn(db, "export_profiles", "readiness_status", "TEXT NOT NULL DEFAULT 'ready'");
  ensureColumn(db, "export_profiles", "readiness_warning_codes_json", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "export_profiles", "readiness_blocking_codes_json", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "review_items", "object_type", "TEXT NOT NULL DEFAULT 'pack'");
  ensureColumn(db, "review_items", "object_id", "TEXT");
  ensureColumn(db, "review_items", "skill_id", "TEXT");
  ensureColumn(db, "review_items", "agent_kit_id", "TEXT");
  db.prepare("UPDATE review_items SET object_type = 'pack' WHERE object_type IS NULL OR object_type = ''").run();
  db.prepare("UPDATE review_items SET object_id = pack_id WHERE object_id IS NULL OR object_id = ''").run();
  db.exec("CREATE INDEX IF NOT EXISTS idx_review_items_object ON review_items(object_type, object_id);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_review_items_skill ON review_items(skill_id);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_review_items_agent_kit ON review_items(agent_kit_id);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_agent_kit_context_packs_pack ON agent_kit_context_packs(pack_id);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_agent_kit_skills_skill ON agent_kit_skills(skill_id);");
  ensureReviewItemsTable(db);
}

function dropLegacySkillIndexTables(db: ContextarrDatabase): void {
  if (!hasLegacySkillDocumentPrimaryKey(db, "skill_instructions") && !hasLegacySkillDocumentPrimaryKey(db, "skill_examples")) {
    return;
  }

  db.exec(`
    DROP TABLE IF EXISTS skills_fts;
    DROP TABLE IF EXISTS skill_export_profiles;
    DROP TABLE IF EXISTS skill_sources;
    DROP TABLE IF EXISTS skill_examples;
    DROP TABLE IF EXISTS skill_instructions;
    DROP TABLE IF EXISTS skills;
  `);
}

function hasLegacySkillDocumentPrimaryKey(db: ContextarrDatabase, table: string): boolean {
  const exists = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table);
  if (!exists) {
    return false;
  }

  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string; pk: number }>;
  const idColumn = columns.find((column) => column.name === "id");
  const skillIdColumn = columns.find((column) => column.name === "skill_id");
  return Boolean(idColumn?.pk) && !skillIdColumn?.pk;
}

export function clearDerivedIndex(db: ContextarrDatabase): void {
  db.exec(`
    DELETE FROM records_fts;
    DELETE FROM skills_fts;
    DELETE FROM agent_kits_fts;
    DELETE FROM agent_kit_export_profiles;
    DELETE FROM agent_kit_skills;
    DELETE FROM agent_kit_context_packs;
    DELETE FROM agent_kits;
    DELETE FROM skill_export_profiles;
    DELETE FROM skill_sources;
    DELETE FROM skill_examples;
    DELETE FROM skill_instructions;
    DELETE FROM skills;
    DELETE FROM export_profiles;
    DELETE FROM sources;
    DELETE FROM records;
    DELETE FROM pack_health;
    DELETE FROM packs;
  `);
}

function ensureColumn(db: ContextarrDatabase, table: string, column: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (columns.some((existingColumn) => existingColumn.name === column)) {
    return;
  }

  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function ensureReviewItemsTable(db: ContextarrDatabase): void {
  const existing = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'review_items'")
    .get();

  if (existing) {
    return;
  }

  db.exec(`
    CREATE TABLE review_items (
      id TEXT PRIMARY KEY,
      fingerprint TEXT NOT NULL UNIQUE,
      object_type TEXT NOT NULL DEFAULT 'pack',
      object_id TEXT,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      pack_id TEXT NOT NULL,
      skill_id TEXT,
      agent_kit_id TEXT,
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

    CREATE INDEX IF NOT EXISTS idx_review_items_status ON review_items(status);
    CREATE INDEX IF NOT EXISTS idx_review_items_pack ON review_items(pack_id);
    CREATE INDEX IF NOT EXISTS idx_review_items_skill ON review_items(skill_id);
    CREATE INDEX IF NOT EXISTS idx_review_items_agent_kit ON review_items(agent_kit_id);
    CREATE INDEX IF NOT EXISTS idx_review_items_last_seen ON review_items(last_seen_at);
  `);
}
