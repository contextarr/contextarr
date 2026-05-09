import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { beforeEach, describe, expect, it } from "vitest";
import { validatePack } from "@contextarr/pack-validator";
import { importToDraftPack } from "@contextarr/importers";
import { createApp } from "./api";
import { getAgentKitIndexDirs, getSkillIndexDirs } from "./config";
import { openDatabase, type ContextarrDatabase } from "./db";
import { rebuildIndex } from "./indexer";
import type { ServerConfig } from "./types";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const demoSkillsDir = path.join(repoRoot, "demo-skills");
const demoAgentKitsDir = path.join(repoRoot, "demo-agent-kits");
const agentKitTemplatesDir = path.join(repoRoot, "agent-kit-templates");
const validatorFixturesDir = path.join(repoRoot, "packages/pack-validator/test/fixtures");

function createTestContext(
  apiToken?: string,
  packsDir = demoPacksDir,
  overrides: Partial<ServerConfig> = {}
): { db: ContextarrDatabase; config: ServerConfig } {
  const db = openDatabase(":memory:");
  const skillsDir = overrides.skillsDir ?? demoSkillsDir;
  const draftPacksDir = overrides.draftPacksDir ?? path.join(os.tmpdir(), "contextarr-no-draft-packs");
  const importedPacksDir = overrides.importedPacksDir ?? path.join(os.tmpdir(), "contextarr-no-imported-packs");
  const composedPacksDir = overrides.composedPacksDir ?? path.join(os.tmpdir(), "contextarr-no-composed-packs");
  const importedSkillsDir = overrides.importedSkillsDir ?? path.join(os.tmpdir(), "contextarr-no-imported-skills");
  const agentKitsDir = overrides.agentKitsDir ?? path.join(os.tmpdir(), "contextarr-no-local-agent-kits");
  const resolvedDemoAgentKitsDir =
    overrides.demoAgentKitsDir ?? (packsDir === demoPacksDir && skillsDir === demoSkillsDir ? demoAgentKitsDir : path.join(os.tmpdir(), "contextarr-no-demo-agent-kits"));
  const config: ServerConfig = {
    host: "127.0.0.1",
    port: 0,
    packsDir,
    draftPacksDir,
    importedPacksDir,
    composedPacksDir,
    skillsDir,
    importedSkillsDir,
    agentKitsDir,
    demoAgentKitsDir: resolvedDemoAgentKitsDir,
    agentKitTemplatesDir,
    databasePath: ":memory:",
    apiToken,
    localImportsEnabled: false,
    ...overrides
  };
  rebuildIndex(db, packsDir, getSkillIndexDirs(config), getAgentKitIndexDirs(config));
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

function createTempAgentKitsDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-agent-kit-save-"));
}

function createTempComposedPacksDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-composed-pack-save-"));
}

function createMarkdownDraftPack(outputDir: string, packId: string, name = "Draft Review Pack"): string {
  const inputDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-draft-input-"));
  fs.writeFileSync(
    path.join(inputDir, "note.md"),
    `# ${name}\n\nThis public-safe fixture note becomes a private unreviewed draft record.\n`,
    "utf8"
  );
  const result = importToDraftPack({
    inputPath: inputDir,
    kind: "markdown",
    outputDir,
    packId,
    name,
    maxRecords: 3,
    overwrite: true,
    generatedAt: "2026-05-09T00:00:00.000Z"
  });
  fs.rmSync(inputDir, { recursive: true, force: true });
  return result.packPath;
}

function copyDemoPacksFixture(prefix: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  for (const entry of fs.readdirSync(demoPacksDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      fs.cpSync(path.join(demoPacksDir, entry.name), path.join(root, entry.name), { recursive: true });
    }
  }
  return root;
}

function replaceInFile(filePath: string, search: string | RegExp, replacement: string): void {
  fs.writeFileSync(filePath, fs.readFileSync(filePath, "utf8").replace(search, replacement), "utf8");
}

function saveAgentKitPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "phase22-local-kit",
    name: "Phase 22 Local Kit",
    description: "Local data-only Agent Kit saved from existing indexed objects.",
    contextPackIds: ["internal-support-kb-pack"],
    skillIds: ["support-ticket-writing-skill"],
    target: "codex",
    format: "markdown",
    privacyMode: "redacted",
    ...overrides
  };
}

function listFilesRecursive(root: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(root)) {
    return files;
  }

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function expectPathInside(root: string, value: string): void {
  const relative = path.relative(path.resolve(root), path.resolve(value));
  expect(relative).not.toBe("..");
  expect(relative.startsWith(`..${path.sep}`)).toBe(false);
  expect(path.isAbsolute(relative)).toBe(false);
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
        exportProfiles: 40,
        skills: 8,
        skillInstructions: 24,
        skillExamples: 16,
        skillSources: 24,
        skillExportProfiles: 48,
        agentKits: 8,
        agentKitContextPackRefs: 15,
        agentKitSkillRefs: 17,
        agentKitExportProfiles: 24,
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
          exportProfileCount: 8,
          healthStatus: "healthy",
          coverImage: null,
          reviewQueueCount: 0
        })
      ])
    );
    await app.close();
    db.close();
  });

  it("rejects remote Context Pack cover image refs before they reach web clients", async () => {
    const packId = "ai-workstation-pack";
    const manifestJson = db.prepare("SELECT manifest_json FROM packs WHERE id = ?").pluck().get(packId) as string;
    const manifest = JSON.parse(manifestJson) as Record<string, unknown>;
    db.prepare("UPDATE packs SET manifest_json = ?, cover_image = ? WHERE id = ?").run(
      JSON.stringify({
        ...manifest,
        assets: {
          ...(manifest.assets as Record<string, unknown>),
          coverImage: "https://example.invalid/pack-cover.png"
        }
      }),
      "https://example.invalid/pack-cover.png",
      packId
    );

    const app = createApp({ config, db });
    const detail = await app.inject({ method: "GET", url: `/api/packs/${packId}` });
    const list = await app.inject({ method: "GET", url: "/api/packs" });

    expect(detail.statusCode).toBe(200);
    expect(detail.json().coverImage).toBeNull();
    expect(detail.json().manifest.assets).not.toHaveProperty("coverImage");
    expect(list.statusCode).toBe(200);
    expect(list.json().packs.find((pack: { id: string }) => pack.id === packId).coverImage).toBeNull();
    expect(JSON.stringify(detail.json())).not.toContain("example.invalid");
    expect(JSON.stringify(list.json())).not.toContain("example.invalid");
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

  it("GET /api/agent-kits/:id/health returns deterministic Agent Kit health checks", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/agent-kits/support-ticket-writing-kit/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      agentKitId: "support-ticket-writing-kit",
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

  it("GET /api/agent-kits/:id/health returns 404 for unknown Agent Kits", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/agent-kits/missing-local-kit/health" });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: "not_found",
      message: "Agent Kit not found: missing-local-kit"
    });
    await app.close();
    db.close();
  });

  it("keeps every demo Agent Kit healthy with an empty review queue", async () => {
    const app = createApp({ config, db });
    const agentKitsResponse = await app.inject({ method: "GET", url: "/api/agent-kits" });

    expect(agentKitsResponse.statusCode).toBe(200);
    for (const agentKit of agentKitsResponse.json().agentKits as Array<{ id: string }>) {
      const healthResponse = await app.inject({ method: "GET", url: `/api/agent-kits/${agentKit.id}/health` });
      expect(healthResponse.statusCode).toBe(200);
      expect(healthResponse.json()).toMatchObject({
        agentKitId: agentKit.id,
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

  it("keeps local Skill import endpoints disabled unless explicitly enabled", async () => {
    const app = createApp({ config, db });
    const health = await app.inject({ method: "GET", url: "/api/health" });
    const response = await app.inject({
      method: "POST",
      url: "/api/import-skills/preview",
      payload: {
        inputPath: path.join(repoRoot, "packages/importers/test/fixtures/skill-markdown-folder"),
        kind: "markdown"
      }
    });

    expect(health.statusCode).toBe(200);
    expect(health.json()).toMatchObject({ localImportsEnabled: false });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ error: "local_imports_disabled" });
    await app.close();
    db.close();
  });

  it("previews and writes local draft Skill imports when enabled", async () => {
    const importedSkillsDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-imported-skills-"));
    const fixtureContext = createTestContext(undefined, demoPacksDir, {
      importedSkillsDir,
      localImportsEnabled: true
    });
    const app = createApp(fixtureContext);

    try {
      const preview = await app.inject({
        method: "POST",
        url: "/api/import-skills/preview",
        payload: {
          inputPath: path.join(repoRoot, "packages/importers/test/fixtures/skill-markdown-folder"),
          kind: "markdown",
          skillId: "api-imported-skill",
          maxDocs: 2
        }
      });
      const write = await app.inject({
        method: "POST",
        url: "/api/import-skills",
        payload: {
          inputPath: path.join(repoRoot, "packages/importers/test/fixtures/skill-markdown-folder"),
          kind: "markdown",
          skillId: "api-imported-skill",
          name: "API Imported Skill",
          overwrite: true
        }
      });
      const skill = await app.inject({ method: "GET", url: "/api/skills/api-imported-skill" });
      const health = await app.inject({ method: "GET", url: "/api/skills/api-imported-skill/health" });

      expect(preview.statusCode).toBe(200);
      expect(preview.json()).toMatchObject({
        ok: true,
        skillId: "api-imported-skill",
        counts: {
          documents: 2,
          sources: 2
        }
      });
      expect(preview.body).not.toContain(importedSkillsDir);
      expect(write.statusCode).toBe(201);
      expect(write.json()).toMatchObject({
        ok: true,
        skillId: "api-imported-skill",
        validation: {
          valid: true,
          errors: 0
        }
      });
      expect(write.body).not.toContain(importedSkillsDir);
      expect(fs.existsSync(path.join(importedSkillsDir, "api-imported-skill", "contextarr-skill.json"))).toBe(true);
      expect(skill.statusCode).toBe(200);
      expect(skill.json()).toMatchObject({
        id: "api-imported-skill",
        trustLevel: "unreviewed",
        visibility: "private"
      });
      expect(health.statusCode).toBe(200);
      expect(health.json().reviewQueueCount).toBeGreaterThan(0);
      expect(health.json().items).toEqual(
        expect.arrayContaining([expect.objectContaining({ objectType: "skill", type: "review_status" })])
      );
    } finally {
      await app.close();
      fixtureContext.db.close();
      fs.rmSync(importedSkillsDir, { recursive: true, force: true });
    }
  });

  it("protects enabled Skill import endpoints with the optional API token", async () => {
    const importedSkillsDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-imported-skills-auth-"));
    const fixtureContext = createTestContext("secret-token", demoPacksDir, {
      importedSkillsDir,
      localImportsEnabled: true
    });
    const app = createApp(fixtureContext);

    try {
      const unauthorized = await app.inject({
        method: "POST",
        url: "/api/import-skills/preview",
        payload: { inputPath: path.join(repoRoot, "packages/importers/test/fixtures/skill-markdown-folder") }
      });
      const unauthorizedWrite = await app.inject({
        method: "POST",
        url: "/api/import-skills",
        payload: { inputPath: path.join(repoRoot, "packages/importers/test/fixtures/skill-markdown-folder") }
      });
      const authorized = await app.inject({
        method: "POST",
        url: "/api/import-skills/preview",
        headers: { Authorization: "Bearer secret-token" },
        payload: { inputPath: path.join(repoRoot, "packages/importers/test/fixtures/skill-markdown-folder") }
      });

      expect(unauthorized.statusCode).toBe(401);
      expect(unauthorizedWrite.statusCode).toBe(401);
      expect(authorized.statusCode).toBe(200);
    } finally {
      await app.close();
      fixtureContext.db.close();
      fs.rmSync(importedSkillsDir, { recursive: true, force: true });
    }
  });

  it("rejects local Skill imports with invalid write payloads and duplicate indexed IDs", async () => {
    const importedSkillsDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-imported-skills-errors-"));
    const fixtureContext = createTestContext(undefined, demoPacksDir, {
      importedSkillsDir,
      localImportsEnabled: true
    });
    const app = createApp(fixtureContext);

    try {
      const invalidPayload = await app.inject({
        method: "POST",
        url: "/api/import-skills",
        payload: { kind: "markdown" }
      });
      const malformedInput = await app.inject({
        method: "POST",
        url: "/api/import-skills",
        payload: {
          inputPath: path.join(repoRoot, "packages/importers/test/fixtures/malformed-chatgpt-prompts"),
          kind: "chatgpt-prompts",
          skillId: "malformed-prompt-import"
        }
      });
      const duplicateSkill = await app.inject({
        method: "POST",
        url: "/api/import-skills",
        payload: {
          inputPath: path.join(repoRoot, "packages/importers/test/fixtures/skill-markdown-folder"),
          kind: "markdown",
          skillId: "support-ticket-writing-skill",
          overwrite: true
        }
      });

      expect(invalidPayload.statusCode).toBe(400);
      expect(malformedInput.statusCode).toBe(422);
      expect(malformedInput.json()).toMatchObject({ error: "chatgpt_prompts.no_prompts" });
      expect(duplicateSkill.statusCode).toBe(409);
      expect(duplicateSkill.json()).toMatchObject({ error: "output.skill_id_conflict" });
      expect(duplicateSkill.body).not.toContain(importedSkillsDir);
      expect(fs.existsSync(path.join(importedSkillsDir, "support-ticket-writing-skill"))).toBe(false);
    } finally {
      await app.close();
      fixtureContext.db.close();
      fs.rmSync(importedSkillsDir, { recursive: true, force: true });
    }
  });

  it("lists, previews, and writes local Context Pack collector drafts without indexing them as active packs", async () => {
    const draftPacksDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-draft-packs-"));
    const fixtureContext = createTestContext(undefined, demoPacksDir, { draftPacksDir });
    const app = createApp(fixtureContext);

    try {
      const list = await app.inject({ method: "GET", url: "/api/context-pack-collectors" });
      const preview = await app.inject({
        method: "POST",
        url: "/api/context-pack-collectors/markdown-folder/preview",
        payload: {
          inputPath: path.join(repoRoot, "packages/importers/test/fixtures/markdown-folder"),
          packId: "api-collector-pack",
          maxRecords: 1
        }
      });
      const write = await app.inject({
        method: "POST",
        url: "/api/context-pack-collectors/markdown-folder/run",
        payload: {
          inputPath: path.join(repoRoot, "packages/importers/test/fixtures/markdown-folder"),
          packId: "api-collector-pack",
          name: "API Collector Pack",
          overwrite: true
        }
      });
      const activePack = await app.inject({ method: "GET", url: "/api/packs/api-collector-pack" });

      expect(list.statusCode).toBe(200);
      expect(list.json().collectors.map((collector: { id: string }) => collector.id)).toEqual([
        "blank-pack-starter",
        "markdown-folder",
        "project-notes",
        "support-kb-starter"
      ]);
      expect(list.body).not.toContain(draftPacksDir);
      expect(preview.statusCode).toBe(200);
      expect(preview.json()).toMatchObject({
        ok: true,
        collectorId: "markdown-folder",
        packId: "api-collector-pack",
        sourceCount: 1
      });
      expect(write.statusCode).toBe(201);
      expect(write.json()).toMatchObject({
        ok: true,
        packId: "api-collector-pack",
        validation: {
          valid: true,
          errors: 0
        },
        draft: {
          status: "review_required",
          indexed: false
        }
      });
      expect(write.body).not.toContain(draftPacksDir);
      expect(fs.existsSync(path.join(draftPacksDir, "api-collector-pack", "contextarr-pack.json"))).toBe(true);
      expect(activePack.statusCode).toBe(404);
    } finally {
      await app.close();
      fixtureContext.db.close();
      fs.rmSync(draftPacksDir, { recursive: true, force: true });
    }
  });

  it("protects Context Pack collector writes with token auth and rejects invalid requests", async () => {
    const draftPacksDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-draft-packs-auth-"));
    const fixtureContext = createTestContext("collector-token", demoPacksDir, { draftPacksDir });
    const app = createApp(fixtureContext);

    try {
      const unauthorized = await app.inject({
        method: "POST",
        url: "/api/context-pack-collectors/blank-pack-starter/run",
        payload: { packId: "unauthorized-pack" }
      });
      const invalidCollector = await app.inject({
        method: "POST",
        url: "/api/context-pack-collectors/not-real/run",
        headers: { Authorization: "Bearer collector-token" },
        payload: {}
      });
      const invalidBody = await app.inject({
        method: "POST",
        url: "/api/context-pack-collectors/blank-pack-starter/run",
        headers: { Authorization: "Bearer collector-token" },
        payload: { telemetry: true }
      });
      const activeConflict = await app.inject({
        method: "POST",
        url: "/api/context-pack-collectors/blank-pack-starter/run",
        headers: { Authorization: "Bearer collector-token" },
        payload: { packId: "ai-workstation-pack", overwrite: true }
      });
      const missingInputPath = path.join(os.tmpdir(), "contextarr-private-input-does-not-exist");
      const missingInput = await app.inject({
        method: "POST",
        url: "/api/context-pack-collectors/markdown-folder/preview",
        headers: { Authorization: "Bearer collector-token" },
        payload: { inputPath: missingInputPath }
      });
      const authorized = await app.inject({
        method: "POST",
        url: "/api/context-pack-collectors/blank-pack-starter/run",
        headers: { Authorization: "Bearer collector-token" },
        payload: { packId: "authorized-collector-pack" }
      });

      expect(unauthorized.statusCode).toBe(401);
      expect(invalidCollector.statusCode).toBe(404);
      expect(invalidBody.statusCode).toBe(400);
      expect(activeConflict.statusCode).toBe(409);
      expect(activeConflict.json()).toMatchObject({ error: "output.pack_id_conflict" });
      expect(missingInput.statusCode).toBe(400);
      expect(missingInput.json()).toMatchObject({
        error: "input.not_found",
        message: "Collector input path is not available or cannot be read."
      });
      expect(missingInput.body).not.toContain(missingInputPath);
      expect(authorized.statusCode).toBe(201);
    } finally {
      await app.close();
      fixtureContext.db.close();
      fs.rmSync(draftPacksDir, { recursive: true, force: true });
    }
  });

  it("lists, validates, and activates Context Pack drafts without indexing or approval changes", async () => {
    const activePacksDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-active-pack-root-"));
    const draftPacksDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-draft-pack-root-"));
    const importedPacksDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-imported-pack-root-"));
    const composedPacksDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-composed-pack-root-"));
    createMarkdownDraftPack(draftPacksDir, "collector-review-draft", "Collector Review Draft");
    createMarkdownDraftPack(importedPacksDir, "imported-review-draft", "Imported Review Draft");
    createMarkdownDraftPack(composedPacksDir, "composed-review-draft", "Composed Review Draft");
    const fixtureContext = createTestContext(undefined, activePacksDir, {
      draftPacksDir,
      importedPacksDir,
      composedPacksDir,
      skillsDir: path.join(os.tmpdir(), "contextarr-no-skills-for-drafts"),
      demoAgentKitsDir: path.join(os.tmpdir(), "contextarr-no-agent-kits-for-drafts")
    });
    const app = createApp(fixtureContext);

    try {
      const list = await app.inject({ method: "GET", url: "/api/context-pack-drafts" });
      const drafts = list.json().drafts as Array<{ id: string; packId: string; sourceType: string; contentHash: string }>;
      const imported = drafts.find((draft) => draft.packId === "imported-review-draft");
      expect(list.statusCode).toBe(200);
      expect(drafts).toHaveLength(3);
      expect(drafts.map((draft) => draft.sourceType).sort()).toEqual(["collector", "composed", "imported"]);
      expect(list.body).not.toContain(draftPacksDir);
      expect(list.body).not.toContain(importedPacksDir);
      expect(list.body).not.toContain(composedPacksDir);
      expect(imported).toBeDefined();

      const detail = await app.inject({ method: "GET", url: `/api/context-pack-drafts/${encodeURIComponent(imported!.id)}` });
      const validate = await app.inject({ method: "POST", url: `/api/context-pack-drafts/${encodeURIComponent(imported!.id)}/validate` });
      const activate = await app.inject({
        method: "POST",
        url: `/api/context-pack-drafts/${encodeURIComponent(imported!.id)}/activate`,
        payload: { expectedHash: imported!.contentHash }
      });
      const activeLookup = await app.inject({ method: "GET", url: "/api/packs/imported-review-draft" });
      const duplicateActivate = await app.inject({
        method: "POST",
        url: `/api/context-pack-drafts/${encodeURIComponent(imported!.id)}/activate`,
        payload: { expectedHash: imported!.contentHash }
      });

      expect(detail.statusCode).toBe(200);
      expect(detail.json()).toMatchObject({
        packId: "imported-review-draft",
        activation: { canActivate: true },
        security: { status: "policy_clean" }
      });
      expect(detail.json().records).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            reviewStatus: "draft",
            privacy: "private",
            tags: expect.arrayContaining(["imported_draft", "never_export"])
          })
        ])
      );
      expect(validate.statusCode).toBe(200);
      expect(validate.json()).toMatchObject({ ok: true, draft: { packId: "imported-review-draft" } });
      expect(activate.statusCode).toBe(201);
      expect(activate.json()).toMatchObject({
        ok: true,
        packId: "imported-review-draft",
        activated: {
          status: "activated_for_review",
          indexed: false,
          approvalChanged: false,
          exportReady: false,
          mcpReady: false
        }
      });
      expect(fs.existsSync(path.join(activePacksDir, "imported-review-draft", "contextarr-pack.json"))).toBe(true);
      expect(validatePack(path.join(activePacksDir, "imported-review-draft")).summary.errors).toBe(0);
      const copiedRecords = listFilesRecursive(path.join(activePacksDir, "imported-review-draft", "records"))
        .map((file) => fs.readFileSync(file, "utf8"))
        .join("\n");
      expect(copiedRecords).toContain("review_status: draft");
      expect(copiedRecords).toContain("privacy: private");
      expect(copiedRecords).toContain("never_export");
      expect(activeLookup.statusCode).toBe(404);
      expect(duplicateActivate.statusCode).toBe(409);
      expect(duplicateActivate.json()).toMatchObject({ error: "active_pack.exists" });
    } finally {
      await app.close();
      fixtureContext.db.close();
      fs.rmSync(activePacksDir, { recursive: true, force: true });
      fs.rmSync(draftPacksDir, { recursive: true, force: true });
      fs.rmSync(importedPacksDir, { recursive: true, force: true });
      fs.rmSync(composedPacksDir, { recursive: true, force: true });
    }
  });

  it("blocks draft activation for scanner findings and protects draft endpoints with token auth", async () => {
    const activePacksDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-active-pack-root-auth-"));
    const importedPacksDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-imported-pack-root-auth-"));
    const blockedPackPath = createMarkdownDraftPack(importedPacksDir, "blocked-review-draft", "Blocked Review Draft");
    fs.writeFileSync(path.join(blockedPackPath, "unsafe.ps1"), "Write-Host 'not allowed'\n", "utf8");
    const fixtureContext = createTestContext("draft-token", activePacksDir, {
      draftPacksDir: fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-draft-pack-root-auth-")),
      importedPacksDir,
      composedPacksDir: fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-composed-pack-root-auth-")),
      skillsDir: path.join(os.tmpdir(), "contextarr-no-skills-for-draft-auth"),
      demoAgentKitsDir: path.join(os.tmpdir(), "contextarr-no-agent-kits-for-draft-auth")
    });
    const app = createApp(fixtureContext);

    try {
      const unauthorized = await app.inject({ method: "GET", url: "/api/context-pack-drafts" });
      const list = await app.inject({
        method: "GET",
        url: "/api/context-pack-drafts",
        headers: { Authorization: "Bearer draft-token" }
      });
      const draft = (list.json().drafts as Array<{ id: string; activation: { canActivate: boolean }; security: { blocked: boolean } }>)[0]!;
      const invalidBody = await app.inject({
        method: "POST",
        url: `/api/context-pack-drafts/${encodeURIComponent(draft.id)}/activate`,
        headers: { Authorization: "Bearer draft-token" },
        payload: { overwrite: true }
      });
      const blocked = await app.inject({
        method: "POST",
        url: `/api/context-pack-drafts/${encodeURIComponent(draft.id)}/activate`,
        headers: { Authorization: "Bearer draft-token" },
        payload: {}
      });

      expect(unauthorized.statusCode).toBe(401);
      expect(list.statusCode).toBe(200);
      expect(draft.activation.canActivate).toBe(false);
      expect(draft.security.blocked).toBe(true);
      expect(invalidBody.statusCode).toBe(400);
      expect(invalidBody.json()).toMatchObject({ error: "invalid_draft_activation_request" });
      expect(blocked.statusCode).toBe(400);
      expect(blocked.json()).toMatchObject({ error: "draft.activation_blocked" });
      expect(blocked.body).not.toContain(importedPacksDir);
      expect(fs.existsSync(path.join(activePacksDir, "blocked-review-draft"))).toBe(false);
    } finally {
      await app.close();
      fixtureContext.db.close();
      fs.rmSync(activePacksDir, { recursive: true, force: true });
      fs.rmSync(importedPacksDir, { recursive: true, force: true });
      fs.rmSync(fixtureContext.config.draftPacksDir, { recursive: true, force: true });
      fs.rmSync(fixtureContext.config.composedPacksDir, { recursive: true, force: true });
    }
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

  it("GET /api/review-items filters Agent Kit items and status updates refresh Agent Kit health", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-api-agent-kit-status-"));
    const agentKitRoot = path.join(tempRoot, "support-ticket-writing-kit");
    db.close();

    try {
      fs.cpSync(path.join(demoAgentKitsDir, "support-ticket-writing-kit"), agentKitRoot, { recursive: true });
      const manifestPath = path.join(agentKitRoot, "contextarr-agent-kit.json");
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { lastReviewedAt: string };
      manifest.lastReviewedAt = "2025-01-01T00:00:00Z";
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

      const fixtureContext = createTestContext(undefined, demoPacksDir, {
        demoAgentKitsDir: tempRoot,
        agentKitsDir: path.join(os.tmpdir(), "contextarr-no-local-agent-kits")
      });
      const app = createApp(fixtureContext);
      const before = await app.inject({ method: "GET", url: "/api/agent-kits/support-ticket-writing-kit/health" });
      const filtered = await app.inject({
        method: "GET",
        url: "/api/review-items?objectType=agent_kit&objectId=support-ticket-writing-kit"
      });
      const reviewItem = before.json().items.find((item: { type: string }) => item.type === "freshness");

      expect(before.statusCode).toBe(200);
      expect(filtered.statusCode).toBe(200);
      expect(filtered.json().items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            objectType: "agent_kit",
            objectId: "support-ticket-writing-kit",
            agentKitId: "support-ticket-writing-kit",
            type: "freshness"
          })
        ])
      );
      expect(reviewItem).toBeDefined();

      const update = await app.inject({
        method: "POST",
        url: `/api/review-items/${reviewItem.id}/status`,
        payload: { status: "ignored" }
      });
      const after = await app.inject({ method: "GET", url: "/api/agent-kits/support-ticket-writing-kit/health" });

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

  it("sanitizes skipped Agent Kit issue paths from rescan responses", async () => {
    const missingAgentKitsDir = path.join(os.tmpdir(), `contextarr-missing-agent-kits-${Date.now()}`);
    db.close();

    const fixtureContext = createTestContext(undefined, demoPacksDir, { demoAgentKitsDir: missingAgentKitsDir });
    const app = createApp(fixtureContext);
    const response = await app.inject({ method: "POST", url: "/api/rescan" });

    expect(response.statusCode).toBe(200);
    expect(response.json().skippedAgentKits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          issues: expect.arrayContaining([expect.objectContaining({ code: "agent_kits_dir.missing" })])
        })
      ])
    );
    expect(JSON.stringify(response.json())).not.toContain(missingAgentKitsDir);
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
        exportProfiles: 8
      }
    });
    await app.close();
    db.close();
  });

  it("projects research-delta validation, source, readiness, and record fields through the API", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-api-research-delta-"));
    const packRoot = path.join(tempRoot, "stale-source-pack");
    fs.cpSync(path.join(validatorFixturesDir, "stale-source-pack"), packRoot, { recursive: true });
    const sourcesPath = path.join(packRoot, "sources", "sources.yaml");
    const sourceMap = YAML.parse(fs.readFileSync(sourcesPath, "utf8")) as { sources: Array<Record<string, unknown>> };
    sourceMap.sources[0] = {
      ...sourceMap.sources[0],
      content_hash_algorithm: "sha256",
      content_hash: "0".repeat(64),
      hash_calculated_at: "2026-05-07T00:00:00Z"
    };
    fs.writeFileSync(sourcesPath, YAML.stringify(sourceMap), "utf8");

    const fixtureContext = createTestContext(undefined, tempRoot, {
      skillsDir: path.join(os.tmpdir(), "contextarr-no-skills"),
      agentKitsDir: path.join(os.tmpdir(), "contextarr-no-agent-kits"),
      demoAgentKitsDir: path.join(os.tmpdir(), "contextarr-no-demo-agent-kits")
    });
    const app = createApp({ config: fixtureContext.config, db: fixtureContext.db });
    const detail = await app.inject({ method: "GET", url: "/api/packs/stale-source-pack" });
    const record = await app.inject({ method: "GET", url: "/api/records/stale-source-pack.overview" });
    const health = await app.inject({ method: "GET", url: "/api/packs/stale-source-pack/health" });

    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({
      validation: {
        status: "valid_with_warnings",
        staleSourceCount: 1,
        licenseWarningCount: 0
      },
      exportReadiness: {
        status: "ready_with_warnings",
        profilesWithWarnings: 1
      }
    });
    expect(String(detail.json().packPath ?? "")).not.toContain(":\\");
    expect(detail.json().sources[0]).toMatchObject({
      licenseStatus: "known_permissive",
      contentHashAlgorithm: "sha256",
      contentHash: "0".repeat(64),
      staleAfterDays: 30
    });
    expect(detail.json().sources[0]).not.toHaveProperty("path");
    expect(detail.json().exportReadiness.profiles[0]).toMatchObject({
      id: "stale-source-pack-codex",
      status: "ready_with_warnings",
      warningIssueCodes: expect.arrayContaining(["export_profile.readiness_warning"])
    });
    expect(record.json()).toMatchObject({
      id: "stale-source-pack.overview",
      staleSourceCount: 1,
      resolvedSources: [expect.objectContaining({ licenseStatus: "known_permissive", contentHash: "0".repeat(64) })]
    });
    expect(record.json().resolvedSources[0]).not.toHaveProperty("path");
    expect(health.json().checks).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "freshness", status: "warning" })])
    );

    await app.close();
    fixtureContext.db.close();
    db.close();
    fs.rmSync(tempRoot, { recursive: true, force: true });
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

  it("GET /api/agent-kits returns demo Agent Kit summaries", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/agent-kits" });

    expect(response.statusCode).toBe(200);
    expect(response.json().agentKits).toHaveLength(8);
    expect(response.json().agentKits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "support-ticket-writing-kit",
          contextPackCount: 2,
          skillCount: 2,
          exportProfileCount: 3,
          target: "codex",
          privacyMode: "redacted",
          healthStatus: "healthy",
          reviewQueueCount: 0
        })
      ])
    );
    await app.close();
    db.close();
  });

  it("GET /api/agent-kit-templates returns public-safe template summaries and detail", async () => {
    const app = createApp({ config, db });
    const list = await app.inject({ method: "GET", url: "/api/agent-kit-templates" });
    const detail = await app.inject({ method: "GET", url: "/api/agent-kit-templates/coding-task-kit-template" });

    expect(list.statusCode).toBe(200);
    expect(list.json().templates).toHaveLength(8);
    expect(list.json().skipped).toEqual([]);
    expect(list.json().templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "coding-task-kit-template",
          category: "coding",
          suggestedAgentKit: expect.objectContaining({
            id: "coding-task-kit-draft",
            contextPacks: ["claude-code-project-pack"],
            skills: ["implementation-planning-skill", "bug-report-structuring-skill", "security-review-skill"],
            target: "codex",
            format: "markdown",
            privacyMode: "redacted",
            excludeTags: ["secret", "never_export", "imported_draft"]
          })
        })
      ])
    );
    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({
      id: "coding-task-kit-template",
      safetyNotes: expect.arrayContaining(["Review the draft before export."])
    });
    expect(JSON.stringify(detail.json())).not.toContain(agentKitTemplatesDir);
    await app.close();
    db.close();
  });

  it("POST /api/agent-kit-templates/:id/create writes an unreviewed local draft Agent Kit", async () => {
    db.close();
    const agentKitsDir = createTempAgentKitsDir();
    const fixtureContext = createTestContext(undefined, demoPacksDir, { agentKitsDir });
    const app = createApp(fixtureContext);
    const response = await app.inject({
      method: "POST",
      url: "/api/agent-kit-templates/coding-task-kit-template/create",
      payload: {
        id: "phase27-coding-template-kit",
        name: "Phase 27 Coding Template Kit"
      }
    });
    const savedPath = fixtureContext.db
      .prepare("SELECT agent_kit_path FROM agent_kits WHERE id = ?")
      .pluck()
      .get("phase27-coding-template-kit") as string;
    const manifest = JSON.parse(fs.readFileSync(path.join(savedPath, "contextarr-agent-kit.json"), "utf8"));

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      ok: true,
      id: "phase27-coding-template-kit",
      template: {
        id: "coding-task-kit-template"
      },
      agentKit: {
        id: "phase27-coding-template-kit",
        trustLevel: "unreviewed"
      },
      validation: {
        errors: 0
      }
    });
    expectPathInside(agentKitsDir, savedPath);
    expect(manifest).toMatchObject({
      id: "phase27-coding-template-kit",
      name: "Phase 27 Coding Template Kit",
      trustLevel: "unreviewed",
      lastReviewedAt: null,
      author: "Contextarr Template",
      contextPacks: ["claude-code-project-pack"],
      skills: ["implementation-planning-skill", "bug-report-structuring-skill", "security-review-skill"],
      containsExecutableCode: false,
      requiresNetwork: false
    });
    expect(fs.existsSync(path.join(demoAgentKitsDir, "phase27-coding-template-kit"))).toBe(false);
    expect(JSON.stringify(response.json())).not.toContain(agentKitsDir);
    await app.close();
    fixtureContext.db.close();
  });

  it("POST /api/agent-kit-templates/:id/create rejects invalid, missing, duplicate, and protected requests", async () => {
    db.close();
    const agentKitsDir = createTempAgentKitsDir();
    const fixtureContext = createTestContext(undefined, demoPacksDir, { agentKitsDir });
    const app = createApp(fixtureContext);
    const invalidField = await app.inject({
      method: "POST",
      url: "/api/agent-kit-templates/coding-task-kit-template/create",
      payload: { telemetry: true }
    });
    const missingTemplate = await app.inject({
      method: "POST",
      url: "/api/agent-kit-templates/missing-template/create",
      payload: {}
    });
    const missingReference = await app.inject({
      method: "POST",
      url: "/api/agent-kit-templates/coding-task-kit-template/create",
      payload: { id: "missing-template-ref-kit", contextPacks: ["missing-pack"] }
    });
    const first = await app.inject({
      method: "POST",
      url: "/api/agent-kit-templates/coding-task-kit-template/create",
      payload: { id: "duplicate-template-kit" }
    });
    const duplicate = await app.inject({
      method: "POST",
      url: "/api/agent-kit-templates/coding-task-kit-template/create",
      payload: { id: "duplicate-template-kit" }
    });

    expect(invalidField.statusCode).toBe(400);
    expect(invalidField.json()).toMatchObject({ error: "invalid_agent_kit_template_request" });
    expect(missingTemplate.statusCode).toBe(404);
    expect(missingReference.statusCode).toBe(404);
    expect(missingReference.json()).toMatchObject({ error: "missing_references", missingContextPackIds: ["missing-pack"] });
    expect(first.statusCode).toBe(201);
    expect(duplicate.statusCode).toBe(409);
    await app.close();
    fixtureContext.db.close();

    const authedContext = createTestContext("test-token", demoPacksDir, { agentKitsDir: createTempAgentKitsDir() });
    const authedApp = createApp(authedContext);
    const blocked = await authedApp.inject({
      method: "POST",
      url: "/api/agent-kit-templates/coding-task-kit-template/create",
      payload: { id: "blocked-template-kit" }
    });
    const allowed = await authedApp.inject({
      method: "POST",
      url: "/api/agent-kit-templates/coding-task-kit-template/create",
      headers: { authorization: "Bearer test-token" },
      payload: { id: "allowed-template-kit" }
    });

    expect(blocked.statusCode).toBe(401);
    expect(allowed.statusCode).toBe(201);
    await authedApp.close();
    authedContext.db.close();
  });

  it("POST /api/agent-kits saves a validated local Agent Kit and refreshes the listing", async () => {
    db.close();
    const agentKitsDir = createTempAgentKitsDir();
    const fixtureContext = createTestContext(undefined, demoPacksDir, { agentKitsDir });
    const app = createApp(fixtureContext);
    const response = await app.inject({
      method: "POST",
      url: "/api/agent-kits",
      payload: saveAgentKitPayload()
    });
    const list = await app.inject({ method: "GET", url: "/api/agent-kits" });
    const detail = await app.inject({ method: "GET", url: "/api/agent-kits/phase22-local-kit" });
    const savedPath = fixtureContext.db
      .prepare("SELECT agent_kit_path FROM agent_kits WHERE id = ?")
      .pluck()
      .get("phase22-local-kit") as string;
    const savedFiles = listFilesRecursive(savedPath).map((file) => path.relative(savedPath, file).replace(/\\/g, "/")).sort();
    const manifest = JSON.parse(fs.readFileSync(path.join(savedPath, "contextarr-agent-kit.json"), "utf8"));
    const profile = YAML.parse(fs.readFileSync(path.join(savedPath, "exports", "codex.yaml"), "utf8"));
    const redaction = YAML.parse(fs.readFileSync(path.join(savedPath, "rules", "redaction.yaml"), "utf8"));
    const compatibility = YAML.parse(fs.readFileSync(path.join(savedPath, "rules", "compatibility.yaml"), "utf8"));

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      ok: true,
      id: "phase22-local-kit",
      validation: { errors: 0 },
      agentKit: {
        id: "phase22-local-kit",
        contextPackCount: 1,
        skillCount: 1,
        target: "codex"
      }
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().agentKits.map((kit: { id: string }) => kit.id)).toContain("phase22-local-kit");
    expect(detail.statusCode).toBe(200);
    expectPathInside(agentKitsDir, savedPath);
    for (const file of listFilesRecursive(savedPath)) {
      expectPathInside(agentKitsDir, file);
    }
    expect(savedFiles).toEqual([
      "CHANGELOG.md",
      "LICENSE",
      "README.md",
      "contextarr-agent-kit.json",
      "exports/codex.yaml",
      "rules/compatibility.yaml",
      "rules/redaction.yaml",
      "rules/validation.yaml"
    ]);
    expect(manifest).toMatchObject({
      id: "phase22-local-kit",
      contextPacks: ["internal-support-kb-pack"],
      skills: ["support-ticket-writing-skill"],
      containsExecutableCode: false,
      requiresNetwork: false,
      permissions: {
        writeDrafts: false,
        runCommands: false,
        networkAccess: false,
        browserAutomation: false,
        toolExecution: false
      },
      target: "codex",
      exportProfile: "phase22-local-kit-codex",
      privacyMode: "redacted"
    });
    expect(profile).toMatchObject({
      id: "phase22-local-kit-codex",
      target: "codex",
      format: "markdown",
      privacy_mode: "redacted",
      include: {
        context_packs: ["internal-support-kb-pack"],
        skills: ["support-ticket-writing-skill"]
      }
    });
    expect(redaction.redact_tags).toEqual(expect.arrayContaining(["secret", "never_export", "imported_draft"]));
    expect(compatibility).toMatchObject({
      supported_targets: ["codex"],
      required_context_packs: ["internal-support-kb-pack"],
      required_skills: ["support-ticket-writing-skill"],
      allow_unreviewed_drafts: false,
      blocked_trust_levels: ["blocked", "deprecated"]
    });
    expect(fs.existsSync(path.join(demoAgentKitsDir, "phase22-local-kit"))).toBe(false);
    expect(JSON.stringify(response.json())).not.toContain(agentKitsDir);
    await app.close();
    fixtureContext.db.close();
  });

  it("POST /api/agent-kits rejects bad bodies and empty selections", async () => {
    const app = createApp({ config, db });
    const missingBody = await app.inject({ method: "POST", url: "/api/agent-kits", payload: {} });
    const emptyPacks = await app.inject({
      method: "POST",
      url: "/api/agent-kits",
      payload: saveAgentKitPayload({ contextPackIds: [] })
    });
    const emptySkills = await app.inject({
      method: "POST",
      url: "/api/agent-kits",
      payload: saveAgentKitPayload({ skillIds: [] })
    });
    const punctuationName = await app.inject({
      method: "POST",
      url: "/api/agent-kits",
      payload: saveAgentKitPayload({ id: undefined, name: "!!!" })
    });

    expect(missingBody.statusCode).toBe(400);
    expect(emptyPacks.statusCode).toBe(400);
    expect(emptySkills.statusCode).toBe(400);
    expect(punctuationName.statusCode).toBe(400);
    expect(punctuationName.json()).toMatchObject({ error: "invalid_agent_kit_id" });
    await app.close();
    db.close();
  });

  it("POST /api/agent-kits blocks missing referenced packs and skills", async () => {
    db.close();
    const agentKitsDir = createTempAgentKitsDir();
    const fixtureContext = createTestContext(undefined, demoPacksDir, { agentKitsDir });
    const app = createApp(fixtureContext);
    const missingPack = await app.inject({
      method: "POST",
      url: "/api/agent-kits",
      payload: saveAgentKitPayload({ id: "missing-pack-kit", contextPackIds: ["missing-pack"] })
    });
    const missingSkill = await app.inject({
      method: "POST",
      url: "/api/agent-kits",
      payload: saveAgentKitPayload({ id: "missing-skill-kit", skillIds: ["missing-skill"] })
    });

    expect(missingPack.statusCode).toBe(404);
    expect(missingPack.json()).toMatchObject({
      error: "missing_references",
      missingContextPackIds: ["missing-pack"],
      missingSkillIds: []
    });
    expect(missingSkill.statusCode).toBe(404);
    expect(missingSkill.json()).toMatchObject({
      error: "missing_references",
      missingContextPackIds: [],
      missingSkillIds: ["missing-skill"]
    });
    await app.close();
    fixtureContext.db.close();
  });

  it("POST /api/agent-kits rejects duplicate IDs and existing output folders", async () => {
    db.close();
    const agentKitsDir = createTempAgentKitsDir();
    const fixtureContext = createTestContext(undefined, demoPacksDir, { agentKitsDir });
    const app = createApp(fixtureContext);
    const first = await app.inject({
      method: "POST",
      url: "/api/agent-kits",
      payload: saveAgentKitPayload()
    });
    const duplicate = await app.inject({
      method: "POST",
      url: "/api/agent-kits",
      payload: saveAgentKitPayload()
    });
    fs.mkdirSync(path.join(agentKitsDir, "preexisting-kit"));
    const existingOutput = await app.inject({
      method: "POST",
      url: "/api/agent-kits",
      payload: saveAgentKitPayload({ id: "preexisting-kit" })
    });

    expect(first.statusCode).toBe(201);
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json()).toMatchObject({ error: "agent_kit_exists", id: "phase22-local-kit" });
    expect(existingOutput.statusCode).toBe(409);
    expect(existingOutput.json()).toMatchObject({ error: "agent_kit_exists", id: "preexisting-kit" });
    await app.close();
    fixtureContext.db.close();
  });

  it("POST /api/agent-kits keeps generated IDs path traversal-safe", async () => {
    db.close();
    const agentKitsDir = createTempAgentKitsDir();
    const fixtureContext = createTestContext(undefined, demoPacksDir, { agentKitsDir });
    const app = createApp(fixtureContext);
    const badId = await app.inject({
      method: "POST",
      url: "/api/agent-kits",
      payload: saveAgentKitPayload({ id: "../escape-kit" })
    });
    const fromName = await app.inject({
      method: "POST",
      url: "/api/agent-kits",
      payload: saveAgentKitPayload({ id: undefined, name: "../Escape Kit" })
    });
    const savedPath = fixtureContext.db
      .prepare("SELECT agent_kit_path FROM agent_kits WHERE id = ?")
      .pluck()
      .get("escape-kit") as string;

    expect(badId.statusCode).toBe(400);
    expect(fromName.statusCode).toBe(201);
    expect(fromName.json()).toMatchObject({ id: "escape-kit" });
    expectPathInside(agentKitsDir, savedPath);
    expect(fs.existsSync(path.join(path.dirname(agentKitsDir), "escape-kit"))).toBe(false);
    await app.close();
    fixtureContext.db.close();
  });

  it("POST /api/agent-kits is protected by the optional API token", async () => {
    db.close();
    const agentKitsDir = createTempAgentKitsDir();
    const authedContext = createTestContext("test-token", demoPacksDir, { agentKitsDir });
    const app = createApp(authedContext);
    const blocked = await app.inject({
      method: "POST",
      url: "/api/agent-kits",
      payload: saveAgentKitPayload({ id: "blocked-local-kit" })
    });
    const allowed = await app.inject({
      method: "POST",
      url: "/api/agent-kits",
      headers: { authorization: "Bearer test-token" },
      payload: saveAgentKitPayload({ id: "allowed-local-kit" })
    });

    expect(blocked.statusCode).toBe(401);
    expect(allowed.statusCode).toBe(201);
    await app.close();
    authedContext.db.close();
  });

  it("GET /api/agent-kits/:id returns Agent Kit detail without local-only manifest paths", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/agent-kits/support-ticket-writing-kit" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: "support-ticket-writing-kit",
      target: "codex",
      privacyMode: "redacted",
      healthScore: 100,
      healthStatus: "healthy",
      counts: {
        contextPacks: 2,
        skills: 2,
        exportProfiles: 3
      }
    });
    expect(response.json().contextPacks.map((pack: { id: string }) => pack.id)).toEqual([
      "internal-support-kb-pack",
      "fake-product-line-pack"
    ]);
    expect(response.json().skills.map((skill: { id: string }) => skill.id)).toEqual([
      "support-ticket-writing-skill",
      "bug-report-structuring-skill"
    ]);
    expect(response.json().exportProfiles).toHaveLength(3);
    expect(response.json().manifest).not.toHaveProperty("rulesPath");
    expect(response.json().manifest).not.toHaveProperty("exportsPath");
    expect(response.json().manifest).not.toHaveProperty("examplesPath");
    expect(JSON.stringify(response.json())).not.toContain(repoRoot);
    await app.close();
    db.close();
  });

  it("allowlists Agent Kit manifest and asset fields without leaking local paths", async () => {
    const agentKitId = "support-ticket-writing-kit";
    const manifestJson = db.prepare("SELECT manifest_json FROM agent_kits WHERE id = ?").pluck().get(agentKitId) as string;
    const manifest = JSON.parse(manifestJson) as Record<string, unknown>;
    db.prepare("UPDATE agent_kits SET manifest_json = ?, cover_image = ? WHERE id = ?").run(
      JSON.stringify({
        ...manifest,
        localPath: "D:\\private\\agent-kits",
        secretToken: "not-a-real-token",
        assets: {
          ...(manifest.assets as Record<string, unknown>),
          coverImage: "D:\\private\\agent-kit-cover.png"
        }
      }),
      "D:\\private\\agent-kit-cover.png",
      agentKitId
    );

    const app = createApp({ config, db });
    const detail = await app.inject({ method: "GET", url: `/api/agent-kits/${agentKitId}` });
    const list = await app.inject({ method: "GET", url: "/api/agent-kits" });

    expect(detail.statusCode).toBe(200);
    expect(detail.json().manifest).not.toHaveProperty("localPath");
    expect(detail.json().manifest).not.toHaveProperty("secretToken");
    expect(detail.json().manifest.assets).toEqual({ accentColor: "#f97316" });
    expect(JSON.stringify(detail.json())).not.toContain("not-a-real-token");
    expect(JSON.stringify(detail.json())).not.toContain("D:\\private");
    expect(list.statusCode).toBe(200);
    expect(JSON.stringify(list.json())).not.toContain("D:\\private");
    await app.close();
    db.close();
  });

  it("rejects remote Agent Kit cover image refs before they reach web clients", async () => {
    const agentKitId = "support-ticket-writing-kit";
    const manifestJson = db.prepare("SELECT manifest_json FROM agent_kits WHERE id = ?").pluck().get(agentKitId) as string;
    const manifest = JSON.parse(manifestJson) as Record<string, unknown>;
    db.prepare("UPDATE agent_kits SET manifest_json = ?, cover_image = ? WHERE id = ?").run(
      JSON.stringify({
        ...manifest,
        assets: {
          ...(manifest.assets as Record<string, unknown>),
          coverImage: "https://example.invalid/agent-kit-cover.png"
        }
      }),
      "https://example.invalid/agent-kit-cover.png",
      agentKitId
    );

    const app = createApp({ config, db });
    const detail = await app.inject({ method: "GET", url: `/api/agent-kits/${agentKitId}` });
    const list = await app.inject({ method: "GET", url: "/api/agent-kits" });

    expect(detail.statusCode).toBe(200);
    expect(detail.json().coverImage).toBeNull();
    expect(detail.json().manifest.assets).toEqual({ accentColor: "#f97316" });
    expect(list.statusCode).toBe(200);
    expect(list.json().agentKits.find((kit: { id: string }) => kit.id === agentKitId).coverImage).toBeNull();
    expect(JSON.stringify(detail.json())).not.toContain("example.invalid");
    expect(JSON.stringify(list.json())).not.toContain("example.invalid");
    await app.close();
    db.close();
  });

  it("sanitizes referenced Context Pack cover images in Agent Kit responses", async () => {
    db.prepare("UPDATE packs SET cover_image = ? WHERE id = ?").run("D:\\private\\pack-cover.png", "internal-support-kb-pack");
    db.prepare("UPDATE packs SET cover_image = ? WHERE id = ?").run("https://example.invalid/pack-cover.png", "fake-product-line-pack");

    const app = createApp({ config, db });
    const contextPacks = await app.inject({ method: "GET", url: "/api/agent-kits/support-ticket-writing-kit/context-packs" });
    const preview = await app.inject({
      method: "GET",
      url: "/api/agent-kits/support-ticket-writing-kit/exports/support-ticket-writing-kit-codex/preview"
    });

    expect(contextPacks.statusCode).toBe(200);
    expect(contextPacks.json().contextPacks.map((pack: { coverImage: string | null }) => pack.coverImage)).toEqual([null, null]);
    expect(preview.statusCode).toBe(200);
    expect(preview.json().includedContextPacks.map((pack: { coverImage: string | null }) => pack.coverImage)).toEqual([null, null]);
    expect(JSON.stringify(contextPacks.json())).not.toContain("D:\\private");
    expect(JSON.stringify(contextPacks.json())).not.toContain("example.invalid");
    expect(JSON.stringify(preview.json())).not.toContain("example.invalid");
    await app.close();
    db.close();
  });

  it("GET /api/agent-kits/:id relationship and export routes resolve included objects", async () => {
    const app = createApp({ config, db });
    const contextPacks = await app.inject({ method: "GET", url: "/api/agent-kits/support-ticket-writing-kit/context-packs" });
    const skills = await app.inject({ method: "GET", url: "/api/agent-kits/support-ticket-writing-kit/skills" });
    const exportsResponse = await app.inject({ method: "GET", url: "/api/agent-kits/support-ticket-writing-kit/exports" });
    const missing = await app.inject({ method: "GET", url: "/api/agent-kits/missing-kit/context-packs" });

    expect(contextPacks.statusCode).toBe(200);
    expect(contextPacks.json().contextPacks.map((pack: { id: string }) => pack.id)).toEqual([
      "internal-support-kb-pack",
      "fake-product-line-pack"
    ]);
    expect(skills.statusCode).toBe(200);
    expect(skills.json().skills.map((skill: { id: string }) => skill.id)).toEqual([
      "support-ticket-writing-skill",
      "bug-report-structuring-skill"
    ]);
    expect(exportsResponse.statusCode).toBe(200);
    expect(exportsResponse.json().exportProfiles).toHaveLength(3);
    expect(missing.statusCode).toBe(404);
    await app.close();
    db.close();
  });

  it("GET /api/agent-kits/:id/exports/:profileId/preview returns generated Agent Kit export content", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({
      method: "GET",
      url: "/api/agent-kits/support-ticket-writing-kit/exports/support-ticket-writing-kit-codex/preview"
    });
    const missing = await app.inject({
      method: "GET",
      url: "/api/agent-kits/support-ticket-writing-kit/exports/missing-profile/preview"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      agentKitId: "support-ticket-writing-kit",
      profileId: "support-ticket-writing-kit-codex",
      target: "codex",
      format: "markdown",
      contentStatus: "ready"
    });
    expect(response.json().content).toContain("Agent Kit Export: Support Ticket Writing Kit");
    expect(response.json().content).toContain("Support Ticket Writing Skill");
    expect(response.json().content).toContain("Internal Support KB Pack");
    expect(response.json().includedRecords.length).toBeGreaterThan(0);
    expect(response.json().sources.every((source: { path?: string }) => !source.path)).toBe(true);
    expect(response.json().includedContextPacks.map((pack: { id: string }) => pack.id)).toEqual([
      "internal-support-kb-pack",
      "fake-product-line-pack"
    ]);
    expect(response.json().includedSkills.map((skill: { id: string }) => skill.id)).toEqual([
      "support-ticket-writing-skill",
      "bug-report-structuring-skill"
    ]);
    expect(response.json().warnings).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "agent_kit_export_engine_later" })])
    );
    expect(missing.statusCode).toBe(404);
    await app.close();
    db.close();
  });

  it("GET /api/agent-kits/:id/exports/:profileId/preview honors profile-specific subset order", async () => {
    const profileJson = db
      .prepare("SELECT profile_json FROM agent_kit_export_profiles WHERE agent_kit_id = ? AND id = ?")
      .pluck()
      .get("support-ticket-writing-kit", "support-ticket-writing-kit-codex") as string;
    const profile = JSON.parse(profileJson) as Record<string, unknown>;
    db.prepare("UPDATE agent_kit_export_profiles SET profile_json = ? WHERE agent_kit_id = ? AND id = ?").run(
      JSON.stringify({
        ...profile,
        include: {
          context_packs: ["fake-product-line-pack"],
          skills: ["bug-report-structuring-skill"]
        }
      }),
      "support-ticket-writing-kit",
      "support-ticket-writing-kit-codex"
    );

    const app = createApp({ config, db });
    const response = await app.inject({
      method: "GET",
      url: "/api/agent-kits/support-ticket-writing-kit/exports/support-ticket-writing-kit-codex/preview"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().includedContextPacks.map((pack: { id: string }) => pack.id)).toEqual(["fake-product-line-pack"]);
    expect(response.json().includedSkills.map((skill: { id: string }) => skill.id)).toEqual(["bug-report-structuring-skill"]);
    await app.close();
    db.close();
  });

  it("GET /api/agent-kits/:id/exports/:profileId/preview sanitizes missing export roots", async () => {
    const missingPacksDir = path.join(os.tmpdir(), "contextarr-missing-api-packs");
    const app = createApp({ config: { ...config, packsDir: missingPacksDir }, db });
    const response = await app.inject({
      method: "GET",
      url: "/api/agent-kits/support-ticket-writing-kit/exports/support-ticket-writing-kit-codex/preview"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "context_packs_dir_invalid",
      message: "Expected a readable directory for export."
    });
    expect(JSON.stringify(response.json())).not.toContain(missingPacksDir);
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

  it("POST /api/compose/save-pack writes a private unindexed draft Context Pack", async () => {
    db.close();
    const composedPacksDir = createTempComposedPacksDir();
    const fixtureContext = createTestContext(undefined, demoPacksDir, { composedPacksDir });
    const app = createApp(fixtureContext);
    const sourceRecordPath = path.join(demoPacksDir, "ai-workstation-pack", "records", "local-ai-stack.md");
    const sourceRecordBefore = fs.readFileSync(sourceRecordPath, "utf8");
    const response = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      payload: {
        packId: "phase5-composed-draft",
        name: "Phase 5 Composed Draft",
        description: "Draft Context Pack generated from approved demo records.",
        title: "Phase 5 Composed Draft",
        target: "codex",
        format: "markdown",
        privacyMode: "redacted",
        selections: [
          { packId: "ai-workstation-pack", recordIds: ["ai-workstation.local-ai-stack"] },
          { packId: "claude-code-project-pack", recordIds: ["claude-code-project.agent-instructions"] }
        ]
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).not.toContain(composedPacksDir);
    expect(response.json()).toMatchObject({
      ok: true,
      id: "phase5-composed-draft",
      counts: { records: 2, sources: 2 },
      draft: { status: "review_required", indexed: false }
    });

    const packPath = path.join(composedPacksDir, "phase5-composed-draft");
    expect(validatePack(packPath).valid).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(path.join(packPath, "contextarr-pack.json"), "utf8"));
    expect(manifest).toMatchObject({
      id: "phase5-composed-draft",
      visibility: "private",
      trustLevel: "unreviewed",
      containsExecutableCode: false,
      requiresNetwork: false
    });

    const records = fs.readdirSync(path.join(packPath, "records")).map((file) => fs.readFileSync(path.join(packPath, "records", file), "utf8"));
    expect(records.join("\n")).toContain("review_status: draft");
    expect(records.join("\n")).toContain("never_export");
    expect(records.join("\n")).toContain("sourceRecordId: ai-workstation.local-ai-stack");

    const packsAfterSave = await app.inject({ method: "GET", url: "/api/packs" });
    expect(JSON.stringify(packsAfterSave.json())).not.toContain("phase5-composed-draft");
    expect(fs.readFileSync(sourceRecordPath, "utf8")).toBe(sourceRecordBefore);

    await app.close();
    fixtureContext.db.close();
    fs.rmSync(composedPacksDir, { recursive: true, force: true });
  });

  it("POST /api/compose/save-pack rejects duplicate, missing, and unsafe selections", async () => {
    db.close();
    const composedPacksDir = createTempComposedPacksDir();
    const fixtureContext = createTestContext(undefined, demoPacksDir, { composedPacksDir });
    const app = createApp(fixtureContext);
    const payload = {
      packId: "phase5-composed-duplicate",
      name: "Phase 5 Composed Duplicate",
      target: "codex",
      format: "markdown",
      selections: [{ packId: "ai-workstation-pack", recordIds: ["ai-workstation.local-ai-stack"] }]
    };

    const first = await app.inject({ method: "POST", url: "/api/compose/save-pack", payload });
    const duplicate = await app.inject({ method: "POST", url: "/api/compose/save-pack", payload });
    const malformed = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      payload: { ...payload, packId: "phase5-composed-malformed", selections: [] }
    });
    const missing = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      payload: {
        ...payload,
        packId: "phase5-composed-missing",
        selections: [{ packId: "ai-workstation-pack", recordIds: ["missing.record"] }]
      }
    });
    const invalidPackId = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      payload: {
        ...payload,
        packId: "...",
        selections: [{ packId: "ai-workstation-pack", recordIds: ["ai-workstation.local-ai-stack"] }]
      }
    });
    const traversalPackId = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      payload: {
        ...payload,
        packId: "../phase5-composed-escape",
        selections: [{ packId: "ai-workstation-pack", recordIds: ["ai-workstation.local-ai-stack"] }]
      }
    });
    const duplicateRecord = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      payload: {
        ...payload,
        packId: "phase5-composed-duplicate-record",
        selections: [
          {
            packId: "ai-workstation-pack",
            recordIds: ["ai-workstation.local-ai-stack", "ai-workstation.local-ai-stack"]
          }
        ]
      }
    });
    const excludedTag = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      payload: {
        ...payload,
        packId: "phase5-composed-excluded-tag",
        excludeTags: ["instructions"],
        selections: [{ packId: "claude-code-project-pack", recordIds: ["claude-code-project.agent-instructions"] }]
      }
    });

    expect(first.statusCode).toBe(201);
    expect(duplicate.statusCode).toBe(409);
    expect(malformed.statusCode).toBe(400);
    expect(malformed.json()).toMatchObject({ error: "invalid_compose_save_request" });
    expect(missing.statusCode).toBe(404);
    expect(invalidPackId.statusCode).toBe(400);
    expect(invalidPackId.json()).toMatchObject({ error: "invalid_pack_id" });
    expect(traversalPackId.statusCode).toBe(400);
    expect(traversalPackId.json()).toMatchObject({ error: "invalid_pack_id" });
    expect(duplicateRecord.statusCode).toBe(400);
    expect(duplicateRecord.json()).toMatchObject({ error: "duplicate_record_selection" });
    expect(excludedTag.statusCode).toBe(400);
    expect(excludedTag.json()).toMatchObject({ error: "selection_not_saveable" });
    expect(excludedTag.body).not.toContain(composedPacksDir);

    await app.close();
    fixtureContext.db.close();
    fs.rmSync(composedPacksDir, { recursive: true, force: true });
  });

  it("POST /api/compose/save-pack enforces server-side review, privacy, and default tag gates", async () => {
    db.close();
    const tempPacksDir = copyDemoPacksFixture("contextarr-composed-policy-packs-");
    const composedPacksDir = createTempComposedPacksDir();
    replaceInFile(
      path.join(tempPacksDir, "ai-workstation-pack", "records", "hardware-overview.md"),
      "review_status: approved",
      "review_status: draft"
    );
    replaceInFile(
      path.join(tempPacksDir, "ai-workstation-pack", "records", "storage-layout.md"),
      "privacy: public_safe",
      "privacy: private"
    );
    replaceInFile(
      path.join(tempPacksDir, "ai-workstation-pack", "records", "networking-notes.md"),
      "privacy: public_safe",
      "privacy: secret"
    );
    replaceInFile(
      path.join(tempPacksDir, "ai-workstation-pack", "records", "troubleshooting-workflow.md"),
      /tags:\r?\n  - troubleshooting\r?\n  - workflow/,
      "tags:\n  - troubleshooting\n  - workflow\n  - never_export"
    );
    replaceInFile(
      path.join(tempPacksDir, "ai-workstation-pack", "records", "local-ai-stack.md"),
      "title: Local AI Stack",
      "title: Local AI Stack demo@example.test"
    );
    replaceInFile(
      path.join(tempPacksDir, "ai-workstation-pack", "records", "local-ai-stack.md"),
      "The fictional stack separates chat UI, model serving, coding-agent tools, and pack exports so each layer can be reasoned about independently.",
      "The fictional stack separates chat UI, model serving, coding-agent tools, and pack exports so each layer can be reasoned about independently. Contact demo@example.test and backup@example.test for public-safe routing."
    );

    const fixtureContext = createTestContext(undefined, tempPacksDir, {
      composedPacksDir,
      skillsDir: path.join(os.tmpdir(), "contextarr-no-skills"),
      agentKitsDir: path.join(os.tmpdir(), "contextarr-no-agent-kits"),
      demoAgentKitsDir: path.join(os.tmpdir(), "contextarr-no-demo-agent-kits")
    });
    fixtureContext.db
      .prepare("UPDATE records SET body = body || ? WHERE id = ?")
      .run("\n\nToken: SECRET123", "ai-workstation.local-ai-stack");
    const app = createApp(fixtureContext);
    const basePayload = {
      name: "Phase 5 Policy Save",
      target: "codex",
      format: "markdown"
    };

    const draftRecord = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      payload: {
        ...basePayload,
        packId: "phase5-policy-draft-record",
        selections: [{ packId: "ai-workstation-pack", recordIds: ["ai-workstation.hardware-overview"] }]
      }
    });
    const privateRecord = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      payload: {
        ...basePayload,
        packId: "phase5-policy-private-record",
        selections: [{ packId: "ai-workstation-pack", recordIds: ["ai-workstation.storage-layout"] }]
      }
    });
    const secretRecord = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      payload: {
        ...basePayload,
        packId: "phase5-policy-secret-record",
        selections: [{ packId: "ai-workstation-pack", recordIds: ["ai-workstation.networking-notes"] }]
      }
    });
    const neverExportRecord = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      payload: {
        ...basePayload,
        packId: "phase5-policy-never-export",
        excludeTags: [],
        selections: [{ packId: "ai-workstation-pack", recordIds: ["ai-workstation.troubleshooting-workflow"] }]
      }
    });
    const redactedRecord = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      payload: {
        ...basePayload,
        packId: "phase5-policy-redacted-record",
        selections: [{ packId: "ai-workstation-pack", recordIds: ["ai-workstation.local-ai-stack"] }]
      }
    });

    expect(draftRecord.statusCode).toBe(400);
    expect(draftRecord.json().rejectedRecords[0].reason).toContain("Review status is draft");
    expect(privateRecord.statusCode).toBe(400);
    expect(privateRecord.json().rejectedRecords[0].reason).toContain("requires public_safe source records");
    expect(secretRecord.statusCode).toBe(400);
    expect(secretRecord.json().rejectedRecords[0].reason).toContain("Secret records");
    expect(neverExportRecord.statusCode).toBe(400);
    expect(neverExportRecord.json().rejectedRecords[0].reason).toContain("never_export");
    expect(redactedRecord.statusCode).toBe(201);
    const redactedPackPath = path.join(composedPacksDir, "phase5-policy-redacted-record");
    const redactedRecordBody = fs
      .readdirSync(path.join(redactedPackPath, "records"))
      .map((file) => fs.readFileSync(path.join(redactedPackPath, "records", file), "utf8"))
      .join("\n");
    const redactedSources = fs.readFileSync(path.join(redactedPackPath, "sources", "sources.yaml"), "utf8");
    expect(redactedRecordBody).toContain("[masked]");
    expect(redactedRecordBody).toContain("[redacted]");
    expect(redactedRecordBody).not.toContain("demo@example.test");
    expect(redactedRecordBody).not.toContain("backup@example.test");
    expect(redactedRecordBody).not.toContain("SECRET123");
    expect(redactedSources).toContain("[masked]");
    expect(redactedSources).not.toContain("demo@example.test");
    expect(fs.readFileSync(path.join(redactedPackPath, "rules", "redaction.yaml"), "utf8")).toContain("email");

    await app.close();
    fixtureContext.db.close();
    fs.rmSync(tempPacksDir, { recursive: true, force: true });
    fs.rmSync(composedPacksDir, { recursive: true, force: true });
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

  it("GET /api/search?type=agent-kit&q= returns Agent Kit results only", async () => {
    const app = createApp({ config, db });
    const response = await app.inject({ method: "GET", url: "/api/search?type=agent-kit&q=ticket" });
    const bySkill = await app.inject({
      method: "GET",
      url: "/api/search?type=agent-kit&q=bug-report-structuring-skill"
    });
    const emptyResponse = await app.inject({ method: "GET", url: "/api/search?type=agent-kit&q=zzzzzzzzqqqqqq" });

    expect(response.statusCode).toBe(200);
    expect(response.json().type).toBe("agent-kit");
    expect(response.json().results).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "agent-kit", id: "support-ticket-writing-kit" })])
    );
    expect(response.json().results.every((result: { kind: string }) => result.kind === "agent-kit")).toBe(true);
    expect(bySkill.statusCode).toBe(200);
    expect(bySkill.json().results).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "support-ticket-writing-kit" })])
    );
    expect(emptyResponse.statusCode).toBe(200);
    expect(emptyResponse.json()).toMatchObject({ type: "agent-kit", results: [] });
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
      skillInstructionsIndexed: 24,
      agentKitsIndexed: 8,
      agentKitContextPackRefsIndexed: 15,
      agentKitSkillRefsIndexed: 17,
      agentKitExportProfilesIndexed: 24
    });
    expect(JSON.stringify(response.json())).not.toContain(repoRoot);
    expect(JSON.stringify(response.json())).not.toContain("demo-skills");
    expect(JSON.stringify(response.json())).not.toContain("demo-agent-kits");
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
    const composedPacksDir = createTempComposedPacksDir();
    const authedContext = createTestContext("test-token", demoPacksDir, { composedPacksDir });
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
    const blockedSave = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      payload: { ...payload, packId: "phase5-auth-save", name: "Phase 5 Auth Save" }
    });
    const allowedSave = await app.inject({
      method: "POST",
      url: "/api/compose/save-pack",
      headers: { authorization: "Bearer test-token" },
      payload: { ...payload, packId: "phase5-auth-save", name: "Phase 5 Auth Save" }
    });

    expect(blocked.statusCode).toBe(401);
    expect(allowed.statusCode).toBe(200);
    expect(blockedSave.statusCode).toBe(401);
    expect(allowedSave.statusCode).toBe(201);
    await app.close();
    authedContext.db.close();
    fs.rmSync(composedPacksDir, { recursive: true, force: true });
  });

  it("requires token auth on Skill and Agent Kit API, typed search, and rescan routes", async () => {
    db.close();
    const authedContext = createTestContext("test-token");
    const app = createApp(authedContext);
    const blockedSkills = await app.inject({ method: "GET", url: "/api/skills" });
    const allowedSkills = await app.inject({
      method: "GET",
      url: "/api/skills",
      headers: { authorization: "Bearer test-token" }
    });
    const blockedAgentKits = await app.inject({ method: "GET", url: "/api/agent-kits" });
    const allowedAgentKits = await app.inject({
      method: "GET",
      url: "/api/agent-kits",
      headers: { authorization: "Bearer test-token" }
    });
    const blockedAgentKitPreview = await app.inject({
      method: "GET",
      url: "/api/agent-kits/support-ticket-writing-kit/exports/support-ticket-writing-kit-codex/preview"
    });
    const allowedAgentKitPreview = await app.inject({
      method: "GET",
      url: "/api/agent-kits/support-ticket-writing-kit/exports/support-ticket-writing-kit-codex/preview",
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
    const blockedAgentKitHealth = await app.inject({ method: "GET", url: "/api/agent-kits/support-ticket-writing-kit/health" });
    const allowedAgentKitHealth = await app.inject({
      method: "GET",
      url: "/api/agent-kits/support-ticket-writing-kit/health",
      headers: { authorization: "Bearer test-token" }
    });

    expect(blockedSkills.statusCode).toBe(401);
    expect(allowedSkills.statusCode).toBe(200);
    expect(blockedAgentKits.statusCode).toBe(401);
    expect(allowedAgentKits.statusCode).toBe(200);
    expect(blockedAgentKitPreview.statusCode).toBe(401);
    expect(allowedAgentKitPreview.statusCode).toBe(200);
    expect(blockedSearch.statusCode).toBe(401);
    expect(allowedSearch.statusCode).toBe(200);
    expect(blockedRescan.statusCode).toBe(401);
    expect(allowedRescan.statusCode).toBe(200);
    expect(blockedSkillHealth.statusCode).toBe(401);
    expect(allowedSkillHealth.statusCode).toBe(200);
    expect(blockedAgentKitHealth.statusCode).toBe(401);
    expect(allowedAgentKitHealth.statusCode).toBe(200);
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
