import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");

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
        command: process.execPath,
        args: ["--import", "tsx", path.join(repoRoot, "apps/mcp/src/main.ts")],
        cwd: repoRoot,
        env: {
          ...getDefaultEnvironment(),
          CONTEXTARR_PACKS_DIR: demoPacksDir,
          CONTEXTARR_DATABASE_PATH: path.join(tempDir, "contextarr.db"),
          CONTEXTARR_MCP_RESCAN_ON_START: "true"
        },
        stderr: "pipe"
      });
      const client = new Client({ name: "contextarr-mcp-test", version: "0.0.0" });

      try {
        await client.connect(transport);
        const tools = await client.listTools();
        expect(tools.tools.map((tool) => tool.name)).toEqual(
          expect.arrayContaining(["list_packs", "get_record", "build_export_preview"])
        );

        const packs = parseToolJson(await client.callTool({ name: "list_packs", arguments: { limit: 1 } }));
        const record = parseToolJson(
          await client.callTool({ name: "get_record", arguments: { recordId: "ai-workstation.local-ai-stack" } })
        );
        const preview = parseToolJson(
          await client.callTool({
            name: "build_export_preview",
            arguments: { packId: "ai-workstation-pack", profileId: "ai-workstation-codex" }
          })
        );

        expect(packs.ok).toBe(true);
        expect(packs.packs).toHaveLength(1);
        expect(record.ok).toBe(true);
        expect(record.record).toEqual(expect.objectContaining({ id: "ai-workstation.local-ai-stack" }));
        expect(preview.ok).toBe(true);
        expect(preview.artifact).toEqual(expect.objectContaining({ profileId: "ai-workstation-codex" }));
      } finally {
        await client.close();
      }
    },
    30000
  );
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
