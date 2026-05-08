# Contextarr Agent Kits

Agent Kits are Contextarr objects for pairing reusable instructions with source-backed context. Phase 22 supports schemas, validation, public-safe demo Agent Kits, read-only SQLite indexing/search, and a local Composer save flow.

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

The public-safe examples live under `demo-agent-kits/` and remain read-only demo source material. Locally composed Agent Kits are saved under `CONTEXTARR_AGENT_KITS_DIR`, which defaults to ignored `agent-kits/`.

## Read-Only API

Phase 21 and Phase 22 add local API endpoints:

- `GET /api/agent-kits`
- `GET /api/agent-kits/:id`
- `GET /api/agent-kits/:id/context-packs`
- `GET /api/agent-kits/:id/skills`
- `GET /api/agent-kits/:id/exports`
- `GET /api/agent-kits/:id/exports/:profileId/preview`
- `GET /api/search?type=agent-kit&q=`
- `POST /api/agent-kits`

`POST /api/agent-kits` accepts metadata plus selected Context Pack IDs and Skill IDs. It does not accept a filesystem path. The server writes a data-only Agent Kit inside the configured local Agent Kit directory, validates it before indexing, and then refreshes the derived SQLite index.

The preview route returns metadata and selected relationship summaries only until the full Agent Kit export engine lands in Phase 24.

## Source Of Truth

Agent Kit source files are local, inspectable, and versionable. Generated Export Briefs, previews, search indexes, and MCP responses remain derived artifacts.

## Boundaries

Phase 22 implements the Composer save surface and a simple detail view. It does not implement full Agent Kit export content generation, MCP Agent Kit tools, registry behavior, marketplace behavior, cloud behavior, telemetry, arbitrary path writes, or execution behavior.
