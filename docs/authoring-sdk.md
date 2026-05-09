# Pack Authoring SDK and CI

Status note: Check [implementation-status.md](implementation-status.md) before treating authoring commands, SDK packages, CI workflows, or snapshot exports as shipped.

## Purpose

The Pack Authoring SDK and CI layer is a Good-to-Great planning addition for making Context Packs easier to create, validate, test, and maintain.

This document is docs-only. It does not add packages, templates, scaffolder code, CI workflows, or new CLI commands in this pass.

## Product Problem

A strict pack schema is useful only if authors can work with it confidently. If users must memorize every manifest field, source-map rule, export profile detail, and validation code by hand, pack authoring will feel like homework.

The authoring layer should make a Context Pack feel like a small open-source package:

- Easy to scaffold.
- Easy to validate.
- Easy to test in CI.
- Easy to snapshot exports.
- Easy to explain when something fails.
- Still data-only and source-backed.

## Future Command Families

Planned authoring commands:

```text
contextarr init pack
contextarr init record
contextarr init source-map
contextarr init export-profile
contextarr lint <pack-path>
contextarr test-pack <pack-path>
contextarr snapshot-export <pack-id> --target codex
contextarr explain <issue-code>
contextarr autofix <pack-path> --dry-run
```

These commands are not implemented by this document.

## Starter Templates

Initial official template candidates:

- Project Pack.
- Technical System Pack.
- Internal KB Pack.
- Support Process Pack.
- Product Line Pack.
- Homelab System Pack.
- AI Workstation Pack.
- Client Handoff Pack.
- Contractor Handoff Pack.
- Decision Log Pack.

Templates must generate readable, public-safe or fake sample content. They must not include private data, credentials, executable scripts, shell snippets, hidden network calls, or auto-approval behavior.

## Pack Test Types

Future pack tests should cover:

- Schema validity.
- Source reference validity.
- Export profile validity.
- Redaction rule behavior.
- Snapshot export stability.
- Stale source detection with fixed dates.
- License warnings.
- Security scanner reports, when scanner work is explicitly scoped.
- Renderer snapshots.
- CLI JSON output.

## Export Snapshot Testing

Export snapshot tests should prove that a pack produces stable output for a target profile.

Planned examples:

```text
contextarr snapshot-export ai-workstation-pack --target codex --out snapshots/codex.md
contextarr test-pack ai-workstation-pack --snapshots
```

Rules:

- Snapshot output is deterministic.
- Runtime timestamps are excluded unless explicitly allowed.
- Redaction warnings are included.
- Approved-content changes cause intentional snapshot updates.
- Snapshot updates require explicit author action.

## CI Policy

Future CI examples should be local and review-friendly:

- Validate packs.
- Run pack tests.
- Run export snapshot tests when snapshots exist.
- Report structured errors.
- Publish nothing by default.
- Call no external AI APIs.
- Add no telemetry.

CI examples should be templates or documented examples until a future phase explicitly scopes generated workflow files.

## Roadmap Placement

Good-to-Great authoring phases are additive overlays:

- G5: Pack Authoring SDK design.
- G6: Pack Scaffolder v0.
- G7: Pack lint and explain v0.
- G8: Export snapshot tests.
- G9: Pack Authoring CI template.

G6 through G9 must not be pulled forward by this planning document. Implementation waits for explicit phase scope.

## Non-Goals

Do not build in this pass:

- `packages/pack-authoring`.
- A scaffolder.
- Authoring CLI commands.
- Snapshot test runner.
- CI workflow files.
- Hosted CI.
- Pack publishing.
- Registry install.
- Marketplace submission flow.
- AI auto-authoring without human review.
- Auto-fix that silently changes pack content.

## Acceptance Criteria

This layer succeeds when future pack authors can scaffold, validate, test, snapshot, and understand packs without weakening Contextarr's safety model.

Generated pack content must remain human-readable, source-backed, reviewed before use, and non-executable.
