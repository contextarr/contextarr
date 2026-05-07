# Contextarr Pack Format

## Summary

A Contextarr pack is a non-executable local folder containing metadata, records, source maps, export profiles, validation rules, redaction rules, freshness rules, assets, and examples.

## Recommended Pack Folder

```text
packs/
  example-pack/
    contextarr-pack.json
    README.md
    CHANGELOG.md
    LICENSE
    records/
    sources/
      sources.yaml
    collectors/
    exports/
    rules/
      validation.yaml
      redaction.yaml
      freshness.yaml
    assets/
    examples/
```

## Manifest

Every pack must include `contextarr-pack.json`. The manifest describes identity, version, visibility, trust level, permissions, paths, assets, compatibility, and safety declarations.

Required v0 safety fields include:

- `containsExecutableCode: false`
- `requiresNetwork: false`
- `permissions.runCommands: false`
- `permissions.networkAccess: false`

## Records

Records are Markdown files with structured frontmatter. They should contain stable IDs, titles, types, tags, confidence, source status, freshness, privacy, source references, and review status.

## Sources

Sources live in `sources/sources.yaml`. Source maps connect pack records to local files, public URLs, manual notes, exports, or other provenance records.

## Export Profiles

Export profiles define target-specific output. Supported targets are later-phase work and include ChatGPT, Claude, Codex, Claude Code, OpenCode, Cursor, Open WebUI, AnythingLLM, Hermes, OpenClaw, generic Markdown, JSON, CSV, and llms.txt-style output.

## Rules

Rule files are data-only:

- `rules/validation.yaml`
- `rules/redaction.yaml`
- `rules/freshness.yaml`

Rules may describe required fields, redaction patterns, and freshness windows. They must not execute code.

## v0 Constraints

- No scripts.
- No shell commands.
- No arbitrary network calls.
- No credentials.
- No hidden actions.
- No remote install by default.
- No executable pack support.
