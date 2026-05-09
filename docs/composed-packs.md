# Composed Draft Packs

Status: v1 core draft workflow.

Composer save-as-draft-pack turns selected approved Context Pack records into a new private draft Context Pack. It is a local authoring workflow, not publishing, registry submission, export approval, or source pack mutation.

## Output Root

Composed draft packs are written under `CONTEXTARR_COMPOSED_PACKS_DIR`, default `./composed-packs`.

The API never accepts an output path from the browser. The server resolves the final pack folder from the generated or supplied pack ID, writes inside the configured composed root only, validates the generated pack, and returns no local filesystem path in the response.

`composed-packs/` is ignored by Git.

## Draft Safety Defaults

Generated composed packs use conservative metadata:

- `visibility: private`
- `trustLevel: unreviewed`
- `lastReviewedAt: null`
- records use `review_status: draft`
- records use `privacy: private`
- records include `composed_draft`, `imported_draft`, and `never_export`
- manifest permissions deny command execution, network access, draft writes, and vault reads

These drafts are not indexed as active packs automatically. They remain excluded from export and MCP exposure until a later explicit review and activation workflow exists.

## Selection Rules

Composer save accepts only selected records that are already approved, marked `privacy: public_safe`, and not excluded by configured tags or source pack redaction tags. Redacted mode still applies source pack redaction patterns to the persisted draft, but non-public records can only be used for temporary previews and browser downloads. By default, `secret`, `never_export`, and `imported_draft` records cannot be saved into a composed draft.

The source packs and records are never modified.

## Provenance

Each generated draft record includes provenance metadata that points back to the original pack ID, record ID, title, source IDs, and composition time. The generated source map uses `contextarr://packs/<packId>/records/<recordId>` references rather than local absolute paths.

## API

- `POST /api/compose/save-pack`

The endpoint is protected by the existing optional API token like other non-health `/api/*` routes. It returns the generated pack ID, counts, validation summary, and `draft.indexed: false`.
