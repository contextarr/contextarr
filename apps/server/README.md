# Contextarr Server

Local Fastify API server and rebuildable SQLite index for Contextarr packs.

Implemented through Phase 7:

- load and validate local pack folders
- rebuild SQLite derived index from pack files
- expose pack, record, health, search, and rescan API endpoints
- return UI-ready pack summary fields for cover metadata and review queue counts
- harden search against punctuation-heavy UI input
- support optional local API token auth via `CONTEXTARR_API_TOKEN`
- calculate deterministic Pack Health v0
- persist review item statuses in SQLite without mutating pack files
- expose Review Queue and pack health API endpoints
- expose local export preview API endpoints

Run locally:

```bash
pnpm --filter @contextarr/server dev
```

Rebuild the derived index:

```bash
pnpm --filter @contextarr/server rescan
```

The server binds to `127.0.0.1` by default and does not mutate pack files.

Export previews are generated from validated local pack files. The server does not write generated export files, fetch source URLs, call AI APIs, or upload data.

When `CONTEXTARR_API_TOKEN` is set, protected API routes require either:

- `Authorization: Bearer <token>`
- `X-Contextarr-Token: <token>`

`GET /api/health` remains unauthenticated and reports whether auth is required.
