# Implementation Status

This document is the source of truth for current versus planned Contextarr behavior. Roadmaps, product-defense docs, command contracts, and safety models may define target requirements. Check this file before treating any capability as shipped.

## Status Labels

| Label | Meaning |
|---|---|
| Current | Implemented in the repo today. |
| Partial | Some behavior exists, but important target requirements are missing. |
| Planned | Documented as an intended contract, not implemented yet. |
| Required Before Complete | A gate that must exist before the related phase can be called complete. |
| Future | Later product direction after the current core proves adoption. |
| Rejected | Explicitly out of scope unless a future task reverses the boundary. |

## Agent Rule

Future agents must verify this file, `package.json`, and the relevant implementation files before claiming a command, export target, safety gate, or product surface exists. If this file conflicts with roadmap language, treat the roadmap as target planning and this file as shipped-status truth.

## Product Surfaces

| Capability | Status | Target phase | Evidence path | Notes |
|---|---|---|---|---|
| Local Fastify API | Current | Phase 3+ | `apps/server/src/api.ts`; `apps/server/src/main.ts` | Serves local pack, record, health, review, export preview, compose preview, and rescan routes from rebuildable SQLite derived state. Non-loopback binds require `CONTEXTARR_API_TOKEN`. |
| React/Vite dashboard | Current | Phase 4-7 / Phase 11 | `apps/web/src/App.tsx`; `apps/web/src/api.ts` | Local power-user dashboard for Library, pack details, records, Pack Health, Review Queue, Exports, and Composer. |
| Docker Compose local preview | Current | Phase 11 | `Dockerfile`; `docker-compose.yml`; `tools/launch/verify-docker.mjs` | Local preview only. Serves the built web app and API from one Fastify process with demo packs mounted read-only. |
| Composer preview | Current | Phase 11 | `packages/export-profiles/src/index.ts`; `apps/server/src/api.ts`; `apps/web/src/composer.ts` | Builds temporary redacted export previews from selected indexed records. Does not write composed packs or mutate source files. |
| Public Astro site | Current | Public alpha housekeeping | `apps/site/`; `package.json` | Static public site and llms text pages. Verified by `pnpm site:verify`; not a hosted product runtime. |

## Verification And CI

| Capability | Status | Target phase | Evidence path | Notes |
|---|---|---|---|---|
| `pnpm typecheck` / `pnpm test` | Current | Core | `package.json`; `vitest.config.ts` | Main TypeScript and Vitest verification. |
| `pnpm docs:verify` | Current | Phase 11+ | `tools/launch/verify-docs.mjs` | Launch-doc guard for required public-preview files and security wording. |
| `pnpm site:verify` | Current | Public alpha housekeeping | `package.json`; `apps/site/package.json` | Runs Astro diagnostics and static site build. |
| `pnpm quality:verify` | Current | G4 | `package.json` | Runs the local deterministic benchmark gate without external model calls or network fetches. |
| `pnpm safety:verify` | Current | Safety gate v1 | `package.json` | Focused package-level safety regression lane for exports, API/server behavior, and MCP behavior. |
| GitHub Actions CI | Current | Public alpha housekeeping | `.github/workflows/ci.yml` | Runs `phase11:verify`, `site:verify`, and `quality:verify` on pull requests and pushes to `main`. |

## CLI Commands

| Capability | Status | Target phase | Evidence path | Notes |
|---|---|---|---|---|
| `contextarr validate <path>` | Current | Phase 1 | `apps/cli/src/index.ts` | Supports text output, legacy `--format json`, stable `--json`, and `--agent`. |
| `contextarr render <path> --out <path>` | Current | Phase 6 | `apps/cli/src/index.ts` | Writes static HTML derived output. Supports `--dry-run`, `--json`, `--agent`, and `--yes` for agent-confirmed writes. |
| `contextarr export <path> --profile <id> --out <path>` | Current | Phase 8 | `apps/cli/src/index.ts` | Profile-driven export generation. Supports `--dry-run`, `--json`, `--agent`, and `--yes` for agent-confirmed writes. |
| `contextarr export <path> --target <target> --out <path>` | Current | Phase 8 | `apps/cli/src/index.ts` | Alias for an existing export profile whose `target` field matches the requested target. It does not generate future target artifacts such as `agents-md`, `claude-md`, or `llms-txt`. |
| `contextarr export <path> --all --out <path>` | Current | Phase 8 | `apps/cli/src/index.ts` | Generates every profile in the target pack or pack folder. Supports the same current output/dry-run flags as profile export. |
| `contextarr import <path> --kind <kind> --out <path>` | Current | Phase 10 | `apps/cli/src/index.ts`; `packages/importers/src/index.ts` | Generates draft packs. Supports `--dry-run`, `--json`, `--agent`, and `--yes` for agent-confirmed writes. It is not quarantine or activation. |
| `contextarr benchmark run <task-id> --sample-only` | Current | G3 | `apps/cli/src/index.ts`; `packages/context-quality/src/index.ts`; `demo-evals/` | Runs local deterministic diagnostic scoring against accepted G2 fixture inputs and in-memory Contextarr export output. Supports `--json`, `--agent`, `--fixtures`, `--packs`, and optional local `--outputs`. No external AI calls, network fetches, telemetry, release gates, or CI enforcement. |
| `contextarr benchmark report <task-id> --out <path>` | Current | G3 | `apps/cli/src/index.ts`; `packages/context-quality/src/index.ts` | Writes local derived diagnostic JSON and Markdown benchmark reports. Supports `--json`, `--agent`, `--yes`, `--fixtures`, `--packs`, and optional local `--outputs`. No gate behavior or CI enforcement. |
| `contextarr benchmark gate <task-id> --sample-only` / `contextarr benchmark gate --all --sample-only` | Current | G4 | `apps/cli/src/index.ts`; `packages/context-quality/src/index.ts`; `apps/cli/src/index.test.ts`; `packages/context-quality/src/index.test.ts` | Runs a local deterministic benchmark gate over accepted demo fixtures and G3 reports. Supports `--json`, `--agent`, `--fixtures`, `--packs`, optional local `--outputs`, optional `--out`, and `--min-export-score` with default `80`. Fails when Contextarr export is missing, fails safety, misses required facts, leaks sensitive values, scores below threshold, or does not beat no-context. No external AI calls, network fetches, telemetry, cloud services, CI workflows, public release automation, model leaderboards, registry behavior, marketplace behavior, Skills, or Agent Kits. |
| `pnpm benchmark:demo` / `pnpm benchmark:report` | Current | G4 | `package.json` | Local package scripts for the G4 gate. `benchmark:demo` runs the gate without writing reports; `benchmark:report` writes local derived reports to ignored `benchmark-reports/`. No CI enforcement is added. |
| `--format json` on supported commands | Current | Phase 1+ | `apps/cli/src/index.ts` | Legacy raw JSON path where it already existed. |
| `--json` and `--agent` on implemented commands | Current | Phase 0A command contract alignment | `apps/cli/src/index.ts`; `apps/cli/src/result-types.ts` | Stable `contextarr.cli-result.v1` envelopes for current commands only. |
| `--dry-run` on `render`, `export`, and `import` | Current | Phase 0A command contract alignment | `apps/cli/src/index.ts` | Preview mode for existing write commands. |
| `contextarr inspect`, `list`, and `rescan` | Current | CLI parity after safety | `apps/cli/src/index.ts`; `apps/cli/src/index.test.ts` | Read-only source-file inspection over a temporary derived SQLite index. Supports `--packs`, `--json`, and `--agent`. |
| `contextarr health`, `review list`, and `review show` | Current | CLI parity after safety | `apps/cli/src/index.ts`; `apps/cli/src/index.test.ts` | Read-only Pack Health and Review Queue inspection. CLI review mutation commands remain planned. |
| `contextarr brief` and `query` | Current | CLI parity after safety | `apps/cli/src/index.ts`; `apps/cli/src/index.test.ts` | Deterministic approved-content-only read commands over local pack data. `contextarr brief --markdown` is implemented for text-mode Markdown output. |
| Generated target artifacts, full privacy overrides, `mcp doctor`, and future global modes | Planned | Later implementation | `docs/cli-command-contract.md` | Do not document as runnable until CLI code supports them. Existing export profile targets are supported by `contextarr export --target <target>`. |
| CLI review mutation commands with `--yes` | Planned | Phase 7 | `docs/cli-command-roadmap.md` | Web/API review status actions exist; CLI review commands do not. |
| CLI quarantine commands | Planned | Phase 10 / Post-core | `docs/import-quarantine.md` | No quarantine command family is implemented. |

## Export Targets And Export Gates

| Capability | Status | Target phase | Evidence path | Notes |
|---|---|---|---|---|
| ChatGPT export target | Current | Phase 8 | `packages/export-profiles/src/index.ts`; `demo-packs/*/exports/*.json` | Supported target. |
| Claude export target | Current | Phase 8 | `packages/export-profiles/src/index.ts`; `demo-packs/*/exports/*.json` | Supported target. |
| Codex export target | Current | Phase 8 | `packages/export-profiles/src/index.ts`; `demo-packs/*/exports/*.json` | Supported target. |
| Markdown and generic Markdown targets | Current | Phase 8 | `packages/export-profiles/src/index.ts` | Supported target. |
| JSON and JSON records targets | Current | Phase 8 | `packages/export-profiles/src/index.ts` | Supported target. |
| Claude Code export target | Planned | Phase 8 target set maturity | `docs/export-quality-bar.md` | Not currently in supported target set. |
| Generated `AGENTS.md` export | Planned | Phase 8 target set maturity | `docs/export-quality-bar.md` | Not currently in supported target set. |
| Generated `CLAUDE.md` export | Planned | Phase 8 target set maturity | `docs/export-quality-bar.md` | Not currently in supported target set. |
| `llms.txt` export | Planned | Phase 8 target set maturity | `docs/export-quality-bar.md` | Site docs may publish llms files; pack export target is not current. |
| Token estimate in export artifacts | Current | Phase 8 | `packages/export-profiles/src/index.ts` | Export artifacts include an estimated token count. |
| Export history and export diff | Planned | Post-core / later Phase 8 polish | `docs/export-quality-bar.md` | No local export history or diff feature is current. |
| Approved-content-only export gate | Current | Phase 8 / Safety gate v1 | `packages/export-profiles/src/index.ts`; `packages/export-profiles/src/index.test.ts` | Shared trusted visibility helper excludes unapproved, private, sensitive, secret, and blocked-tag records from pack and composed trusted exports. |

## MCP Behavior

| Capability | Status | Target phase | Evidence path | Notes |
|---|---|---|---|---|
| Stdio MCP server | Current | Phase 9 | `apps/mcp/src/server.ts`; `README.md` | Current MCP transport is stdio. |
| Read-only MCP tools | Current | Phase 9 | `apps/mcp/src/tools.ts` | Current tools are `list_packs`, `get_pack_summary`, `query_pack_context`, `get_record`, `list_export_profiles`, and `build_export_preview`. |
| MCP local query metadata logs | Current | Phase 9 | `apps/mcp/src/tools.ts`; `apps/server/src/db.ts` | Logs tool metadata, hashes, counts, timing, and sanitized metadata. |
| MCP privacy body, preview, and result limits | Current | Phase 9 / Safety gate v1 | `apps/mcp/src/tools.ts`; `apps/mcp/src/config.ts` | Private body access is controlled by config; export previews use deterministic truncation through `CONTEXTARR_MCP_MAX_PREVIEW_CHARS`. |
| Approved-content-only MCP visibility | Current | Phase 9 / Safety gate v1 | `apps/mcp/src/tools.ts`; `apps/mcp/src/tools.test.ts` | Query/get/export-preview paths use trusted visibility defaults and reject or omit unapproved records. |
| Localhost/LAN MCP modes | Planned | Future HTTP/remote-capable MCP only | `docs/mcp-safety-model.md` | Current MCP is stdio, so bind/LAN language applies only to future network exposure. |
| Mutating MCP tools | Rejected | All phases | `docs/mcp-safety-model.md` | Do not add mutation tools. |

## Import And Quarantine

| Capability | Status | Target phase | Evidence path | Notes |
|---|---|---|---|---|
| Folder, Markdown, Obsidian, ChatGPT, and Claude importers | Current | Phase 10 | `packages/importers/src/index.ts` | Importers generate draft packs. |
| Imported records default to draft/private/imported state | Current | Phase 10 | `packages/importers/src/index.ts` | Draft packs are generated under local output folders. |
| Local import quarantine state machine | Planned | Phase 10 / Post-core | `docs/import-quarantine.md` | Planning only; no quarantine storage or activation flow exists. |
| Quarantine activation/block/delete commands | Planned | Phase 10 / Post-core | `docs/import-quarantine.md` | Do not treat command examples as current. |
| Registry artifact quarantine | Future | Phase 3A / Post-core | `docs/registry-readiness.md` | Requires registry artifacts, scanner, signing, and revocation first. |

## Pack Health And Review Queue

| Capability | Status | Target phase | Evidence path | Notes |
|---|---|---|---|---|
| Pack Health v0 | Current | Phase 7 | `apps/server/src/health.ts` | Current statuses are `healthy`, `degraded`, and `needs_review`. |
| Review item generation | Current | Phase 7 | `apps/server/src/health.ts` | Current item types cover validation, freshness, export safety, review status, trust, and source coverage. |
| SQLite-backed review item status actions | Current | Phase 7 | `apps/server/src/api.ts`; `apps/web/src/App.tsx` | Current statuses include `open`, `ignored`, `accepted`, `reviewed`, and `resolved`. |
| Scorecard labels `Ready`, `Blocked`, `Draft`, `Unreviewed`, `Deprecated`, `Revoked` | Planned | Phase 7 target refinement / future registry | `docs/pack-health-scorecard.md` | Target vocabulary, not current API status names. |
| Review Queue actions for open source/file, block export, reopen, show affected exports/MCP | Planned | Phase 7 target refinement | `docs/review-queue-principles.md` | Current UI/API supports a narrower status workflow. |

## Validator And Safety Gates

| Capability | Status | Target phase | Evidence path | Notes |
|---|---|---|---|---|
| Deterministic pack validation | Current | Phase 1 | `packages/pack-validator/src`; `packages/schema/src/index.ts` | Current validator is read-only and schema-backed. |
| Core declared policy checks | Current | Safety gate v1 | `packages/pack-validator/src/index.ts`; `packages/pack-validator/src/index.test.ts` | Enforces `approved_content_only`, `public_safe_only`, `draft_records_require_review`, and `no_secret_tags` when declared in `rules/validation.yaml`. |
| Source map and export profile parsing | Current | Phase 1+ | `packages/pack-validator/src`; `packages/schema/src/index.ts` | Some validation exists. |
| License, freshness, redaction, and export readiness as complete validator gates | Partial | Phase 1 / Phase 7 / Phase 8 | `docs/roadmap-phases.md` | Broader target requirements exceed current validator coverage. |
| Scanner implementation | Planned | Post-core | `docs/security-model.md`; `docs/registry-readiness.md` | Scanner is a future gate, not current code. |
| Signing, revocation, and registry verification | Future | Phase 3A / Post-core | `docs/registry-readiness.md` | Planning only. |

## Good-to-Great G-Phases

| Capability | Status | Target phase | Evidence path | Notes |
|---|---|---|---|---|
| Good-to-Great PRD addition | Current | G0 planning | `docs/contextarr_prd_addition_good_to_great_layers.md` | Planning source only. It does not implement functionality. |
| G0 layer docs and roadmap references | Current | G0 | `docs/context-quality.md`; `docs/authoring-sdk.md`; `docs/trust-and-provenance.md`; `docs/agent-interface-contract.md`; `docs/official-starter-ecosystem.md`; `docs/roadmap-phases.md` | Docs-only alignment pass. |
| G1 Context Quality Benchmark design docs | Current | G1 | `docs/context-quality.md`; `docs/context-quality-benchmark.md` | Docs-only design is approved for G2 fixture work. Includes benchmark purpose, conditions, task types, file structure design, manifest shape, task shape, scoring rubric shape, report shape, and non-goals. No harness, scripts, external AI calls, or telemetry. |
| G2 demo benchmark fixtures | Current | G2 | `demo-evals/README.md`; `demo-evals/benchmark-manifest.example.json`; `demo-evals/tasks/*` | Static public-safe fixture files only. Fixture coverage is reviewed and accepted for G3 scoping. Includes task metadata, no-context prompts, manual-prompt baselines, raw-notes baselines, expected facts, and scoring rubrics. No harness, scripts, generated reports, external AI calls, or telemetry. |
| G3 local deterministic benchmark harness | Current | G3 | `packages/context-quality/src/index.ts`; `apps/cli/src/index.ts`; `packages/context-quality/src/index.test.ts`; `apps/cli/src/index.test.ts` | Local deterministic harness can load accepted G2 fixtures, validate benchmark shapes, score local condition files and in-memory Contextarr export output, and write local JSON/Markdown diagnostic reports. Reviewed reports are useful for source/fact coverage, safety, token-efficiency, and fixture quality checks, but they are not release gates and do not prove final model-output quality without fixed local output samples. No external AI calls, network fetches, telemetry, release gates, or CI enforcement. |
| G4 benchmark gate | Current | G4 | `packages/context-quality/src/index.ts`; `apps/cli/src/index.ts`; `package.json`; `docs/context-quality-benchmark.md` | Local deterministic gate behavior is current for accepted demo fixtures and G3 reports. It produces concise gate JSON/text, optional local gate and per-task reports, and nonzero exits for gate failures. No CI enforcement, public release automation, external AI calls, network fetches, telemetry, cloud services, registry behavior, marketplace behavior, Skills, or Agent Kits are current. |
| G5 Pack Authoring SDK design | Partial | G5 | `docs/authoring-sdk.md` | Summary design exists. Separate PRD-listed subdocs such as pack CI and snapshot testing are not complete. |
| G6-G9 authoring implementation | Future | G6-G9 | `docs/authoring-sdk.md` | No `packages/pack-authoring`, scaffolder, lint/explain commands, snapshot runner, or CI workflow generation. |
| G10 Trust and Provenance design | Partial | G10 | `docs/trust-and-provenance.md` | Summary design exists. Separate lockfile, Context BOM, signing, and revocation docs are not complete. |
| G11-G13 trust implementation | Future | G11-G13 | `docs/trust-and-provenance.md` | No hash commands, lockfile/BOM generation, signing, signature verification, or revocation implementation. |
| G14 Agent Interface Contract docs | Current | G14 | `docs/agent-interface-contract.md`; `docs/cli-command-contract.md`; `docs/cli-agent-mode.md` | Contract docs exist. Only current CLI commands and flags in this file should be treated as shipped. |
| G15-G16 agent command/workflow implementation | Planned | G15/G16 | `docs/agent-interface-contract.md`; `docs/cli-command-roadmap.md` | Command examples beyond current CLI status remain planning. |
| G17 Official Starter Ecosystem design | Partial | G17 | `docs/official-starter-ecosystem.md` | Summary policy exists. Separate starter policy/catalog docs are not complete. |
| G18-G20 starter implementation | Future | G18-G20 | `docs/official-starter-ecosystem.md` | No new starter packs, template folders, export profile templates, or Starter Gallery UI from G0. |
| G21 Good-to-Great Release Gate | Future | G21 | `docs/contextarr_prd_addition_good_to_great_layers.md` | No release-gate checklist or script is current. |

## Registry, Skills, Agent Kits, And Rejected Surfaces

| Capability | Status | Target phase | Evidence path | Notes |
|---|---|---|---|---|
| Registry Trust Foundation docs | Current | Phase 3A | `docs/registry-readiness.md`; `docs/import-quarantine.md` | Documentation only. |
| Public marketplace | Rejected | Later only | `docs/non-goals.md`; `docs/registry-readiness.md` | Not part of current release. |
| Skill terminology docs | Current | Phase 12 | `docs/skills.md`; `docs/non-executable-skills.md` | Docs only. |
| Skill schema, validator, library, commands, or MCP tools | Future | Phase 13+ | `docs/roadmap-phases.md` | Not implemented. |
| Agent Kit terminology docs | Current | Phase 12 | `docs/agent-kits.md` | Docs only. |
| Agent Kit schema, Composer, runtime, commands, or MCP tools | Future | Later phases | `docs/roadmap-phases.md` | Not implemented. Contextarr prepares Agent Kits; it does not run them. |
| Executable packs, executable Skills, agent runner, hidden network calls, hosted vault, telemetry | Rejected | All phases | `README.md`; `docs/security-model.md`; `docs/non-goals.md` | Do not implement without an explicit boundary-changing task. |
