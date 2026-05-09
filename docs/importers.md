# Contextarr Importers

## Summary

Phase 9 importers convert local inputs into generated draft pack folders. Phase 26 extends the same local importer package with draft Skill imports.

## Command

```bash
pnpm --filter @contextarr/cli contextarr import <path> --kind auto --out imported-packs/manual
```

Supported kinds:

- `auto`
- `folder`
- `markdown`
- `obsidian`
- `chatgpt`
- `claude`

## Skill Import Command

```bash
pnpm --filter @contextarr/cli contextarr import-skill <path> --kind auto --out imported-skills/manual
```

Supported Skill kinds:

- `auto`
- `folder`
- `markdown`
- `prompt-template`
- `claude-skill`
- `chatgpt-prompts`

Optional flags:

- `--skill-id <id>`
- `--name <name>`
- `--format text|json`
- `--max-docs <n>`
- `--overwrite`

Optional flags:

- `--pack-id <id>`
- `--name <name>`
- `--format text|json`
- `--max-records <n>`
- `--overwrite`

## Output

Pack imports write a draft pack at `<out>/<pack-id>/`. Imported records are private drafts tagged `imported_draft` and `never_export`.

Skill imports write a draft Skill at `<out>/<skill-id>/`. Imported Skill documents are private drafts with `review_status: draft`, `trustLevel: unreviewed`, and tags `imported_draft` and `never_export`.

The local API Skill import flow is disabled by default. Set `CONTEXTARR_ENABLE_LOCAL_IMPORTS=true` to enable `POST /api/import-skills/preview` and `POST /api/import-skills`. The API never accepts an output path; writes stay under `CONTEXTARR_IMPORTED_SKILLS_DIR`, default `./imported-skills`.

## Safety

Importers do not fetch URLs, execute files, call external APIs, call AI services, upload data, approve records or Skill documents, or mutate existing approved objects. Script-like files, executable extensions, unsafe filenames, shell-command patterns, and credential-like content are blocked from Skill imports.
