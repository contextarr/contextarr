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
- expose read-only Composer preview API endpoint
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

`POST /api/compose/preview` builds a temporary export artifact from selected pack records. It reuses local pack validation, redaction rules, and the shared export engine. It does not write composed packs or mutate source pack files.

When `CONTEXTARR_API_TOKEN` is set, protected API routes require either:

- `Authorization: Bearer <token>`
- `X-Contextarr-Token: <token>`

`GET /api/health` remains unauthenticated and reports whether auth is required.
