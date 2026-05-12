# Contextarr Master Plan

Status: planning control document.
Last reviewed: 2026-05-11.

This is the working master plan for Contextarr from the current checkout through the full product vision. It collects the shipped state, accepted future ideas, deferred concepts, rejected paths, and the order in which work should proceed.

It is intentionally not a shipped-feature claim. For shipped-versus-planned truth, use [implementation-status.md](implementation-status.md).

## Authority Order

Use this order when documents disagree:

1. [implementation-status.md](implementation-status.md): what is actually shipped in the current checkout.
2. This file: build order, gates, and where new ideas are slotted.
3. [roadmap.md](roadmap.md): compact public-facing roadmap.
4. Decision records under `docs/decision-records/`: accepted scope changes.
5. Focused design docs and PRD additions: feature detail for a scoped track.
6. Older phase plans: historical context unless re-confirmed by a newer decision.

New ideas should be added to this plan first as a row in the concept ledger, then expanded into a focused design doc only when the idea needs detail. `implementation-status.md` changes only after code or docs actually ship.

## North Star

Contextarr is a local-first AI artifact gateway.

The first public product is narrower:

```text
Contextarr turns local files into validated, redaction-aware Context Packs you can export or serve through read-only MCP.
```

The full product becomes:

```text
A local-first library and server for Context Packs, Skills, Agent Kits, and Export Briefs.
```

Contextarr prepares and serves AI-ready artifacts. It does not run agents, execute Skills, execute packs, call tools, phone home, or hide data movement.

## Product Objects

| Object | Purpose | Source of truth | Current state |
| --- | --- | --- | --- |
| Context Pack | Source-backed knowledge and reusable context. | Local pack folder. | Core object, active release focus. |
| Skill | Reusable method, instructions, output formats, examples, and task rules. | Local Skill folder. | Advanced-preview, data-only, frozen behind core gate. |
| Agent Kit | Task-ready pairing of Context Packs, Skills, target, redaction, and usage instructions. | Local Agent Kit folder. | Advanced-preview, data-only, frozen behind core gate. |
| Export Brief | Generated output for an AI tool or human. | Derived artifact. | Explicit local save/list/fetch foundation exists; deeper export history and packaging are future. |
| Private Context | Protected view and policy layer over sensitive artifacts. | Metadata and local policy over existing objects. | Future track; current privacy primitives exist. |
| Registry Artifact | Shared Context Pack, Skill, Agent Kit, template, profile, or rule set. | Registry manifest plus artifact files. | Future trust and distribution track. |

## Hard Boundaries

These are binding unless a future decision record explicitly changes them:

- MCP remains read-only.
- Packs remain data-only.
- Contextarr Native Skills remain non-executable.
- External Skills may be preserved later, but Contextarr never executes them.
- Agent Kits are prepared, validated, previewed, and exported. They are not run.
- API writes are local, authenticated control operations only.
- CLI writes are explicit local operator actions only.
- SQLite is derived and rebuildable, not the pack source of truth.
- Vector stores, graph databases, RAG tools, and Graphify-style systems are downstream derived indexes, not Contextarr's source of truth.
- Drafts, imports, restores, composed packs, and collector outputs start private, unreviewed, and excluded from default export and MCP.
- No hidden network calls.
- No product telemetry.
- No hosted vault.
- No built-in vector database, graph database, managed RAG app, AST/code graph engine, hidden embedding calls, or external database sync service.
- No public marketplace before registry trust, signing, scanning, quarantine, revocation, abuse process, and manual review are proven.
- No pack-defined webhooks, Skill-defined webhooks, MCP webhooks, webhook-triggered shell commands, or webhook-triggered agent actions.
- No live Gmail, Slack, Drive, Jira, CRM, bank, brokerage, or other credentialed SaaS connectors in the core.

## Current Workspace Baseline

The current checkout already contains more than the earliest Context Pack plan:

- Context Pack schema, validation, scanner reports, and deterministic reports.
- 15 public-safe demo Context Packs, including 12 curated starter packs.
- Rebuildable SQLite index for packs, records, sources, exports, health, review candidates, Skills, and Agent Kits.
- Local Fastify API, React/Vite dashboard, CLI, and read-only stdio MCP.
- Pack Library, detail, record detail, Pack Health, Exposure Readiness, Review Queue, Export Center, Composer, Draft Intake, backup, restore, and Docker local preview.
- Context Pack exports for ChatGPT, Claude, Codex, generic Markdown, JSON, AGENTS.md, CLAUDE.md, and llms.txt.
- Draft Intake with activation plan, dry-run proof, explicit proof-gated local activation, local activation history, and no export/publish/MCP exposure during candidate review.
- Local Context Pack collectors and Composer save-as-draft-pack flows.
- Backup/restore v0 with quarantine-only restore.
- Advanced-preview non-executable Skills and Agent Kits across schemas, validation, demo content, indexing, API, UI, exports, and MCP.
- Per-pack Context Readiness API/CLI/UI surfaces and bounded metadata-only Local Observability reads.
- Explicit local Saved Export Brief save/list/fetch APIs and web actions for generated preview artifact metadata, hashes, counts, warning codes, and bounded safe snapshots.

The current release gaps are not vision gaps. They are adoption and hardening gaps:

- Finish `v0.1.0-alpha.1` release preparation.
- Keep screenshots current and add a short demo video.
- Prove Docker, CLI, API, MCP, exports, backup/restore, and rebuild behavior from the release checklist.
- Improve public copy so users understand Core Now versus Advanced Preview.
- Keep future tracks documented but gated.

## Master Build Sequence

### Stage 0: Master Plan and Scope Control

Status: now.

Goal:

- Collapse scattered ideas into one build map.
- Make this file the intake point for future ideas.
- Keep `implementation-status.md` as shipped truth.

Build:

- Add this master plan.
- Link it from README, roadmap, and strategy docs.
- Keep future concepts documented without silently widening runtime scope.

Gate:

- Docs checks pass.
- No app behavior changes.
- Every known concept has a slot in the ledger below.

### Stage 1: v0.1 Alpha Release Readiness

Status: immediate build lane.

Goal:

- Make the smallest public version undeniable.
- Prove Context Packs, exports, read-only MCP, and the UI loop.

Build:

- Repair stale release gates around the 15 demo packs and 12 starter packs.
- Run and fix `pnpm release:verify`.
- Complete Docker local preview proof.
- Validate README, quickstart, install, release checklist, known limitations, and screenshots.
- Add or refresh a short demo video or script-backed demo path.
- Keep the site and README clear: Context Pack core now, Skills and Agent Kits advanced-preview.

Gate:

- A new user can install locally, open the dashboard, inspect starter packs, export a useful brief, query read-only MCP, delete SQLite, rebuild, and see that nothing executes.

Primary verification:

```bash
pnpm docs:verify
pnpm demo:validate
pnpm v1-core:verify
pnpm release:verify
```

Do not build here:

- Private Context UI.
- External Skill artifact preservation.
- Event hooks.
- Registries.
- Marketplace.
- Hosted core.

### Stage 2: Core Adoption Hardening

Status: next after alpha readiness.

Goal:

- Make users able to create, review, maintain, and export their own Context Packs without handholding.

Build:

- Pack authoring polish.
- Better first-pack templates and collector workflows.
- Review Queue and Draft Intake usability polish.
- Export preflight clarity for default export and MCP exposure.
- CLI agent-mode polish: stable JSON, bounded output, redacted defaults, predictable exit codes.
- API permission tier docs and local-auth hardening where gaps are found.
- Backup/restore UI research only if CLI flow is stable.

Gate:

- At least a small alpha group can create or adapt one local pack and prefer the generated export over a manually assembled prompt.

Primary verification:

```bash
pnpm v1-core:verify
pnpm exposure:verify
pnpm trust-loop:verify
pnpm compatibility:verify
pnpm security:verify
```

### Stage 2.5: Launch-Proof Layer

Status: immediate bounded track.

Goal:

- Make the first public proof undeniable without widening runtime scope.
- Show the cold-AI-fails / Contextarr-succeeds demo with local receipts.
- Keep launch proof separate from future hosted, marketplace, registry, or agent-runtime work.

Build:

- Add `/proof` with a 5-minute proof summary, 15 demo eval cards, a No context / Raw notes / Contextarr export comparison, trust receipts, and a link to `docs/launch-proof.md`.
- Add a small homepage "See the proof" CTA and compact "Where Contextarr fits" comparison.
- Add the dominant "Try Contextarr in 7 minutes" route on `/run-locally`.
- Document Context Pack anatomy, launch proof receipts, demo script, and local video-production boundaries.
- Update the public-surface contract so proof language is verified.

Gate:

- No runtime, API, CLI, MCP, deployment, provider, or public-launch mutation.
- Proof copy stays local-first, public-safe, and honest about current limitations.
- `pnpm public-surface:verify` and `pnpm site:verify` pass.

Primary verification:

```bash
pnpm public-surface:verify
pnpm site:verify
```

### Stage 3: Context Readiness and Local Observability

Status: runtime foundation started. Current scope is a per-pack read-only readiness report plus bounded metadata-only Local Observability reads.

Goal:

- Move beyond "valid pack" to "agent-ready context".
- Record local evidence metadata for exports, MCP queries, reviews, redaction hits, readiness calculations, and warnings.

Build order:

1. Readiness and governance schemas.
2. Local evidence event storage.
3. Context Readiness engine.
4. Readiness API and CLI.
5. Governance rules integration.
6. Export evidence and token-budget warnings.
7. MCP query evidence.
8. Readiness and Activity UI.
9. Agentic AI Readiness starter pack.
10. Context Quality Benchmark integration.

Gate:

- Evidence logs are metadata-first and local-only.
- Raw export bodies, raw MCP query text, returned context bodies, and private source dumps are not stored by default.
- Readiness is explainable and does not imply correctness guarantees.

Primary docs:

- [prd-additions/agentic-ai-context-readiness-local-observability.md](prd-additions/agentic-ai-context-readiness-local-observability.md)

### Stage 4: Private Context

Status: future protected-context track.

Goal:

- Make sensitive local context feel safer and easier to explain without turning Contextarr into a personal memory vault.

Build order:

1. Metadata: `privacy_class`, `protected`, `unlock_required`, `export_default`, `mcp_access`.
2. Private Context sidebar filter and badges.
3. Pack modes: Standard, Private, Protected, Never Export.
4. Export Safety Check showing included/excluded sensitive records, warnings, MCP status, and output hash.
5. Protected-pack unlock.
6. Session timeout and app lock.
7. OS keychain secrets where available, passphrase fallback for CLI/Docker.
8. Optional encrypted export bundles and encrypted backups.

Gate:

- Standard local search and Git-friendly pack workflows still work for normal packs.
- Protected content remains denied from MCP and default export unless explicitly allowed.

Primary doc:

- [private-context.md](private-context.md)

### Stage 5: Export Briefs, Export Depth, and Derived Index Adapters

Status: export-maturity track started. Saved Export Brief save/list/fetch exists; export depth and derived index adapters are future.

Goal:

- Treat Export Briefs as first-class generated artifacts and make export packaging intentional.
- Let users bring their own vector store, graph database, RAG stack, Graphify workflow, or agent runtime without turning Contextarr into those systems.

Build order:

1. Saved Export Brief library metadata foundation.
2. Export history and output hash integration with Local Observability.
3. Export depth levels: capsule, standard, deep, full, attachment_bundle, mcp_query.
4. Target-depth warnings: too brief, too large, attachment recommended, MCP recommended, privacy risk.
5. Attachment bundle generation for large-context workflows.
6. MCP query entry briefs for MCP-capable tools.
7. Derived Index Adapter spec for vector, RAG, graph, and Graphify seed exports.
8. CLI-first derived export targets such as `vector_jsonl`, `rag_markdown`, `graph_seed_json`, `graph_edges_json`, and `graphify_seed`.
9. Adapter recipes for Qdrant, Chroma, LanceDB, LlamaIndex, LangChain, Neo4j, Kuzu, and Graphify-adjacent workflows.
10. Optional example adapter scripts only after user demand.

Gate:

- Export Briefs remain derived artifacts, not source of truth.
- Draft, blocked, private, secret, and `never_export` content stays excluded by default.
- Derived index exports preserve pack IDs, record IDs, source IDs, review status, privacy, redaction mode, freshness, export profile ID, generated time, and content hashes.
- Contextarr does not add a built-in vector database, graph database, managed RAG layer, hidden embedding calls, always-on external indexer, or direct external database sync in this stage.

Primary doc:

- [prd-additions/export-depth-levels.md](prd-additions/export-depth-levels.md)
- [derived-index-adapters.md](derived-index-adapters.md)

### Stage 6: Skills and Agent Kits Graduation

Status: advanced-preview exists, frozen until core readiness is accepted.

Goal:

- Promote Skills and Agent Kits from advanced-preview to supported product pillars only after Context Pack adoption is proven.

Build order:

1. Re-check existing advanced-preview behavior against the current safety model.
2. Decide whether to graduate Native Skills first or keep them hidden behind advanced-preview.
3. Harden Native Skill authoring, review, health, and export flows.
4. Harden Agent Kit Composer, self-description, pairing checks, health, exports, and MCP tools.
5. Add saved Agent Kit bundle export profiles.
6. Add object-aware Library for Context Packs, Skills, Agent Kits, and Export Briefs.
7. Add External Skill Artifact preservation:
   - preserve original imported Skill folder
   - scan and classify capabilities
   - create sidecar safety and compatibility reports
   - create adapted Native Skill view where useful
   - export native bundles only with explicit approval and warnings

Gate:

- Contextarr Native Skills remain data-only.
- External script-bearing Skills may be stored and exported to compatible downstream tools, but Contextarr never executes them.
- Agent Kits remain self-describing and non-executable.

Primary docs:

- [skills.md](skills.md)
- [agent-kits.md](agent-kits.md)
- [external-skills.md](external-skills.md)
- [contextarr_prd_addition_skills_agent_kits.md](contextarr_prd_addition_skills_agent_kits.md)

### Stage 7: Official Pack Gallery and Public-Safe Ecosystem

Status: post-core ecosystem track.

Goal:

- Remove the empty-framework feeling by making official and public-safe examples easy to discover.

Build order:

1. Public docs/site pages for official starter packs.
2. Static rendered previews only.
3. Visible validation reports, scanner summaries, source summaries, and license notes.
4. Manual local import instructions.
5. No one-click remote activation.
6. No community uploads yet.

Gate:

- Public pages are marketing and documentation surfaces, not hosted pack storage for private user data.
- Third-party marks remain identifiers, not endorsements.

Related docs:

- [prd-additions/starter-context-packs-and-object-ui.md](prd-additions/starter-context-packs-and-object-ui.md)

### Stage 8: Registry Trust Foundation

Status: future trust track, partly documented.

Goal:

- Build the trust machinery before any public or private distribution layer is trusted.

Build order:

1. Registry artifact format.
2. Context BOM and provenance metadata.
3. Scanner policy expansion and malicious fixtures.
4. Signing model and verification points.
5. Artifact hash, validation report hash, scanner report hash, source summary hash, and license report hash.
6. Quarantine install flow.
7. Local re-scan before activation.
8. Revocation model.
9. Encryption model for transport/storage, with scanning before encryption or inside trusted review.
10. Registry status language and trust labels.

Gate:

- Imported registry items always enter quarantine first.
- Local validation and local re-scan never get bypassed.
- Revoked or signature-mismatched artifacts are blocked from activation, export, and MCP by default.

Primary docs:

- [registry-trust-model.md](registry-trust-model.md)
- [registry-artifact-format.md](registry-artifact-format.md)
- [scanner-policy.md](scanner-policy.md)
- [signing-model.md](signing-model.md)
- [quarantine-install-flow.md](quarantine-install-flow.md)
- [revocation-model.md](revocation-model.md)
- [encryption-model.md](encryption-model.md)

### Stage 9: Private Team Registry

Status: post-v1, only with real team pull.

Goal:

- Let known teams distribute approved Context Packs, Skills, Agent Kits, templates, profiles, and rules under access control.

Architecture:

- Local Contextarr client remains local.
- Hosted or private registry handles identity, membership, manifest/catalog access, artifact distribution, signatures, revocation, and audit metadata.
- OAuth/OIDC controls registry access, not AI action authority.

Build order:

1. Private registry threat model.
2. Auth/OIDC integration design.
3. Org/workspace/team membership.
4. Roles: owner, registry admin, maintainer, reviewer, member, auditor.
5. Signed manifests and artifact storage.
6. Approval and release workflow.
7. Access grants and revocations.
8. Metadata-only audit log.
9. Local client pull into quarantine.
10. Local validation, local scan, human review, and activation.

Gate:

- No hosted vault.
- No user local state stored centrally by default.
- No raw local exports, MCP query logs, user prompts, or private local import data stored centrally by default.

Primary docs:

- [private-registry-requirements.md](private-registry-requirements.md)
- [private-registry-policy.md](private-registry-policy.md)

### Stage 10: Public Verified Registry

Status: later than private/official trust proof.

Goal:

- Provide a verifiable public catalog of safe, reviewed, non-executable Contextarr artifacts.

Build order:

1. Official-only registry page.
2. Verified publisher process.
3. Manual review workflow.
4. Public scanner and validation reports.
5. Signed manifests.
6. Revocation and abuse reporting.
7. Community submissions only after policy and staffing are real.

Gate:

- No anonymous verified uploads.
- No executable artifacts.
- No auto-activation.
- No one-click trust.
- No marketplace payments.

Primary docs:

- [public-registry-policy.md](public-registry-policy.md)

### Stage 11: Marketplace, Maybe

Status: maybe never.

Goal:

- Add paid artifacts only if the public verified registry has proven safety, review, support, abuse, license, and revocation processes.

Launch gates:

- Stable Context Pack, Skill, and Agent Kit schemas.
- Scanner v1 with malicious fixture coverage.
- Signing, encryption, quarantine install, local re-scan, revocation, abuse reporting, publisher verification, manual review, legal/license policy, and incident process.
- At least 50 verified artifacts pass process.
- At least 10 external users import, review, and activate registry artifacts without direct support.

Primary doc:

- [marketplace-gates.md](marketplace-gates.md)

### Stage 12: Studio, Services, and Packaging

Status: post-adoption option.

Goal:

- Make the local product easier to use and monetize without breaking local-first trust.

Possible tracks:

- Contextarr Studio as a Tauri/Electron/local packaged app.
- Paid setup service.
- Paid migration service.
- Paid vertical starter packs and templates.
- Paid governance/readiness templates.
- Local desktop convenience around authoring, review, redaction, and export evidence.

Gate:

- Studio is local. It is not a hosted vault.
- Services support the core product. They do not require cloud sync or telemetry.

## Immediate Execution Queue

Use this queue until a decision record changes it:

1. Keep the alpha branch release gates green while reviewing the recent readiness, observability, and saved-brief foundations.
2. Do a fresh Docker preview smoke from the release checklist after any runtime change.
3. Refresh screenshots only when UI changes make the reviewed alpha set stale.
4. Record a short demo video from the script-backed demo path.
5. Polish public-site and README framing around Core Now versus Advanced Preview.
6. Improve pack authoring, collectors, Draft Intake, and export preflight based on the first real user path.
7. Harden the current Context Readiness, Local Observability, and Saved Export Brief foundations before expanding them.
8. Keep Derived Index Adapters in docs/spec mode until export-depth work outranks adoption hardening.
9. Cut or prepare the alpha release artifact only after release gates pass.
10. Gather alpha feedback before building future tracks.

## Concept Placement Ledger

| Concept | Placement | Build now? | Notes |
| --- | --- | --- | --- |
| Context Pack core | Stage 1 and Stage 2 | Yes | The current adoption lane. |
| Pack schema and validator | Stage 1 | Yes | Keep compatibility gates healthy. |
| Demo and starter packs | Stage 1 | Yes | 15 demo packs, 12 curated starter packs. |
| Pack Library and dashboard | Stage 1 and Stage 2 | Yes | Make the product obvious. |
| Pack Health and Review Queue | Stage 1 and Stage 2 | Yes | Core maintenance loop. |
| Exposure Readiness | Stage 1 and Stage 2 | Yes | Read-only report, not approval engine. |
| Draft Intake activation proof | Stage 1 and Stage 2 | Yes | Local proof-gated activation only. |
| Backup and restore | Stage 1 and Stage 2 | Yes | Quarantine-only restore. |
| Context Pack collectors | Stage 2 | Yes, polish | Local draft generation only. |
| Composer save-as-draft-pack | Stage 2 | Yes, polish | Drafts stay private and unreviewed. |
| Export profiles | Stage 1 and Stage 2 | Yes | Current targets stay core. |
| Export Depth Levels | Stage 5 | Not yet | Accepted planning addition. |
| Saved Export Brief library | Stage 5 | Yes, foundation | Explicit local save/list/fetch exists; deeper history/regeneration remains future. |
| Derived Index Adapters | Stage 5 | Docs now, code later | Bring-your-own retrieval layer through redacted, source-mapped exports. |
| Vector/RAG export targets | Stage 5 | Not yet | Future `vector_jsonl`, `rag_markdown`, LlamaIndex, LangChain, Qdrant, Chroma, and LanceDB outputs. |
| Graph and Graphify seed exports | Stage 5 | Not yet | Future graph nodes/edges, Neo4j/Kuzu CSV, and Graphify seed outputs; no graph engine. |
| Built-in vector database | Rejected | No | External vector stores consume derived exports. |
| Built-in graph database or code graph engine | Rejected | No | Graphify and graph databases stay downstream tools. |
| Managed RAG app | Rejected | No | Contextarr prepares clean context; it does not become a RAG workspace. |
| CLI agent mode | Stage 2 | Yes, polish | Stable JSON, redaction, bounded output, deterministic exits. |
| API permission tiers | Stage 2 | Yes, harden | Local authenticated control. |
| MCP read-only contract | All stages | Yes, preserve | No mutation or execution. |
| MCP serving Context Packs | Stage 1 | Yes | Core. |
| MCP serving Skills and Agent Kits | Stage 6 | Already preview, frozen | Re-harden before graduation. |
| MCP serving Export Brief metadata | Stage 5 | Not yet | Saved briefs first; no MCP exposure in the current foundation. |
| Context Readiness | Stage 3 | Yes, foundation | Per-pack read-only API/CLI/UI report exists; broader readiness list/governance/evidence remains future. |
| Local Observability | Stage 3 | Yes, foundation | Bounded metadata-only event and MCP query-log reads exist; writers/history remain future. |
| Context Quality Benchmark | Stage 3 | Not yet | Tie readiness to deterministic eval evidence. |
| Agentic AI Readiness starter pack | Stage 3 | Not yet | Public-safe starter pack. |
| Private Context | Stage 4 | Not yet | Protected view, not personal vault. |
| Protected pack unlock | Stage 4 | Not yet | After Private Context metadata and UI. |
| App lock and session timeout | Stage 4 | Not yet | Narrow security feature, not full vault rewrite. |
| Encrypted exports/backups | Stage 4 and Stage 8 | Not yet | Targeted encryption, not default full-vault encryption. |
| Local Event Hooks | Stage 3 or later | Not yet | App-level metadata hooks only. |
| Inbound local hooks | Stage 3 or later | Not yet | Localhost, auth, rate limits. |
| Remote webhooks | Post-v1 only | Not yet | Explicit consent, HMAC, payload preview. |
| Contextarr Native Skills | Stage 6 | Frozen | Data-only, non-executable. |
| External Skill preservation | Stage 6 | Not yet | Preserve originals, classify, warn, never execute. |
| Script-bearing Skill bundling | Stage 6 | Not yet | Export to compatible downstream runtimes only with explicit approval. |
| Agent Kits | Stage 6 | Frozen | Prepare and export, never run. |
| Agent Kit templates | Stage 6 | Frozen | Public-safe draft templates. |
| Object-aware Library | Stage 6 | Not yet | Context Packs, Skills, Agent Kits, Export Briefs. |
| Hosted marketing/docs site | Stage 1 and Stage 7 | Yes, as docs/site | Public site only. |
| Hosted core app | Rejected | No | Violates local-first core. |
| Public static demo pages | Stage 7 | Later | Public-safe only. |
| Official Pack Gallery | Stage 7 | Later | Official/static discovery, manual import. |
| Registry trust foundation | Stage 8 | Later | Scanner, signing, quarantine, revocation. |
| Context BOM/provenance | Stage 8 | Later | Needed for registry trust. |
| Public verified registry | Stage 10 | Later | Not marketplace, no anonymous verified uploads. |
| Private team registry | Stage 9 | Later | OAuth/OIDC distribution layer, not hosted vault. |
| OAuth/OIDC | Stage 9 | Later | Controls registry access only. |
| Marketplace | Stage 11 | Maybe never | Only after many safety and adoption gates. |
| Desktop Studio | Stage 12 | Later | Local convenience app. |
| Paid setup/migration services | Stage 12 | Later | Likely first revenue path after adoption. |
| Live SaaS connectors | Rejected for core | No | Importers stay local unless separately scoped. |
| Product telemetry | Rejected | No | Local evidence only. |
| Agent runtime | Rejected | No | Downstream tools execute; Contextarr prepares. |

## Idea Intake Protocol

When a new idea appears:

1. Add it to the Concept Placement Ledger or update an existing row.
2. Assign one placement: Stage 1-12, Rejected, Parked, or Research.
3. Decide whether it is build-now, polish-now, future, or never.
4. If it changes scope, create or update a decision record.
5. If it needs detail, create a focused design doc and link it from this plan.
6. If it ships, update [implementation-status.md](implementation-status.md).
7. Run the narrow verification commands relevant to the files changed.

Do not start coding a new idea just because it is exciting. It must have a stage, a gate, and a reason to outrank the current release lane.

## Full Build Definition Of Done

Contextarr is fully built out when:

- A user can install and run the local app easily.
- Context Packs are stable, authorable, validatable, reviewable, exportable, backed up, restorable, and queryable through read-only MCP.
- Private Context can protect sensitive local artifacts with clear export and MCP rules.
- Export Briefs can be saved, inspected, hashed, and regenerated from local source artifacts.
- Derived Index Adapters can produce redacted, source-mapped exports for external vector, graph, RAG, and Graphify-style systems without making those systems part of Contextarr core.
- Context Readiness and Local Observability can explain whether context is ready, what was exported, what was queried, what was redacted, and what warnings existed, all locally.
- Skills and Agent Kits are supported as non-executable library objects.
- External Skills can be preserved as untrusted artifacts, scanned, classified, adapted, and exported with explicit compatibility warnings.
- Official public-safe artifacts can be discovered without implying marketplace trust.
- Registry distribution, if built, uses validation, scanning, signing, quarantine, local re-scan, review, revocation, and clear trust labels.
- Private team distribution, if built, controls access to artifacts without becoming a hosted vault.
- Marketplace, if ever built, comes after the registry has proven safety, support, abuse, license, and trust operations.

Until then, keep building the current stage to completion before pulling future tracks forward.
