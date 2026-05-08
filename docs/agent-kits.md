# Contextarr Agent Kits

Agent Kits are Contextarr objects for pairing reusable instructions with source-backed context. Phase 24 supports schemas, validation, public-safe demo Agent Kits, read-only SQLite indexing/search, a local Composer save flow, Library/detail/health surfaces, and profile-driven export generation.

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
- `GET /api/agent-kits/:id/health`
- `POST /api/agent-kits`

`POST /api/agent-kits` accepts metadata plus selected Context Pack IDs and Skill IDs. It does not accept a filesystem path. The server writes a data-only Agent Kit inside the configured local Agent Kit directory, validates it before indexing, and then refreshes the derived SQLite index.

The preview route returns a generated local export artifact plus selected relationship summaries. It is read-only and does not execute Skills, run Agent Kits, fetch URLs, call AI APIs, or write generated files.

## Phase 23: Library, Detail, and Health

Phase 23 adds read-only Agent Kit Library and detail surfaces and local-only health/review material.

- Library and detail are derived views of local Agent Kit files and SQLite state.
- Health checks are deterministic and persisted as local status rows.
- No Agent Kit runner, evaluator, or execution endpoint is added.
- Agent Kit health/detail exports stay read-only and do not modify source files.

## Source Of Truth

Agent Kit source files are local, inspectable, and versionable. Generated Export Briefs, previews, search indexes, and MCP responses remain derived artifacts.

## Boundaries

## Phase 24: Export Engine

Phase 24 builds deterministic Agent Kit export previews by merging profile-selected Context Pack records and Skill documents. Export generation strips local source paths, excludes secret and `never_export` content, preserves profile order, and exposes copy/download in the browser without server-side generated-file writes.

Phase 24 does not implement MCP Agent Kit tools, registry behavior, marketplace behavior, cloud behavior, telemetry, arbitrary path writes, or execution behavior.
