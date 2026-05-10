# Contributing to Contextarr

Contextarr is early-stage and still shaping its public contribution workflow. Issues and small pull requests are welcome when they stay inside the product boundaries.

Contextarr is a local-first Context Pack system for preparing trusted AI context. It validates, renders, redacts, exports, and exposes approved context through CLI, API, dashboard, and read-only MCP. It does not run agents.

## Product Boundaries

Please keep contributions local-first, data-only, non-executable, and reviewable.

Do not add:

- Hosted cloud vault behavior.
- Public marketplace or registry behavior.
- Remote install or auto-activation behavior.
- Executable packs, executable Skills, script packs, or Agent Kit runtime behavior.
- Agent runner behavior.
- Telemetry, product analytics, or hidden network calls.
- Direct Gmail, banking, brokerage, Slack, Google Drive, Jira, CRM, or other sensitive-account connectors.
- Demo content containing real private data.

Skills and Agent Kits are advanced-preview, data-only, non-executable, and frozen until Context Pack core stabilizes.

## Development

Install dependencies:

```bash
pnpm install
```

Recommended checks:

```bash
pnpm verify:core
pnpm verify:security
pnpm verify:release
```

Focused checks:

```bash
pnpm dev
pnpm demo:validate
pnpm docs:verify
pnpm typecheck
pnpm test
pnpm site:verify
```

Generated output belongs in ignored folders such as `rendered/`, `generated-exports/`, `imported-packs/`, `draft-packs/`, `composed-packs/`, `.contextarr-cache/`, and `data/`.

## Pull Requests

Keep pull requests scoped. Include tests for behavior changes and update docs when user-facing behavior or product boundaries change.

Before opening a PR:

- Confirm `pnpm verify:core` passes for normal product changes.
- Run `pnpm verify:security` for scanner, export, MCP, restore, activation, or privacy-sensitive changes.
- Run `pnpm verify:release` before release-candidate or public-surface stabilization changes.
- Explain any skipped check in the PR body.

Security-sensitive changes should explain the local-first and data-only impact clearly.
