# Import Quarantine

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating quarantine state, commands, or activation flow as shipped.

## Purpose

Local import quarantine is the bridge between safe local importers and a future registry. It gives Contextarr a place to inspect untrusted artifacts before they become active, exportable, or MCP-visible.

This document is planning only. It does not implement commands. Current imports generate draft packs; quarantine state and activation are planned.

## Required Rules

- Every imported pack, local zip, future Skill, future Agent Kit, or registry artifact enters quarantine first.
- Quarantined items are not active.
- Quarantined items are not exportable by default.
- Quarantined items are not MCP-visible by default.
- Quarantined items must be validated.
- Quarantined items must be scanned when scanner exists.
- User must preview and approve activation.
- Critical findings block activation.
- Signature mismatch blocks activation, future registry.
- Revoked status blocks activation, future registry.
- Unknown license prevents verified status.
- User can delete quarantined item.

## Quarantine States

- `pending_validation`: artifact was received but not validated.
- `needs_review`: validation completed with warnings.
- `blocked`: critical finding prevents activation.
- `ready_to_activate`: no blockers remain, user approval still required.
- `activated`: user approved and the artifact became local active content.
- `deleted`: user removed the quarantined item.

## Future Commands

```bash
contextarr import <path> --quarantine
contextarr inspect <quarantine-id>
contextarr activate <quarantine-id>
contextarr block <quarantine-id>
contextarr delete-quarantine <quarantine-id>
```

Do not implement these commands in this task.

## Activation Rules

Activation requires:

- Valid schema.
- No executable or script content.
- No shell, network, or tool execution claim.
- No credential exposure.
- Source map present.
- License state visible.
- Critical redaction findings resolved.
- User preview completed.
- Human approval recorded locally.

Activation does not mean the artifact is verified by Contextarr. Local content can be active and still unverified.

## Export And MCP Rules

- Quarantined content is excluded from exports.
- Quarantined content is excluded from MCP.
- Activated imported content remains draft or unreviewed until records are approved.
- Draft records are excluded from default exports and MCP even after activation.
- Future registry artifacts still require local re-scan before use.

## UI Requirements

The quarantine UI should show:

- Artifact name, type, source path, and received time.
- Validation summary.
- Scanner summary when available.
- Signature status when available.
- License status.
- Files included.
- Records or objects that would be created.
- Activation blockers and warnings.
- Delete action.

## Acceptance Criteria

- There is no path from import to active trusted content without validation and user approval.
- Critical findings block activation.
- Draft/imported records remain untrusted after activation until reviewed.
- Future registry features can reuse the same local quarantine model.
