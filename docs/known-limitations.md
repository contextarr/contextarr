# Known Limitations

This page tracks public-launch limitations for the current developer preview. It is not a roadmap expansion request.

## Release State

- No tagged GitHub release has been created.
- No npm package is published; the root package remains `private: true`.
- No public support guarantee exists yet.
- Reviewed `v0.1.0-alpha.1` screenshots exist for the local dashboard and CLI health proof, but no demo video has been approved.
- Docker Compose is a local preview path, not a hardened production deployment.

## Product Limits

- Contextarr is local-first and file-backed; it is not a hosted cloud service.
- SQLite is a derived rebuildable index, not hidden source-of-truth storage.
- Backup/restore v0 writes local backup directories and restores into quarantine/review output only.
- Context Pack collectors write private unreviewed draft packs only.
- Composer save-as-draft-pack writes private unreviewed draft Context Packs only.
- Local Skill importers are disabled unless `CONTEXTARR_ENABLE_LOCAL_IMPORTS=true`.
- Skills and Agent Kits are advanced-preview data objects. They do not execute.

## Explicit Non-Launches

- No public registry.
- No public marketplace.
- No remote install.
- No auto-activation.
- No signing implementation.
- No hosted cloud sync.
- No telemetry.
- No executable packs.
- No executable Skills.
- No Agent Kit runtime.
- No direct Gmail, bank, or brokerage connectors.

## Screenshot Requirements

The alpha release screenshot set is reviewed under `docs/screenshots/v0.1.0-alpha.1/` and must continue to pass `pnpm screenshots:verify`. Any replacement screenshot needs the same review check before commit.

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
