# Contextarr v0.1.0-alpha.1 Release Draft

## Status

Early alpha. Not production ready.

Do not create a GitHub release from this draft until CI passes from a clean checkout and the install path has been checked from the public repository state.

## Included

Current implemented and documented surfaces include:

- TypeScript and pnpm monorepo.
- Public-safe demo packs.
- Public-safe G2 Context Quality Benchmark fixtures under `demo-evals/`.
- G3 local deterministic Context Quality Benchmark harness for fixture scoring and local report generation, with no model calls.
- G4 local deterministic Context Quality Benchmark gate for accepted demo fixtures and G3 reports, with no CI enforcement or public release automation.
- Context Pack schemas and deterministic validator.
- CLI commands for `validate`, `render`, `export`, and `import`.
- Stable `--json` and `--agent` envelopes for implemented CLI commands.
- Local Fastify API with rebuildable SQLite derived state.
- React and Vite local dashboard.
- Pack Library, pack detail, record detail, Pack Health, Review Queue, Export Center, and Composer surfaces.
- Sanitized Markdown rendering and static HTML output.
- Profile-driven exports for ChatGPT, Claude, Codex, Markdown, and JSON records.
- Local draft importers for folders, Markdown, Obsidian, ChatGPT exports, and Claude exports.
- Read-only stdio MCP server.
- Docker Compose local preview.
- Public repo housekeeping docs, issue templates, PR template, CI, support policy, and changelog.

## Not Included

- Hosted sync.
- Hosted memory vault.
- Public marketplace.
- Public registry behavior.
- Production importer workflows.
- Web importer UI.
- API import endpoints.
- Pack file mutation from review actions.
- Saving composed exports as new packs.
- Unattended agent execution.
- Arbitrary executable packs.
- Executable Skills.
- Agent Kit runtime behavior.
- Production security guarantees.
- Published npm packages.

## Verification

Housekeeping pass verification on 2026-05-09:

```bash
pnpm docs:verify
pnpm typecheck
pnpm test
pnpm --filter @contextarr/cli contextarr validate demo-packs
pnpm phase11:verify
node tools/launch/verify-phase12-docs.mjs
```

All passed locally during the repository publication cleanup pass.

Before creating the release, rerun verification from a clean checkout and record the exact release-run output.

## Security Boundary

- Local-first by default.
- No telemetry.
- No executable packs.
- No executable Skills.
- No Agent Kit runner.
- Public-safe demo data only.
- Read-only stdio MCP.
- No hidden network calls from pack content.
- No real private data in demo packs, fixtures, screenshots, or docs.

## Upgrade Notes

None yet. This would be the first tagged alpha release.
