# Contextarr Release Checklist

This checklist prepares `v0.1.0-alpha.1`. It does not publish, tag, deploy, create a GitHub release, or push marketplace content by itself.

## Required Checks

```bash
pnpm install
pnpm docs:verify
pnpm demo:validate
pnpm v1-core:verify
pnpm v1-core:idempotent
pnpm advanced-preview:verify
pnpm limitations:verify
pnpm screenshots:verify
pnpm exports:verify
pnpm exposure:verify
pnpm trust-loop:verify
pnpm compatibility:verify
pnpm security:verify
pnpm site:verify
pnpm backup:verify
pnpm composer:verify
pnpm release:verify
git status --short --branch
```

## Manual Smoke

- Open `http://127.0.0.1:3210` through Docker Compose.
- Confirm the Library shows the demo pack set, including 12 curated starter Context Packs.
- Confirm legacy/non-starter demo packs do not present as marketplace listings.
- Open AI Workstation Pack.
- Open one starter Context Pack.
- Open one record detail page and confirm the source map is visible.
- Preview a Codex export.
- Build a Composer preview.
- Save a Composer draft pack and confirm it lands under `composed-packs/` without appearing in the active Pack Library.
- Open Pack Health and Review Queue.
- Open Review Queue -> Draft Intake and confirm draft/composed/quarantine candidates show metadata, activation plans, dry-run proof, and only proof-gated local activation; no publish, export exposure, or MCP exposure action should be present.
- Open Collectors, preview a Context Pack collector draft, and confirm a created draft lands under `draft-packs/` without appearing in the active Pack Library.
- Run `pnpm --filter @contextarr/cli contextarr review-candidates --format json` and confirm it returns sanitized labels without local absolute paths or record bodies.
- If `CONTEXTARR_ENABLE_LOCAL_IMPORTS=true`, confirm the preserved local Skill import lane still previews/imports only private draft Skills under `imported-skills/`.
- Confirm all demo packs validate with zero errors.
- Confirm starter Context Pack exports are deterministic, redaction-aware, and path-free with `pnpm exports:verify`.
- Confirm active Context Pack Exposure Readiness stays read-only, path-redacted, and visible in CLI inspect plus pack detail with `pnpm exposure:verify`.
- Confirm Draft Intake, composed drafts, restored quarantine packs, private/secret records, and `never_export` records stay out of MCP/default export preview exposure with `pnpm trust-loop:verify`.
- Confirm draft/import/restore/compose/collector outputs remain review-bound and absent from active API/export/search surfaces.
- Create a local backup, restore it into quarantine, and confirm the restore report shows no automatic activation.
- Confirm the Astro public site builds through `pnpm site:verify`.

## Alpha Release Artifact

The `v0.1.0-alpha.1` release notes should include:

- Known limitations.
- Install path.
- Demo flow.
- Verification commands.
- Reviewed screenshot set.
- Trust-loop MCP/default export preview proof.
- Security boundaries.
- No support guarantee yet.
- No public registry or marketplace.
- No npm publish unless explicitly approved.

## Screenshot Requirements

Do not commit generated screenshots unless they are intentionally reviewed and approved. The reviewed alpha screenshot set is under `docs/screenshots/v0.1.0-alpha.1/` and must pass `pnpm screenshots:verify`. The alpha screenshot set covers:

- Pack Library grid.
- Dense table.
- Pack detail.
- Record detail with source map.
- Pack Health.
- Export preview.
- MCP or CLI output.
- Backup or security boundary view.

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
- Confirm Skills and Agent Kits remain advanced-preview, data-only, and frozen behind the v1 bridge gate unless explicitly superseded.
