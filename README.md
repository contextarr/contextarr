# Contextarr

Contextarr is a self-hosted context automation system and pack manager for AI assistants and agents.

It is designed to help power users and teams build, validate, review, render, compose, and export local-first context packs for tools like ChatGPT, Claude, Codex, Claude Code, OpenCode, Cursor, local agents, and read-only MCP clients.

## Status

This repository is in Phase 0: workspace initialization.

Current scope:

- Monorepo skeleton.
- Project documentation.
- Package manager metadata.
- Local-first architecture decisions.
- Security and non-goal guardrails.

Not included yet:

- Application runtime code.
- Pack validation logic.
- Demo pack content.
- Database/index implementation.
- Web UI implementation.
- MCP implementation.
- Importers or exporters.

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
  web/                 React and Vite UI, later
  server/              Node.js Fastify API, later
  cli/                 Contextarr CLI, later

packages/
  schema/              Zod schemas, later
  renderer/            Sanitized Markdown and HTML renderer, later
  pack-validator/      Pack validation engine, later
  export-profiles/     Export profile support, later

demo-packs/            Fake public-safe demo packs, later
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

## Phase 0 Commands

No dependencies are installed in Phase 0. The only root script is a scaffold check:

```bash
pnpm phase0:verify
```

This command is metadata-only and does not run application functionality.
