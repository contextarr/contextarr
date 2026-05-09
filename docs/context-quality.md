# Context Quality

Status note: Check [implementation-status.md](implementation-status.md) before treating benchmark flows, export targets, CLI briefs, or MCP query behavior as shipped.

## Purpose

Contextarr is not trying to be generic AI memory. Its durable job is to improve context quality for AI assistants and agents.

Context quality means context is source-backed, current, reviewed, redaction-aware, export-ready, target-optimized, reproducible, and safe for agents to consume without gaining execution power.

This document captures the Good-to-Great Context Quality layer as a planning addition. The detailed G1 benchmark design lives in [context-quality-benchmark.md](context-quality-benchmark.md), G2 public-safe fixture data lives under `demo-evals/`, and the G3/G4 local deterministic harness and gate live in `packages/context-quality`. The benchmark layer does not call external AI APIs, fetch remote sources, add cloud services, add CI enforcement, add public release automation, or add telemetry.

## Quality Positioning

Provider memory can be convenient, but it is usually opaque, provider-specific, hard to review, hard to reproduce, and hard to export across tools.

Contextarr should instead own the question:

```text
Is this the right context, in the right shape, with the right safety gates, for this agent task?
```

The quality bar is met when a Contextarr export or brief is visibly better than manually assembling a prompt from scattered notes.

## Quality Signals

Contextarr quality signals should stay concrete:

- Source-backed: records link back to known sources.
- Current: freshness rules identify stale or unknown sources.
- Reviewed: approved content is separated from draft, imported, rejected, blocked, or revoked content.
- Redaction-aware: privacy modes and redaction rules are visible before export.
- Export-ready: target profiles produce deterministic outputs with warnings.
- Target-optimized: ChatGPT, Claude, Codex, Claude Code, AGENTS.md, CLAUDE.md, llms.txt, Markdown, and JSON outputs can have different structures.
- Reproducible: the same pack, profile, privacy mode, and selected records produce stable output.
- Agent-safe: CLI, exports, and optional MCP expose bounded, non-executing, redacted-by-default context.

## Context Quality Benchmark Layer

The future Context Quality Benchmark should prove whether Contextarr output improves AI task results compared with weak baselines.

Planned comparison modes:

- No context.
- Manual prompt.
- Raw notes pasted.
- Contextarr export.
- Contextarr CLI brief.
- Contextarr MCP query, when MCP exists.

Planned task types:

- Technical troubleshooting answer.
- Coding-agent implementation prompt.
- Support ticket drafting.
- Contractor handoff brief.
- Architecture decision recovery.
- Internal KB answer.
- Product comparison.
- Redacted external share.

Planned scoring dimensions:

- Task success.
- Grounding accuracy.
- Source coverage.
- Hallucination rate.
- Sensitive leakage.
- Stale context handling.
- Instruction following.
- Output structure.
- Token efficiency.
- Repeatability.

## Benchmark Boundaries

The benchmark layer must not become a hosted evaluation service, model leaderboard, vendor ranking system, or telemetry surface.

Benchmark runs are local and deterministic in G3. G4 adds a local deterministic gate over accepted G3 reports. Any future AI-assisted evaluation must be explicitly scoped, visible to the user, and never hidden behind release checks.

For the current G0 through G4 scope:

- Keep `demo-evals/` as static public-safe fixture data only.
- Keep G3 scoring local and deterministic.
- Treat G3 reports as diagnostics for fixture quality, source coverage, safety, and export coverage.
- Keep G4 gate behavior local, deterministic, and limited to accepted demo fixtures and G3 reports.
- Do not call external AI APIs.
- Do not fetch remote sources.
- Do not add telemetry.
- Do not add CI enforcement, cloud services, public release automation, hosted benchmarks, model leaderboards, registry behavior, Skills, or Agent Kits from benchmark work.

## Roadmap Placement

Good-to-Great quality phases are additive overlays. They do not replace the core Context Pack phase order.

- G0: Category, quality, and agent contract docs.
- G1: Context Quality Benchmark design, documented in [context-quality-benchmark.md](context-quality-benchmark.md).
- G2: Demo benchmark fixtures, data-only under `demo-evals/`.
- G3: Local deterministic benchmark harness v0, diagnostic reports.
- G4: Local export quality benchmark gate over accepted demo fixtures and G3 reports.

G1 is a docs-only design phase. G2 is data-only fixture work. G3 is the current local deterministic harness. G4 is the current local deterministic benchmark gate. Later Good-to-Great phases should only be implemented when explicitly scoped.

## Acceptance Criteria

The Context Quality layer succeeds when:

- Users understand that Contextarr is context quality infrastructure, not generic memory.
- Exports can be compared against no-context and manual-prompt baselines.
- Sensitive leakage can fail a benchmark.
- Stale source handling can be scored.
- Reports explain why Contextarr output helped or failed.
- Quality claims are backed by fixtures, examples, reports, or reproducible exports.
