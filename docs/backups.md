# Context Pack Backups

Status: v1 core backup/restore v0.

Contextarr backups are local, explicit, inspectable artifacts for Context Packs. They are not cloud sync, registry publishing, signing, marketplace distribution, or runtime activation.

## What A Backup Contains

`contextarr backup <path> --out <dir>` creates a directory backup:

```text
<out>/
  <backup-id>/
    contextarr-backup.json
    contextarr-backup.sha256
    packs/
      <pack-id>/
        contextarr-pack.json
        records/
        sources/
        exports/
        rules/
```

The backup manifest records:

- `schemaVersion: contextarr.backup.v1`
- backup id and creation time
- source path used for the local backup
- Context Pack metadata
- per-pack manifest SHA-256
- per-file SHA-256, byte length, and relative path
- validation summary and export-readiness metadata
- `sqliteIncluded: false`
- `automaticActivation: false`

SQLite is intentionally excluded because it is derived and rebuildable from pack files.

## Create A Backup

Back up all child packs under `demo-packs`:

```bash
pnpm --filter @contextarr/cli contextarr backup demo-packs --out data/backups
```

Use a deterministic id for smoke tests or handoff:

```bash
pnpm --filter @contextarr/cli contextarr backup demo-packs --out data/backups --backup-id local-demo-backup --format json
```

The command validates every pack before writing the backup. Invalid packs fail the backup rather than being silently preserved as active-ready content.

## Safety Rules

- Local filesystem only.
- No hosted backup service.
- No cloud sync.
- No signing implementation.
- No registry behavior.
- No marketplace behavior.
- No scripts are run.
- No URLs are fetched.
- No packages are installed.
- No AI APIs are called.
- No SQLite database is treated as source of truth.
- Existing backup directories are not overwritten.

## Verification

Run the focused backup gate:

```bash
pnpm backup:verify
```

This creates a temporary ignored backup under `.contextarr-cache/backup-smoke`, restores it into quarantine, validates the restored packs, and checks the backup and restore metadata.

## Git Hygiene

Backup artifacts belong under ignored local folders such as `data/` or `.contextarr-cache/`. Do not commit generated backups, restored quarantine folders, local databases, secrets, private data, or checksum artifacts created from private packs.
