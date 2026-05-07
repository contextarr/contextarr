# Contextarr

Contextarr is a self-hosted context automation system and pack manager for AI assistants and agents.

It is designed to help power users and teams build, validate, review, render, compose, and export local-first context packs for tools like ChatGPT, Claude, Codex, Claude Code, OpenCode, Cursor, local agents, and read-only MCP clients.

## Status

This repository is in Phase 9: Local Importers v1.

Current scope:

- Monorepo skeleton.
- Project documentation.
- Package manager metadata.
- Local-first architecture decisions.
- Security and non-goal guardrails.
- Zod schemas for pack manifests, records, sources, export profiles, and rules.
- Deterministic read-only pack validator.
- `contextarr validate <path>` CLI command.
- Test fixture packs for validator coverage.
- Five public-safe demo packs under `demo-packs/`.
- Rebuildable SQLite index for local pack folders.
- Local Fastify API for pack, record, health, search, and rescan data.
- Hardened local search for UI input.
- UI-ready pack summary fields for cover metadata and review queue counts.
- Optional local API token auth.
- React and Vite local dashboard shell.
- API-backed Pack Library with Cover Grid, Compact Cards, and Dense Table views.
- Read-only library search, sort, and filter controls.
- Pack detail and record detail views.
- Shared sanitized Markdown renderer.
- `contextarr render <path> --out <path>` static HTML command.
- Deterministic Pack Health v0.
- SQLite-backed review items and review status actions.
- Review Queue and Pack Health dashboard pages.
- Profile-driven export generation for ChatGPT, Claude, Codex, generic Markdown, and JSON records.
- `contextarr export <path> --profile <id> --out <path>` and `contextarr export <path> --all --out <path>` CLI commands.
- Local API export preview endpoint.
- Export Center and pack-level export preview, copy, and download UI.
- Local stdio MCP server with read-only pack, record, search, and export-preview tools.
- Local CLI/core importers for folders, Markdown, Obsidian, ChatGPT exports, and Claude exports.
- `contextarr import <path> --kind <kind> --out <path>` draft pack command.

Not included yet:

- Web importer UI.
- API import endpoints.
- Pack file editing from review actions.
- Composer workflows.

## Product Positioning

Contextarr is not a chatbot, hosted memory vault, marketplace, RAG app, or agent runner. The first product shape is:

```text
Local sources in.
Validated context packs out.
Human-readable dashboard.
Profile-driven AI exports.
Read-only local MCP.
```

## Repository Layout

```text
apps/
  web/                 React and Vite local dashboard
  server/              Node.js Fastify API
  cli/                 Contextarr CLI
  mcp/                 Read-only stdio MCP server

packages/
  schema/              Zod schemas
  renderer/            Sanitized Markdown and static HTML renderer
  pack-validator/      Pack validation engine
  export-profiles/     Profile-driven export engine
  importers/           Local draft pack importers

demo-packs/            Fake public-safe demo packs
docs/                  Product, architecture, security, and roadmap docs
```

## Planned Stack

- TypeScript monorepo.
- pnpm workspace.
- Node.js backend.
- Fastify API server.
- React + Vite frontend.
- SQLite as rebuildable derived index.
- Zod for schemas and validation.
- Sanitized Markdown rendering.
- Docker Compose for local operation.
- Read-only MCP SDK integration over stdio.

## Safety Boundaries

Contextarr v0 must stay local-first and data-only:

- No hosted cloud.
- No marketplace.
- No executable packs.
- No scripts inside packs.
- No direct Gmail, bank, or brokerage connectors.
- No managed AI dependency.
- No telemetry.
- No real private data in this repository.

See [docs/security-model.md](docs/security-model.md) for the full security posture.

## Verification

```bash
pnpm install
pnpm phase8:verify
pnpm --filter @contextarr/cli contextarr validate packages/pack-validator/test/fixtures/valid-minimal-pack
pnpm --filter @contextarr/cli contextarr validate demo-packs
```

The validator is read-only. It does not rewrite packs, fetch URLs, call APIs, run scripts, or execute pack content.

Render static HTML locally:

```bash
pnpm --filter @contextarr/cli contextarr render demo-packs/ai-workstation-pack --out rendered/ai-workstation
pnpm --filter @contextarr/cli contextarr render demo-packs --out rendered/demo-packs
```

Static HTML output is generated under ignored local folders such as `rendered/`.

Generate local export files:

```bash
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --profile ai-workstation-codex --out generated-exports/ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs --all --out generated-exports/demo-packs
```

Generated export files are derived artifacts and are ignored under `generated-exports/`.

Import local files into a generated draft pack:

```bash
pnpm --filter @contextarr/cli contextarr import packages/importers/test/fixtures/markdown-folder --kind markdown --out imported-packs/manual --pack-id manual-markdown-draft
```

Imported packs are drafts under ignored local folders such as `imported-packs/`. Imported records are private, unapproved, and tagged to avoid accidental export.

Run the read-only MCP server:

```bash
pnpm contextarr-mcp
```

Use `pnpm --silent contextarr-mcp` for pnpm-launched MCP client smoke checks so pnpm's script banner does not write to stdout. The MCP server uses stdio only. It exposes `list_packs`, `get_pack_summary`, `query_pack_context`, `get_record`, `list_export_profiles`, and `build_export_preview`. See [docs/mcp.md](docs/mcp.md).

## Local API

Start the local API after installing dependencies:

```bash
pnpm --filter @contextarr/server dev
```

Start the local web dashboard in another shell:

```bash
pnpm --filter @contextarr/web dev
```

Default API settings come from `.env.example`:

- `CONTEXTARR_HOST=127.0.0.1`
- `CONTEXTARR_PORT=3210`
- `CONTEXTARR_PACKS_DIR=./demo-packs`
- `CONTEXTARR_DATABASE_PATH=./data/contextarr.db`
- `CONTEXTARR_API_TOKEN=` optional; leave empty for local dev, set to require API tokens
- `VITE_CONTEXTARR_API_BASE=` optional web override; leave empty to use the Vite `/api` proxy
- `VITE_CONTEXTARR_API_TOKEN=` optional web token for protected local APIs
- `CONTEXTARR_MCP_RESCAN_ON_START=true`
- `CONTEXTARR_MCP_MAX_RESULTS=8`
- `CONTEXTARR_MCP_MAX_RECORD_CHARS=12000`
- `CONTEXTARR_MCP_ALLOW_PRIVATE=false`

When `CONTEXTARR_API_TOKEN` is set, all `/api/*` routes except `GET /api/health` require either `Authorization: Bearer <token>` or `X-Contextarr-Token: <token>`.

Available local API endpoints:

- `GET /api/health`
- `GET /api/packs`
- `GET /api/packs/:id`
- `GET /api/packs/:id/health`
- `GET /api/packs/:id/exports/:profileId/preview`
- `GET /api/packs/:id/records`
- `GET /api/records/:id`
- `GET /api/review-items`
- `POST /api/review-items/:id/status`
- `GET /api/search?q=`
- `POST /api/rescan`
