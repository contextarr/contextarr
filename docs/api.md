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
- `POST /api/compose/save-pack`

`POST /api/compose/preview` creates a temporary local export artifact for preview/copy/download. It does not save a pack and does not call AI services.

`POST /api/compose/save-pack` writes a private, unreviewed draft Context Pack under `CONTEXTARR_COMPOSED_PACKS_DIR`, defaulting to ignored `composed-packs/`. It accepts selected approved `public_safe` records only, applies source pack redaction rules to persisted drafts, validates the generated pack before returning success, does not index the draft automatically, and never accepts an output path from the browser.

## Context Pack Collector Endpoints

- `GET /api/context-pack-collectors`: lists local draft Context Pack collector definitions.
- `POST /api/context-pack-collectors/:id/preview`: previews draft output for a collector without writing files.
- `POST /api/context-pack-collectors/:id/run`: writes a private draft Context Pack under `CONTEXTARR_DRAFT_PACKS_DIR`, defaulting to ignored `draft-packs/`.

Collector endpoints never accept an output path from the browser. Draft packs remain unindexed, unreviewed, private, and excluded from exports by default until they pass Draft Review gates. Error responses must not expose submitted local input paths.

## Context Pack Draft Review Endpoints

- `GET /api/context-pack-drafts`: inventories draft Context Packs from `CONTEXTARR_DRAFT_PACKS_DIR`, `CONTEXTARR_IMPORTED_PACKS_DIR`, and `CONTEXTARR_COMPOSED_PACKS_DIR`.
- `GET /api/context-pack-drafts/:id`: returns draft detail, record metadata, validation issues, scanner findings, and activation gates.
- `POST /api/context-pack-drafts/:id/validate`: reruns the read-only draft detail validation/scanner view.
- `POST /api/context-pack-drafts/:id/activate`: copies a passing draft into `CONTEXTARR_PACKS_DIR/<pack-id>/` for review.

Activation never overwrites active packs, never accepts arbitrary output paths, never approves records, never changes privacy, never removes `never_export` or `imported_draft` tags, and does not rebuild the index automatically. Activation is not approval and is not export or MCP exposure.

## Context Pack Approval Endpoints

- `GET /api/packs/:packId/review-status`: returns active pack validation/scanner gate state, per-record review metadata, content hashes, and promotion eligibility.
- `POST /api/packs/:packId/records/:recordId/review-status`: promotes an active record to `approved`, `needs_review`, or `rejected` by updating record frontmatter.

Approval is a separate human action after activation. The promotion endpoint requires a matching record content hash, validates and scans the active pack before and after writing, updates only `review_status` and `last_reviewed`, rebuilds the derived index after success, and restores the original file if the post-write gates fail.

Approval does not change record body text, privacy, tags, source ids, manifests, export profiles, or rules. It does not remove `never_export` or `imported_draft`, does not create exports, and does not expose a record through MCP by itself.

`POST /api/packs/:packId/records/:recordId/review-status` accepts:

```json
{
  "reviewStatus": "approved",
  "expectedHash": "64 character sha256 hex content hash",
  "reviewedAt": "2026-05-09"
}
```

Controlled responses:

- `400` invalid body or failed validation/scanner gates.
- `401` missing API token when token auth is enabled.
- `404` unknown pack or record.
- `409` content hash mismatch.

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
