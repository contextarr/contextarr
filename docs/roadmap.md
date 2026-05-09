# Contextarr Roadmap

Status note: This document mixes current preview status with future direction. Check [implementation-status.md](implementation-status.md) before treating CLI commands, export targets, safety gates, or future product surfaces as shipped.

## Current v0.1 Preview

Contextarr currently supports:

- Pack schema validation and CLI validation.
- CLI-first agent interface planning for deterministic automation without requiring MCP.
- Five fake public-safe demo packs.
- Rebuildable SQLite index and local Fastify API.
- React/Vite dashboard with Library, pack detail, record detail, Pack Health, Review Queue, Exports, and Composer.
- Sanitized Markdown rendering and static HTML rendering.
- Profile-driven exports for ChatGPT, Claude, Codex, Markdown, and JSON records.
- CLI/core local importers for draft packs.
- Read-only stdio MCP.
- Docker Compose local preview.
- Phase 12 terminology planning for future Skills and Agent Kits.
- Good-to-Great G0 docs for context quality, authoring SDK, trust and provenance, agent interface contract, and official starter ecosystem.
- G2 public-safe Context Quality Benchmark fixtures under `demo-evals/`.
- G3 local deterministic Context Quality Benchmark harness.
- G4 local deterministic Context Quality Benchmark gate.

## Good-to-Great Overlay

The Good-to-Great roadmap adds five context quality layers without replacing the core Context Pack roadmap:

- Context Quality Benchmark.
- Pack Authoring SDK and CI.
- Trust and Provenance Layer.
- Agent Interface Contract.
- Official Starter Ecosystem.

These are G-phases. They are additive overlays and must not skip core Context Pack phases or pull future implementation forward without explicit scope.

G0 is the docs-only alignment pass. It records the five layers and hard boundaries. G2 adds static public-safe benchmark fixtures only. G3 adds a local deterministic diagnostic benchmark harness only. G4 adds a local deterministic benchmark gate only. G0 through G4 do not complete G6 scaffolding, G11 hashes, G13 signing, G18 starter packs, G20 starter gallery, registry work, Skills, Agent Kits, cloud services, telemetry, or CI enforcement.

## Second PRD Direction

The second PRD keeps Context Packs as the core source-backed knowledge object and adds future data-only objects:

- Skills: non-executable instruction artifacts that tell agents how to work.
- Agent Kits: self-describing, task-ready pairings of Context Packs and Skills that tell agents how a specific bundle should be used for a specific task.
- Export Briefs: generated output artifacts for AI tools or humans.

Contextarr prepares Agent Kits. It does not run them.

Contextarr must also remain useful to agents through deterministic CLI commands without requiring MCP. MCP is optional for live local query, while the planned CLI automation surface includes validation, inspection, export, health, import dry-runs, quarantine review, and agent brief generation as those commands are implemented.

When Agent Kits are implemented later, self-description fields and validation must be part of the Agent Kit schema and validator from the first Agent Kit phase. Do not defer self-description to later polish, and do not move Agent Kits earlier in the roadmap.

## Near-Term

- Expand G5, G10, G14, or G17 design docs only when a prompt explicitly asks for that design phase.
- Keep any G6, G8, G11, G12, G13, G18, G19, G20, or G21 implementation work blocked until its prerequisite design and core phase gates are ready.
- Public feedback on the pack format, validation rules, and export profile ergonomics.
- CLI command contract alignment where current commands still differ from the stable CLI-first plan.
- More fixture coverage for pack health and import edge cases.
- Better screenshots and a short demo video.
- Usability polish around pack authoring.
- Phase 13 and later Skill work only after Context Pack quality gates and explicit scope.

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
