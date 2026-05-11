import type { ContextarrDatabase } from "./db";

const EVENT_TYPE_PATTERN = /^[a-z0-9._:-]{1,80}$/;
const MAX_EVENT_MESSAGE_LENGTH = 240;
const MAX_EVENT_STRING_LENGTH = 512;
const MAX_EVENT_ARRAY_ITEMS = 20;
const MAX_EVENT_DEPTH = 4;

export interface LocalEventInput {
  type: string;
  message: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export function recordLocalEvent(db: ContextarrDatabase, input: LocalEventInput): void {
  const type = input.type.trim();
  if (!EVENT_TYPE_PATTERN.test(type)) {
    throw new Error(`Invalid local event type: ${input.type}`);
  }

  const message = sanitizeEventString(input.message, MAX_EVENT_MESSAGE_LENGTH);
  if (!message) {
    throw new Error("Local event message must be metadata-only text.");
  }

  const createdAt = input.createdAt ?? new Date().toISOString();
  const metadata = sanitizeEventMetadata(input.metadata ?? {});

  db.prepare(
    `INSERT INTO events (type, message, created_at, metadata_json)
     VALUES (?, ?, ?, ?)`
  ).run(type, message, createdAt, JSON.stringify(metadata));
}

export function writeExportBriefSavedEvent(
  db: ContextarrDatabase,
  brief: {
    id: string;
    objectType: string;
    objectId: string;
    profileId: string;
    target: string;
    format: string;
    privacyMode: string;
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
  }
): void {
  recordLocalEvent(db, {
    type: "export_brief.saved",
    message: "Saved local export brief metadata.",
    createdAt: brief.savedAt,
    metadata: {
      briefId: brief.id,
      objectType: brief.objectType,
      objectId: brief.objectId,
      ...(brief.objectType === "pack" ? { packId: brief.objectId } : {}),
      profile: brief.profileId,
      profileId: brief.profileId,
      target: brief.target,
      format: brief.format,
      privacyMode: brief.privacyMode,
      sha256: brief.sha256,
      byteLength: brief.byteLength,
      estimatedTokens: brief.estimatedTokens,
      includedCount: brief.includedCount,
      excludedCount: brief.excludedCount,
      sourceCount: brief.sourceCount,
      warningCount: brief.warningCount,
      warningCodes: brief.warningCodes,
      generatedAt: brief.generatedAt,
      savedAt: brief.savedAt
    }
  });
}

function sanitizeEventMetadata(value: Record<string, unknown>): Record<string, unknown> {
  const sanitized = sanitizeEventValue(value);
  return isRecord(sanitized) ? sanitized : {};
}

function sanitizeEventValue(value: unknown, key = "", depth = 0): unknown {
  if (isSensitiveEventKey(key)) {
    return undefined;
  }

  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return sanitizeEventString(value, MAX_EVENT_STRING_LENGTH);
  }

  if (Array.isArray(value)) {
    if (depth >= MAX_EVENT_DEPTH) {
      return undefined;
    }

    const items = value
      .slice(0, MAX_EVENT_ARRAY_ITEMS)
      .map((item) => sanitizeEventValue(item, key, depth + 1))
      .filter((item) => item !== undefined);
    return items.length > 0 ? items : undefined;
  }

  if (isRecord(value)) {
    if (depth >= MAX_EVENT_DEPTH) {
      return undefined;
    }

    const sanitized: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      const sanitizedValue = sanitizeEventValue(childValue, childKey, depth + 1);
      if (sanitizedValue !== undefined) {
        sanitized[childKey] = sanitizedValue;
      }
    }
    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  return undefined;
}

function isSensitiveEventKey(key: string): boolean {
  const normalized = key.toLowerCase();
  if (normalized === "profile" || normalized === "profileid" || normalized === "estimatedtokens") {
    return false;
  }

  return (
    normalized === "q" ||
    normalized === "raw" ||
    normalized.includes("body") ||
    normalized.includes("bodies") ||
    normalized.includes("snapshot") ||
    normalized.includes("content") ||
    normalized.includes("context") ||
    normalized.includes("directory") ||
    normalized.includes("filename") ||
    normalized.includes("filepath") ||
    normalized.includes("query") ||
    normalized.includes("prompt") ||
    normalized.includes("input") ||
    normalized.includes("payload") ||
    normalized.includes("response") ||
    normalized.includes("root") ||
    normalized.includes("secret") ||
    normalized.includes("telemetry") ||
    normalized === "token" ||
    normalized.endsWith("token") ||
    normalized.includes("password") ||
    normalized.includes("credential") ||
    normalized.includes("path") ||
    normalized === "dir" ||
    normalized === "file" ||
    normalized === "files"
  );
}

function sanitizeEventString(value: string, maxLength: number): string | undefined {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || trimmed.split(/\r?\n/).length > 3) {
    return undefined;
  }

  if (/(?:api[_-]?key|password|secret|token|credential)\s*[:=]/i.test(trimmed)) {
    return undefined;
  }

  return trimmed
    .replace(/\b[A-Za-z]:[\\/][^\s"'`<>|]+/g, "[local path]")
    .replace(
      /(^|[\s"'`([{=,:;])\/(?:__w|app|github|home|tmp|var|Users|mnt|workspace|workspaces|runner|private|opt)\/[^\s"'`<>|]+/g,
      "$1[local path]"
    )
    .replace(/\\\\[^\s"'`<>|]+/g, "[local path]");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
