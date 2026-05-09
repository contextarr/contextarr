# Contextarr PRD Addition: Phase-by-Phase Plan to v1.0

Version: 0.1 draft
Date: 2026-05-08
Owner: Rob
Status: Planning document

Status note: Check [implementation-status.md](implementation-status.md) before treating any phase requirement, command, export target, registry/trust behavior, Skill, Agent Kit, or marketplace behavior in this planning document as shipped.

## 1. Purpose

This document defines the complete product path from the current Contextarr planning and early implementation state to Contextarr v1.0.

It is a bridge PRD. It connects the existing Contextarr core PRD, the Phase 1 to Phase 3 research delta, and the future Skills and Agent Kits roadmap.

The purpose is to prevent drift between the initial self-hosted Context Pack compiler and a mature v1.0 local product.

The v1.0 product is not a marketplace, not a hosted vault, not an agent runner, not a chatbot, and not a generic memory app.

The v1.0 product is:

```text
A stable, local-first Context Pack system for building, validating, reviewing, rendering, redacting, composing, exporting, and exposing source-backed AI context through deterministic local files, a rebuildable SQLite index, a human-readable dashboard, CLI workflows, and read-only MCP.
```

## 2. Source of Truth

The main Contextarr PRD remains the source of truth.

This document adds detail for the path to v1.0. It does not replace the main PRD.

When this document conflicts with the main PRD, use the main PRD unless this document is explicitly adopted as an updated plan.

When this document conflicts with the Skills and Agent Kits PRD addition, use this rule:

```text
Context Packs reach v1.0 first.
Skills and Agent Kits start after v1.0 unless explicitly pulled forward by a separate decision record.
```

Reason: the core Context Pack system must prove adoption, trust, maintenance, and cross-tool export before adding another product object.

## 3. Current State Assumption

This plan assumes the current state is:

1. Main PRD exists.
2. Phase 1 to Phase 3 research delta exists.
3. Skills and Agent Kits PRD addition exists as future expansion.
4. Core implementation is either not started or early enough that the phase plan can still control scope.
5. The repo should proceed from schema, validator, demo packs, local index, API, dashboard, renderer, health, exports, read-only MCP, importers, composer, and launch hardening.

If the repo is already ahead, skip a phase only after its acceptance criteria, tests, docs, and hard boundaries are verified.

## 4. v1.0 Product Definition

Contextarr v1.0 is a mature local Context Pack product.

It lets a user:

1. Keep Context Packs in local files.
2. Validate packs deterministically.
3. Inspect packs in a local dashboard.
4. Render packs as sanitized human-readable HTML.
5. See Pack Health and Review Queue state.
6. Import supported local sources into draft records.
7. Review and approve draft context.
8. Compose custom exports from packs, records, tags, and privacy modes.
9. Export target-specific briefs for ChatGPT, Claude, Codex, Claude Code, Cursor, OpenCode, Open WebUI, AnythingLLM, local agents, Markdown, JSON, llms.txt, AGENTS.md, and CLAUDE.md.
10. Expose approved pack context through read-only local MCP.
11. Delete SQLite and rebuild equivalent derived state from files.
12. Prove that nothing executes, nothing calls the network without explicit user action, and nothing leaves the machine unless the user exports it or connects a downstream AI tool.

## 5. v1.0 Non-Goals

Do not build these before v1.0:

1. Hosted cloud vault.
2. Hosted sync.
3. Public marketplace.
4. Public registry.
5. Public GEO pack hosting.
6. Executable packs.
7. Script packs.
8. Shell commands inside packs.
9. Browser automation.
10. Agent action runner.
11. Generic chatbot UI.
12. Managed AI subscription.
13. Direct Gmail connector.
14. Direct bank connector.
15. Direct brokerage connector.
16. Passive always-on capture.
17. Full OCR engine.
18. Deep codebase AST indexer.
19. Telemetry.
20. Mobile app.
21. Multi-user real-time collaboration.
22. Skills.
23. Agent Kits.
24. Skill marketplace.
25. Private team registry implementation.
26. CLI agent runner or workflow automation engine.
27. CLI execution of pack instructions.
28. MCP-only agent access model.

Private team registry research may happen before v1.0. Implementation waits until after v1.0 unless there is strong external pull.

Skills and Agent Kits remain future product expansion. Do not mix them into v1.0 scope.

## 6. Version Milestones

| Milestone | Meaning | Minimum outcome |
|---|---|---|
| v0.0 | Repo and docs baseline | Repo structure, docs, package setup, guardrails |
| v0.1 | Public preview | Demo packs validate, dashboard works, health works, exports work, read-only MCP works, Docker works |
| v0.2 | Importer preview | Local folder, Markdown folder, Obsidian, ChatGPT, Claude imports create draft records only |
| v0.3 | Composer preview | User can compose temporary and saved exports from selected context |
| v0.4 | Maintenance preview | Pack Health, Review Queue, stale rules, source status, redaction warnings become a real maintenance loop |
| v0.5 | Export maturity | Target-specific exports become high quality and deterministic |
| v0.6 | Local integration maturity | CLI, API, MCP, Docker, docs, and config are stable for power users |
| v0.7 | Packaging maturity | Install, upgrade, backup, restore, and support docs are reliable |
| v0.8 | Alpha hardening | Real users maintain packs after setup, not just try the demo |
| v0.9 | Release candidate | Schema freeze candidate, migration tests, security review, launch docs |
| v1.0 | Stable local core | Mature Context Pack product, ready for serious OSS adoption and paid setup services |

## 7. Global Product Principles

These principles apply to every phase.

### 7.1 Files are source of truth

Context Pack folders are canonical.

SQLite, generated exports, rendered HTML, search indexes, MCP responses, and validation reports are derived artifacts.

### 7.2 SQLite is rebuildable

The user must be able to delete the database and rebuild from local pack folders.

Settings and logs may be separate mutable local app state. Pack content cannot depend on hidden database-only records.

### 7.3 Human approval is required

AI-assisted drafts, imported drafts, and converted records are not trusted by default.

Draft content must enter Review Queue before it can be exported by default or exposed through MCP.

### 7.4 Packs are data-only

No executable code.
No shell commands.
No hidden network calls.
No browser automation.
No credentials.
No runtime plugins.
No install hooks.

### 7.5 MCP is read-only

MCP can expose selected, approved, redacted context.

MCP cannot mutate files, execute code, run shell commands, call external services, or trigger agent actions.

### 7.6 Least disclosure is core

Exports include only what the selected target, task, and privacy mode require.

Redaction warnings must be visible before copy or download.

### 7.7 Demo data must be fake

No real private data in demo packs, fixtures, screenshots, videos, docs, or sample exports.

### 7.8 No third-party content copying

Research and competitor analysis can inform patterns. It must not be copied into Contextarr code, docs, scanner logic, export templates, or public content.

### 7.9 CLI-first agent interface

Contextarr must be fully useful to agents through deterministic CLI commands without requiring MCP.

MCP remains a supported optional transport for live local querying, but the CLI is the primary automation surface for validation, inspection, export, health, import dry-runs, quarantine review, and agent brief generation.

CLI, API, Web UI, MCP, and exports must call shared core functions. No surface should shell out to another surface.

## 8. Global Technical Architecture

### 8.1 Repo structure

Required structure through v1.0:

```text
contextarr/
  apps/
    web/
    server/
    cli/
  packages/
    schema/
    renderer/
    pack-validator/
    export-profiles/
  demo-packs/
  docs/
  data/
  docker-compose.yml
  package.json
  pnpm-workspace.yaml
```

Do not add separate Skill or Agent Kit packages before v1.0.

### 8.2 Core stack

1. TypeScript monorepo.
2. pnpm workspaces.
3. React plus Vite for web UI.
4. Fastify for server unless a prior decision record changes it.
5. SQLite using a simple deterministic access layer.
6. Zod for schemas.
7. Markdown rendering with sanitization.
8. SQLite FTS5 for search.
9. Docker Compose.
10. MCP SDK for read-only local MCP.

### 8.3 Data directories

Recommended local paths:

```text
./packs
./demo-packs
./data/contextarr.db
./data/logs
./data/rendered
./data/exports
./data/backups
```

### 8.4 Configuration

Required config sources:

1. `.env`.
2. CLI flags.
3. Local settings file.
4. Web UI settings.

Precedence:

```text
CLI flag > environment variable > local settings file > default
```

### 8.5 Package boundaries

Keep packages small and stable:

| Package | Responsibility |
|---|---|
| `packages/schema` | Zod schemas and shared type definitions |
| `packages/pack-validator` | Validation engine and validation report generation |
| `packages/renderer` | Sanitized Markdown and static HTML rendering |
| `packages/export-profiles` | Export profile parsing and target formatting helpers |
| `apps/cli` | CLI commands |
| `apps/server` | API, SQLite index, MCP, local app services |
| `apps/web` | Dashboard and review UI |

## 9. Phase Acceptance Format

Every implementation phase must end with a final report containing:

1. Summary.
2. Files created.
3. Files changed.
4. Commands run.
5. Tests run.
6. Checks passed.
7. Blockers.
8. Security notes.
9. Deviations from this PRD.
10. Next recommended phase.

No phase is complete unless the relevant docs, tests, and hard boundaries are satisfied.

# Phase 0: Baseline Lock and Repo Guardrails

## Version target

v0.0

## Goal

Create or verify the repo foundation and scope controls before implementation continues.

## User value

The project has a stable structure, visible boundaries, and clear docs before code complexity grows.

## Build

1. Verify required monorepo structure.
2. Verify package scripts.
3. Add or update root README.
4. Add docs for architecture, security model, pack format, roadmap, and non-goals.
5. Add `.env.example`.
6. Add Docker Compose stub.
7. Add license.
8. Add contribution and issue templates if useful.
9. Add decision records folder.
10. Add phase tracking document.

## Do not build

1. App functionality.
2. Pack importers.
3. MCP.
4. Marketplace.
5. Cloud.
6. Skills.
7. Agent Kits.

## Deliverables

```text
README.md
LICENSE
package.json
pnpm-workspace.yaml
docker-compose.yml
.env.example
docs/prd.md
docs/architecture.md
docs/pack-format.md
docs/security-model.md
docs/roadmap-phases.md
docs/non-goals.md
docs/decision-records/
```

## Acceptance criteria

1. `pnpm install` works.
2. Workspace packages resolve.
3. README states the product is a self-hosted context automation system and pack manager.
4. Non-goals are explicit.
5. Security principles are visible.
6. No app functionality is added.

## Checks

```text
pnpm install
pnpm -r typecheck
pnpm -r test
```

# Phase 1: Pack Schema and Validator v1

## Version target

v0.0.1

## Goal

Implement the strict Context Pack schema and deterministic validator.

## User value

A user can validate whether a pack is safe, source-backed, export-ready, and structurally correct before trusting it.

## Build

1. Manifest schema for `contextarr-pack.json`.
2. Record frontmatter schema.
3. Source map schema.
4. Export profile schema.
5. Validation rules schema.
6. Redaction rules schema.
7. Freshness rules schema.
8. Deterministic validation report schema.
9. CLI validation command.
10. Human-readable validation output.
11. JSON validation output.
12. Fixture packs for valid, warning, and invalid cases.

## Research delta additions

Include:

1. Source license metadata.
2. Source hash metadata.
3. Source stale metadata.
4. Normalized export targets.
5. Redaction hit reporting.
6. Export readiness report.
7. Docs-quality warnings.
8. Deterministic sorting of issues.
9. Fixed current datetime injection for stale tests.

Allowed export targets:

```text
chatgpt
claude
codex
generic_markdown
json
agents_md
claude_md
llms_txt
```

## Validator warnings

1. `docs.readme_missing`.
2. `docs.readme_minimal`.
3. `source.license_missing`.
4. `source.license_unknown`.
5. `source.license_risk`.
6. `source.stale`.
7. `redaction.hit_warn`.
8. `export_profile.readiness_warning`.

## Validator errors

1. `scan.credential_pattern`.
2. `scan.shell_command`.
3. `pack.executable_file`.
4. `pack.script_file`.
5. `manifest.executable_code`.
6. `manifest.requires_network`.
7. `manifest.run_commands`.
8. `manifest.network_access`.
9. `export_profile.schema`.

## Do not build

1. Demo packs beyond test fixtures.
2. Importers.
3. MCP.
4. Export rendering.
5. Static HTML renderer.
6. Embeddings.
7. Vector DB.
8. Marketplace.
9. Skills.
10. Agent Kits.

## Deliverables

```text
packages/schema/src/index.ts
packages/schema/src/index.test.ts
packages/pack-validator/src/index.ts
packages/pack-validator/src/index.test.ts
packages/pack-validator/test/fixtures/**
apps/cli/src/index.ts
apps/cli/src/index.test.ts
docs/validation-report.md
```

## Acceptance criteria

1. Valid minimal pack passes.
2. Missing README warns.
3. Missing source license warns.
4. Unknown license warns.
5. Copyleft or restricted license warns.
6. Stale source warns.
7. Redaction warn hit appears in report.
8. Secret-like value blocks.
9. Shell command pattern blocks.
10. Executable or script file blocks.
11. Invalid export profile blocks.
12. `contextarr validate <path> --json` emits deterministic `ValidationReportV1`.
13. Two validation runs against the same fixture produce equal JSON after path normalization.

## Checks

```text
pnpm --filter @contextarr/schema test
pnpm --filter @contextarr/pack-validator test
pnpm --filter @contextarr/cli test
pnpm phase1:verify
```

# Phase 2: Demo Packs and Validator Fixtures

## Version target

v0.0.2

## Goal

Create realistic fake demo packs and complete the validator fixture set.

## User value

A new user can immediately understand the product without connecting private data.

## Build

Create five demo packs:

1. AI Workstation Pack.
2. Jellyfin Server Pack.
3. Claude Code Project Pack.
4. Internal Support KB Pack.
5. Fake Product Line Pack.

Each demo pack includes:

1. `contextarr-pack.json`.
2. `README.md`.
3. `LICENSE`.
4. `CHANGELOG.md`.
5. 5 to 10 Markdown records.
6. `sources/sources.yaml`.
7. `exports/chatgpt.yaml`.
8. `exports/claude.yaml`.
9. `exports/codex.yaml`.
10. `exports/generic-markdown.yaml`.
11. `exports/json.yaml`.
12. `exports/agents-md.yaml`.
13. `exports/claude-md.yaml`.
14. `exports/llms-txt.yaml`.
15. `rules/validation.yaml`.
16. `rules/redaction.yaml`.
17. `rules/freshness.yaml`.
18. `examples/sample-agents-md.md`.
19. `examples/sample-claude-md.md`.
20. `examples/sample-llms-txt.txt`.
21. Cover metadata or generated cover fallback.

## Fixture packs

Create or update:

1. `valid-minimal-pack`.
2. `missing-readme-pack`.
3. `missing-source-license-pack`.
4. `unknown-source-license-pack`.
5. `copyleft-source-license-pack`.
6. `stale-source-pack`.
7. `redaction-warning-pack`.
8. `shell-command-content-pack`.
9. `executable-file-pack`.
10. `invalid-export-profile-pack`.
11. `deterministic-validation-pack`.

## Do not build

1. Importers.
2. MCP.
3. Export rendering.
4. Static HTML renderer.
5. Skills.
6. Agent Kits.
7. Marketplace.
8. Third-party docs-derived public demo content.

## Deliverables

```text
demo-packs/ai-workstation-pack/**
demo-packs/jellyfin-server-pack/**
demo-packs/claude-code-project-pack/**
demo-packs/internal-support-kb-pack/**
demo-packs/fake-product-line-pack/**
demo-packs/README.md
packages/pack-validator/test/fixtures/**
packages/pack-validator/src/demo-packs.test.ts
```

## Acceptance criteria

1. All five demo packs validate with zero errors and zero warnings.
2. Each demo pack has exactly eight export profile targets.
3. Export profile targets match the allowed target set.
4. All data is fake or public-safe.
5. No credentials.
6. No private personal data.
7. No executable content.
8. Warning fixtures produce exactly expected warnings.
9. Blocking fixtures produce expected errors.
10. Redaction warning fixture includes one redaction hit.

## Checks

```text
pnpm --filter @contextarr/pack-validator test
pnpm demo:validate
pnpm phase2:verify
```

# Phase 3: Local Index and API

## Version target

v0.0.3

## Goal

Load validated packs into a rebuildable SQLite derived index and expose a local API.

## User value

Contextarr can turn local pack folders into searchable app state without making the database the source of truth.

## Build

1. Pack loader.
2. Record loader.
3. Source loader.
4. Export profile loader.
5. SQLite schema.
6. Rebuild command.
7. Rescan command.
8. API server.
9. Search endpoint.
10. Skipped invalid pack metadata.
11. Warning pack state.
12. Derived validation, export readiness, redaction, stale, and license counts.

## SQLite tables

Required by this phase:

1. `packs`.
2. `records`.
3. `sources`.
4. `export_profiles`.
5. `pack_health`.
6. `review_items`.
7. `events`.
8. `settings`.

## API endpoints

1. `GET /api/health`.
2. `GET /api/packs`.
3. `GET /api/packs/:id`.
4. `GET /api/packs/:id/records`.
5. `GET /api/records/:id`.
6. `GET /api/search?q=`.
7. `POST /api/rescan`.

## Search rules

1. Empty query returns empty results.
2. Search returns pack matches and approved record matches.
3. Search excludes invalid-pack records.
4. Search excludes draft, rejected, and blocked records.
5. Search uses SQLite FTS5.

## Do not build

1. Importers.
2. MCP.
3. Mutating API endpoints except rescan.
4. Export rendering.
5. Embeddings.
6. Vector DB.
7. Skills.
8. Agent Kits.

## Deliverables

```text
apps/server/src/db.ts
apps/server/src/types.ts
apps/server/src/pack-loader.ts
apps/server/src/indexer.ts
apps/server/src/api.ts
apps/server/src/search.ts
apps/server/src/**/*.test.ts
docs/api.md
docs/sqlite-index.md
```

## Acceptance criteria

1. Five demo packs index.
2. Invalid packs are skipped and do not activate.
3. Warning packs index with `valid_with_warnings`.
4. SQLite stores source license, hash, and stale metadata.
5. API summaries separate license warning, missing, unknown, and risk counts.
6. Search returns approved records only.
7. Rebuild twice creates no duplicate rows.
8. Delete database and rebuild produces equivalent deterministic state excluding event timestamps and mutable review statuses.

## Checks

```text
pnpm --filter @contextarr/server test
pnpm phase3:verify
```

# Phase 4: Web Dashboard Shell and Pack Library

## Version target

v0.0.4

## Goal

Build the first local web dashboard experience.

## User value

Users can see installed packs, health state, trust labels, source counts, record counts, and export readiness without using the CLI.

## Build

1. React plus Vite app shell.
2. Left navigation.
3. Top search bar.
4. System health card.
5. Library page.
6. Pack Library cover grid.
7. Pack Library compact cards.
8. Pack Library dense table.
9. Pack filters.
10. Pack sorting.
11. Empty states.
12. Loading states.
13. Error states.
14. API client.
15. Dark mode and light mode.

## Navigation

Include:

1. Library.
2. Packs.
3. Sources.
4. Review Queue.
5. Composer.
6. Exports.
7. Health.
8. Settings.
9. System.

Collectors may appear as disabled or planned if they are not yet implemented.

Registry must not appear as a public-marketplace affordance. If present, label it `Local Imports` or hide it until trust work exists.

## Do not build

1. Pack editing.
2. Importer UI.
3. Marketplace UI.
4. Chat UI.
5. Agent runner controls.
6. Skills nav.
7. Agent Kits nav.

## Deliverables

```text
apps/web/src/App.tsx
apps/web/src/api/client.ts
apps/web/src/layout/**
apps/web/src/pages/LibraryPage.tsx
apps/web/src/components/pack/**
apps/web/src/components/system/**
apps/web/src/styles/**
apps/web/src/**/*.test.ts
```

## Acceptance criteria

1. Dashboard loads from local API.
2. Cover grid works.
3. Compact cards work.
4. Dense table works.
5. Health, trust, records, sources, review count, and export readiness are visible.
6. Search input queries API or filters locally.
7. No external UI service.
8. No telemetry.
9. No marketplace affordance.

## Checks

```text
pnpm --filter @contextarr/web test
pnpm --filter @contextarr/web build
pnpm phase4:verify
```

# Phase 5: Pack Detail and Record Rendering

## Version target

v0.0.5

## Goal

Build pack detail pages and sanitized record rendering in the web UI.

## User value

Users can inspect pack context, sources, records, export profiles, and warnings in human-readable form.

## Build

1. Pack detail route.
2. Pack header.
3. Overview tab.
4. Records tab.
5. Sources tab.
6. Exports tab placeholder.
7. Health tab placeholder.
8. Activity tab placeholder.
9. Changelog tab.
10. Record detail view.
11. Source map table.
12. Source detail drawer.
13. Markdown renderer with sanitization.
14. Record metadata badges.
15. Related records placeholder.

## Required tabs

1. Overview.
2. Records.
3. Sources.
4. Exports.
5. Health.
6. Activity.
7. Changelog.

## Do not build

1. Rich editing.
2. Raw HTML passthrough.
3. User JavaScript.
4. Importer UI.
5. Export copy/download yet unless trivial from existing API.
6. Marketplace.
7. Skills.
8. Agent Kits.

## Deliverables

```text
apps/web/src/pages/PackDetailPage.tsx
apps/web/src/pages/RecordDetailPage.tsx
apps/web/src/components/records/**
apps/web/src/components/sources/**
packages/renderer/src/markdown.ts
packages/renderer/src/sanitize.ts
packages/renderer/src/**/*.test.ts
```

## Acceptance criteria

1. AI Workstation Pack displays cleanly.
2. Record Markdown renders safely.
3. Script tags and unsafe HTML are removed.
4. Source references resolve.
5. Source license and stale status are visible.
6. Record privacy, review status, confidence, freshness, and tags are visible.
7. Changelog displays if present.

## Checks

```text
pnpm --filter @contextarr/renderer test
pnpm --filter @contextarr/web test
pnpm --filter @contextarr/web build
pnpm phase5:verify
```

# Phase 6: Static Renderer and Local HTML Output

## Version target

v0.0.6

## Goal

Generate sanitized static HTML output from packs.

## User value

Users can inspect packs outside the app, archive rendered reports, and share public-safe local HTML exports when appropriate.

## Build

1. Static pack overview pages.
2. Static record pages.
3. Static source map pages.
4. Static validation report pages.
5. Static health report pages.
6. Static export preview pages.
7. CSS-only theme.
8. Light and dark theme support.
9. CLI render command.
10. Renderer tests.

## CLI

```text
contextarr render <path> --out <dir>
contextarr render ./demo-packs --out ./dist
```

## Security rules

1. No user JavaScript.
2. No inline script tags.
3. No remote script includes.
4. External links are marked and safe.
5. Assets are copied only from safe asset allowlist.

## Do not build

1. Public hosting.
2. Hosted pack pages.
3. GEO content site.
4. Marketplace listing pages.
5. Full export engine.

## Deliverables

```text
packages/renderer/src/static/**
apps/cli/src/render.ts
docs/static-rendering.md
dist example output generated in tests or ignored artifact path
```

## Acceptance criteria

1. Demo packs render to static HTML.
2. Static output is readable without the server.
3. Markdown is sanitized.
4. CSS-only theme works.
5. Source maps and validation reports are included.
6. No JavaScript execution is possible from pack content.

## Checks

```text
pnpm --filter @contextarr/renderer test
pnpm --filter @contextarr/cli test
pnpm phase6:verify
```

# Phase 7: Pack Health and Review Queue v0

## Version target

v0.0.7

## Goal

Turn validation, source freshness, redaction, license, and review metadata into a visible maintenance loop.

## User value

Users know which context is safe, stale, unreviewed, broken, or not export-ready.

## Build

1. Pack Health scoring engine.
2. Review item generator.
3. Review Queue page.
4. Health dashboard page.
5. Health badges across library and pack detail.
6. Review item filters.
7. Review item severity.
8. Review item status.
9. Local review item actions.
10. Review queue counts in API.

## Review item types

1. Missing required field.
2. Broken source reference.
3. Stale source.
4. Stale record.
5. Missing README.
6. Missing source license.
7. Source license risk.
8. Redaction warning.
9. Export readiness warning.
10. Unreviewed draft.
11. Invalid export profile.
12. Deprecated pack version.

## Review item actions

Allowed in v0:

1. Mark reviewed.
2. Ignore.
3. Reopen.
4. Copy file path.
5. Open record detail.
6. Open source detail.

Avoid destructive actions.

## Do not build

1. AI contradiction scanner.
2. Auto-fix.
3. AI-generated edits.
4. External source fetcher.
5. Mutating MCP.
6. Marketplace trust score.

## Deliverables

```text
apps/server/src/health.ts
apps/server/src/review-items.ts
apps/web/src/pages/ReviewQueuePage.tsx
apps/web/src/pages/HealthPage.tsx
apps/web/src/components/health/**
apps/web/src/components/review/**
docs/pack-health.md
docs/review-queue.md
```

## Acceptance criteria

1. Health score is explainable.
2. Review Queue is deterministic after rescan.
3. Warning fixture packs generate expected review items.
4. Invalid packs are visible as skipped or blocked, not activated.
5. Review Queue filters by severity, pack, issue type, and status.
6. Health badges update after rescan.
7. No AI scanner is introduced.

## Checks

```text
pnpm --filter @contextarr/server test
pnpm --filter @contextarr/web test
pnpm phase7:verify
```

# Phase 8: Export Engine v0

## Version target

v0.0.8

## Goal

Generate deterministic, redaction-aware exports from approved pack context.

## User value

Users can send the right context to the right AI tool without hand-copying or over-sharing.

## Build

1. Export profile parser.
2. Record selector.
3. Include/exclude logic.
4. Tag filters.
5. Privacy mode.
6. Redaction pipeline.
7. Source summary renderer.
8. Token estimate.
9. Export preview API.
10. Copy button in UI.
11. Download button in UI.
12. CLI export command.
13. Deterministic output tests.

## Initial export targets

1. ChatGPT.
2. Claude.
3. Codex.
4. Generic Markdown.
5. JSON records.
6. llms.txt.
7. AGENTS.md.
8. CLAUDE.md.

Cursor, Claude Code, OpenCode, Open WebUI, AnythingLLM, Hermes, and OpenClaw can be accepted as aliases or deferred to Phase 18 depending on implementation cost.

## CLI

```text
contextarr export <pack-id> --profile <profile-id> --out <file>
contextarr export ./demo-packs/ai-workstation-pack --target claude --privacy redacted
```

## Do not build

1. External AI API calls.
2. Hosted export storage.
3. Share links.
4. Public pages.
5. Skills.
6. Agent Kits.
7. Executable workflows.

## Deliverables

```text
packages/export-profiles/src/**
apps/server/src/exports.ts
apps/server/src/api/export-routes.ts
apps/cli/src/export.ts
apps/web/src/components/exports/**
apps/web/src/pages/ExportsPage.tsx
docs/export-profiles.md
docs/redaction.md
```

## Acceptance criteria

1. Exports work for all five demo packs.
2. Export output is deterministic.
3. Redaction rules apply.
4. Redaction warnings appear before copy/download.
5. Export excludes draft, rejected, blocked, and invalid content by default.
6. Source summaries are included when profile requests them.
7. Token estimates are visible.
8. CLI and UI produce matching output for same profile.

## Checks

```text
pnpm --filter @contextarr/export-profiles test
pnpm --filter @contextarr/server test
pnpm --filter @contextarr/cli test
pnpm --filter @contextarr/web test
pnpm phase8:verify
```

# Phase 9: Read-Only MCP v0

## Version target

v0.0.9

## Goal

Expose approved, redaction-aware pack context to local AI clients through read-only MCP.

## User value

A local AI client can query Contextarr without manual copy-paste and without giving Contextarr execution authority.

## Build

1. MCP server command.
2. Tool schemas.
3. Tool handlers.
4. Local query logging.
5. Redaction-aware responses.
6. Review-status filtering.
7. Setup docs.
8. Demo script.

## MCP tools

1. `list_packs`.
2. `get_pack_summary`.
3. `query_pack_context`.
4. `get_record`.
5. `list_export_profiles`.
6. `build_export_preview`.

## MCP rules

1. No mutation.
2. No shell execution.
3. No network access.
4. No secret access.
5. No raw private source dump unless explicitly configured.
6. Respect privacy and redaction rules.
7. Return approved content only by default.
8. Log query metadata locally.

## Do not build

1. Mutating MCP tools.
2. Draft update tools.
3. Agent action tools.
4. Remote MCP hosting.
5. Skills MCP.
6. Agent Kit MCP.

## Deliverables

```text
apps/server/src/mcp/**
apps/cli/src/mcp.ts
docs/mcp.md
docs/mcp-security.md
docs/demo-mcp.md
```

## Acceptance criteria

1. Local MCP server starts.
2. MCP lists demo packs.
3. MCP returns pack summaries.
4. MCP queries approved record context.
5. MCP returns redacted output when configured.
6. MCP does not mutate files.
7. MCP does not execute anything.
8. MCP docs include setup examples.

## Checks

```text
pnpm --filter @contextarr/server test
pnpm --filter @contextarr/cli test
pnpm phase9:verify
```

# Phase 10: Importers v0

## Version target

v0.2 preview

## Goal

Import supported local sources into draft records while keeping human review mandatory.

## User value

Users can start building packs from existing local material without hand-authoring every record.

## Build

1. Importer framework.
2. Local folder importer.
3. Markdown folder importer.
4. Obsidian vault importer.
5. ChatGPT export parser, basic.
6. Claude export parser, basic.
7. Import dry-run report.
8. Draft record writer.
9. Source map writer.
10. Review Queue integration.
11. CLI import command.
12. Web import wizard v0.

## Import rules

1. Imports create draft records only.
2. Draft records are not exported by default.
3. Draft records are not exposed through MCP by default.
4. User must approve records.
5. Imports never execute content.
6. Imports do not call external APIs.
7. Imports do not fetch remote URLs by default.
8. File scanning respects allowlist.

## Supported inputs v0

1. Local folder.
2. Markdown folder.
3. Obsidian Markdown vault.
4. Official ChatGPT export file.
5. Claude export file if available in supported structure.

## Do not build

1. Direct Gmail connector.
2. Direct Google Drive connector.
3. Direct Slack connector.
4. Direct bank or brokerage connector.
5. Full OCR.
6. Deep codebase AST import.
7. External web crawler.
8. Always-on file watcher.

## Deliverables

```text
apps/server/src/importers/**
apps/cli/src/import.ts
apps/web/src/pages/ImportPage.tsx
apps/web/src/components/imports/**
docs/importers.md
docs/obsidian-import.md
docs/chat-export-import.md
```

## Acceptance criteria

1. Import dry-run shows what would be created.
2. Imports create draft records and source maps.
3. Drafts enter Review Queue.
4. Drafts validate as draft state.
5. Drafts are excluded from exports and MCP by default.
6. Obsidian import supports folder and tag filtering.
7. ChatGPT and Claude imports can group conversations into candidate records.
8. Import report is deterministic where possible.

## Checks

```text
pnpm --filter @contextarr/server test
pnpm --filter @contextarr/cli test
pnpm --filter @contextarr/web test
pnpm phase10:verify
```

# Phase 11: Composer v0

## Version target

v0.3 preview

## Goal

Allow users to compose custom temporary exports from selected packs, records, tags, privacy modes, and export targets.

## User value

Users can build task-specific context without creating a new permanent pack every time.

## Build

1. Composer API.
2. Composer UI.
3. Pack selector.
4. Record selector.
5. Tag filter.
6. Source-status filter.
7. Privacy filter.
8. Review-status filter.
9. Export target selector.
10. Export profile selector.
11. Token estimate.
12. Redaction warnings.
13. Preview output.
14. Copy output.
15. Download output.
16. Save temporary composition metadata.

## Composer modes

1. Temporary export.
2. Saved local composition.
3. Save as new pack, deferred to Phase 16.

## Do not build

1. Agent Kits.
2. Skills.
3. Workflow execution.
4. Marketplace sharing.
5. Public share links.

## Deliverables

```text
apps/server/src/composer/**
apps/web/src/pages/ComposerPage.tsx
apps/web/src/components/composer/**
apps/cli/src/compose.ts
docs/composer.md
```

## Acceptance criteria

1. User can select one or more packs.
2. User can select records by tag, type, privacy, and review status.
3. User can choose target and export profile.
4. Composer shows token estimate.
5. Composer shows redaction warnings.
6. Preview output matches export engine behavior.
7. Draft and blocked content are excluded by default.
8. Composer does not create Agent Kits.

## Checks

```text
pnpm --filter @contextarr/server test
pnpm --filter @contextarr/web test
pnpm --filter @contextarr/cli test
pnpm phase11:verify
```

# Phase 12: v0.1 Public Preview Launch

## Version target

v0.1 public preview

## Goal

Release a usable public preview of the local Context Pack core.

## User value

A user can clone, install, run, inspect demo packs, validate packs, view the dashboard, export context, and connect a local AI client through read-only MCP.

## Build

1. Quickstart docs.
2. Docker docs.
3. Security docs.
4. Pack authoring docs.
5. Export profile docs.
6. MCP docs.
7. Demo script.
8. Screenshots.
9. First release notes.
10. GitHub issue templates.
11. Troubleshooting docs.
12. Public README polish.

## Minimum demo flow

1. Run Docker Compose.
2. Open dashboard.
3. View AI Workstation Pack.
4. View records and sources.
5. See Pack Health.
6. Export Claude brief.
7. Connect read-only MCP.
8. Query pack context.
9. Open raw files.
10. Delete SQLite and rebuild.

## Do not build

1. Paid desktop app.
2. Hosted service.
3. Public marketplace.
4. Pro packs.
5. Skills.
6. Agent Kits.

## Deliverables

```text
docs/quickstart.md
docs/docker.md
docs/security.md
docs/pack-authoring.md
docs/export-profiles.md
docs/mcp.md
docs/demo-script.md
docs/troubleshooting.md
README.md
CHANGELOG.md
screenshots/placeholder-or-real-assets
```

## Acceptance criteria

1. Docker Compose works from clean checkout.
2. Demo packs load.
3. Validator passes.
4. Web UI works.
5. Static renderer works.
6. Exports work.
7. MCP docs are accurate.
8. No real private data.
9. Security boundaries are explicit.
10. Release notes state limitations.

## Checks

```text
pnpm -r test
pnpm -r build
pnpm demo:validate
pnpm docker:verify
pnpm phase12:verify
```

# Phase 13: Alpha Feedback Instrumentation Without Telemetry

## Version target

v0.1.1

## Goal

Collect useful feedback without shipping telemetry.

## User value

The project can improve based on real use while preserving trust.

## Build

1. Local diagnostics bundle generator.
2. Sanitized issue report template.
3. CLI system report command.
4. Web system status page.
5. Common failure detection.
6. Docs for manually sharing diagnostics.
7. Alpha feedback checklist.

## CLI

```text
contextarr doctor
contextarr doctor --json
contextarr diagnostics --redacted --out diagnostics.zip
```

## Privacy rules

1. No automatic telemetry.
2. No automatic upload.
3. Diagnostics are local by default.
4. Redacted diagnostics must exclude record bodies unless explicitly requested.
5. Pack IDs and file paths can be masked.

## Do not build

1. Remote analytics.
2. Usage tracking.
3. Crash upload.
4. Hosted support channel integration.

## Deliverables

```text
apps/cli/src/doctor.ts
apps/server/src/diagnostics.ts
apps/web/src/pages/SystemPage.tsx
docs/diagnostics.md
docs/alpha-feedback.md
```

## Acceptance criteria

1. Doctor command reports environment, config, database status, pack count, API status, and validation summary.
2. Redacted diagnostics bundle contains no private record bodies by default.
3. User must manually choose to share diagnostics.
4. Diagnostics docs warn about sensitive content.

## Checks

```text
pnpm --filter @contextarr/cli test
pnpm --filter @contextarr/server test
pnpm phase13:verify
```

# Phase 14: Importers v1

## Version target

v0.2 stable

## Goal

Make importers reliable enough for real alpha users.

## User value

Users can create useful draft Context Packs from real local notes and exports with controlled review.

## Build

1. Import sessions.
2. Import history.
3. Import diff preview.
4. Duplicate detection.
5. Source linking improvements.
6. Obsidian frontmatter mapping.
7. Obsidian link handling.
8. Chat export grouping improvements.
9. Claude export grouping improvements.
10. Markdown folder conventions.
11. Import templates by pack type.
12. Import validation report.

## Import session object

Fields:

1. `id`.
2. `sourceType`.
3. `sourcePath`.
4. `targetPackId`.
5. `startedAt`.
6. `completedAt`.
7. `status`.
8. `recordsProposed`.
9. `recordsCreated`.
10. `recordsSkipped`.
11. `warnings`.
12. `errors`.
13. `redactionHits`.

## Do not build

1. Always-on watcher.
2. Direct cloud connectors.
3. Direct email connectors.
4. Full OCR.
5. AI auto-approval.
6. Remote source crawling.

## Deliverables

```text
apps/server/src/importers/session.ts
apps/server/src/importers/markdown.ts
apps/server/src/importers/obsidian.ts
apps/server/src/importers/chatgpt.ts
apps/server/src/importers/claude.ts
apps/web/src/components/imports/**
docs/importer-session-format.md
```

## Acceptance criteria

1. Import sessions are visible in UI.
2. User can preview proposed records before writing.
3. Duplicate detection warns rather than overwrites.
4. Imported records remain draft.
5. Imported source maps are valid.
6. Importer errors are explainable.
7. Import sessions can be re-run without duplicating records blindly.

## Checks

```text
pnpm --filter @contextarr/server test
pnpm --filter @contextarr/web test
pnpm phase14:verify
```

# Phase 15: Guided Collectors v0

## Version target

v0.3 stable

## Goal

Add guided pack creation and update workflows without turning Contextarr into a chatbot.

## User value

Users can create high-quality packs faster, using structured forms and prompts that produce draft records for review.

## Build

1. Collector schema.
2. Collector templates.
3. Collector runner UI.
4. New Pack collector.
5. Update Pack collector.
6. Project collector.
7. Technical system collector.
8. Internal KB collector.
9. Product line collector.
10. Support process collector.
11. Draft record generation.
12. Review Queue integration.

## Collector types

1. Form collector.
2. Text interview collector, local UI only.
3. Import collector.
4. Update collector.

AI-assisted collectors are deferred unless they can run without external API calls and without auto-approval.

## Do not build

1. General chatbot.
2. Managed AI collector.
3. Voice collector.
4. Passive capture.
5. Auto-approved AI drafts.
6. Agent workflows.

## Deliverables

```text
packages/schema/src/collector.ts
apps/server/src/collectors/**
apps/web/src/pages/CollectorsPage.tsx
apps/web/src/components/collectors/**
docs/collectors.md
```

## Acceptance criteria

1. User can create a draft pack from a collector.
2. User can add draft records to an existing pack.
3. Collector output is draft by default.
4. Collector output includes source metadata.
5. Collector templates are fake/public-safe in examples.
6. Collectors do not call AI APIs.
7. Collectors do not execute scripts.

## Checks

```text
pnpm --filter @contextarr/schema test
pnpm --filter @contextarr/server test
pnpm --filter @contextarr/web test
pnpm phase15:verify
```

# Phase 16: Composer v1 and Save-as-Pack

## Version target

v0.4 stable

## Goal

Make Composer capable of creating durable composed packs from selected approved context.

## User value

Users can build project handoff packs, contractor packs, troubleshooting packs, and AI-ready briefs from existing source-backed records.

## Build

1. Save composition as new pack.
2. Composition manifest.
3. Derived-source references.
4. Redaction mode enforcement.
5. Pack lineage metadata.
6. Record copy or reference mode.
7. Conflict warnings.
8. Token budget warnings.
9. Export-first temporary mode.
10. Durable pack mode.

## Composition modes

1. Temporary export.
2. Saved composition.
3. New pack with copied records.
4. New pack with referenced source records, if safe and readable.

## Required new metadata

1. `derivedFromPacks`.
2. `derivedFromRecords`.
3. `compositionMode`.
4. `redactionMode`.
5. `createdByComposer`.
6. `sourcePackVersions`.

## Do not build

1. Agent Kits.
2. Skills.
3. Workflow runner.
4. Shared team packs.
5. Public publishing.

## Deliverables

```text
apps/server/src/composer/save-as-pack.ts
apps/web/src/components/composer/SaveAsPackDialog.tsx
packages/schema/src/composition.ts
docs/composed-packs.md
```

## Acceptance criteria

1. User can save selected records as a new pack.
2. New pack validates.
3. New pack contains clear lineage metadata.
4. Redacted packs do not include excluded sensitive records.
5. Composer warns on stale, unreviewed, or risky records.
6. New pack can be rendered, exported, and queried like normal packs.

## Checks

```text
pnpm --filter @contextarr/schema test
pnpm --filter @contextarr/server test
pnpm --filter @contextarr/web test
pnpm phase16:verify
```

# Phase 17: Maintenance Engine v1

## Version target

v0.5 stable

## Goal

Turn Pack Health into a durable weekly maintenance workflow.

## User value

Users maintain context quality over time instead of creating packs once and letting them rot.

## Build

1. Source update checker for local files.
2. Source hash comparison.
3. Manual source recheck.
4. Review cadence rules.
5. Stale record rules.
6. Pack owner metadata.
7. Review due dates.
8. Maintenance dashboard.
9. Health trend history.
10. Review session workflow.
11. Batch review actions.
12. Changelog generation helper.

## Source checking rules

1. Local files can be checked by path and content hash.
2. URLs are metadata only unless user explicitly requests a manual check.
3. No hidden network checks.
4. No automatic external crawling.
5. Source check results create review items.

## Review session workflow

1. User starts review session.
2. Contextarr lists highest priority issues.
3. User opens each item.
4. User edits local files externally or marks reviewed.
5. User rescans.
6. Health score updates.
7. Review session summary is saved locally.

## Do not build

1. AI contradiction scanner.
2. Auto-update from web.
3. Background external checks.
4. Push notifications.
5. Cloud reminders.

## Deliverables

```text
apps/server/src/maintenance/**
apps/web/src/pages/MaintenancePage.tsx
apps/web/src/components/maintenance/**
docs/maintenance.md
docs/source-checking.md
```

## Acceptance criteria

1. Local source changes produce review items.
2. Stale records are flagged by rules.
3. User can run a review session.
4. Health trend history is visible.
5. Review actions are local and deterministic.
6. No external network checks happen silently.

## Checks

```text
pnpm --filter @contextarr/server test
pnpm --filter @contextarr/web test
pnpm phase17:verify
```

# Phase 18: Export Profiles v1 and Target Adapters

## Version target

v0.6 stable

## Goal

Make exports excellent enough that users choose Contextarr because the output is better than manual copy-paste.

## User value

Users can generate high-quality briefs for different assistants, coding agents, local tools, and handoff situations.

## Build

1. Target adapter registry.
2. Target-specific section ordering.
3. Target-specific token guidance.
4. Target-specific safety preamble.
5. Task-specific export templates.
6. Contractor redacted brief.
7. Project handoff brief.
8. Coding-agent implementation brief.
9. Troubleshooting brief.
10. Internal KB answer brief.
11. Current state brief.
12. Export diff view.
13. Export history.

## v1 target list

1. ChatGPT.
2. Claude.
3. Codex.
4. Claude Code.
5. Cursor.
6. OpenCode.
7. Open WebUI.
8. AnythingLLM.
9. Hermes.
10. OpenClaw.
11. Generic Markdown.
12. JSON.
13. CSV tables.
14. llms.txt.
15. AGENTS.md.
16. CLAUDE.md.

## Export history

Store local metadata only:

1. Export ID.
2. Pack ID.
3. Profile ID.
4. Target.
5. Privacy mode.
6. Generated time.
7. Record count.
8. Token estimate.
9. Redaction warning count.
10. Output hash.

Do not store full export bodies by default unless user enables it.

## Do not build

1. Upload export to cloud.
2. Share link.
3. External AI API call.
4. Agent Kit export.
5. Skill export.

## Deliverables

```text
packages/export-profiles/src/targets/**
packages/export-profiles/src/templates/**
apps/server/src/exports/history.ts
apps/web/src/components/exports/ExportDiff.tsx
docs/export-targets.md
docs/export-history.md
```

## Acceptance criteria

1. Each target has documented formatting behavior.
2. Export outputs are deterministic.
3. Export history records metadata.
4. Export diff shows meaningful changes.
5. Redaction is enforced for privacy modes.
6. Users can create a useful coding-agent brief and contractor brief from demo packs.

## Checks

```text
pnpm --filter @contextarr/export-profiles test
pnpm --filter @contextarr/server test
pnpm --filter @contextarr/web test
pnpm phase18:verify
```

# Phase 19: Local API and MCP v1 Hardening

## Version target

v0.6.1

## Goal

Harden the API and read-only MCP for real power-user workflows.

## User value

Users can connect local clients confidently, knowing permissions and redaction rules are enforced.

## Build

1. Local auth token support.
2. API bind address safety.
3. LAN mode warning.
4. MCP permission profile.
5. MCP redaction mode config.
6. MCP result size limits.
7. MCP query log viewer.
8. MCP setup validation.
9. API error contract.
10. API docs.
11. MCP docs.

## Security defaults

1. Bind to localhost.
2. Require local token when API is enabled outside default UI path.
3. LAN mode off by default.
4. Clear warning before LAN mode.
5. MCP returns approved content only by default.
6. MCP respects export and redaction profiles.
7. Raw source body access disabled by default.

## Do not build

1. Remote API service.
2. Hosted MCP.
3. Mutating MCP tools.
4. Agent action tools.
5. OAuth integrations.

## Deliverables

```text
apps/server/src/auth/**
apps/server/src/mcp/config.ts
apps/web/src/pages/McpSettingsPage.tsx
docs/api-security.md
docs/mcp-permissions.md
```

## Acceptance criteria

1. API never binds to `0.0.0.0` unless explicitly configured.
2. LAN mode shows warning.
3. MCP permission profile is visible.
4. MCP result limits prevent accidental huge dumps.
5. Query logs are local.
6. Redaction rules apply in MCP.
7. Tests cover blocked raw private source access.

## Checks

```text
pnpm --filter @contextarr/server test
pnpm --filter @contextarr/web test
pnpm phase19:verify
```

# Phase 20: Security, Redaction, Backup, and Trust Hardening

## Version target

v0.7 stable

## Goal

Prepare the product for serious local use by strengthening safety, backups, redaction, and import trust.

## User value

Users trust the tool with sensitive operational context because boundaries and recovery paths are clear.

## Build

1. Redaction rule test UI.
2. Redaction preview by export profile.
3. Secret scanner improvements.
4. Pack allowlist and blocklist.
5. Local zip import safety.
6. Backup export.
7. Backup restore.
8. Encrypted backup archive option.
9. Settings export.
10. Settings import.
11. Safe upgrade checks.
12. Security docs refresh.

## Backup rules

1. Backups are local.
2. Encrypted backups are optional.
3. No hosted backup.
4. Backup restore validates packs before activation.
5. Backup restore does not bypass safety scans.

## Trust controls

1. Imported local zip marked unreviewed.
2. Imported packs validate before activation.
3. Packs with blocked issues cannot activate.
4. User can block a pack locally.
5. User can mark a pack deprecated.

## Do not build

1. Public registry.
2. Remote install by default.
3. Signature trust network.
4. Team registry.
5. Auto-update packs from URLs.

## Deliverables

```text
apps/server/src/backups/**
apps/server/src/security/**
apps/web/src/pages/SecurityPage.tsx
apps/web/src/pages/BackupPage.tsx
docs/backups.md
docs/restore.md
docs/trust-model-v0.md
```

## Acceptance criteria

1. User can export local backup.
2. User can restore from backup.
3. Optional encrypted backup works.
4. Restored packs are validated.
5. Redaction preview shows exact matches and actions.
6. Blocked packs cannot activate.
7. Imported zips are unreviewed by default.

## Checks

```text
pnpm --filter @contextarr/server test
pnpm --filter @contextarr/web test
pnpm phase20:verify
```

# Phase 21: Packaging and Distribution Hardening

## Version target

v0.8 stable

## Goal

Make installation, upgrade, and day-to-day operation reliable for the target audience.

## User value

Users can install Contextarr without reverse-engineering the repo.

## Build

1. Docker Compose stable deployment.
2. Local development setup docs.
3. Production-ish local deployment docs.
4. Volume layout docs.
5. Upgrade guide.
6. Migration checks.
7. Config reference.
8. Troubleshooting guide.
9. Release checklist.
10. Semantic versioning policy.
11. Schema version policy.
12. Migration test suite.

## Optional packaging research

Research only:

1. Tauri desktop wrapper.
2. Electron desktop wrapper.
3. Homebrew formula.
4. npm CLI distribution.
5. Windows installer.

Do not build paid Studio yet.

## Do not build

1. Paid desktop app.
2. Auto-update service.
3. Hosted service.
4. Telemetry.
5. Cloud sync.

## Deliverables

```text
docs/docker.md
docs/install.md
docs/upgrade.md
docs/config-reference.md
docs/release-process.md
docs/schema-versioning.md
docs/pack-migrations.md
scripts/verify-release.sh
```

## Acceptance criteria

1. Clean Docker Compose install works.
2. Upgrade from previous minor version preserves packs.
3. Database rebuild after upgrade works.
4. Config docs cover all environment variables.
5. Release checklist is complete.
6. Schema changes have migration notes.

## Checks

```text
pnpm -r test
pnpm -r build
pnpm docker:verify
pnpm release:verify
pnpm phase21:verify
```

# Phase 22: Real-User Alpha and Product Gate

## Version target

v0.8.1

## Goal

Use real alpha behavior to decide whether v1.0 is justified and what must be fixed.

## User value

The product gets shaped by actual pack maintenance and export workflows, not imagined feature lists.

## Build

1. Alpha onboarding guide.
2. Alpha test checklist.
3. Manual feedback form template.
4. Setup service playbook.
5. Migration service playbook.
6. Alpha issue labels.
7. Known issues page.
8. v1.0 readiness dashboard, local only.

## Product gates

Continue to v1.0 only if most of these are true:

1. At least 20 serious alpha users.
2. At least 10 users still maintaining packs after one month.
3. At least 50 percent of active alpha users export to more than one AI tool.
4. At least 5 users ask for setup or migration help.
5. At least 3 users create their own packs without direct handholding.
6. At least 3 users ask for better importers or export profiles.
7. Security concerns are manageable and not category-killing.

If these fail, pause broadening and improve the core loop.

## Do not build

1. New feature category.
2. Skills.
3. Agent Kits.
4. Desktop app.
5. Cloud.
6. Registry.

## Deliverables

```text
docs/alpha-onboarding.md
docs/alpha-feedback.md
docs/setup-service-playbook.md
docs/migration-service-playbook.md
docs/v1-readiness.md
```

## Acceptance criteria

1. Alpha users can onboard from docs.
2. Feedback can be collected manually.
3. Setup service path is documented.
4. Product gate metrics are reviewed.
5. Roadmap is cut based on evidence.

## Checks

```text
pnpm docs:check
pnpm phase22:verify
```

# Phase 23: v1.0 Schema Freeze Candidate

## Version target

v0.9 release candidate

## Goal

Freeze the core Context Pack schema enough for stable use.

## User value

Users can trust that pack files they create now will not break casually.

## Build

1. Schema compatibility review.
2. Manifest schema freeze candidate.
3. Record frontmatter freeze candidate.
4. Source map schema freeze candidate.
5. Export profile schema freeze candidate.
6. Validation report schema freeze candidate.
7. Migration guide.
8. Backward compatibility tests.
9. Fixture compatibility suite.
10. Versioned docs.

## Schema freeze rules

1. No breaking schema change after v1.0 without major version process.
2. Additive fields are allowed with defaults.
3. Required fields must be justified.
4. Deprecated fields get warning period.
5. Migration helpers are required for breaking changes before v1.0.

## Do not build

1. New product objects.
2. Skills.
3. Agent Kits.
4. Registry trust protocol.
5. New importer classes unless critical.

## Deliverables

```text
docs/schema-v1.md
docs/migration-to-v1.md
docs/compatibility.md
packages/schema/test/compatibility/**
packages/pack-validator/test/compatibility/**
```

## Acceptance criteria

1. Existing demo packs validate under v1 schema.
2. Existing alpha packs can be migrated or validated with clear warnings.
3. Validation report schema is stable.
4. Schema docs are complete.
5. Compatibility tests pass.

## Checks

```text
pnpm --filter @contextarr/schema test
pnpm --filter @contextarr/pack-validator test
pnpm compatibility:verify
pnpm phase23:verify
```

# Phase 24: v1.0 UI and UX Hardening

## Version target

v0.9.1 release candidate

## Goal

Make the local dashboard coherent, fast, and stable enough for v1.0.

## User value

Users can understand Contextarr without reading every doc and can maintain packs without fighting the UI.

## Build

1. Navigation cleanup.
2. Dashboard empty states.
3. Pack Library polish.
4. Pack Detail polish.
5. Review Queue polish.
6. Composer polish.
7. Importer UI polish.
8. Export UI polish.
9. Settings polish.
10. System page polish.
11. Error boundaries.
12. Keyboard shortcuts for power users.
13. Accessibility pass.
14. Responsive desktop-first layout.

## UI quality rules

1. Dense table views must work well.
2. Power-user workflows must not be hidden behind wizard-only flows.
3. Every warning should link to the exact pack, record, source, or export profile.
4. Every generated output should have preview, copy, and download where relevant.
5. No decorative complexity unless it helps review, export, or maintenance.

## Do not build

1. Mobile app.
2. Chat UI.
3. Marketplace UI.
4. Team collaboration UI.
5. Agent execution UI.

## Deliverables

```text
apps/web/src/pages/**
apps/web/src/components/**
apps/web/src/styles/**
docs/ui-workflows.md
```

## Acceptance criteria

1. User can complete demo flow without CLI.
2. User can complete power-user flow with CLI only.
3. Main pages have useful empty states.
4. Warnings link to actionable detail.
5. UI build passes.
6. Accessibility baseline passes.

## Checks

```text
pnpm --filter @contextarr/web test
pnpm --filter @contextarr/web build
pnpm ui:verify
pnpm phase24:verify
```

# Phase 25: v1.0 Security Review and Abuse Case Review

## Version target

v0.9.2 release candidate

## Goal

Review the product against the risks of prompt injection, unsafe imports, pack abuse, secret leakage, and accidental over-export.

## User value

Users get a product with clear safety boundaries before it is called stable.

## Build

1. Security checklist.
2. Abuse case checklist.
3. Red team fixture packs.
4. Unsafe import tests.
5. Secret leakage tests.
6. Export over-disclosure tests.
7. MCP boundary tests.
8. API binding tests.
9. Backup restore safety tests.
10. Docs warning pass.

## Abuse cases to test

1. Pack contains shell command disguised as instructions.
2. Pack contains credential request.
3. Pack contains hidden prompt injection.
4. Pack contains script file.
5. Import creates sensitive draft.
6. Export profile includes sensitive tag accidentally.
7. MCP tries to fetch raw private source.
8. Zip import contains unsafe file.
9. Backup restore contains invalid pack.
10. Local API binds too broadly.

## Do not build

1. Security theater badges.
2. Public trust claims beyond what is tested.
3. Marketplace review process.
4. Remote signature infrastructure.

## Deliverables

```text
docs/security-review-v1.md
docs/abuse-cases.md
packages/pack-validator/test/security-fixtures/**
apps/server/src/**/*.security.test.ts
```

## Acceptance criteria

1. All listed abuse cases have tests or documented mitigations.
2. Critical unsafe packs are blocked.
3. Redaction and export tests pass.
4. MCP cannot mutate or execute.
5. API binding defaults to localhost.
6. Security docs are plain and specific.

## Checks

```text
pnpm security:verify
pnpm -r test
pnpm phase25:verify
```

# Phase 26: v1.0 Documentation, Examples, and Demo Assets

## Version target

v0.9.3 release candidate

## Goal

Finish docs and demo assets for serious public release.

## User value

Users can learn, install, author packs, import data, review context, export briefs, and connect MCP without guessing.

## Build

1. README final pass.
2. Quickstart final pass.
3. Pack authoring guide.
4. Importer guide.
5. Composer guide.
6. Export guide.
7. MCP guide.
8. Security guide.
9. Backup and restore guide.
10. Troubleshooting guide.
11. Demo video script.
12. Screenshots.
13. Example workflows.
14. FAQ.
15. Roadmap.

## Required example workflows

1. Build from demo pack.
2. Build from Markdown folder.
3. Build from Obsidian vault.
4. Import ChatGPT export into draft pack.
5. Review draft records.
6. Export Claude brief.
7. Export Codex implementation brief.
8. Build redacted contractor brief.
9. Query read-only MCP.
10. Delete SQLite and rebuild.

## Do not build

1. Public pack content farm.
2. Third-party docs-derived examples.
3. Real personal data examples.
4. Paid marketing pages.

## Deliverables

```text
README.md
docs/quickstart.md
docs/pack-authoring.md
docs/importers.md
docs/composer.md
docs/export-profiles.md
docs/mcp.md
docs/security.md
docs/backups.md
docs/troubleshooting.md
docs/faq.md
docs/roadmap.md
docs/demo-script.md
screenshots/**
```

## Acceptance criteria

1. Docs are internally consistent.
2. Docs match current commands.
3. Demo flow can be followed from scratch.
4. No docs imply hosted cloud, marketplace, or execution.
5. No private data in screenshots.
6. Roadmap clearly separates v1.0 from future Skills and Agent Kits.

## Checks

```text
pnpm docs:check
pnpm demo:verify
pnpm phase26:verify
```

# Phase 27: v1.0 Release Candidate

## Version target

v1.0.0-rc.1

## Goal

Cut a release candidate and test the full product like a user would.

## User value

Users get a stable candidate with known limitations and reproducible installation.

## Build

1. Release candidate tag.
2. Release notes.
3. Install verification.
4. Upgrade verification.
5. Demo verification.
6. Pack validation verification.
7. Renderer verification.
8. Export verification.
9. MCP verification.
10. Backup/restore verification.
11. Security verification.
12. Known issues page.

## Release candidate gates

1. No critical security failures.
2. No broken Docker install.
3. No schema migration break without docs.
4. No invalid demo packs.
5. No export failure for primary targets.
6. No MCP mutation path.
7. No hidden network calls.
8. No telemetry.

## Do not build

1. New features except fixes.
2. Scope additions.
3. Skills.
4. Agent Kits.
5. Studio.
6. Registry.

## Deliverables

```text
CHANGELOG.md
RELEASE_NOTES.md
docs/known-issues.md
v1.0.0-rc.1 tag or prepared release artifact
```

## Acceptance criteria

1. Full clean install passes.
2. Full demo flow passes.
3. Tests pass.
4. Docs are current.
5. Known issues are documented.
6. Release notes state what v1.0 is and is not.

## Checks

```text
pnpm -r test
pnpm -r build
pnpm demo:validate
pnpm docker:verify
pnpm security:verify
pnpm release:verify
```

# Phase 28: v1.0 Stable Release

## Version target

v1.0.0

## Goal

Release the stable local Context Pack core.

## User value

Contextarr is ready for serious local use by power users, developers, self-hosted users, consultants, and internal KB owners.

## Build

1. Final release tag.
2. Final release notes.
3. GitHub release.
4. README stable badge.
5. v1.0 docs published in repo.
6. Demo video or script-ready asset.
7. Issue triage labels.
8. Support and setup service page draft, optional.
9. Post-v1 roadmap.

## v1.0 feature set

1. Context Pack schema.
2. Context Pack validator.
3. Deterministic validation reports.
4. Demo packs.
5. Rebuildable SQLite index.
6. Local API.
7. Local dashboard.
8. Sanitized Markdown rendering.
9. Static HTML renderer.
10. Pack Health.
11. Review Queue.
12. Redaction rules.
13. Export engine.
14. Target-specific exports.
15. Read-only MCP.
16. Local importers.
17. Guided collectors.
18. Composer.
19. Maintenance dashboard.
20. Backup and restore.
21. Security docs.
22. Docker install.
23. CLI.
24. Full docs.

## v1.0 explicit exclusions

1. No hosted cloud.
2. No hosted sync.
3. No public marketplace.
4. No registry implementation.
5. No executable packs.
6. No agent runner.
7. No chatbot UI.
8. No direct Gmail connector.
9. No direct banking connector.
10. No telemetry.
11. No Skills.
12. No Agent Kits.
13. No paid desktop app yet.

## Acceptance criteria

1. A new user can install with Docker Compose.
2. Demo packs load and validate.
3. User can author or import a pack.
4. User can review draft records.
5. User can see Pack Health.
6. User can export redacted and full briefs.
7. User can use read-only MCP.
8. User can render static HTML.
9. User can back up and restore.
10. User can inspect all source files.
11. User can delete SQLite and rebuild.
12. Security boundaries are visible and tested.
13. No non-goal slipped in.

## Checks

```text
pnpm -r test
pnpm -r build
pnpm demo:validate
pnpm docker:verify
pnpm security:verify
pnpm release:verify
```

# 10. v1.0 Success Criteria

## 10.1 Technical success

Contextarr v1.0 succeeds technically if:

1. It validates Context Packs deterministically.
2. It indexes packs into rebuildable SQLite.
3. It renders packs safely for humans.
4. It shows useful Pack Health and Review Queue state.
5. It exports high-quality context for multiple AI tools.
6. It exposes approved, redacted context through read-only MCP.
7. It imports local sources into drafts.
8. It supports review before trust.
9. It composes custom exports and packs.
10. It has stable Docker, CLI, API, and docs.
11. It passes security and abuse-case tests.
12. It avoids all explicit non-goals.

## 10.2 User success

Contextarr v1.0 succeeds for users if:

1. They maintain packs after initial setup.
2. They export to more than one AI tool.
3. They use Pack Health to fix stale or unsafe context.
4. They trust the local file model.
5. They can explain what leaves their machine and when.
6. They prefer Contextarr exports over manually assembled prompts.
7. They ask for more adapters, importers, templates, or setup help rather than asking for a chatbot.

## 10.3 Open-source success

Signals:

1. GitHub stars from relevant technical users.
2. Issues about schema, validators, importers, exports, and MCP.
3. Pull requests for adapters, docs, and demo packs.
4. Users sharing local pack authoring conventions.
5. Users asking for official templates.
6. Users asking for setup services.

## 10.4 Monetization readiness

v1.0 makes monetization plausible if users ask for:

1. Paid setup.
2. Paid migration.
3. Paid Pro templates.
4. Paid vertical collectors.
5. Paid desktop packaging.
6. Private team distribution.

Do not build paid Studio before the core has usage evidence.

# 11. Kill, Pause, or Refocus Signals

Pause or refocus if:

1. Users only see Contextarr as another memory server.
2. Users do not care about pack files.
3. Users do not export to more than one AI tool.
4. Users do not maintain packs after setup.
5. Review Queue feels like busywork.
6. Importers create too much unusable draft noise.
7. Security concerns dominate feedback.
8. Users mainly ask for cloud sync before they use the local product.
9. Users mainly ask for an agent runner.
10. The UI becomes more complicated than the pack workflow.

If these happen, do not expand into Skills, Agent Kits, marketplace, cloud, or Studio. Fix the core loop.

# 12. Post-v1.0 Roadmap Gate

After v1.0, choose the next product path based on evidence.

## 12.1 Path A: Improve the Context Pack core

Choose if users ask for:

1. Better importers.
2. Better exports.
3. Better review workflows.
4. Better pack templates.
5. Better local search.
6. Better dashboard.

## 12.2 Path B: Contextarr Studio

Choose if users like the product but struggle with install, YAML, folders, or CLI.

Studio can be a paid local convenience layer.

Do not make Studio a hosted vault.

## 12.3 Path C: Setup and migration services

Choose if users want help converting existing notes, prompts, project docs, or KBs.

This is likely the first realistic revenue path.

## 12.4 Path D: Skills and Agent Kits

Choose only if users already maintain Context Packs and repeatedly ask for reusable task instructions paired with packs.

Skills and Agent Kits remain data-only and non-executable.

Contextarr prepares them. It does not run them.

## 12.5 Path E: Private team registry research

Choose only if small teams need controlled internal distribution.

Start with research, signing, checksums, trust levels, and review workflows.

Do not build a public marketplace.

# 13. Recommended Next Implementation Order

Use this order without skipping:

1. Phase 0 if not already complete.
2. Phase 1 schema and validator.
3. Phase 2 demo packs.
4. Phase 3 local index and API.
5. Phase 4 web dashboard shell.
6. Phase 5 pack detail and record rendering.
7. Phase 6 static renderer.
8. Phase 7 Pack Health and Review Queue.
9. Phase 8 export engine.
10. Phase 9 read-only MCP.
11. Phase 12 v0.1 public preview if you want early feedback.
12. Phase 10 importers v0.
13. Phase 11 Composer v0.
14. Phase 14 importers v1.
15. Phase 15 collectors v0.
16. Phase 16 Composer v1.
17. Phase 17 maintenance engine.
18. Phase 18 export profiles v1.
19. Phase 19 API and MCP hardening.
20. Phase 20 security, redaction, backup, and trust hardening.
21. Phase 21 packaging.
22. Phase 22 alpha gate.
23. Phase 23 schema freeze.
24. Phase 24 UI hardening.
25. Phase 25 security review.
26. Phase 26 docs and demo assets.
27. Phase 27 release candidate.
28. Phase 28 v1.0 stable release.

Note: Phase 10 and Phase 11 are listed after Phase 12 in this recommended order only if you want an earlier v0.1 public preview after the core export and MCP loop. If you want to follow the original PRD order exactly, complete Phase 10 and Phase 11 before Phase 12.

# 14. Final v1.0 Definition of Done

Contextarr reaches v1.0 when this statement is true:

```text
A skeptical power user can install Contextarr locally, inspect every source file, validate and maintain Context Packs, import local context into drafts, approve records, render packs for human review, export redacted or full AI-ready briefs to multiple tools, query approved context through read-only MCP, back up and restore their local state, delete SQLite and rebuild derived indexes, and verify that Contextarr does not execute pack content, run agents, phone home, or hide data flow.
```

That is v1.0.

Everything else waits.
