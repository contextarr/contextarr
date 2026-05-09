# 0002: Context Pack Collectors

Status: Accepted; v0 implemented for local draft Context Pack creation.

## Context

Collectors are needed for Context Pack authoring and update workflows, but the current v1 stabilization lane freezes additional Skill and Agent Kit expansion until Context Pack core readiness is accepted.

## Decision

- Collectors are Context Pack authoring/update workflows.
- Collectors are not Skill expansion.
- Collectors are not Agent Kit execution.
- Collectors produce draft Context Pack files under an ignored local output root until reviewed.
- Collector output must validate before activation.
- Collector output defaults to private, unreviewed, and excluded from export until review.
- Collector v0 writes under `CONTEXTARR_DRAFT_PACKS_DIR`, default `./draft-packs`, and does not index drafts as active packs automatically.
- Collectors must never fetch remote data unless a future decision explicitly allows a local, user-initiated, source-specific collector.
- Collectors must never run shell commands, execute pack content, execute Skills, execute Agent Kits, upload data, call AI APIs, or add telemetry.

## Consequences

- Early collectors are local-file based and explicit.
- Review Queue and Pack Health should be part of collector activation.
- The API and UI should distinguish draft collector output from approved demo packs.

## Non-Goals

- No Gmail, bank, brokerage, or live cloud connectors.
- No browser automation collector.
- No marketplace package ingestion.
- No automatic public registry import.
