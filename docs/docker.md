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
CONTEXTARR_SKILLS_DIR=/app/demo-skills
CONTEXTARR_DATABASE_PATH=/app/data/contextarr.db
CONTEXTARR_WEB_DIST_DIR=/app/apps/web/dist
CONTEXTARR_API_TOKEN=
```

`CONTEXTARR_WEB_DIST_DIR` is what enables same-origin web serving in Docker. When it is unset, the server stays API-only for normal local development.

## Token Auth

Docker quickstart leaves `CONTEXTARR_API_TOKEN` empty because the browser app has no token-entry UI. If you enable token auth in Docker, the web build must be configured to send that token through `VITE_CONTEXTARR_API_TOKEN`, which is not the default public-preview path.

## Stop

```bash
docker compose down
```

This stops containers and keeps the named SQLite volume. Use Docker's own volume tooling if you intentionally want to delete derived local state.
