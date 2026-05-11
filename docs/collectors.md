# Context Pack Collectors

Status: v1 core hardening v0.

Context Pack collectors are local authoring helpers that create draft Context Pack folders under `CONTEXTARR_DRAFT_PACKS_DIR`, default `./draft-packs`.

Collectors are draft generators. They do not activate generated packs, do not index draft packs as active packs, do not mutate source packs, do not fetch networks, do not call AI APIs, do not run scripts, do not execute pack content, and do not upload data.

## v0 Collectors

- Blank Pack Starter: creates a private draft Context Pack with one overview record.
- Markdown Folder: imports local Markdown files as private draft records.
- Project Notes: imports safe text-like local project notes as private draft records.
- Support KB Starter: creates a private support knowledge base starter pack.

Use collectors to get to a reviewable first draft quickly. Do not treat collector output as approved content.

## Draft Lifecycle

Collector output follows this lifecycle:

1. Preview the intended draft shape.
2. Run the collector to write a draft under `CONTEXTARR_DRAFT_PACKS_DIR`.
3. Review the generated files, warnings, sources, privacy, and record status.
4. Validate the draft pack.
5. Hand the candidate to Draft Intake for activation planning and proof.
6. Activate only after review, using Draft Intake's proof-gated local activation path.

Generated draft packs use:

- `visibility: private`
- `trustLevel: unreviewed`
- `containsExecutableCode: false`
- `requiresNetwork: false`
- record `privacy: private`
- record `review_status: draft`
- tags including `imported_draft` and `never_export`
- sources marked `trust: unreviewed`

Draft packs are inactive by default. They are not indexed as active demo packs automatically, do not appear through read-only MCP, and are excluded from export until reviewed and activated. They must be reviewed and explicitly moved into the configured Context Pack source directory through the local activation workflow before normal active-pack handling can begin.

## Preview Behavior

Preview is a read-only planning step.

`POST /api/context-pack-collectors/:id/preview` returns the proposed pack ID, pack name, record previews, source count, and warnings. It does not write files, create directories, index content, validate an on-disk pack, activate a pack, export records, expose records through MCP, fetch URLs, or run commands.

For local-path collectors, preview reads the submitted local input path to determine importable files and warnings. Responses should be treated as metadata for review, not as approved content. Collector API errors must not expose submitted local input paths.

## Run Behavior

Run is the only collector step that writes files.

`POST /api/context-pack-collectors/:id/run` writes a private draft pack under `CONTEXTARR_DRAFT_PACKS_DIR`, defaulting to ignored `draft-packs/`. The API never accepts an output path. Writes stay inside the configured draft root, and existing draft output is rejected unless overwrite is explicitly requested by the caller.

Run output includes generated pack files, record files, source metadata, draft rules, warnings, and validation results. A successful run does not activate the pack, does not index it as active, does not generate exports, does not publish anything, and does not expose records through MCP.

## Draft Intake Handoff

Draft Intake is the handoff point from "generated draft" to "review candidate."

Draft Intake scans `CONTEXTARR_DRAFT_PACKS_DIR`, composed drafts, and configured review candidate roots as untrusted local candidates. It returns sanitized metadata, validation summaries, scanner summaries, duplicate-active-pack warnings, counts, activation plans, dry-run proof, and local activation history.

Draft Intake activation requires a current dry-run proof ID and rejects changed or blocked candidates. Activation is local only: it moves or copies a reviewed candidate into the configured active packs root, records sanitized local activation evidence, and refreshes the derived local index.

Draft Intake does not approve records, publish packs, generate exports, perform network access, return record bodies, expose absolute local paths, or expose candidate records through MCP. After activation, the pack still has to satisfy normal exposure readiness rules before export or MCP surfaces should include it.

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
pnpm docs:verify
```
