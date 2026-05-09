# Contextarr Demo Benchmark Fixtures

Status note: These are G2 public-safe benchmark fixtures. The G3 harness can read and score them, and the G4 local gate can evaluate them, but the fixture folder itself is not a benchmark harness, release gate, telemetry surface, CI workflow, hosted service, or model-evaluation system.

## Purpose

These fixtures define task prompts, expected facts, and scoring rubrics for Context Quality Benchmark work.

They use only fake or public-safe demo-pack content from `demo-packs/`.

## Included Tasks

- `ai-workstation-troubleshooting`: technical troubleshooting answer using `ai-workstation-pack`.
- `support-ticket-drafting`: customer-safe support reply using `internal-support-kb-pack`.
- `contractor-handoff`: scoped handoff brief using `claude-code-project-pack`.
- `codex-implementation-brief`: coding-agent implementation brief using `claude-code-project-pack`.
- `internal-kb-answer`: internal support KB answer using `internal-support-kb-pack`.

## Fixture Shape

Each task folder contains:

- `task.yaml`: task metadata, condition list, expected output shape, and blocked behavior.
- `no-context-prompt.md`: baseline prompt for the no-context condition.
- `manual-prompt.md`: public-safe manually assembled baseline brief.
- `raw-notes.md`: public-safe raw notes baseline input.
- `expected-facts.yaml`: source-backed facts, forbidden claims, stale handling expectations, and sensitive-content rules.
- `scoring-rubric.yaml`: deterministic scoring dimensions and fail rules.

## Non-Goals

These fixtures do not by themselves:

- Run benchmarks.
- Score outputs.
- Generate reports.
- Call external AI APIs.
- Fetch network resources.
- Execute pack content.
- Add npm, pnpm, or package scripts.
- Add telemetry.
- Include private data.

G3 local deterministic scoring and G4 local deterministic gate behavior live in `packages/context-quality` and the CLI benchmark commands. Fixture maintenance must not add external AI calls, network fetches, telemetry, cloud services, CI enforcement, registry behavior, marketplace behavior, Skills, or Agent Kits.

## G2 Coverage Review

Status: Accepted and consumed by the current G3 diagnostic harness.

The five PRD-listed fixture tasks are present and use fake or public-safe demo-pack data only:

- `ai-workstation-troubleshooting`
- `support-ticket-drafting`
- `contractor-handoff`
- `codex-implementation-brief`
- `internal-kb-answer`

Each task includes a no-context prompt, manual-prompt baseline, raw-notes baseline, expected facts, and scoring rubric. The referenced packs, records, sources, and export profiles resolve to the current demo-pack set.
