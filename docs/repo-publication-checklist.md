# Repository Publication Checklist

This checklist tracks public repository readiness for Contextarr.

Last local audit: 2026-05-09.

## Current Status

| Area | Status | Done | Notes |
|---|---|---:|---|
| README | Updated | Yes | Public landing page clarified and shortened. |
| License | Present | Yes | Apache 2.0. |
| Security policy | Present | Yes | Private vulnerability reporting path documented. |
| Contributing guide | Present | Yes | Keep aligned with PR and issue templates. |
| Code of conduct | Present | Yes | Standard community baseline. |
| Changelog | Added | Yes | Starts with `Unreleased`; no fake historical releases. |
| CI | Added | Yes | GitHub Actions workflow runs `pnpm phase11:verify`. `phase12:verify` has a docs-only diff guard and is not a general PR verifier. |
| Issue templates | Added | Yes | Bug, feature, docs, and security boundary forms. |
| PR template | Added | Yes | Includes verification and security/privacy checklists. |
| Docs index | Added | Yes | `docs/index.md` is the docs landing page. |
| Configuration doc | Added | Yes | Runtime, env vars, ports, scripts, and Docker status. |
| API doc | Added | Yes | Early alpha local API routes documented. |
| Support doc | Added | Yes | Realistic support expectations. |
| Threat model | Added | Yes | Lightweight model aligned with security docs. |
| Screenshots | Missing | No | Add reviewed UI screenshots after the dashboard visuals stabilize. |
| Social preview asset | Added locally | No | `docs/assets/social-preview.svg` exists, but GitHub repo settings must be updated manually. |
| First release | Not created | No | Prepare `v0.1.0-alpha.1` after CI passes from a clean checkout. |
| Tags | None | No | Do not claim releases until a tag and release exist. |
| Docker Compose | Functional local preview | Yes | Not a hosted deployment recipe. Keep docs scoped to local preview. |
| Branch protection | Manual | No | Protect `main` after CI is active. |
| Dependabot config | Added | Yes | npm and GitHub Actions weekly updates. |
| Dependabot alerts | Manual | No | Enable in GitHub settings. |
| Secret scanning | Manual | No | Enable if available for the repository. |
| Labels | Manual cleanup | No | Read-only check found both `good first issue` and `good-first-issue`. Remove the duplicate. |
| Milestones | Manual | No | No milestones found during read-only check. |
| Discussions | Off | Yes | Keep off until there is actual user activity. |
| Wiki | Off | Yes | Keep docs in repo. |

## Manual GitHub Settings

These cannot be completed by local file changes alone.

1. Add the social preview image:
   - Use `docs/assets/social-preview.svg` as the source design or export it to PNG if GitHub requires PNG.
2. Protect `main`:
   - Require pull requests before merge.
   - Require CI once `.github/workflows/ci.yml` is active.
   - Require branches to be up to date if the project wants a stricter merge queue later.
3. Enable security features:
   - Dependabot alerts.
   - Vulnerability alerts.
   - Secret scanning if available.
4. Clean up labels:
   - Remove duplicate `good-first-issue` if `good first issue` remains.
   - Keep a compact label set for phase, docs, security, exports, MCP, demo packs, and scope control.
5. Add milestones when useful:
   - `v0.1-alpha`
   - `v0.2-importers`
   - `v0.3-composer`
   - `v1.0-public-stable`
6. Create the first release only after a clean release run:
   - Candidate tag: `v0.1.0-alpha.1`
   - Use [release-draft-v0.1.0-alpha.1.md](release-draft-v0.1.0-alpha.1.md).
7. Leave Discussions off for now.
8. Leave Wiki off while docs live in the repository.
9. Use a lightweight GitHub Project only if issues outgrow the roadmap docs.

## Future Cleanup Tasks

- Add reviewed screenshots under `docs/assets/screenshots/` and link them from the README.
- Refresh the release draft with exact verification output from a clean checkout.
- Consider adding a focused `pnpm repo:verify` script that wraps the intended public-repo checks without relying on historical phase names.
- Add a short demo video only after the UI flow and first alpha install path are stable.
- Review whether the public project site under `apps/site` should be part of the first release branch.
