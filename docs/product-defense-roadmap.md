# Product Defense Roadmap

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating any behavior as shipped.

## Executive Summary

Contextarr wins only if it is clearly more than "AI memory." The product must prove that source-backed Context Packs can be inspected, reviewed, redacted, maintained, rendered, exported across tools, measured for quality, and exposed through safe agent interfaces.

This roadmap converts the strongest criticisms into implementation requirements. It does not replace the PRD, Good-to-Great addition, or phase roadmap. It adds a defense layer that should be checked before each phase is called complete.

The central product claim is:

```text
Provider memory is convenient.
Contextarr is portable, inspectable, source-backed, reviewable, redaction-aware, deterministic, and exportable.
```

The Good-to-Great roadmap adds five product-defense layers:

- Context Quality Benchmark.
- Pack Authoring SDK and CI.
- Trust and Provenance Layer.
- Agent Interface Contract.
- Official Starter Ecosystem.

These layers are quality infrastructure, not permission to skip core Context Pack phases.

## Criticism Map

| Criticism | Product risk | Phase pressure |
|---|---|---|
| This is just another AI memory app. | Category confusion | Prove source-backed control, validation, review, redaction, and exports. |
| I already have ChatGPT memory, Claude memory, Cursor rules, AGENTS.md, and CLAUDE.md. | Redundant workflow | Make Contextarr the cross-tool compiler that feeds those surfaces. |
| This is extra homework. | Adoption friction | Demo packs, importers, templates, Pack Doctor, and short review sessions. |
| Why not just use Obsidian? | Existing habit | Treat Markdown and Obsidian as inputs and source of truth, not competitors to replace. |
| Why not Basic Memory, Mem0, Zep, Graphiti, or another MCP memory server? | Memory-server comparison | Emphasize deterministic packs, source maps, approval state, redaction, and export quality. |
| The schema and pack format are over-engineered. | Complexity rejection | Show why each field powers health, redaction, traceability, portability, and deterministic exports. |
| No marketplace means no ecosystem. | Distribution weakness | Build safe registry foundations before any public ecosystem. |
| A marketplace means prompt injection, malware, and supply-chain risk. | Trust collapse | Non-executable artifacts, quarantine, scanner reports, signing, revocation, and human review. |
| MCP is dangerous. | Integration fear | Keep MCP read-only, localhost-first, approved-content-only, limited, logged, and redaction-aware. |
| MCP may not be the dominant interface forever. | Interface fragility | Make CLI, exports, and agent mode first-class through an agent interface contract. |
| Docker and self-hosting are friction. | Install dropoff | Keep Docker reliable, document local paths, and later consider Studio after core pull. |
| Users will not maintain packs after setup. | Long-term churn | Pack Health, Review Queue, stale detection, export blockers, and health trends. |
| Skills and Agent Kits make the scope confusing. | Product sprawl | Keep Context Packs first. Defer Skills and Agent Kits until pack adoption is proven. |
| Native coding agents already read repos and remember project state. | Developer-tool redundancy | Focus on cross-domain operational context, decisions, constraints, and portable briefs. |
| If exports are not dramatically better than manual prompting, the product has no reason to exist. | Core value failure | Make exports the proof feature, with target-specific structure and source-backed rationale. |

## Product Countermeasures

| Criticism | Countermeasure |
|---|---|
| "This is just another AI memory app." | Position and build as source-backed context control. Show sources, review state, redaction, export readiness, and cross-tool outputs. |
| "I already have ChatGPT and Claude memory." | Cross-tool export adapters, AGENTS.md, CLAUDE.md, Codex, Claude, ChatGPT, generic Markdown, JSON, and read-only MCP. |
| "This is extra homework." | Demo packs, templates, importers, small review queues, actionable warnings only, Pack Doctor, and five-minute proof path. |
| "Why not Obsidian?" | Obsidian import, Markdown source of truth, Contextarr as compiler/exporter/validator, not a note editor. |
| "The schema is over-engineered." | Validation report, Pack Health scorecard, source traceability, redaction warnings, export readiness, and deterministic outputs. |
| "No marketplace means no ecosystem." | Registry Trust Foundation, official starter packs, templates, safe install/quarantine, signing, scanner reports, revocation, and verified registry later. |
| "Marketplace means malware." | Non-executable artifacts, no auto-activation, local re-scan, quarantine, signed validation reports, source/license checks, and human review. |
| "MCP is dangerous." | Read-only MCP, localhost default, result limits, approved records only, redaction-aware responses, and local query logs. |
| "MCP may fade." | Agent Interface Contract, CLI-first commands, deterministic JSON, portable exports, static rendered output, and optional MCP as only one transport. |
| "Users will not maintain packs." | Pack Health, Review Queue, stale source detection, review sessions, source hash comparison, export blockers, and health trend. |
| "Native coding agents already do repo context." | Do not compete with code indexers. Focus on cross-domain operational context, decisions, constraints, support processes, system facts, and portable AI briefs. |
| "Exports may not beat manual prompting." | Context Quality Benchmark, export quality gates, fixed fixtures, source coverage scoring, stale warning scoring, and sensitive leakage failures. |

## What G0 Covers Now

- README positioning that says Contextarr is a local-first context control layer, not generic memory.
- Product defense, comparisons, demo proof path, export quality, health, review, quarantine, registry readiness, and MCP safety docs.
- Good-to-Great G0 docs for context quality, authoring SDK, trust and provenance, agent interface contract, and official starter ecosystem.

G0 is a docs-only alignment pass. It does not authorize new packages, benchmark fixtures, harnesses, scaffolders, signing, starter gallery UI, registry behavior, marketplace behavior, Skills, Agent Kits, cloud services, or telemetry.

## Current Or Core-Phase Product Proofs

- Demo packs that prove one source can produce many outputs without private data.
- Validation reports that explain structure, source, license, freshness, redaction, and export readiness.
- Pack Health scorecard and Review Queue principles as acceptance criteria for maintenance UX.
- Starter export targets for ChatGPT, Claude, Codex, AGENTS.md, CLAUDE.md, llms.txt, Markdown, and JSON.

Target requirement; not necessarily implemented in current code. Current export targets and safety gates are tracked in [implementation-status.md](implementation-status.md).

## Next Scoped Work Candidates

- Markdown folder importer.
- Obsidian importer.
- ChatGPT and Claude export importers.
- Export history and diff.
- Pack Doctor.
- Security scanner v0.
- Current G4 local export quality benchmark gate for accepted demo fixtures and G3 reports.
- G5 Pack Authoring SDK design details before any scaffolder implementation.
- G10 Trust and provenance design details before hashes, lockfiles, BOM, signing, or registry.
- G14 Agent Interface Contract refinements before any new command work.
- G17 Official Starter Ecosystem policy before any starter packs, templates, or gallery UI.
- Local zip import with quarantine.
- Backup and restore.
- Better Docker and local install docs.

## What To Defer

- Public marketplace.
- Verified registry implementation.
- Private team registry implementation.
- Skills schema and validator.
- Agent Kit schema and Composer.
- Benchmark CI enforcement, public release automation, hosted benchmark services, and external AI evaluation beyond the current local G4 gate.
- Pack scaffolder until G6 is explicitly scoped.
- Provenance signing until G13 is explicitly scoped.
- Starter gallery UI until G20 is explicitly scoped.
- Paid Studio.
- Hosted sync.
- Deep code indexer.
- Agent runtime or action system.

## What To Reject

- Generic chatbot UI.
- Passive always-on memory capture.
- Executable packs or Skills.
- Shell command execution.
- Hidden network calls.
- Remote install with auto-activation.
- Direct Gmail, bank, brokerage, or sensitive-account connectors.
- Telemetry.
- AI auto-approval of imported or generated records.

## Demo Proof Requirements

The first demo must prove:

- A fresh AI session performs weakly without context.
- The same task improves after a Contextarr export or read-only MCP query.
- The user can inspect records, sources, Pack Health, Review Queue, redaction state, and raw Markdown.
- SQLite can be deleted and rebuilt when the phase supports the local index.
- No hidden execution, cloud dependency, or telemetry is involved.
- The user sees "one source, many outputs" within five minutes.

## Success Criteria

- Users describe Contextarr as context control or a context pack manager, not as another memory app.
- A power user prefers a Contextarr export over manually assembling a prompt.
- Context quality claims are backed by fixtures, reports, source coverage, stale warnings, or deterministic exports.
- Demo packs explain the product without private data.
- Review Queue items are actionable and mostly tied to safety, freshness, source, or export impact.
- MCP is trusted because it is read-only, limited, redaction-aware, and local.
- Packs remain maintained after initial setup.
- Users ask for better packs, importers, adapters, templates, and review workflows before asking for cloud or execution.

## Kill Or Pause Signals

- Users only see Contextarr as another memory server.
- Users do not care about source-backed pack files.
- Users do not export to more than one tool.
- Users see Pack Health or Review Queue as busywork.
- Security concerns dominate product feedback.
- Users mainly ask for an agent runner or cloud sync before using the local pack workflow.
- Exports are not clearly better than manual prompting.
- Skills, Agent Kits, or registry planning distract from Context Packs proving adoption.

## Do Not Overcorrect

- Do not build a chatbot to prove value.
- Do not add passive memory capture.
- Do not make Contextarr an agent runner.
- Do not launch public marketplace before trust model.
- Do not add Skills and Agent Kits before Context Packs prove adoption.
- Do not use AI auto-approval.
- Do not make Review Queue a noisy inbox.
