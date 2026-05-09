# CLI Command Contract

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating any CLI command or flag as shipped.

## Purpose

This document defines the intended stable CLI contract for Contextarr. It is a planning and implementation contract, not a claim that every command is already implemented.

Current implementation note: `validate`, `render`, `export`, and `import` support the stable `--json` and `--agent` envelope path. Legacy `--format text|json` remains where it existed before this contract. `export --target <target>` is current only as an alias for an existing export profile whose `target` field already matches the requested value. Future commands, Markdown mode, generated target artifacts such as `agents-md`, and broader privacy overrides are still planning contracts until implementation status marks them current.

## Global flags

- `--json`: write the command result as JSON to stdout.
- `--markdown`: write the command result as Markdown to stdout or `--out`.
- `--text`: write the command result as human-readable text.
- `--ndjson`: future optional streaming mode for large result sets.
- `--quiet`: suppress non-essential stderr diagnostics.
- `--verbose`: include extra diagnostics on stderr.
- `--agent`: strict non-interactive mode for agents and automation.
- `--dry-run`: calculate and report intended changes without writing.
- `--yes`: confirm an explicit mutating command.
- `--output <path>` or `--out <path>`: write artifacts to a path.
- `--privacy redacted|full|public_safe`: choose privacy mode.
- `--target <target>`: choose target output or agent.

## Output modes

Default human output may be text. Agent-facing and CI-facing commands should prefer `--json`.

Rules:

- In `--json` mode, stdout must be valid JSON only.
- In `--agent` mode, stdout must be valid JSON unless `--markdown` is explicitly requested.
- In `--markdown` mode, stdout may be Markdown or `--out` may receive Markdown.
- In `--text` mode, stdout may be concise human-readable text.
- `--quiet` must not suppress required JSON fields.
- `--verbose` diagnostics belong on stderr.

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Success |
| 1 | General error |
| 2 | Validation failed |
| 3 | Blocked by security policy |
| 4 | Blocked by review status |
| 5 | Not found |
| 6 | Invalid arguments |
| 7 | Redaction or export blocked |
| 8 | Unavailable dependency |
| 9 | Config error |
| 10 | Unsupported target |
| 11 | Quarantine required |
| 12 | Signature or hash verification failed, future registry |
| 13 | Revoked artifact, future registry |
| 14 | Output size limit exceeded |
| 15 | Database/index unavailable |

Implemented commands should use this table for their current behavior. Future commands must converge on the same table as they are added.

## Stdout and stderr rules

- stdout is only command result content.
- stderr is warnings, diagnostics, progress, and human-readable errors.
- In `--json` mode, stdout must be valid JSON only.
- In `--agent` mode, stdout must be valid JSON unless `--markdown` is explicitly requested.
- No mixed progress text in JSON stdout.
- No colors, spinners, progress animation, or banners in `--json` or `--agent` stdout.

## JSON envelope

Standard successful or blocked output uses this envelope:

```json
{
  "schemaVersion": "contextarr.cli-result.v1",
  "command": "string",
  "status": "success | warning | blocked | failed",
  "ok": true,
  "data": {},
  "warnings": [],
  "errors": [],
  "meta": {
    "generatedAt": "optional ISO datetime only when nondeterminism is acceptable",
    "contextarrVersion": "string",
    "workingDirectory": "optional",
    "redacted": true
  }
}
```

In deterministic validation, export, and report commands, do not include wall-clock timestamps unless a caller supplies them or deterministic mode is disabled.

## Error envelope

Standard failed output uses the same top-level envelope with `ok: false` and one or more errors:

```json
{
  "schemaVersion": "contextarr.cli-result.v1",
  "command": "validate",
  "status": "failed",
  "ok": false,
  "data": {},
  "warnings": [],
  "errors": [
    {
      "code": "manifest.missing",
      "severity": "critical",
      "message": "Missing contextarr-pack.json.",
      "file": "contextarr-pack.json",
      "path": "optional string",
      "hint": "optional string"
    }
  ],
  "meta": {
    "contextarrVersion": "0.0.0",
    "redacted": true
  }
}
```

Standard error object:

```json
{
  "code": "string",
  "severity": "critical | high | medium | low | info",
  "message": "string",
  "file": "optional string",
  "path": "optional string",
  "hint": "optional string"
}
```

## Mutation confirmation rules

Mutating commands require all of the following:

- The user invokes an explicitly mutating command.
- The command is not hidden behind a read-only command name.
- `--yes` is supplied for non-interactive mutation.
- `--dry-run` is supported where practical.
- The result reports what changed.

In `--agent` mode, mutating commands must not write unless `--yes` is supplied. Commands that would mutate without `--yes` must exit non-zero with a structured blocked result.

## Dry-run rules

`--dry-run` must:

- Avoid file, database, config, network, and state mutation.
- Return the same validation and security gates that the real command would use.
- Report intended file paths, records, review items, quarantine items, or exports.
- Use the standard JSON envelope in `--json` and `--agent` mode.
- Exit non-zero when the real command would be blocked by validation, security, review, or size limits.

## Privacy defaults

- `--agent` defaults to `--privacy redacted`.
- Export and query commands exclude unapproved, draft, rejected, blocked, future revoked, invalid, and private records by default.
- `--privacy public_safe` includes only public-safe content.
- `--privacy full` is an explicit user choice and should remain unavailable for unsafe agent defaults.
- Secret values must not be printed unless a future unsafe override is explicitly designed and reviewed. Do not implement that override now.

## Agent mode rules

`--agent` is strict non-interactive mode.

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
- Stable `schemaVersion`.
- Non-zero exit codes for blocked states.
- No automatic writes unless command is explicitly mutating and `--yes` is supplied.

## Current Runnable Commands

These commands are current when run through the workspace script path shown in the README and CLI README:

```bash
pnpm --filter @contextarr/cli contextarr validate <path>
pnpm --filter @contextarr/cli contextarr render <path> --out <dir>
pnpm --filter @contextarr/cli contextarr export <path> --profile <profile-id> --out <path>
pnpm --filter @contextarr/cli contextarr export <path> --target <existing-profile-target> --out <path>
pnpm --filter @contextarr/cli contextarr export <path> --all --out <path>
pnpm --filter @contextarr/cli contextarr inspect <pack-id-or-path>
pnpm --filter @contextarr/cli contextarr list packs
pnpm --filter @contextarr/cli contextarr list records --pack <pack-id>
pnpm --filter @contextarr/cli contextarr list sources --pack <pack-id>
pnpm --filter @contextarr/cli contextarr list exports --pack <pack-id>
pnpm --filter @contextarr/cli contextarr rescan
pnpm --filter @contextarr/cli contextarr health <pack-id-or-path>
pnpm --filter @contextarr/cli contextarr health --all
pnpm --filter @contextarr/cli contextarr review list
pnpm --filter @contextarr/cli contextarr review show <review-item-id>
pnpm --filter @contextarr/cli contextarr query <pack-id> "query"
pnpm --filter @contextarr/cli contextarr query --all "query"
pnpm --filter @contextarr/cli contextarr brief <pack-id-or-path> --for codex --task "..."
pnpm --filter @contextarr/cli contextarr import <path> --kind <kind> --out <path>
pnpm --filter @contextarr/cli contextarr benchmark run <task-id> --sample-only
pnpm --filter @contextarr/cli contextarr benchmark report <task-id> --out <path>
pnpm --filter @contextarr/cli contextarr benchmark gate --all --sample-only
```

Current implemented commands support stable `--json` and `--agent` envelopes where documented in [implementation-status.md](implementation-status.md). Current write commands support `--dry-run`; `--agent` blocks writes unless `--yes` is supplied.

## Planned Contract Examples

The examples below define the broader target contract, including future expansions and command families. Treat only the commands listed above and marked `Current` in [implementation-status.md](implementation-status.md) as runnable.

## Core command groups

### Group 1: System and diagnostics

```bash
contextarr --version
contextarr help
contextarr doctor
contextarr doctor --json
contextarr config show --json
contextarr paths --json
```

### Group 2: Pack validation and inspection

```bash
contextarr validate <path>
contextarr validate <path> --json
contextarr validate <path> --agent --json
contextarr inspect <pack-id-or-path>
contextarr inspect <pack-id-or-path> --json
contextarr list packs --json
contextarr list records --pack <pack-id> --json
contextarr list sources --pack <pack-id> --json
contextarr list exports --pack <pack-id> --json
```

### Group 3: Health and review

```bash
contextarr health <pack-id>
contextarr health <pack-id> --json
contextarr health --all --json
contextarr explain-health <pack-id>
contextarr review list --json
contextarr review list --pack <pack-id> --severity critical --json
contextarr review show <review-item-id> --json
contextarr review mark-reviewed <review-item-id> --yes
contextarr review ignore <review-item-id> --reason "..." --yes
contextarr review reopen <review-item-id> --yes
```

### Group 4: Export and brief generation

```bash
contextarr export <pack-id> --target chatgpt
contextarr export <pack-id> --target claude
contextarr export <pack-id> --target codex
contextarr export <pack-id> --target claude-code
contextarr export <pack-id> --target agents-md --out AGENTS.md
contextarr export <pack-id> --target claude-md --out CLAUDE.md
contextarr export <pack-id> --target llms-txt --out llms.txt
contextarr export <pack-id> --profile <profile-id> --privacy redacted --json
contextarr brief <pack-id> --for codex --task "..." --agent --json
contextarr brief <pack-id> --for claude-code --task "..." --markdown
contextarr brief <pack-id> --for chatgpt --task "..." --markdown
```

## Brief command behavior

`contextarr brief` is a first-class agent command. It generates task-specific context from approved records using export profile logic.

For Codex target, brief output must include:

- Task goal.
- Phase scope.
- Relevant source-backed context.
- Hard boundaries.
- Likely files or packages.
- Commands to run.
- Tests to run.
- Acceptance criteria.
- Security notes.
- Final report format.
- Instruction to stop after requested scope.

For Claude Code target, brief output must include:

- Project context.
- Coding conventions.
- Source-backed decisions.
- Constraints.
- Relevant records.
- Safe file boundaries.
- Test expectations.
- Review expectations.

For ChatGPT target, brief output must include:

- Concise context.
- Task goal.
- Important facts.
- Constraints.
- Expected output.
- Relevant sources.

For Claude target, brief output may include:

- Deeper context.
- Source-backed facts.
- Do-not-assume section.
- Uncertainty warnings.
- Stale warnings.
- Review status.

### Group 5: Query

```bash
contextarr query <pack-id> "question or search phrase"
contextarr query <pack-id> "question" --json
contextarr query --all "phrase" --json
contextarr search "phrase" --json
```

### Group 6: Render

```bash
contextarr render <pack-id-or-path> --out <dir>
contextarr render ./demo-packs --out ./dist
contextarr render <pack-id-or-path> --dry-run --json
```

### Group 7: Index and rescan

```bash
contextarr rescan
contextarr rescan --json
contextarr rebuild-index --json
contextarr rebuild-index --dry-run --json
```

### Group 8: Import and quarantine, future

```bash
contextarr import <path> --dry-run --json
contextarr import <path> --quarantine --json
contextarr quarantine list --json
contextarr quarantine inspect <id> --json
contextarr quarantine activate <id> --yes
contextarr quarantine block <id> --yes
contextarr quarantine delete <id> --yes
```

### Group 9: MCP helper commands, later optional

```bash
contextarr mcp doctor --json
contextarr mcp config-example
contextarr mcp test-query <pack-id> "question" --json
```

### Group 10: Registry-ready commands, future docs only

```bash
contextarr registry search "query"
contextarr registry inspect <artifact-id>
contextarr registry verify <artifact-id>
contextarr registry import <artifact-id> --quarantine
contextarr registry refresh-revocations
```

Do not implement registry commands until they are explicitly scoped.

## Current Examples

Validate a pack for automation:

```bash
contextarr validate ./demo-packs --agent --json
```

Export an existing Codex target alias:

```bash
contextarr export ./demo-packs/ai-workstation-pack --target codex --out generated-exports/ai-workstation --agent --dry-run
```

Preview an import:

```bash
contextarr import ./notes --kind markdown --out imported-packs/manual --dry-run --agent --json
```

## Planned Examples

Check health before export:

```bash
contextarr health contextarr-project-pack --agent --json
```

Generate a Codex task brief:

```bash
contextarr brief contextarr-project-pack --for codex --task "Implement Phase 5 renderer" --agent --json
```

Generate a portable project instruction file:

```bash
contextarr export contextarr-project-pack --target agents-md --out AGENTS.md
```

Safely inspect an import:

```bash
contextarr import ./some-shared-pack.zip --quarantine --dry-run --agent --json
```
