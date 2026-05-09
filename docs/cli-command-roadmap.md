# CLI Command Roadmap

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating any CLI command or flag as shipped.

## Purpose

This roadmap places CLI-first requirements into the phase plan without pulling implementation forward. Command contracts should be defined before behavior expands, and implementation should land only when the relevant core capability exists.

## Phase 0 or 0A: CLI-first contracts

- Add CLI-first docs and `AGENTS.md` guardrails.
- Define command contracts before implementation expands.
- State that Contextarr must be useful to agents without MCP.
- State that CLI, API, Web UI, MCP, and exports call shared core functions.
- Do not implement new runtime behavior in this planning phase.

## Phase 1: Validation

- `contextarr validate <path>` must support deterministic JSON.
- CLI validation report must align with validator report.
- Validation remains read-only.
- JSON output must be valid JSON stdout with no progress text mixed in.
- Validation failures should converge on exit code 2.

## Phase 2: Demo packs

- Demo packs must be usable from CLI.
- Demo validation command must work.
- Demo packs must remain fake and public-safe.
- Starter export profiles should cover ChatGPT, Claude, Codex, generic Markdown, JSON, AGENTS.md, CLAUDE.md, and llms.txt as phase support allows.

## Phase 3: Local index and API

- CLI should support index, rescan, inspect, and list commands when server/index exists.
- Planned commands: `rescan`, `rebuild-index`, `inspect`, `list packs`, `list records`, `list sources`, `list exports`.
- SQLite remains derived and rebuildable.
- CLI and API should use shared index/core helpers rather than shelling out to each other.

## Phase 4 to 5: Metadata parity

- Web UI and CLI should expose equivalent pack metadata.
- UI must not become the only way to inspect packs.
- CLI inspection should include pack identity, source paths, record counts, export profiles, review status summaries, privacy summary, and validation summary as available.

## Phase 6: Renderer

- CLI render command.
- `contextarr render <pack-id-or-path> --out <dir>`.
- `contextarr render <pack-id-or-path> --dry-run --json`.
- Rendered output remains sanitized and local.

## Phase 7: Health and review

- CLI health and review commands.
- Planned commands: `health`, `health --all`, `explain-health`, `review list`, `review show`, `review mark-reviewed`, `review ignore`, `review reopen`.
- Review mutations require explicit commands and `--yes`.
- Review actions must not mutate pack files unless a future phase explicitly scopes file mutation.

## Phase 8: Export and brief

- CLI export and brief commands.
- Planned exports: ChatGPT, Claude, Codex, Claude Code, AGENTS.md, CLAUDE.md, llms.txt, generic Markdown, JSON.
- `contextarr brief` becomes a first-class agent command.
- Briefs use approved records and export profile logic.
- Briefs enforce privacy, review, redaction, and size limits.

## Phase 9: Read-only MCP

- MCP added as optional transport.
- CLI remains fully useful without MCP.
- Add `contextarr mcp doctor --json`.
- Add `contextarr mcp config-example`.
- Add `contextarr mcp test-query <pack-id> "question" --json` only when it can call shared MCP/core helpers without shelling out to the MCP process.

## Phase 10: Import and quarantine

- CLI import dry-run and quarantine.
- Planned commands: `import --dry-run`, `import --quarantine`, `quarantine list`, `quarantine inspect`, `quarantine activate`, `quarantine block`, `quarantine delete`.
- Imports must not auto-activate.
- Imported or generated content is draft until reviewed.

## Phase 11: Compose

- CLI compose commands can be added when the composer core supports them.
- Compose output remains derived.
- Saving composed packs must be explicitly scoped.
- Compose must reuse export engine, redaction rules, review rules, and privacy modes.

## Post-core

Future command families:

- Scanner commands.
- Registry commands.
- Skill commands.
- Agent Kit commands.
- Private registry commands.

Post-core commands remain blocked by their own security gates. They must not add pack execution, Skill execution, Agent Kit execution, hidden network calls, telemetry, or marketplace behavior without explicit phase scope and review.

## Command readiness notes

- Commands listed in `docs/cli-command-contract.md` are planned contracts unless already implemented in the CLI package.
- Do not create fake passing commands.
- Do not wire unfinished commands.
- Type contracts may be added before runtime implementation only when they are clearly labeled as shared CLI result types.
