# Contextarr Roadmap

## Current Developer Preview

Contextarr currently supports a working local Context Pack loop:

- Context Pack schema validation, CLI validation, deterministic validation reports, and local scanner reports.
- Sixteen public-safe demo Context Packs, including 12 curated starter Context Packs.
- Rebuildable SQLite index and local Fastify API.
- React/Vite dashboard with Library, pack detail, record detail, Pack Health, Skill Health, Review Queue, Exports, and Composer.
- Sanitized Markdown rendering and static HTML rendering.
- Profile-driven Context Pack exports for ChatGPT, Claude, Codex, Markdown, JSON, AGENTS.md, CLAUDE.md, and llms.txt targets.
- CLI/core local importers for draft packs.
- Read-only stdio MCP.
- Docker Compose local preview.
- Context Pack Backup/Restore v0 with local checksum-backed backup directories and quarantine-only restore.
- Context Pack collector v0 that creates private unreviewed draft packs under `draft-packs/` without activating them.

The repo also contains advanced-preview data-only surfaces:

- Skill schema validation, public-safe demo Skills, read-only Skill indexing/API, Skill Library/detail UI, deterministic Skill Health/Review Queue support, and profile-driven Skill exports.
- Agent Kit schema validation, public-safe demo Agent Kits, read-only Agent Kit indexing/API/search, Agent Kit Composer save flow, Agent Kit Library/detail/health, and profile-driven Agent Kit exports.
- Read-only MCP tools for Skills and Agent Kits, including scoped Agent Kit context search and Agent Kit export previews.
- Local Skill importers for draft Skill folders and gated local API writes.
- Public-safe Agent Kit templates, read-only template APIs, and Composer template prefill for unreviewed local draft kits.

These advanced-preview surfaces are present, but the first public release should prove the Context Pack adoption loop before presenting Skills and Agent Kits as equal product pillars.

## Product Direction

Context Packs remain the core source-backed knowledge object.

- Skills: non-executable instruction artifacts that tell agents how to work.
- Agent Kits: self-describing, task-ready pairings of Context Packs and Skills that tell agents how a specific bundle should be used for a specific task.
- Export Briefs: generated output artifacts for AI tools or humans.

Contextarr prepares Agent Kits. It does not run them.

## Core Stabilization Gate

The v1 bridge plan freezes further Skills and Agent Kit expansion until Context Pack core readiness is explicitly accepted or superseded by a decision record.

The core readiness lane is:

1. Install.
2. Validate demo packs.
3. View in dashboard.
4. Inspect records and sources.
5. See Pack Health.
6. Export Claude/Codex briefs.
7. Query through read-only MCP.
8. Delete SQLite and rebuild.
9. Confirm nothing executes or phones home.

## Near-Term

- Repair stale release gates for the 16-pack demo set and 12 starter Context Packs.
- Finish `v0.1.0-alpha.1` release docs and known limitations.
- Keep reviewed screenshots current and add a short demo video.
- Improve public-site and README framing around Core Now vs Advanced Preview.
- Keep public feedback focused on pack format, validation rules, export profiles, and the local dashboard loop.
- Complete v1 core release-hardening gates before any frozen expansion resumes.
- Usability polish around pack authoring.

## Deferred

- Phase 29: Private team registry prototype. Frozen behind the v1 core-stabilization gate.
- Official Pack Gallery, Verified Registry Prototype, Private Team Registry, and Marketplace remain post-v1 gated tracks.
- Web importer UI.
- Always-on API import endpoints.
- Pack file mutation from review actions.
- Hosted cloud, marketplace, telemetry, executable packs, Agent Kit runtime, and live sensitive-account connectors.
