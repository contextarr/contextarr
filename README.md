<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/svg/primary-horizontal.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/brand/svg/primary-horizontal-light.svg">
    <img alt="Contextarr" src="assets/brand/svg/primary-horizontal-light.svg" width="560">
  </picture>
</p>

# Contextarr

Own your AI context. Contextarr is a local-first Context Pack system for turning Markdown records, source maps, review metadata, redaction rules, and export profiles into reusable AI-ready exports and read-only agent context.

Status: developer preview from `main`. Core Context Pack workflows are being stabilized. Skills and Agent Kits are advanced-preview data objects; they do not execute, and Contextarr does not run agents.

For exact shipped-versus-planned claims, use [docs/implementation-status.md](docs/implementation-status.md) as the source of truth.

## What Contextarr Is

Contextarr is a self-hosted tool for building and managing local Context Packs:

```text
Local files in.
Validated Context Packs out.
Human-readable dashboard.
Profile-driven AI exports.
Read-only local MCP.
```

The core object is the Context Pack: a local, source-backed, data-only folder with records, sources, validation rules, redaction rules, and export profiles.

Contextarr is not a chatbot, hosted memory vault, managed RAG app, marketplace, registry, or agent runner.

## Core Working Now

- Context Pack schema, validation, and deterministic validation reports.
- 16 public-safe demo packs, including 12 curated starter Context Packs.
- Rebuildable SQLite index derived from local files.
- Local Fastify API for packs, records, search, health, exports, composition, collectors, backup, and restore surfaces.
- React/Vite dashboard with Pack Library, starter/local/imported grouping, pack detail, record detail, Pack Health, Review Queue, Export Center, and Composer.
- Profile-driven Context Pack exports for ChatGPT, Claude, Codex, generic Markdown, JSON, `AGENTS.md`, `CLAUDE.md`, and `llms.txt`.
- CLI commands for Context Pack validation, rendering, export generation, local import drafts, scanner reports, backup, and quarantine restore.
- Read-only stdio MCP surfaces where implemented by the local MCP package.
- Docker Compose local preview serving the built dashboard and API from one local origin.
- Public-safe starter pack docs, release hardening docs, and screenshot placeholders.

## Advanced Preview

These surfaces exist in the checkout, but they are not the public headline for the first release:

- Non-executable Skills as data-only instruction artifacts.
- Non-executable Agent Kits as data-only compositions of Context Packs and Skills.
- Skill and Agent Kit validation, indexing, read-only API/UI views, export previews, and read-only MCP tools where implemented.
- Agent Kit templates that generate unreviewed local draft Agent Kits.
- Local Skill importers, gated behind `CONTEXTARR_ENABLE_LOCAL_IMPORTS=true`.
- Backup/restore v0, Context Pack collectors, Composer save-as-draft-pack, local scanner reports, and trust/registry planning docs.

Skills and Agent Kits are frozen behind the v1 bridge gate until Context Pack core readiness is accepted or superseded by a decision record.

Contextarr prepares Agent Kits. It does not run them.

## Not Included

- No hosted cloud.
- No public registry.
- No public marketplace.
- No remote install or auto-activation.
- No creator accounts or payments.
- No executable packs.
- No executable Skills.
- No Agent Kit runtime.
- No scripts inside packs.
- No direct Gmail, bank, or brokerage connectors.
- No managed AI dependency.
- No telemetry.
- No real private data in this repository.

## Quickstart

Requirements:

- Node.js 20 or newer.
- pnpm 10.
- Docker Desktop, optional, for the Compose preview.

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

Open the Docker preview at `http://127.0.0.1:3210`.

See [docs/quickstart.md](docs/quickstart.md), [docs/install.md](docs/install.md), and [docs/docker.md](docs/docker.md).

## Verification

Start with the core checks:

```bash
pnpm docs:verify
pnpm demo:validate
pnpm v1-core:verify
pnpm site:verify
```

Run the full local release gate before proposing an alpha:

```bash
pnpm release:verify
```

Useful Context Pack CLI smoke commands:

```bash
pnpm --filter @contextarr/cli contextarr validate demo-packs
pnpm --filter @contextarr/cli contextarr validate demo-packs --json
pnpm --filter @contextarr/cli contextarr render demo-packs/ai-workstation-pack --out rendered/ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs --all --out generated-exports/demo-packs
pnpm --filter @contextarr/cli contextarr scan demo-packs/ai-workstation-pack --format json
pnpm --filter @contextarr/cli contextarr backup demo-packs --out data/backups
pnpm --filter @contextarr/cli contextarr restore data/backups/<backup-id> --out data/restored-packs
```

Run the read-only MCP server:

```bash
pnpm contextarr-mcp
```

Use `pnpm --silent contextarr-mcp` for pnpm-launched MCP client smoke checks so pnpm's script banner does not write to stdout.

## Security Boundaries

Contextarr v0 must stay local-first, data-only, and review-first:

- Context Pack files are source of truth.
- SQLite is a derived rebuildable index.
- Validation, scanning, health, export previews, and MCP tools must not execute pack content.
- Restores and generated drafts land in review/quarantine flows; they are not activated automatically.
- The scanner is a gate, not a guarantee; human review remains required before activation, export, registry exposure, or MCP exposure.

See [docs/security.md](docs/security.md), [docs/security-model.md](docs/security-model.md), [docs/non-goals.md](docs/non-goals.md), and [docs/known-limitations.md](docs/known-limitations.md).

## Current Limitations

- No tagged GitHub release has been created.
- The root package is still `private: true`; no npm package is published.
- Screenshots are placeholders until reviewed launch screenshots are approved.
- Docker Compose is a local preview path, not a hardened production deployment.
- Backup/restore v0 is local and quarantine-only.
- Context Pack collectors and Composer save flows create private unreviewed drafts only.
- Skills and Agent Kits are advanced-preview data objects, not runtime features.
- Public registry, marketplace, signing implementation, remote install, cloud sync, and telemetry remain out of scope.

See [docs/known-limitations.md](docs/known-limitations.md), [docs/known-issues.md](docs/known-issues.md), [docs/release-checklist.md](docs/release-checklist.md), and [RELEASE_NOTES.md](RELEASE_NOTES.md).

## Repository Layout

```text
apps/
  web/                 React and Vite local dashboard
  server/              Node.js Fastify API
  cli/                 Contextarr CLI
  mcp/                 Read-only stdio MCP server
  site/                Astro public site

packages/
  schema/              Zod schemas
  renderer/            Sanitized Markdown and static HTML renderer
  pack-validator/      Pack validation engine
  skill-validator/     Skill validation engine
  agent-kit-validator/ Agent Kit validation engine
  export-profiles/     Profile-driven export engine
  importers/           Local draft pack and draft Skill importers
  backups/             Local Context Pack backup and quarantine restore
  brand-registry/      Local brand identifiers and safe logo assets

demo-packs/            Public-safe demo Context Packs
demo-skills/           Public-safe non-executable demo Skills
demo-agent-kits/       Public-safe non-executable demo Agent Kits
agent-kit-templates/   Public-safe data-only Agent Kit templates
docs/                  Product, architecture, security, release, and roadmap docs
assets/brand/          Contextarr brand assets
tools/                 Local verification and launch helpers
```

## Further Docs

- [docs/api.md](docs/api.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/backups.md](docs/backups.md)
- [docs/collectors.md](docs/collectors.md)
- [docs/composed-packs.md](docs/composed-packs.md)
- [docs/config-reference.md](docs/config-reference.md)
- [docs/export-profiles.md](docs/export-profiles.md)
- [docs/faq.md](docs/faq.md)
- [docs/implementation-status.md](docs/implementation-status.md)
- [docs/mcp.md](docs/mcp.md)
- [docs/pack-authoring.md](docs/pack-authoring.md)
- [docs/pack-migrations.md](docs/pack-migrations.md)
- [docs/quickstart.md](docs/quickstart.md)
- [docs/release-process.md](docs/release-process.md)
- [docs/restore.md](docs/restore.md)
- [docs/roadmap.md](docs/roadmap.md)
- [docs/troubleshooting.md](docs/troubleshooting.md)
- [docs/upgrade.md](docs/upgrade.md)
