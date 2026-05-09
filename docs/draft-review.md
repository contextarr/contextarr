# Context Pack Draft Review

Status: v1 core hardening lane.

Context Pack Draft Review v0 inventories local draft Context Packs from configured draft roots, runs validation and the local security scanner, and can copy a passing draft into the active packs root for human review.

Activation is not approval.

## Draft Roots

Contextarr scans these local roots for draft folders containing `contextarr-pack.json`:

| Root | Default | Source |
|---|---|---|
| `CONTEXTARR_DRAFT_PACKS_DIR` | `./draft-packs` | Context Pack collectors. |
| `CONTEXTARR_IMPORTED_PACKS_DIR` | `./imported-packs` | CLI/core local importers. |
| `CONTEXTARR_COMPOSED_PACKS_DIR` | `./composed-packs` | Composer save-as-draft-pack. |

These roots must not overlap each other or the active `CONTEXTARR_PACKS_DIR`.

## Inventory

The draft inventory reports:

- draft id
- source root type
- relative draft path
- pack id and display metadata
- record, source, and export profile counts
- content hash
- validation summary
- security scanner summary
- activation gates

API responses do not expose absolute local filesystem roots.

## Activation Gates

A draft can be activated only when:

- the draft has a valid manifest pack id
- the pack id is safe as a local directory name
- no active Context Pack with the same id already exists
- validation has zero errors
- the security scanner has no blocking findings
- the requested content hash still matches the reviewed draft

Validation warnings and scanner review recommendations remain visible after activation. They do not make the copied pack approved.

## Activation Behavior

Activation copies the draft folder into:

```text
<CONTEXTARR_PACKS_DIR>/<pack-id>/
```

Activation:

- never overwrites an existing active pack
- never accepts an arbitrary output path
- blocks path escapes
- does not rewrite draft files
- does not change record review status
- does not change record privacy
- does not remove `never_export` or `imported_draft` tags
- does not approve records
- does not mark exports ready
- does not expose export content
- does not expose the draft through MCP
- does not expose MCP content
- does not call external services
- does not execute pack content

The current API activation path does not rebuild the derived SQLite index automatically. This keeps activation as a file-copy step for review, not an approval or exposure step.

## API

Protected routes:

```text
GET /api/context-pack-drafts
GET /api/context-pack-drafts/:id
POST /api/context-pack-drafts/:id/validate
POST /api/context-pack-drafts/:id/activate
```

`POST /api/context-pack-drafts/:id/activate` accepts:

```json
{
  "expectedHash": "optional 64 character sha256 hex content hash"
}
```

Controlled responses:

- `400` invalid body or failed activation gates
- `401` missing API token when token auth is enabled
- `404` unknown draft id
- `409` content hash mismatch or active pack id already exists

## Web

The dashboard route is:

```text
#/drafts
```

The screen shows draft inventory, validation/scanner status, blocking reasons, warnings, record metadata, and a guarded `Activate for Review` action.

## Verification

Run:

```bash
pnpm drafts:verify
```

The verifier covers API tests, web route/client tests, a local activation smoke check, and the web build.

## Boundaries

Draft Review v0 does not add approval inside the activation step. The separate active-pack approval workflow is documented in [approval-workflow.md](approval-workflow.md).

Draft Review v0 still does not add:

- pack editing
- registry behavior
- marketplace behavior
- remote install
- cloud sync
- runtime execution
- Skill expansion
- Agent Kit expansion
- export or MCP exposure for drafts
