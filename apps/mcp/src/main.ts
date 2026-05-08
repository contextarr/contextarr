#!/usr/bin/env tsx
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { closeMcpContext, createMcpContext } from "./context";
import { createContextarrMcpServer } from "./server";

async function main(): Promise<void> {
  const context = createMcpContext();
  const server = createContextarrMcpServer(context);
  const transport = new StdioServerTransport();

  const close = async () => {
    try {
      await server.close();
    } finally {
      closeMcpContext(context);
    }
  };

  process.once("SIGINT", () => {
    close().finally(() => process.exit(0));
  });
  process.once("SIGTERM", () => {
    close().finally(() => process.exit(0));
  });

  await server.connect(transport);
  console.error("Contextarr MCP server ready.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
