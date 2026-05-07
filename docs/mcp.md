# Contextarr MCP

## Summary

Contextarr includes a local read-only MCP server for exposing validated context packs to MCP clients. It uses stdio transport only and keeps pack files as the source of truth. SQLite is still derived local state.

## Run

```bash
pnpm --filter @contextarr/mcp dev
```

The server writes operational logs to stderr. Stdout is reserved for MCP JSON-RPC messages.

## Tools

- `list_packs`
- `get_pack_summary`
- `query_pack_context`
- `get_record`
- `list_export_profiles`
- `build_export_preview`

All tools return one text content item containing pretty JSON. Controlled failures return `{ "ok": false, "error": "...", "message": "..." }`.

## Environment

- `CONTEXTARR_PACKS_DIR=./demo-packs`
- `CONTEXTARR_DATABASE_PATH=./data/contextarr.db`
- `CONTEXTARR_MCP_RESCAN_ON_START=true`
- `CONTEXTARR_MCP_MAX_RESULTS=8`
- `CONTEXTARR_MCP_MAX_RECORD_CHARS=12000`
- `CONTEXTARR_MCP_ALLOW_PRIVATE=false`

Private, internal, and sensitive record bodies are omitted unless `CONTEXTARR_MCP_ALLOW_PRIVATE=true`. Secret record bodies are never returned.

## Claude Desktop Example

Use absolute paths on Windows.

```json
{
  "mcpServers": {
    "contextarr": {
      "command": "node",
      "args": [
        "--import",
        "tsx",
        "D:/Codex/contextarr/apps/mcp/src/main.ts"
      ],
      "cwd": "D:/Codex/contextarr",
      "env": {
        "CONTEXTARR_PACKS_DIR": "D:/Codex/contextarr/demo-packs",
        "CONTEXTARR_DATABASE_PATH": "D:/Codex/contextarr/data/contextarr.db",
        "CONTEXTARR_MCP_RESCAN_ON_START": "true"
      }
    }
  }
}
```

## Safety

The MCP server does not mutate pack files, run shell commands, fetch URLs, call AI APIs, upload data, create marketplace behavior, or implement importers/composer flows. Query logging stores metadata only and does not store returned context or raw query text.
