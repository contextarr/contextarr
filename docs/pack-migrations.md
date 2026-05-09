# Pack Migrations

Pack migrations are planned as explicit, reviewable file transformations. They are not automatic background rewrites.

## v1 Migration Rules

- Validate before migration.
- Write migrated output to a draft or review root, not directly over the source pack.
- Preserve original record IDs when possible.
- Preserve source references and source metadata.
- Preserve export profile intent while normalizing canonical targets.
- Re-run `contextarr validate <path> --json` after migration.
- Activate only after validation and review.

## Canonical Export Targets

Context Pack export profiles should use:

- `chatgpt`
- `claude`
- `codex`
- `generic_markdown`
- `json`
- `agents_md`
- `claude_md`
- `llms_txt`

The older `json_records` name remains a compatibility alias where already shipped in UI/API flows, but new Context Pack profile YAML should use `json`.

## Non-Goals

- No silent migrations.
- No mutation during validation.
- No remote fetches.
- No script execution.
- No registry activation.

