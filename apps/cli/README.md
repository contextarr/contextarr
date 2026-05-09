# Contextarr CLI

Command line interface for local Contextarr tooling.

The CLI is the primary deterministic automation interface for agents, scripts, CI, local tools, and power users. Contextarr must remain useful through CLI commands without requiring MCP.

Check [../../docs/implementation-status.md](../../docs/implementation-status.md) before treating stable contract docs, flags, or future commands as implemented.

Stable contract docs:

- [../../docs/cli-first-agent-interface.md](../../docs/cli-first-agent-interface.md)
- [../../docs/cli-command-contract.md](../../docs/cli-command-contract.md)
- [../../docs/cli-agent-mode.md](../../docs/cli-agent-mode.md)
- [../../docs/cli-security-model.md](../../docs/cli-security-model.md)

Implemented:

- `contextarr validate <path>`
- `--format text|json`
- `--json` stable CLI result envelopes on implemented commands
- `--agent` stable JSON mode on implemented commands
- `--dry-run` for current `render`, `export`, and `import` commands
- `--yes` confirmation for write commands in `--agent` mode
- child pack directory validation, such as `contextarr validate demo-packs`
- `contextarr render <path> --out <path>`
- `contextarr export <path> --profile <profile-id> --out <path>`
- `contextarr export <path> --target <target> --out <path>` for targets already declared by existing export profiles
- `contextarr export <path> --all --out <path>`
- `contextarr inspect <pack-id-or-path>`
- `contextarr list packs|records|sources|exports`
- `contextarr rescan`
- `contextarr health <pack-id-or-path>` and `contextarr health --all`
- `contextarr review list` and `contextarr review show <review-item-id>`
- `contextarr query <pack-id> "query"` and `contextarr query --all "query"`
- `contextarr brief <pack-id-or-path> --for <target> --task "..."`
- `contextarr import <path> --kind <kind> --out <path>`
- `contextarr benchmark run <task-id> --sample-only`
- `contextarr benchmark report <task-id> --out <path>`
- `contextarr benchmark gate <task-id> --sample-only`
- `contextarr benchmark gate --all --sample-only`

Current export target aliases are limited to existing profile targets declared by the pack:

```bash
contextarr export demo-packs/ai-workstation-pack --target chatgpt --out generated-exports/ai-workstation
contextarr export demo-packs/ai-workstation-pack --target claude --out generated-exports/ai-workstation
contextarr export demo-packs/ai-workstation-pack --target codex --out generated-exports/ai-workstation
contextarr export demo-packs/ai-workstation-pack --target markdown --out generated-exports/ai-workstation
contextarr export demo-packs/ai-workstation-pack --target json_records --out generated-exports/ai-workstation
```

The validator, inspect/list/rescan/health/review/query/brief commands are read-only with respect to pack source files. Render and export commands write generated artifacts to the requested output folder and never mutate source pack files. Import writes generated draft packs only. Benchmark run and gate without `--out` are read-only; benchmark report and benchmark gate with `--out` write local derived JSON and Markdown reports only.

Current implementation note: `--format json` is kept as a legacy raw JSON path where it already existed. `--json` and `--agent` use the stable `contextarr.cli-result.v1` envelope for implemented commands. `--target` resolves only to existing export profile `target` values in the selected pack. Read-only index commands build a temporary derived SQLite index from `--packs` or `CONTEXTARR_PACKS_DIR`; they do not call MCP or the API. Benchmark commands are local and deterministic; they do not call external AI APIs, fetch remote sources, add telemetry, add CI enforcement, add public release automation, or use registry behavior. Full privacy overrides, generated target artifacts, mutating review commands, quarantine commands, and future command families remain planned until implementation status says otherwise.

Implementation rules:

- CLI commands should call shared core functions.
- CLI must not shell out to MCP, the API, or the Web UI.
- CLI must not execute pack content, Skills, Agent Kits, or shell snippets from packs.
- Agent-facing output should be redacted, approved-content-only, bounded, deterministic, and machine-readable as those gates are implemented.
