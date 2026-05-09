# Contextarr API

Status: early alpha local API. Routes may change while Contextarr is still pre-release.

Check [implementation-status.md](implementation-status.md) before treating API behavior, safety gates, or planned command parity as stable.

## Scope

The API is a local Fastify API used by the dashboard and local integrations. It is not a hosted public API.

Default local settings come from `.env.example`:

- `CONTEXTARR_HOST=127.0.0.1`
- `CONTEXTARR_PORT=3210`
- `CONTEXTARR_PACKS_DIR=./demo-packs`
- `CONTEXTARR_DATABASE_PATH=./data/contextarr.db`
- `CONTEXTARR_API_TOKEN=`

When `CONTEXTARR_API_TOKEN` is set, protected `/api/*` routes require either:

- `Authorization: Bearer <token>`
- `X-Contextarr-Token: <token>`

`GET /api/health` remains unauthenticated and must not expose the token. When token auth is enabled, unauthenticated health returns only minimal status/auth metadata; detailed paths and counts require the configured token.

## Current Routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Local API health. Derived index counts and local paths are returned only when no API token is configured or the request includes the configured token. |
| `GET` | `/api/packs` | List indexed packs. |
| `GET` | `/api/packs/:id` | Get one pack summary. |
| `GET` | `/api/packs/:id/health` | Get deterministic Pack Health data. |
| `GET` | `/api/packs/:id/exports/:profileId/preview` | Build an export preview without writing files. |
| `GET` | `/api/packs/:id/records` | List records for a pack. |
| `GET` | `/api/records/:id` | Get one record. |
| `GET` | `/api/review-items` | List review items from derived state. |
| `POST` | `/api/review-items/:id/status` | Update local SQLite review item status. |
| `GET` | `/api/search?q=` | Search indexed packs and records. |
| `POST` | `/api/rescan` | Rebuild derived local index from pack files. |
| `POST` | `/api/compose/preview` | Build a temporary composed export preview without writing pack files. |

## Safety Notes

- Pack files are the source of truth.
- SQLite is derived local state.
- API preview routes must not upload data, call AI APIs, execute pack content, or fetch hidden network resources.
- Review item status changes are local SQLite app state and do not mutate pack records.
- Composer previews are temporary derived artifacts and do not save new packs in the current implementation.
- Do not expose the local API publicly without explicit authentication and threat review.

See [security-model.md](security-model.md) and [threat-model.md](threat-model.md).
