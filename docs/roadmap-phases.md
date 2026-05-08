# Contextarr Roadmap Phases

## Phase 0: Repo Initialization and Decision Records

- Create repo skeleton.
- Add package manager setup.
- Add documentation.
- Add Git initialization.
- Add security and non-goal guardrails.
- Do not implement application functionality.

## Phase 1: Pack Schema and Validator

- Define Zod schemas.
- Implement validator.
- Add CLI validation command.
- Add fake fixture tests.

## Phase 2: Demo Packs

- Create fake public-safe demo packs.
- Include manifests, records, source maps, exports, rules, and docs.
- Validate all demo packs.

## Phase 3: Local Index and API

- Load pack folders.
- Build SQLite derived index.
- Add local API endpoints.
- Add search and rescan.

## Phase 4: Web UI Shell and Library

- Build local dashboard shell.
- Add pack library views.

## Phase 5: Renderer and Static HTML

- Add pack detail basics.
- Add record detail basics.
- Render pack and record pages.
- Sanitize Markdown and HTML.
- Generate static output.

## Phase 6: Pack Health and Review Queue

- Calculate deterministic pack health.
- Generate review items.
- Add review queue UI.
- Store review item statuses in local SQLite only.
- Keep pack files immutable during review actions.

## Phase 7: Export Engine

- Parse export profiles.
- Build redacted exports.
- Support ChatGPT, Claude, Codex, generic Markdown, and JSON records.
- Add CLI export, local API preview, and web copy/download flows.

## Phase 8: Read-Only MCP

- Add local read-only stdio MCP server.
- Expose `list_packs`, `get_pack_summary`, `query_pack_context`, `get_record`, `list_export_profiles`, and `build_export_preview`.
- Add client setup docs.

## Phase 9: Importers

- Add local folder import.
- Add Markdown and Obsidian import.
- Add basic ChatGPT and Claude export parsing.
- Create draft records only.
- Keep importers CLI/core only; web and API import workflows remain later.

## Phase 10: Composer

- Implemented in Phase 10.
- Select packs and records.
- Filter by tags and metadata.
- Build temporary custom exports through the export engine.
- Preview, copy, and browser-download only.
- Save composed packs later.

## Phase 11: Launch Prep

- Implemented in Phase 11.
- Stabilize Docker Compose.
- Polish README and docs.
- Add screenshots placeholder.
- Write demo script.
- Verify validator, UI, exports, and MCP docs before release.
- Stop before publishing, tagging, deploying, or creating a GitHub release.
