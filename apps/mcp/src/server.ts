import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ContextarrMcpContext } from "./context";
import {
  buildExportPreviewInputSchema,
  buildExportPreviewTool,
  getPackSummaryInputSchema,
  getPackSummaryTool,
  getRecordInputSchema,
  getRecordTool,
  listExportProfilesInputSchema,
  listExportProfilesTool,
  listPacksInputSchema,
  listPacksTool,
  queryPackContextInputSchema,
  queryPackContextTool,
  toTextToolResult
} from "./tools";

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

export function createContextarrMcpServer(context: ContextarrMcpContext): McpServer {
  const server = new McpServer({
    name: "contextarr",
    version: "0.8.0"
  });

  server.registerTool(
    "list_packs",
    {
      title: "List Packs",
      description: "List local Contextarr packs from the derived index.",
      inputSchema: listPacksInputSchema,
      annotations: readOnlyAnnotations
    },
    async (args) => toTextToolResult(await listPacksTool(context, args))
  );

  server.registerTool(
    "get_pack_summary",
    {
      title: "Get Pack Summary",
      description: "Return safe summary, sources, export profiles, and health for one pack.",
      inputSchema: getPackSummaryInputSchema,
      annotations: readOnlyAnnotations
    },
    async (args) => toTextToolResult(await getPackSummaryTool(context, args))
  );

  server.registerTool(
    "query_pack_context",
    {
      title: "Query Pack Context",
      description: "Search indexed pack and record context with privacy-aware snippets.",
      inputSchema: queryPackContextInputSchema,
      annotations: readOnlyAnnotations
    },
    async (args) => toTextToolResult(await queryPackContextTool(context, args))
  );

  server.registerTool(
    "get_record",
    {
      title: "Get Record",
      description: "Return a single record with privacy-aware body inclusion.",
      inputSchema: getRecordInputSchema,
      annotations: readOnlyAnnotations
    },
    async (args) => toTextToolResult(await getRecordTool(context, args))
  );

  server.registerTool(
    "list_export_profiles",
    {
      title: "List Export Profiles",
      description: "List export profiles available for a pack.",
      inputSchema: listExportProfilesInputSchema,
      annotations: readOnlyAnnotations
    },
    async (args) => toTextToolResult(await listExportProfilesTool(context, args))
  );

  server.registerTool(
    "build_export_preview",
    {
      title: "Build Export Preview",
      description: "Build a read-only export preview using an existing pack export profile.",
      inputSchema: buildExportPreviewInputSchema,
      annotations: readOnlyAnnotations
    },
    async (args) => toTextToolResult(await buildExportPreviewTool(context, args))
  );

  return server;
}
