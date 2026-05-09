# Context Pack Exposure Readiness

Status: v1 core hardening lane.

Context Pack Exposure Readiness v0 is a read-only report for active Context Packs. It tells the dashboard and local API whether records are eligible for default export and read-only MCP exposure.

It does not mutate pack files, approve records, remove tags, generate exports, expose MCP data, activate drafts, or write derived artifacts.

More explicitly, it does not remove `never_export`, does not remove `imported_draft`, does not generate exports, and does not expose MCP content.

## Endpoint

```text
GET /api/packs/:packId/exposure-readiness
```

The endpoint is protected by `CONTEXTARR_API_TOKEN` when token auth is configured, like other non-health API routes.

## Report Contents

The report includes:

- pack validation summary
- security scanner summary
- export policy summary
- read-only MCP policy summary
- record counts for export-eligible and MCP-eligible records
- export profile readiness
- per-record blockers and warnings

The response omits local absolute filesystem paths.

## Default Export Eligibility

A record is export eligible by default when:

- the active Context Pack has no validation errors
- the active Context Pack is not scanner-blocked
- the record has `review_status: approved`
- the record has `privacy: public_safe`
- the record does not carry `secret`, `never_export`, or `imported_draft`

Readiness warnings may still appear for stale sources, redaction warnings, license warnings, or non-current source status. Warnings do not mutate the pack or approve exposure.

## Default MCP Eligibility

The v0 report models the conservative MCP default:

- stdio-only MCP
- approved records only
- public-safe record bodies only
- secret bodies are never returned
- private, internal, or sensitive bodies require explicit private MCP configuration outside this report

Exposure Readiness does not change MCP behavior. It reports what the active pack is eligible for under the current conservative policy.

## Activation And Approval Boundaries

Activation is not approval.

Approval is not exposure by itself.

Exposure Readiness is the read-only visibility layer after activation and explicit review metadata promotion. It confirms that privacy, tag, validation, scanner, and profile gates agree before a user relies on exports or MCP.

The report does not remove `never_export` or `imported_draft`, does not change `privacy`, and does not rewrite records.

## Verification

Run:

```bash
pnpm exposure:verify
```

The verifier checks API/UI coverage, runs a smoke report against demo packs, checks draft/private blockers, confirms no local absolute path leakage, confirms the report is read-only, and builds the web app.
