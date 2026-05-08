import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase, rebuildIndex, type ContextarrDatabase } from "@contextarr/server";
import type { ContextarrMcpConfig } from "./config";
import type { ContextarrMcpContext } from "./context";
import {
  buildExportPreviewTool,
  getPackSummaryTool,
  getRecordTool,
  listExportProfilesTool,
  listPacksTool,
  queryPackContextTool
} from "./tools";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const demoSkillsDir = path.join(repoRoot, "demo-skills");

describe("Contextarr MCP tools", () => {
  let context: ContextarrMcpContext | undefined;

  afterEach(() => {
    context?.db.close();
    context = undefined;
  });

  it("lists all demo packs", async () => {
    context = createTestContext();
    const result = await listPacksTool(context, { limit: 10 });

    expect(result.ok).toBe(true);
    expect(result.count).toBe(5);
    expect(result.packs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ai-workstation-pack",
          health: expect.objectContaining({ status: "healthy" })
        })
      ])
    );
  });

  it("returns pack summaries without local filesystem paths", async () => {
    context = createTestContext();
    const result = await getPackSummaryTool(context, { packId: "ai-workstation-pack" });

    expect(result.ok).toBe(true);
    expect(result.pack).toEqual(
      expect.objectContaining({
        id: "ai-workstation-pack",
        counts: expect.objectContaining({ records: 5, exportProfiles: 5 })
      })
    );
    expect(JSON.stringify(result.pack)).not.toContain("packPath");
    expect(JSON.stringify(result.pack)).not.toContain("D:\\");
  });

  it("queries context, respects limits, and survives punctuation-heavy input", async () => {
    context = createTestContext();
    const result = await queryPackContextTool(context, { query: "workstation", limit: 2 });

    expect(result.ok).toBe(true);
    expect(result.count).toBeLessThanOrEqual(2);
    expect(result.results).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "pack" })]));

    for (const query of ["C++", "tag:ai", "local-ai", "ai/workstation", "?", "\"quoted\""]) {
      const punctuationResult = await queryPackContextTool(context, { query });
      expect(punctuationResult.ok).toBe(true);
      expect(Array.isArray(punctuationResult.results)).toBe(true);
    }
  });

  it("returns public-safe record bodies with source summaries", async () => {
    context = createTestContext();
    const result = await getRecordTool(context, { recordId: "ai-workstation.local-ai-stack" });

    expect(result.ok).toBe(true);
    expect(result.record).toEqual(
      expect.objectContaining({
        id: "ai-workstation.local-ai-stack",
        bodyIncluded: true,
        resolvedSources: expect.arrayContaining([expect.objectContaining({ id: "ai-workstation-stack-note" })])
      })
    );
  });

  it("omits secret and private record bodies unless private access is enabled", async () => {
    context = createTestContext();
    insertSyntheticRecord(context.db, {
      id: "ai-workstation.secret-note",
      title: "Secret Note",
      privacy: "secret",
      body: "do not expose this secret fixture body"
    });
    insertSyntheticRecord(context.db, {
      id: "ai-workstation.private-note",
      title: "Private Note",
      privacy: "private",
      body: "private fixture body"
    });

    const secretResult = await getRecordTool(context, { recordId: "ai-workstation.secret-note" });
    const privateResult = await getRecordTool(context, { recordId: "ai-workstation.private-note" });

    expect(secretResult.record).toEqual(expect.objectContaining({ bodyIncluded: false, body: null }));
    expect(privateResult.record).toEqual(expect.objectContaining({ bodyIncluded: false, body: null }));

    context.config.allowPrivate = true;
    const allowedPrivateResult = await getRecordTool(context, { recordId: "ai-workstation.private-note" });
    expect(allowedPrivateResult.record).toEqual(
      expect.objectContaining({ bodyIncluded: true, body: "private fixture body" })
    );
  });

  it("lists export profiles and builds export previews", async () => {
    context = createTestContext();
    const profiles = await listExportProfilesTool(context, { packId: "ai-workstation-pack" });
    const preview = await buildExportPreviewTool(context, {
      packId: "ai-workstation-pack",
      profileId: "ai-workstation-codex"
    });

    expect(profiles.ok).toBe(true);
    expect(profiles.count).toBe(5);
    expect(profiles.profiles).toEqual(expect.arrayContaining([expect.objectContaining({ id: "ai-workstation-codex" })]));
    expect(preview.ok).toBe(true);
    expect(preview.artifact).toEqual(
      expect.objectContaining({
        profileId: "ai-workstation-codex",
        target: "codex",
        filename: "ai-workstation-codex.md"
      })
    );
    expect(JSON.stringify(preview.artifact)).not.toContain("\"path\"");
  });

  it("logs query metadata without raw query text or returned content", async () => {
    context = createTestContext();
    const rawQuery = "private-query-token-workstation";
    await queryPackContextTool(context, { query: rawQuery });

    const row = context.db
      .prepare("SELECT * FROM mcp_query_log WHERE tool = ? ORDER BY id DESC LIMIT 1")
      .get("query_pack_context") as Record<string, unknown>;

    expect(row.query_hash).toEqual(expect.any(String));
    expect(row.query_length).toBe(rawQuery.length);
    expect(String(row.metadata_json)).not.toContain(rawQuery);
    expect(String(row.metadata_json)).not.toContain("AI Workstation Pack");
  });
});

function createTestContext(overrides: Partial<ContextarrMcpConfig> = {}): ContextarrMcpContext {
  const db = openDatabase(":memory:");
  const config: ContextarrMcpConfig = {
    host: "127.0.0.1",
    port: 0,
    packsDir: demoPacksDir,
    skillsDir: demoSkillsDir,
    agentKitsDir: path.join(repoRoot, "demo-agent-kits"),
    databasePath: ":memory:",
    rescanOnStart: true,
    maxResults: 8,
    maxRecordChars: 12000,
    allowPrivate: false,
    ...overrides
  };

  rebuildIndex(db, demoPacksDir, demoSkillsDir, config.agentKitsDir);
  return { config, db };
}

function insertSyntheticRecord(
  db: ContextarrDatabase,
  record: { id: string; title: string; privacy: string; body: string }
): void {
  const metadata = {
    id: record.id,
    title: record.title,
    type: "note",
    pack: "ai-workstation-pack",
    tags: ["synthetic"],
    confidence: "high",
    source_status: "manual",
    freshness: "current",
    privacy: record.privacy,
    last_reviewed: "2026-05-07",
    sources: [],
    review_status: "approved"
  };

  db.prepare(
    `INSERT INTO records (
      id, pack_id, title, type, tags_json, tags_text, confidence, source_status,
      freshness, privacy, last_reviewed, review_status, sources_json, body,
      file_path, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    metadata.id,
    metadata.pack,
    metadata.title,
    metadata.type,
    JSON.stringify(metadata.tags),
    metadata.tags.join(" "),
    metadata.confidence,
    metadata.source_status,
    metadata.freshness,
    metadata.privacy,
    metadata.last_reviewed,
    metadata.review_status,
    JSON.stringify(metadata.sources),
    record.body,
    `${record.id}.md`,
    JSON.stringify(metadata)
  );

  db.prepare("INSERT INTO records_fts (record_id, pack_id, title, body, tags) VALUES (?, ?, ?, ?, ?)").run(
    metadata.id,
    metadata.pack,
    metadata.title,
    record.body,
    metadata.tags.join(" ")
  );
}
