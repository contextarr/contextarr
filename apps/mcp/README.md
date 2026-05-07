# Contextarr MCP

Local read-only MCP server for Contextarr.

Run in development:

```bash
pnpm contextarr-mcp
```

Use `pnpm --silent contextarr-mcp` when launching through pnpm from an MCP client or automated stdio smoke check. The server uses stdio transport only and logs to stderr so stdout remains reserved for MCP JSON-RPC messages.
