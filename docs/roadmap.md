# Contextarr Roadmap

## Current v0.1 Preview

Contextarr currently supports:

- Pack schema validation and CLI validation.
- Five fake public-safe demo packs.
- Rebuildable SQLite index and local Fastify API.
- React/Vite dashboard with Library, pack detail, record detail, Pack Health, Skill Health, Review Queue, Exports, and Composer.
- Sanitized Markdown rendering and static HTML rendering.
- Profile-driven exports for ChatGPT, Claude, Codex, Markdown, and JSON records.
- CLI/core local importers for draft packs.
- Read-only stdio MCP.
- Docker Compose local preview.
- Phase 12 terminology planning for Skills and Agent Kits.
- Skill schema validation, public-safe demo Skills, read-only Skill indexing/API, Skill Library/detail UI, deterministic Skill Health/Review Queue support, and profile-driven Skill exports.
- Agent Kit schema validation, public-safe demo Agent Kits, read-only Agent Kit indexing/API/search, Agent Kit Composer save flow, Agent Kit Library/detail/health, and profile-driven Agent Kit exports.
- Research Delta foundation for Context Packs: source license/hash/freshness metadata, deterministic validation reports, export readiness, redaction warning counts, and assistant handoff profile targets.
- Read-only MCP tools for Skills and Agent Kits, including scoped Agent Kit context search and Agent Kit export previews.
- Local Skill importers for draft Skill folders, gated local API writes, and a dashboard Collector flow.
- Public-safe Agent Kit templates, read-only template APIs, and Composer template prefill for unreviewed local draft kits.
- Phase 28 signing and trust model research docs for future checksums, signatures, private registry requirements, and marketplace non-goals.

## Second PRD Direction

The second PRD keeps Context Packs as the core source-backed knowledge object and adds future data-only objects:

- Skills: non-executable instruction artifacts that tell agents how to work.
- Agent Kits: self-describing, task-ready pairings of Context Packs and Skills that tell agents how a specific bundle should be used for a specific task.
- Export Briefs: generated output artifacts for AI tools or humans.

Contextarr prepares Agent Kits. It does not run them.

When Agent Kits are implemented later, self-description fields and validation must be part of the Agent Kit schema and validator from the first Agent Kit phase. Do not defer self-description to later polish, and do not move Agent Kits earlier in the roadmap.

## Draft v1.0 Bridge PRD

[contextarr_phase_by_phase_prd_to_v1.md](contextarr_phase_by_phase_prd_to_v1.md) is a draft bridge PRD and core-stabilization gate. It does not replace this roadmap or roll back the completed Skills and Agent Kit work. The intended direction is to keep the implemented path, while using the bridge PRD to freeze further Skills and Agent Kit expansion until the Context Pack core is v1.0-ready. Any sequencing conflict should be handled as a follow-up roadmap decision.

Phase 28 follows that gate as research only. Further Skills or Agent Kit expansion and any registry prototype remain frozen until Context Pack core v1.0 readiness is explicitly accepted or superseded by a decision record.

## Near-Term

- Phase 13: Skill schema and validator. Complete.
- Phase 14: fake public-safe demo Skills. Complete.
- Phase 15: Skill index and API. Complete.
- Phase 16: Skill Library UI. Complete.
- Phase 17: Skill Health and Review Queue. Complete.
- Phase 18: Skill export engine. Complete.
- Phase 19: Agent Kit schema and validator. Complete.
- Phase 20: fake public-safe demo Agent Kits. Complete.
- Phase 21: Agent Kit index and API. Complete.
- Phase 22: Agent Kit Composer UI. Complete.
- Phase 23: Agent Kit Library, detail, and health. Complete.
- Phase 24: Agent Kit export engine. Complete.
- Phase 24R: Research Delta foundation catch-up. Complete.
- Phase 25: Read-only MCP for Skills and Agent Kits. Complete.
- Phase 26: Local Skill importers. Complete.
- Phase 27: Agent Kit templates. Complete.
- Phase 28: Signing and trust model research. Complete.
- Public feedback on the pack format, validation rules, and export profile ergonomics.
- More fixture coverage for pack health and import edge cases.
- Better screenshots and a short demo video.
- Usability polish around pack authoring.

## Deferred

- Phase 29: Private team registry prototype. Frozen behind the v1.0 core-stabilization gate.
- Web importer UI.
- API import endpoints.
- Saving Composer output as a new pack.
- Pack file mutation from review actions.
- Hosted cloud, marketplace, telemetry, executable packs, and live sensitive-account connectors.
