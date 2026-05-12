# Known Limitations

This page tracks public-launch limitations for the current developer preview. It is not a roadmap expansion request.

## Release State

- No tagged GitHub release has been created.
- No npm package is published; the root package remains `private: true`.
- No public support guarantee exists yet.
- Reviewed `v0.1.0-alpha.1` screenshots exist for the local dashboard and CLI health proof. The public homepage screenshot is the current wide Pack Library capture showing 15 packs / 120 records / 8 skills. `docs/demo-script.md` provides a script-ready local recording/checklist path, but no demo video has been reviewed or approved.
- Docker Compose is a local preview path, not a hardened production deployment.

## Product Limits

- Contextarr is local-first and file-backed; it is not a hosted cloud service.
- SQLite is a derived rebuildable index, not hidden source-of-truth storage.
- Backup/restore v0 writes local backup directories and restores into quarantine/review output only.
- Context Pack collectors write private unreviewed draft packs only.
- Composer save-as-draft-pack writes private unreviewed draft Context Packs only.
- Draft Intake v0 includes explicit proof-gated local activation and sanitized local activation history. It does not include multi-user approval workflows, remote install, publishing, export exposure, or MCP exposure for candidate packs.
- Exposure Readiness v0 is a read-only active-pack report. It explains default export and read-only MCP eligibility, but it does not approve packs, enforce policy, change export behavior, or widen MCP exposure.
- Local Skill importers are disabled unless `CONTEXTARR_ENABLE_LOCAL_IMPORTS=true`.
- Local Skill importers currently create data-only Contextarr Native Skill drafts and skip script-bearing resources; full External Skill Artifact preservation is not implemented.
- Skills and Agent Kits are advanced-preview data objects. They do not execute.
- Private Context is documented as a future protected view; app lock, protected-pack unlock, and encrypted export/backup bundle flows are not implemented.
- Local Event Hooks are not implemented.
- Derived Index Adapters are documented as a future export lane only. Vector store, graph database, RAG, Graphify seed, and adapter-recipe exports are not implemented.
- CLI/API path-redaction checks reduce accidental local path leakage in known outputs, but they are not a substitute for a full external security audit.

## Explicit Non-Launches

- No public registry.
- No public marketplace.
- No remote install.
- No auto-activation.
- No signing implementation.
- No hosted cloud sync.
- No telemetry.
- No built-in vector database, graph database, code graph engine, managed RAG app, hidden embedding calls, always-on external indexer, or external database sync service.
- No executable packs.
- No executable Skills.
- No Agent Kit runtime.
- No Local Event Hooks or remote webhook delivery.
- No direct Gmail, bank, or brokerage connectors.

## Screenshot Requirements

The alpha release screenshot set is reviewed under `docs/screenshots/v0.1.0-alpha.1/` and must continue to pass `pnpm screenshots:verify`. The public homepage image must also pass `pnpm public-surface:verify`. Any replacement screenshot needs the same review check before commit.

- Pack Library grid.
- Dense table.
- Pack detail.
- Record detail with source map.
- Pack Health.
- Export preview.
- MCP or CLI output.
- Backup or security boundary view.

## Export Proof Limits

Starter Context Pack export proof is limited to the 12 curated starter packs and the canonical alpha export targets. It must continue to pass `pnpm exports:verify` before release; broader Skill and Agent Kit exports remain advanced-preview gates.

Draft/quarantine proof is local and automated: tests cover imported, restored, composed, and collector-created draft outputs staying outside export and MCP surfaces until explicitly activated. Draft Intake can move a proof-gated candidate into the active packs root and refresh the local derived index, but it does not approve, publish, export, or expose candidate records through MCP.
