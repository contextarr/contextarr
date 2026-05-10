# Known Issues

Known issues are tracked separately from public launch limitations.

For launch-facing limitations, see [known-limitations.md](known-limitations.md).

## Current Gaps

- Backup/restore v0 is CLI/core only. It creates local backup directories and restores to quarantine; it does not include a web UI, cloud sync, signing, compression, or automatic activation.
- Context Pack collectors v0 create local draft packs only. They do not activate packs, approve review status, or move drafts into the active pack directory.
- Composer save-as-draft-pack for Context Packs is implemented as a local draft workflow only. It does not activate, approve, or publish composed packs.
- Draft Intake v0 is read-only metadata review. It does not include approve, promote, activate, or write-back actions.
- Reviewed alpha screenshots exist, but no demo video has been approved.
- Docker Compose is a local preview path, not a hardened production deployment.
- Skills and Agent Kits exist as advanced-preview data-only work but are frozen behind the v1 bridge gate.

## Not Bugs

- SQLite can be deleted and rebuilt.
- The repo currently contains 15 public-safe demo Context Packs, including 12 curated starter Context Packs and non-starter demo packs.
- Ignored generated exports, rendered output, local databases, imported drafts, restored packs, and local Agent Kits should not appear in Git.
- API token auth is optional for loopback local development and required for non-loopback binds.
