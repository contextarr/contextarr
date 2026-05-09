# Implementation Priorities

## Purpose

This document defines the build order for nullifying criticism without scope creep. It is an overlay on the phase roadmap, not a replacement for the PRD.

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating any item as shipped.

## Immediate

- README positioning.
- Demo proof path.
- Demo packs.
- Validation report v1.
- Export targets.
- Pack Health scorecard.
- Review Queue principles.
- Local import quarantine.
- Registry trust foundation docs.
- MCP safety model docs.
- CLI-first agent interface docs.
- CLI command contract and agent mode docs.

## Next

- Markdown folder importer.
- Obsidian importer.
- ChatGPT export importer.
- Claude export importer.
- Composer.
- Export history and diff.
- Pack Doctor.
- Security scanner v0.
- Local zip import with quarantine.
- Backup and restore.

## Later

- Skills schema.
- Skill validator.
- Demo Skills.
- Agent Kit schema.
- Agent Kit Composer.
- Official pack gallery.
- Verified registry prototype.
- Private team registry.
- Paid Studio.

## Rejected

- Public marketplace now.
- Hosted vault.
- Executable packs.
- Executable Skills.
- Agent runner.
- CLI agent runner.
- MCP-only agent access model.
- Cloud sync.
- Direct Gmail connector.
- Direct bank/brokerage connector.
- Passive capture.
- Generic chatbot UI.
- Deep AST code indexer.
- Telemetry.

## Phase Placement Summary

- Phase 0A: positioning, comparisons, product-defense docs, CLI-first agent interface docs, and AGENTS.md guardrails.
- Phase 1: schema and deterministic validator.
- Phase 2: demo packs and starter export profiles.
- Phase 3: local index and API, with SQLite derived and rebuildable.
- Phase 3A: registry trust foundation docs only.
- Phase 4: dashboard shell and Library.
- Phase 5: Pack Detail and record rendering.
- Phase 6: static renderer.
- Phase 7: Pack Health and Review Queue.
- Phase 8: export engine.
- Phase 9: read-only MCP, with CLI remaining fully useful without MCP.
- Phase 10: importers, import dry-runs, and quarantine planning.
- Phase 11: Composer and future CLI compose.
- Post-core: scanner commands, Pack Doctor, backup and restore, official gallery, registry commands, verified registry prototype, private team registry, Skills, and Agent Kits.

## Operating Rule

If a phase is not proving Context Packs, source backing, review, redaction, export quality, safe read-only MCP, or local maintainability, it probably belongs later.
