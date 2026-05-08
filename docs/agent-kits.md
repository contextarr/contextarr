# Contextarr Agent Kits

Agent Kits are Contextarr objects for pairing reusable instructions with source-backed context. Phase 21 supports schemas, validation, public-safe demo Agent Kits, read-only SQLite indexing, and read-only local API/search.

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

## Current Data Shape

An Agent Kit references:

- Included Context Packs.
- Included Skills.
- Target tool and default export profile.
- Target-specific export profile YAML files.
- Redaction, validation, and compatibility rules.
- Compatibility notes.

The current source files live under `demo-agent-kits/` for fake public-safe examples. Generated previews, search indexes, and later exports remain derived artifacts.

## Read-Only API

Phase 21 adds local API endpoints:

- `GET /api/agent-kits`
- `GET /api/agent-kits/:id`
- `GET /api/agent-kits/:id/context-packs`
- `GET /api/agent-kits/:id/skills`
- `GET /api/agent-kits/:id/exports`
- `GET /api/agent-kits/:id/exports/:profileId/preview`
- `GET /api/search?type=agent-kit&q=`

The preview route returns metadata and selected relationship summaries only until the full Agent Kit export engine lands in Phase 24.

## Source Of Truth

Agent Kit source files will be local, inspectable, and versionable. Generated Export Briefs, previews, search indexes, and MCP responses remain derived artifacts.

## Boundaries

Phase 21 does not implement Agent Kit UI, full Agent Kit export content generation, MCP Agent Kit tools, registry behavior, marketplace behavior, cloud behavior, telemetry, mutation, or execution behavior.
