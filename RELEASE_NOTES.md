# Release Notes

## Context Pack Core Preview: v0.1.0-alpha.1 Draft

This is a draft alpha release-note lane for Context Pack core readiness. No GitHub release, tag, package publish, deployment, registry launch, or marketplace launch has been performed.

### Core Working Now

- Context Pack schema, validation, deterministic validation reports, and local scanner reports.
- Fifteen public-safe demo Context Packs, including 12 curated starter Context Packs.
- Rebuildable SQLite index.
- Local API and React/Vite dashboard for pack library, records, health, review, exports, composition, backup, and restore surfaces.
- Profile-driven Context Pack exports for ChatGPT, Claude, Codex, Markdown, JSON, AGENTS.md, CLAUDE.md, and llms.txt targets.
- Starter Context Pack export determinism and redaction are guarded by `pnpm exports:verify`.
- Exposure Readiness reports are guarded by `pnpm exposure:verify` and remain read-only eligibility evidence.
- Read-only stdio MCP surfaces where implemented.
- Local backup/restore v0 with checksum manifests and quarantine-only restore.
- Release hardening docs and verification scripts.

### Alpha Evidence

- Latest recorded checkpoint: on branch `codex/contextarr-overnight-alpha`, the Stage 1 release gate passed, `pnpm release:verify` passed, and `pnpm docs:verify` plus `pnpm screenshots:verify` passed after the checkpoint.
- Live Docker smoke passed on alternate port `http://127.0.0.1:33211` because an existing `contextarr-app-1` occupied `3210`; the smoke proved the static UI loaded, `/api/health` was ok, `authRequired` was `true`, 15 packs and 12 starters were visible, `ai-workstation` health was healthy, Review Queue had 0 items, Draft Intake had 0 candidates, Collectors showed 4 collectors, and the Codex export preview and Composer preview endpoints responded.
- Smoke-only container and volume cleanup was completed after verification.
- Reviewed screenshots live under `docs/screenshots/v0.1.0-alpha.1/` and are checked by `pnpm screenshots:verify`.
- Starter exports are checked for deterministic output, redaction-aware inclusion, stable warning metadata, and no local absolute path leakage by `pnpm exports:verify`.
- CLI and API error paths have tests for sanitized local paths and controlled JSON error bodies.
- Draft, imported, composed, and restored/quarantine-shaped Context Pack outputs are tested to remain outside active API/export/search surfaces after rescan.
- `pnpm release:verify` is the local alpha candidate gate. It does not tag, publish, push, deploy, create a GitHub release, update a public registry or marketplace, or enable telemetry.
- `docs/audits/v0.1.0-alpha.1-release-candidate-evidence.md` records the local release candidate path and the explicit-approval boundary for tags or public release actions.
- Wave 1 local evidence packets can be generated with `node tools/launch/collect-release-evidence.mjs`; the collector records git branch and commit, release gate status summary, Docker smoke port/results, screenshot manifest status, and a no-public-action statement without running Docker, generating screenshots or video, or performing public actions.

### Planning Additions

- Agentic AI Context Readiness and Local Observability are accepted as AR0 docs-only planning scope.
- No readiness schemas, evidence tables, API routes, UI, CLI commands, release gates, telemetry, or agent runtime behavior are implemented by that planning addition.

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
