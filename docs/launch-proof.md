# Contextarr Launch Proof

Status: local proof layer for the first public surface.

This document defines the proof Contextarr can show without claiming a hosted product, managed AI service, public registry, marketplace, or agent runner. The goal is simple: show that a cold AI answer fails, raw notes are not enough, and a reviewed Contextarr export gives the model source-backed context it can actually use.

## What Works

- 15 public-safe demo packs with 120 reviewed records.
- 8 export profiles per demo pack: ChatGPT, Claude, Codex, Markdown, JSON records, AGENTS.md, CLAUDE.md, and llms.txt.
- Human-readable HTML rendering from local Context Pack files.
- Local validation, scan, render, export, Docker preview, site build, and read-only MCP paths.
- Demo evals where each public-safe pack has a demo question, best export target, and proof expectation.
- Public site proof route at `/proof` that links back to this document.

## What Does Not Work Yet

- No hosted vault.
- No public registry or marketplace.
- No npm package publish.
- No tagged GitHub release.
- No external AI API dependency for the launch proof.
- No production deployment of the core app.
- No Skill execution, Agent Kit runtime, pack execution, tool execution, or agent runner.
- No hidden telemetry, cloud sync, outreach, provider mutation, domain action, or public launch action.

## Proof Receipts

The proof layer should show these receipts directly or link to a command that produces them:

| Receipt | Proof |
| --- | --- |
| Demo inventory | `pnpm public-surface:verify` checks 15 demo packs, 12 starter packs, 120 records, 8 skills, public routes, required copy, and screenshot parity. |
| Demo pack validity | `pnpm demo:validate` validates `demo-packs`. |
| Export path | `pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --profile codex` produces a target-ready Contextarr export. |
| Human-readable HTML | `pnpm --filter @contextarr/cli contextarr render demo-packs/ai-workstation-pack --out rendered/launch-proof-ai-workstation` renders local HTML. |
| Read-only MCP | `pnpm contextarr-mcp` starts the local stdio MCP server; it does not mutate files, call tools, or execute pack content. |
| Site proof | `pnpm site:verify` checks and builds the static site, including `/proof`. |

## Validation Commands

Run these focused checks for launch-proof work:

```bash
pnpm public-surface:verify
pnpm site:verify
pnpm demo:validate
pnpm --filter @contextarr/cli contextarr validate demo-packs --json
pnpm --filter @contextarr/cli contextarr render demo-packs/ai-workstation-pack --out rendered/launch-proof-ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --profile codex
```

Use `pnpm release:verify` only when the release candidate itself is being proven. The launch-proof layer should not require a full release gate for every copy-only edit.

## Local Demo Path

The 5-minute proof script:

1. Ask a cold AI a question from one demo eval with no context.
2. Show why the answer is generic or unsafe.
3. Show the raw notes and explain why they are useful but not export-ready.
4. Run or open the matching Contextarr export.
5. Ask the same question with the Contextarr export.
6. Compare the answer against the pack records, source map, redaction rules, and proof eval.
7. Close by showing validation commands and the local-only boundaries.

The fastest local install path is the 7-minute route:

```bash
git clone https://github.com/contextarr/contextarr
cd contextarr
pnpm install
pnpm public-surface:verify
pnpm demo:validate
docker compose up
```

Then open `http://127.0.0.1:3210`, inspect a demo pack, and generate a Contextarr export or human-readable HTML from the CLI.

## No-Public-Action Boundaries

Do not perform any of these while producing launch proof:

- Do not deploy the site or core app.
- Do not create or push a git tag.
- Do not publish an npm package, Docker image, registry artifact, marketplace listing, or release.
- Do not call external AI APIs during the proof capture.
- Do not use real private data, credentials, customer data, provider console screenshots, or private local paths.
- Do not commit generated videos, screen recordings, temporary exports, local databases, Docker volumes, or smoke logs without explicit review approval.

Generated proof artifacts should stay under ignored local paths such as `.contextarr-cache/demo-proof/<stamp>/`, `rendered/launch-proof-*`, or another explicitly ignored operator folder.
