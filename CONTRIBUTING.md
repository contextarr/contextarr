# Contributing to Contextarr

Contextarr is early-stage and still shaping its public contribution workflow. Issues and small pull requests are welcome when they stay inside the product boundaries.

Start by checking [docs/implementation-status.md](docs/implementation-status.md). Roadmap docs may describe target behavior that is not shipped yet.

## Product Boundaries

Contextarr is a self-hosted context automation system and pack manager for AI assistants and agents. The core object is the Context Pack.

Please keep contributions local-first, data-only, non-executable, and reviewable.

Do not add:

- Hosted cloud vault behavior.
- Public marketplace or registry behavior.
- Executable packs or script packs.
- Agent runner behavior.
- Telemetry.
- Direct Gmail, banking, brokerage, or other sensitive account connectors.
- Demo content containing real private data.

## Development

Install dependencies and run verification:

```bash
pnpm install
pnpm phase12:verify
```

Focused checks are also available:

```bash
pnpm typecheck
pnpm test
pnpm demo:validate
pnpm docs:verify
```

Generated output belongs in ignored folders such as `rendered/`, `generated-exports/`, `imported-packs/`, and `data/`.

## Issues

Use the issue templates for bugs, feature requests, docs problems, and security boundary questions. Blank issues are allowed while the project is young.

Do not include secrets, credentials, tokens, private keys, real private data, customer data, company data, medical data, or financial data in issues.

## Pull Requests

Keep pull requests scoped. Include tests for behavior changes and update docs when user-facing behavior or product boundaries change.

Security-sensitive changes should explain the local-first and data-only impact clearly. Pull requests that touch CLI writes, importers, MCP, API auth, export privacy, or pack validation should call out the trust boundary they affect.

Good first pull requests are usually docs fixes, test fixture improvements, demo pack corrections, and small CLI or validation bugs. Avoid large rewrites until the project has more stable contributor workflow.
