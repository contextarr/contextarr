# Pack Health Scorecard

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating labels, API fields, or fixtures as shipped.

## Purpose

Pack Health is a trust and readiness system, not decorative scoring. It should explain whether a Context Pack is safe, current, source-backed, reviewed, portable, export-ready, and MCP-ready.

Health must not say 100 percent if the pack is unreviewed. Health must be explainable and must link to exact records, sources, rules, or export profiles.

## Required Labels

- Ready.
- Ready with warnings.
- Blocked.
- Draft.
- Unreviewed.
- Deprecated.
- Revoked, future registry only.

Target requirement; not necessarily implemented in current code. Current Pack Health v0 uses `healthy`, `degraded`, and `needs_review`.

## Scorecard Categories

| Category | Signals | Blocking issues | Warning issues | UI display | API fields | Test fixture expectations |
|---|---|---|---|---|---|---|
| Structure | Manifest, record schema, sources, exports, rules | Missing manifest, invalid schema, duplicate record IDs | Missing README, minimal docs | Structure row with issue count and links | `structureStatus`, `structureIssues` | Valid and invalid schema fixtures |
| Source backing | Source IDs, source existence, source type, source trust | Broken required source reference | Unknown source license, missing source notes | Source coverage percentage and broken-source links | `sourceBackingStatus`, `brokenSourceCount`, `sourceCoverage` | Broken source and missing license fixtures |
| Freshness | `lastReviewedAt`, source retrieved/check dates, stale rules | Stale critical source blocking selected export | Stale noncritical source | Freshness badge with affected records | `freshnessStatus`, `staleSourceCount`, `staleRecordCount` | Fixed-date stale source fixture |
| Review status | Record review state, imported drafts, AI drafts | Blocked or rejected record selected for export | Unreviewed draft, review date missing | Review status filter and queue links | `reviewStatus`, `unreviewedCount`, `draftCount` | Draft and unreviewed fixtures |
| Safety | Secret scan, executable files, shell/network claims | Credential, executable file, script file, shell command, hidden network claim | Suspicious but nonblocking pattern | Safety banner with exact issue links | `safetyStatus`, `criticalSafetyCount`, `warningSafetyCount` | Secret, script, shell command fixtures |
| Disclosure | Privacy labels, redaction rules, excluded tags | Secret or restricted data in export profile | Redaction warning, internal data warning | Disclosure panel per export target | `disclosureStatus`, `redactionWarningCount` | Redaction hit fixture |
| Export readiness | Export profile validity, selected records, token estimate | Invalid export profile, selected blocked record | Token warning, stale warning, license warning | Export readiness badge per profile | `exportReadiness`, `profilesReady`, `profilesBlocked` | Invalid profile and warning profile fixtures |
| MCP readiness | Approved content, privacy mode, result limits, allow-private flag | Secret, draft, blocked, revoked, or unapproved content selected | Private content omitted by default | MCP readiness row with included/excluded counts | `mcpReadiness`, `mcpVisibleRecordCount` | MCP approved-only fixture |
| Portability | Local file paths, schema version, target exports, derived-state rebuild | Missing required source file for pack operation | Absolute path warning, unsupported target warning | Portability checklist | `portabilityStatus`, `unsupportedTargetCount` | Rebuild and unsupported target fixtures |

## Status Resolution

- `Blocked`: any critical issue prevents activation, export, or MCP visibility.
- `Ready with warnings`: no blockers, but stale, license, disclosure, token, docs, or review warnings remain.
- `Ready`: valid, approved, source-backed, safe, export-ready, and MCP-ready under default policy.
- `Draft`: pack is being authored or imported and is not trusted by default.
- `Unreviewed`: imported or AI-generated content has not been approved.
- `Deprecated`: pack is intentionally superseded.
- `Revoked`: future registry-only state for artifacts that must not activate.

## API Shape Guidance

Pack Health API responses should expose:

- Overall status and label.
- Per-category status.
- Per-category score or readiness state.
- Blocking issues.
- Warning issues.
- Links or IDs for affected records, sources, rules, and export profiles.
- Export readiness summary.
- MCP readiness summary.
- Last calculated time as local derived metadata only.

## UI Rules

- Health must be explainable in one click.
- Every blocker should link to the affected record, source, rule, or profile.
- Warnings should be grouped by impact, not just by raw validator code.
- Do not show cosmetic metadata warnings above security, disclosure, or export blockers.
- Do not use a simple green score for unreviewed content.

## Test Fixture Expectations

- Clean demo pack: Ready.
- Unreviewed imported pack: Unreviewed or Draft, never Ready.
- Missing source fixture: Blocked when source is required.
- Stale source fixture: Ready with warnings unless critical export profile makes it blocking.
- Secret content fixture: Blocked.
- Invalid export profile fixture: Blocked for export readiness.
- Deprecated pack fixture: Deprecated regardless of otherwise valid structure.
