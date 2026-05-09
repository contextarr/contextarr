# Review Queue Principles

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating actions, statuses, or export/MCP blocking behavior as shipped.

## Purpose

Review Queue exists to protect trust, safety, freshness, and export quality. It must not become a noisy inbox.

## Principles

- Review Queue exists to protect trust, safety, freshness, and export quality.
- Review items should be actionable.
- Review items should prioritize export/MCP blockers first.
- Review Queue should not nag about cosmetic metadata before critical safety issues.
- Draft/imported/AI-generated content is not trusted until approved.
- Review actions should be local and reversible where possible.
- Review Queue should explain the affected pack, record, source, rule, export, or MCP surface.
- Review Queue should not ask users to fix things that do not affect trust, safety, freshness, portability, export quality, or MCP readiness.

## Required Priority Order

1. Secret or credential exposure.
2. Executable/script content.
3. Shell/network/tool execution claim.
4. Redaction/export leakage.
5. Broken source reference.
6. Stale critical source.
7. Unreviewed draft.
8. Invalid export profile.
9. Unknown/restricted source license.
10. Missing documentation or cosmetic metadata.

## Required Actions

- Open record.
- Open source.
- Open file path.
- Copy issue details.
- Mark reviewed.
- Ignore.
- Reopen.
- Block export.
- Show affected exports.
- Show affected MCP access.

Target requirement; not necessarily implemented in current code. Current Review Queue actions are narrower than this target list.

## Item Shape

Each review item should include:

- Stable ID.
- Pack ID.
- Optional record ID.
- Optional source ID.
- Optional export profile ID.
- Issue type.
- Severity.
- Priority.
- Human-readable message.
- Suggested action.
- Affected surfaces: export, MCP, render, import, registry, or portability.
- Status: open, reviewed, ignored, reopened, blocked, resolved.
- Deterministic fingerprint so rescans can preserve local status.

## Noise Control

- Group duplicate issues by source or record when possible.
- Do not create separate cosmetic issues for every record unless the missing field affects export or trust.
- Do not nag about optional metadata before the pack has a safety and export path.
- Do not auto-approve AI-generated or imported content.
- Do not let ignored items hide critical new findings with a different fingerprint.

## Acceptance Criteria

- The top of the queue shows blockers that can leak secrets, execute content, break sources, or corrupt exports.
- A user can understand the impact of an item without reading validator internals.
- Every action either opens evidence, changes local review state, or changes export/MCP blocking state.
- Review state is local and reversible where possible.
