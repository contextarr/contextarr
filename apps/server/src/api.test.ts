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
const demoSkillsDir = path.join(repoRoot, "demo-skills");
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
    skillsDir: demoSkillsDir,
    databasePath: ":memory:",
    apiToken,
    ...overrides
  };
  rebuildIndex(db, packsDir, config.skillsDir);
  return { db, config };
}

function createWebDistFixture(): string {
  const webDistDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-web-dist-"));
  fs.mkdirSync(path.join(webDistDir, "assets"), { recursive: true });
  fs.writeFileSync(path.join(webDistDir, "index.html"), "<!doctype html><div id=\"root\"></div>", "utf8");
  fs.writeFileSync(path.join(webDistDir, "assets", "app.js"), "console.log('contextarr');\n", "utf8");
  return webDistDir;
}

function expectedHealthStatus(score: number): string {
  if (score >= 90) {
    return "healthy";
  }

  return score >= 70 ? "degraded" : "needs_review";
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
        skills: 8,
        skillInstructions: 24,
        skillExamples: 16,
        skillSources: 24,
        skillExportProfiles: 48,
        reviewItems: 0,
        openReviewItems: 0
      }
    });
    expect(response.json()).not.toHaveProperty("packsDir");
    expect(response.json()).not.toHaveProperty("skillsDir");
    expect(response.json()).not.toHaveProperty("databasePath");
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

  it("GET /api/skills returns demo Skill summaries", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/skills" });

    expect(response.statusCode).toBe(200);
    expect(response.json().skills).toHaveLength(8);
    expect(response.json().skills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "support-ticket-writing-skill",
          instructionCount: 3,
          exampleCount: 2,
          sourceCount: 3,
          exportProfileCount: 6,
          healthStatus: "healthy",
          reviewQueueCount: 0
        })
      ])
    );
    await app.close();
    db.close();
  });

  it("GET /api/skills/:id returns Skill detail and related summaries", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/skills/support-ticket-writing-skill" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: "support-ticket-writing-skill",
      healthScore: 100,
      healthStatus: "healthy",
      validationErrors: 0,
      validationWarnings: 0,
      instructionCount: 3,
      exampleCount: 2,
      sourceCount: 3,
      exportProfileCount: 6,
      coverImage: null,
      counts: {
        instructions: 3,
        examples: 2,
        sources: 3,
        exportProfiles: 6
      },
      validation: {
        errors: 0,
        warnings: 0
      },
      health: {
        score: 100,
        status: "healthy"
      }
    });
    expect(response.json().sources).toHaveLength(3);
    expect(response.json().sources[0]).not.toHaveProperty("path");
    expect(response.json().exportProfiles).toHaveLength(6);
    expect(JSON.stringify(response.json())).not.toContain(repoRoot);
    expect(response.json().manifest).not.toHaveProperty("instructionsPath");
    expect(response.json().manifest).not.toHaveProperty("examplesPath");
    expect(response.json().manifest).not.toHaveProperty("sourcesPath");
    expect(response.json().manifest).not.toHaveProperty("exportsPath");
    expect(response.json().manifest).not.toHaveProperty("rulesPath");
    expect(response.json().manifest.assets).toEqual({ accentColor: "#38bdf8" });
    await app.close();
    db.close();
  });

  it("GET /api/skills/:id/health returns deterministic Skill health checks", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/skills/support-ticket-writing-skill/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      skillId: "support-ticket-writing-skill",
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

  it("keeps every demo Skill healthy with an empty review queue", async () => {
    const app = createApp({ config, db });
    const skillsResponse = await app.inject({ method: "GET", url: "/api/skills" });

    expect(skillsResponse.statusCode).toBe(200);
    for (const skill of skillsResponse.json().skills as Array<{ id: string }>) {
      const healthResponse = await app.inject({ method: "GET", url: `/api/skills/${skill.id}/health` });
      expect(healthResponse.statusCode).toBe(200);
      expect(healthResponse.json()).toMatchObject({
        skillId: skill.id,
        score: 100,
        status: "healthy",
        reviewQueueCount: 0
      });
    }

    await app.close();
    db.close();
  });

  it("allowlists Skill API manifest and document metadata fields", async () => {
    const skillId = "support-ticket-writing-skill";
    const manifestJson = db.prepare("SELECT manifest_json FROM skills WHERE id = ?").pluck().get(skillId) as string;
    const manifest = JSON.parse(manifestJson) as Record<string, unknown>;
    db.prepare("UPDATE skills SET manifest_json = ? WHERE id = ?").run(
      JSON.stringify({
        ...manifest,
        localPath: "D:\\private\\skills",
        secretToken: "not-a-real-token",
        assets: {
          ...(manifest.assets as Record<string, unknown>),
          coverImage: "https://example.invalid/pixel.png"
        }
      }),
      skillId
    );
    db.prepare("UPDATE skill_instructions SET metadata_json = ? WHERE skill_id = ?").run(
      JSON.stringify({
        id: "support-ticket-writing-skill.customer-safe-wording",
        localPath: "D:\\private\\instruction.md",
        secretToken: "not-a-real-token"
      }),
      skillId
    );

    const app = createApp({ config, db });
    const detail = await app.inject({ method: "GET", url: `/api/skills/${skillId}` });
    const instructions = await app.inject({ method: "GET", url: `/api/skills/${skillId}/instructions` });

    expect(detail.statusCode).toBe(200);
    expect(detail.json().manifest).not.toHaveProperty("localPath");
    expect(detail.json().manifest).not.toHaveProperty("secretToken");
    expect(detail.json().manifest.assets).toEqual({ accentColor: "#38bdf8" });
    expect(JSON.stringify(detail.json())).not.toContain("not-a-real-token");
    expect(JSON.stringify(detail.json())).not.toContain("D:\\private");
    expect(instructions.statusCode).toBe(200);
    expect(instructions.json().instructions[0].metadata).toEqual({});
    expect(JSON.stringify(instructions.json())).not.toContain("not-a-real-token");
    expect(JSON.stringify(instructions.json())).not.toContain("D:\\private");
    await app.close();
    db.close();
  });

  it("GET /api/skills/:id/instructions and examples return sanitized metadata-ready documents", async () => {
    const app = createApp({ config, db });
    const instructions = await app.inject({
      method: "GET",
      url: "/api/skills/support-ticket-writing-skill/instructions?tag=support"
    });
    const examples = await app.inject({
      method: "GET",
      url: "/api/skills/support-ticket-writing-skill/examples"
    });
    const exportsResponse = await app.inject({
      method: "GET",
      url: "/api/skills/support-ticket-writing-skill/exports"
    });

    expect(instructions.statusCode).toBe(200);
    expect(instructions.json().instructions).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "support-ticket-writing-skill.customer-safe-wording" })])
    );
    expect(instructions.json().instructions[0]).not.toHaveProperty("filePath");
    expect(instructions.json().instructions[0].metadata).toEqual({});
    expect(examples.statusCode).toBe(200);
    expect(examples.json().examples).toHaveLength(2);
    expect(examples.json().examples[0]).not.toHaveProperty("filePath");
    expect(examples.json().examples[0].metadata).toEqual({});
    expect(exportsResponse.statusCode).toBe(200);
    expect(exportsResponse.json().exportProfiles).toHaveLength(6);
    await app.close();
    db.close();
  });

  it("returns controlled errors for missing Skill resources and invalid search type", async () => {
    const app = createApp({ config, db });
    const missingSkill = await app.inject({ method: "GET", url: "/api/skills/missing-skill" });
    const missingInstructions = await app.inject({ method: "GET", url: "/api/skills/missing-skill/instructions" });
    const missingExamples = await app.inject({ method: "GET", url: "/api/skills/missing-skill/examples" });
    const missingExports = await app.inject({ method: "GET", url: "/api/skills/missing-skill/exports" });
    const invalidSearch = await app.inject({ method: "GET", url: "/api/search?type=not-real&q=support" });

    expect(missingSkill.statusCode).toBe(404);
    expect(missingInstructions.statusCode).toBe(404);
    expect(missingExamples.statusCode).toBe(404);
    expect(missingExports.statusCode).toBe(404);
    expect(invalidSearch.statusCode).toBe(400);
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

  it("GET /api/review-items filters generated Skill items by object subject", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-api-skill-health-"));
    const skillRoot = path.join(tempRoot, "valid-skill");
    db.close();

    try {
      fs.cpSync(path.join(repoRoot, "packages/skill-validator/test/fixtures/valid-skill"), skillRoot, { recursive: true });
      const instructionPath = path.join(skillRoot, "instructions", "core.md");
      fs.writeFileSync(
        instructionPath,
        fs.readFileSync(instructionPath, "utf8").replace("review_status: approved", "review_status: draft"),
        "utf8"
      );

      const fixtureContext = createTestContext(undefined, demoPacksDir, { skillsDir: tempRoot });
      const app = createApp(fixtureContext);
      const response = await app.inject({
        method: "GET",
        url: "/api/review-items?objectType=skill&objectId=valid-skill"
      });
      const health = await app.inject({ method: "GET", url: "/api/skills/valid-skill/health" });

      expect(response.statusCode).toBe(200);
      expect(response.json().items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            objectType: "skill",
            objectId: "valid-skill",
            skillId: "valid-skill",
            type: "review_status"
          })
        ])
      );
      expect(health.statusCode).toBe(200);
      expect(health.json()).toMatchObject({ skillId: "valid-skill" });
      expect(health.json().items).toEqual(
        expect.arrayContaining([expect.objectContaining({ type: "review_status", status: "open" })])
      );
      await app.close();
      fixtureContext.db.close();
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("keeps missing Skill safety rules reviewable through Skill health", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-api-skill-safety-"));
    const skillRoot = path.join(tempRoot, "valid-skill");
    db.close();

    try {
      fs.cpSync(path.join(repoRoot, "packages/skill-validator/test/fixtures/valid-skill"), skillRoot, { recursive: true });
      fs.rmSync(path.join(skillRoot, "rules", "safety.yaml"), { force: true });

      const fixtureContext = createTestContext(undefined, demoPacksDir, { skillsDir: tempRoot });
      const app = createApp(fixtureContext);
      const skill = await app.inject({ method: "GET", url: "/api/skills/valid-skill" });
      const health = await app.inject({ method: "GET", url: "/api/skills/valid-skill/health" });

      expect(skill.statusCode).toBe(200);
      expect(health.statusCode).toBe(200);
      expect(health.json().items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            objectType: "skill",
            skillId: "valid-skill",
            type: "safety_rules",
            severity: "warning"
          })
        ])
      );
      expect(JSON.stringify(health.json())).not.toContain(tempRoot);
      await app.close();
      fixtureContext.db.close();
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("keeps a missing Skill rules directory reviewable through Skill health", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-api-skill-rules-"));
    const skillRoot = path.join(tempRoot, "valid-skill");
    db.close();

    try {
      fs.cpSync(path.join(repoRoot, "packages/skill-validator/test/fixtures/valid-skill"), skillRoot, { recursive: true });
      fs.rmSync(path.join(skillRoot, "rules"), { recursive: true, force: true });

      const fixtureContext = createTestContext(undefined, demoPacksDir, { skillsDir: tempRoot });
      const app = createApp(fixtureContext);
      const skill = await app.inject({ method: "GET", url: "/api/skills/valid-skill" });
      const health = await app.inject({ method: "GET", url: "/api/skills/valid-skill/health" });

      expect(skill.statusCode).toBe(200);
      expect(health.statusCode).toBe(200);
      expect(health.json().items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            objectType: "skill",
            skillId: "valid-skill",
            type: "safety_rules",
            severity: "warning"
          })
        ])
      );
      await app.close();
      fixtureContext.db.close();
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("POST /api/review-items/:id/status refreshes Skill health score and status", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-api-skill-status-"));
    const skillRoot = path.join(tempRoot, "valid-skill");
    db.close();

    try {
      fs.cpSync(path.join(repoRoot, "packages/skill-validator/test/fixtures/valid-skill"), skillRoot, { recursive: true });
      const instructionPath = path.join(skillRoot, "instructions", "core.md");
      fs.writeFileSync(
        instructionPath,
        fs.readFileSync(instructionPath, "utf8").replace("review_status: approved", "review_status: draft"),
        "utf8"
      );

      const fixtureContext = createTestContext(undefined, demoPacksDir, { skillsDir: tempRoot });
      const app = createApp(fixtureContext);
      const before = await app.inject({ method: "GET", url: "/api/skills/valid-skill/health" });
      const reviewItem = before.json().items.find((item: { type: string }) => item.type === "review_status");

      expect(before.statusCode).toBe(200);
      expect(reviewItem).toBeDefined();

      const update = await app.inject({
        method: "POST",
        url: `/api/review-items/${reviewItem.id}/status`,
        payload: { status: "ignored" }
      });
      const after = await app.inject({ method: "GET", url: "/api/skills/valid-skill/health" });

      expect(update.statusCode).toBe(200);
      expect(after.json().reviewQueueCount).toBe(before.json().reviewQueueCount - 1);
      expect(after.json().score).toBeGreaterThan(before.json().score);
      expect(after.json().status).toBe(expectedHealthStatus(after.json().score));
      await app.close();
      fixtureContext.db.close();
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("reports broken Skill source references as review items", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-api-skill-source-"));
    const skillRoot = path.join(tempRoot, "missing-source-reference-skill");
    db.close();

    try {
      fs.cpSync(path.join(repoRoot, "packages/skill-validator/test/fixtures/missing-source-reference-skill"), skillRoot, {
        recursive: true
      });

      const fixtureContext = createTestContext(undefined, demoPacksDir, { skillsDir: tempRoot });
      const app = createApp(fixtureContext);
      const response = await app.inject({
        method: "GET",
        url: "/api/review-items?objectType=skill&objectId=missing-source-reference-skill"
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            objectType: "skill",
            objectId: "missing-source-reference-skill",
            type: "source_coverage"
          })
        ])
      );
      expect(JSON.stringify(response.json())).not.toContain(tempRoot);
      await app.close();
      fixtureContext.db.close();
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("sanitizes missing Skills directory paths from review APIs", async () => {
    const missingSkillsDir = path.join(os.tmpdir(), `contextarr-missing-skills-${Date.now()}`);
    db.close();

    const fixtureContext = createTestContext(undefined, demoPacksDir, { skillsDir: missingSkillsDir });
    const app = createApp(fixtureContext);
    const response = await app.inject({ method: "GET", url: "/api/review-items?objectType=skill" });

    expect(response.statusCode).toBe(200);
    expect(response.json().items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          objectType: "skill",
          type: "validation",
          severity: "error"
        })
      ])
    );
    expect(JSON.stringify(response.json())).not.toContain(missingSkillsDir);
    await app.close();
    fixtureContext.db.close();
  });

  it("sanitizes skipped issue paths from rescan responses", async () => {
    const missingSkillsDir = path.join(os.tmpdir(), `contextarr-missing-skills-${Date.now()}`);
    db.close();

    const fixtureContext = createTestContext(undefined, demoPacksDir, { skillsDir: missingSkillsDir });
    const app = createApp(fixtureContext);
    const response = await app.inject({ method: "POST", url: "/api/rescan" });

    expect(response.statusCode).toBe(200);
    expect(response.json().skippedSkills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          issues: expect.arrayContaining([expect.objectContaining({ code: "skills_dir.missing" })])
        })
      ])
    );
    expect(JSON.stringify(response.json())).not.toContain(missingSkillsDir);
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

  it("GET /api/skills/:id/exports/:profileId/preview returns a Skill export artifact without local paths", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({
      method: "GET",
      url: "/api/skills/support-ticket-writing-skill/exports/support-ticket-writing-skill-claude-code/preview"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      packId: "support-ticket-writing-skill",
      profileId: "support-ticket-writing-skill-claude-code",
      target: "claude_code",
      format: "markdown",
      filename: "support-ticket-writing-skill-claude-code.md"
    });
    expect(response.json().content).toContain("Claude Code Skill Export");
    expect(response.json().includedRecords).toHaveLength(5);
    expect(response.json().sources[0]).not.toHaveProperty("path");
    expect(JSON.stringify(response.json())).not.toContain(repoRoot);
    await app.close();
    db.close();
  });

  it("GET /api/skills/:id/exports/:profileId/preview reports missing Skills and profiles", async () => {
    const app = createApp({ config, db });
    const missingSkill = await app.inject({
      method: "GET",
      url: "/api/skills/missing-skill/exports/support-ticket-writing-skill-codex/preview"
    });
    const missingProfile = await app.inject({
      method: "GET",
      url: "/api/skills/support-ticket-writing-skill/exports/missing-profile/preview"
    });

    expect(missingSkill.statusCode).toBe(404);
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

  it("GET /api/search?type=skill&q= returns Skill results only", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/search?type=skill&q=support" });
    const emptyResponse = await app.inject({ method: "GET", url: "/api/search?type=skill&q=zzzzzzzzqqqqqq" });

    expect(response.statusCode).toBe(200);
    expect(response.json().type).toBe("skill");
    expect(response.json().results.length).toBeGreaterThan(0);
    expect(response.json().results.every((result: { kind: string }) => result.kind.startsWith("skill"))).toBe(true);
    expect(emptyResponse.statusCode).toBe(200);
    expect(emptyResponse.json()).toMatchObject({ type: "skill", results: [] });
    await app.close();
    db.close();
  });

  it("GET /api/search honors pack and record scopes", async () => {
    const app = createApp({ config, db });
    const packResponse = await app.inject({ method: "GET", url: "/api/search?type=pack&q=workstation" });
    const recordResponse = await app.inject({ method: "GET", url: "/api/search?type=record&q=workstation" });

    expect(packResponse.statusCode).toBe(200);
    expect(packResponse.json().results.length).toBeGreaterThan(0);
    expect(packResponse.json().results.every((result: { kind: string }) => result.kind === "pack")).toBe(true);
    expect(recordResponse.statusCode).toBe(200);
    expect(recordResponse.json().results.length).toBeGreaterThan(0);
    expect(recordResponse.json().results.every((result: { kind: string }) => result.kind === "record")).toBe(true);
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
      recordsIndexed: 25,
      skillsIndexed: 8,
      skillInstructionsIndexed: 24
    });
    expect(JSON.stringify(response.json())).not.toContain(repoRoot);
    expect(JSON.stringify(response.json())).not.toContain("demo-skills");
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

  it("requires token auth on Skill export preview routes", async () => {
    db.close();
    const authedContext = createTestContext("test-token");
    const app = createApp(authedContext);
    const blocked = await app.inject({
      method: "GET",
      url: "/api/skills/support-ticket-writing-skill/exports/support-ticket-writing-skill-codex/preview"
    });
    const allowed = await app.inject({
      method: "GET",
      url: "/api/skills/support-ticket-writing-skill/exports/support-ticket-writing-skill-codex/preview",
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

  it("requires token auth on Skill API, typed search, and rescan routes", async () => {
    db.close();
    const authedContext = createTestContext("test-token");
    const app = createApp(authedContext);
    const blockedSkills = await app.inject({ method: "GET", url: "/api/skills" });
    const allowedSkills = await app.inject({
      method: "GET",
      url: "/api/skills",
      headers: { authorization: "Bearer test-token" }
    });
    const blockedSearch = await app.inject({ method: "GET", url: "/api/search?type=skill&q=support" });
    const allowedSearch = await app.inject({
      method: "GET",
      url: "/api/search?type=skill&q=support",
      headers: { "x-contextarr-token": "test-token" }
    });
    const blockedRescan = await app.inject({ method: "POST", url: "/api/rescan" });
    const allowedRescan = await app.inject({
      method: "POST",
      url: "/api/rescan",
      headers: { authorization: "Bearer test-token" }
    });
    const blockedSkillHealth = await app.inject({ method: "GET", url: "/api/skills/support-ticket-writing-skill/health" });
    const allowedSkillHealth = await app.inject({
      method: "GET",
      url: "/api/skills/support-ticket-writing-skill/health",
      headers: { authorization: "Bearer test-token" }
    });

    expect(blockedSkills.statusCode).toBe(401);
    expect(allowedSkills.statusCode).toBe(200);
    expect(blockedSearch.statusCode).toBe(401);
    expect(allowedSearch.statusCode).toBe(200);
    expect(blockedRescan.statusCode).toBe(401);
    expect(allowedRescan.statusCode).toBe(200);
    expect(blockedSkillHealth.statusCode).toBe(401);
    expect(allowedSkillHealth.statusCode).toBe(200);
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
