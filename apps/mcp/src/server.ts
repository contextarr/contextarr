import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ContextarrMcpContext } from "./context";
import {
  buildAgentKitExportPreviewInputSchema,
  buildAgentKitExportPreviewTool,
  buildExportPreviewInputSchema,
  buildExportPreviewTool,
  getAgentKitSummaryInputSchema,
  getAgentKitSummaryTool,
  getPackSummaryInputSchema,
  getPackSummaryTool,
  getRecordInputSchema,
  getRecordTool,
  getSkillInputSchema,
  getSkillSummaryInputSchema,
  getSkillSummaryTool,
  getSkillTool,
  listAgentKitsInputSchema,
  listAgentKitsTool,
  listExportProfilesInputSchema,
  listExportProfilesTool,
  listPacksInputSchema,
  listPacksTool,
  listSkillsInputSchema,
  listSkillsTool,
  queryAgentKitContextInputSchema,
  queryAgentKitContextTool,
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

  server.registerTool(
    "list_skills",
    {
      title: "List Skills",
      description: "List local data-only Contextarr Skills from the derived index.",
      inputSchema: listSkillsInputSchema,
      annotations: readOnlyAnnotations
    },
    async (args) => toTextToolResult(await listSkillsTool(context, args))
  );

  server.registerTool(
    "get_skill_summary",
    {
      title: "Get Skill Summary",
      description: "Return safe summary, sources, export profiles, and health for one Skill.",
      inputSchema: getSkillSummaryInputSchema,
      annotations: readOnlyAnnotations
    },
    async (args) => toTextToolResult(await getSkillSummaryTool(context, args))
  );

  server.registerTool(
    "get_skill",
    {
      title: "Get Skill",
      description: "Return one Skill with privacy-aware instruction and example bodies.",
      inputSchema: getSkillInputSchema,
      annotations: readOnlyAnnotations
    },
    async (args) => toTextToolResult(await getSkillTool(context, args))
  );

  server.registerTool(
    "list_agent_kits",
    {
      title: "List Agent Kits",
      description: "List local data-only Contextarr Agent Kits from the derived index.",
      inputSchema: listAgentKitsInputSchema,
      annotations: readOnlyAnnotations
    },
    async (args) => toTextToolResult(await listAgentKitsTool(context, args))
  );

  server.registerTool(
    "get_agent_kit_summary",
    {
      title: "Get Agent Kit Summary",
      description: "Return safe summary, included Context Packs, included Skills, export profiles, and health for one Agent Kit.",
      inputSchema: getAgentKitSummaryInputSchema,
      annotations: readOnlyAnnotations
    },
    async (args) => toTextToolResult(await getAgentKitSummaryTool(context, args))
  );

  server.registerTool(
    "query_agent_kit_context",
    {
      title: "Query Agent Kit Context",
      description: "Search Agent Kit, Context Pack, record, Skill, and Skill document context with privacy-aware snippets.",
      inputSchema: queryAgentKitContextInputSchema,
      annotations: readOnlyAnnotations
    },
    async (args) => toTextToolResult(await queryAgentKitContextTool(context, args))
  );

  server.registerTool(
    "build_agent_kit_export_preview",
    {
      title: "Build Agent Kit Export Preview",
      description: "Build a read-only export preview using an existing Agent Kit export profile.",
      inputSchema: buildAgentKitExportPreviewInputSchema,
      annotations: readOnlyAnnotations
    },
    async (args) => toTextToolResult(await buildAgentKitExportPreviewTool(context, args))
  );

  return server;
}
