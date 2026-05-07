# Contextarr Web App

React and Vite local dashboard for Contextarr.

Implemented through Phase 6:

- dark-first app shell
- local API-backed Pack Library
- Cover Grid, Compact Cards, and Dense Table library views
- pack detail and record detail views
- Pack Health and Review Queue pages
- sanitized Markdown record rendering
- read-only search, sort, and filter controls
- SQLite-only review item status actions
- optional `VITE_CONTEXTARR_API_TOKEN` support for protected local APIs

Run locally:

```bash
pnpm --filter @contextarr/web dev
```

The Vite dev server proxies `/api` to `http://127.0.0.1:3210` by default.
