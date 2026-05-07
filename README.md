# Contextarr

Contextarr is a self-hosted context automation system and pack manager for AI assistants and agents.

It is designed to help power users and teams build, validate, review, render, compose, and export local-first context packs for tools like ChatGPT, Claude, Codex, Claude Code, OpenCode, Cursor, local agents, and read-only MCP clients.

## Status

This repository is in Phase 5: pack detail, sanitized rendering, and static HTML.

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

Not included yet:

- MCP implementation.
- Importers or exporters.
- Export generation.
- Full Pack Health and Review Queue workflows.

## Product Positioning

Contextarr is not a chatbot, hosted memory vault, marketplace, RAG app, or agent runner. The first product shape is:

```text
Local sources in.
Validated context packs out.
Human-readable dashboard.
Read-only MCP later.
AI exports later.
```

## Repository Layout

```text
apps/
  web/                 React and Vite local dashboard
  server/              Node.js Fastify API
  cli/                 Contextarr CLI

packages/
  schema/              Zod schemas
  renderer/            Sanitized Markdown and static HTML renderer
  pack-validator/      Pack validation engine
  export-profiles/     Export profile support, later

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
- Read-only MCP SDK integration later.

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
pnpm phase5:verify
pnpm --filter @contextarr/cli contextarr validate packages/pack-validator/test/fixtures/valid-minimal-pack
pnpm demo:validate
```

The validator is read-only. It does not rewrite packs, fetch URLs, call APIs, run scripts, or execute pack content.

Render static HTML locally:

```bash
pnpm --filter @contextarr/cli contextarr render demo-packs/ai-workstation-pack --out rendered/ai-workstation
pnpm --filter @contextarr/cli contextarr render demo-packs --out rendered/demo-packs
```

Static HTML output is generated under ignored local folders such as `rendered/`.

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

When `CONTEXTARR_API_TOKEN` is set, all `/api/*` routes except `GET /api/health` require either `Authorization: Bearer <token>` or `X-Contextarr-Token: <token>`.

Available local API endpoints:

- `GET /api/health`
- `GET /api/packs`
- `GET /api/packs/:id`
- `GET /api/packs/:id/records`
- `GET /api/records/:id`
- `GET /api/search?q=`
- `POST /api/rescan`
