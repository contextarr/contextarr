# 0001: Backup And Restore Format

Status: Accepted for v1 planning, not implemented.

## Context

The v1 bridge PRD requires Context Pack core to be recoverable before further Skills, Agent Kit, registry, or signing expansion. Backup and restore must preserve file-backed source truth without making SQLite authoritative.

## Decision

- Backup/restore is local only.
- Backup artifacts are explicit user-created files, not cloud sync.
- Backup format is a portable archive containing Context Pack folders, metadata, manifest checksums, and a restore report.
- SQLite databases are not authoritative backup content; they may be excluded or treated as disposable cache.
- Restore validates every pack before activation.
- Restored packs enter review or quarantine when validation, freshness, license, or security checks require it.
- Restore never overwrites an active pack without an explicit future overwrite policy.
- Restore never fetches URLs, installs packages, executes files, runs scripts, or calls AI APIs.

## Consequences

- A future implementation must add a validation-before-activation restore path.
- Restored pack review state must be deterministic and explainable.
- Backup artifacts can be inspected without Contextarr running.
- Registry, signing, and marketplace decisions remain separate.

## Non-Goals

- No hosted backup service.
- No cloud sync.
- No automatic restore activation.
- No signing implementation in this decision.
- No registry behavior.

