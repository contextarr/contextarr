# Implementation Status

This document is the shipped-versus-planned source of truth for Contextarr. Roadmaps, PRDs, release notes, and design docs can describe targets; this file should say what the current mainline actually supports.

## Status Labels

| Label | Meaning |
|---|---|
| Current | Implemented in the repository and covered by an available verification path. |
| Partial | Some behavior exists, but important target requirements or gates are still missing. |
| Planned | Documented as intended behavior, but not implemented as a runnable surface. |
| Future | Later product direction after the current core proves useful. |
| Rejected | Explicitly out of scope unless a future task changes the boundary. |

## Agent Rule

Before claiming a command, API route, export target, safety gate, or product surface is shipped, check this file, `package.json`, and the relevant implementation files. If this file conflicts with roadmap language, treat the roadmap as planning and this file as current shipped status.

## Current Product Surfaces

| Capability | Status | Evidence path | Notes |
|---|---|---|---|
| Context Packs | Current | `packages/schema/src/index.ts`; `packages/pack-validator/src/index.ts`; `demo-packs/` | Core object. Files are source of truth; SQLite is derived. |
| Local CLI | Current | `apps/cli/src/index.ts`; `apps/cli/src/index.test.ts` | Current commands include validation, render, export, import, Skill import, Agent Kit validation/export, scan, backup/restore, and read-only index health/review/brief/query helpers. |
| Local Fastify API | Current | `apps/server/src/api.ts`; `apps/server/src/main.ts` | Serves derived local state, review status, preview, collector, Composer, Skill, and Agent Kit surfaces. Non-loopback binds must be token-protected. |
| React/Vite dashboard | Current | `apps/web/src/App.tsx`; `apps/web/src/api.ts` | Local power-user dashboard for pack library, records, health, review, exports, Composer, collectors, Skills, and Agent Kits. |
| Docker Compose preview | Current | `Dockerfile`; `docker-compose.yml`; `tools/launch/verify-docker.mjs` | Local preview only. Serves the built web app and API from one Fastify origin with demo objects mounted locally. |
| Composer preview and draft-pack save | Current | `packages/export-profiles/src/index.ts`; `apps/server/src/composed-pack-writer.ts`; `apps/web/src/composer.ts` | Builds temporary previews and can save private unreviewed draft Context Packs under the configured local output root. |
| Read-only stdio MCP | Current | `apps/mcp/src/server.ts`; `apps/mcp/src/tools.ts` | Optional local MCP for read-only Context Pack, Skill, Agent Kit, query, and preview tools. No mutating MCP tools. |
| Non-executable Skills | Current | `packages/skill-validator/src/index.ts`; `demo-skills/`; `apps/server/src/indexer.ts` | Implemented advanced-preview surface in this checkout but frozen behind the v1 bridge boundary for new expansion decisions. |
| Non-executable Agent Kits | Current | `packages/agent-kit-validator/src/index.ts`; `demo-agent-kits/`; `agent-kit-templates/` | Implemented advanced-preview surface for local data-only objects and templates. Contextarr does not run Agent Kits. |
| Backup/restore v0 | Current | `packages/backups/src/index.ts`; `tools/launch/verify-backups.mjs` | Local Context Pack backups and quarantine-only restore flows. |
| Security scanner foundation | Current | `packages/security-scanner/src/index.ts`; `tools/launch/verify-scanner.mjs` | Deterministic local text scanner and `contextarr scan`; not a hosted registry scanner. |
| Public Astro site | Current | `apps/site/`; `apps/site/package.json` | Static public-preview site source is part of current mainline. Root release gates do not yet include site check/build. |
| G3/G4 benchmark package from PR #2 | Planned | none on `origin/main` | `packages/context-quality/`, `demo-evals/`, and `quality:verify` are not part of current mainline. |
| Public registry or marketplace | Rejected | `docs/non-goals.md`; `docs/marketplace-non-goals.md` | Planning docs may describe trust foundations, but no public registry or marketplace runtime is shipped. |

## CLI Status

| Capability | Status | Evidence path | Notes |
|---|---|---|---|
| `contextarr validate` | Current | `apps/cli/src/index.ts` | Unified validation for current supported object types. |
| `contextarr render` | Current | `apps/cli/src/index.ts`; `packages/renderer/src/index.ts` | Derived static rendering only. |
| `contextarr export` | Current | `apps/cli/src/index.ts`; `packages/export-profiles/src/index.ts` | Profile-driven exports for Context Packs, Skills, and Agent Kits where supported by profiles. |
| `contextarr import` / `contextarr import-skill` | Current | `apps/cli/src/index.ts`; `packages/importers/src/index.ts` | Writes draft local objects only under caller-selected output roots. |
| `contextarr scan` | Current | `apps/cli/src/index.ts`; `packages/security-scanner/src/index.ts` | Local deterministic scanner. |
| `contextarr backup` / `contextarr restore` | Current | `apps/cli/src/index.ts`; `packages/backups/src/index.ts` | Restore writes quarantine output, not automatic activation. |
| `contextarr rescan` | Current | `apps/cli/src/index.ts`; `apps/cli/src/index.test.ts` | Rebuilds the derived local SQLite index from configured folders without requiring the API server or MCP. |
| `contextarr list` | Current | `apps/cli/src/index.ts`; `apps/cli/src/index.test.ts` | Lists indexed packs, Skills, and Agent Kits with deterministic text or JSON output. |
| `contextarr inspect` | Current | `apps/cli/src/index.ts`; `apps/cli/src/index.test.ts` | Inspects one indexed pack, record, Skill, or Agent Kit with deterministic text or JSON output. |
| `contextarr health` | Current | `apps/cli/src/index.ts`; `apps/cli/src/index.test.ts` | Summarizes local index health or reports one pack, Skill, or Agent Kit health without requiring the API server or MCP. |
| `contextarr review` | Current | `apps/cli/src/index.ts`; `apps/cli/src/index.test.ts` | Lists local review items with deterministic filters, limits, text, and JSON output. |
| `contextarr brief` | Current | `apps/cli/src/index.ts`; `apps/cli/src/index.test.ts` | Builds a compact local index or object brief for packs, Skills, and Agent Kits without requiring the API server or MCP. |
| `contextarr query` | Current | `apps/cli/src/index.ts`; `apps/cli/src/index.test.ts` | Searches the derived local index with type and limit filters plus deterministic text or JSON output. |
| CLI commands that execute pack, Skill, or Agent Kit content | Rejected | `README.md`; `docs/security-model.md` | Contextarr prepares data; it does not run agents or execute content. |

## Safety And Exposure Gates

| Capability | Status | Evidence path | Notes |
|---|---|---|---|
| Pack export approval/privacy defaults | Current | `packages/export-profiles/src/index.ts`; `packages/export-profiles/src/index.test.ts` | Pack exports exclude unapproved and non-public records from trusted redacted/public-safe paths. |
| Composed export approval/privacy defaults | Current | `packages/export-profiles/src/index.ts`; `packages/export-profiles/src/index.test.ts` | Composed exports omit unapproved records and apply privacy/tag gates before rendering. |
| Skill and Agent Kit export safety | Current | `packages/export-profiles/src/index.ts`; `packages/export-profiles/src/index.test.ts` | Data-only exports; secret and blocked-tag content must stay out of trusted outputs. |
| MCP approved-only visibility | Partial | `apps/mcp/src/tools.ts`; `apps/mcp/src/tools.test.ts` | Pack record paths are guarded; current mainline also hardens newer Skill and Agent Kit lanes. |
| MCP record/result limits | Partial | `apps/mcp/src/config.ts`; `apps/mcp/src/tools.ts` | Record body limits and export-preview caps are current. |
| Non-loopback API token guard | Current | `apps/server/src/config.ts`; `apps/server/src/config.test.ts` | Non-loopback API binding fails closed unless `CONTEXTARR_API_TOKEN` is configured. |
| Redacted API health | Current | `apps/server/src/api.ts`; `apps/server/src/api.test.ts` | Health is unauthenticated, path-redacted, and reports aggregate local status only. |
| Core validator policy checks | Current | `packages/pack-validator/src/index.ts`; `packages/pack-validator/src/index.test.ts` | Enforces the declared small core set when present in `rules/validation.yaml` and rejects unknown check names. |
| Hidden network calls and telemetry | Rejected | `docs/security-model.md`; package manifests | Not part of current product scope. |

## Verification

| Gate | Status | Evidence path | Notes |
|---|---|---|---|
| `pnpm typecheck` | Current | `package.json`; `tsconfig.json` | Main TypeScript gate. |
| `pnpm test` | Current | `package.json`; `vitest.config.ts` | Main Vitest gate. |
| `pnpm docs:verify` | Current | `tools/launch/verify-docs.mjs` | Launch and safety wording guard. |
| `pnpm v1-core:verify` | Current | `package.json`; `tools/launch/verify-v1-core.mjs` | Main local v1 core gate. |
| `pnpm security:verify` | Current | `package.json`; `tools/launch/verify-security.mjs` | Current security gate over scanner, API, MCP, and fixture checks. |
| `pnpm release:verify` | Current | `package.json`; `tools/launch/verify-release-docs.mjs` | Full local release-readiness gate; includes Docker and backup checks. |
| GitHub Actions CI | Current | `.github/workflows/ci.yml` | Reintroduced as a smaller mainline gate for current scripts, not PR #2's retired site/quality lanes. |

## Planned Or Future Work

| Capability | Status | Notes |
|---|---|---|
| Public registry trust foundation implementation | Planned | Docs exist; registry runtime, remote install, signing implementation, and marketplace behavior remain out of scope. |
| Hosted sync or telemetry | Rejected | Not part of Contextarr v1 core. |
| Executable packs, executable Skills, Agent Kit runtime | Rejected | Contextarr remains data-only and local-first. |
| Benchmark fixtures and context-quality package from PR #2 | Future | Useful historical work from commit `165f641`, but not part of current mainline. |
