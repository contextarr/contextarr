# Contextarr Quickstart

Contextarr is a local-first Context Pack manager for AI assistants and agents. The repository ships with 15 public-safe demo Context Packs, including 12 curated starter Context Packs, so you can test the workflow without private data.

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
pnpm docs:verify
pnpm demo:validate
pnpm v1-core:verify
pnpm advanced-preview:verify
pnpm exposure:verify
pnpm trust-loop:verify
pnpm site:verify
```

For the full local release gate, run:

```bash
pnpm release:verify
```

## Demo Flow

1. Validate the demo packs.
2. Open the dashboard.
3. Inspect the Pack Library, Pack Health, Exposure Readiness, and a record detail source map.
4. Open Review Queue, then Draft Intake, to see untrusted draft/composed candidates as metadata-only review inputs.
5. Preview a Codex or Claude export and save a local brief from Export Center when the preview is safe to keep.
6. Query through read-only MCP if needed.
7. Delete the local SQLite database and rescan to confirm the index is rebuildable.

## First Pack Path

Use this review-first path for a first real pack:

1. Choose a starter: Blank Pack Starter, Markdown Folder, Project Notes, Support KB Starter, or a copied curated starter pack.
2. Run a collector from the dashboard Collectors view, or run `contextarr import` for local folders, Markdown folders, Obsidian vaults, ChatGPT exports, or Claude exports.
3. Inspect the generated candidate in Draft Intake. CLI-only checks can list metadata with `contextarr review-candidates`, but activation proof and apply live in Draft Intake/API.
4. Review the candidate files, validation, scanner result, sources, privacy, and export profile intent.
5. Prepare the activation plan and dry-run activation proof.
6. Activate only after review. Activation moves or copies the candidate into the active packs root, records sanitized local evidence, and refreshes the derived local index; it does not export, publish, call external services, or expose candidates through MCP.
7. Open Export Center, preview a Codex or Claude profile, and save or export the local brief only after the active pack and records meet the intended review and exposure rules.

List draft intake candidates from the CLI:

```bash
pnpm --filter @contextarr/cli contextarr review-candidates --format json
```

Inspect active pack exposure readiness from the CLI:

```bash
pnpm --filter @contextarr/cli contextarr inspect ai-workstation-pack --kind pack --readiness --format json
```

## Backup And Restore

Create a local Context Pack backup:

```bash
pnpm --filter @contextarr/cli contextarr backup demo-packs --out data/backups
```

Restore into quarantine:

```bash
pnpm --filter @contextarr/cli contextarr restore data/backups/<backup-id> --out data/restored-packs
```

Restore validates copied packs and writes `restore-report.json`. It does not activate packs automatically.

## Safety

Use fake or public-safe data while testing. Do not put credentials, secrets, private keys, customer data, medical data, or financial data into demo packs or public fixtures.
