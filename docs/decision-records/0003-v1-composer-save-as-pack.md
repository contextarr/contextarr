# 0003: Composer Save As Pack

Status: Accepted for v1 planning, not implemented.

## Context

Composer currently previews, copies, and downloads generated export artifacts. v1 may need a save-as-pack workflow, but that would create new source files and must be explicitly scoped before implementation.

## Decision

- Save-as-pack writes draft Context Packs only.
- Draft packs are written under an ignored local output root.
- The user cannot submit arbitrary output paths.
- Draft packs validate before being listed as usable Context Packs.
- Draft records default to private, unreviewed, and tagged with `imported_draft` and `never_export` unless the future product flow defines a more specific reviewed state.
- Save-as-pack preserves source references and export provenance where available.
- Save-as-pack does not mutate source packs.
- Save-as-pack does not execute Skills, execute Agent Kits, run scripts, call AI APIs, fetch URLs, upload data, or publish packages.

## Consequences

- Composer save must share validation and quarantine rules with restore and collectors.
- The UI must make draft state obvious.
- Pack Health must surface missing sources, weak provenance, stale inputs, and export readiness before activation.

## Non-Goals

- No save directly into approved demo packs.
- No public publishing.
- No registry submission.
- No marketplace behavior.
- No execution runtime.

