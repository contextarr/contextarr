# Contextarr MCP

Local read-only MCP server for Contextarr.

Run in development:

```bash
pnpm --filter @contextarr/mcp dev
```

The server uses stdio transport only. It logs to stderr so stdout remains reserved for MCP JSON-RPC messages.
