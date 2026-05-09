# Contextarr Export Profiles

Status note: Check [implementation-status.md](implementation-status.md) before treating export targets or export gates as shipped.

Export profiles define how validated pack records are turned into local artifacts for AI assistants and agents.

Export profiles are shared core logic. CLI, API previews, Web UI export flows, MCP export previews, Composer previews, and future `contextarr brief` behavior should reuse the same export and redaction rules rather than shelling out to another surface.

## Current v0.1 Targets

- ChatGPT.
- Claude.
- Codex.
- Generic Markdown.
- JSON records.

Current CLI target aliases map only to export profiles that already exist in a pack:

| Target alias | Existing profile target | Typical output |
|---|---|---|
| `chatgpt` | `chatgpt` | Markdown export shaped for ChatGPT. |
| `claude` | `claude` | Markdown export shaped for Claude. |
| `codex` | `codex` | Markdown export shaped for Codex/Codex CLI task context. |
| `markdown` | `markdown` | Generic Markdown handoff. |
| `json_records` | `json_records` | JSON record bundle. |

## Planned Targets

- Claude Code.
- AGENTS.md.
- CLAUDE.md.
- llms.txt.

## Adapter Maturity Matrix

| Adapter or target | Maturity | Notes |
|---|---|---|
| ChatGPT | Current | Implemented through pack-declared export profiles. |
| Claude | Current | Implemented through pack-declared export profiles. |
| Codex | Current | Implemented through pack-declared export profiles. |
| Generic Markdown | Current | Implemented through pack-declared export profiles. |
| JSON records | Current | Implemented through pack-declared export profiles. |
| Claude Code | Planned | Target-quality work only; no generated `CLAUDE.md` artifact yet. |
| AGENTS.md | Planned | Future generated instruction artifact; not a current profile alias. |
| CLAUDE.md | Planned | Future generated instruction artifact; not a current profile alias. |
| llms.txt | Planned | Public site may publish llms files, but pack export does not generate them yet. |
| Export history and diff | Post-core | Useful after approved-content gates are complete. |
| OpenCode, Cursor, Open WebUI, AnythingLLM, Hermes, OpenClaw, CSV | Deferred | Mentioned as possible adapters only. Do not implement until explicitly scoped. |
| Public registry or marketplace distribution | Rejected for current release | Requires separate trust, signing, scanner, quarantine, and revocation work. |

## Behavior

Exports select records from a validated local pack, preserve configured order, apply privacy mode, apply redaction rules, include source summaries, and return warnings for token budget estimates. They do not truncate content in v0.1.

Composer uses the same export engine to build temporary custom exports across selected records from one or more packs.

## CLI

```bash
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --profile ai-workstation-codex --out generated-exports/ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --target codex --out generated-exports/ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs --all --out generated-exports/demo-packs
```

`--profile` remains the explicit profile id path. `--target` is a convenience alias that resolves the selected pack's existing profile whose `target` field matches the requested value.

Target alias examples for current demo-pack targets:

```bash
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --target chatgpt --out generated-exports/ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --target claude --out generated-exports/ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --target codex --out generated-exports/ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --target markdown --out generated-exports/ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --target json_records --out generated-exports/ai-workstation
```

All current demo packs declare the same five target aliases:

| Demo pack | Current target aliases |
|---|---|
| `ai-workstation-pack` | `chatgpt`, `claude`, `codex`, `markdown`, `json_records` |
| `claude-code-project-pack` | `chatgpt`, `claude`, `codex`, `markdown`, `json_records` |
| `fake-product-line-pack` | `chatgpt`, `claude`, `codex`, `markdown`, `json_records` |
| `internal-support-kb-pack` | `chatgpt`, `claude`, `codex`, `markdown`, `json_records` |
| `jellyfin-server-pack` | `chatgpt`, `claude`, `codex`, `markdown`, `json_records` |

Aliases such as `agents-md`, `claude-md`, and `llms-txt` are planned target artifacts, not current profile aliases.

Generated files belong under ignored local folders such as `generated-exports/`.

## Safety

Exports must not mutate pack files, fetch URLs, call AI APIs, upload data, execute pack content, or bypass redaction rules.
