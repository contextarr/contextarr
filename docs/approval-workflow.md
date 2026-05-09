# Context Pack Approval Workflow

Status: v1 core hardening lane.

Context Pack approval v0 adds explicit, file-backed record review status promotion for active Context Packs.

Activation is not approval. Approval is a separate human action.

## Scope

This workflow applies only to active Context Packs under `CONTEXTARR_PACKS_DIR`.

It can update record frontmatter fields:

- `review_status`
- `last_reviewed`

Supported target review statuses are:

- `approved`
- `needs_review`
- `rejected`

Approval v0 does not edit record body text, privacy, tags, sources, source maps, manifests, export profiles, Skills, Agent Kits, registry metadata, or marketplace data.

## Safety Gates

Before promotion, Contextarr:

- resolves the pack through the active SQLite index
- confirms the pack path stays inside `CONTEXTARR_PACKS_DIR`
- validates the active Context Pack
- runs the local security scanner
- requires zero validation errors
- blocks critical or blocking scanner findings
- requires a matching record content hash
- rejects unknown record ids
- rejects unsupported review statuses

After writing frontmatter, Contextarr validates and scans the pack again. If the updated pack fails gates, the original record file is restored.

## Review Queue Integration

SQLite is derived state. After a successful promotion, Contextarr rebuilds the local index so generated Review Queue items reflect the current file-backed metadata.

For example, changing a record from `review_status: draft` to `review_status: approved` resolves the generated `review_status` item on the next derived index rebuild.

Review item status changes in SQLite do not approve records. File-backed record frontmatter is the source of truth for approval.

## API

Protected routes:

```text
GET /api/packs/:packId/review-status
POST /api/packs/:packId/records/:recordId/review-status
```

`GET /api/packs/:packId/review-status` returns validation status, scanner status, and per-record content hashes and promotion gates.

`POST /api/packs/:packId/records/:recordId/review-status` accepts:

```json
{
  "reviewStatus": "approved",
  "expectedHash": "64 character sha256 hex content hash",
  "reviewedAt": "2026-05-09"
}
```

`reviewedAt` is optional and defaults to the current local process date in `YYYY-MM-DD` form.

Controlled responses:

- `400` invalid body or failed validation/scanner gates
- `401` missing API token when token auth is enabled
- `404` unknown pack or record
- `409` content hash mismatch

## Web

The Pack Detail Records tab shows explicit review status controls for each record:

- Approve
- Needs Review
- Reject

The controls are disabled when validation or scanner gates block promotion.

## Export And MCP Boundary

Approval changes `review_status` only.

Approval does not:

- remove `never_export`
- remove `imported_draft`
- change `privacy`
- change source status
- create exports
- expose a record through MCP by itself
- execute pack content
- call external services

Export and MCP visibility still follow their existing privacy, tag, review status, token, and redaction gates.

## Verification

Run:

```bash
pnpm approval:verify
```

The verifier covers API tests, web client/render tests, a local approval smoke check, and the web build.

## Boundaries

Approval v0 does not add:

- pack body editing
- arbitrary file editing
- registry behavior
- marketplace behavior
- remote install
- cloud sync
- runtime execution
- Skill expansion
- Agent Kit expansion
- signing implementation
- public/private registry activation
