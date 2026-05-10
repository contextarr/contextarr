import crypto from "node:crypto";
import { performance } from "node:perf_hooks";
import {
  buildAgentKitExport,
  buildPackExport,
  ExportError,
  listAgentKitExportProfiles,
  listPackExportProfiles,
  type ExportArtifact
} from "@contextarr/export-profiles";
import {
  getAgentKit,
  getAgentKitHealth,
  getAgentKitPath,
  getAgentKits,
  getPack,
  getPackHealth,
  getPackPath,
  getPacks,
  getRecord,
  getSkill,
  getSkillExamples,
  getSkillHealth,
  getSkillInstructions,
  getSkills,
  searchIndex,
  type AgentKitSummary,
  type ContextarrDatabase,
  type PackSummary,
  type SkillSummary
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

export const listSkillsInputSchema = {
  q: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  trustLevel: z.string().min(1).optional(),
  healthStatus: z.string().min(1).optional(),
  target: z.string().min(1).optional(),
  limit: z.number().int().positive().max(50).optional()
};

export const getSkillSummaryInputSchema = {
  skillId: z.string().min(1)
};

export const getSkillInputSchema = {
  skillId: z.string().min(1),
  includeBody: z.boolean().optional()
};

export const listAgentKitsInputSchema = {
  q: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  trustLevel: z.string().min(1).optional(),
  healthStatus: z.string().min(1).optional(),
  target: z.string().min(1).optional(),
  limit: z.number().int().positive().max(50).optional()
};

export const getAgentKitSummaryInputSchema = {
  agentKitId: z.string().min(1)
};

export const queryAgentKitContextInputSchema = {
  query: z.string().min(1),
  agentKitId: z.string().min(1),
  packId: z.string().min(1).optional(),
  skillId: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  limit: z.number().int().positive().max(50).optional()
};

export const buildAgentKitExportPreviewInputSchema = {
  agentKitId: z.string().min(1),
  profileId: z.string().min(1)
};

const listPacksSchema = z.object(listPacksInputSchema);
const getPackSummarySchema = z.object(getPackSummaryInputSchema);
const queryPackContextSchema = z.object(queryPackContextInputSchema);
const getRecordSchema = z.object(getRecordInputSchema);
const listExportProfilesSchema = z.object(listExportProfilesInputSchema);
const buildExportPreviewSchema = z.object(buildExportPreviewInputSchema);
const listSkillsSchema = z.object(listSkillsInputSchema);
const getSkillSummarySchema = z.object(getSkillSummaryInputSchema);
const getSkillSchema = z.object(getSkillInputSchema);
const listAgentKitsSchema = z.object(listAgentKitsInputSchema);
const getAgentKitSummarySchema = z.object(getAgentKitSummaryInputSchema);
const queryAgentKitContextSchema = z.object(queryAgentKitContextInputSchema);
const buildAgentKitExportPreviewSchema = z.object(buildAgentKitExportPreviewInputSchema);

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

        if (!isApprovedRecord(record)) {
          warnings.add("Non-approved records were omitted.");
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
    if (!isApprovedRecord(record)) {
      throw new McpToolError("record_not_approved", "Record is not approved for MCP exposure.");
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

export async function listSkillsTool(context: ContextarrMcpContext, args: unknown = {}): Promise<McpJsonResult> {
  return runLoggedTool(context, { tool: "list_skills", query: getStringField(args, "q") }, () => {
    const input = listSkillsSchema.parse(args);
    const limit = normalizeLimit(input.limit, context.config.maxResults);
    const q = input.q?.toLowerCase();
    const skills = getSkills(context.db)
      .filter((skill) => matchesSkillFilters(skill, q, input))
      .slice(0, limit)
      .map(toMcpSkillSummary);

    return {
      ok: true,
      count: skills.length,
      skills
    };
  });
}

export async function getSkillSummaryTool(context: ContextarrMcpContext, args: unknown): Promise<McpJsonResult> {
  return runLoggedTool(context, { tool: "get_skill_summary", metadata: { skillId: getStringField(args, "skillId") } }, () => {
    const input = getSkillSummarySchema.parse(args);
    const skill = asSkillDetail(getSkill(context.db, input.skillId));
    if (!skill) {
      throw new McpToolError("not_found", `Skill not found: ${input.skillId}`);
    }

    return {
      ok: true,
      skill: toMcpSkillDetail(skill),
      health: getSkillHealth(context.db, input.skillId) ?? skill.health ?? null
    };
  });
}

export async function getSkillTool(context: ContextarrMcpContext, args: unknown): Promise<McpJsonResult> {
  return runLoggedTool(context, { tool: "get_skill", metadata: { skillId: getStringField(args, "skillId") } }, () => {
    const input = getSkillSchema.parse(args);
    const skill = asSkillDetail(getSkill(context.db, input.skillId));
    if (!skill) {
      throw new McpToolError("not_found", `Skill not found: ${input.skillId}`);
    }

    const sources = asJsonArray(skill.sources);
    const includeBody = input.includeBody !== false;
    const warnings = new Set<string>();
    const instructions = getSkillInstructions(context.db, input.skillId).flatMap((document) =>
      toMcpSkillDocumentIfVisible(
        asSkillDocumentDetail(document),
        sources,
        includeBody,
        context.config.allowPrivate,
        context.config.maxRecordChars,
        warnings
      )
    );
    const examples = getSkillExamples(context.db, input.skillId).flatMap((document) =>
      toMcpSkillDocumentIfVisible(
        asSkillDocumentDetail(document),
        sources,
        includeBody,
        context.config.allowPrivate,
        context.config.maxRecordChars,
        warnings
      )
    );

    return {
      ok: true,
      skill: toMcpSkillDetail(skill),
      instructions,
      examples,
      warnings: [...warnings]
    };
  });
}

export async function listAgentKitsTool(context: ContextarrMcpContext, args: unknown = {}): Promise<McpJsonResult> {
  return runLoggedTool(context, { tool: "list_agent_kits", query: getStringField(args, "q") }, () => {
    const input = listAgentKitsSchema.parse(args);
    const limit = normalizeLimit(input.limit, context.config.maxResults);
    const q = input.q?.toLowerCase();
    const agentKits = getAgentKits(context.db)
      .filter((agentKit) => matchesAgentKitFilters(agentKit, q, input))
      .slice(0, limit)
      .map(toMcpAgentKitSummary);

    return {
      ok: true,
      count: agentKits.length,
      agentKits
    };
  });
}

export async function getAgentKitSummaryTool(context: ContextarrMcpContext, args: unknown): Promise<McpJsonResult> {
  return runLoggedTool(
    context,
    { tool: "get_agent_kit_summary", metadata: { agentKitId: getStringField(args, "agentKitId") } },
    () => {
      const input = getAgentKitSummarySchema.parse(args);
      const agentKit = asAgentKitDetail(getAgentKit(context.db, input.agentKitId));
      if (!agentKit) {
        throw new McpToolError("not_found", `Agent Kit not found: ${input.agentKitId}`);
      }

      return {
        ok: true,
        agentKit: toMcpAgentKitDetail(agentKit),
        health: getAgentKitHealth(context.db, input.agentKitId) ?? agentKit.health ?? null
      };
    }
  );
}

export async function queryAgentKitContextTool(context: ContextarrMcpContext, args: unknown): Promise<McpJsonResult> {
  return runLoggedTool(
    context,
    {
      tool: "query_agent_kit_context",
      packId: getStringField(args, "packId"),
      query: getStringField(args, "query"),
      metadata: {
        agentKitId: getStringField(args, "agentKitId"),
        skillId: getStringField(args, "skillId")
      }
    },
    () => {
      const input = queryAgentKitContextSchema.parse(args);
      const limit = normalizeLimit(input.limit, context.config.maxResults);
      const scope = getAgentKitScope(context.db, input.agentKitId);
      const rows = searchIndex(context.db, input.query) as JsonObject[];
      const results: JsonObject[] = [];
      const warnings = new Set<string>();
      const seen = new Set<string>();

      for (const row of rows) {
        if (results.length >= limit) {
          break;
        }

        const result = resultFromSearchRow(context, row, input, scope, warnings);
        if (!result) {
          continue;
        }

        const key = `${result.kind}:${String(result.id)}`;
        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        results.push(result);
      }

      return {
        ok: true,
        query: input.query,
        agentKitId: input.agentKitId ?? null,
        count: results.length,
        results,
        warnings: [...warnings]
      };
    }
  );
}

export async function buildAgentKitExportPreviewTool(context: ContextarrMcpContext, args: unknown): Promise<McpJsonResult> {
  return runLoggedTool(
    context,
    {
      tool: "build_agent_kit_export_preview",
      profileId: getStringField(args, "profileId"),
      metadata: { agentKitId: getStringField(args, "agentKitId") }
    },
    () => {
      const input = buildAgentKitExportPreviewSchema.parse(args);
      const agentKitPath = getAgentKitPath(context.db, input.agentKitId);
      if (!agentKitPath) {
        throw new McpToolError("not_found", `Agent Kit not found: ${input.agentKitId}`);
      }

      const profile = listAgentKitExportProfiles({
        agentKitPath,
        contextPacksDir: context.config.packsDir,
        skillsDir: context.config.skillsDir
      }).find((candidate) => candidate.profile.id === input.profileId)?.profile;
      if (!profile) {
        throw new McpToolError("not_found", `Agent Kit export profile not found: ${input.profileId}`);
      }
      if (profile.privacy_mode === "full" && !context.config.allowPrivate) {
        throw new McpToolError("private_access_disabled", "Full Agent Kit export previews require CONTEXTARR_MCP_ALLOW_PRIVATE=true.");
      }

      const artifact = buildAgentKitExport({
        agentKitPath,
        profileId: input.profileId,
        contextPacksDir: context.config.packsDir,
        skillsDir: context.config.skillsDir
      });
      return {
        ok: true,
        agentKitId: input.agentKitId,
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

function matchesSkillFilters(
  skill: SkillSummary,
  q: string | undefined,
  input: z.infer<typeof listSkillsSchema>
): boolean {
  if (q) {
    const searchable = [
      skill.id,
      skill.name,
      skill.description,
      skill.type,
      skill.trustLevel,
      skill.healthStatus,
      skill.targets.join(" "),
      skill.inputs.join(" "),
      skill.outputs.join(" ")
    ]
      .join(" ")
      .toLowerCase();
    if (!searchable.includes(q)) {
      return false;
    }
  }

  return (
    (!input.type || skill.type === input.type) &&
    (!input.trustLevel || skill.trustLevel === input.trustLevel) &&
    (!input.healthStatus || skill.healthStatus === input.healthStatus) &&
    (!input.target || skill.targets.includes(input.target))
  );
}

function matchesAgentKitFilters(
  agentKit: AgentKitSummary,
  q: string | undefined,
  input: z.infer<typeof listAgentKitsSchema>
): boolean {
  if (q) {
    const searchable = [
      agentKit.id,
      agentKit.name,
      agentKit.description,
      agentKit.type,
      agentKit.trustLevel,
      agentKit.healthStatus,
      agentKit.target,
      agentKit.privacyMode
    ]
      .join(" ")
      .toLowerCase();
    if (!searchable.includes(q)) {
      return false;
    }
  }

  return (
    (!input.type || agentKit.type === input.type) &&
    (!input.trustLevel || agentKit.trustLevel === input.trustLevel) &&
    (!input.healthStatus || agentKit.healthStatus === input.healthStatus) &&
    (!input.target || agentKit.target === input.target)
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

function skillDocumentMatchesFilters(
  document: SkillDocumentDetail,
  input: z.infer<typeof queryAgentKitContextSchema>
): boolean {
  if (input.skillId && document.skillId !== input.skillId) {
    return false;
  }
  if (input.tag && !document.tags.includes(input.tag)) {
    return false;
  }
  if (input.type && document.type !== input.type) {
    return false;
  }
  return true;
}

function skillMatchesQueryFilters(skill: SkillDetail, input: z.infer<typeof queryAgentKitContextSchema>): boolean {
  if (input.skillId && skill.id !== input.skillId) {
    return false;
  }
  if (input.packId || input.tag) {
    return false;
  }
  if (input.type && skill.type !== input.type) {
    return false;
  }
  return true;
}

function getAgentKitScope(db: ContextarrDatabase, agentKitId: string): AgentKitScope {
  const agentKit = asAgentKitDetail(getAgentKit(db, agentKitId));
  if (!agentKit) {
    throw new McpToolError("not_found", `Agent Kit not found: ${agentKitId}`);
  }

  return {
    agentKitId,
    packIds: new Set(asJsonArray(agentKit.contextPacks).map((pack) => String(pack.id))),
    skillIds: new Set(asJsonArray(agentKit.skills).map((skill) => String(skill.id)))
  };
}

function resultFromSearchRow(
  context: ContextarrMcpContext,
  row: JsonObject,
  input: z.infer<typeof queryAgentKitContextSchema>,
  scope: AgentKitScope,
  warnings: Set<string>
): JsonObject | undefined {
  const kind = String(row.kind);

  if (kind === "agent-kit") {
    const id = String(row.id);
    if (id !== scope.agentKitId || input.packId || input.skillId || input.tag) {
      return undefined;
    }

    const agentKit = asAgentKitDetail(getAgentKit(context.db, id));
    if (!agentKit || (input.type && agentKit.type !== input.type)) {
      return undefined;
    }

    return {
      kind: "agent-kit",
      ...toMcpAgentKitSummary(agentKit as unknown as AgentKitSummary),
      snippet: row.snippet ?? null
    };
  }

  if (kind === "pack") {
    const id = String(row.id);
    if (!scope.packIds.has(id)) {
      return undefined;
    }
    if (input.packId && id !== input.packId) {
      return undefined;
    }
    if (input.skillId || input.tag || input.type) {
      return undefined;
    }

    return {
      kind: "pack",
      id,
      title: row.title,
      snippet: row.snippet ?? null
    };
  }

  if (kind === "record") {
    const record = asRecordDetail(getRecord(context.db, String(row.id)));
    if (!record) {
      return undefined;
    }
    if (!scope.packIds.has(record.packId)) {
      return undefined;
    }
    if (!agentKitRecordMatchesFilters(record, input)) {
      return undefined;
    }
    if (!isApprovedRecord(record)) {
      warnings.add("Non-approved records were omitted.");
      return undefined;
    }
    if (record.privacy === "secret") {
      warnings.add("Secret records were omitted.");
      return undefined;
    }

    const canShowSnippet = canIncludeBody(record.privacy, context.config.allowPrivate);
    if (!canShowSnippet) {
      warnings.add("Non-public record snippets were omitted because private MCP access is disabled.");
    }

    return {
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
    };
  }

  if (kind === "skill") {
    const skill = asSkillDetail(getSkill(context.db, String(row.id)));
    if (!skill) {
      return undefined;
    }
    if (!scope.skillIds.has(skill.id)) {
      return undefined;
    }
    if (!skillMatchesQueryFilters(skill, input)) {
      return undefined;
    }

    return {
      kind: "skill",
      ...toMcpSkillSummary(skill as unknown as SkillSummary),
      snippet: row.snippet ?? null
    };
  }

  if (kind === "skill_instruction" || kind === "skill_example") {
    const skillId = String(row.skillId);
    if (!scope.skillIds.has(skillId)) {
      return undefined;
    }
    const document = findSkillDocument(context.db, skillId, String(row.id), kind);
    if (!document || !skillDocumentMatchesFilters(document, input)) {
      return undefined;
    }

    if (!isApprovedSkillDocument(document)) {
      warnings.add("Non-approved Skill documents were omitted.");
      return undefined;
    }

    if (document.privacy === "secret") {
      warnings.add("Secret Skill documents were omitted.");
      return undefined;
    }

    const canShowSnippet = canIncludeBody(document.privacy, context.config.allowPrivate);
    if (!canShowSnippet) {
      warnings.add("Non-public Skill documents were omitted because private MCP access is disabled.");
      return undefined;
    }

    return {
      kind,
      id: document.id,
      skillId: document.skillId,
      title: document.title,
      type: document.type,
      tags: document.tags,
      privacy: document.privacy,
      reviewStatus: document.reviewStatus,
      sourceStatus: document.sourceStatus,
      freshness: document.freshness,
      snippet: canShowSnippet ? truncateText(String(row.snippet ?? ""), 500) : null
    };
  }

  return undefined;
}

function agentKitRecordMatchesFilters(record: RecordDetail, input: z.infer<typeof queryAgentKitContextSchema>): boolean {
  if (input.packId && record.packId !== input.packId) {
    return false;
  }
  if (input.skillId) {
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

function findSkillDocument(
  db: ContextarrDatabase,
  skillId: string,
  documentId: string,
  kind: string
): SkillDocumentDetail | undefined {
  const documents =
    kind === "skill_example" ? getSkillExamples(db, skillId) : getSkillInstructions(db, skillId);
  return documents.map(asSkillDocumentDetail).find((document) => document.id === documentId);
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

function toMcpSkillSummary(skill: SkillSummary): JsonObject {
  return {
    id: skill.id,
    name: skill.name,
    version: skill.version,
    description: skill.description,
    type: skill.type,
    trust: skill.trustLevel,
    visibility: skill.visibility,
    health: {
      score: skill.healthScore,
      status: skill.healthStatus
    },
    validation: {
      errors: skill.validationErrors,
      warnings: skill.validationWarnings
    },
    counts: {
      instructions: skill.instructionCount,
      examples: skill.exampleCount,
      sources: skill.sourceCount,
      exportProfiles: skill.exportProfileCount
    },
    targets: skill.targets,
    inputs: skill.inputs,
    outputs: skill.outputs,
    accentColor: skill.accentColor ?? null,
    coverImage: skill.coverImage,
    reviewQueueCount: skill.reviewQueueCount,
    lastReviewedAt: skill.lastReviewedAt,
    updatedAt: skill.updatedAt
  };
}

function toMcpSkillDetail(skill: SkillDetail): JsonObject {
  return {
    id: skill.id,
    name: skill.name,
    version: skill.version,
    description: skill.description,
    type: skill.type,
    trust: skill.trustLevel,
    visibility: skill.visibility,
    author: skill.author,
    license: skill.license,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
    lastReviewedAt: skill.lastReviewedAt,
    accentColor: skill.accentColor ?? null,
    coverImage: skill.coverImage,
    reviewQueueCount: skill.reviewQueueCount,
    targets: skill.targets,
    inputs: skill.inputs,
    outputs: skill.outputs,
    manifest: sanitizeManifest(skill.manifest),
    counts: skill.counts,
    validation: skill.validation,
    health: skill.health,
    sources: asJsonArray(skill.sources).map(toMcpSourceSummary),
    exportProfiles: asJsonArray(skill.exportProfiles).map(toMcpExportProfile)
  };
}

function toMcpSkillDocument(
  document: SkillDocumentDetail,
  skillSources: JsonObject[],
  includeBody: boolean,
  allowPrivate: boolean,
  maxRecordChars: number
): JsonObject {
  const warnings: string[] = [];
  let body: string | null = null;
  let bodyIncluded = false;

  if (includeBody && canIncludeBody(document.privacy, allowPrivate)) {
    body = truncateText(document.body, maxRecordChars);
    bodyIncluded = true;
    if (body.length < document.body.length) {
      warnings.push(`Skill document body was truncated to ${maxRecordChars} characters.`);
    }
  } else if (includeBody && document.privacy === "secret") {
    warnings.push("Secret Skill document body omitted.");
  } else if (includeBody && !allowPrivate) {
    warnings.push("Non-public Skill document body omitted because private MCP access is disabled.");
  }

  return {
    id: document.id,
    skillId: document.skillId,
    title: document.title,
    type: document.type,
    tags: document.tags,
    confidence: document.confidence,
    sourceStatus: document.sourceStatus,
    freshness: document.freshness,
    privacy: document.privacy,
    lastReviewed: document.lastReviewed,
    reviewStatus: document.reviewStatus,
    sources: document.sources,
    resolvedSources: document.sources
      .map((sourceId) => skillSources.find((source) => source.id === sourceId))
      .filter((source): source is JsonObject => Boolean(source))
      .map(toMcpSourceSummary),
    metadata: document.metadata,
    bodyIncluded,
    body,
    warnings
  };
}

function toMcpSkillDocumentIfVisible(
  document: SkillDocumentDetail,
  skillSources: JsonObject[],
  includeBody: boolean,
  allowPrivate: boolean,
  maxRecordChars: number,
  warnings: Set<string>
): JsonObject[] {
  if (!isApprovedSkillDocument(document)) {
    warnings.add("Non-approved Skill documents were omitted.");
    return [];
  }
  if (document.privacy === "secret") {
    warnings.add("Secret Skill documents were omitted.");
    return [];
  }
  if (!allowPrivate && document.privacy !== "public_safe") {
    warnings.add("Non-public Skill documents were omitted because private MCP access is disabled.");
    return [];
  }

  return [toMcpSkillDocument(document, skillSources, includeBody, allowPrivate, maxRecordChars)];
}

function toMcpAgentKitSummary(agentKit: AgentKitSummary): JsonObject {
  return {
    id: agentKit.id,
    name: agentKit.name,
    version: agentKit.version,
    description: agentKit.description,
    type: agentKit.type,
    trust: agentKit.trustLevel,
    visibility: agentKit.visibility,
    health: {
      score: agentKit.healthScore,
      status: agentKit.healthStatus
    },
    validation: {
      errors: agentKit.validationErrors,
      warnings: agentKit.validationWarnings
    },
    counts: {
      contextPacks: agentKit.contextPackCount,
      skills: agentKit.skillCount,
      exportProfiles: agentKit.exportProfileCount
    },
    target: agentKit.target,
    privacyMode: agentKit.privacyMode,
    accentColor: agentKit.accentColor ?? null,
    coverImage: agentKit.coverImage,
    reviewQueueCount: agentKit.reviewQueueCount,
    lastReviewedAt: agentKit.lastReviewedAt,
    updatedAt: agentKit.updatedAt
  };
}

function toMcpAgentKitDetail(agentKit: AgentKitDetail): JsonObject {
  return {
    id: agentKit.id,
    name: agentKit.name,
    version: agentKit.version,
    description: agentKit.description,
    type: agentKit.type,
    trust: agentKit.trustLevel,
    visibility: agentKit.visibility,
    author: agentKit.author,
    license: agentKit.license,
    createdAt: agentKit.createdAt,
    updatedAt: agentKit.updatedAt,
    lastReviewedAt: agentKit.lastReviewedAt,
    accentColor: agentKit.accentColor ?? null,
    coverImage: agentKit.coverImage,
    reviewQueueCount: agentKit.reviewQueueCount,
    target: agentKit.target,
    privacyMode: agentKit.privacyMode,
    tokenBudget: agentKit.tokenBudget ?? null,
    manifest: sanitizeManifest(agentKit.manifest),
    counts: agentKit.counts,
    validation: agentKit.validation,
    health: agentKit.health,
    contextPacks: asJsonArray(agentKit.contextPacks).map(toMcpAgentKitPackRef),
    skills: asJsonArray(agentKit.skills).map(toMcpAgentKitSkillRef),
    exportProfiles: asJsonArray(agentKit.exportProfiles).map(toMcpExportProfile)
  };
}

function toMcpAgentKitPackRef(pack: JsonObject): JsonObject {
  return {
    id: pack.id,
    name: pack.name,
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
    coverImage: pack.coverImage ?? null,
    sortOrder: pack.sortOrder
  };
}

function toMcpAgentKitSkillRef(skill: JsonObject): JsonObject {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    type: skill.type,
    trust: skill.trustLevel,
    visibility: skill.visibility,
    health: {
      score: skill.healthScore,
      status: skill.healthStatus
    },
    counts: {
      instructions: skill.instructionCount,
      examples: skill.exampleCount,
      sources: skill.sourceCount,
      exportProfiles: skill.exportProfileCount
    },
    targets: skill.targets ?? [],
    sortOrder: skill.sortOrder
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

function isApprovedRecord(record: RecordDetail): boolean {
  return record.reviewStatus === "approved";
}

function isApprovedSkillDocument(document: SkillDocumentDetail): boolean {
  return document.reviewStatus === "approved";
}

function toMcpSourceSummary(source: JsonObject): JsonObject {
  return {
    id: source.id,
    type: source.type,
    title: source.title,
    url: source.url ?? null,
    retrievedAt: source.retrievedAt ?? source.retrieved_at ?? null,
    license: source.license ?? null,
    licenseStatus: source.licenseStatus ?? source.license_status ?? null,
    contentHash: source.contentHash ?? source.content_hash ?? null,
    stale: source.stale ?? null,
    staleReason: source.staleReason ?? source.stale_reason ?? null,
    lastCheckedAt: source.lastCheckedAt ?? source.last_checked_at ?? null,
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
  const preview = truncatePreviewContent(artifact.content, maxPreviewChars);

  return {
    packId: artifact.packId,
    profileId: artifact.profileId,
    target: artifact.target,
    format: artifact.format,
    filename: artifact.filename,
    mimeType: artifact.mimeType,
    content: preview.content,
    contentTruncated: preview.truncated,
    contentOriginalLength: artifact.content.length,
    includedRecords: artifact.includedRecords,
    excludedRecords: artifact.excludedRecords,
    sources: artifact.sources.map((source) => toMcpSourceSummary(source as unknown as JsonObject)),
    warnings: preview.truncated
      ? [
          ...artifact.warnings,
          {
            code: "mcp.preview_truncated",
            message: `Export preview content was truncated to ${maxPreviewChars} characters.`
          }
        ]
      : artifact.warnings,
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

function truncatePreviewContent(value: string, maxLength: number): { content: string; truncated: boolean } {
  const marker = "\n\n[truncated]";
  if (value.length <= maxLength) {
    return { content: value, truncated: false };
  }

  if (maxLength <= marker.length) {
    return { content: value.slice(0, maxLength), truncated: true };
  }

  return {
    content: `${value.slice(0, maxLength - marker.length)}${marker}`,
    truncated: true
  };
}

function normalizeLimit(value: number | undefined, defaultValue: number): number {
  return Math.min(50, Math.max(1, Math.trunc(value ?? defaultValue)));
}

function getResultCount(result: McpJsonResult): number {
  for (const key of ["packs", "skills", "agentKits", "results", "profiles", "instructions", "examples", "includedRecords"] as const) {
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

function asSkillDetail(value: unknown): SkillDetail | undefined {
  return isJsonObject(value) ? (value as unknown as SkillDetail) : undefined;
}

function asAgentKitDetail(value: unknown): AgentKitDetail | undefined {
  return isJsonObject(value) ? (value as unknown as AgentKitDetail) : undefined;
}

function asSkillDocumentDetail(value: unknown): SkillDocumentDetail {
  if (!isJsonObject(value)) {
    throw new McpToolError("internal_error", "Indexed Skill document was malformed.");
  }

  return value as unknown as SkillDocumentDetail;
}

function asJsonArray(value: unknown): JsonObject[] {
  return Array.isArray(value) ? value.filter(isJsonObject) : [];
}

interface AgentKitScope {
  agentKitId: string;
  packIds: Set<string>;
  skillIds: Set<string>;
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

interface SkillDetail extends JsonObject {
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
  targets: string[];
  inputs: string[];
  outputs: string[];
  manifest: JsonObject;
  counts: JsonObject;
  validation: JsonObject;
  health: JsonObject | null;
  sources: JsonObject[];
  exportProfiles: JsonObject[];
}

interface SkillDocumentDetail extends JsonObject {
  id: string;
  skillId: string;
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
  body: string;
  metadata: JsonObject;
}

interface AgentKitDetail extends JsonObject {
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
  healthScore: number;
  healthStatus: string;
  validationErrors: number;
  validationWarnings: number;
  contextPackCount: number;
  skillCount: number;
  exportProfileCount: number;
  target: string;
  privacyMode: string;
  tokenBudget?: number;
  manifest: JsonObject;
  counts: JsonObject;
  validation: JsonObject;
  health: JsonObject | null;
  contextPacks: JsonObject[];
  skills: JsonObject[];
  exportProfiles: JsonObject[];
}
