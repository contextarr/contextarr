# Contextarr Server

Local Fastify API server and rebuildable SQLite index for Contextarr packs.

Implemented through Phase 11:

- load and validate local pack folders
- rebuild SQLite derived index from pack files
- expose pack, record, health, search, and rescan API endpoints
- return UI-ready pack summary fields for cover metadata and review queue counts
- harden search against punctuation-heavy UI input
- support optional loopback API token auth and required non-loopback API token auth via `CONTEXTARR_API_TOKEN`
- calculate deterministic Pack Health v0
- persist review item statuses in SQLite without mutating pack files
- expose Review Queue and pack health API endpoints
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

The server binds to `127.0.0.1` by default and does not mutate pack files.

Docker Compose sets `CONTEXTARR_HOST=0.0.0.0`, `CONTEXTARR_WEB_DIST_DIR=/app/apps/web/dist`, and a local preview token so the built web app and `/api/*` routes are served from `http://127.0.0.1:3210`.

Export previews are generated from validated local pack files. The server does not write generated export files, fetch source URLs, call AI APIs, or upload data.

`POST /api/compose/preview` builds a temporary export artifact from selected pack records. It reuses local pack validation, redaction rules, and the shared export engine. It does not write composed packs or mutate source pack files.

When `CONTEXTARR_API_TOKEN` is set, protected API routes require either:

- `Authorization: Bearer <token>`
- `X-Contextarr-Token: <token>`

`GET /api/health` remains unauthenticated and reports whether auth is required. When token auth is enabled, detailed paths and counts are returned only when the request includes the configured token.

The server refuses non-loopback binds such as `0.0.0.0` unless `CONTEXTARR_API_TOKEN` is set.
