import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import type { ContextarrDatabase } from "./db";
import { getIndexStats, getPack, getPackRecords, getPacks, getRecord, rebuildIndex, searchIndex } from "./indexer";
import type { ServerConfig } from "./types";

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
        exportProfiles: stats.exportProfiles
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

  app.post("/api/rescan", async () => {
    const result = rebuildIndex(db, config.packsDir);

    return {
      ok: true,
      ...result
    };
  });

  return app;
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
