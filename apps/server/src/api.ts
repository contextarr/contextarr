import Fastify, { type FastifyInstance } from "fastify";
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

  app.get("/api/health", async () => {
    const stats = getIndexStats(db);

    return {
      status: "ok",
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
