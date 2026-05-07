import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./api";
import { openDatabase, type ContextarrDatabase } from "./db";
import { rebuildIndex } from "./indexer";
import type { ServerConfig } from "./types";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");

function createTestContext(): { db: ContextarrDatabase; config: ServerConfig } {
  const db = openDatabase(":memory:");
  const config: ServerConfig = {
    host: "127.0.0.1",
    port: 0,
    packsDir: demoPacksDir,
    databasePath: ":memory:"
  };
  rebuildIndex(db, demoPacksDir);
  return { db, config };
}

describe("Contextarr API", () => {
  let db: ContextarrDatabase;
  let config: ServerConfig;

  beforeEach(() => {
    const context = createTestContext();
    db = context.db;
    config = context.config;
  });

  it("GET /api/health returns index status", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ok",
      counts: {
        packs: 5,
        records: 25,
        sources: 25,
        exportProfiles: 15
      }
    });
    await app.close();
    db.close();
  });

  it("GET /api/packs returns demo pack summaries", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/packs" });

    expect(response.statusCode).toBe(200);
    expect(response.json().packs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ai-workstation-pack",
          recordCount: 5,
          sourceCount: 5,
          exportProfileCount: 3,
          healthStatus: "healthy"
        })
      ])
    );
    await app.close();
    db.close();
  });

  it("GET /api/packs/:id returns manifest-derived detail", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/packs/ai-workstation-pack" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: "ai-workstation-pack",
      counts: {
        records: 5,
        sources: 5,
        exportProfiles: 3
      }
    });
    await app.close();
    db.close();
  });

  it("GET /api/packs/:id/records returns records and supports filters", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({
      method: "GET",
      url: "/api/packs/ai-workstation-pack/records?tag=local"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ai-workstation.local-ai-stack"
        })
      ])
    );
    await app.close();
    db.close();
  });

  it("GET /api/records/:id returns a full record with resolved sources", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/records/ai-workstation.local-ai-stack" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: "ai-workstation.local-ai-stack",
      packId: "ai-workstation-pack",
      title: "Local AI Stack"
    });
    expect(response.json().resolvedSources).toHaveLength(1);
    await app.close();
    db.close();
  });

  it("GET /api/search?q=workstation returns pack and record results", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/search?q=workstation" });

    expect(response.statusCode).toBe(200);
    expect(response.json().results.length).toBeGreaterThan(0);
    await app.close();
    db.close();
  });

  it("POST /api/rescan rebuilds the configured index", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "POST", url: "/api/rescan" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      packsIndexed: 5,
      recordsIndexed: 25
    });
    await app.close();
    db.close();
  });
});
