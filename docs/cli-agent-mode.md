# CLI Agent Mode

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating `--agent`, `--json`, or approved-only CLI behavior as shipped.

## What --agent means

`--agent` is strict non-interactive mode for AI coding agents, local agents, CI, and automation. It exists so tools such as Codex CLI, Claude Code, OpenCode, OpenClaw, Hermes, and scripts can use Contextarr safely without MCP.

`--agent` is not a runtime. It does not run agents, execute packs, execute Skills, run Agent Kits, or call tools from pack content.

## Defaults

`--agent` defaults to:

- JSON stdout unless `--markdown` is explicitly requested.
- Redacted output.
- Approved content only.
- Deterministic ordering.
- No colors.
- No spinners.
- No progress animation.
- No prompts.
- Bounded output size.
- Structured errors.

## Output guarantees

Agent output must be predictable:

- stdout contains only command result content.
- stderr contains diagnostics, warnings, progress, and human-readable errors.
- JSON stdout is valid JSON.
- JSON output uses a stable `schemaVersion`.
- Keys and list ordering are deterministic where the underlying source data allows it.
- Deterministic validation, export, and report commands omit wall-clock timestamps unless a caller supplies them or deterministic mode is disabled.

## Privacy guarantees

Agent mode is least-disclosure by default:

- `--privacy redacted` is the default.
- Trusted output commands such as export, query, and brief exclude draft, unreviewed, rejected, blocked-tag, invalid, private, sensitive, and secret records by default.
- Inspection commands may expose redacted review metadata so agents can diagnose why content is blocked.
- Secret records are never printed.
- Redaction and export blockers are returned as structured blocked states.
- `--privacy full` must be explicit and should not be assumed by agents.

## Size limits

Agent mode must bound output so an agent cannot accidentally dump a vault, pack archive, or large private record set.

Planned size-limit behavior:

- Commands return summaries first.
- Query and list commands enforce result counts.
- Record bodies are bounded unless explicitly requested by a safe command.
- Export and brief commands fail with exit code 14 when output exceeds the configured limit.
- Truncation, when allowed, must be deterministic and clearly marked.

## Mutation restrictions

In `--agent` mode:

- Read-only commands never mutate files or SQLite state.
- Mutating commands must be explicit.
- Mutating commands require `--yes`.
- `--dry-run` must be supported for risky mutations where practical.
- Imports are quarantine-first.
- Activation is explicit and cannot happen as a side effect of import.
- Registry imports, when implemented later, must verify and quarantine before activation.

## Error handling

Agent mode errors use structured JSON envelopes and stable exit codes.

Blocked states are not generic failures. They should explain why the command was blocked:

- Security policy.
- Review status.
- Redaction or export blocker.
- Quarantine required.
- Unsupported target.
- Output size limit.
- Database/index unavailable.

Human-readable details may appear on stderr, but JSON stdout remains parseable.

## Current Runnable Examples

Validate before editing:

```bash
contextarr validate ./demo-packs --agent --json
```

Preview a Codex export for an existing profile target:

```bash
contextarr export ./demo-packs/ai-workstation-pack --target codex --out generated-exports/ai-workstation --dry-run --agent
```

Run the local deterministic quality gate:

```bash
contextarr benchmark gate --all --sample-only --agent --json
```

Generate a task-ready implementation brief:

```bash
contextarr brief ai-workstation-pack --for codex --task "Debug local inference setup" --agent --json
```

Query hard boundaries without MCP:

```bash
contextarr query ai-workstation-pack "What GPU constraints matter?" --agent --json
```

Check pack health before export:

```bash
contextarr health ai-workstation-pack --agent --json
```

## Planned Examples for Claude Code

These examples are command-contract examples unless [implementation-status.md](implementation-status.md) marks the command and flags `Current`.

Generate a Markdown task brief:

```bash
contextarr brief contextarr-project-pack --for claude-code --task "Review security boundaries" --markdown
```

Generate a project instruction file:

```bash
contextarr export contextarr-project-pack --target claude-md --out CLAUDE.md
```

## Planned Examples for local agents

Run a safe import preview:

```bash
contextarr import ./some-shared-pack.zip --quarantine --dry-run --agent --json
```
