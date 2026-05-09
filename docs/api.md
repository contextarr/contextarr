# Local API Contract

Status: v1 core contract candidate.

The Contextarr API is local-first and served by Fastify. It exposes rebuildable derived state from local files and SQLite. Pack files remain source of truth.

Default bind:

```text
CONTEXTARR_HOST=127.0.0.1
CONTEXTARR_PORT=3210
```

Optional token auth is controlled by `CONTEXTARR_API_TOKEN`. When set, all `/api/*` routes except `GET /api/health` require `Authorization: Bearer <token>` or `X-Contextarr-Token: <token>`.

## Core Context Pack Endpoints

- `GET /api/health`: local status, counts, configured paths, last indexed time, and `authRequired`.
- `GET /api/packs`: pack summaries, validation status, export readiness, health, counts, and UI fields.
- `GET /api/packs/:id`: pack detail with manifest-derived metadata, sources, export profiles, and health.
- `GET /api/packs/:id/records`: record summaries with optional `q`, `tag`, and `type` filters.
- `GET /api/records/:id`: full record body, metadata, source ids, and resolved source summaries.
- `GET /api/packs/:id/health`: deterministic pack health and review items.
- `GET /api/packs/:id/exports/:profileId/preview`: local export preview only; no files are written.
- `GET /api/search?q=`: local search across pack and record data; supports `type=pack`, `record`, `skill`, `agent-kit`, or `all`.
- `POST /api/rescan`: rebuilds the derived index from configured local directories only.

## Review Endpoints

- `GET /api/review-items`
- `POST /api/review-items/:id/status`

Review item status changes are SQLite app state. They must not rewrite pack files.

## Composer Endpoint

- `POST /api/compose/preview`

This creates a temporary local export artifact for preview/copy/download. It does not save a pack and does not call AI services.

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

