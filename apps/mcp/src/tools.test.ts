import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase, rebuildIndex, type ContextarrDatabase } from "@contextarr/server";
import type { ContextarrMcpConfig } from "./config";
import type { ContextarrMcpContext } from "./context";
import {
  buildAgentKitExportPreviewTool,
  buildExportPreviewTool,
  getAgentKitSummaryTool,
  getPackSummaryTool,
  getRecordTool,
  getSkillSummaryTool,
  getSkillTool,
  listAgentKitsTool,
  listExportProfilesTool,
  listPacksTool,
  listSkillsTool,
  queryAgentKitContextTool,
  queryPackContextTool
} from "./tools";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const demoSkillsDir = path.join(repoRoot, "demo-skills");
const demoAgentKitsDir = path.join(repoRoot, "demo-agent-kits");

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
          counts: expect.objectContaining({ records: 5, exportProfiles: 8 })
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

  it("omits non-approved records from MCP query and detail tools", async () => {
    context = createTestContext();
    insertSyntheticRecord(context.db, {
      id: "ai-workstation.draft-note",
      title: "Draft Note",
      privacy: "public_safe",
      body: "draft fixture body",
      reviewStatus: "draft"
    });

    const query = await queryPackContextTool(context, { query: "draft fixture", limit: 10 });
    const detail = await getRecordTool(context, { recordId: "ai-workstation.draft-note" });

    expect(query.ok).toBe(true);
    expect(query.results).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: "ai-workstation.draft-note" })]));
    expect(query.warnings).toEqual(expect.arrayContaining(["Non-approved records were omitted."]));
    expect(detail).toEqual(
      expect.objectContaining({
        ok: false,
        error: "record_not_approved"
      })
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
    expect(profiles.count).toBe(8);
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

  it("lists Skills and returns safe Skill detail", async () => {
    context = createTestContext();
    const skills = await listSkillsTool(context, { limit: 20 });
    const summary = await getSkillSummaryTool(context, { skillId: "support-ticket-writing-skill" });
    const detail = await getSkillTool(context, { skillId: "support-ticket-writing-skill" });

    expect(skills.ok).toBe(true);
    expect(skills.count).toBe(8);
    expect(skills.skills).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "support-ticket-writing-skill" })])
    );
    expect(summary.ok).toBe(true);
    expect(summary.skill).toEqual(
      expect.objectContaining({
        id: "support-ticket-writing-skill",
        counts: expect.objectContaining({ instructions: 3, examples: 2 })
      })
    );
    expect(detail.ok).toBe(true);
    expect(detail.instructions).toEqual(
      expect.arrayContaining([expect.objectContaining({ skillId: "support-ticket-writing-skill", bodyIncluded: true })])
    );
    expect(JSON.stringify(detail)).not.toContain("skillPath");
    expect(JSON.stringify(detail)).not.toContain("D:\\");
  });

  it("lists Agent Kits, summarizes included objects, and queries scoped context", async () => {
    context = createTestContext();
    const agentKits = await listAgentKitsTool(context, { limit: 20 });
    const summary = await getAgentKitSummaryTool(context, { agentKitId: "support-ticket-writing-kit" });
    const query = await queryAgentKitContextTool(context, {
      agentKitId: "support-ticket-writing-kit",
      query: "ticket",
      limit: 6
    });

    expect(agentKits.ok).toBe(true);
    expect(agentKits.count).toBe(8);
    expect(agentKits.agentKits).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "support-ticket-writing-kit" })])
    );
    expect(summary.ok).toBe(true);
    expect(summary.agentKit).toEqual(
      expect.objectContaining({
        id: "support-ticket-writing-kit",
        contextPacks: expect.arrayContaining([expect.objectContaining({ id: "internal-support-kb-pack" })]),
        skills: expect.arrayContaining([expect.objectContaining({ id: "support-ticket-writing-skill" })])
      })
    );
    expect(query.ok).toBe(true);
    expect(query.count).toBeGreaterThan(0);
    expect(query.results).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: expect.stringMatching(/agent-kit|record|skill/) })])
    );
    expect(JSON.stringify(summary.agentKit)).not.toContain("agentKitPath");
    expect(JSON.stringify(query.results)).not.toContain("D:\\");
  });

  it("requires Agent Kit scope for Agent Kit context queries", async () => {
    context = createTestContext();
    const result = await queryAgentKitContextTool(context, { query: "ticket" });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid_input");
    expect(String(result.message)).toContain("agentKitId");
  });

  it("omits private and secret record and Skill document snippets from Agent Kit context by default", async () => {
    context = createTestContext();
    insertSyntheticRecord(context.db, {
      id: "internal-support.private-mcp-note",
      packId: "internal-support-kb-pack",
      title: "Private MCP Note",
      privacy: "private",
      body: "phase25privaterecordtoken"
    });
    insertSyntheticRecord(context.db, {
      id: "internal-support.secret-mcp-note",
      packId: "internal-support-kb-pack",
      title: "Secret MCP Note",
      privacy: "secret",
      body: "phase25secretrecordtoken"
    });
    insertSyntheticSkillDocument(context.db, {
      id: "support-ticket-writing.private-mcp-instruction",
      skillId: "support-ticket-writing-skill",
      title: "Private MCP Instruction",
      privacy: "private",
      body: "phase25privateskilltoken"
    });
    insertSyntheticSkillDocument(context.db, {
      id: "support-ticket-writing.secret-mcp-instruction",
      skillId: "support-ticket-writing-skill",
      title: "Secret MCP Instruction",
      privacy: "secret",
      body: "phase25secretskilltoken"
    });

    const privateRecord = await queryAgentKitContextTool(context, {
      agentKitId: "support-ticket-writing-kit",
      query: "phase25privaterecordtoken"
    });
    const secretRecord = await queryAgentKitContextTool(context, {
      agentKitId: "support-ticket-writing-kit",
      query: "phase25secretrecordtoken"
    });
    const privateSkill = await queryAgentKitContextTool(context, {
      agentKitId: "support-ticket-writing-kit",
      query: "phase25privateskilltoken"
    });
    const secretSkill = await queryAgentKitContextTool(context, {
      agentKitId: "support-ticket-writing-kit",
      query: "phase25secretskilltoken"
    });

    expect(privateRecord.results).toEqual([
      expect.objectContaining({ id: "internal-support.private-mcp-note", snippet: null })
    ]);
    expect(privateRecord.warnings).toEqual(
      expect.arrayContaining(["Non-public record snippets were omitted because private MCP access is disabled."])
    );
    expect(secretRecord.results).toEqual([]);
    expect(secretRecord.warnings).toEqual(expect.arrayContaining(["Secret records were omitted."]));
    expect(privateSkill.results).toEqual([]);
    expect(privateSkill.warnings).toEqual(
      expect.arrayContaining(["Non-public Skill documents were omitted because private MCP access is disabled."])
    );
    expect(secretSkill.results).toEqual([]);
    expect(secretSkill.warnings).toEqual(expect.arrayContaining(["Secret Skill documents were omitted."]));
    expect(JSON.stringify(privateRecord.results)).not.toContain("phase25privaterecordtoken");
    expect(JSON.stringify(privateSkill.results)).not.toContain("phase25privateskilltoken");
  });

  it("omits private and secret Skill documents unless private access is enabled", async () => {
    context = createTestContext();
    insertSyntheticSkillDocument(context.db, {
      id: "support-ticket-writing.private-body-instruction",
      skillId: "support-ticket-writing-skill",
      title: "Private Body Instruction",
      privacy: "private",
      body: "private skill fixture body"
    });
    insertSyntheticSkillDocument(context.db, {
      id: "support-ticket-writing.secret-body-instruction",
      skillId: "support-ticket-writing-skill",
      title: "Secret Body Instruction",
      privacy: "secret",
      body: "secret skill fixture body"
    });

    const defaultResult = await getSkillTool(context, { skillId: "support-ticket-writing-skill" });
    const defaultInstructions = defaultResult.instructions as Array<Record<string, unknown>>;

    expect(defaultInstructions.some((instruction) => instruction.id === "support-ticket-writing.private-body-instruction")).toBe(false);
    expect(defaultInstructions.some((instruction) => instruction.id === "support-ticket-writing.secret-body-instruction")).toBe(false);
    expect(defaultResult.warnings).toEqual(
      expect.arrayContaining([
        "Non-public Skill documents were omitted because private MCP access is disabled.",
        "Secret Skill documents were omitted."
      ])
    );

    context.config.allowPrivate = true;
    const privateAllowedResult = await getSkillTool(context, { skillId: "support-ticket-writing-skill" });
    const privateAllowedInstructions = privateAllowedResult.instructions as Array<Record<string, unknown>>;
    expect(privateAllowedInstructions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "support-ticket-writing.private-body-instruction",
          bodyIncluded: true,
          body: "private skill fixture body"
        })
      ])
    );
    expect(privateAllowedInstructions.some((instruction) => instruction.id === "support-ticket-writing.secret-body-instruction")).toBe(false);
  });

  it("builds Agent Kit export previews through the MCP tool layer", async () => {
    context = createTestContext();
    const preview = await buildAgentKitExportPreviewTool(context, {
      agentKitId: "support-ticket-writing-kit",
      profileId: "support-ticket-writing-kit-codex"
    });

    expect(preview.ok).toBe(true);
    expect(preview.agentKitId).toBe("support-ticket-writing-kit");
    expect(preview.artifact).toEqual(
      expect.objectContaining({
        packId: "support-ticket-writing-kit",
        profileId: "support-ticket-writing-kit-codex",
        target: "codex"
      })
    );
    expect(JSON.stringify(preview.artifact)).not.toContain("\"path\"");
  });
});

function createTestContext(overrides: Partial<ContextarrMcpConfig> = {}): ContextarrMcpContext {
  const db = openDatabase(":memory:");
  const config: ContextarrMcpConfig = {
    host: "127.0.0.1",
    port: 0,
    packsDir: demoPacksDir,
    draftPacksDir: path.join(repoRoot, "draft-packs"),
    composedPacksDir: path.join(repoRoot, "composed-packs"),
    skillsDir: demoSkillsDir,
    importedSkillsDir: path.join(repoRoot, "imported-skills"),
    agentKitsDir: demoAgentKitsDir,
    agentKitTemplatesDir: path.join(repoRoot, "agent-kit-templates"),
    databasePath: ":memory:",
    localImportsEnabled: false,
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
  record: { id: string; title: string; privacy: string; body: string; packId?: string; reviewStatus?: string }
): void {
  const metadata = {
    id: record.id,
    title: record.title,
    type: "note",
    pack: record.packId ?? "ai-workstation-pack",
    tags: ["synthetic"],
    confidence: "high",
    source_status: "manual",
    freshness: "current",
    privacy: record.privacy,
    last_reviewed: "2026-05-07",
    sources: [],
    review_status: record.reviewStatus ?? "approved"
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

function insertSyntheticSkillDocument(
  db: ContextarrDatabase,
  document: { id: string; skillId: string; title: string; privacy: string; body: string }
): void {
  const metadata = {
    id: document.id,
    title: document.title,
    type: "instruction",
    skill: document.skillId,
    tags: ["synthetic"],
    confidence: "high",
    source_status: "manual",
    freshness: "current",
    privacy: document.privacy,
    last_reviewed: "2026-05-07",
    sources: [],
    review_status: "approved"
  };

  db.prepare(
    `INSERT INTO skill_instructions (
      id, skill_id, title, type, tags_json, tags_text, confidence, source_status,
      freshness, privacy, last_reviewed, review_status, sources_json, body,
      file_path, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    metadata.id,
    metadata.skill,
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
    document.body,
    `${document.id}.md`,
    JSON.stringify(metadata)
  );

  db.prepare("INSERT INTO skills_fts (item_id, skill_id, kind, title, body, tags) VALUES (?, ?, ?, ?, ?, ?)").run(
    metadata.id,
    metadata.skill,
    "skill_instruction",
    metadata.title,
    document.body,
    metadata.tags.join(" ")
  );
}
