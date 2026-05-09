import crypto from "node:crypto";
import { performance } from "node:perf_hooks";
import {
  buildPackExport,
  ExportError,
  listPackExportProfiles,
  trustedExposureExclusionReason,
  type ExportArtifact
} from "@contextarr/export-profiles";
import {
  getPack,
  getPackHealth,
  getPackPath,
  getPacks,
  getRecord,
  searchIndex,
  type ContextarrDatabase,
  type PackSummary
} from "@contextarr/server";
import { z } from "zod";
import type { ContextarrMcpContext } from "./context";

export type JsonObject = Record<string, unknown>;

export interface McpJsonResult extends JsonObject {
  ok: boolean;
}

export const listPacksInputSchema = {
  q: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  trustLevel: z.string().min(1).optional(),
  healthStatus: z.string().min(1).optional(),
  limit: z.number().int().positive().max(50).optional()
};

export const getPackSummaryInputSchema = {
  packId: z.string().min(1)
};

export const queryPackContextInputSchema = {
  query: z.string().min(1),
  packId: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  limit: z.number().int().positive().max(50).optional()
};

export const getRecordInputSchema = {
  recordId: z.string().min(1),
  includeBody: z.boolean().optional()
};

export const listExportProfilesInputSchema = {
  packId: z.string().min(1)
};

export const buildExportPreviewInputSchema = {
  packId: z.string().min(1),
  profileId: z.string().min(1)
};

const listPacksSchema = z.object(listPacksInputSchema);
const getPackSummarySchema = z.object(getPackSummaryInputSchema);
const queryPackContextSchema = z.object(queryPackContextInputSchema);
const getRecordSchema = z.object(getRecordInputSchema);
const listExportProfilesSchema = z.object(listExportProfilesInputSchema);
const buildExportPreviewSchema = z.object(buildExportPreviewInputSchema);

class McpToolError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "McpToolError";
  }
}

export async function listPacksTool(context: ContextarrMcpContext, args: unknown = {}): Promise<McpJsonResult> {
  return runLoggedTool(context, { tool: "list_packs", query: getStringField(args, "q") }, () => {
    const input = listPacksSchema.parse(args);
    const limit = normalizeLimit(input.limit, context.config.maxResults);
    const q = input.q?.toLowerCase();
    const packs = getPacks(context.db)
      .filter((pack) => matchesPackFilters(pack, q, input))
      .slice(0, limit)
      .map(toMcpPackSummary);

    return {
      ok: true,
      count: packs.length,
      packs
    };
  });
}

export async function getPackSummaryTool(context: ContextarrMcpContext, args: unknown): Promise<McpJsonResult> {
  return runLoggedTool(context, { tool: "get_pack_summary", packId: getStringField(args, "packId") }, () => {
    const input = getPackSummarySchema.parse(args);
    const pack = asPackDetail(getPack(context.db, input.packId));
    if (!pack) {
      throw new McpToolError("not_found", `Pack not found: ${input.packId}`);
    }

    return {
      ok: true,
      pack: toMcpPackDetail(pack),
      health: getPackHealth(context.db, input.packId) ?? pack.health ?? null
    };
  });
}

export async function queryPackContextTool(context: ContextarrMcpContext, args: unknown): Promise<McpJsonResult> {
  return runLoggedTool(
    context,
    { tool: "query_pack_context", packId: getStringField(args, "packId"), query: getStringField(args, "query") },
    () => {
      const input = queryPackContextSchema.parse(args);
      const limit = normalizeLimit(input.limit, context.config.maxResults);
      const rows = searchIndex(context.db, input.query) as JsonObject[];
      const results: JsonObject[] = [];
      const warnings = new Set<string>();

      for (const row of rows) {
        if (results.length >= limit) {
          break;
        }

        if (row.kind === "pack") {
          if (input.packId && row.id !== input.packId) {
            continue;
          }
          if (input.tag || input.type) {
            continue;
          }

          results.push({
            kind: "pack",
            id: row.id,
            title: row.title,
            snippet: row.snippet
          });
          continue;
        }

        const record = asRecordDetail(getRecord(context.db, String(row.id)));
        if (!record || !recordMatchesFilters(record, input)) {
          continue;
        }

        const trustedReason = trustedExposureExclusionReason(record);
        if (trustedReason) {
          warnings.add("Unapproved or private records were omitted.");
          continue;
        }

        if (record.privacy === "secret") {
          warnings.add("Secret records were omitted.");
          continue;
        }

        const canShowSnippet = canIncludeBody(record.privacy, context.config.allowPrivate);
        if (!canShowSnippet) {
          warnings.add("Non-public record snippets were omitted because private MCP access is disabled.");
        }

        results.push({
          kind: "record",
          id: record.id,
          packId: record.packId,
          title: record.title,
          type: record.type,
          tags: record.tags,
          privacy: record.privacy,
          reviewStatus: record.reviewStatus,
          sourceStatus: record.sourceStatus,
          freshness: record.freshness,
          snippet: canShowSnippet ? truncateText(String(row.snippet ?? ""), 500) : null
        });
      }

      return {
        ok: true,
        query: input.query,
        count: results.length,
        results,
        warnings: [...warnings]
      };
    }
  );
}

export async function getRecordTool(context: ContextarrMcpContext, args: unknown): Promise<McpJsonResult> {
  return runLoggedTool(context, { tool: "get_record", recordId: getStringField(args, "recordId") }, () => {
    const input = getRecordSchema.parse(args);
    const record = asRecordDetail(getRecord(context.db, input.recordId));
    if (!record) {
      throw new McpToolError("not_found", `Record not found: ${input.recordId}`);
    }

    const trustedReason = trustedExposureExclusionReason(record);
    if (trustedReason) {
      throw new McpToolError("record_not_trusted", trustedReason);
    }

    return {
      ok: true,
      record: toMcpRecordDetail(record, input.includeBody !== false, context.config.allowPrivate, context.config.maxRecordChars)
    };
  });
}

export async function listExportProfilesTool(context: ContextarrMcpContext, args: unknown): Promise<McpJsonResult> {
  return runLoggedTool(context, { tool: "list_export_profiles", packId: getStringField(args, "packId") }, () => {
    const input = listExportProfilesSchema.parse(args);
    const pack = asPackDetail(getPack(context.db, input.packId));
    if (!pack) {
      throw new McpToolError("not_found", `Pack not found: ${input.packId}`);
    }

    return {
      ok: true,
      packId: input.packId,
      count: pack.exportProfiles.length,
      profiles: pack.exportProfiles.map(toMcpExportProfile)
    };
  });
}

export async function buildExportPreviewTool(context: ContextarrMcpContext, args: unknown): Promise<McpJsonResult> {
  return runLoggedTool(
    context,
    {
      tool: "build_export_preview",
      packId: getStringField(args, "packId"),
      profileId: getStringField(args, "profileId")
    },
    () => {
      const input = buildExportPreviewSchema.parse(args);
      const packPath = getPackPath(context.db, input.packId);
      if (!packPath) {
        throw new McpToolError("not_found", `Pack not found: ${input.packId}`);
      }

      const profile = listPackExportProfiles({ packPath }).find((candidate) => candidate.profile.id === input.profileId)?.profile;
      if (!profile) {
        throw new McpToolError("not_found", `Export profile not found: ${input.profileId}`);
      }
      if (profile.privacy_mode === "full" && !context.config.allowPrivate) {
        throw new McpToolError("private_access_disabled", "Full export previews require CONTEXTARR_MCP_ALLOW_PRIVATE=true.");
      }

      const artifact = buildPackExport({ packPath, profileId: input.profileId });
      return {
        ok: true,
        artifact: toMcpExportArtifact(artifact, context.config.maxPreviewChars)
      };
    }
  );
}

export function toTextToolResult(result: McpJsonResult): { content: [{ type: "text"; text: string }] } {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

async function runLoggedTool(
  context: ContextarrMcpContext,
  logBase: {
    tool: string;
    packId?: string;
    recordId?: string;
    profileId?: string;
    query?: string;
    metadata?: JsonObject;
  },
  handler: () => McpJsonResult | Promise<McpJsonResult>
): Promise<McpJsonResult> {
  const started = performance.now();
  let result: McpJsonResult;

  try {
    result = await handler();
  } catch (error) {
    result = toControlledError(error);
  }

  logMcpQuery(context.db, {
    ...logBase,
    status: result.ok ? "ok" : "error",
    resultCount: getResultCount(result),
    durationMs: Math.max(0, Math.round(performance.now() - started)),
    metadata: {
      ...(logBase.metadata ?? {}),
      ok: result.ok
    }
  });

  return result;
}

function logMcpQuery(
  db: ContextarrDatabase,
  entry: {
    tool: string;
    packId?: string;
    recordId?: string;
    profileId?: string;
    status: string;
    resultCount: number;
    query?: string;
    durationMs: number;
    metadata: JsonObject;
  }
): void {
  db.prepare(
    `INSERT INTO mcp_query_log (
      tool, pack_id, record_id, profile_id, status, result_count,
      query_hash, query_length, duration_ms, created_at, metadata_json
    ) VALUES (
      @tool, @packId, @recordId, @profileId, @status, @resultCount,
      @queryHash, @queryLength, @durationMs, @createdAt, @metadataJson
    )`
  ).run({
    tool: entry.tool,
    packId: entry.packId ?? null,
    recordId: entry.recordId ?? null,
    profileId: entry.profileId ?? null,
    status: entry.status,
    resultCount: entry.resultCount,
    queryHash: entry.query ? hashQuery(entry.query) : null,
    queryLength: entry.query ? entry.query.length : null,
    durationMs: entry.durationMs,
    createdAt: new Date().toISOString(),
    metadataJson: JSON.stringify(entry.metadata)
  });
}

function toControlledError(error: unknown): McpJsonResult {
  if (error instanceof McpToolError) {
    return { ok: false, error: error.code, message: error.message };
  }

  if (error instanceof ExportError) {
    return { ok: false, error: error.code, message: error.message };
  }

  if (error instanceof z.ZodError) {
    return {
      ok: false,
      error: "invalid_input",
      message: error.issues.map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`).join("; ")
    };
  }

  return {
    ok: false,
    error: "internal_error",
    message: error instanceof Error ? error.message : String(error)
  };
}

function matchesPackFilters(
  pack: PackSummary,
  q: string | undefined,
  input: z.infer<typeof listPacksSchema>
): boolean {
  if (q) {
    const searchable = [pack.id, pack.name, pack.description, pack.type, pack.trustLevel, pack.healthStatus]
      .join(" ")
      .toLowerCase();
    if (!searchable.includes(q)) {
      return false;
    }
  }

  return (
    (!input.type || pack.type === input.type) &&
    (!input.trustLevel || pack.trustLevel === input.trustLevel) &&
    (!input.healthStatus || pack.healthStatus === input.healthStatus)
  );
}

function recordMatchesFilters(record: RecordDetail, input: z.infer<typeof queryPackContextSchema>): boolean {
  if (input.packId && record.packId !== input.packId) {
    return false;
  }
  if (input.tag && !record.tags.includes(input.tag)) {
    return false;
  }
  if (input.type && record.type !== input.type) {
    return false;
  }
  return true;
}

function toMcpPackSummary(pack: PackSummary): JsonObject {
  return {
    id: pack.id,
    name: pack.name,
    version: pack.version,
    description: pack.description,
    type: pack.type,
    trust: pack.trustLevel,
    visibility: pack.visibility,
    health: {
      score: pack.healthScore,
      status: pack.healthStatus
    },
    counts: {
      records: pack.recordCount,
      sources: pack.sourceCount,
      exportProfiles: pack.exportProfileCount
    },
    accentColor: pack.accentColor ?? null,
    coverImage: pack.coverImage,
    reviewQueueCount: pack.reviewQueueCount,
    lastReviewedAt: pack.lastReviewedAt,
    updatedAt: pack.updatedAt
  };
}

function toMcpPackDetail(pack: PackDetail): JsonObject {
  return {
    id: pack.id,
    name: pack.name,
    version: pack.version,
    description: pack.description,
    type: pack.type,
    trust: pack.trustLevel,
    visibility: pack.visibility,
    author: pack.author,
    license: pack.license,
    createdAt: pack.createdAt,
    updatedAt: pack.updatedAt,
    lastReviewedAt: pack.lastReviewedAt,
    accentColor: pack.accentColor ?? null,
    coverImage: pack.coverImage,
    reviewQueueCount: pack.reviewQueueCount,
    manifest: sanitizeManifest(pack.manifest),
    counts: pack.counts,
    validation: pack.validation,
    sources: pack.sources.map(toMcpSourceSummary),
    exportProfiles: pack.exportProfiles.map(toMcpExportProfile)
  };
}

function toMcpRecordDetail(record: RecordDetail, includeBody: boolean, allowPrivate: boolean, maxRecordChars: number): JsonObject {
  const warnings: string[] = [];
  let body: string | null = null;
  let bodyIncluded = false;

  if (includeBody && canIncludeBody(record.privacy, allowPrivate)) {
    body = truncateText(record.body, maxRecordChars);
    bodyIncluded = true;
    if (body.length < record.body.length) {
      warnings.push(`Record body was truncated to ${maxRecordChars} characters.`);
    }
  } else if (includeBody && record.privacy === "secret") {
    warnings.push("Secret record body omitted.");
  } else if (includeBody && !allowPrivate) {
    warnings.push("Non-public record body omitted because private MCP access is disabled.");
  }

  return {
    id: record.id,
    packId: record.packId,
    title: record.title,
    type: record.type,
    tags: record.tags,
    confidence: record.confidence,
    sourceStatus: record.sourceStatus,
    freshness: record.freshness,
    privacy: record.privacy,
    lastReviewed: record.lastReviewed,
    reviewStatus: record.reviewStatus,
    sources: record.sources,
    resolvedSources: record.resolvedSources.map(toMcpSourceSummary),
    metadata: record.metadata,
    bodyIncluded,
    body,
    warnings
  };
}

function toMcpSourceSummary(source: JsonObject): JsonObject {
  return {
    id: source.id,
    type: source.type,
    title: source.title,
    url: source.url ?? null,
    retrievedAt: source.retrievedAt ?? source.retrieved_at ?? null,
    license: source.license ?? null,
    trust: source.trust ?? null,
    status: source.status ?? null
  };
}

function toMcpExportProfile(profile: JsonObject): JsonObject {
  return {
    id: profile.id,
    name: profile.name,
    target: profile.target,
    format: profile.format,
    privacyMode: profile.privacyMode ?? profile.privacy_mode ?? null,
    tokenBudget: profile.tokenBudget ?? profile.token_budget ?? null
  };
}

function toMcpExportArtifact(artifact: ExportArtifact, maxPreviewChars: number): JsonObject {
  const content = truncateText(artifact.content, maxPreviewChars);
  const contentTruncated = content.length < artifact.content.length;
  const warnings = contentTruncated
    ? [
        ...artifact.warnings,
        {
          code: "mcp.preview_truncated",
          message: `Export preview content was truncated to ${maxPreviewChars} characters.`
        }
      ]
    : artifact.warnings;

  return {
    packId: artifact.packId,
    profileId: artifact.profileId,
    target: artifact.target,
    format: artifact.format,
    filename: artifact.filename,
    mimeType: artifact.mimeType,
    content,
    contentTruncated,
    includedRecords: artifact.includedRecords,
    excludedRecords: artifact.excludedRecords,
    sources: artifact.sources.map((source) => toMcpSourceSummary(source as unknown as JsonObject)),
    warnings,
    generatedAt: artifact.generatedAt,
    byteLength: artifact.byteLength,
    estimatedTokens: artifact.estimatedTokens
  };
}

function sanitizeManifest(manifest: JsonObject): JsonObject {
  const {
    recordsPath,
    sourcesPath,
    exportsPath,
    rulesPath,
    ...safeManifest
  } = manifest;
  void recordsPath;
  void sourcesPath;
  void exportsPath;
  void rulesPath;
  return safeManifest;
}

function canIncludeBody(privacy: string, allowPrivate: boolean): boolean {
  if (privacy === "secret") {
    return false;
  }
  return privacy === "public_safe" || allowPrivate;
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}\n\n[truncated]`;
}

function normalizeLimit(value: number | undefined, defaultValue: number): number {
  return Math.min(50, Math.max(1, Math.trunc(value ?? defaultValue)));
}

function getResultCount(result: McpJsonResult): number {
  for (const key of ["packs", "results", "profiles", "includedRecords"] as const) {
    const value = result[key];
    if (Array.isArray(value)) {
      return value.length;
    }
  }

  const artifact = result.artifact;
  if (isJsonObject(artifact) && Array.isArray(artifact.includedRecords)) {
    return artifact.includedRecords.length;
  }

  return result.ok ? 1 : 0;
}

function getStringField(value: unknown, field: string): string | undefined {
  return isJsonObject(value) && typeof value[field] === "string" ? String(value[field]) : undefined;
}

function hashQuery(query: string): string {
  return crypto.createHash("sha256").update(query).digest("hex").slice(0, 24);
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asPackDetail(value: unknown): PackDetail | undefined {
  return isJsonObject(value) ? (value as unknown as PackDetail) : undefined;
}

function asRecordDetail(value: unknown): RecordDetail | undefined {
  return isJsonObject(value) ? (value as unknown as RecordDetail) : undefined;
}

interface PackDetail extends JsonObject {
  id: string;
  name: string;
  version: string;
  description: string;
  type: string;
  visibility: string;
  trustLevel: string;
  author: string;
  license: string;
  createdAt: string;
  updatedAt: string;
  lastReviewedAt: string | null;
  accentColor?: string;
  coverImage: string | null;
  reviewQueueCount: number;
  manifest: JsonObject;
  counts: JsonObject;
  validation: JsonObject;
  health: JsonObject | null;
  sources: JsonObject[];
  exportProfiles: JsonObject[];
}

interface RecordDetail extends JsonObject {
  id: string;
  packId: string;
  title: string;
  type: string;
  tags: string[];
  confidence: string;
  sourceStatus: string;
  freshness: string;
  privacy: string;
  lastReviewed: string | null;
  reviewStatus: string;
  sources: string[];
  resolvedSources: JsonObject[];
  body: string;
  metadata: JsonObject;
}
