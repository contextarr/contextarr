# Context Pack Restore

Status: v1 core backup/restore v0.

Restore is validation-first and quarantine-only. Contextarr does not automatically activate restored packs.

## Restore Command

```bash
pnpm --filter @contextarr/cli contextarr restore data/backups/local-demo-backup --out data/restored-packs
```

The restore output is:

```text
data/restored-packs/
  local-demo-backup/
    restore-report.json
    <pack-id>/
      contextarr-pack.json
      records/
      sources/
      exports/
      rules/
```

## Restore Checks

Restore performs these checks before writing a report:

- Reads `contextarr-backup.json`.
- Verifies `contextarr-backup.sha256`.
- Verifies every backed-up file against its SHA-256.
- Verifies each pack manifest checksum.
- Copies files into the requested quarantine output root.
- Runs the Context Pack validator on each restored pack.
- Writes `restore-report.json`.

The restore report records:

- `schemaVersion: contextarr.restore-report.v1`
- `status: restored_to_quarantine` or `restored_with_validation_errors`
- checksum status for every restored pack
- validation summary and issues
- manual review requirement
- `automaticActivation: false`

## Activation Boundary

Restored packs are local quarantined files. To activate them later, a human must review the restore report, validate the pack, and intentionally move or copy the pack into the configured active packs directory.

Contextarr restore v0 does not:

- overwrite active packs
- write into the configured active packs directory by default
- mutate existing packs
- fetch URLs
- execute files
- run scripts
- install packages
- call AI APIs
- publish packages
- sync to cloud
- create registry entries
- sign artifacts

## Failure Modes

Restore fails before activation if:

- the backup directory is unreadable
- the backup manifest is missing
- the backup manifest checksum is missing or wrong
- any file checksum does not match
- a backup path attempts to escape the backup root
- the restore output already exists

Validation errors after copying keep the restored files quarantined and are reported in `restore-report.json`.

## Recommended Review Flow

1. Restore into an ignored local folder such as `data/restored-packs`.
2. Read `restore-report.json`.
3. Run:

```bash
pnpm --filter @contextarr/cli contextarr validate data/restored-packs/<backup-id> --json
```

4. Review warnings, source freshness, license status, and export readiness.
5. Only after review, manually copy approved packs into the active packs directory.
