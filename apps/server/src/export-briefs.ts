import crypto from "node:crypto";
import type { ExportArtifact } from "@contextarr/export-profiles";
import type { ContextarrDatabase } from "./db";

const CONTENT_SNAPSHOT_MAX_CHARS = 4096;

export type ExportBriefObjectType = "pack" | "skill" | "agent_kit" | "composed";
type ExportBriefPrivacyMode = "redacted" | "public_safe";

const allowedObjectTypes = new Set<ExportBriefObjectType>(["pack", "skill", "agent_kit", "composed"]);
const allowedPrivacyModes = new Set<ExportBriefPrivacyMode>(["redacted", "public_safe"]);
const unsafePrivacyModes = new Set(["private", "sensitive", "secret", "never_export"]);

export interface SaveExportBriefBody {
  objectType?: unknown;
  objectId?: unknown;
  privacyMode?: unknown;
  artifact?: unknown;
}

export interface ListExportBriefFilters {
  limit?: number;
  objectType?: ExportBriefObjectType;
  objectId?: string;
}

export interface SavedExportBrief {
  id: string;
  objectType: ExportBriefObjectType;
  objectId: string;
  profileId: string;
  target: string;
  format: string;
  privacyMode: ExportBriefPrivacyMode;
  filename: string;
  mimeType: string;
  sha256: string;
  byteLength: number;
  estimatedTokens: number;
  includedCount: number;
  excludedCount: number;
  sourceCount: number;
  warningCount: number;
  warningCodes: string[];
  generatedAt: string;
  savedAt: string;
  contentSnapshot?: string;
  contentSnapshotTruncated: boolean;
}

interface ParsedExportArtifact {
  packId: string;
  profileId: string;
  target: string;
  format: string;
  filename: string;
  mimeType: string;
  content: string;
  includedRecords: Array<{ privacy: string }>;
  excludedRecords: unknown[];
  sources: unknown[];
  warnings: Array<{ code: string }>;
  generatedAt: string;
  byteLength: number;
  estimatedTokens: number;
}

interface ExportBriefRow {
  id: string;
  object_type: ExportBriefObjectType;
  object_id: string;
  profile_id: string;
  target: string;
  format: string;
  privacy_mode: ExportBriefPrivacyMode;
  filename: string;
  mime_type: string;
  sha256: string;
  byte_length: number;
  estimated_tokens: number;
  included_count: number;
  excluded_count: number;
  source_count: number;
  warning_count: number;
  warning_codes_json: string;
  generated_at: string;
  saved_at: string;
  content_snapshot: string | null;
  content_snapshot_truncated: number;
}

export class ExportBriefError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: 400 | 404 = 400
  ) {
    super(message);
  }
}

export function saveExportBrief(db: ContextarrDatabase, body: SaveExportBriefBody): SavedExportBrief {
  if (!isRecord(body)) {
    throw new ExportBriefError("invalid_export_brief_request", "Export brief request body must be an object.");
  }

  const objectType = parseObjectType(body.objectType);
  const artifactValue = body.artifact === undefined ? body : body.artifact;
  const artifact = parseExportArtifact(artifactValue);
  const objectId = parseObjectId(body.objectId, artifact, objectType);
  const profilePrivacyMode = getProfilePrivacyMode(db, objectType, objectId, artifact.profileId);
  const privacyMode = parsePrivacyMode(body.privacyMode, profilePrivacyMode, objectType);

  if (profilePrivacyMode && privacyMode !== profilePrivacyMode) {
    throw new ExportBriefError("invalid_export_artifact", "Export artifact privacy mode does not match the indexed export profile.");
  }

  if (objectType !== "composed" && artifact.packId !== objectId) {
    throw new ExportBriefError("invalid_export_artifact", "Export artifact object ID does not match the requested object.");
  }

  const byteLength = Buffer.byteLength(artifact.content, "utf8");
  if (artifact.byteLength !== byteLength) {
    throw new ExportBriefError("invalid_export_artifact", "Export artifact byteLength does not match its content.");
  }

  const snapshot = buildContentSnapshot(artifact, privacyMode);
  const savedAt = new Date().toISOString();
  const warningCodes = uniqueWarningCodes(artifact.warnings);
  const brief: SavedExportBrief = {
    id: `export_brief_${crypto.randomUUID()}`,
    objectType,
    objectId,
    profileId: artifact.profileId,
    target: artifact.target,
    format: artifact.format,
    privacyMode,
    filename: artifact.filename,
    mimeType: artifact.mimeType,
    sha256: crypto.createHash("sha256").update(artifact.content, "utf8").digest("hex"),
    byteLength,
    estimatedTokens: artifact.estimatedTokens,
    includedCount: artifact.includedRecords.length,
    excludedCount: artifact.excludedRecords.length,
    sourceCount: artifact.sources.length,
    warningCount: artifact.warnings.length,
    warningCodes,
    generatedAt: artifact.generatedAt,
    savedAt,
    ...(snapshot.contentSnapshot ? { contentSnapshot: snapshot.contentSnapshot } : {}),
    contentSnapshotTruncated: snapshot.contentSnapshotTruncated
  };

  db.prepare(
    `INSERT INTO export_briefs (
      id, object_type, object_id, profile_id, target, format, privacy_mode,
      filename, mime_type, sha256, byte_length, estimated_tokens,
      included_count, excluded_count, source_count, warning_count, warning_codes_json,
      generated_at, saved_at, content_snapshot, content_snapshot_truncated
    ) VALUES (
      @id, @objectType, @objectId, @profileId, @target, @format, @privacyMode,
      @filename, @mimeType, @sha256, @byteLength, @estimatedTokens,
      @includedCount, @excludedCount, @sourceCount, @warningCount, @warningCodesJson,
      @generatedAt, @savedAt, @contentSnapshot, @contentSnapshotTruncated
    )`
  ).run({
    ...brief,
    warningCodesJson: JSON.stringify(warningCodes),
    contentSnapshot: brief.contentSnapshot ?? null,
    contentSnapshotTruncated: brief.contentSnapshotTruncated ? 1 : 0
  });

  return brief;
}

export function listExportBriefs(db: ContextarrDatabase, filters: ListExportBriefFilters = {}): SavedExportBrief[] {
  const clauses: string[] = [];
  const params: Record<string, number | string> = {
    limit: filters.limit ?? 25
  };

  if (filters.objectType) {
    clauses.push("object_type = @objectType");
    params.objectType = filters.objectType;
  }

  if (filters.objectId) {
    clauses.push("object_id = @objectId");
    params.objectId = filters.objectId;
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT *
       FROM export_briefs
       ${whereSql}
       ORDER BY saved_at DESC, id DESC
       LIMIT @limit`
    )
    .all(params) as ExportBriefRow[];

  return rows.map((row) => rowToExportBrief(row, false));
}

export function getExportBrief(db: ContextarrDatabase, id: string): SavedExportBrief | undefined {
  const row = db
    .prepare(
      `SELECT *
       FROM export_briefs
       WHERE id = ?`
    )
    .get(id) as ExportBriefRow | undefined;

  return row ? rowToExportBrief(row, true) : undefined;
}

function parseObjectType(value: unknown): ExportBriefObjectType {
  const normalized = normalizeExportBriefObjectType(value);
  if (!normalized) {
    throw new ExportBriefError("invalid_export_brief_request", "Export brief objectType is invalid.");
  }

  return normalized;
}

export function normalizeExportBriefObjectType(value: unknown): ExportBriefObjectType | undefined {
  const normalized = value === "agent-kit" ? "agent_kit" : value;
  if (typeof normalized !== "string" || !allowedObjectTypes.has(normalized as ExportBriefObjectType)) {
    return undefined;
  }

  return normalized as ExportBriefObjectType;
}

function parseObjectId(value: unknown, artifact: Pick<ParsedExportArtifact, "packId">, objectType: ExportBriefObjectType): string {
  if (value === undefined) {
    return artifact.packId;
  }

  if (typeof value !== "string" || !value.trim()) {
    throw new ExportBriefError("invalid_export_brief_request", "Export brief objectId is invalid.");
  }

  const objectId = value.trim();
  if (objectType !== "composed" && objectId !== artifact.packId) {
    throw new ExportBriefError("invalid_export_artifact", "Export brief objectId must match the artifact object ID.");
  }

  return objectId;
}

function parsePrivacyMode(
  value: unknown,
  profilePrivacyMode: ExportBriefPrivacyMode | undefined,
  objectType: ExportBriefObjectType
): ExportBriefPrivacyMode {
  if (value === undefined || value === null || value === "") {
    if (profilePrivacyMode) {
      return profilePrivacyMode;
    }
    if (objectType === "composed") {
      return "redacted";
    }
    throw new ExportBriefError("export_profile_not_found", "Export profile not found for saved brief.", 404);
  }

  if (typeof value !== "string") {
    throw new ExportBriefError("invalid_export_brief_request", "Export brief privacyMode is invalid.");
  }

  const normalized = value.trim();
  if (unsafePrivacyModes.has(normalized)) {
    throw new ExportBriefError("unsafe_privacy_mode", `Export brief privacyMode is not safe to save: ${normalized}.`);
  }
  if (!allowedPrivacyModes.has(normalized as ExportBriefPrivacyMode)) {
    throw new ExportBriefError("invalid_export_brief_request", "Export brief privacyMode is invalid.");
  }

  return normalized as ExportBriefPrivacyMode;
}

function getProfilePrivacyMode(
  db: ContextarrDatabase,
  objectType: ExportBriefObjectType,
  objectId: string,
  profileId: string
): ExportBriefPrivacyMode | undefined {
  if (objectType === "composed") {
    return undefined;
  }

  const row = db.prepare(profilePrivacyQuery(objectType)).get(objectId, profileId) as { privacy_mode: string | null } | undefined;
  if (!row) {
    throw new ExportBriefError("export_profile_not_found", "Export profile not found for saved brief.", 404);
  }

  const privacyMode = row.privacy_mode ?? "redacted";
  if (allowedPrivacyModes.has(privacyMode as ExportBriefPrivacyMode)) {
    return privacyMode as ExportBriefPrivacyMode;
  }

  if (unsafePrivacyModes.has(privacyMode)) {
    throw new ExportBriefError("unsafe_privacy_mode", `Export profile privacyMode is not safe to save: ${privacyMode}.`);
  }

  throw new ExportBriefError("invalid_export_artifact", "Export profile privacyMode is invalid.");
}

function profilePrivacyQuery(objectType: Exclude<ExportBriefObjectType, "composed">): string {
  if (objectType === "pack") {
    return "SELECT privacy_mode FROM export_profiles WHERE pack_id = ? AND id = ?";
  }
  if (objectType === "skill") {
    return "SELECT privacy_mode FROM skill_export_profiles WHERE skill_id = ? AND id = ?";
  }
  return "SELECT privacy_mode FROM agent_kit_export_profiles WHERE agent_kit_id = ? AND id = ?";
}

function parseExportArtifact(value: unknown): ParsedExportArtifact {
  if (!isRecord(value)) {
    throw new ExportBriefError("invalid_export_artifact", "Export artifact must be an object.");
  }

  const packId = readRequiredString(value, "packId");
  const profileId = readRequiredString(value, "profileId");
  const target = readRequiredString(value, "target");
  const format = readRequiredString(value, "format");
  const filename = readRequiredString(value, "filename");
  const mimeType = readRequiredString(value, "mimeType");
  const content = readRequiredString(value, "content");
  const includedRecords = readIncludedRecords(value.includedRecords);
  const excludedRecords = readArray(value.excludedRecords, "excludedRecords");
  const sources = readArray(value.sources, "sources");
  const warnings = readWarnings(value.warnings);
  const generatedAt = readRequiredDateString(value, "generatedAt");
  const byteLength = readNonNegativeInteger(value, "byteLength");
  const estimatedTokens = readPositiveInteger(value, "estimatedTokens");

  return {
    packId,
    profileId,
    target,
    format,
    filename,
    mimeType,
    content,
    includedRecords,
    excludedRecords,
    sources,
    warnings,
    generatedAt,
    byteLength,
    estimatedTokens
  };
}

function readRequiredString(record: Record<string, unknown>, key: keyof ExportArtifact): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new ExportBriefError("invalid_export_artifact", `Export artifact ${String(key)} is invalid.`);
  }

  return value;
}

function readRequiredDateString(record: Record<string, unknown>, key: keyof ExportArtifact): string {
  const value = readRequiredString(record, key);
  if (Number.isNaN(Date.parse(value))) {
    throw new ExportBriefError("invalid_export_artifact", `Export artifact ${String(key)} is invalid.`);
  }

  return value;
}

function readNonNegativeInteger(record: Record<string, unknown>, key: keyof ExportArtifact): number {
  const value = record[key];
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new ExportBriefError("invalid_export_artifact", `Export artifact ${String(key)} is invalid.`);
  }

  return Number(value);
}

function readPositiveInteger(record: Record<string, unknown>, key: keyof ExportArtifact): number {
  const value = record[key];
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new ExportBriefError("invalid_export_artifact", `Export artifact ${String(key)} is invalid.`);
  }

  return Number(value);
}

function readArray(value: unknown, key: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new ExportBriefError("invalid_export_artifact", `Export artifact ${key} is invalid.`);
  }

  return value;
}

function readIncludedRecords(value: unknown): Array<{ privacy: string }> {
  const records = readArray(value, "includedRecords");
  return records.map((record) => {
    if (!isRecord(record) || typeof record.privacy !== "string" || !record.privacy.trim()) {
      throw new ExportBriefError("invalid_export_artifact", "Export artifact includedRecords are invalid.");
    }

    return { privacy: record.privacy };
  });
}

function readWarnings(value: unknown): Array<{ code: string }> {
  const warnings = readArray(value, "warnings");
  return warnings.map((warning) => {
    if (!isRecord(warning) || typeof warning.code !== "string" || !warning.code.trim()) {
      throw new ExportBriefError("invalid_export_artifact", "Export artifact warnings are invalid.");
    }

    return { code: warning.code };
  });
}

function buildContentSnapshot(
  artifact: Pick<ParsedExportArtifact, "content" | "includedRecords">,
  privacyMode: ExportBriefPrivacyMode
): { contentSnapshot?: string; contentSnapshotTruncated: boolean } {
  if (!allowedPrivacyModes.has(privacyMode)) {
    return { contentSnapshotTruncated: false };
  }

  if (!artifact.includedRecords.every((record) => record.privacy === "public_safe")) {
    return { contentSnapshotTruncated: false };
  }

  return {
    contentSnapshot: artifact.content.slice(0, CONTENT_SNAPSHOT_MAX_CHARS),
    contentSnapshotTruncated: artifact.content.length > CONTENT_SNAPSHOT_MAX_CHARS
  };
}

function uniqueWarningCodes(warnings: Array<{ code: string }>): string[] {
  return Array.from(new Set(warnings.map((warning) => warning.code)));
}

function rowToExportBrief(row: ExportBriefRow, includeSnapshot: boolean): SavedExportBrief {
  return {
    id: row.id,
    objectType: row.object_type,
    objectId: row.object_id,
    profileId: row.profile_id,
    target: row.target,
    format: row.format,
    privacyMode: row.privacy_mode,
    filename: row.filename,
    mimeType: row.mime_type,
    sha256: row.sha256,
    byteLength: row.byte_length,
    estimatedTokens: row.estimated_tokens,
    includedCount: row.included_count,
    excludedCount: row.excluded_count,
    sourceCount: row.source_count,
    warningCount: row.warning_count,
    warningCodes: parseWarningCodes(row.warning_codes_json),
    generatedAt: row.generated_at,
    savedAt: row.saved_at,
    ...(includeSnapshot && row.content_snapshot !== null ? { contentSnapshot: row.content_snapshot } : {}),
    contentSnapshotTruncated: row.content_snapshot_truncated === 1
  };
}

function parseWarningCodes(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((code): code is string => typeof code === "string") : [];
  } catch {
    return [];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
