# Contextarr Export Profiles

Export profiles define how validated pack records, approved Skill documents, and Agent Kit pairings are turned into local artifacts for AI assistants and agents.

## Supported v0.1 Targets

- ChatGPT.
- Claude.
- Claude Code.
- Codex.
- Generic Markdown.
- JSON records.
- AGENTS.md.
- CLAUDE.md.
- llms.txt.

## Behavior

Pack exports select records from a validated local pack, preserve configured order, apply privacy mode, apply redaction rules, include source summaries without local filesystem paths, and return warnings for token budget estimates. Context Pack profile YAML uses canonical targets `chatgpt`, `claude`, `codex`, `generic_markdown`, `json`, `agents_md`, `claude_md`, and `llms_txt`; `json_records` is only a backward-compatible API/UI alias where already shipped. For Context Packs, `redacted` exports include public-safe records and exclude private, internal, sensitive, secret, and redaction-tagged records. Skill exports select approved instructions and examples from a validated local Skill, preserve profile order, exclude secret/private/draft material, omit local filesystem paths from source summaries, and return deterministic preview artifacts. Agent Kit exports merge profile-selected Context Pack records and Skill documents, strip local source paths, hard-exclude secret or `never_export` content, and keep Skills non-executable. Exports do not truncate content in v0.1.

Composer uses the same export engine to build temporary custom exports across selected records from one or more packs.

## CLI

```bash
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --profile ai-workstation-codex --out generated-exports/ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs --all --out generated-exports/demo-packs
pnpm --filter @contextarr/cli contextarr export demo-skills/support-ticket-writing-skill --profile support-ticket-writing-skill-codex --out generated-exports/support-ticket-writing-skill
pnpm --filter @contextarr/cli contextarr export demo-skills --all --out generated-exports/demo-skills
pnpm --filter @contextarr/cli contextarr export demo-agent-kits/support-ticket-writing-kit --profile support-ticket-writing-kit-codex --out generated-exports/support-ticket-writing-kit --context-packs-dir demo-packs --skills-dir demo-skills
```

Generated files belong under ignored local folders such as `generated-exports/`.

## Safety

Exports must not mutate pack, Skill, or Agent Kit files, fetch URLs, call AI APIs, upload data, execute pack or Skill content, run Agent Kits, or bypass redaction and review rules.
