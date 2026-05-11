# Decision: Agentic AI Context Readiness And Local Observability

## Status

Accepted as a planned product addition.

## Context

Contextarr already has Pack Health, Exposure Readiness, export previews, review queues, and read-only MCP. The Agentic AI Context Readiness and Local Observability PRD adds a stronger planning layer for answering whether a Context Pack is source-backed, reviewed, governed, redacted, export-fit, and locally observable enough for AI assistant or agent use.

This decision adopts the PRD as project-governed scope, but it does not implement runtime behavior.

## Decision

- Adopt `docs/prd-additions/agentic-ai-context-readiness-local-observability.md` as the canonical PRD addition.
- Treat Context Readiness as a planned layer that strengthens Pack Health and Exposure Readiness without replacing either one.
- Treat Local Observability as local evidence metadata, not product telemetry.
- Keep Context Packs as the v1 core stabilization target before expanding this work into schemas, APIs, UI, MCP, CLI, starter packs, benchmark gates, or release gates.
- Reuse existing local app-state patterns where possible, including the current MCP query metadata log, before adding new storage.

## Boundaries

- No cloud telemetry.
- No product analytics.
- No hidden network calls.
- No agent runner.
- No workflow automation engine.
- No mutating MCP.
- No shell command execution from packs.
- No direct Gmail, Slack, Google Drive, Jira, CRM, bank, or brokerage connectors.
- No public registry or public marketplace behavior.
- No raw export bodies, MCP query text, or returned context bodies in evidence logs by default.

## Sequencing

1. AR0: docs and decision record only.
2. AR1: readiness, governance, token-budget, and issue-code schemas.
3. AR2: local evidence storage and writer helpers.
4. AR3 to AR4: deterministic readiness engine and local API routes.
5. AR5 to AR7: governance integration, export evidence, token warnings, and MCP evidence.
6. AR8 to AR10: readiness UI, local activity UI, and CLI commands.
7. AR11 to AR13: public-safe starter pack, benchmark fixtures, docs, and release gates.

## Consequences

- Contextarr can position future work as local-first agentic AI context infrastructure without claiming current runtime support.
- The current alpha remains focused on the Context Pack adoption loop.
- Future implementation phases must include tests and must preserve the no-execution, no-telemetry, local-only security model.
