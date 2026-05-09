# Contextarr Importers

## Summary

Phase 10 importers convert local inputs into generated draft pack folders. They are local-only and CLI/core-only.

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

Optional flags:

- `--pack-id <id>`
- `--name <name>`
- `--format text|json`
- `--max-records <n>`
- `--overwrite`

## Output

Imports write a draft pack at `<out>/<pack-id>/`. Imported records are private drafts tagged `imported_draft` and `never_export`.

## Safety

Importers do not fetch URLs, execute files, call external APIs, call AI services, upload data, approve records, or mutate existing packs.
