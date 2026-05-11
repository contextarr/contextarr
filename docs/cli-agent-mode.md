# CLI Agent Mode

`--agent` is an explicit automation mode for read-oriented Contextarr CLI commands.

It is available only on commands that inspect local data without writing files, rebuilding indexes, exporting artifacts, restoring backups, or activating anything:

- `contextarr validate <path> --agent`
- `contextarr scan <path> --agent`
- `contextarr list [kind] --agent`
- `contextarr inspect <id> --agent`
- `contextarr health [id] --agent`
- `contextarr readiness <pack-id> --agent`
- `contextarr review --agent`
- `contextarr review-candidates --agent`
- `contextarr brief [id] --agent`
- `contextarr query <query...> --agent`

## Contract

`--agent` means:

- JSON output, using the same deterministic JSON schemas as `--json` or `--format json`.
- No color output.
- No progress animation output.
- Existing path display sanitization, source redaction, and secret redaction remain in force.
- Existing command limits remain in force where the command already supports limits.

For commands that also support `--json`, including `readiness`, `--agent` is equivalent to JSON output plus the explicit no-color/no-progress automation contract. For `scan`, `--agent` selects JSON output even though the command otherwise uses `--format json`.

## Non-Goals

`--agent` is intentionally not available on write-heavy commands:

- `contextarr import`
- `contextarr import-skill`
- `contextarr render`
- `contextarr export`
- `contextarr backup`
- `contextarr restore`
- `contextarr rescan`

Those commands must reject `--agent` as an unknown option or otherwise fail before writing. Use their existing explicit options, such as `--format json`, only when a write action is intended.

`--agent` does not execute Context Packs, Skills, or Agent Kits. Contextarr remains data-only and local-first.
