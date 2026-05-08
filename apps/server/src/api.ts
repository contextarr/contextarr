import fs from "node:fs";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import staticPlugin from "@fastify/static";
import { buildComposedExport, buildPackExport, ExportError, type BuildComposedExportOptions } from "@contextarr/export-profiles";
import type { ContextarrDatabase } from "./db";
import {
  getIndexStats,
  getPack,
  getPackHealth,
  getPackPath,
  getPackRecords,
  getPacks,
  getRecord,
  getReviewItems,
  rebuildIndex,
  reviewItemStatuses,
  searchIndex,
  updateReviewItemStatus
} from "./indexer";
import type { ReviewItemFilters, ReviewItemSeverity, ReviewItemStatus, ReviewItemType, ServerConfig } from "./types";

export interface CreateAppOptions {
  config: ServerConfig;
  db: ContextarrDatabase;
}

export function createApp({ config, db }: CreateAppOptions): FastifyInstance {
  const app = Fastify({
    logger: false
  });

  app.addHook("onRequest", async (request, reply) => {
    if (!config.apiToken || !isApiRequest(request) || isHealthRequest(request)) {
      return;
    }

    if (getRequestToken(request) === config.apiToken) {
      return;
    }

    return reply.code(401).send({ error: "unauthorized", message: "API token required." });
  });

  app.get("/api/health", async () => {
    const stats = getIndexStats(db);

    return {
      status: "ok",
      authRequired: Boolean(config.apiToken),
      host: config.host,
      port: config.port,
      packsDir: config.packsDir,
      databasePath: config.databasePath,
      lastIndexedAt: stats.lastIndexedAt,
      counts: {
        packs: stats.packs,
        records: stats.records,
        sources: stats.sources,
        exportProfiles: stats.exportProfiles,
        reviewItems: stats.reviewItems,
        openReviewItems: stats.openReviewItems
      }
    };
  });

  app.get("/api/packs", async () => {
    return {
      packs: getPacks(db)
    };
  });

  app.get<{ Params: { id: string } }>("/api/packs/:id", async (request, reply) => {
    const pack = getPack(db, request.params.id);
    if (!pack) {
      return reply.code(404).send({ error: "not_found", message: `Pack not found: ${request.params.id}` });
    }

    return pack;
  });

  app.get<{ Params: { id: string } }>("/api/packs/:id/health", async (request, reply) => {
    const health = getPackHealth(db, request.params.id);
    if (!health) {
      return reply.code(404).send({ error: "not_found", message: `Pack not found: ${request.params.id}` });
    }

    return health;
  });

  app.get<{ Params: { id: string; profileId: string } }>("/api/packs/:id/exports/:profileId/preview", async (request, reply) => {
    const packPath = getPackPath(db, request.params.id);
    if (!packPath) {
      return reply.code(404).send({ error: "not_found", message: `Pack not found: ${request.params.id}` });
    }

    try {
      return buildPackExport({
        packPath,
        profileId: request.params.profileId
      });
    } catch (error) {
      if (error instanceof ExportError && error.code === "profile_not_found") {
        return reply.code(404).send({ error: "not_found", message: error.message });
      }

      if (error instanceof ExportError) {
        return reply.code(400).send({ error: error.code, message: error.message });
      }

      throw error;
    }
  });

  app.post<{ Body: ComposePreviewBody }>("/api/compose/preview", async (request, reply) => {
    const parsed = parseComposePreviewBody(request.body ?? {});
    if (!parsed.ok) {
      return reply.code(400).send({ error: "invalid_compose_request", message: parsed.message });
    }

    const selections: BuildComposedExportOptions["selections"] = [];
    for (const selection of parsed.value.selections) {
      const packPath = getPackPath(db, selection.packId);
      if (!packPath) {
        return reply.code(404).send({ error: "not_found", message: `Pack not found: ${selection.packId}` });
      }

      selections.push({ packPath, recordIds: selection.recordIds });
    }

    try {
      return buildComposedExport({
        ...parsed.value,
        selections
      });
    } catch (error) {
      if (error instanceof ExportError && error.code === "record_not_found") {
        return reply.code(404).send({ error: "not_found", message: error.message });
      }

      if (error instanceof ExportError) {
        return reply.code(400).send({ error: error.code, message: error.message });
      }

      throw error;
    }
  });

  app.get<{
    Params: { id: string };
    Querystring: { q?: string; tag?: string; type?: string };
  }>("/api/packs/:id/records", async (request, reply) => {
    if (!getPack(db, request.params.id)) {
      return reply.code(404).send({ error: "not_found", message: `Pack not found: ${request.params.id}` });
    }

    return {
      records: getPackRecords(db, request.params.id, request.query)
    };
  });

  app.get<{ Params: { id: string } }>("/api/records/:id", async (request, reply) => {
    const record = getRecord(db, request.params.id);
    if (!record) {
      return reply.code(404).send({ error: "not_found", message: `Record not found: ${request.params.id}` });
    }

    return record;
  });

  app.get<{ Querystring: { q?: string } }>("/api/search", async (request) => {
    return {
      query: request.query.q ?? "",
      results: searchIndex(db, request.query.q ?? "")
    };
  });

  app.get<{
    Querystring: {
      status?: ReviewItemStatus;
      severity?: ReviewItemSeverity;
      type?: ReviewItemType;
      packId?: string;
    };
  }>("/api/review-items", async (request) => {
    const filters: ReviewItemFilters = {
      status: request.query.status,
      severity: request.query.severity,
      type: request.query.type,
      packId: request.query.packId
    };
    const items = getReviewItems(db, filters);
    const allItems = getReviewItems(db);

    return {
      items,
      counts: {
        total: allItems.length,
        open: allItems.filter((item) => item.status === "open").length,
        filtered: items.length
      }
    };
  });

  app.post<{
    Params: { id: string };
    Body: { status?: string };
  }>("/api/review-items/:id/status", async (request, reply) => {
    const status = request.body?.status;
    if (!isReviewItemStatus(status)) {
      return reply.code(400).send({ error: "invalid_status", message: "Review item status is invalid." });
    }

    const item = updateReviewItemStatus(db, request.params.id, status);
    if (!item) {
      return reply.code(404).send({ error: "not_found", message: `Review item not found: ${request.params.id}` });
    }

    return { item };
  });

  app.post("/api/rescan", async () => {
    const result = rebuildIndex(db, config.packsDir);

    return {
      ok: true,
      ...result
    };
  });

  registerStaticWeb(app, config);

  return app;
}

function registerStaticWeb(app: FastifyInstance, config: ServerConfig): void {
  if (!config.webDistDir) {
    return;
  }

  if (!fs.existsSync(config.webDistDir)) {
    throw new Error(`Configured web dist directory does not exist: ${config.webDistDir}`);
  }

  app.register(staticPlugin, {
    root: config.webDistDir,
    prefix: "/"
  });

  app.setNotFoundHandler((request, reply) => {
    const pathName = request.url.split("?")[0] ?? "";
    if (request.method === "GET" && !pathName.startsWith("/api/")) {
      return reply.sendFile("index.html");
    }

    return reply.code(404).send({ error: "not_found", message: "Route not found." });
  });
}

function isApiRequest(request: FastifyRequest): boolean {
  return request.url.startsWith("/api/");
}

function isHealthRequest(request: FastifyRequest): boolean {
  return request.method === "GET" && request.url.split("?")[0] === "/api/health";
}

function getRequestToken(request: FastifyRequest): string | undefined {
  const authorization = getHeaderValue(request.headers.authorization);
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearerToken) {
    return bearerToken;
  }

  return getHeaderValue(request.headers["x-contextarr-token"])?.trim() || undefined;
}

function getHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isReviewItemStatus(value: unknown): value is ReviewItemStatus {
  return typeof value === "string" && reviewItemStatuses.includes(value as ReviewItemStatus);
}

interface ComposePreviewBody {
  title?: unknown;
  target?: unknown;
  format?: unknown;
  privacyMode?: unknown;
  selections?: unknown;
  excludeTags?: unknown;
  tokenBudget?: unknown;
}

interface ParsedComposePreviewBody {
  title?: string;
  target: string;
  format: "markdown" | "json";
  privacyMode?: "redacted" | "public_safe";
  selections: Array<{ packId: string; recordIds: string[] }>;
  excludeTags?: string[];
  tokenBudget?: number;
}

function parseComposePreviewBody(body: ComposePreviewBody): { ok: true; value: ParsedComposePreviewBody } | { ok: false; message: string } {
  const allowedTargets = new Set(["chatgpt", "claude", "codex", "markdown", "json_records"]);
  if (typeof body?.target !== "string" || !allowedTargets.has(body.target)) {
    return { ok: false, message: "Composer target is invalid." };
  }

  if (body.format !== "markdown" && body.format !== "json") {
    return { ok: false, message: "Composer format is invalid." };
  }

  if (body.privacyMode !== undefined && body.privacyMode !== "redacted" && body.privacyMode !== "public_safe") {
    return { ok: false, message: "Composer privacy mode is invalid." };
  }

  if (!Array.isArray(body.selections)) {
    return { ok: false, message: "Composer selections are required." };
  }

  const selections: Array<{ packId: string; recordIds: string[] }> = [];
  for (const selection of body.selections) {
    if (!isRecord(selection)) {
      return { ok: false, message: "Composer selection is invalid." };
    }

    const packId = selection.packId;
    const recordIds = selection.recordIds;
    if (typeof packId !== "string" || !packId.trim() || !Array.isArray(recordIds)) {
      return { ok: false, message: "Composer selection is invalid." };
    }

    const validRecordIds = recordIds.filter((recordId): recordId is string => typeof recordId === "string" && Boolean(recordId.trim()));
    if (validRecordIds.length !== recordIds.length) {
      return { ok: false, message: "Composer record IDs are invalid." };
    }

    selections.push({ packId: packId.trim(), recordIds: validRecordIds });
  }

  if (selections.length === 0 || selections.every((selection) => selection.recordIds.length === 0)) {
    return { ok: false, message: "Composer requires at least one selected record." };
  }

  let excludeTags: string[] | undefined;
  if (body.excludeTags !== undefined) {
    if (!Array.isArray(body.excludeTags) || body.excludeTags.some((tag) => typeof tag !== "string" || !tag.trim())) {
      return { ok: false, message: "Composer exclude tags are invalid." };
    }
    excludeTags = body.excludeTags.map((tag) => tag.trim());
  }

  let tokenBudget: number | undefined;
  if (body.tokenBudget !== undefined) {
    if (!Number.isInteger(body.tokenBudget) || Number(body.tokenBudget) <= 0) {
      return { ok: false, message: "Composer token budget must be a positive integer." };
    }
    tokenBudget = Number(body.tokenBudget);
  }

  return {
    ok: true,
    value: {
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : undefined,
      target: body.target,
      format: body.format,
      privacyMode: body.privacyMode,
      selections,
      excludeTags,
      tokenBudget
    }
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
