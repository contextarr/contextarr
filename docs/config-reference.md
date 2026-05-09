# Configuration Reference

Status: v1 core contract candidate.

Contextarr reads configuration from environment variables and local defaults. Pack files remain source of truth; generated output and SQLite are local derived state.

## Local Server

| Variable | Default | Purpose |
|---|---|---|
| `CONTEXTARR_HOST` | `127.0.0.1` | Fastify bind host. |
| `CONTEXTARR_PORT` | `3210` | Fastify port. |
| `CONTEXTARR_DATA_DIR` | `./data` | Local data root. |
| `CONTEXTARR_DATABASE_PATH` | `./data/contextarr.db` | Rebuildable SQLite path. |
| `CONTEXTARR_PACKS_DIR` | `./demo-packs` | Context Pack directory. |
| `CONTEXTARR_WEB_DIST_DIR` | empty | Optional built web asset directory for same-origin serving. |
| `CONTEXTARR_API_TOKEN` | empty | Optional local API token. |
| `CONTEXTARR_LAN_MODE` | `false` | Local network mode flag. |
| `CONTEXTARR_TELEMETRY` | `false` | Must remain false; telemetry is not part of v1 core. |

## Advanced Preview Directories

These exist because the advanced checkout already includes Skills and Agent Kits. They are not a reason to expand beyond the v1 Context Pack gate.

| Variable | Default | Purpose |
|---|---|---|
| `CONTEXTARR_SKILLS_DIR` | `./demo-skills` | Demo Skill directory. |
| `CONTEXTARR_ENABLE_LOCAL_IMPORTS` | `false` | Enables local Skill import API/UI. |
| `CONTEXTARR_IMPORTED_SKILLS_DIR` | `./imported-skills` | Local draft Skill output root. |
| `CONTEXTARR_AGENT_KIT_TEMPLATES_DIR` | `./agent-kit-templates` | Public-safe template source. |
| `CONTEXTARR_DEMO_AGENT_KITS_DIR` | `./demo-agent-kits` | Demo Agent Kit directory. |
| `CONTEXTARR_AGENT_KITS_DIR` | `./agent-kits` | Local draft Agent Kit output root. |

## Web

| Variable | Default | Purpose |
|---|---|---|
| `VITE_CONTEXTARR_API_BASE` | empty | Optional API base override. |
| `VITE_CONTEXTARR_API_TOKEN` | empty | Optional browser build-time API token. Do not store secrets in committed files. |

## MCP

| Variable | Default | Purpose |
|---|---|---|
| `CONTEXTARR_MCP_RESCAN_ON_START` | `true` | Rebuild derived index on MCP start. |
| `CONTEXTARR_MCP_MAX_RESULTS` | `8` | Default MCP result limit. |
| `CONTEXTARR_MCP_MAX_RECORD_CHARS` | `12000` | Maximum returned record body characters. |
| `CONTEXTARR_MCP_ALLOW_PRIVATE` | `false` | Conservative privacy default for MCP bodies. |

## Safety Defaults

- Keep `.env` uncommitted.
- Use `.env.example` only for empty or fake values.
- Do not put API tokens, private data, credentials, or real exports in committed files.
- Do not use config to enable marketplace, registry, telemetry, hosted sync, shell execution, or runtime agent behavior.

