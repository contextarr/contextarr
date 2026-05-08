# Contextarr Pack Authoring

A Contextarr pack is a local, non-executable folder that can be validated, indexed, rendered, exported, and exposed through read-only MCP.

## Required Shape

```text
my-pack/
  contextarr-pack.json
  README.md
  CHANGELOG.md
  LICENSE
  records/
  sources/sources.yaml
  exports/
  rules/validation.yaml
  rules/redaction.yaml
  rules/freshness.yaml
```

Records are Markdown files with frontmatter. Each record ID must be unique, must reference its pack ID, and should reference known sources from `sources/sources.yaml`.

Sources should include clear provenance. Phase 24R supports optional source license, hash, and freshness metadata such as `license_status`, `content_hash`, `last_checked_at`, and `stale_after_days`. These fields are validated and indexed as derived readiness signals; Contextarr does not fetch source URLs or calculate hashes during validation.

## Validate

```bash
pnpm --filter @contextarr/cli contextarr validate path/to/my-pack
pnpm --filter @contextarr/cli contextarr validate path/to/my-pack --json
```

Validation is read-only. It does not normalize files, execute scripts, fetch URLs, calculate source hashes, or rewrite pack content. JSON output uses `contextarr.validation-report.v1` for deterministic automation.

Avoid absolute local paths in `sources/sources.yaml`. The validator warns on them, and public API/export responses strip unsafe local paths rather than exposing workstation layout.

## Authoring Rules

- Use fake or public-safe data for public examples.
- Keep pack files data-only.
- Set `containsExecutableCode` and `requiresNetwork` to `false` for v0 activation.
- Do not include credentials, private keys, API tokens, recovery material, or real private data.
- Mark drafts and imports as private/unapproved until reviewed.
