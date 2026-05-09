# Known Issues

This list tracks known v1 core readiness gaps. It is not a roadmap expansion request.

## Current Gaps

- Backup/restore is planned by decision record but not implemented.
- Context Pack collectors are planned by decision record but not implemented.
- Composer save-as-pack for Context Packs is planned by decision record but not implemented.
- Screenshots are placeholders only.
- Docker Compose is a local preview path, not a hardened production deployment.
- Skills and Agent Kits exist as advanced-preview work but are frozen behind the v1 bridge PRD gate.

## Not Bugs

- SQLite can be deleted and rebuilt.
- Ignored generated exports, rendered output, local databases, imported drafts, and local Agent Kits should not appear in Git.
- API token auth is optional in local development and disabled when `CONTEXTARR_API_TOKEN` is empty.

