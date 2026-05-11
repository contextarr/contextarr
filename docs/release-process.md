# Release Process

This repository is preparing for `v0.1.0-alpha.1` developer preview. These steps describe local release preparation only. They do not publish packages, create tags, create GitHub releases, deploy cloud services, or push registry or marketplace content.

## Alpha Candidate Gate

```bash
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
pnpm docker:verify
pnpm release:verify
git status --short --branch
```

All checks must pass before an alpha release candidate can be proposed.

Latest recorded checkpoint for `v0.1.0-alpha.1`: on branch `codex/contextarr-overnight-alpha`, the Stage 1 release gate passed, `pnpm release:verify` passed, and `pnpm docs:verify` plus `pnpm screenshots:verify` passed after the checkpoint. This checkpoint did not push, tag, create a GitHub release, deploy, publish a package, update a registry or marketplace, or enable telemetry.

## Manual Review

- Confirm README commands are current.
- Confirm demo packs validate with 0 errors and 0 warnings.
- Confirm the 12 starter Context Packs are clearly local examples, not marketplace listings.
- Confirm starter Context Pack exports pass deterministic, redaction-aware checks with `pnpm exports:verify`.
- Confirm Exposure Readiness reports remain read-only and path-redacted with `pnpm exposure:verify`.
- Confirm Draft Intake, composed drafts, restored quarantine packs, private/secret records, and `never_export` records stay out of MCP/default export preview exposure with `pnpm trust-loop:verify`.
- Confirm CLI/API path-safety and draft/quarantine boundary tests are included in the latest test run.
- Confirm no ignored local outputs are staged.
- Confirm Docker preview opens at `http://127.0.0.1:3210`, or record the alternate local port if an existing `contextarr-app-1` occupies `3210`.
- Confirm the live Docker smoke loads the static UI, returns ok from `/api/health`, reports `authRequired: true`, shows 15 packs, shows 12 starters, reports `ai-workstation` health as healthy, shows 0 review items, shows 0 draft candidates, shows 4 collectors, and returns responses from the Codex export preview and Composer preview endpoints.
- Confirm any smoke-only container and volume are cleaned up after verification.
- Confirm Library, Pack Detail, Exports, Composer, Health, and Review Queue work with demo packs.
- Confirm MCP docs still use `pnpm contextarr-mcp` and stdio-only boundaries.
- Confirm the Astro site builds and does not claim production readiness.
- Confirm Skills and Agent Kits remain advanced-preview, data-only, and frozen behind the v1 bridge gate.
- Confirm known limitations and reviewed screenshot evidence are current.

## Release Notes Must Include

- Known limitations.
- Install path.
- Demo flow.
- Verification commands.
- Latest local gate evidence, including Docker smoke port and cleanup status.
- Reviewed screenshot requirements.
- Starter export determinism and review/quarantine proof.
- Trust-loop MCP/default export preview proof.
- Security boundaries.
- No support guarantee yet.
- No public registry or marketplace.

## Prohibited Without Explicit Approval

- No GitHub release.
- No tag.
- No package publishing.
- No public deployment.
- No public registry.
- No public marketplace.
- No marketplace listing.
- No signing implementation.
- No hosted cloud service.
- No telemetry.
