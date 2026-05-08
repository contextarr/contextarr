import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./api";
import { openDatabase, type ContextarrDatabase } from "./db";
import { rebuildIndex } from "./indexer";
import type { ServerConfig } from "./types";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const validatorFixturesDir = path.join(repoRoot, "packages/pack-validator/test/fixtures");

function createTestContext(
  apiToken?: string,
  packsDir = demoPacksDir,
  overrides: Partial<ServerConfig> = {}
): { db: ContextarrDatabase; config: ServerConfig } {
  const db = openDatabase(":memory:");
  const config: ServerConfig = {
    host: "127.0.0.1",
    port: 0,
    packsDir,
    databasePath: ":memory:",
    apiToken,
    ...overrides
  };
  rebuildIndex(db, packsDir);
  return { db, config };
}

function createWebDistFixture(): string {
  const webDistDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-web-dist-"));
  fs.mkdirSync(path.join(webDistDir, "assets"), { recursive: true });
  fs.writeFileSync(path.join(webDistDir, "index.html"), "<!doctype html><div id=\"root\"></div>", "utf8");
  fs.writeFileSync(path.join(webDistDir, "assets", "app.js"), "console.log('contextarr');\n", "utf8");
  return webDistDir;
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
      authRequired: false,
      counts: {
        packs: 5,
        records: 25,
        sources: 25,
        exportProfiles: 25,
        reviewItems: 0,
        openReviewItems: 0
      }
    });
    await app.close();
    db.close();
  });

  it("serves the built web app when webDistDir is configured", async () => {
    const webDistDir = createWebDistFixture();
    const app = createApp({ config: { ...config, webDistDir }, db });
    const root = await app.inject({ method: "GET", url: "/" });
    const asset = await app.inject({ method: "GET", url: "/assets/app.js" });
    const health = await app.inject({ method: "GET", url: "/api/health" });
    const missingApi = await app.inject({ method: "GET", url: "/api/not-real" });
    const clientRoute = await app.inject({ method: "GET", url: "/packs/ai-workstation-pack" });

    expect(root.statusCode).toBe(200);
    expect(root.body).toContain("root");
    expect(asset.statusCode).toBe(200);
    expect(asset.body).toContain("contextarr");
    expect(health.statusCode).toBe(200);
    expect(missingApi.statusCode).toBe(404);
    expect(missingApi.json()).toEqual({ error: "not_found", message: "Route not found." });
    expect(clientRoute.statusCode).toBe(200);
    expect(clientRoute.body).toContain("root");
    await app.close();
    db.close();
  });

  it("GET /api/packs/:id/health returns pack health checks", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/packs/ai-workstation-pack/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      packId: "ai-workstation-pack",
      score: 100,
      status: "healthy",
      reviewQueueCount: 0
    });
    expect(response.json().checks).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "validation", status: "pass" })])
    );
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
          exportProfileCount: 5,
          healthStatus: "healthy",
          coverImage: null,
          reviewQueueCount: 0
        })
      ])
    );
    await app.close();
    db.close();
  });

  it("GET /api/review-items lists and filters generated items", async () => {
    db.close();
    const fixtureContext = createTestContext(undefined, validatorFixturesDir);
    const app = createApp(fixtureContext);
    const allResponse = await app.inject({ method: "GET", url: "/api/review-items" });
    const filteredResponse = await app.inject({ method: "GET", url: "/api/review-items?severity=error&type=validation" });

    expect(allResponse.statusCode).toBe(200);
    expect(allResponse.json().items.length).toBeGreaterThan(0);
    expect(filteredResponse.statusCode).toBe(200);
    expect(filteredResponse.json().items).toEqual(
      expect.arrayContaining([expect.objectContaining({ severity: "error", type: "validation" })])
    );
    await app.close();
    fixtureContext.db.close();
  });

  it("POST /api/review-items/:id/status updates SQLite-only status", async () => {
    db.close();
    const fixtureContext = createTestContext(undefined, validatorFixturesDir);
    const app = createApp(fixtureContext);
    const item = (await app.inject({ method: "GET", url: "/api/review-items?status=open" })).json().items[0];
    const response = await app.inject({
      method: "POST",
      url: `/api/review-items/${item.id}/status`,
      payload: { status: "ignored" }
    });
    const invalidResponse = await app.inject({
      method: "POST",
      url: `/api/review-items/${item.id}/status`,
      payload: { status: "not-real" }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().item).toMatchObject({ id: item.id, status: "ignored" });
    expect(invalidResponse.statusCode).toBe(400);
    await app.close();
    fixtureContext.db.close();
  });

  it("GET /api/packs/:id returns manifest-derived detail", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/packs/ai-workstation-pack" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: "ai-workstation-pack",
      coverImage: null,
      reviewQueueCount: 0,
      counts: {
        records: 5,
        sources: 5,
        exportProfiles: 5
      }
    });
    await app.close();
    db.close();
  });

  it("GET /api/packs/:id/exports/:profileId/preview returns an export artifact", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({
      method: "GET",
      url: "/api/packs/ai-workstation-pack/exports/ai-workstation-codex/preview"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      packId: "ai-workstation-pack",
      profileId: "ai-workstation-codex",
      target: "codex",
      format: "markdown",
      filename: "ai-workstation-codex.md"
    });
    expect(response.json().content).toContain("Codex Context Export");
    expect(response.json().includedRecords).toHaveLength(5);
    await app.close();
    db.close();
  });

  it("GET /api/packs/:id/exports/:profileId/preview reports missing packs and profiles", async () => {
    const app = createApp({ config, db });
    const missingPack = await app.inject({
      method: "GET",
      url: "/api/packs/missing-pack/exports/ai-workstation-codex/preview"
    });
    const missingProfile = await app.inject({
      method: "GET",
      url: "/api/packs/ai-workstation-pack/exports/missing-profile/preview"
    });

    expect(missingPack.statusCode).toBe(404);
    expect(missingProfile.statusCode).toBe(404);
    await app.close();
    db.close();
  });

  it("POST /api/compose/preview returns a composed export artifact", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({
      method: "POST",
      url: "/api/compose/preview",
      payload: {
        title: "Phase 10 Handoff",
        target: "codex",
        format: "markdown",
        selections: [
          { packId: "ai-workstation-pack", recordIds: ["ai-workstation.local-ai-stack"] },
          { packId: "claude-code-project-pack", recordIds: ["claude-code-project.agent-instructions"] }
        ]
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      packId: "composed",
      profileId: "composed-preview",
      target: "codex",
      format: "markdown",
      filename: "phase-10-handoff-codex.md"
    });
    expect(response.json().includedRecords.map((record: { id: string }) => record.id)).toEqual([
      "ai-workstation.local-ai-stack",
      "claude-code-project.agent-instructions"
    ]);
    expect(response.json().content).toContain("Phase 10 Handoff");
    await app.close();
    db.close();
  });

  it("POST /api/compose/preview reports bad selections and missing records", async () => {
    const app = createApp({ config, db });
    const emptySelection = await app.inject({
      method: "POST",
      url: "/api/compose/preview",
      payload: { target: "codex", format: "markdown", selections: [] }
    });
    const missingPack = await app.inject({
      method: "POST",
      url: "/api/compose/preview",
      payload: {
        target: "codex",
        format: "markdown",
        selections: [{ packId: "missing-pack", recordIds: ["missing.record"] }]
      }
    });
    const missingRecord = await app.inject({
      method: "POST",
      url: "/api/compose/preview",
      payload: {
        target: "codex",
        format: "markdown",
        selections: [{ packId: "ai-workstation-pack", recordIds: ["missing.record"] }]
      }
    });

    expect(emptySelection.statusCode).toBe(400);
    expect(missingPack.statusCode).toBe(404);
    expect(missingRecord.statusCode).toBe(404);
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

  it("GET /api/search?q= handles punctuation-heavy input", async () => {
    const app = createApp({ config, db });
    const queries = ["C++", "tag:ai", "local-ai", "ai/workstation", "?", "\"quoted\""];

    for (const query of queries) {
      const response = await app.inject({
        method: "GET",
        url: `/api/search?q=${encodeURIComponent(query)}`
      });

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.json().results)).toBe(true);
    }

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

  it("allows protected API requests when no token is configured", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/packs" });

    expect(response.statusCode).toBe(200);
    await app.close();
    db.close();
  });

  it("reports authRequired from health when a token is configured", async () => {
    db.close();
    const authedContext = createTestContext("test-token");
    const app = createApp(authedContext);
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ authRequired: true });
    expect(JSON.stringify(response.json())).not.toContain("test-token");
    await app.close();
    authedContext.db.close();
  });

  it("requires token auth on review and pack health routes", async () => {
    db.close();
    const authedContext = createTestContext("test-token");
    const app = createApp(authedContext);
    const reviewResponse = await app.inject({ method: "GET", url: "/api/review-items" });
    const healthResponse = await app.inject({
      method: "GET",
      url: "/api/packs/ai-workstation-pack/health",
      headers: { authorization: "Bearer test-token" }
    });

    expect(reviewResponse.statusCode).toBe(401);
    expect(healthResponse.statusCode).toBe(200);
    await app.close();
    authedContext.db.close();
  });

  it("requires token auth on export preview routes", async () => {
    db.close();
    const authedContext = createTestContext("test-token");
    const app = createApp(authedContext);
    const blocked = await app.inject({
      method: "GET",
      url: "/api/packs/ai-workstation-pack/exports/ai-workstation-codex/preview"
    });
    const allowed = await app.inject({
      method: "GET",
      url: "/api/packs/ai-workstation-pack/exports/ai-workstation-codex/preview",
      headers: { authorization: "Bearer test-token" }
    });

    expect(blocked.statusCode).toBe(401);
    expect(allowed.statusCode).toBe(200);
    await app.close();
    authedContext.db.close();
  });

  it("requires token auth on compose preview routes", async () => {
    db.close();
    const authedContext = createTestContext("test-token");
    const app = createApp(authedContext);
    const payload = {
      target: "codex",
      format: "markdown",
      selections: [{ packId: "ai-workstation-pack", recordIds: ["ai-workstation.local-ai-stack"] }]
    };
    const blocked = await app.inject({
      method: "POST",
      url: "/api/compose/preview",
      payload
    });
    const allowed = await app.inject({
      method: "POST",
      url: "/api/compose/preview",
      headers: { authorization: "Bearer test-token" },
      payload
    });

    expect(blocked.statusCode).toBe(401);
    expect(allowed.statusCode).toBe(200);
    await app.close();
    authedContext.db.close();
  });

  it("rejects protected API requests without a configured token", async () => {
    db.close();
    const authedContext = createTestContext("test-token");
    const app = createApp(authedContext);
    const response = await app.inject({ method: "GET", url: "/api/packs" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "unauthorized", message: "API token required." });
    await app.close();
    authedContext.db.close();
  });

  it("allows protected API requests with a bearer token", async () => {
    db.close();
    const authedContext = createTestContext("test-token");
    const app = createApp(authedContext);
    const response = await app.inject({
      method: "GET",
      url: "/api/packs",
      headers: { authorization: "Bearer test-token" }
    });

    expect(response.statusCode).toBe(200);
    await app.close();
    authedContext.db.close();
  });

  it("allows protected API requests with X-Contextarr-Token", async () => {
    db.close();
    const authedContext = createTestContext("test-token");
    const app = createApp(authedContext);
    const response = await app.inject({
      method: "GET",
      url: "/api/packs",
      headers: { "x-contextarr-token": "test-token" }
    });

    expect(response.statusCode).toBe(200);
    await app.close();
    authedContext.db.close();
  });

  it("rejects protected API requests with a wrong token", async () => {
    db.close();
    const authedContext = createTestContext("test-token");
    const app = createApp(authedContext);
    const response = await app.inject({
      method: "GET",
      url: "/api/packs",
      headers: { authorization: "Bearer wrong-token" }
    });

    expect(response.statusCode).toBe(401);
    await app.close();
    authedContext.db.close();
  });
});
