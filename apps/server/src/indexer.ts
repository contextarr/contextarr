import path from "node:path";
import type { ContextarrDatabase } from "./db";
import { clearDerivedIndex } from "./db";
import { loadPacks } from "./pack-loader";
import type { LoadedPack, PackSummary, RebuildIndexResult } from "./types";

export function rebuildIndex(db: ContextarrDatabase, packsDir: string): RebuildIndexResult {
  const indexedAt = new Date().toISOString();
  const loaded = loadPacks(packsDir);

  const transaction = db.transaction(() => {
    clearDerivedIndex(db);

    for (const pack of loaded.packs) {
      insertPack(db, pack, indexedAt);
      insertRecords(db, pack);
      insertSources(db, pack);
      insertExportProfiles(db, pack);
      insertPackHealth(db, pack, indexedAt);
    }

    db.prepare(
      `INSERT INTO events (type, message, created_at, metadata_json)
       VALUES (?, ?, ?, ?)`
    ).run(
      "index.rebuilt",
      "Rebuilt local pack index from configured packs directory.",
      indexedAt,
      JSON.stringify({
        packsDir,
        packsIndexed: loaded.packs.length,
        packsSkipped: loaded.skipped.length
      })
    );
  });

  transaction();

  return {
    indexedAt,
    packsIndexed: loaded.packs.length,
    packsSkipped: loaded.skipped.length,
    recordsIndexed: loaded.packs.reduce((count, pack) => count + pack.records.length, 0),
    sourcesIndexed: loaded.packs.reduce((count, pack) => count + pack.sources.length, 0),
    exportProfilesIndexed: loaded.packs.reduce((count, pack) => count + pack.exportProfiles.length, 0),
    skipped: loaded.skipped
  };
}

export function getIndexStats(db: ContextarrDatabase): {
  packs: number;
  records: number;
  sources: number;
  exportProfiles: number;
  lastIndexedAt: string | null;
} {
  return {
    packs: getCount(db, "packs"),
    records: getCount(db, "records"),
    sources: getCount(db, "sources"),
    exportProfiles: getCount(db, "export_profiles"),
    lastIndexedAt:
      db
        .prepare("SELECT created_at FROM events WHERE type = ? ORDER BY id DESC LIMIT 1")
        .pluck()
        .get("index.rebuilt") as string | undefined ?? null
  };
}

export function getPacks(db: ContextarrDatabase): PackSummary[] {
  return db
    .prepare(
      `SELECT
        id, name, version, description, type, visibility, trust_level AS trustLevel,
        health_score AS healthScore, health_status AS healthStatus,
        validation_errors AS validationErrors, validation_warnings AS validationWarnings,
        record_count AS recordCount, source_count AS sourceCount,
        export_profile_count AS exportProfileCount, accent_color AS accentColor,
        last_reviewed_at AS lastReviewedAt, updated_at AS updatedAt
      FROM packs
      ORDER BY name`
    )
    .all() as PackSummary[];
}

export function getPack(db: ContextarrDatabase, packId: string): unknown | undefined {
  const pack = db.prepare("SELECT * FROM packs WHERE id = ?").get(packId) as Row | undefined;
  if (!pack) {
    return undefined;
  }

  const sources = db
    .prepare("SELECT id, type, title, url, path, retrieved_at AS retrievedAt, license, trust, status FROM sources WHERE pack_id = ? ORDER BY id")
    .all(packId);
  const exportProfiles = db
    .prepare("SELECT id, name, target, format, privacy_mode AS privacyMode, token_budget AS tokenBudget FROM export_profiles WHERE pack_id = ? ORDER BY id")
    .all(packId);
  const health = db.prepare("SELECT score, status, validation_errors AS validationErrors, validation_warnings AS validationWarnings, record_count AS recordCount, source_count AS sourceCount, export_profile_count AS exportProfileCount, updated_at AS updatedAt FROM pack_health WHERE pack_id = ?").get(packId);

  return {
    id: pack.id,
    name: pack.name,
    version: pack.version,
    description: pack.description,
    type: pack.type,
    visibility: pack.visibility,
    trustLevel: pack.trust_level,
    author: pack.author,
    license: pack.license,
    createdAt: pack.created_at,
    updatedAt: pack.updated_at,
    lastReviewedAt: pack.last_reviewed_at,
    accentColor: pack.accent_color,
    packPath: pack.pack_path,
    manifest: JSON.parse(String(pack.manifest_json)),
    counts: {
      records: pack.record_count,
      sources: pack.source_count,
      exportProfiles: pack.export_profile_count
    },
    validation: {
      errors: pack.validation_errors,
      warnings: pack.validation_warnings
    },
    health,
    sources,
    exportProfiles
  };
}

export function getPackRecords(
  db: ContextarrDatabase,
  packId: string,
  filters: { q?: string; tag?: string; type?: string } = {}
): unknown[] {
  const where = ["pack_id = ?"];
  const values: unknown[] = [packId];

  if (filters.type) {
    where.push("type = ?");
    values.push(filters.type);
  }

  if (filters.tag) {
    where.push("tags_text LIKE ?");
    values.push(`%${filters.tag}%`);
  }

  if (filters.q) {
    where.push("(title LIKE ? OR body LIKE ? OR tags_text LIKE ?)");
    values.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
  }

  return db
    .prepare(
      `SELECT
        id, pack_id AS packId, title, type, confidence, source_status AS sourceStatus,
        freshness, privacy, last_reviewed AS lastReviewed, review_status AS reviewStatus,
        tags_json AS tagsJson, sources_json AS sourcesJson, file_path AS filePath
      FROM records
      WHERE ${where.join(" AND ")}
      ORDER BY title`
    )
    .all(...values)
    .map((record) => normalizeRecordSummary(record as Row));
}

export function getRecord(db: ContextarrDatabase, recordId: string): unknown | undefined {
  const record = db.prepare("SELECT * FROM records WHERE id = ?").get(recordId) as Row | undefined;
  if (!record) {
    return undefined;
  }

  const sourceIds = JSON.parse(String(record.sources_json)) as string[];
  const sources =
    sourceIds.length === 0
      ? []
      : db
          .prepare(
            `SELECT id, type, title, url, path, retrieved_at AS retrievedAt, license, trust, status
             FROM sources
             WHERE pack_id = ? AND id IN (${sourceIds.map(() => "?").join(",")})
             ORDER BY id`
          )
          .all(record.pack_id, ...sourceIds);

  return {
    id: record.id,
    packId: record.pack_id,
    title: record.title,
    type: record.type,
    tags: JSON.parse(String(record.tags_json)),
    confidence: record.confidence,
    sourceStatus: record.source_status,
    freshness: record.freshness,
    privacy: record.privacy,
    lastReviewed: record.last_reviewed,
    reviewStatus: record.review_status,
    sources: sourceIds,
    resolvedSources: sources,
    body: record.body,
    filePath: record.file_path,
    metadata: JSON.parse(String(record.metadata_json))
  };
}

export function searchIndex(db: ContextarrDatabase, query: string): unknown[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const likeQuery = `%${trimmed}%`;
  const ftsQuery = toFtsQuery(trimmed);
  const packMatches = db
    .prepare(
      `SELECT id, 'pack' AS kind, name AS title, description AS snippet
       FROM packs
       WHERE name LIKE ? OR description LIKE ? OR type LIKE ?
       ORDER BY name
       LIMIT 20`
    )
    .all(likeQuery, likeQuery, likeQuery);

  const recordMatches = ftsQuery
    ? db
        .prepare(
          `SELECT records.id, 'record' AS kind, records.title, records.pack_id AS packId,
            snippet(records_fts, 3, '[', ']', '...', 12) AS snippet
           FROM records_fts
           JOIN records ON records.id = records_fts.record_id
           WHERE records_fts MATCH ?
           ORDER BY rank
           LIMIT 30`
        )
        .all(ftsQuery)
    : [];

  return [...packMatches, ...recordMatches];
}

function insertPack(db: ContextarrDatabase, pack: LoadedPack, indexedAt: string): void {
  const score = calculateHealthScore(pack);
  const status = score >= 90 ? "healthy" : score >= 70 ? "degraded" : "needs_review";

  db.prepare(
    `INSERT INTO packs (
      id, name, version, description, type, visibility, trust_level, author, license,
      created_at, updated_at, last_reviewed_at, contains_personal_data,
      contains_executable_code, requires_network, accent_color, pack_path,
      manifest_json, validation_errors, validation_warnings, health_score,
      health_status, record_count, source_count, export_profile_count, indexed_at
    ) VALUES (
      @id, @name, @version, @description, @type, @visibility, @trustLevel, @author, @license,
      @createdAt, @updatedAt, @lastReviewedAt, @containsPersonalData,
      @containsExecutableCode, @requiresNetwork, @accentColor, @packPath,
      @manifestJson, @validationErrors, @validationWarnings, @healthScore,
      @healthStatus, @recordCount, @sourceCount, @exportProfileCount, @indexedAt
    )`
  ).run({
    id: pack.manifest.id,
    name: pack.manifest.name,
    version: pack.manifest.version,
    description: pack.manifest.description,
    type: pack.manifest.type,
    visibility: pack.manifest.visibility,
    trustLevel: pack.manifest.trustLevel,
    author: pack.manifest.author,
    license: pack.manifest.license,
    createdAt: pack.manifest.createdAt,
    updatedAt: pack.manifest.updatedAt,
    lastReviewedAt: pack.manifest.lastReviewedAt,
    containsPersonalData: pack.manifest.containsPersonalData ? 1 : 0,
    containsExecutableCode: pack.manifest.containsExecutableCode ? 1 : 0,
    requiresNetwork: pack.manifest.requiresNetwork ? 1 : 0,
    accentColor: pack.manifest.assets.accentColor ?? null,
    packPath: path.resolve(pack.packPath),
    manifestJson: JSON.stringify(pack.manifest),
    validationErrors: pack.validation.summary.errors,
    validationWarnings: pack.validation.summary.warnings,
    healthScore: score,
    healthStatus: status,
    recordCount: pack.records.length,
    sourceCount: pack.sources.length,
    exportProfileCount: pack.exportProfiles.length,
    indexedAt
  });
}

function insertRecords(db: ContextarrDatabase, pack: LoadedPack): void {
  const insertRecord = db.prepare(
    `INSERT INTO records (
      id, pack_id, title, type, tags_json, tags_text, confidence, source_status,
      freshness, privacy, last_reviewed, review_status, sources_json, body,
      file_path, metadata_json
    ) VALUES (
      @id, @packId, @title, @type, @tagsJson, @tagsText, @confidence, @sourceStatus,
      @freshness, @privacy, @lastReviewed, @reviewStatus, @sourcesJson, @body,
      @filePath, @metadataJson
    )`
  );
  const insertFts = db.prepare(
    `INSERT INTO records_fts (record_id, pack_id, title, body, tags)
     VALUES (?, ?, ?, ?, ?)`
  );

  for (const record of pack.records) {
    insertRecord.run({
      id: record.metadata.id,
      packId: pack.manifest.id,
      title: record.metadata.title,
      type: record.metadata.type,
      tagsJson: JSON.stringify(record.metadata.tags),
      tagsText: record.metadata.tags.join(" "),
      confidence: record.metadata.confidence,
      sourceStatus: record.metadata.source_status,
      freshness: record.metadata.freshness,
      privacy: record.metadata.privacy,
      lastReviewed: record.metadata.last_reviewed ?? null,
      reviewStatus: record.metadata.review_status,
      sourcesJson: JSON.stringify(record.metadata.sources),
      body: record.body,
      filePath: record.file,
      metadataJson: JSON.stringify(record.metadata)
    });
    insertFts.run(
      record.metadata.id,
      pack.manifest.id,
      record.metadata.title,
      record.body,
      record.metadata.tags.join(" ")
    );
  }
}

function insertSources(db: ContextarrDatabase, pack: LoadedPack): void {
  const insert = db.prepare(
    `INSERT INTO sources (
      id, pack_id, type, title, url, path, retrieved_at, license, trust, status, source_json
    ) VALUES (
      @id, @packId, @type, @title, @url, @path, @retrievedAt, @license, @trust, @status, @sourceJson
    )`
  );

  for (const source of pack.sources) {
    insert.run({
      id: source.id,
      packId: pack.manifest.id,
      type: source.type,
      title: source.title,
      url: source.url ?? null,
      path: source.path ?? null,
      retrievedAt: source.retrieved_at ?? null,
      license: source.license ?? null,
      trust: source.trust ?? null,
      status: source.status ?? null,
      sourceJson: JSON.stringify(source)
    });
  }
}

function insertExportProfiles(db: ContextarrDatabase, pack: LoadedPack): void {
  const insert = db.prepare(
    `INSERT INTO export_profiles (
      id, pack_id, name, target, format, privacy_mode, token_budget, profile_json
    ) VALUES (
      @id, @packId, @name, @target, @format, @privacyMode, @tokenBudget, @profileJson
    )`
  );

  for (const profile of pack.exportProfiles) {
    insert.run({
      id: profile.id,
      packId: pack.manifest.id,
      name: profile.name,
      target: profile.target,
      format: profile.format,
      privacyMode: profile.privacy_mode ?? null,
      tokenBudget: profile.token_budget ?? null,
      profileJson: JSON.stringify(profile)
    });
  }
}

function insertPackHealth(db: ContextarrDatabase, pack: LoadedPack, indexedAt: string): void {
  const score = calculateHealthScore(pack);
  const status = score >= 90 ? "healthy" : score >= 70 ? "degraded" : "needs_review";

  db.prepare(
    `INSERT INTO pack_health (
      pack_id, score, status, validation_errors, validation_warnings,
      record_count, source_count, export_profile_count, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    pack.manifest.id,
    score,
    status,
    pack.validation.summary.errors,
    pack.validation.summary.warnings,
    pack.records.length,
    pack.sources.length,
    pack.exportProfiles.length,
    indexedAt
  );
}

function calculateHealthScore(pack: LoadedPack): number {
  return Math.max(0, 100 - pack.validation.summary.errors * 25 - pack.validation.summary.warnings * 5);
}

function getCount(db: ContextarrDatabase, table: string): number {
  return db.prepare(`SELECT COUNT(*) FROM ${table}`).pluck().get() as number;
}

function normalizeRecordSummary(record: Row): unknown {
  return {
    id: record.id,
    packId: record.packId,
    title: record.title,
    type: record.type,
    confidence: record.confidence,
    sourceStatus: record.sourceStatus,
    freshness: record.freshness,
    privacy: record.privacy,
    lastReviewed: record.lastReviewed,
    reviewStatus: record.reviewStatus,
    tags: JSON.parse(String(record.tagsJson)),
    sources: JSON.parse(String(record.sourcesJson)),
    filePath: record.filePath
  };
}

function toFtsQuery(query: string): string {
  return query
    .split(/\s+/)
    .map((part) => part.replace(/["'`*]/g, "").trim())
    .filter(Boolean)
    .map((part) => `${part}*`)
    .join(" OR ");
}

type Row = Record<string, unknown>;
