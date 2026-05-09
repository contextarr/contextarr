# Contextarr Web App

React and Vite local dashboard for Contextarr.

Implemented through Phase 17:

- dark-first app shell
- local API-backed Pack Library
- local API-backed Skill Library
- Cover Grid, Compact Cards, and Dense Table library views
- pack detail and record detail views
- Skill detail views with sanitized instruction and example rendering
- Pack Health and Review Queue pages
- Skill Health and shared Skill review queue filters
- sanitized Markdown record rendering
- read-only search, sort, and filter controls
- SQLite-only review item status actions
- Export Center and pack-level export preview UI
- copy/download for generated local export artifacts
- Composer page for temporary custom exports from selected records
- optional `VITE_CONTEXTARR_API_TOKEN` support for protected local APIs

Run locally:

```bash
pnpm --filter @contextarr/web dev
```

The Vite dev server proxies `/api` to `http://127.0.0.1:3210` by default.

For Docker preview, the Vite build output is served by the Fastify server from the same local origin. Docker uses a fake local-preview API token by default because the server binds to `0.0.0.0` inside the container; the token is baked into the Vite build with `VITE_CONTEXTARR_API_TOKEN`.
