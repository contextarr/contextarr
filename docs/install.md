# Install Contextarr Locally

Contextarr is developed as a local-first pnpm workspace. v1 core stabilization uses fake demo data only and keeps Context Packs as file-backed source of truth.

## Requirements

- Node.js 20 or newer.
- pnpm 10.
- Git.
- Docker Desktop, optional, for the local Compose preview.

## Fresh Clone

```bash
git clone https://github.com/contextarr/contextarr.git
cd contextarr
pnpm install
pnpm v1-core:verify
```

## Local Development

```bash
pnpm dev
```

The Fastify API runs on `http://127.0.0.1:3210`. The Vite web app runs on `http://127.0.0.1:5173` and proxies `/api` to the local API.

## Docker Preview

```bash
docker compose build
docker compose up
```

Open `http://127.0.0.1:3210`.

Docker is a local preview path, not a hosted production deployment. It serves the built web app and `/api/*` from one Fastify origin.

## Safety Defaults

- No hosted cloud.
- No telemetry.
- No public marketplace.
- No signing implementation.
- No runtime execution.
- No real private data in committed fixtures.
- SQLite is derived/rebuildable and can be deleted.

