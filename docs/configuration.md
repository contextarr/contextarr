# Contextarr Configuration

This page centralizes local setup assumptions, environment variables, ports, package scripts, and Docker status.

## Runtime

| Requirement | Current expectation |
|---|---|
| Node.js | 20 or newer. CI uses Node.js 22. |
| Package manager | pnpm 10, declared in `package.json` as `pnpm@10.0.0`. |
| Workspace | pnpm workspace over `apps/*`, `packages/*`, and `tools/*`. |
| Database | SQLite as derived local state. Pack files remain the source of truth. |
| Docker | Optional local preview path, not a hosted deployment recipe. |

There is no `.nvmrc` or `.node-version` file currently. Use the `engines.node` field and CI config as the source of truth.

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the local API and web dashboard:

```bash
pnpm dev
```

Default local URLs:

| Surface | URL |
|---|---|
| Web dashboard | `http://127.0.0.1:5173` |
| Local API | `http://127.0.0.1:3210` |

The Vite dev server proxies `/api` requests to the local API.

## Environment Variables

Copy `.env.example` to `.env` for local changes. Do not commit `.env`.

| Variable | Default | Purpose |
|---|---|---|
| `CONTEXTARR_HOST` | `127.0.0.1` | Local API bind host. |
| `CONTEXTARR_PORT` | `3210` | Local API port. |
| `CONTEXTARR_DATA_DIR` | `./data` | Local derived data directory. |
| `CONTEXTARR_DATABASE_PATH` | `./data/contextarr.db` | SQLite database path. |
| `CONTEXTARR_PACKS_DIR` | `./demo-packs` | Pack directory loaded by local server and MCP defaults. |
| `CONTEXTARR_WEB_DIST_DIR` | empty | Optional built web app directory for same-origin serving. |
| `CONTEXTARR_API_TOKEN` | empty | Optional local API token. Empty is allowed only for loopback local development; non-loopback API binds fail closed without a token. |
| `CONTEXTARR_LAN_MODE` | `false` | Reserved explicit LAN-mode flag. Do not expose services publicly without auth and threat review. |
| `CONTEXTARR_TELEMETRY` | `false` | Telemetry is disabled and out of scope. |
| `VITE_CONTEXTARR_API_BASE` | empty | Optional web API base override. |
| `VITE_CONTEXTARR_API_TOKEN` | empty | Optional web token for protected local APIs. |
| `CONTEXTARR_MCP_RESCAN_ON_START` | `true` | Rebuild MCP index on startup. |
| `CONTEXTARR_MCP_MAX_RESULTS` | `8` | MCP result limit. |
| `CONTEXTARR_MCP_MAX_RECORD_CHARS` | `12000` | MCP record body character limit. |
| `CONTEXTARR_MCP_MAX_PREVIEW_CHARS` | `24000` | MCP export-preview content character limit. |
| `CONTEXTARR_MCP_ALLOW_PRIVATE` | `false` | Whether MCP may return private record bodies. Secret bodies are still blocked. |

Never put real secrets, credentials, private keys, tokens, customer data, company data, medical data, or financial data in demo packs, fixtures, screenshots, or public docs.

## Docker Status

Docker Compose is functional as a local preview path. It is not a production deployment recipe.

```bash
docker compose build
docker compose up
```

Open `http://127.0.0.1:3210`.

The Compose service:

- Builds the Vite web app.
- Runs the Fastify API on internal port `3210`.
- Serves the built web app and API from one origin.
- Mounts `./demo-packs` read-only.
- Stores derived SQLite state in the `contextarr-data` Docker volume.

To verify the Docker preview:

```bash
pnpm docker:verify
```

See [docker.md](docker.md).

## Common Scripts

Root scripts currently include:

| Script | Purpose |
|---|---|
| `pnpm dev` | Run local API and web dashboard together. |
| `pnpm dev:server` | Run only the Fastify API. |
| `pnpm dev:web` | Run only the Vite dashboard. |
| `pnpm dev:mcp` | Run the MCP server in dev mode. |
| `pnpm contextarr-mcp` | Run the read-only stdio MCP server. |
| `pnpm typecheck` | TypeScript check. |
| `pnpm test` | Vitest suite. |
| `pnpm docs:verify` | Launch documentation checks. |
| `pnpm site:verify` | Run Astro diagnostics and build the public site. |
| `pnpm quality:verify` | Run the local deterministic benchmark gate. |
| `pnpm safety:verify` | Run focused export/server/MCP safety regression suites. |
| `pnpm docker:verify` | Docker Compose smoke test. |
| `pnpm phase11:verify` | Phase 11 preview verification chain. |
| `pnpm phase12:verify` | Phase 12 terminology docs verification chain. |
| `pnpm site:dev` | Run the public project site locally. |
| `pnpm site:build` | Build the public project site. |

Historical `phase*:verify` scripts exist because the project has been built in phases. Do not rename them only for aesthetics.

## Local-Only Defaults

Contextarr should stay local-first by default:

- API binds to `127.0.0.1` in local development.
- Docker binds the host port to `127.0.0.1`.
- MCP is stdio-only.
- No telemetry is enabled.
- No hidden network calls are part of the current product boundary.

Do not document or enable unsafe remote access defaults without explicit authentication, threat review, and updated security docs.
