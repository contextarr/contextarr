# Local API Contract

Status: v1 core contract candidate.

The Contextarr API is local-first and served by Fastify. It exposes rebuildable derived state from local files and SQLite. Pack files remain source of truth.

Default bind:

```text
CONTEXTARR_HOST=127.0.0.1
CONTEXTARR_PORT=3210
```

Optional token auth is controlled by `CONTEXTARR_API_TOKEN` for loopback local development. Non-loopback binds such as `0.0.0.0`, `::`, or LAN hostnames require `CONTEXTARR_API_TOKEN` at startup. When set, all `/api/*` routes except `GET /api/health` require `Authorization: Bearer <token>` or `X-Contextarr-Token: <token>`.

## Core Context Pack Endpoints

- `GET /api/health`: unauthenticated, path-redacted local status, aggregate counts, last indexed time, and `authRequired`.
- `GET /api/packs`: pack summaries, validation status, export readiness, health, counts, and UI fields.
- `GET /api/packs/:id`: pack detail with manifest-derived metadata, sources, export profiles, and health.
- `GET /api/packs/:id/records`: record summaries with optional `q`, `tag`, and `type` filters.
- `GET /api/records/:id`: full record body, metadata, source ids, and resolved source summaries.
- `GET /api/packs/:id/health`: deterministic pack health and review items.
- `GET /api/packs/:id/exposure-readiness`: read-only eligibility report for default export and read-only MCP exposure.
- `GET /api/packs/:id/readiness`: read-only Context Readiness report composed from health, exposure, review, governance presence, redaction, export, and MCP metadata.
- `GET /api/packs/:id/exports/:profileId/preview`: local export preview only; no files are written.
- `POST /api/export-briefs`: explicitly saves metadata for a generated export preview artifact.
- `GET /api/export-briefs`: lists saved export brief metadata from local SQLite.
- `GET /api/export-briefs/:id`: fetches one saved export brief.
- `GET /api/search?q=`: local search across pack and record data; supports `type=pack`, `record`, `skill`, `agent-kit`, or `all`.
- `POST /api/rescan`: rebuilds the derived index from configured local directories only.

## Review Endpoints

- `GET /api/review-items`
- `POST /api/review-items/:id/status`
- `GET /api/review-candidates`
- `GET /api/review-candidates/:key`
- `GET /api/review-candidates/:key/activation-plan`
- `POST /api/review-candidates/:key/activation/dry-run`
- `POST /api/review-candidates/:key/activation/apply`
- `GET /api/review-candidate-activations`

Review item status changes are SQLite app state. They must not rewrite pack files.

Draft Intake candidate endpoints scan configured local candidate roots for untrusted Context Pack folders. The default roots are `CONTEXTARR_DRAFT_PACKS_DIR` and `CONTEXTARR_COMPOSED_PACKS_DIR`; optional restored/imported quarantine roots can be added with `CONTEXTARR_REVIEW_CANDIDATE_DIRS` using the platform path delimiter. Responses include validation summaries, scanner summaries, duplicate-active-pack warnings, counts, source kind, candidate status, sanitized path labels, and metadata-only record/source/export summaries. The activation-plan endpoint adds a deterministic readiness checklist, blockers, warnings, target active-pack path label, next steps, and no-mutation boundaries. The dry-run endpoint returns an activation proof bundle with proof ID, generated time, validation/security status, blockers, warnings, target path label, manual actions, and false effect flags for file moves, SQLite mutation, export generation, MCP exposure, and network access. The apply endpoint requires the current dry-run proof ID, rejects changed or blocked candidates, moves or copies the candidate into the configured active packs root, records a local activation-history row, refreshes the local index, and returns only path-redacted activation metadata. `GET /api/review-candidate-activations` lists recent local activation evidence with optional `limit`, `packId`, and `candidateKey` filters. Draft Intake endpoints do not return record bodies or absolute local paths, and activation does not export, publish, perform network access, or expose candidates through MCP.

## Exposure Readiness

`GET /api/packs/:id/exposure-readiness` reports why an active Context Pack is or is not ready for default export and read-only MCP exposure. It combines current validation status, scanner status, review state, privacy flags, redaction and export profile readiness, and source coverage into a metadata-only report.

The endpoint is read-only. It does not approve packs, mutate SQLite state, change export behavior, widen MCP visibility, return record bodies, or expose absolute local paths.

## Context Readiness

`GET /api/packs/:id/readiness` returns a `contextarr.readiness-report.v1` report for one active Context Pack. The report includes `packId`, `status`, `score`, `dimensions`, `issues`, and `generatedAt`.

Statuses are `ready`, `review_needed`, and `blocked`. Dimensions are `source`, `review`, `governance`, `redaction`, `export`, and `mcp`. Issues include `code`, `severity`, `message`, and metadata-only `evidence`.

This slice is read-only. It does not mutate pack files, write readiness events, recalculate the index, generate exports, call AI or external services, execute pack content, upload telemetry, or widen MCP access. Governance is presence-only here; missing `rules/governance.yaml` is reported as a warning, not enforced.

## Local Observability

- `GET /api/events?limit=25`
- `GET /api/mcp/query-log?limit=25`

These endpoints expose bounded local observability metadata from SQLite. They are protected by the same optional API token rule as other non-health `/api/*` routes. `limit` must be an integer from 1 to 100.

`GET /api/events` returns newest-first local event rows with `id`, `type`, `message`, `createdAt`, and sanitized metadata when available.

`GET /api/mcp/query-log` returns newest-first local MCP query metadata with `tool`, `packId`, `recordId`, `profileId`, `status`, `resultCount`, `queryHash`, `queryLength`, `durationMs`, `createdAt`, and sanitized metadata when available.

Local Observability is not telemetry. These routes do not upload data, call external services, mutate event or MCP log tables, run agents, generate exports, or widen MCP access. Responses do not expose raw query text, returned context bodies, export bodies, raw private source dumps, secrets, or absolute local paths.

## Saved Export Briefs

- `POST /api/export-briefs`
- `GET /api/export-briefs`
- `GET /api/export-briefs/:id`

Saved Export Briefs are explicit local SQLite records created from an export preview artifact. `POST /api/export-briefs` accepts `{ objectType, objectId?, privacyMode?, artifact }`, where `objectType` is `pack`, `skill`, `agent_kit`, or `composed`; `artifact` is the generated preview artifact; and `objectId` defaults to the artifact object ID. The server computes the SHA-256 content hash, byte length, counts, warning codes, and save timestamp.

The save route accepts only `redacted` or `public_safe` privacy modes. It rejects unsafe modes such as `private`, `sensitive`, `secret`, and `never_export`. It stores a bounded content snapshot only when the artifact is safe for snapshotting and never stores unbounded export bodies.

Export preview routes remain stateless. Saved Export Briefs are not exposed through MCP and do not add deletion, sync, sharing, registry, publish, external calls, telemetry, or execution behavior.

## Planned Context Readiness And Local Observability

The Agentic AI Context Readiness and Local Observability PRD is accepted as a planning addition. Current implemented slices are the read-only per-pack Context Readiness route and bounded metadata-only Local Observability reads.

Later scoped phases may add:

- `POST /api/packs/:id/readiness/recalculate`
- `GET /api/readiness`
- `GET /api/exports/history`
- `GET /api/governance/:packId`
- `GET /api/token-budget/:packId`

These future routes must remain local-first, auth-protected with the same API rules, metadata-first, and non-executing. They must not upload telemetry, call external services, expose raw private bodies, mutate pack files, run agents, or widen MCP access.

## Composer Endpoint

- `POST /api/compose/preview`
- `POST /api/compose/save-pack`

`POST /api/compose/preview` creates a temporary local export artifact for preview/copy/download. It does not save a pack and does not call AI services.

`POST /api/compose/save-pack` writes a private, unreviewed draft Context Pack under `CONTEXTARR_COMPOSED_PACKS_DIR`, defaulting to ignored `composed-packs/`. It accepts selected approved `public_safe` records only, applies source pack redaction rules to persisted drafts, validates the generated pack before returning success, does not index the draft automatically, and never accepts an output path from the browser.

## Context Pack Collector Endpoints

- `GET /api/context-pack-collectors`: lists local draft Context Pack collector definitions.
- `POST /api/context-pack-collectors/:id/preview`: previews draft output for a collector without writing files.
- `POST /api/context-pack-collectors/:id/run`: writes a private draft Context Pack under `CONTEXTARR_DRAFT_PACKS_DIR`, defaulting to ignored `draft-packs/`.

Collector endpoints never accept an output path from the browser. Draft packs remain unindexed, unreviewed, private, and excluded from exports by default until a later review/activation workflow exists. Error responses must not expose submitted local input paths.

## Advanced Preview Endpoints

The current repository includes completed advanced-preview Skills and Agent Kit surfaces. They are frozen behind the v1 bridge gate and are not the Context Pack v1 core expansion target.

Existing advanced-preview routes include:

- `GET /api/skills`
- `GET /api/skills/:id`
- `GET /api/skills/:id/instructions`
- `GET /api/skills/:id/examples`
- `GET /api/skills/:id/exports`
- `GET /api/skills/:id/health`
- `GET /api/skills/:id/exports/:profileId/preview`
- `POST /api/import-skills/preview`
- `POST /api/import-skills`
- `GET /api/agent-kits`
- `GET /api/agent-kits/:id`
- `GET /api/agent-kits/:id/context-packs`
- `GET /api/agent-kits/:id/skills`
- `GET /api/agent-kits/:id/exports`
- `GET /api/agent-kits/:id/health`
- `GET /api/agent-kits/:id/exports/:profileId/preview`
- `POST /api/agent-kits`
- `GET /api/agent-kit-templates`
- `GET /api/agent-kit-templates/:id`
- `POST /api/agent-kit-templates/:id/create`

Do not add Phase 29 registry endpoints while the v1 core gate is active.

## Error Defaults

Expected controlled errors:

- `400` for invalid request bodies.
- `401` for missing or wrong token when auth is enabled.
- `404` for unknown packs, records, profiles, Skills, or Agent Kits.
- `409` for duplicate local write targets.

API responses must not expose local filesystem paths unless explicitly intended for local diagnostics.
