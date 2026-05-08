# Contextarr Export Profiles

Export profiles define how validated pack records are turned into local artifacts for AI assistants and agents.

## Supported v0.1 Targets

- ChatGPT.
- Claude.
- Codex.
- Generic Markdown.
- JSON records.

## Behavior

Exports select records from a validated local pack, preserve configured order, apply privacy mode, apply redaction rules, include source summaries, and return warnings for token budget estimates. They do not truncate content in v0.1.

Composer uses the same export engine to build temporary custom exports across selected records from one or more packs.

## CLI

```bash
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --profile ai-workstation-codex --out generated-exports/ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs --all --out generated-exports/demo-packs
```

Generated files belong under ignored local folders such as `generated-exports/`.

## Safety

Exports must not mutate pack files, fetch URLs, call AI APIs, upload data, execute pack content, or bypass redaction rules.
