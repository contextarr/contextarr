# Contextarr Docker Preview

The Docker Compose setup is a local public-preview path. It is not a hosted deployment recipe.

## Run

```bash
docker compose build
docker compose up
```

Open `http://127.0.0.1:3210`.

The local preview uses a fake default token because the container binds Fastify to `0.0.0.0` internally. The host port is still mapped to `127.0.0.1` by default. Override the preview token with `CONTEXTARR_DOCKER_API_TOKEN` when you need a different local value.

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
- `./demo-skills` mounted read-only at `/app/demo-skills`.
- `./demo-agent-kits` mounted read-only at `/app/demo-agent-kits`.
- `./agent-kits` mounted at `/app/agent-kits` for local Agent Kit Composer saves.
- `./composed-packs` mounted at `/app/composed-packs` for Context Pack Composer draft saves.
- SQLite stored in the `contextarr-data` Docker volume at `/app/data/contextarr.db`.
- Optional host port override through `CONTEXTARR_DOCKER_PORT`.

Container defaults:

```text
CONTEXTARR_HOST=0.0.0.0
CONTEXTARR_PORT=3210
CONTEXTARR_PACKS_DIR=/app/demo-packs
CONTEXTARR_SKILLS_DIR=/app/demo-skills
CONTEXTARR_DEMO_AGENT_KITS_DIR=/app/demo-agent-kits
CONTEXTARR_AGENT_KITS_DIR=/app/agent-kits
CONTEXTARR_COMPOSED_PACKS_DIR=/app/composed-packs
CONTEXTARR_DATABASE_PATH=/app/data/contextarr.db
CONTEXTARR_WEB_DIST_DIR=/app/apps/web/dist
CONTEXTARR_API_TOKEN=contextarr-local-preview-token
VITE_CONTEXTARR_API_TOKEN=contextarr-local-preview-token
```

`CONTEXTARR_WEB_DIST_DIR` is what enables same-origin web serving in Docker. When it is unset, the server stays API-only for normal local development.

## Token Auth

Docker quickstart sets a fake local-preview token by default because non-loopback server binds fail closed without `CONTEXTARR_API_TOKEN`. The Compose file also passes the same value to the Vite build through `VITE_CONTEXTARR_API_TOKEN` so the browser dashboard can call protected local API routes. Treat this Docker token as local wiring, not a secret: anything passed through `VITE_CONTEXTARR_API_TOKEN` is visible to the browser bundle and image metadata.

To use a different token for a local Docker smoke:

```bash
CONTEXTARR_DOCKER_API_TOKEN=replace-with-local-token docker compose build
CONTEXTARR_DOCKER_API_TOKEN=replace-with-local-token docker compose up
```

PowerShell:

```powershell
$env:CONTEXTARR_DOCKER_API_TOKEN="replace-with-local-token"; docker compose build; docker compose up
```

## Stop

```bash
docker compose down
```

This stops containers and keeps the named SQLite volume. Use Docker's own volume tooling if you intentionally want to delete derived local state.
