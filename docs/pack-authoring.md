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

## Validate

```bash
pnpm --filter @contextarr/cli contextarr validate path/to/my-pack
```

Validation is read-only. It does not normalize files, execute scripts, fetch URLs, or rewrite pack content.

## Authoring Rules

- Use fake or public-safe data for public examples.
- Keep pack files data-only.
- Set `containsExecutableCode` and `requiresNetwork` to `false` for v0 activation.
- Do not include credentials, private keys, API tokens, recovery material, or real private data.
- Mark drafts and imports as private/unapproved until reviewed.
