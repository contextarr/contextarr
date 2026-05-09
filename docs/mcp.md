# Contextarr MCP

Status note: Check [implementation-status.md](implementation-status.md) before treating MCP content-visibility gates or future transport modes as shipped.

## Summary

Contextarr includes a local read-only MCP server for exposing validated context packs to MCP clients. It uses stdio transport only and keeps pack files as the source of truth. SQLite is still derived local state.

MCP is optional. Contextarr's primary deterministic automation interface is the CLI, and MCP must not become the internal source of truth. CLI, API, Web UI, MCP, and exports should call shared core functions rather than shelling out to each other.

## Run

```bash
pnpm contextarr-mcp
```

For MCP clients or automated stdio smoke checks that launch through pnpm, use the silent form so pnpm does not print its script banner to stdout:

```bash
pnpm --silent contextarr-mcp
```

The server writes operational logs to stderr. Stdout is reserved for MCP JSON-RPC messages. The Claude Desktop example below invokes Node directly and does not need pnpm's silent flag.

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
- `CONTEXTARR_MCP_MAX_PREVIEW_CHARS=24000`
- `CONTEXTARR_MCP_ALLOW_PRIVATE=false`

Unapproved, rejected, draft, private, sensitive, secret, and blocked-tag records are omitted from trusted query and export-preview paths by default. Private, internal, and sensitive record bodies are omitted unless `CONTEXTARR_MCP_ALLOW_PRIVATE=true`; secret record bodies are never returned.

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

For local development, `pnpm --filter @contextarr/mcp dev` remains an alias. The canonical workspace command is `pnpm contextarr-mcp`.

Docker Compose does not host MCP. MCP remains a local stdio process launched by the client.

## Safety

The MCP server does not mutate pack files, run shell commands, fetch URLs, call AI APIs, upload data, create marketplace behavior, or implement importers/composer flows. Query logging stores metadata only and does not store returned context or raw query text.

The dedicated MCP safety model is documented in [docs/mcp-safety-model.md](mcp-safety-model.md). MCP must remain read-only, approved-content-only by default, redaction-aware, result-limited, localhost-first where network exposure exists, and free of mutating tools.
