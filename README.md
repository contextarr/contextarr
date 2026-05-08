<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/svg/primary-horizontal.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/brand/svg/primary-horizontal-light.svg">
    <img alt="Contextarr" src="assets/brand/svg/primary-horizontal-light.svg" width="560">
  </picture>
</p>

# Contextarr

Contextarr is a self-hosted context automation and agent preparation system for AI assistants and agents.

It is designed to help power users and teams build, validate, review, render, compose, and export local-first context packs for tools like ChatGPT, Claude, Codex, Claude Code, OpenCode, Cursor, local agents, and read-only MCP clients.

## Status

Contextarr is an early public preview and is not production ready.

This repository is in Phase 24: Agent Kit Export Engine.

The original PRD through Phase 11 is implemented locally. The second PRD track now includes non-executable Skill schemas, validation, public-safe demo Skills, read-only local API indexing, a read-only Skill Library/detail UI, deterministic Skill health/review items, read-only Skill export previews, Agent Kit schemas and validation, public-safe demo Agent Kits, and read-only Agent Kit indexing/API/search.

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
- Deterministic SVG brand kit and web app brand mark.
- Read-only Composer page for selecting packs/records and building temporary custom exports.
- `POST /api/compose/preview` local API endpoint for composed export previews.
- Docker Compose local preview stack serving the built web app and API from one local origin.
- Public-preview docs, release checklist, and screenshot placeholders.
- Second PRD appendix for future Skills and Agent Kits.
- Phase 12 terminology docs for Context Packs, Skills, Agent Kits, Export Briefs, and non-executable Skill boundaries.
- Zod schemas and validator for non-executable Skills.
- `contextarr validate-skill <path>` and unified Skill detection in `contextarr validate <path>`.
- Eight public-safe demo Skills under `demo-skills/`.
- Phase 15 rebuildable SQLite index and read-only API endpoints for Skills, instructions, examples, sources, and export profiles.
- `GET /api/search?type=skill&q=` for Skill-scoped local search.
- Skill Library and Skill detail screens with sanitized instruction/example rendering.
- Deterministic Skill Health v0, object-aware Review Queue items, and SQLite-only Skill review status actions.
- Profile-driven Skill export generation for ChatGPT, Claude, Codex, Claude Code, Markdown, and JSON.
- Skill export previews through CLI, local API, Skill detail, and the Export Center.
- Zod schemas and validator for non-executable Agent Kits.
- `contextarr validate-agent-kit <path>` and unified Agent Kit detection in `contextarr validate <path>`.
- Eight public-safe demo Agent Kits under `demo-agent-kits/`.
- Phase 21 rebuildable SQLite index and read-only API endpoints for Agent Kits, included Context Packs, included Skills, export profile metadata, and Agent Kit-scoped search.
- Phase 22 Agent Kit Composer UI for selecting existing Context Packs and Skills, saving validated local Agent Kit files under the configured local Agent Kit directory, and opening saved Agent Kit detail views.
- Phase 23 read-only Agent Kit Library and Detail views plus Agent Kit health/review status derived from SQLite.
- Phase 24 profile-driven Agent Kit export generation that merges selected Context Pack records and Skill documents without execution.

Not included yet:

- Web importer UI.
- API import endpoints.
- Pack file editing from review actions.
- Saving composed exports as new packs.
- Agent Kit MCP extensions.
- Skill execution or Agent Kit runtime behavior.

## Product Positioning

Contextarr is not a chatbot, hosted memory vault, marketplace, RAG app, or agent runner. The first product shape is:

```text
Local sources in.
Validated context packs out.
Human-readable dashboard.
Profile-driven AI exports.
Read-only local MCP.
```

The second PRD keeps Context Packs as the core source-backed knowledge object and adds planning language for future Skills and Agent Kits:

```text
Context Packs tell agents what to know.
Skills tell agents how to work.
Agent Kits combine both for a specific task.
Export Briefs are generated from those ingredients.
```

Contextarr prepares Agent Kits. It does not run them.

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
  skill-validator/     Skill validation engine
  export-profiles/     Profile-driven export engine
  importers/           Local draft pack importers

demo-packs/            Fake public-safe demo packs
demo-skills/           Fake public-safe non-executable demo Skills
demo-agent-kits/       Fake public-safe non-executable Agent Kits
docs/                  Product, architecture, security, and roadmap docs
assets/brand/          Deterministic SVG brand kit
tools/brand-kit/       Private pnpm brand asset generator
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
- No executable Skills.
- No Agent Kit runner.
- No scripts inside packs.
- No direct Gmail, bank, or brokerage connectors.
- No managed AI dependency.
- No telemetry.
- No real private data in this repository.

See [docs/security-model.md](docs/security-model.md) for the full security posture.

## Brand Assets

The public SVG brand kit lives in [assets/brand](assets/brand). PNG previews and base64 exports are generated locally and ignored by Git.

## Quickstart

Install dependencies and run the local dev stack:

```bash
pnpm install
pnpm dev
```

Open the dashboard at `http://127.0.0.1:5173`.

Docker local preview:

```bash
docker compose build
docker compose up
```

Open the Docker preview at `http://127.0.0.1:3210`. Docker serves the built web app and local API from the same Fastify server. See [docs/quickstart.md](docs/quickstart.md) and [docs/docker.md](docs/docker.md).

Useful launch docs:

- [docs/terminology.md](docs/terminology.md)
- [docs/skills.md](docs/skills.md)
- [docs/agent-kits.md](docs/agent-kits.md)
- [docs/non-executable-skills.md](docs/non-executable-skills.md)
- [docs/security.md](docs/security.md)
- [docs/pack-authoring.md](docs/pack-authoring.md)
- [docs/export-profiles.md](docs/export-profiles.md)
- [docs/mcp.md](docs/mcp.md)
- [docs/roadmap.md](docs/roadmap.md)
- [docs/release-checklist.md](docs/release-checklist.md)

## Verification

```bash
pnpm install
pnpm phase11:verify
pnpm phase12:verify
pnpm phase21:verify
pnpm phase22:verify
pnpm phase23:verify
pnpm phase24:verify
pnpm --filter @contextarr/cli contextarr validate packages/pack-validator/test/fixtures/valid-minimal-pack
pnpm --filter @contextarr/cli contextarr validate demo-packs
pnpm --filter @contextarr/cli contextarr validate-skill demo-skills/support-ticket-writing-skill
pnpm --filter @contextarr/cli contextarr validate-agent-kit demo-agent-kits/support-ticket-writing-kit
```

The validator is read-only. It does not rewrite packs, fetch URLs, call APIs, run scripts, or execute pack content.

Render static HTML locally:

```bash
pnpm --filter @contextarr/cli contextarr render demo-packs/ai-workstation-pack --out rendered/ai-workstation
pnpm --filter @contextarr/cli contextarr render demo-packs --out rendered/demo-packs
```

Generate local exports:

```bash
pnpm --filter @contextarr/cli contextarr export demo-packs --all --out generated-exports/demo-packs
pnpm --filter @contextarr/cli contextarr export demo-skills --all --out generated-exports/demo-skills
pnpm --filter @contextarr/cli contextarr export demo-agent-kits --all --out generated-exports/demo-agent-kits --context-packs-dir demo-packs --skills-dir demo-skills
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
- `CONTEXTARR_SKILLS_DIR=./demo-skills`
- `CONTEXTARR_DEMO_AGENT_KITS_DIR=./demo-agent-kits`
- `CONTEXTARR_AGENT_KITS_DIR=./agent-kits`
- `CONTEXTARR_DATABASE_PATH=./data/contextarr.db`
- `CONTEXTARR_WEB_DIST_DIR=` optional built web app directory for same-origin serving
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
- `GET /api/skills`
- `GET /api/skills/:id`
- `GET /api/skills/:id/health`
- `GET /api/skills/:id/instructions`
- `GET /api/skills/:id/examples`
- `GET /api/skills/:id/exports`
- `GET /api/search?type=skill&q=`
- `GET /api/agent-kits`
- `GET /api/agent-kits/:id`
- `GET /api/agent-kits/:id/context-packs`
- `GET /api/agent-kits/:id/skills`
- `GET /api/agent-kits/:id/exports`
- `GET /api/agent-kits/:id/exports/:profileId/preview`
- `GET /api/search?type=agent-kit&q=`
- `POST /api/agent-kits`
- `POST /api/rescan`
