# Troubleshooting

## `pnpm install` Fails

Confirm Node.js 20 or newer and pnpm 10 are installed.

```bash
node --version
pnpm --version
```

On Windows, run commands from PowerShell inside the repository root.

## Web UI Cannot Reach API

Start both local dev services:

```bash
pnpm dev
```

The API should be on `http://127.0.0.1:3210`; the Vite web app should be on `http://127.0.0.1:5173`.

## Demo Packs Do Not Appear

Run:

```bash
pnpm demo:verify
pnpm --filter @contextarr/server rescan
```

If ignored local smoke outputs are present, `pnpm v1-core:verify` cleans the known legacy smoke path and uses isolated verifier roots.

## Docker Port Already In Use

Use the Docker host-port override:

```bash
$env:CONTEXTARR_DOCKER_PORT="33210"
docker compose up
```

Open `http://127.0.0.1:33210`.

## SQLite Looks Stale

SQLite is derived state. Rebuild it from files:

```bash
pnpm --filter @contextarr/server rescan
```

Do not commit local `.db`, `.db-shm`, or `.db-wal` files.

## MCP Client Fails

Use the supported local command:

```bash
pnpm contextarr-mcp
```

For clients that require an executable command, use the documented `node --import tsx` entrypoint from `docs/mcp.md`.

