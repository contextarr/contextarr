# Contextarr Quickstart

Contextarr is a local-first context pack manager for AI assistants and agents. The repository ships with five fake, public-safe demo packs so you can test the workflow without private data.

## Requirements

- Node.js 20 or newer.
- pnpm 10.
- Docker Desktop, optional, for the Compose preview.

## Local Dev

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173`.

The dev stack runs the Fastify API on `http://127.0.0.1:3210` and the Vite web app on `http://127.0.0.1:5173`. Vite proxies `/api` to the local API.

## Docker Preview

```bash
docker compose build
docker compose up
```

Open `http://127.0.0.1:3210`.

Docker serves the built web app and the API from the same local Fastify server. Demo packs and demo Skills are mounted read-only, and SQLite state is stored in a local Docker volume.

## Verify

```bash
pnpm phase11:verify
```

For the latest second-PRD verification chain, run:

```bash
pnpm phase16:verify
```

This runs the original launch verification chain plus Skill validation, demo Skill validation, Skill API checks, and the Skill Library web checks.

## Safety

Use fake or public-safe data while testing. Do not put credentials, secrets, private keys, customer data, medical data, or financial data into demo packs or public fixtures.
