# Contextarr Server

Local Fastify API server and rebuildable SQLite index for Contextarr packs and non-executable Skills.

Implemented in the current checkout:

- load and validate local pack folders
- load and validate local Skill folders
- rebuild SQLite derived index from pack files
- rebuild Skill index data from local Skill files
- expose pack, record, Skill, health, search, and rescan API endpoints
- return UI-ready pack summary fields for cover metadata and review queue counts
- return UI-ready Skill summary fields for targets, inputs, outputs, health, and review queue counts
- harden search against punctuation-heavy UI input
- support optional loopback local API token auth via `CONTEXTARR_API_TOKEN`
- calculate deterministic Pack Health v0
- calculate read-only Exposure Readiness for active Context Packs
- calculate deterministic Skill Health v0
- persist review item statuses in SQLite without mutating pack files
- expose Review Queue, pack health, and Skill health API endpoints
- expose read-only Draft Intake candidate endpoints for untrusted Context Pack folders
- expose local export preview API endpoints
- expose Composer preview and Context Pack save-as-draft-pack API endpoints
- optionally serve the built web dashboard from `CONTEXTARR_WEB_DIST_DIR`

Run locally:

```bash
pnpm --filter @contextarr/server dev
```

Rebuild the derived index:

```bash
pnpm --filter @contextarr/server rescan
```

The server binds to `127.0.0.1` by default and does not mutate pack or Skill files. Non-loopback binds require `CONTEXTARR_API_TOKEN`.

Docker Compose sets `CONTEXTARR_HOST=0.0.0.0`, a fake local-preview token, and `CONTEXTARR_WEB_DIST_DIR=/app/apps/web/dist` so the built web app and `/api/*` routes are served from `http://127.0.0.1:3210`.

Export previews are generated from validated local pack files. The server does not write generated export files, fetch source URLs, call AI APIs, or upload data.

`GET /api/packs/:id/exposure-readiness` is a metadata-only report for default export and read-only MCP eligibility. It combines validation, scanner status, review state, privacy flags, source coverage, and export profile readiness without mutating source files, changing export behavior, approving packs, or returning record bodies.

Skill Health review items cover validation, safety rules, disallowed pattern scans, examples, sources, review status, freshness, target compatibility, and export readiness. Review status actions remain SQLite-only local app state.

`POST /api/compose/preview` builds a temporary export artifact from selected pack records. It reuses local pack validation, redaction rules, and the shared export engine.

`POST /api/compose/save-pack` writes selected approved `public_safe` records to a private unreviewed draft Context Pack under `CONTEXTARR_COMPOSED_PACKS_DIR`, defaulting to ignored `composed-packs/`. It applies source pack redaction rules to persisted drafts, validates before success, returns no local filesystem path, does not index drafts automatically, and does not mutate source pack files.

`GET /api/review-candidates` and `GET /api/review-candidates/:key` list metadata-only draft intake candidates from `CONTEXTARR_DRAFT_PACKS_DIR`, `CONTEXTARR_COMPOSED_PACKS_DIR`, and optional path-delimited `CONTEXTARR_REVIEW_CANDIDATE_DIRS`. They return sanitized labels, validation/scanner summaries, duplicate-active-pack warnings, and record/source/export metadata only. They do not return record bodies, index candidates, activate candidates, export candidates, or expose them through MCP.

When `CONTEXTARR_API_TOKEN` is set, protected API routes require either:

- `Authorization: Bearer <token>`
- `X-Contextarr-Token: <token>`

`GET /api/health` remains unauthenticated and reports path-redacted local status plus whether auth is required.
