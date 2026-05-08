import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const demoSkillsDir = path.join(repoRoot, "demo-skills");
const demoAgentKitsDir = path.join(repoRoot, "demo-agent-kits");

describe("Contextarr MCP stdio protocol", () => {
  let tempDir: string | undefined;

  afterEach(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  it(
    "lists tools and calls read-only tools through stdio",
    async () => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-mcp-"));
      const transport = new StdioClientTransport({
        command: pnpmCommand(),
        args: ["--silent", "contextarr-mcp"],
        cwd: repoRoot,
        env: {
          ...getDefaultEnvironment(),
          CONTEXTARR_PACKS_DIR: demoPacksDir,
          CONTEXTARR_SKILLS_DIR: demoSkillsDir,
          CONTEXTARR_DEMO_AGENT_KITS_DIR: demoAgentKitsDir,
          CONTEXTARR_DATABASE_PATH: path.join(tempDir, "contextarr.db"),
          CONTEXTARR_MCP_RESCAN_ON_START: "true"
        },
        stderr: "pipe"
      });
      const stderrChunks: Buffer[] = [];
      transport.stderr?.on("data", (chunk) => {
        stderrChunks.push(Buffer.from(chunk));
      });
      const client = new Client({ name: "contextarr-mcp-test", version: "0.0.0" });

      try {
        await client.connect(transport);
        const tools = await client.listTools();
        expect(tools.tools.map((tool) => tool.name)).toEqual(
          expect.arrayContaining([
            "list_packs",
            "get_record",
            "build_export_preview",
            "list_skills",
            "get_skill_summary",
            "get_skill",
            "list_agent_kits",
            "get_agent_kit_summary",
            "query_agent_kit_context",
            "build_agent_kit_export_preview"
          ])
        );

        const packs = parseToolJson(await client.callTool({ name: "list_packs", arguments: { limit: 1 } }));
        const skills = parseToolJson(await client.callTool({ name: "list_skills", arguments: { limit: 1 } }));
        const record = parseToolJson(
          await client.callTool({ name: "get_record", arguments: { recordId: "ai-workstation.local-ai-stack" } })
        );
        const skill = parseToolJson(
          await client.callTool({
            name: "get_skill",
            arguments: { skillId: "support-ticket-writing-skill", includeBody: false }
          })
        );
        const skillSummary = parseToolJson(
          await client.callTool({
            name: "get_skill_summary",
            arguments: { skillId: "support-ticket-writing-skill" }
          })
        );
        const agentKitSummary = parseToolJson(
          await client.callTool({
            name: "get_agent_kit_summary",
            arguments: { agentKitId: "support-ticket-writing-kit" }
          })
        );
        const agentKitQuery = parseToolJson(
          await client.callTool({
            name: "query_agent_kit_context",
            arguments: { agentKitId: "support-ticket-writing-kit", query: "ticket", limit: 2 }
          })
        );
        const preview = parseToolJson(
          await client.callTool({
            name: "build_export_preview",
            arguments: { packId: "ai-workstation-pack", profileId: "ai-workstation-codex" }
          })
        );
        const agentKitPreview = parseToolJson(
          await client.callTool({
            name: "build_agent_kit_export_preview",
            arguments: { agentKitId: "support-ticket-writing-kit", profileId: "support-ticket-writing-kit-codex" }
          })
        );

        expect(packs.ok).toBe(true);
        expect(packs.packs).toHaveLength(1);
        expect(skills.ok).toBe(true);
        expect(skills.skills).toHaveLength(1);
        expect(record.ok).toBe(true);
        expect(record.record).toEqual(expect.objectContaining({ id: "ai-workstation.local-ai-stack" }));
        expect(skill.ok).toBe(true);
        expect(skill.skill).toEqual(expect.objectContaining({ id: "support-ticket-writing-skill" }));
        expect(skillSummary.ok).toBe(true);
        expect(skillSummary.skill).toEqual(expect.objectContaining({ id: "support-ticket-writing-skill" }));
        expect(agentKitSummary.ok).toBe(true);
        expect(agentKitSummary.agentKit).toEqual(expect.objectContaining({ id: "support-ticket-writing-kit" }));
        expect(agentKitQuery.ok).toBe(true);
        expect(agentKitQuery.results).toEqual(expect.arrayContaining([expect.objectContaining({ kind: expect.any(String) })]));
        expect(preview.ok).toBe(true);
        expect(preview.artifact).toEqual(expect.objectContaining({ profileId: "ai-workstation-codex" }));
        expect(agentKitPreview.ok).toBe(true);
        expect(agentKitPreview.artifact).toEqual(expect.objectContaining({ profileId: "support-ticket-writing-kit-codex" }));
      } finally {
        await client.close();
      }

      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      expect(stderr).toContain("Contextarr MCP server ready.");
      expect(stderr).not.toContain(repoRoot);
      expect(stderr).not.toContain(tempDir);
      expect(stderr).not.toContain("packsDir=");
      expect(stderr).not.toContain("databasePath=");
    },
    30000
  );

  it("defines and documents the supported local command", () => {
    const rootPackage = readJson(path.join(repoRoot, "package.json"));
    const mcpPackage = readJson(path.join(repoRoot, "apps/mcp/package.json"));
    const readme = fs.readFileSync(path.join(repoRoot, "README.md"), "utf8");
    const mcpDocs = fs.readFileSync(path.join(repoRoot, "docs/mcp.md"), "utf8");

    expect(rootPackage.scripts["contextarr-mcp"]).toBe("pnpm --filter @contextarr/mcp contextarr-mcp");
    expect(mcpPackage.scripts["contextarr-mcp"]).toBe("tsx src/main.ts");
    expect(mcpPackage.bin).toBeUndefined();
    expect(readme).toContain("pnpm contextarr-mcp");
    expect(mcpDocs).toContain("pnpm contextarr-mcp");
    expect(mcpDocs).toContain("pnpm --silent contextarr-mcp");
    expect(`${readme}\n${mcpDocs}`).not.toContain("pnpm exec contextarr-mcp");
  });
});

function parseToolJson(result: unknown): Record<string, unknown> {
  if (!isToolContentResult(result)) {
    throw new Error("MCP tool did not return content.");
  }

  const text = result.content.find((item) => item.type === "text")?.text;
  if (!text) {
    throw new Error("MCP tool did not return text content.");
  }

  return JSON.parse(text) as Record<string, unknown>;
}

function isToolContentResult(value: unknown): value is { content: Array<{ type: string; text?: string }> } {
  return typeof value === "object" && value !== null && "content" in value && Array.isArray(value.content);
}

function pnpmCommand(): string {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function readJson(file: string): { scripts: Record<string, string>; bin?: unknown } {
  return JSON.parse(fs.readFileSync(file, "utf8")) as { scripts: Record<string, string>; bin?: unknown };
}
