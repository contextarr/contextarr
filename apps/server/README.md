# Contextarr Server

Local Fastify API server and rebuildable SQLite index for Contextarr packs.

Implemented through Phase 3.1:

- load and validate local pack folders
- rebuild SQLite derived index from pack files
- expose pack, record, health, search, and rescan API endpoints
- return UI-ready pack summary fields for cover metadata and review queue counts
- harden search against punctuation-heavy UI input
- support optional local API token auth via `CONTEXTARR_API_TOKEN`

Run locally:

```bash
pnpm --filter @contextarr/server dev
```

Rebuild the derived index:

```bash
pnpm --filter @contextarr/server rescan
```

The server binds to `127.0.0.1` by default and does not mutate pack files.

When `CONTEXTARR_API_TOKEN` is set, protected API routes require either:

- `Authorization: Bearer <token>`
- `X-Contextarr-Token: <token>`

`GET /api/health` remains unauthenticated and reports whether auth is required.
