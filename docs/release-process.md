# Release Process

This repository is preparing for `v0.1.0-alpha.1` developer preview. These steps describe local release preparation only. They do not publish packages, create tags, create GitHub releases, deploy cloud services, or push registry or marketplace content.

## Alpha Candidate Gate

```bash
pnpm docs:verify
pnpm demo:validate
pnpm v1-core:verify
pnpm compatibility:verify
pnpm security:verify
pnpm site:verify
pnpm backup:verify
pnpm docker:verify
pnpm release:verify
git status --short --branch
```

All checks must pass before an alpha release candidate can be proposed.

## Manual Review

- Confirm README commands are current.
- Confirm demo packs validate with 0 errors and 0 warnings.
- Confirm the 12 starter Context Packs are clearly local examples, not marketplace listings.
- Confirm no ignored local outputs are staged.
- Confirm Docker preview opens at `http://127.0.0.1:3210`.
- Confirm Library, Pack Detail, Exports, Composer, Health, and Review Queue work with demo packs.
- Confirm MCP docs still use `pnpm contextarr-mcp` and stdio-only boundaries.
- Confirm the Astro site builds and does not claim production readiness.
- Confirm Skills and Agent Kits remain advanced-preview, data-only, and frozen behind the v1 bridge gate.
- Confirm known limitations and screenshot placeholders are current.

## Release Notes Must Include

- Known limitations.
- Install path.
- Demo flow.
- Verification commands.
- Screenshot requirements.
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
