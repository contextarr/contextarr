<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/svg/primary-horizontal.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/brand/svg/primary-horizontal-light.svg">
    <img alt="Contextarr" src="assets/brand/svg/primary-horizontal-light.svg" width="560">
  </picture>
</p>

# Contextarr

Local-first context, skills, and agent kit infrastructure for AI tools and agent workflows.

[![CI](https://github.com/contextarr/contextarr/actions/workflows/ci.yml/badge.svg)](https://github.com/contextarr/contextarr/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/contextarr/contextarr)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/contextarr/contextarr)](https://github.com/contextarr/contextarr/commits/main)
[![Issues](https://img.shields.io/github/issues/contextarr/contextarr)](https://github.com/contextarr/contextarr/issues)
[![Pull requests](https://img.shields.io/github/issues-pr/contextarr/contextarr)](https://github.com/contextarr/contextarr/pulls)

Contextarr helps operators maintain reusable, validated context assets that can be reviewed, rendered, composed, and exported for tools such as ChatGPT, Claude, Codex, Claude Code, Cursor, local agents, and MCP clients.

AI tools are getting better at using context, but useful project facts, workflow rules, prompts, and preferences still get scattered across chats, Markdown files, docs, and private memory systems. Contextarr provides a local, inspectable way to prepare that context without turning private knowledge into a hosted memory vault.

The product position is context quality, not generic memory: source-backed facts, review state, freshness, redaction, deterministic exports, and agent-safe boundaries should make a Contextarr brief visibly better than a loose manual prompt.

## Project Maturity

Contextarr is early alpha software. It is useful for local experimentation, public-safe demo packs, validation, export workflows, the local dashboard, and read-only MCP testing.

Do not treat it as production stable yet. Do not use it for regulated data, unattended automation, private company memory, or exposed network services without your own review.

The current repo includes Phase 11 local preview work and Phase 12 terminology planning. Phase 12 is documentation only: it defines future Skills, Agent Kits, Export Briefs, and non-executable boundaries without adding schema code, app behavior, runtime execution, or marketplace behavior.

For shipped versus planned behavior, check [docs/implementation-status.md](docs/implementation-status.md) before relying on roadmap language, future command examples, safety gates, export targets, registry behavior, Skills, or Agent Kits.

## What Works Today

Current implemented surfaces include:

- TypeScript and pnpm monorepo.
- Public-safe demo packs under [demo-packs](demo-packs).
- Zod schemas and deterministic pack validation.
- CLI commands for `validate`, `render`, `export`, and `import`.
- Stable `--json` and `--agent` envelopes for implemented CLI commands.
- Local Fastify API backed by rebuildable SQLite derived state.
- React and Vite local dashboard for Library, pack details, records, Pack Health, Review Queue, Exports, and Composer.
- Sanitized Markdown rendering and static HTML generation.
- Profile-driven exports for ChatGPT, Claude, Codex, Markdown, and JSON records.
- Local draft importers for folders, Markdown, Obsidian, ChatGPT exports, and Claude exports.
- Read-only stdio MCP server.
- Docker Compose local preview for the built web app and API.
- G2 public-safe Context Quality Benchmark fixture data under [demo-evals](demo-evals), with no harness or model calls.
- G3 local deterministic Context Quality Benchmark harness for fixture scoring and local report generation.
- G4 local deterministic Context Quality Benchmark gate for accepted demo fixtures and G3 reports.

The npm workspace packages are private. Contextarr packages are not published to npm yet.

## Repository Layout

- [demo-packs](demo-packs): fake public-safe Context Pack examples.
- [demo-evals](demo-evals): public-safe benchmark fixtures consumed by the local deterministic G3 harness.
- [docs](docs): product, safety, roadmap, and implementation-status docs.
- [apps](apps): current CLI, API, web, and MCP packages.
- [packages](packages): shared schemas, validator, renderer, exporters, importers, and utilities.

## What Contextarr Is Not

Contextarr is not:

- A chatbot.
- A hosted memory service.
- A generic RAG app.
- An agent runner.
- A workflow automation engine.
- A marketplace.
- A system for executing arbitrary scripts inside packs.
- A replacement for a personal knowledge management system.

Packs are treated as data, not executable code. Demo packs must use fake or public-safe sample data only.

## Quick Start

Requirements:

- Node.js 20 or newer.
- pnpm 10.
- Docker Desktop only if you want to test the Compose preview.

Install dependencies and run the local dev stack:

```bash
pnpm install
pnpm dev
```

Open the dashboard at `http://127.0.0.1:5173`.

The dev stack runs the API on `http://127.0.0.1:3210` and the Vite web app on `http://127.0.0.1:5173`.

## Common Commands

```bash
pnpm typecheck
pnpm test
pnpm docs:verify
pnpm benchmark:demo
pnpm benchmark:report
pnpm phase11:verify
pnpm phase12:verify
```

Useful CLI examples:

```bash
pnpm --filter @contextarr/cli contextarr validate demo-packs
pnpm --filter @contextarr/cli contextarr render demo-packs/ai-workstation-pack --out rendered/ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --target codex --out generated-exports/ai-workstation
pnpm --filter @contextarr/cli contextarr import packages/importers/test/fixtures/markdown-folder --kind markdown --out imported-packs/manual --pack-id manual-markdown-draft
pnpm --filter @contextarr/cli contextarr benchmark run support-ticket-drafting --sample-only --json
pnpm --filter @contextarr/cli contextarr benchmark gate --all --sample-only --json
pnpm contextarr-mcp
```

Generated output belongs in ignored local folders such as `rendered/`, `generated-exports/`, `imported-packs/`, `benchmark-reports/`, and `data/`.

Benchmark reports are local derived artifacts. G3 reports are useful diagnostics for fixture coverage, source-backed facts, safety, and export coverage. G4 adds a local deterministic gate for demo/export quality, available through `contextarr benchmark gate`, `pnpm benchmark:demo`, and `pnpm benchmark:report`; it does not add CI enforcement, public release automation, external AI calls, network fetches, telemetry, cloud services, registry behavior, marketplace behavior, Skills, or Agent Kits.

## Docker Preview

Docker Compose is a local preview path, not a hosted deployment recipe.

```bash
docker compose build
docker compose up
```

Open `http://127.0.0.1:3210`.

The Compose stack serves the built web app and local API from one Fastify process, mounts `demo-packs` read-only, and stores derived SQLite state in a Docker volume. See [docs/docker.md](docs/docker.md).

## Preview

No reviewed README screenshot is tracked yet. Screenshot guidance lives in [docs/assets/screenshots/README.md](docs/assets/screenshots/README.md), and the launch checklist tracks the remaining screenshot and social preview work.

## Documentation

Start with [docs/index.md](docs/index.md).

Key docs:

- [Quickstart](docs/quickstart.md)
- [Configuration](docs/configuration.md)
- [Implementation status](docs/implementation-status.md)
- [Architecture](docs/architecture.md)
- [Pack format](docs/pack-format.md)
- [Pack authoring](docs/pack-authoring.md)
- [Export profiles](docs/export-profiles.md)
- [API](docs/api.md)
- [MCP](docs/mcp.md)
- [Security notes](docs/security.md)
- [Security model](docs/security-model.md)
- [Threat model](docs/threat-model.md)
- [Non-goals](docs/non-goals.md)
- [Context quality](docs/context-quality.md)
- [Context quality benchmark](docs/context-quality-benchmark.md)
- [Roadmap](docs/roadmap.md)
- [Release checklist](docs/release-checklist.md)
- [Repository publication checklist](docs/repo-publication-checklist.md)

## Security

Contextarr is local-first, data-only, and human-review centered.

- Do not commit secrets, tokens, private keys, credentials, or real private data.
- Do not put real customer, company, medical, financial, or personal data in public demo packs.
- Do not expose local services publicly without explicit authentication and threat review.
- The MCP server is read-only and stdio-only in the current implementation.
- Contextarr does not add telemetry.

Report vulnerabilities using [SECURITY.md](SECURITY.md). Do not open public issues that include exploit details, credentials, or private data.

## Contributing

Small, scoped issues and pull requests are welcome while the project is early.

Please read [CONTRIBUTING.md](CONTRIBUTING.md), keep changes inside the product boundaries, update docs with user-facing changes, and run the relevant checks before opening a pull request.

## License

Contextarr is licensed under the [Apache License 2.0](LICENSE).
