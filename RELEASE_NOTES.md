# Release Notes

## v0.1.0-alpha.1 Draft

This is a draft alpha release-note lane for Context Pack core readiness. No GitHub release, tag, package publish, deployment, registry launch, or marketplace launch has been performed.

### Core Working Now

- Context Pack schema, validation, deterministic validation reports, and local scanner reports.
- Sixteen public-safe demo Context Packs, including 12 curated starter Context Packs.
- Rebuildable SQLite index.
- Local API and React/Vite dashboard for pack library, records, health, review, exports, composition, backup, and restore surfaces.
- Profile-driven Context Pack exports for ChatGPT, Claude, Codex, Markdown, JSON, AGENTS.md, CLAUDE.md, and llms.txt targets.
- Starter Context Pack export determinism and redaction are guarded by `pnpm exports:verify`.
- Read-only stdio MCP surfaces where implemented.
- Local backup/restore v0 with checksum manifests and quarantine-only restore.
- Release hardening docs and verification scripts.

### Advanced Preview

- Non-executable Skills as data-only instruction artifacts.
- Non-executable Agent Kits as data-only compositions of Context Packs and Skills.
- Agent Kit templates that create unreviewed local draft Agent Kits only.

Contextarr prepares Agent Kits. It does not run them.

### Known Limitations

- No tagged release yet.
- No npm package publishing.
- No support guarantee yet.
- Reviewed alpha screenshots are committed under `docs/screenshots/v0.1.0-alpha.1/` and verified by `pnpm screenshots:verify`.
- Docker Compose is a local preview path, not a hardened production deployment.
- No public registry, marketplace, remote install, signing implementation, hosted cloud sync, telemetry, executable packs, executable Skills, or Agent Kit runtime.

### Frozen

- Further Skills expansion.
- Further Agent Kit expansion.
- Private registry prototype.

These remain frozen until Context Pack core readiness is explicitly accepted or superseded by a decision record.
