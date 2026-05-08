# Contextarr Agent Kits

Agent Kits are future Contextarr objects for pairing reusable instructions with source-backed context. Phase 12 documents the concept only. No schema code is added in Phase 12.

## Definition

An Agent Kit is a task-ready pairing of one or more Skills with one or more Context Packs, plus target tool, export format, redaction rules, and compatibility metadata.

Contextarr prepares Agent Kits. It does not run them.

## Intended Use

Agent Kits are meant to make repeated AI-assisted work safer and more consistent:

- Select the relevant Context Packs.
- Select the relevant Skills.
- Apply privacy and redaction rules.
- Choose a target tool such as ChatGPT, Claude, Codex, Claude Code, Cursor, OpenCode, Open WebUI, AnythingLLM, Hermes, OpenClaw, or a local MCP client.
- Generate an Export Brief for use outside Contextarr.

## Future Data Shape

A future Agent Kit may reference:

- Included Context Packs.
- Included Skills.
- Selected records or instruction files.
- Target and format.
- Export profile.
- Redaction and exclusion rules.
- Health and review metadata.
- Compatibility notes.

The exact schema begins in Phase 19.

## Source Of Truth

Agent Kit source files will be local, inspectable, and versionable. Generated Export Briefs, previews, search indexes, and MCP responses remain derived artifacts.

## Phase 12 Boundary

Phase 12 does not implement Agent Kit schemas, demo Agent Kits, Agent Kit indexing, Agent Kit API endpoints, Agent Kit Composer UI, Agent Kit exports, MCP Agent Kit tools, registry behavior, marketplace behavior, cloud behavior, telemetry, or execution behavior.
