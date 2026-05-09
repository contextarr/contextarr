# SQLite Index Contract

Status: v1 core contract candidate.

SQLite is derived state. Context Pack folders are source of truth.

Default database path:

```text
CONTEXTARR_DATABASE_PATH=./data/contextarr.db
```

A user must be able to delete SQLite and rebuild equivalent derived index state from local files.

## Core Tables

Context Pack core tables:

- `packs`
- `records`
- `sources`
- `export_profiles`
- `pack_health`
- `review_items`
- `events`
- `settings`
- `records_fts`

Research Delta fields are stored in derived tables, including:

- validation status
- export readiness
- redaction warning counts
- stale-source counts
- license warning/missing/unknown/risk counts
- source license status
- source hash metadata
- source stale metadata

## Advanced Preview Tables

The current repo also has Skills, Agent Kits, and MCP metadata tables. They are completed advanced-preview work and remain frozen behind the v1 bridge gate:

- `skills`
- `skill_instructions`
- `skill_examples`
- `skill_sources`
- `skill_export_profiles`
- `agent_kits`
- `agent_kit_context_packs`
- `agent_kit_skills`
- `agent_kit_export_profiles`
- `mcp_query_log`

Do not add registry tables while Phase 29 is blocked.

## Rebuild Behavior

`pnpm --filter @contextarr/server rescan` rebuilds derived state from configured local directories.

The v1 clean-rescan gate expects:

- 5 demo packs indexed.
- 25 records indexed.
- 25 sources indexed.
- 40 Context Pack export profiles indexed.
- 0 skipped Context Packs.
- 0 skipped Skills.
- 0 skipped Agent Kits.
- 0 review items caused by verifier smoke artifacts.

Mutable local app state, such as review item statuses, may be stored in SQLite. Pack content must not depend on hidden database-only records.

## Search

`records_fts` is the SQLite FTS5 table for record title/body/tag search.

Search must remain local, deterministic, and safe for punctuation-heavy user input.

## Boundaries

SQLite must not become:

- source of truth for pack content
- hidden pack storage
- telemetry storage
- marketplace cache
- registry storage before Phase 29 is explicitly approved

