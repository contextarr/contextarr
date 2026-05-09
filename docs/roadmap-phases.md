# Contextarr Roadmap Phases

This document is the phase map for product planning. The repository has historical `pnpm phase*:verify` scripts from earlier implementation passes; do not rename scripts just to match this planning overlay unless a future implementation pass explicitly scopes that cleanup.

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating any behavior as shipped.

## Phase 0: Repo Initialization and Decision Records

- Create repo skeleton.
- Add package manager setup.
- Add documentation.
- Add security and non-goal guardrails.
- Do not implement application functionality.

## Phase 0A: Product Defense and Guardrails

- Add README positioning that separates Contextarr from generic memory.
- Add comparisons, product-defense docs, demo proof path, export quality bar, Pack Health scorecard, Review Queue principles, import quarantine, registry readiness, MCP safety model, and implementation priorities.
- Add or update `AGENTS.md` so future Codex passes preserve phase discipline.
- Add CLI-first agent interface docs, command contracts, agent mode, CLI vs MCP guidance, CLI security model, and JSON schema planning.
- Define command contracts before implementation expands.
- This phase may happen immediately and is docs-only.

## Good-to-Great G-Phase Overlay

The G-phases are additive quality overlays. They do not replace, renumber, or skip the core Context Pack phase order above and below. Design-only G-phases may land as docs when scoped; implementation G-phases must wait for their host core phase and an explicit request.

- G0: Category, quality, and agent contract docs. Docs-only.
- G1: Context Quality Benchmark design. Docs-only; see `docs/context-quality-benchmark.md`.
- G2: Demo benchmark fixtures. Public-safe data fixtures only; no harness.
- G3: Benchmark harness v0. Current local deterministic diagnostic harness over accepted G2 fixtures.
- G4: Export quality benchmark gate. Current local deterministic gate behavior over accepted demo fixtures and G3 reports.
- G5: Pack Authoring SDK design. Docs-only.
- G6: Pack Scaffolder v0. Only after demo packs validate and scaffolding is explicitly scoped.
- G7: Pack lint and explain v0. Only after validator behavior is stable.
- G8: Export snapshot tests. Only after export engine behavior exists.
- G9: Pack Authoring CI template. Example-only unless workflow generation is explicitly scoped.
- G10: Trust and Provenance design. Docs-only.
- G11: Source and pack hashes v0. Only after local source and pack handling are stable.
- G12: Lockfile and Context BOM v0. Only after hashes are deterministic.
- G13: Signed reports and provenance v0. Only after scanner/reporting and trust artifacts are stable.
- G14: Agent Interface Contract docs. Docs-only.
- G15: CLI agent commands v0. Implement gradually in the owning core phases.
- G16: Agent usage examples and repo integration. Keep MCP optional.
- G17: Official Starter Ecosystem design. Docs-only.
- G18: Official starter packs v0. Fake or public-safe content only.
- G19: Starter templates and export profiles. No marketplace behavior.
- G20: Local Starter Gallery. Official local content only; no registry or marketplace.
- G21: Good-to-Great Release Gate. Final quality gate before v1.0 release candidate.

Hard rule: a G-phase must not introduce executable packs, executable Skills, Agent Kit runtime behavior, hidden network calls, telemetry, cloud services, public marketplace behavior, or public registry behavior.

### G0 Consistency Crosswalk

G0 is complete only as a docs-and-roadmap alignment pass. It maps the five Good-to-Great layers into current planning docs:

| PRD layer | G0 doc surface | Later work not completed by G0 |
|---|---|---|
| Context Quality Benchmark | `docs/context-quality.md`; `docs/context-quality-benchmark.md`; `demo-evals/`; `packages/context-quality/` | Later benchmark expansion, if explicitly scoped |
| Pack Authoring SDK and CI | `docs/authoring-sdk.md` | G5 sub-doc expansion, G6 scaffolder, G7 lint/explain, G8 snapshots, G9 CI template |
| Trust and Provenance Layer | `docs/trust-and-provenance.md` | G10 sub-doc expansion, G11 hashes, G12 lockfile/BOM, G13 signing/provenance |
| Agent Interface Contract | `docs/agent-interface-contract.md` plus CLI planning docs | G15 command implementation and G16 workflow examples beyond current docs |
| Official Starter Ecosystem | `docs/official-starter-ecosystem.md` | G18 starter packs, G19 templates/profiles, G20 Starter Gallery |

If a future prompt says "next phase" without naming a G-phase, continue the core Context Pack phase order and do not assume Good-to-Great implementation work is authorized.

## Phase 1: Schema and Deterministic Validator

- Define Context Pack schemas.
- Implement deterministic validator.
- `contextarr validate <path>` must support deterministic JSON.
- CLI validation report must align with validator report.
- Support source, license, freshness, redaction, export readiness, and warning/error reporting.
- Add fixture tests for valid, warning, and blocked packs.
- Keep validation read-only.

## Phase 2: Demo Packs and Starter Export Profiles

- Create fake public-safe demo packs.
- Include manifests, records, source maps, exports, rules, and docs.
- Demo packs must prove value without private data.
- Starter export profiles should cover ChatGPT, Claude, Codex, generic Markdown, JSON, AGENTS.md, CLAUDE.md, and llms.txt as phase support allows.
- Demo packs must be usable from CLI.
- Demo validation command must work.
- Validate all demo packs.

## Phase 3: Local Index and API

- Load pack folders.
- Build SQLite derived index.
- Add local API endpoints.
- Add search and rescan.
- CLI must support index/rescan/inspect/list commands as the server/index exists.
- SQLite remains derived and rebuildable from local files.

## Phase 3A: Registry Trust Foundation Docs

- Define registry artifact format, scanner policy, signing, encryption, quarantine, revocation, and marketplace gates.
- Document official starter gallery, verified registry prototype, and private team registry boundaries.
- No registry implementation.
- No public marketplace.

## Phase 4: Dashboard Shell and Library

- Build local dashboard shell.
- Add Pack Library views.
- Make source-backed context visible through pack metadata, health, trust, source, record, and export readiness fields.
- CLI and Web UI should expose equivalent pack metadata as implementation matures.
- UI must not become the only way to inspect packs.
- Avoid public marketplace affordances.

## Phase 5: Pack Detail and Record Rendering

- Add pack detail pages.
- Add human-readable record rendering.
- Show sources, privacy, review status, confidence, freshness, tags, and resolved references.
- Keep pack and record inspection available through CLI as well as the Web UI.
- Keep rendering sanitized.

## Phase 6: Static Renderer

- Produce sanitized human-readable output.
- Render pack pages, record pages, source maps, health reports, and export previews as local derived artifacts.
- Add or maintain `contextarr render <pack-id-or-path> --out <dir>`.
- Add planned `contextarr render <pack-id-or-path> --dry-run --json` when dry-run support is scoped.
- Generated output must not include user JavaScript, external scripts, hidden network calls, or executable behavior.

## Phase 7: Pack Health and Review Queue

- Turn validation and freshness into a maintenance workflow.
- Calculate explainable Pack Health.
- Generate actionable Review Queue items.
- Prioritize export and MCP blockers before cosmetic metadata.
- Add CLI health and review commands.
- Review mutations require explicit commands and `--yes`.
- Store review item statuses in local SQLite only unless a later phase explicitly scopes file mutation.

## Phase 8: Export Engine

- Produce better-than-manual target-specific exports.
- Support ChatGPT, Claude, Codex, Claude Code, AGENTS.md, CLAUDE.md, llms.txt, generic Markdown, and JSON records as the target set matures.
- Preserve determinism, redaction, source traceability, token estimates, and export readiness warnings.
- Add CLI, API preview, and UI copy/download flows as scoped.
- Add `contextarr brief` as a first-class agent command that generates task-specific context from approved records using export profile logic.

## Phase 9: Read-Only MCP

- Add safe read-only MCP.
- Keep CLI fully useful without MCP.
- Keep MCP redaction-aware, localhost-first, result-limited, and approved-content-only by default.
- Expose only non-mutating tools: `list_packs`, `get_pack_summary`, `query_pack_context`, `get_record`, `list_export_profiles`, and `build_export_preview`.
- Add planned `contextarr mcp doctor --json` when MCP diagnostics are scoped.
- Do not add mutating tools.

## Phase 10: Importers

- Add local folder import.
- Add Markdown and Obsidian import.
- Add basic ChatGPT and Claude export parsing.
- Create draft records only.
- Add CLI import dry-run and quarantine commands as quarantine support is scoped.
- Use quarantine for untrusted imports when quarantine is implemented.
- Keep direct cloud connectors out of scope.

## Phase 11: Composer

- Compose temporary exports from selected packs, records, tags, and privacy modes.
- Add CLI compose when the shared composer core supports it.
- Later, compose saved packs only when explicitly scoped.
- Do not create Agent Kits in this phase.

## Phase 12: Terminology and Schema Planning

- Keep Context Pack as the core context object.
- Define Skill as a non-executable instruction artifact.
- Define Agent Kit as a composed pairing of Context Packs and Skills.
- Define Export Brief as generated output, not source of truth.
- State clearly: Contextarr prepares Agent Kits. It does not run them.
- No schema code is added in Phase 12.
- Do not move Skills or Agent Kits into implementation until Context Packs prove adoption.

## Post-Core: Security, Maintenance, Registry, and Future Objects

- Security scanner implementation.
- Scanner commands.
- Pack Doctor.
- Backup and restore.
- Official pack gallery.
- Verified registry prototype.
- Registry commands.
- Skill commands.
- Agent Kit commands.
- Private registry commands.
- Private team registry.
- Skills and Agent Kits only after Context Packs prove adoption.
- Good-to-Great implementation phases only when their design docs and host core phases are ready.

## Future Skills and Agent Kits

Skills and Agent Kits remain future product expansion:

- Phase 13: Skill Schema and Validator.
- Demo Skills.
- Skill Library.
- Agent Kit schema.
- Agent Kit Composer.
- Agent Kit exports.
- Phase 25: Read-Only MCP for Skills and Agent Kits.
- Read-only MCP for approved Skills and Agent Kits.

Hard boundary: Contextarr prepares Agent Kits. It does not run them. Skills and Agent Kits must remain data-only and non-executable.

## Later Only

- Public marketplace, after trust model, quarantine, scanner, signing, revocation, moderation, and adoption proof.
- Paid Studio.
- Private team registry implementation after real team pull.
- Pack migration tooling.
- Advanced backup and restore.
- Optional local search enhancements.
