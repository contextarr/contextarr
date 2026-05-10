<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/svg/primary-horizontal.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/brand/svg/primary-horizontal-light.svg">
    <img alt="Contextarr" src="assets/brand/svg/primary-horizontal-light.svg" width="560">
  </picture>
</p>

# Contextarr

Contextarr is a local-first Context Pack system for preparing trusted AI context. It validates, renders, redacts, exports, and exposes approved context through CLI, API, dashboard, and read-only MCP. It does not run agents.

Status: Context Pack Core Preview from `main`. Core Context Pack workflows are being stabilized. Skills and Agent Kits are advanced-preview data objects; they do not execute, and Contextarr does not run agents.

For exact shipped-versus-planned claims, use [docs/implementation-status.md](docs/implementation-status.md) as the source of truth.

## What Contextarr Is

```text
Local files in.
Validated Context Packs out.
Human-readable dashboard.
Profile-driven AI exports.
Read-only local MCP.
```

The core object is the Context Pack: a local, source-backed, data-only folder with records, sources, validation rules, redaction rules, and export profiles.

Contextarr is not a chatbot, hosted memory vault, managed RAG app, public marketplace, registry, or agent runner.

## Core Working Now

- Context Pack schema, validation, deterministic validation reports, and local scanner reports.
- 15 public-safe demo packs, including 12 curated starter Context Packs.
- Rebuildable SQLite index derived from local files.
- Local Fastify API, React/Vite dashboard, CLI, profile-driven exports, and read-only stdio MCP surfaces where implemented.
- Pack Library, pack detail, record detail, Pack Health, Exposure Readiness, Review Queue, Export Center, Composer, Draft Intake, backup, restore, and Docker local preview.
- Context Pack collectors and Composer save flows that create private unreviewed drafts only.
- Draft Intake activation planning, dry-run proof, explicit proof-gated local activation, and sanitized local activation history.

## Advanced Preview

These surfaces exist in the checkout, but they are not the public headline for the first release:

- Non-executable Skills as data-only instruction artifacts.
- Non-executable Agent Kits as data-only compositions of Context Packs and Skills.
- Skill and Agent Kit validation, indexing, read-only API/UI views, export previews, and read-only MCP tools where implemented.
- Local Skill importers, gated behind `CONTEXTARR_ENABLE_LOCAL_IMPORTS=true`.
- Agent Kit templates that create unreviewed local draft Agent Kits only.

Skills and Agent Kits are advanced-preview, data-only, non-executable, and frozen until Context Pack core stabilizes.

Contextarr prepares Agent Kits. It does not run them.

## Not Included

- No hosted cloud.
- No public registry or public marketplace.
- No remote install or auto-activation.
- No creator accounts or payments.
- No executable packs, executable Skills, scripts inside packs, or Agent Kit runtime.
- No direct Gmail, bank, brokerage, Slack, Google Drive, Jira, CRM, or sensitive-account connectors.
- No managed AI dependency.
- No telemetry, product analytics, or hidden network calls.
- No real private data in this repository.

## Quickstart

Requirements:

- Node.js 20 or newer.
- pnpm 10.
- Docker Desktop, optional, for the Compose preview.

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

Recommended contributor checks:

```bash
pnpm verify:core
pnpm verify:security
pnpm verify:release
```

Focused checks:

```bash
pnpm docs:verify
pnpm demo:validate
pnpm v1-core:verify
pnpm advanced-preview:verify
pnpm exports:verify
pnpm exposure:verify
pnpm trust-loop:verify
pnpm site:verify
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
- Draft Intake activation moves a reviewed candidate into the configured active packs root, records sanitized local evidence, and refreshes the local index; it does not export, publish, perform network access, or expose candidates through MCP.
- `pnpm trust-loop:verify` proves draft/composed/quarantine candidates, non-public records, secret records, and `never_export` records stay out of read-only MCP and default export preview surfaces.
- Exposure Readiness is a read-only report. It does not approve packs, change export behavior, or widen MCP exposure.
- Context Readiness is planned as a future report layer; Local Observability is planned as local evidence metadata only, not product telemetry.
- The scanner is a gate, not a guarantee; human review remains required before activation, export, registry exposure, or MCP exposure.

See [docs/security.md](docs/security.md), [docs/security-model.md](docs/security-model.md), [docs/non-goals.md](docs/non-goals.md), and [docs/known-limitations.md](docs/known-limitations.md).

## Current Limitations

- No tagged GitHub release has been created.
- The root package is still `private: true`; no npm package is published.
- No public support guarantee is offered yet.
- Reviewed `v0.1.0-alpha.1` screenshots are committed under `docs/screenshots/v0.1.0-alpha.1/` and verified by `pnpm screenshots:verify`.
- Docker Compose is a local preview path, not a hardened production deployment.
- Backup/restore v0 is local and quarantine-only.
- Draft Intake v0 records sanitized local activation history only.
- Exposure Readiness v0 reports eligibility reasons only; it is not an enforcement or activation workflow.
- Context Readiness and Local Observability are accepted planning additions only.
- Skills and Agent Kits are advanced-preview data objects, not runtime features.
- Public registry, marketplace, signing implementation, remote install, cloud sync, and telemetry remain out of scope.

See [docs/known-limitations.md](docs/known-limitations.md), [docs/known-issues.md](docs/known-issues.md), [docs/release-checklist.md](docs/release-checklist.md), and [RELEASE_NOTES.md](RELEASE_NOTES.md).

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
- [docs/install.md](docs/install.md)
- [docs/known-issues.md](docs/known-issues.md)
- [docs/known-limitations.md](docs/known-limitations.md)
- [docs/mcp.md](docs/mcp.md)
- [docs/pack-authoring.md](docs/pack-authoring.md)
- [docs/pack-migrations.md](docs/pack-migrations.md)
- [docs/prd-additions/agentic-ai-context-readiness-local-observability.md](docs/prd-additions/agentic-ai-context-readiness-local-observability.md)
- [docs/decision-records/decision-agentic-ai-context-readiness.md](docs/decision-records/decision-agentic-ai-context-readiness.md)
- [docs/quickstart.md](docs/quickstart.md)
- [docs/release-checklist.md](docs/release-checklist.md)
- [docs/release-process.md](docs/release-process.md)
- [docs/restore.md](docs/restore.md)
- [docs/roadmap.md](docs/roadmap.md)
- [docs/troubleshooting.md](docs/troubleshooting.md)
- [docs/upgrade.md](docs/upgrade.md)
