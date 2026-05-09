# Agent Interface Contract

Status note: Check [implementation-status.md](implementation-status.md) before treating CLI flags, command families, JSON envelopes, MCP behavior, or API behavior as shipped.

## Purpose

The Agent Interface Contract is a Good-to-Great planning addition that defines how external agents can safely consume Contextarr output through CLI, exports, local API, static rendered files, and optional read-only MCP.

Contextarr must be useful to agents without requiring MCP.

This document is docs-only. It does not implement new commands, change CLI behavior, add MCP tools, or add runtime capabilities in this pass.

## Interface Surfaces

Contextarr exposes the same trusted core through:

- CLI commands.
- Export files.
- Local API.
- Read-only MCP.
- Static rendered output.
- Raw local pack files.

Files remain the source of truth. SQLite remains derived and rebuildable. No surface should shell out to another surface for core behavior.

## Agent Guarantees

Agent-facing Contextarr surfaces should guarantee:

- Deterministic JSON output in agent mode.
- Stable exit codes.
- Redaction by default for agent-facing commands.
- Approved content only by default.
- Draft, blocked, rejected, revoked, invalid, and unreviewed content excluded by default.
- No execution of pack content.
- No shell commands from packs.
- No hidden network calls.
- Bounded output size.
- Source-backed facts where available.
- Review and freshness warnings.
- Clear machine-readable errors.

## Agent Refusals

Contextarr must refuse to:

- Execute pack instructions.
- Run Skills.
- Run Agent Kits.
- Act as an agent runtime.
- Auto-approve draft content.
- Export blocked content by default.
- Return raw private sources by default.
- Fetch remote registry content without an explicit user command.
- Bypass redaction rules.
- Mutate files from read-only commands.

## Core Command Families

The future stable agent contract covers these command families:

```text
contextarr validate
contextarr inspect
contextarr health
contextarr explain-health
contextarr export
contextarr brief
contextarr query
contextarr review
contextarr import --dry-run
contextarr import --quarantine
contextarr doctor
```

See `docs/cli-command-contract.md`, `docs/cli-agent-mode.md`, `docs/cli-json-schemas.md`, and `docs/cli-security-model.md` for the existing detailed planning docs.

## Agent Mode

`--agent` means strict non-interactive automation mode.

It should imply:

- No interactive prompts.
- JSON stdout by default.
- Deterministic ordering.
- No color, spinner, progress animation, or banners in stdout.
- Redacted output by default.
- Approved content only.
- Bounded output.
- Stable `schemaVersion`.
- Structured blocked states.
- Non-zero exit codes when blocked.
- No automatic writes unless the command is explicitly mutating and `--yes` is supplied.

## Output Contract

Agent-facing JSON should use a stable envelope:

```json
{
  "schemaVersion": "contextarr.cli-result.v1",
  "command": "validate",
  "status": "success",
  "ok": true,
  "data": {},
  "warnings": [],
  "errors": [],
  "meta": {
    "redacted": true
  }
}
```

Deterministic validation, export, brief, and report commands should omit wall-clock timestamps unless a caller explicitly requests them or deterministic mode is disabled.

## Roadmap Placement

Good-to-Great agent interface phases are additive overlays:

- G14: Agent Interface Contract docs.
- G15: CLI agent commands v0.
- G16: Agent usage examples and repo integration.

G15 and G16 should land gradually alongside the core phases that own the relevant behavior. They must not turn Contextarr into an agent runtime.

## Non-Goals

Do not build in this pass:

- New CLI commands.
- New MCP tools.
- Agent runtime.
- Workflow automation engine.
- Shell command runner.
- Skill runner.
- Agent Kit runner.
- Hidden network access.
- Registry fetch behavior.
- Telemetry.

## Acceptance Criteria

This contract succeeds when agents can validate, inspect, query, export, and build task briefs through deterministic local interfaces while Contextarr stays data-only, redaction-aware, approved-content-only by default, and non-executing.
