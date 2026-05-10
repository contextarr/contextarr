# Known Limitations

This page tracks public-launch limitations for the current developer preview. It is not a roadmap expansion request.

## Release State

- No tagged GitHub release has been created.
- No npm package is published; the root package remains `private: true`.
- No public support guarantee exists yet.
- Public screenshots are placeholders until reviewed launch screenshots are approved.
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

The alpha release needs reviewed screenshots before wider promotion:

- Pack Library grid.
- Dense table.
- Pack detail.
- Record detail with source map.
- Pack Health.
- Export preview.
- MCP or CLI output.
- Backup/security settings if that surface is promoted.
