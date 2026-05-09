# Context Pack Collectors

Status: v1 core hardening v0.

Context Pack collectors are local authoring helpers that create draft Context Pack folders under `CONTEXTARR_DRAFT_PACKS_DIR`, default `./draft-packs`.

Collectors do not activate generated packs, do not index draft packs as active packs, mutate source packs, fetch networks, call AI APIs, run scripts, execute pack content, or upload data.

## v0 Collectors

- Blank Pack Starter: creates a private draft Context Pack with one overview record.
- Markdown Folder: imports local Markdown files as private draft records.
- Project Notes: imports safe text-like local project notes as private draft records.
- Support KB Starter: creates a private support knowledge base starter pack.

## Draft Defaults

Generated draft packs use:

- `visibility: private`
- `trustLevel: unreviewed`
- `containsExecutableCode: false`
- `requiresNetwork: false`
- record `privacy: private`
- record `review_status: draft`
- tags including `imported_draft` and `never_export`
- sources marked `trust: unreviewed`

Draft packs are not indexed as active demo packs automatically. They must be reviewed and explicitly moved into the configured Context Pack source directory before normal export or MCP exposure.

## API

- `GET /api/context-pack-collectors`
- `POST /api/context-pack-collectors/:id/preview`
- `POST /api/context-pack-collectors/:id/run`

The API never accepts an output path. Writes stay under `CONTEXTARR_DRAFT_PACKS_DIR`. Optional API token auth protects collector endpoints like other non-health `/api/*` routes.

Collector API errors must not expose submitted local input paths.

## Verification

Run:

```bash
pnpm collectors:verify
```
