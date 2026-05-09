# Known Issues

This list tracks known v1 core readiness gaps. It is not a roadmap expansion request.

## Current Gaps

- Backup/restore v0 is CLI/core only. It creates local backup directories and restores to quarantine; it does not include a web UI, cloud sync, signing, compression, or automatic activation.
- Context Pack collectors v0 create local draft packs only. They do not activate packs, approve review status, or move drafts into the active pack directory.
- Composer save-as-draft-pack for Context Packs is implemented as a local draft workflow only. It does not activate, approve, or publish composed packs.
- Screenshots are placeholders only.
- Docker Compose is a local preview path, not a hardened production deployment.
- Skills and Agent Kits exist as advanced-preview work but are frozen behind the v1 bridge PRD gate.

## Not Bugs

- SQLite can be deleted and rebuilt.
- Ignored generated exports, rendered output, local databases, imported drafts, and local Agent Kits should not appear in Git.
- API token auth is optional for loopback local development and required for non-loopback binds.
