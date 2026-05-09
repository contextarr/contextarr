# CLI-First Agent Interface

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating any CLI command, flag, or agent mode as shipped.

## Executive summary

Contextarr is a self-hosted context automation system and pack manager for AI assistants and agents. Its core object is the Context Pack: a structured, versioned, source-backed bundle of AI-ready and human-readable context.

Contextarr must be fully useful to agents through deterministic CLI commands without requiring MCP. MCP remains a supported optional transport for live local querying, but the planned CLI automation surface includes validation, inspection, export, health, import dry-runs, quarantine review, and agent brief generation as those commands are implemented.

Contextarr exposes the same trusted core through multiple surfaces:

- CLI for deterministic automation and agent-safe commands.
- Web UI for human review and maintenance.
- Local API for the dashboard and integrations.
- Read-only MCP for optional live query from compatible clients.
- Exports for portable AI-ready artifacts.

The CLI must be robust enough for agents to use Contextarr safely without MCP.

## Why CLI is first-class

Many AI coding and local-agent workflows now operate from the terminal. Codex CLI, Claude Code, OpenCode, OpenClaw, Hermes, CI jobs, scripts, and power users all need deterministic commands that can be run locally, inspected in logs, and retried without chat-client state.

The CLI is the best default interface for:

- Validation before editing or exporting.
- Pack inspection without opening the dashboard.
- Deterministic health and review reports.
- Target-specific exports.
- Task-specific agent briefs.
- Import dry-runs and quarantine review.
- CI checks.
- Local diagnostics.

CLI support also keeps Contextarr from becoming MCP-only. MCP is useful for live chat-tool queries, but agents must be able to use Contextarr even when no MCP client is configured.

## CLI vs exports vs MCP

Contextarr supports three equivalent output and access paths:

- CLI: primary deterministic automation interface for agents, scripts, CI, local tools, Codex, Claude Code, OpenCode, OpenClaw, Hermes, and power users.
- Exports: portable artifact interface for ChatGPT, Claude, Codex, Claude Code, AGENTS.md, CLAUDE.md, llms.txt, Generic Markdown, and JSON.
- Read-only MCP: optional live local query interface for MCP-capable clients.

These paths are peers. None is the internal source of truth.

## Architecture

Correct architecture:

```text
Contextarr core engine
-> CLI
-> Web UI
-> Local API
-> Read-only MCP
-> Exports
```

Wrong architecture:

```text
MCP first
-> everything else wraps MCP
```

Core logic must sit below all surfaces. CLI, API, Web UI, MCP, renderer, importers, validation, health, review, query, and export flows should call shared TypeScript core functions. No surface should shell out to another surface.

Rules:

- Do not make MCP the internal source of truth.
- Do not make CLI shell out to MCP.
- Do not make API shell out to CLI.
- Do not make MCP shell out to CLI.
- Do not make the Web UI the only way to inspect packs.
- Keep files as source of truth.
- Keep SQLite derived and rebuildable.

## Agent-safe mode

`--agent` is strict non-interactive mode for AI coding agents and automation.

`--agent` implies:

- No interactive prompts.
- Deterministic output.
- No colors.
- No spinners.
- No progress animation.
- Redacted output by default.
- Approved content only.
- Bounded output size.
- Structured errors.
- Stable `schemaVersion` in output.
- Non-zero exit codes for blocked states.
- No automatic writes unless the command is explicitly mutating and `--yes` is supplied.

In `--agent` mode, stdout should be valid JSON unless `--markdown` is explicitly requested.

## Command families

The CLI command plan is grouped by responsibility:

- System and diagnostics: `--version`, `help`, `doctor`, `config show`, `paths`.
- Pack validation and inspection: `validate`, `inspect`, `list packs`, `list records`, `list sources`, `list exports`.
- Health and review: `health`, `explain-health`, `review list`, `review show`, `review mark-reviewed`, `review ignore`, `review reopen`.
- Export and brief generation: `export`, `brief`.
- Query: `query`, `search`.
- Render: `render`.
- Index and rescan: `rescan`, `rebuild-index`.
- Import and quarantine: `import`, `quarantine list`, `quarantine inspect`, `quarantine activate`, `quarantine block`, `quarantine delete`.
- MCP helpers: `mcp doctor`, `mcp config-example`, `mcp test-query`.
- Registry-ready future commands: `registry search`, `registry inspect`, `registry verify`, `registry import`, `registry refresh-revocations`.

Future registry commands are documentation contracts only in this planning pass. They must not be implemented until registry trust, scanner, signing, quarantine, revocation, and review gates are explicitly scoped.

## Security boundaries

The CLI must follow the same security model as the rest of Contextarr:

- The CLI does not execute pack content.
- The CLI does not run shell commands from packs.
- The CLI does not run Skills.
- The CLI does not run Agent Kits.
- The CLI is not an agent runner.
- The CLI is not a workflow automation engine.
- The CLI does not fetch remote content unless a future explicit registry command is used.
- Agent-facing output is redacted by default.
- Draft, unreviewed, blocked, revoked, and invalid content is excluded by default.
- Mutating commands require an explicit mutating command plus `--yes`.
- Import commands are quarantine-first.
- Output size limits prevent accidental dumping.
- Secrets must not be printed.

## Phase placement

CLI-first planning belongs in Phase 0 or 0A because command contracts should shape future implementation before surface behavior diverges.

Implementation should land phase by phase:

- Phase 1: deterministic JSON validation report.
- Phase 2: demo packs usable from CLI.
- Phase 3: index, rescan, inspect, and list commands as the index exists.
- Phase 4 to 5: CLI and Web UI expose equivalent pack metadata.
- Phase 6: render command.
- Phase 7: health and review commands.
- Phase 8: export and brief commands.
- Phase 9: optional MCP transport, with CLI still fully useful without MCP.
- Phase 10: import dry-run and quarantine.
- Phase 11: compose commands.
- Post-core: scanner, registry, Skill, Agent Kit, and private registry commands.

## Success criteria

- Agents can validate, inspect, export, query, and generate briefs without MCP.
- `--json` outputs use stable envelopes and valid JSON stdout.
- `--agent` is deterministic, non-interactive, redacted by default, and bounded.
- Exit codes are stable and documented.
- Mutations require explicit commands and `--yes`.
- Import and future registry flows are quarantine-first.
- Core logic is shared below CLI, API, Web UI, MCP, and exports.
- No surface shells out to another surface.

## Non-goals

- Do not implement MCP as the internal control plane.
- Do not implement registry commands in this pass.
- Do not build marketplace behavior.
- Do not build executable packs.
- Do not build executable Skills.
- Do not build Agent Kit execution.
- Do not add a workflow runner.
- Do not add hidden network calls.
- Do not add telemetry.
- Do not add direct Gmail, bank, brokerage, Slack, Drive, or cloud connectors.
- Do not include real private data in docs, fixtures, screenshots, or demo output.
