# Schema Versioning Policy

Status: v1 core contract candidate.

Contextarr v1.0 needs stable Context Pack files and deterministic validation reports. This document defines the default policy until a formal v1 schema freeze is complete.

## Versioned Surfaces

Versioned core surfaces:

- Context Pack manifest.
- Record frontmatter.
- Source map.
- Export profile YAML.
- Validation, redaction, and freshness rules.
- `contextarr.validation-report.v1`.

## Compatibility Rules

Before v1.0:

- Additive fields are allowed when they have safe defaults.
- Required fields need migration notes and compatibility tests.
- Deprecated fields should warn before removal.
- Breaking changes require fixture updates and a migration guide.

After v1.0:

- No breaking schema change without a major version process.
- Additive fields remain preferred.
- Validation report changes must preserve automation-friendly determinism.

## Validation Report Stability

`contextarr.validation-report.v1` should remain stable through v1.0.

Any change to report shape must document:

- field added, changed, or removed
- compatibility effect
- migration guidance
- fixture coverage

## Export Target Policy

Canonical Context Pack export targets:

- `chatgpt`
- `claude`
- `codex`
- `generic_markdown`
- `json`
- `agents_md`
- `claude_md`
- `llms_txt`

Compatibility aliases may remain in UI/API paths, but source YAML should use canonical targets.

## Frozen Expansion Rule

The v1 bridge PRD freezes further Skills and Agent Kit expansion until Context Pack core v1.0 readiness is explicitly accepted or superseded by a decision record.

Do not use schema versioning work to introduce Phase 29 registry behavior, marketplace behavior, executable behavior, or new product objects.

