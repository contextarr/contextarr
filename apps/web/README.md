# Contextarr Web App

React and Vite local dashboard for Contextarr.

Implemented in Phase 4:

- dark-first app shell
- local API-backed Pack Library
- Cover Grid, Compact Cards, and Dense Table library views
- read-only search, sort, and filter controls
- optional `VITE_CONTEXTARR_API_TOKEN` support for protected local APIs

Run locally:

```bash
pnpm --filter @contextarr/web dev
```

The Vite dev server proxies `/api` to `http://127.0.0.1:3210` by default.
