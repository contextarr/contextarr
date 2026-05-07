# Contributing to Contextarr

Contextarr is early-stage and still shaping its public contribution workflow. Issues and small pull requests are welcome when they stay inside the product boundaries.

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
pnpm phase8:verify
```

Focused checks are also available:

```bash
pnpm typecheck
pnpm test
pnpm demo:validate
```

Generated output belongs in ignored folders such as `rendered/`, `generated-exports/`, and `data/`.

## Pull Requests

Keep pull requests scoped. Include tests for behavior changes and update docs when user-facing behavior or product boundaries change.

Security-sensitive changes should explain the local-first and data-only impact clearly.
