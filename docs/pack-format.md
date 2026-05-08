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

Phase 24R source metadata can include optional license and freshness fields:

- `license`, `license_url`, `license_status`, and `license_notes`.
- `content_hash_algorithm: sha256`, `content_hash`, and `hash_calculated_at`.
- `last_checked_at`, `stale_after_days`, and `stale_reason`.

The validator derives normalized source license status and stale-source counts from these fields. It does not fetch URLs or rewrite source metadata.

## Export Profiles

Export profiles define target-specific output. Context Pack profile YAML uses these canonical targets:

- `chatgpt`
- `claude`
- `codex`
- `generic_markdown`
- `json`
- `agents_md`
- `claude_md`
- `llms_txt`

`json_records` remains a compatibility alias in already-shipped Composer and Agent Kit API/UI flows, but new Context Pack export profile YAML should use `json`.

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
