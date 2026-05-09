# Context Pack Schema v1 Candidate

Status: v1.0 schema freeze candidate.

This document describes the Context Pack file contract targeted for v1.0 stabilization. It does not add new product objects and does not expand Skills, Agent Kits, registry behavior, marketplace behavior, or runtime execution.

## Source Files

A v1 Context Pack is a local folder. Files are source of truth.

Required core files:

- `contextarr-pack.json`
- `records/*.md`
- `sources/sources.yaml`
- `exports/*.yaml`
- `rules/validation.yaml`
- `rules/redaction.yaml`
- `rules/freshness.yaml`

Recommended documentation files:

- `README.md`
- `CHANGELOG.md`
- `LICENSE`

Missing or minimal docs may warn depending on validator rules, but docs should be present before v1 release.

## Manifest

`contextarr-pack.json` defines identity, safety posture, paths, compatibility, and UI metadata.

Required v1 safety fields:

- `containsExecutableCode: false`
- `requiresNetwork: false`
- `permissions.runCommands: false`
- `permissions.networkAccess: false`

The manifest may include additive metadata through passthrough fields, but new required fields must go through migration review before v1.

## Records

Records are Markdown files with frontmatter.

Required record frontmatter includes:

- `id`
- `title`
- `type`
- `pack`
- `tags`
- `confidence`
- `source_status`
- `freshness`
- `privacy`
- `sources`
- `review_status`

The record body is Markdown. It is rendered through the sanitized renderer and must not contain executable behavior.

## Sources

Source maps live at `sources/sources.yaml`.

v1 source metadata should support:

- `id`
- `type`
- `title`
- `url` or `path`
- `retrieved_at`
- `license`
- `license_url`
- `license_status`
- `license_notes`
- `content_hash_algorithm`
- `content_hash`
- `hash_calculated_at`
- `last_checked_at`
- `stale_after_days`
- `stale_reason`
- `trust`
- `status`

License status is validator-derived when possible. Missing, unknown, and risky licenses must remain distinguishable in validation summaries.

## Export Profiles

Canonical v1 Context Pack export targets:

- `chatgpt`
- `claude`
- `codex`
- `generic_markdown`
- `json`
- `agents_md`
- `claude_md`
- `llms_txt`

Profiles should include explicit record selection where practical, privacy mode, excluded tags, token budget, and sections.

## Rules

Rules stay data-only:

- validation rules
- redaction rules
- freshness rules

Rules must not execute code, run shell commands, fetch URLs, or call external services.

## Validation Report

`contextarr.validation-report.v1` is the v1 automation contract for validation output.

The report must remain deterministic for the same input files and fixed current date.

## Freeze Rules

- Additive optional fields are allowed with safe defaults.
- Required fields need migration notes and compatibility tests.
- Deprecated fields must warn before removal.
- Breaking changes before v1 require a migration guide and fixture coverage.
- Breaking changes after v1 require a major version process.

