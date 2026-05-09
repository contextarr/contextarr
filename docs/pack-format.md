# Contextarr Pack Format

Status note: Check [implementation-status.md](implementation-status.md) before treating schema fields, export targets, or safety gates as shipped.

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

Export profiles define target-specific output. Phase 8 supports ChatGPT, Claude, Codex, generic Markdown, and JSON records. See [export-profiles.md](export-profiles.md) for the adapter maturity matrix before treating any additional target as current.

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
