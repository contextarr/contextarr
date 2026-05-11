# Context Readiness

Status: Wave 2 read-only API slice.

Context Readiness is a metadata-only report that summarizes whether an indexed Context Pack looks ready for AI context reuse. It composes existing Pack Health, Exposure Readiness, review items, export profile readiness, record privacy, and default export/MCP eligibility. It does not replace Pack Health or Exposure Readiness.

## Endpoint

- `GET /api/packs/:id/readiness`

The response schema version is `contextarr.readiness-report.v1`.

Top-level fields:

- `packId`
- `status`: `ready`, `review_needed`, or `blocked`
- `score`: deterministic weighted score from the six readiness dimensions
- `dimensions`: `source`, `review`, `governance`, `redaction`, `export`, and `mcp`
- `issues`: objects with `code`, `severity`, `message`, and metadata-only `evidence`
- `generatedAt`

## Boundaries

The endpoint is read-only. It does not mutate pack files, write readiness events, recalculate derived SQLite state, generate exports, execute pack content, call AI services, fetch remote URLs, upload telemetry, or widen MCP visibility.

Governance is presence-only in this slice. If `rules/governance.yaml` is missing, the governance dimension reports `review_needed` with `governance.missing`; parsing and enforcement remain future scoped work.

## Status Rules

- `blocked`: at least one readiness issue has `severity: "blocker"`.
- `review_needed`: no blockers, but at least one warning is present.
- `ready`: no blockers and no warnings.

Examples of blocker inputs include pack-level validation/security blockers from Exposure Readiness, no eligible export profiles, no eligible export records, no eligible MCP records, or export profile readiness blockers.

Examples of warning inputs include missing governance rules, incomplete source coverage, stale/source/license warnings, redaction warnings, open review items, excluded records, and profile warnings.
