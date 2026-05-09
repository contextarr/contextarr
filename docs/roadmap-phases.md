# Contextarr Roadmap Phases

## Phase 0: Repo Initialization and Decision Records

- Create repo skeleton.
- Add package manager setup.
- Add documentation.
- Add Git initialization.
- Add security and non-goal guardrails.
- Do not implement application functionality.

## Phase 1: Pack Schema and Validator

- Define Zod schemas.
- Implement validator.
- Add CLI validation command.
- Add fake fixture tests.

## Phase 2: Demo Packs

- Create fake public-safe demo packs.
- Include manifests, records, source maps, exports, rules, and docs.
- Validate all demo packs.

## Phase 3: Local Index and API

- Load pack folders.
- Build SQLite derived index.
- Add local API endpoints.
- Add search and rescan.

## Phase 3A: Registry Trust Foundation

- Define trusted registry architecture.
- Define registry artifact format.
- Define scanner policy.
- Define deterministic scanner report format.
- Define signing model.
- Define encryption model.
- Define quarantine install flow.
- Define revocation model.
- Define trust labels.
- Define safe public registry gates.
- Define private registry gates.
- Define marketplace launch gates.
- Define scanner limitations.
- Define local re-scan before activation.
- Define strict no-execution policy for registry content.
- Local code deliverables: `packages/security-scanner` deterministic report types, scanner fixtures, and `contextarr scan` CLI command.
- Hard boundaries: no public registry server, marketplace UI, payments, creator accounts, remote install, auto-activation, executable packs, executable Skills, Agent Kit runtime, hidden network calls, or telemetry.

## Phase 4: Web UI Shell and Library

- Build local dashboard shell.
- Add pack library views.

## Phase 5: Renderer and Static HTML

- Add pack detail basics.
- Add record detail basics.
- Render pack and record pages.
- Sanitize Markdown and HTML.
- Generate static output.

## Phase 6: Pack Health and Review Queue

- Calculate deterministic pack health.
- Generate review items.
- Add review queue UI.
- Store review item statuses in local SQLite only.
- Keep pack files immutable during review actions.

## Phase 7: Export Engine

- Parse export profiles.
- Build redacted exports.
- Support ChatGPT, Claude, Codex, generic Markdown, and JSON records.
- Add CLI export, local API preview, and web copy/download flows.

## Phase 8: Read-Only MCP

- Add local read-only stdio MCP server.
- Expose `list_packs`, `get_pack_summary`, `query_pack_context`, `get_record`, `list_export_profiles`, and `build_export_preview`.
- Add client setup docs.

## Phase 9: Importers

- Add local folder import.
- Add Markdown and Obsidian import.
- Add basic ChatGPT and Claude export parsing.
- Create draft records only.
- Keep importers CLI/core only; web and API import workflows remain later.

## Phase 10: Composer

- Implemented in Phase 10.
- Select packs and records.
- Filter by tags and metadata.
- Build temporary custom exports through the export engine.
- Preview, copy, and browser-download only.
- Save composed packs later.

## Phase 11: Launch Prep

- Implemented in Phase 11.
- Stabilize Docker Compose.
- Polish README and docs.
- Add screenshots placeholder.
- Write demo script.
- Verify validator, UI, exports, and MCP docs before release.
- Stop before publishing, tagging, deploying, or creating a GitHub release.

## Phase 12: Terminology and Schema Planning

- Implemented as docs-only planning.
- Keep Context Pack as the core context object.
- Define Skill as a non-executable instruction artifact.
- Define Agent Kit as a composed pairing of Context Packs and Skills.
- Define Export Brief as generated output, not source of truth.
- State clearly: Contextarr prepares Agent Kits. It does not run them.
- No schema code is added in Phase 12.

## Phase 13: Skill Schema and Validator

- Add Skill manifest and instruction schemas.
- Add Skill source map and safety rule schemas.
- Add Skill validation tests.
- Do not add Skill execution.

## Phase 14: Demo Skills

- Add fake public-safe demo Skills.
- Keep Skills data-only and non-executable.

## Phase 15: Skill Index and API

- Add rebuildable derived Skill index.
- Add read-only local Skill API endpoints.

## Phase 16: Skill Library UI

- Add Skill Library views.
- Keep Skill actions read-only.
- Status: complete.

## Phase 17: Skill Health and Review Queue

- Add deterministic Skill health.
- Add Skill review items.
- Keep review actions local app state unless later scoped otherwise.
- Status: complete.

## Phase 18: Skill Export Engine

- Generate target-specific Skill exports.
- Preserve redaction, review, and compatibility metadata.
- Status: complete.

## Phase 19: Agent Kit Schema and Validator

- Define Agent Kit manifest and references.
- Validate referenced Context Packs and Skills.
- Include self-description fields and validation from the first Agent Kit phase: task goal, agent role, usage instructions path, output contract, and execution boundary.

## Phase 20: Demo Agent Kits

- Add fake public-safe Agent Kits that pair demo Context Packs and demo Skills.
- Include `instructions/usage.md` and self-description metadata in every demo Agent Kit.

## Phase 21: Agent Kit Index and API

- Add rebuildable derived Agent Kit index.
- Add read-only local Agent Kit API endpoints.

## Phase 22: Agent Kit Composer UI

- Compose Agent Kits from existing Context Packs and Skills.
- Keep save or mutation behavior separately scoped.

## Phase 23: Agent Kit Detail UI and Health

- Add Agent Kit detail views and health summaries.

## Phase 24: Agent Kit Export Engine

- Generate Agent Kit Export Briefs for supported targets.
- Begin every Agent Kit export with an Agent Kit Instructions section before included Skills or Context Pack content.

## Phase 24R: Research Delta Foundation Catch-Up

- Strengthen Context Pack source provenance with license, hash, and freshness metadata.
- Add deterministic `contextarr.validation-report.v1` JSON output.
- Normalize Context Pack export profile targets to `chatgpt`, `claude`, `codex`, `generic_markdown`, `json`, `agents_md`, `claude_md`, and `llms_txt`.
- Index validation status, export readiness, redaction warning counts, stale-source counts, and license-risk counts.
- Keep clean demo packs at zero errors and zero warnings.

## Phase 25: Read-Only MCP for Skills and Agent Kits

- Extend read-only MCP to approved Skills and Agent Kits.
- Add `list_skills`, `get_skill_summary`, `get_skill`, `list_agent_kits`, `get_agent_kit_summary`, `query_agent_kit_context`, and `build_agent_kit_export_preview`.
- Reuse the derived SQLite index and export engines.
- Omit local paths from MCP output.
- Do not mutate files.
- Do not execute Skills.
- Respect redaction rules.
- Status: complete.

## Phase 26: Local Skill Importers

- Add local draft Skill imports through `contextarr import-skill`.
- Support folder, Markdown, prompt template, Claude Skill, and ChatGPT prompt inputs.
- Write draft Skills under ignored `imported-skills/` or `CONTEXTARR_IMPORTED_SKILLS_DIR`.
- Keep imported Skill documents private, unreviewed, and tagged `never_export`.
- Enable API/dashboard import flows only when `CONTEXTARR_ENABLE_LOCAL_IMPORTS=true`.
- Block scripts, executable files, unsafe filenames, shell-command patterns, and credential-like content.
- Status: complete.

## Phase 27: Agent Kit Templates

- Add public-safe data-only Agent Kit templates under `agent-kit-templates/`.
- Validate template schemas, references, safety flags, and text scans.
- Expose read-only template list/detail API endpoints.
- Allow template create requests to write unreviewed local draft Agent Kits under `CONTEXTARR_AGENT_KITS_DIR`.
- Prefill the Agent Kit Composer from templates while requiring user review before save.
- Status: complete.

## Later Only

- Official Pack Gallery: official/demo/starter artifacts only, public preview pages, validation and scanner reports visible, manual import only.
- Verified Registry Prototype: curated publishers only, signed artifacts, encrypted artifact storage, revocation, quarantine install, no payments.
- Private Team Registry: authenticated team registry, signed artifacts, optional client-side encryption research, private data allowed only inside private registry policy, no public discovery.
- Marketplace: paid artifacts, creator accounts, refunds/support policies, abuse handling, only after marketplace gates pass.
