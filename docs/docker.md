# Contextarr Docker Preview

The Docker Compose setup is a local public-preview path. It is not a hosted deployment recipe.

## Run

```bash
docker compose build
docker compose up
```

Open `http://127.0.0.1:3210`.

If `3210` is already in use, override only the host port:

```bash
CONTEXTARR_DOCKER_PORT=33210 docker compose up
```

PowerShell:

```powershell
$env:CONTEXTARR_DOCKER_PORT="33210"; docker compose up
```

Then open `http://127.0.0.1:33210`. The container still runs Contextarr on internal port `3210`.

## Service Defaults

The Compose service runs one container:

- Fastify API on `0.0.0.0:3210`.
- Built Vite web app served by the same Fastify process.
- `./demo-packs` mounted read-only at `/app/demo-packs`.
- SQLite stored in the `contextarr-data` Docker volume at `/app/data/contextarr.db`.
- Optional host port override through `CONTEXTARR_DOCKER_PORT`.

Container defaults:

```text
CONTEXTARR_HOST=0.0.0.0
CONTEXTARR_PORT=3210
CONTEXTARR_PACKS_DIR=/app/demo-packs
CONTEXTARR_DATABASE_PATH=/app/data/contextarr.db
CONTEXTARR_WEB_DIST_DIR=/app/apps/web/dist
CONTEXTARR_API_TOKEN=local-preview-token
VITE_CONTEXTARR_API_TOKEN=local-preview-token
```

`CONTEXTARR_WEB_DIST_DIR` is what enables same-origin web serving in Docker. When it is unset, the server stays API-only for normal local development.

## Token Auth

Docker quickstart uses a local preview token because the container binds internally to `0.0.0.0`. The same token is passed into the web build as `VITE_CONTEXTARR_API_TOKEN` so the same-origin dashboard can call protected API routes.

Do not reuse `local-preview-token` outside local preview. Any non-loopback bind requires an explicit `CONTEXTARR_API_TOKEN`.

## Stop

```bash
docker compose down
```

This stops containers and keeps the named SQLite volume. Use Docker's own volume tooling if you intentionally want to delete derived local state.
