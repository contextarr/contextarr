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
- Skill schema validation, public-safe demo Skills, read-only Skill indexing/API, Skill Library/detail UI, and deterministic Skill Health/Review Queue support.

## Second PRD Direction

The second PRD keeps Context Packs as the core source-backed knowledge object and adds future data-only objects:

- Skills: non-executable instruction artifacts that tell agents how to work.
- Agent Kits: task-ready pairings of Context Packs and Skills.
- Export Briefs: generated output artifacts for AI tools or humans.

Contextarr prepares Agent Kits. It does not run them.

## Near-Term

- Phase 13: Skill schema and validator. Complete.
- Phase 14: fake public-safe demo Skills. Complete.
- Phase 15: Skill index and API. Complete.
- Phase 16: Skill Library UI. Complete.
- Phase 17: Skill Health and Review Queue. Complete.
- Phase 18: Skill export engine.
- Public feedback on the pack format, validation rules, and export profile ergonomics.
- More fixture coverage for pack health and import edge cases.
- Better screenshots and a short demo video.
- Usability polish around pack authoring.

## Deferred

- Agent Kit schema and validator.
- Demo Agent Kits.
- Agent Kit index, API, Composer UI, detail UI, health, and export engine.
- Read-only MCP for Skills and Agent Kits.
- Web importer UI.
- API import endpoints.
- Saving Composer output as a new pack.
- Pack file mutation from review actions.
- Hosted cloud, marketplace, telemetry, executable packs, and live sensitive-account connectors.
