# Contextarr Architecture

## Summary

Contextarr is a local-first context pack compiler and manager. Source files are the source of truth; runtime indexes, rendered output, exports, cache files, and MCP responses are derived artifacts that must be rebuildable.

Phase 22 continues the second PRD track with non-executable Skill schemas, public-safe demo Skills, read-only Skill indexing/API/UI, deterministic Skill health/review items, profile-driven Skill export previews, Agent Kit schemas/validation, public-safe demo Agent Kits, Agent Kit indexing/API/search, and the local Agent Kit Composer save flow. Context Packs remain the core source-backed knowledge object. Phase 23 adds read-only Agent Kit Library/detail/health surfaces and local health scoring. Phase 24 adds read-only Agent Kit export generation from selected Context Packs and Skills. Phase 24R applies the research-delta foundation to Context Packs: stronger source provenance, source license status, hash/freshness metadata, deterministic validation reports, export readiness, redaction warnings, and assistant handoff targets. Phase 27 adds public-safe Agent Kit templates that prefill the Composer and generate unreviewed local draft kits only. Phase 3A planning defines the future Registry Trust Foundation as architecture only: registry artifacts, scanner reports, signing, encryption, quarantine, revocation, and marketplace gates without a live public registry. The v1 core hardening lane now includes local Context Pack collectors and Composer save-as-draft-pack, both of which create private unreviewed draft packs without activating them.

The Agentic AI Context Readiness and Local Observability PRD is accepted as an AR0 planning addition. It does not add current runtime behavior. Future phases may add readiness schemas, local evidence metadata, readiness API routes, UI, CLI commands, and release gates only after the Context Pack core lane remains stable.

## Core Decisions

- Use a TypeScript monorepo managed by pnpm.
- Use local files as the durable source of truth.
- Use SQLite as a rebuildable derived index and app state store.
- Use Node.js with Fastify for the local API server.
- Use React + Vite for the local web dashboard.
- Use Zod for schemas and validation.
- Use sanitized Markdown rendering for human-readable records and static output.
- Use Docker Compose for local operation.
- Use read-only stdio MCP as a local context access layer.
- Keep Skills, Agent Kits, and Agent Kit templates data-only and non-executable.

## Monorepo Shape

```text
apps/web
apps/server
apps/cli
apps/mcp
packages/schema
packages/security-scanner
packages/renderer
packages/pack-validator
packages/skill-validator
packages/export-profiles
packages/importers
tools/brand-kit
assets/brand
demo-packs
demo-skills
docs
```

## Data Flow

1. Pack files live in local folders.
2. The validator reads pack manifests, records, sources, exports, and rules.
3. The server indexes approved local pack and Skill files into SQLite with FTS5 search and derived validation/export/source-risk metadata.
4. The web UI reads from the local API.
5. The renderer produces sanitized human-readable output.
6. Export profiles produce target-specific context files.
7. The MCP server exposes selected context through read-only local stdio tools.
8. Importers and collectors can generate local draft pack folders from selected local inputs.
9. Composer builds temporary custom exports from selected local records and can save selected approved `public_safe` records as private draft Context Packs.
10. Docker Compose can serve the built web app and local API from one Fastify origin.
11. Agent Kit Library/detail/health views render from indexed relationships and local health state.

## Source of Truth

Pack and Skill folders are authoritative. SQLite tables, search indexes, generated exports, static render output, and MCP responses are derived and must be safe to rebuild from local files.

## Backend Direction

Fastify is the preferred v0 API server because Contextarr is local-server-first and benefits from mature routing, schema-friendly request handling, and straightforward test support.

## Frontend Direction

The web app is a power-user dashboard, not a marketing site. Phase 4 implemented the app shell and API-backed Pack Library. Phase 5 added hash-based pack and record detail views plus sanitized record rendering. Phase 6 added deterministic Pack Health and Review Queue views. Phase 7 added export preview, copy, and download flows for profile-driven generated artifacts. Phase 10 added a read-only Composer workflow for temporary custom exports. Phase 11 added same-origin serving of built web assets for the Docker preview. Phase 16 added read-only Skill Library and Skill detail screens with sanitized instruction and example rendering. Phase 17 extends the same health/review model to Skills with object-aware queue filtering and Skill health detail. Phase 18 adds Skill export previews, copy, and browser download through the same read-only export workbench.

## Renderer Direction

The shared renderer converts Markdown to sanitized HTML for both the web UI and static output. Static HTML is a local generated artifact only; it must contain CSS but no user JavaScript or external scripts.

## Database Direction

SQLite is the only v0 database. Do not add Postgres or a vector database in v0. SQLite FTS5 is implemented for local full-text record and Skill search, with safe fallback behavior for punctuation-heavy UI queries.

Review item statuses are local SQLite app state. Rescans preserve statuses by deterministic fingerprints and mark missing generated issues as resolved, but review actions do not edit pack files.

Generated exports are derived artifacts. The CLI may write them to ignored local folders such as `generated-exports/`; API previews return content only and do not write files.

MCP query metadata is local SQLite app state. It records tool name, related ids, query hash and length, result count, timing, and sanitized metadata only. It must not store raw result content or full raw query text.

Future Local Observability tables are also local app state. They should record metadata and hashes for exports, readiness calculations, review activity, redaction events, token warnings, and MCP queries. They must not store raw export bodies, raw MCP queries, returned context bodies, or product telemetry by default.

Imported draft packs and imported draft Skills are generated local files under explicit ignored output directories such as `imported-packs/` and `imported-skills/`. They are not approved by default; imported records and Skill documents are private drafts tagged `imported_draft` and `never_export`.

Composed previews are temporary derived artifacts. The web UI can preview, copy, and browser-download them. Composer save-as-draft-pack writes selected approved `public_safe` records to ignored `composed-packs/` as private unreviewed draft Context Packs with provenance back to source packs and records. It applies source pack redaction rules to persisted drafts and rejects non-public records for durable saves. It does not mutate source packs, index drafts as active packs, or approve them for export/MCP exposure.

Draft Intake is a guarded local review workbench layered over untrusted local candidate roots. It scans draft packs, composed packs, and optional restored/imported quarantine roots for Context Pack-like folders, then returns path-redacted metadata, validation summaries, scanner summaries, duplicate-active-pack warnings, record/source/export counts, read-only activation plans, dry-run activation proof, and recent activation history. Activation plans prepare blockers, warnings, target path labels, manual next steps, and explicit no-mutation boundaries. Dry-run proof adds a proof ID, generated time, validation/security status, blockers, warnings, target labels, manual actions, and false effect flags without moving files or touching SQLite. Apply activation requires the current dry-run proof ID, rejects changed or blocked candidates, moves or copies the reviewed candidate into the configured active packs root, records sanitized local activation evidence, and refreshes the local derived index. The workbench still stops before broader exposure: activation does not generate exports, publish artifacts, perform network access, or expose records through MCP.

## Local API Direction

The local API binds to `127.0.0.1` by default. Local development can run without auth, but setting `CONTEXTARR_API_TOKEN` requires a bearer token or `X-Contextarr-Token` header for protected API routes. Phase 15 added read-only Skill endpoints under `/api/skills` and Skill-scoped search via `/api/search?type=skill&q=`. Phase 21 adds Agent Kit endpoints under `/api/agent-kits` and Agent Kit-scoped search via `/api/search?type=agent-kit&q=`. Phase 22 adds `POST /api/agent-kits` for validated local Agent Kit saves under `CONTEXTARR_AGENT_KITS_DIR`; the API never accepts an arbitrary output path. Phase 23 adds read-only Agent Kit `detail` endpoints and `GET /api/agent-kits/:id/health` for Agent Kit health. Phase 24 makes `GET /api/agent-kits/:id/exports/:profileId/preview` return generated local export content. Phase 26 adds local Skill import preview/write endpoints only when `CONTEXTARR_ENABLE_LOCAL_IMPORTS=true`; writes stay under `CONTEXTARR_IMPORTED_SKILLS_DIR`. Context Pack collectors use `/api/context-pack-collectors`, write only under `CONTEXTARR_DRAFT_PACKS_DIR`, and do not index drafts as active packs automatically. Composer save uses `POST /api/compose/save-pack`, writes only under `CONTEXTARR_COMPOSED_PACKS_DIR`, validates before success, and does not index drafts as active packs automatically. Draft Intake uses `GET /api/review-candidates`, `GET /api/review-candidates/:key`, `GET /api/review-candidates/:key/activation-plan`, `POST /api/review-candidates/:key/activation/dry-run`, `POST /api/review-candidates/:key/activation/apply`, and `GET /api/review-candidate-activations` for guarded local candidate review, activation, and local evidence review.

Planned Context Readiness API routes, including `/api/packs/:id/readiness`, `/api/readiness`, `/api/events`, `/api/exports/history`, `/api/mcp/query-log`, `/api/governance/:packId`, and `/api/token-budget/:packId`, are not implemented in AR0. When implemented, they must remain local, metadata-first, auth-protected with the same API rules, and non-mutating unless a later decision explicitly scopes a recalculation write to derived SQLite state.

When `CONTEXTARR_WEB_DIST_DIR` is set, the server also serves the built web app from that directory. API routes keep priority under `/api/*`; unknown API routes return JSON 404 responses while non-API browser routes fall back to `index.html`.

## Docker Direction

Docker Compose is a local preview path for v0.1, not a hosted deployment recipe. It builds the Vite app, runs the Fastify server on `0.0.0.0:3210`, mounts `demo-packs`, `demo-skills`, and `demo-agent-kits` read-only, mounts ignored local `agent-kits` and `composed-packs` for local draft saves, and stores derived SQLite state in a Docker volume.

## MCP Direction

MCP is implemented as a local stdio process in `apps/mcp`. It uses the official TypeScript SDK, reuses the derived SQLite index, and exposes read-only tools for Context Packs, records, Skills, Agent Kits, search, export profiles, and export previews. Phase 25 adds Skill and Agent Kit tools while preserving stdio-only transport, metadata-only query logs, and path-free responses. It must not mutate files, run commands, execute Skills, run Agent Kits, call external services, or expose raw private sources unless explicitly configured.

## Importer Direction

Phase 9 importers read local folders, Markdown folders, Obsidian vaults, ChatGPT exports, and Claude exports, then write generated draft pack folders. Context Pack collectors add guided local draft pack creation under `draft-packs/` for blank starters, Markdown folders, project notes, and support KB starters. Phase 26 extends importer support to local draft Skills through CLI plus gated local API flows. Skill importers support folder, Markdown, prompt-template, Claude Skill, and ChatGPT prompt inputs. Phase 27 adds Agent Kit template loading from `CONTEXTARR_AGENT_KIT_TEMPLATES_DIR`, defaulting to committed `agent-kit-templates/`, and writes generated kits only under `CONTEXTARR_AGENT_KITS_DIR`. They must not add MCP mutation, live connectors, cloud sync, external API calls, execution, or approval behavior.

## Registry Trust Direction

Contextarr is evolving toward a trusted package manager for AI-ready context, but shared context needs a trust layer before any public registry or marketplace can exist.

Future registry artifacts are structured bundles containing metadata, an encrypted artifact payload, hashes, validation reports, scanner reports, human review records, license/source summaries, signatures, and revocation metadata. A listed artifact is not trusted merely because it appears in a registry.

A scanner is a gate, not a guarantee. The `packages/security-scanner` package provides deterministic local scanner report types, policy checks, fixtures, and text-only scanner primitives. It must not call external APIs, fetch networks, execute files, or copy third-party scanner rules. Scanner status can block known bad patterns and enforce Contextarr policy, but it cannot prove arbitrary natural-language instructions are safe in every downstream agent runtime.

Every imported registry item must enter quarantine first. Activation requires signature and hash verification, local re-scan, local validation, human review, and approval. Unreviewed or quarantined artifacts must not be exposed through exports or MCP by default. Revoked artifacts remain local but are blocked from export and MCP exposure by default.

Public registry, private registry, and marketplace behavior remain post-v1 gated tracks. The current architecture includes registry-readiness documentation only; it does not add public uploads, remote install, hosted cloud, marketplace payments, creator accounts, or auto-activation.

## Composer Direction

Phase 10 Composer v0 selects indexed packs and records, filters by local metadata, chooses a target and privacy mode, and calls the local compose preview API. The v1 core hardening lane adds save-as-draft-pack for Context Packs only: selected approved `public_safe` records can be written under `composed-packs/` as private unreviewed draft packs with source provenance and `never_export` defaults. Agent Kit save behavior remains separate and unchanged.

## Skills and Agent Kits Direction

The second PRD adds Skills and future Agent Kits:

- Context Packs tell agents what to know.
- Skills tell agents how to work.
- Agent Kits combine both for a specific task.
- Export Briefs are generated from those ingredients.

Contextarr prepares Agent Kits. It does not run them.

Phase 13 added Skill schemas and validation, Phase 14 added fake public-safe demo Skills, Phase 15 indexes Skills into read-only SQLite/API surfaces, Phase 16 displays Skills in a read-only dashboard surface, Phase 17 adds deterministic Skill Health and object-aware review items, Phase 18 adds profile-driven Skill exports, Phase 19 adds Agent Kit schemas/validation, Phase 20 adds fake public-safe demo Agent Kits, Phase 21 indexes Agent Kits into SQLite/API/search surfaces, Phase 22 adds validated local Agent Kit creation from selected existing objects, Phase 23 adds local Agent Kit Library/detail/health views, and Phase 24 adds profile-driven Agent Kit exports. Phase 24R strengthens the Context Pack foundation before extending MCP/import/template/registry work. Phase 25 extends the local read-only MCP server to Skills and Agent Kits. Phase 26 adds local draft Skill importers and review-queue integration. Phase 27 adds public-safe Agent Kit templates and Composer prefill. Skill, Agent Kit, and template files must remain local, inspectable, source-backed, reviewable, and non-executable. Indexes, previews, exports, UI rendering, and MCP responses must remain derived artifacts.
