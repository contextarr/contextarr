# Contextarr Release Checklist

Phase 11 prepares for a public preview. It does not publish, tag, deploy, or create a GitHub release by itself.

## Required Checks

```bash
pnpm install
pnpm phase11:verify
pnpm v1-core:verify
pnpm compatibility:verify
pnpm security:verify
pnpm backup:verify
pnpm release:verify
```

Manual smoke:

- Open `http://127.0.0.1:3210` through Docker Compose.
- Confirm the Library shows 5 demo packs.
- Open AI Workstation Pack.
- Open one record detail page.
- Preview a Codex export.
- Build a Composer preview.
- Open Pack Health and Review Queue.
- Confirm all demo packs validate with zero errors.
- Create a local backup, restore it into quarantine, and confirm the restore report shows no automatic activation.

## Public Safety

- No real private data.
- No credentials or tokens.
- No generated local databases.
- No generated exports.
- No screenshot binaries unless intentionally reviewed.
- No Docker volumes committed.
- No package publishing.
- No GitHub release/tag unless explicitly approved.

## Before Publishing Later

- Confirm README links.
- Confirm SECURITY and CONTRIBUTING are current.
- Confirm MCP docs use `pnpm contextarr-mcp`.
- Confirm Docker quickstart works from a fresh clone.
- Confirm backup/restore docs describe quarantine-only restore and validation-before-activation.
- Confirm Skills, Agent Kits, signing implementation, and registry behavior remain frozen behind the v1 bridge PRD gate unless explicitly superseded.
