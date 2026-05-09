# Agent Usage

Status note: This document defines target agent workflows. Check [implementation-status.md](implementation-status.md) before treating any command, flag, exit code, export target, or quarantine flow as shipped.

## How Codex should use Contextarr CLI

Codex should prefer deterministic CLI commands for repo-local Contextarr work:

- Use deterministic JSON output where implemented. Current implemented commands support `--json` and `--agent`; `--format json` is legacy compatibility.
- Use Markdown exports only when the next step is a human-readable prompt or repo instruction file.
- Treat non-zero exit codes as blockers that need inspection.
- Do not rely on MCP for implementation tasks unless MCP work is explicitly scoped.
- Do not execute pack content.
- Stop after the requested scope.

Current runnable workflow: validate before editing:

```bash
contextarr validate ./demo-packs --agent --json
```

Current runnable workflow: dry-run an existing target export:

```bash
contextarr export ./demo-packs/ai-workstation-pack --target codex --out generated-exports/ai-workstation --dry-run --agent
```

Current runnable workflow: run the local deterministic benchmark gate:

```bash
contextarr benchmark gate --all --sample-only --agent --json
```

## How Claude Code should use Contextarr CLI

Claude Code should use the CLI for local deterministic context and project instructions:

- Generate a Claude Code brief with `contextarr brief`.
- Generate `CLAUDE.md` when a durable project instruction file is needed.
- Use `--json` for machine-readable commands where implementation status marks the command current.
- Use `--markdown` only for prompt-ready or file-ready context.
- Avoid mutating review, quarantine, or import activation commands unless explicitly authorized.

Planned example:

```bash
contextarr brief contextarr-project-pack --for claude-code --task "Review export safety" --markdown
```

## How local agents should use Contextarr CLI

Local agents should treat Contextarr as a context preparation and inspection tool:

- Validate packs before using their records.
- Query approved context through CLI when MCP is unavailable.
- Generate target-specific exports or briefs.
- Use import dry-runs for untrusted bundles.
- Do not run pack content as commands.
- Do not treat Contextarr as a workflow runner.

## Example workflows

The following workflows are planned contracts unless [implementation-status.md](implementation-status.md) marks the command and flags `Current`.

Workflow 4: Generate AGENTS.md:

```bash
contextarr export contextarr-project-pack --target agents-md --out AGENTS.md
```

Workflow 5: Query approved local context without MCP:

```bash
contextarr query contextarr-project-pack "What are the hard non-goals?" --agent --json
```

Workflow 6: Import safely:

```bash
contextarr import ./some-shared-pack.zip --quarantine --dry-run --agent --json
```

## Current safe command examples

```bash
contextarr validate ./demo-packs --agent --json
contextarr inspect ai-workstation-pack --agent --json
contextarr list packs --agent --json
contextarr health ai-workstation-pack --agent --json
contextarr query ai-workstation-pack "What GPU constraints matter?" --agent --json
contextarr brief ai-workstation-pack --for codex --task "Debug local inference setup" --agent --json
contextarr export ./demo-packs/ai-workstation-pack --target codex --out generated-exports/ai-workstation --dry-run --agent
contextarr benchmark gate --all --sample-only --agent --json
```

## Planned safe command examples

These are target command examples, not a shipped-command list.

```bash
contextarr doctor --json
contextarr paths --json
contextarr export ai-workstation-pack --target agents-md --out AGENTS.md
contextarr import ./incoming-pack.zip --quarantine --dry-run --agent --json
```

## Commands agents should avoid unless explicitly authorized

Agents should avoid these unless the user explicitly asks for them:

- `review mark-reviewed`.
- `review ignore`.
- `review reopen`.
- `quarantine activate`.
- `quarantine block`.
- `quarantine delete`.
- Future `registry import`.
- Future Skill or Agent Kit activation commands.
- Any command with `--privacy full`.
- Any mutating command with `--yes`.

Avoid does not mean forbidden forever. It means the user must intentionally authorize the mutation or privacy expansion.

## How to interpret exit codes

- `0`: success.
- `2`: validation failed.
- `3`: blocked by security policy.
- `4`: blocked by review status.
- `5`: requested pack, record, source, export, or review item was not found.
- `6`: invalid arguments or unsupported flag combination.
- `7`: redaction or export blocked.
- `10`: unsupported target.
- `11`: quarantine required.
- `14`: output size limit exceeded.
- `15`: database or index unavailable.

Agents should surface the structured error object and stop rather than guessing.

## How to request redacted exports

Use explicit privacy mode:

```bash
contextarr export ./demo-packs/ai-workstation-pack --target claude --out generated-exports/ai-workstation --dry-run --agent
contextarr brief ai-workstation-pack --for codex --task "Debug local inference setup" --agent --json
contextarr query ai-workstation-pack "What GPU constraints matter?" --agent --json
```

Do not use `--privacy full` in agent workflows unless the user explicitly authorizes it.
