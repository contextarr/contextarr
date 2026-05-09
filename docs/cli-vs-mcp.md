# CLI vs MCP

Status note: This document defines target requirements and usage guidance. Check [implementation-status.md](implementation-status.md) before treating CLI commands, export targets, or MCP visibility gates as shipped.

## When to use CLI

Use CLI for deterministic local automation:

- Validation.
- Inspection.
- Health reports.
- Deterministic exports.
- Agent briefs.
- Import dry-runs.
- Quarantine review.
- Rendering.
- Doctor diagnostics.
- CI or scripted workflows.

CLI is the default for agents and power users because it is easy to run, log, diff, retry, and gate with exit codes.

## When to use MCP

Use MCP for live local context query from MCP-capable clients:

- Live local context query.
- Listing packs from a chat agent.
- Retrieving approved records.
- Building small previews.
- Interactive tool-style client workflows.

MCP must remain read-only, approved-content-only by default, redaction-aware, result-limited, and optional.

## When to use exports

Use exports for portable artifacts:

- ChatGPT web.
- Claude web.
- Codex task prompts.
- Claude Code project instructions.
- AGENTS.md.
- CLAUDE.md.
- llms.txt.
- Contractor briefs.
- Handoff artifacts.

Exports are durable derived files. They can be reviewed, committed when appropriate, attached to tasks, or pasted into tools that do not have local CLI or MCP access.

## Why Contextarr should not be MCP-only

MCP is a transport, not the product architecture. If Contextarr were MCP-only:

- Codex CLI, Claude Code, CI, scripts, and non-MCP local agents would lose a deterministic interface.
- Validation, import dry-run, quarantine, and export workflows would be forced through a chat-tool transport.
- Terminal-native workflows would depend on MCP client setup.
- Exit codes and stdout/stderr contracts would be weaker.
- Future Web UI or API work might accidentally wrap MCP instead of shared core functions.

Contextarr must support agents through CLI even when no MCP client is configured.

## Shared core architecture

Contextarr exposes the same trusted core through multiple surfaces:

- CLI for deterministic automation and agent-safe commands.
- Web UI for human review and maintenance.
- Local API for the dashboard and integrations.
- Read-only MCP for optional live query from compatible clients.
- Exports for portable AI-ready artifacts.

CLI, API, Web UI, MCP, and exports must call shared core modules. No surface should shell out to another surface.

## Security differences

CLI:

- Strongest fit for deterministic validation, reports, dry-runs, and exit codes.
- Can write explicit local artifacts when a command is intentionally mutating.
- Must require `--yes` for explicit mutation in agent mode.

MCP:

- Read-only local query transport.
- Must not mutate files, run commands, call network services, or expose secrets.
- Must keep responses bounded and approved-content-only by default.

Exports:

- Derived artifacts for review and portability.
- Must enforce privacy mode, redaction, review status, and export blockers.
- Must not become source of truth.

## Examples

The examples below are stable contract examples unless [implementation-status.md](implementation-status.md) marks them `Current`. Current implemented commands support `--json` and profile IDs; target shortcuts remain planned.

Validate a pack:

```bash
contextarr validate ./demo-packs --agent --json
```

Query live approved context through CLI without MCP:

```bash
contextarr query contextarr-project-pack "What are the hard non-goals?" --agent --json
```

Generate a portable artifact:

```bash
contextarr export contextarr-project-pack --target agents-md --out AGENTS.md
```

Use MCP only when the client needs live local tool calls:

```bash
pnpm contextarr-mcp
```
