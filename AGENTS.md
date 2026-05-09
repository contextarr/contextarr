# Contextarr Agent Instructions

## Repo Purpose

Contextarr is a self-hosted context automation system and pack manager for AI assistants and agents. The core object is the Context Pack: a structured, versioned, source-backed bundle of AI-ready and human-readable context.

## Product Boundaries

- Keep Context Packs as the core object.
- Files are the source of truth.
- SQLite is derived and rebuildable.
- Contextarr validates, reviews, renders, redacts, composes, exports, and exposes approved context.
- Contextarr does not run agents or execute pack content.

## CLI-First Principle

Contextarr must be fully useful to agents through deterministic CLI commands without requiring MCP. MCP is optional for live local querying; the CLI is the primary automation surface for validation, inspection, export, health, import dry-runs, quarantine review, and agent brief generation as those commands are implemented.

## Using Contextarr CLI

- Check `docs/implementation-status.md` before relying on a CLI command or flag.
- Prefer stable `--json` or `--agent` output where implemented; `--format json` is the legacy compatibility path.
- Treat health, brief, query, full quarantine, and registry commands as planned unless `docs/implementation-status.md` marks them `Current`.
- Do not rely on MCP for implementation tasks unless explicitly scoped.
- Do not execute pack content.
- Do not add commands that run shell snippets from packs.
- Keep command outputs deterministic.
- Update docs and tests with CLI changes.
- Stop after the requested phase.

## Phase Discipline

- Read the relevant docs before coding.
- Read `docs/implementation-status.md`, `package.json`, and relevant implementation files before claiming a roadmap capability is shipped.
- Work only on the requested phase or task.
- Stop after the requested scope.
- Do not pull future phases forward without explicit instruction.
- Prefer docs and tests with every phase.

## Implementation Status Guardrail

- Roadmaps and criticism-nullification docs define target requirements.
- `docs/implementation-status.md` is the shipped-versus-planned source of truth.
- If roadmap language conflicts with implementation status, treat the roadmap as planning.
- Do not implement roadmap requirements unless the user explicitly scopes that phase.
- Final reports must separate implemented behavior, documented target behavior, and behavior not implemented.

## Good-to-Great G-Phase Discipline

- Treat G-phases as overlays on the core phase order, not replacements for it.
- Do not skip core Context Pack phases to build Good-to-Great implementation work early.
- Read `docs/contextarr_prd_addition_good_to_great_layers.md`, `docs/roadmap-phases.md`, and `docs/implementation-status.md` before claiming a G-phase is current or ready to implement.
- G0, G1, G5, G10, G14, and G17 may be docs-only when scoped.
- G1 Context Quality Benchmark design is docs-only: do not create `demo-evals/`, fixtures, harnesses, scripts, external AI calls, or telemetry unless a later prompt explicitly scopes G2 or G3.
- G2 benchmark fixtures are data-only under `demo-evals/`; do not add harnesses, scripts, generated reports, package entries, external AI calls, or telemetry from fixture work.
- G3 benchmark harness is local deterministic only. Keep it limited to fixture loading, validation, scoring, local export inputs, diagnostic reports, and focused tests; do not add external AI calls, network fetches, telemetry, cloud services, model leaderboards, or CI enforcement under G3.
- G4 benchmark gate behavior is local deterministic only. Keep it limited to `contextarr benchmark gate`, `pnpm benchmark:demo`, `pnpm benchmark:report`, accepted demo fixtures, G3 reports, local threshold checks, and focused tests; do not add external AI calls, network fetches, telemetry, cloud services, CI workflows, public release automation, hosted benchmarks, model leaderboards, registry behavior, marketplace behavior, Skills, or Agent Kits under G4.
- G0 layer summaries do not authorize G2 fixtures, G3 harnesses, G6 scaffolders, G11 hashes, G13 signing, G18 starter packs, G20 gallery UI, registry behavior, Skills, or Agent Kits.
- Do not build benchmark harnesses, pack scaffolders, provenance signing, starter gallery UI, registry, marketplace, Skills, Agent Kits, cloud services, or telemetry from a docs-only G-phase prompt.
- Implementation G-phases require an explicit prompt naming that implementation scope.
- Keep future context quality, authoring, provenance, agent interface, and starter ecosystem work tied to Context Packs first.

## No-Goals

Do not build marketplace, cloud, executable packs, executable Skills, Agent Kits, an agent runtime, shell execution, hidden network calls, telemetry, direct Gmail connectors, direct bank/brokerage connectors, or public registry behavior unless explicitly scoped in a future task.

## Security Rules

- Keep packs, future Skills, and future Agent Kits data-only.
- Do not add executable artifact support.
- Do not add hidden network calls.
- Do not add telemetry.
- Imported or generated content is draft until reviewed.
- Read-only MCP must stay read-only, redaction-aware, and result-limited; approved-content-only visibility is a required completion gate unless `docs/implementation-status.md` marks it current.
- No real private data belongs in demo packs, fixtures, screenshots, or docs.

## Build And Test Discovery

- Inspect `package.json` before choosing commands.
- Prefer existing scripts over inventing new ones.
- Common checks include `pnpm test`, `pnpm typecheck`, `pnpm docs:verify`, and phase-specific `pnpm phase*:verify` scripts.
- If a requested check does not exist, report it as unavailable instead of claiming success.

## Final Report Format

End implementation passes with:

- Summary.
- Files created.
- Files changed.
- Commands run.
- Tests/checks run.
- Checks passed.
- Missing scripts or unavailable checks.
- Blockers.
- Security notes.
- Deviations from request.
- Next recommended prompt.

Avoid scope creep. Stop after the requested phase.
