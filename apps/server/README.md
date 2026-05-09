# Contextarr Server

Local Fastify API server and rebuildable SQLite index for Contextarr packs and non-executable Skills.

Implemented through Phase 17:

- load and validate local pack folders
- load and validate local Skill folders
- rebuild SQLite derived index from pack files
- rebuild Skill index data from local Skill files
- expose pack, record, Skill, health, search, and rescan API endpoints
- return UI-ready pack summary fields for cover metadata and review queue counts
- return UI-ready Skill summary fields for targets, inputs, outputs, health, and review queue counts
- harden search against punctuation-heavy UI input
- support optional local API token auth via `CONTEXTARR_API_TOKEN`
- calculate deterministic Pack Health v0
- calculate deterministic Skill Health v0
- persist review item statuses in SQLite without mutating pack files
- expose Review Queue, pack health, and Skill health API endpoints
- expose local export preview API endpoints
- expose Composer preview and Context Pack save-as-draft-pack API endpoints
- expose Context Pack draft inventory, validation, and activation-for-review API endpoints
- expose read-only Context Pack exposure readiness reporting
- optionally serve the built web dashboard from `CONTEXTARR_WEB_DIST_DIR`

Run locally:

```bash
pnpm --filter @contextarr/server dev
```

Rebuild the derived index:

```bash
pnpm --filter @contextarr/server rescan
```

The server binds to `127.0.0.1` by default and does not mutate pack or Skill files.

Docker Compose sets `CONTEXTARR_HOST=0.0.0.0` and `CONTEXTARR_WEB_DIST_DIR=/app/apps/web/dist` so the built web app and `/api/*` routes are served from `http://127.0.0.1:3210`.

Export previews are generated from validated local pack files. The server does not write generated export files, fetch source URLs, call AI APIs, or upload data.

Skill Health review items cover validation, safety rules, disallowed pattern scans, examples, sources, review status, freshness, target compatibility, and export readiness. Review status actions remain SQLite-only local app state.

`POST /api/compose/preview` builds a temporary export artifact from selected pack records. It reuses local pack validation, redaction rules, and the shared export engine.

`POST /api/compose/save-pack` writes selected approved `public_safe` records to a private unreviewed draft Context Pack under `CONTEXTARR_COMPOSED_PACKS_DIR`, defaulting to ignored `composed-packs/`. It applies source pack redaction rules to persisted drafts, validates before success, returns no local filesystem path, does not index drafts automatically, and does not mutate source pack files.

`GET /api/context-pack-drafts` inventories draft Context Packs from collector, importer, and composed draft roots. `POST /api/context-pack-drafts/:id/activate` copies a passing draft into the active packs root for review only. Activation is not approval: it does not rewrite metadata, rebuild the index automatically, expose exports, or expose MCP.

`GET /api/packs/:packId/review-status` returns active-pack validation/scanner status plus per-record content hashes and promotion gates. `POST /api/packs/:packId/records/:recordId/review-status` can promote a record to `approved`, `needs_review`, or `rejected` by updating only `review_status` and `last_reviewed` after a matching content hash, validation, and scanner checks. Approval is explicit; it does not change privacy, remove `never_export`, expose exports, expose MCP, or run pack content.

`GET /api/packs/:packId/exposure-readiness` reports active-pack export/MCP eligibility from validation, scanner, export profile readiness, and indexed record metadata. It is read-only: it does not mutate files, approve records, remove tags, create exports, expose MCP content, or return local absolute paths.

When `CONTEXTARR_API_TOKEN` is set, protected API routes require either:

- `Authorization: Bearer <token>`
- `X-Contextarr-Token: <token>`

`GET /api/health` remains unauthenticated and reports whether auth is required.
