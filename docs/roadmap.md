# Contextarr Roadmap

Status note: [docs/implementation-status.md](implementation-status.md) is the shipped-versus-planned source of truth. This roadmap records direction and gates, not a claim that every planned surface is shipped.

## Current Developer Preview

Contextarr currently supports a working local Context Pack loop:

- Context Pack schema validation, CLI validation, deterministic validation reports, and local scanner reports.
- Fifteen public-safe demo Context Packs, including 12 curated starter Context Packs.
- Rebuildable SQLite index and local Fastify API.
- React/Vite dashboard with Library, pack detail, record detail, Pack Health, Skill Health, Review Queue, Exports, and Composer.
- Sanitized Markdown rendering and static HTML rendering.
- Profile-driven Context Pack exports for ChatGPT, Claude, Codex, Markdown, JSON, AGENTS.md, CLAUDE.md, and llms.txt targets.
- CLI/core local importers for draft packs.
- Read-only stdio MCP.
- Docker Compose local preview.
- Context Pack Backup/Restore v0 with local checksum-backed backup directories and quarantine-only restore.
- Context Pack collector v0 that creates private unreviewed draft packs under `draft-packs/` without activating them.
- Per-pack Context Readiness API/CLI/UI reporting and bounded metadata-only Local Observability reads.
- Explicit local Saved Export Brief save/list/fetch foundation for generated preview artifact metadata, hashes, counts, warning codes, and bounded safe snapshots.

The repo also contains non-executing advanced-preview surfaces:

- Skill schema validation, public-safe demo Skills, read-only Skill indexing/API, Skill Library/detail UI, deterministic Skill Health/Review Queue support, and profile-driven Skill exports.
- Agent Kit schema validation, public-safe demo Agent Kits, read-only Agent Kit indexing/API/search, Agent Kit Composer save flow, Agent Kit Library/detail/health, and profile-driven Agent Kit exports.
- Read-only MCP tools for Skills and Agent Kits, including scoped Agent Kit context search and Agent Kit export previews.
- Local Skill importers for draft Skill folders and gated local API writes.
- Public-safe Agent Kit templates, read-only template APIs, and Composer template prefill for unreviewed local draft kits.

These advanced-preview surfaces are present, but the first public release should prove the Context Pack adoption loop before presenting Skills and Agent Kits as equal product pillars.

## Product Direction

Long term, Contextarr is a local-first AI artifact gateway for Context Packs, Skills, Agent Kits, and Export Briefs. The first public release should still explain the narrower core loop: local files become validated, redaction-aware Context Packs that can be exported or served through read-only MCP. See [master-plan.md](master-plan.md) for the full build order and [product-strategy.md](product-strategy.md) for category framing.

Context Packs remain the core source-backed knowledge object.

- Skills: non-executable instruction artifacts that tell agents how to work.
- Agent Kits: self-describing, task-ready pairings of Context Packs and Skills that tell agents how a specific bundle should be used for a specific task.
- Export Briefs: generated output artifacts for AI tools or humans.
- Private Context: a future protected view and policy layer over sensitive local artifacts, not a separate hosted personal memory vault.
- Context Readiness: a planned report layer for whether a Context Pack is source-backed, reviewed, governed, redacted, export-fit, and locally observable enough for AI assistant or agent use.
- Local Observability: planned local evidence metadata for exports, MCP queries, readiness calculations, reviews, and warnings. It is not product telemetry.
- Derived Index Adapters: a future bring-your-own-retrieval export lane for vector stores, graph databases, RAG tools, Graphify-style workflows, and agent runtimes. Contextarr remains the source-backed context layer; downstream indexes are derived and rebuildable.

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

Context Readiness may strengthen Pack Health, Exposure Readiness, export previews, MCP logs, benchmarks, and docs after the core loop is stable. It must not derail the Context Pack v1 lane.

## Near-Term

- Repair stale release gates for the 15-pack demo set and 12 starter Context Packs.
- Finish `v0.1.0-alpha.1` release docs and known limitations.
- Keep reviewed screenshots current and add a short demo video.
- Improve public-site and README framing around Core Now vs Advanced Preview.
- Keep public feedback focused on pack format, validation rules, export profiles, and the local dashboard loop.
- Complete v1 core release-hardening gates before any frozen expansion resumes.
- Keep the new Context Readiness and Local Observability runtime slices narrow: per-pack read-only readiness, bounded metadata-only local evidence reads, and no policy enforcement, telemetry, or export/MCP widening.
- Usability polish around pack authoring.
- Keep Private Context, External Skill artifact preservation, and Local Event Hooks documented as future scoped tracks without expanding the current runtime.
- Keep Derived Index Adapters in spec/docs mode until export-depth work outranks adoption hardening.

## Deferred

- Phase 29: Private team registry prototype. Frozen behind the v1 core-stabilization gate.
- Official Pack Gallery, Verified Registry Prototype, Private Team Registry, and Marketplace remain post-v1 gated tracks.
- Protected-pack unlock, app lock, and encrypted export/backup bundle flows for Private Context.
- External Skill artifact archive, classifier, compatibility reports, and native-bundle export modes.
- Local Event Hooks for metadata-only local automation.
- Saved Export Brief history, regeneration, export depth, and MCP metadata exposure beyond the current explicit local save/list/fetch foundation.
- Derived Index Adapter export profiles and recipes for vector stores, graph databases, RAG tools, Graphify-style workflows, and agent runtimes.
- Web importer UI.
- Always-on API import endpoints.
- Pack file mutation from review actions.
- Built-in vector database, built-in graph database, code graph engine, managed RAG app, external database sync service, hosted cloud, marketplace, product telemetry, executable packs, Agent Kit runtime, mutating MCP, agent runners, hidden network calls, and live sensitive-account connectors.
