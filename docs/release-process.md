# Release Process

This repository is preparing for v1.0 core readiness. These steps describe local release preparation only. They do not publish packages, create tags, create GitHub releases, deploy cloud services, or push marketplace content.

## Release Candidate Gate

```bash
pnpm v1-core:verify
pnpm compatibility:verify
pnpm security:verify
pnpm backup:verify
pnpm docker:verify
pnpm release:verify
git status --short --branch
```

All checks must pass before a v1.0 release candidate can be proposed.

## Manual Review

- Confirm README commands are current.
- Confirm demo packs validate with 0 errors and 0 warnings.
- Confirm no ignored local outputs are staged.
- Confirm Docker preview opens at `http://127.0.0.1:3210`.
- Confirm Library, Pack Detail, Exports, Composer, Health, and Review Queue work with demo packs.
- Confirm MCP docs still use `pnpm contextarr-mcp` and stdio-only boundaries.
- Confirm Skills and Agent Kits remain frozen behind the v1 bridge PRD gate.

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
