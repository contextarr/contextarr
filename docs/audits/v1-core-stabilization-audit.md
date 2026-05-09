# v1.0 Core Stabilization Audit

Audit date: 2026-05-09

Source gate: [contextarr_phase_by_phase_prd_to_v1.md](../contextarr_phase_by_phase_prd_to_v1.md)

Status: audit complete, fixes not started.

## Scope

This audit checks the current `origin/main` state against the draft v1.0 bridge PRD. The gate is explicit:

```text
Context Packs reach v1.0 first.
Skills and Agent Kits start after v1.0 unless explicitly pulled forward by a separate decision record.
```

The advanced checkout already contains Skills and Agent Kits through Phase 27 plus Phase 28 research docs. This audit does not recommend rollback. It treats that work as completed but frozen, and it focuses the next implementation work on Context Pack core readiness.

Phase 29 is not started. Registry behavior remains blocked.

## Evidence

Repository state:

- Branch: `second-prd-overnight`
- Remote alignment before audit file: `HEAD` matched `origin/main` at `bf843f5 docs: add signing and trust model research`
- Working tree before audit file: clean

Commands run:

```text
git status --short --branch
git log --oneline --decorate -6
pnpm docs:verify
pnpm typecheck
pnpm test
pnpm demo:validate
pnpm --filter @contextarr/cli contextarr validate demo-packs --json
pnpm --filter @contextarr/server rescan
pnpm --filter @contextarr/web build
```

Observed results:

- `pnpm docs:verify`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed, 34 test files and 380 tests.
- `pnpm demo:validate`: all five demo packs passed with 0 errors, 0 warnings, and 0 infos.
- `contextarr validate demo-packs --json`: emitted `contextarr.validation-report.v1` reports; all five demo packs were valid, each with 8 ready export profiles and zero errors/warnings/infos.
- `pnpm --filter @contextarr/server rescan`: indexed 5 Context Packs, 25 records, 25 sources, and 40 export profiles.
- `pnpm --filter @contextarr/web build`: passed.

Important local-state observation:

- The server rescan also saw one skipped Skill from an ignored verification artifact: `imported-skills/phase26-smoke` missing `contextarr-skill.json`.
- That artifact is not tracked, but its presence changes default rescan output and generates one review item. This is a release hygiene problem for v1-style verification.

## Current Strengths

Contextarr already has a strong Context Pack foundation:

- Deterministic pack validation exists.
- Demo packs are fake/public-safe and validate cleanly.
- Research Delta fields are present in validation output: validation status, export readiness, redaction counts, stale-source counts, and license counters.
- Canonical export targets are present for demo packs: `chatgpt`, `claude`, `codex`, `generic_markdown`, `json`, `agents_md`, `claude_md`, and `llms_txt`.
- SQLite is rebuildable derived state for demo pack indexing.
- Pack Library, pack detail, record detail, renderer, health/review, exports, local API, Docker preview, and read-only MCP already exist.
- Safety posture is visible in docs and tests: no executable packs, no shell execution, no telemetry, no hosted cloud, no public marketplace, and read-only MCP boundaries.

## Gate Findings

### P0: Freeze Completed Skills and Agent Kit Expansion

The v1 bridge PRD excludes Skills and Agent Kits from the Context Pack v1.0 scope. The repo already includes them through Phase 27. The correct course is not rollback; the correct course is a freeze.

Required action:

- Do not add new Skills, Agent Kits, templates, MCP tools, importers, UI routes, or export targets unless a decision record explicitly supersedes the bridge PRD.
- Keep existing Skills and Agent Kits documented as completed advanced-preview work.
- Ensure v1.0 release planning can explain that Context Pack core is the stabilization target.

### P0: Default Rescan Is Polluted by Ignored Verification Output

`pnpm --filter @contextarr/server rescan` indexed Context Packs cleanly but skipped one generated Skill directory:

```text
imported-skills/phase26-smoke
skill_manifest.missing
```

This likely comes from prior `phase26:verify` smoke output. It is ignored by Git, but it still affects default local app state.

Required action:

- Update verification scripts so smoke outputs cannot be accidentally indexed by default server rescan.
- Prefer temporary directories outside the default indexed roots, or clean generated verification roots before/after smoke checks.
- Add a clean-rescan check that expects zero skipped packs, zero skipped Skills, and zero skipped Agent Kits from a fresh checkout plus verifier-generated artifacts.

### P0: v1 Verification Scripts Are Not Yet Defined

The repo has phase scripts through `phase27:verify`, plus `research-delta:verify`, `docs:verify`, and `docker:verify`. The bridge PRD expects later gates such as compatibility, security, release, demo, UI, and v1 verification.

Missing or not yet formalized:

- `phase28:verify` for the Phase 28 docs/research gate.
- `core:verify` or `v1-core:verify`.
- `compatibility:verify`.
- `security:verify`.
- `release:verify`.
- `demo:verify`.
- `ui:verify`.

Required action:

- Add verifier scripts before calling the project v1-ready.
- Keep scripts focused on Context Pack core and do not use them to restart Phase 29.

### P0: v1 Required Docs Are Missing

The bridge PRD names several v1 documentation deliverables that do not currently exist.

Missing docs found by audit:

```text
docs/validation-report.md
docs/api.md
docs/sqlite-index.md
docs/install.md
docs/upgrade.md
docs/config-reference.md
docs/release-process.md
docs/schema-versioning.md
docs/pack-migrations.md
docs/backups.md
docs/troubleshooting.md
docs/faq.md
docs/schema-v1.md
docs/migration-to-v1.md
docs/compatibility.md
docs/security-review-v1.md
docs/abuse-cases.md
docs/known-issues.md
RELEASE_NOTES.md
```

Some topics are partially covered by existing docs, but v1 needs explicit, user-facing, stable docs.

### P1: Backup and Restore Are Not v1-Ready

The v1 bridge definition requires backup and restore. Current docs and implementation do not show a completed backup/restore workflow.

Required action:

- Define local backup format.
- Restore into quarantine/review.
- Validate packs before activation.
- Ensure backup/restore does not bypass safety scans.

### P1: Guided Context Pack Collectors Are Not v1-Ready

The bridge PRD calls for guided Context Pack collectors. Current UI has a Collectors route, but it is oriented around gated local Skill import rather than Context Pack authoring/maintenance collectors.

Required action:

- Recenter Collectors on Context Pack core.
- Add draft Context Pack creation/update flows only if they remain local, reviewable, and non-executable.
- Keep AI-assisted collectors deferred unless they can run without external API calls and without auto-approval.

### P1: Composer v1 and Save-as-Pack Need a Core Decision

The current Composer can produce temporary composed exports. Agent Kit save flows also exist. The v1 bridge asks for Composer v1 and save-as-pack behavior for Context Pack core.

Required action:

- Decide whether save-as-pack means a new Context Pack, an export profile, or a saved composition recipe.
- Implement only after path safety, validation, review status, and overwrite rules are clear.
- Keep generated files under explicit local roots and validate before activation.

### P1: Schema Freeze and Compatibility Suite Are Missing

The bridge PRD requires a v1 schema freeze candidate, migration guide, backward compatibility tests, and fixture compatibility suite.

Required action:

- Produce `docs/schema-v1.md`, `docs/migration-to-v1.md`, and `docs/compatibility.md`.
- Add compatibility fixtures for older valid packs.
- Define additive/deprecated/breaking-change rules.
- Stabilize `contextarr.validation-report.v1`.

### P1: Formal Security and Abuse Review Is Missing

Safety tests exist across validators, API, importers, exports, and MCP. However, the v1 bridge requires a named security review and abuse-case suite.

Required action:

- Add `docs/security-review-v1.md` and `docs/abuse-cases.md`.
- Add or map tests for prompt injection, shell command text, script files, credential requests, unsafe imports, over-export, MCP boundary attempts, broad API binding, invalid backup restore, and local path leakage.
- Add `security:verify`.

### P2: v1 Public-Preview and Alpha Gate Docs Need Separation

The current README says early public preview. The bridge PRD adds alpha feedback gates and v1 readiness decision criteria.

Required action:

- Add alpha onboarding and feedback docs if public feedback is still desired.
- Keep feedback manual and telemetry-free.
- Decide whether real-user gate metrics are still required before v1.

### P2: Packaging and Upgrade Docs Need v1 Hardening

Docker preview exists and verifies, but v1 expects install, upgrade, config reference, release process, schema versioning, and migration docs.

Required action:

- Fill the missing packaging docs.
- Add upgrade and migration smoke tests.
- Document volume layout and data roots.

## Accepted, Deferred, Rejected

Accepted for next core-readiness work:

- Verification hygiene and clean-rescan gate.
- Context Pack v1 docs and schema freeze docs.
- Security/abuse review.
- Backup/restore design and implementation.
- Context Pack collector and Composer v1 decisions.
- Packaging, upgrade, and release hardening.

Deferred:

- New Skills and Agent Kit expansion.
- Phase 29 private registry prototype.
- Signing implementation.
- Public sharing, public registry, public marketplace.
- Hosted cloud, sync, telemetry, managed AI calls.

Rejected for v1 core:

- Any runtime execution of packs, Skills, or Agent Kits.
- Shell command execution.
- Browser automation.
- Network-capable pack or Skill behavior.
- Automatic trust or activation of imported content.
- Marketplace or registry UI disguised as core functionality.

## Exact Next Implementation Plan

### Step 1: Verification Hygiene and Core Gate

Commit goal: `fix: harden v1 core verification`

Work:

- Add a `v1-core:verify` root script that runs the current green core checks without invoking Phase 29 or expanding Skills/Agent Kits.
- Add a clean-rescan check that fails if default rescan reports skipped packs, skipped Skills, skipped Agent Kits, or review items caused by ignored smoke artifacts.
- Move smoke outputs used by verifier scripts outside default indexed roots, or clean those roots safely before rescan.
- Add `docs/audits/v1-core-stabilization-audit.md` to the docs verifier or a new audit verifier if useful.

Verification:

```text
pnpm docs:verify
pnpm typecheck
pnpm test
pnpm demo:validate
pnpm --filter @contextarr/cli contextarr validate demo-packs --json
pnpm --filter @contextarr/server rescan
pnpm v1-core:verify
```

Acceptance:

- Clean checkout plus verification leaves no default-index pollution.
- Demo packs validate with zero errors and zero warnings.
- Default rescan reports 5 packs, 25 records, 25 sources, 40 export profiles, and zero skipped Context Pack objects.
- Existing advanced Skills/Agent Kit work remains frozen, not removed.

### Step 2: Context Pack Contract Docs

Commit goal: `docs: add context pack v1 contract docs`

Work:

- Add `docs/validation-report.md`.
- Add `docs/api.md`.
- Add `docs/sqlite-index.md`.
- Add `docs/config-reference.md`.
- Add `docs/schema-versioning.md`.
- Update README links.

Acceptance:

- Docs match current commands and API behavior.
- Docs explicitly say SQLite is derived and rebuildable.
- Docs preserve exact `contextarr validate <path> --json` behavior.
- Docs keep Skills/Agent Kits out of core v1 expansion.

### Step 3: Schema Freeze Candidate

Commit goal: `feat: add context pack v1 schema freeze candidate`

Work:

- Add `docs/schema-v1.md`.
- Add `docs/migration-to-v1.md`.
- Add `docs/compatibility.md`.
- Add compatibility fixtures and tests for current demo packs and older fixture shapes.
- Add `compatibility:verify`.

Acceptance:

- Existing demo packs validate under v1 candidate rules.
- Validation report schema remains deterministic.
- Compatibility tests explain any breaking changes.

### Step 4: Security and Abuse Case Gate

Commit goal: `test: add context pack security review gate`

Work:

- Add `docs/security-review-v1.md`.
- Add `docs/abuse-cases.md`.
- Add or map tests for bridge PRD abuse cases.
- Add `security:verify`.

Acceptance:

- Shell command, credential, script, prompt-injection, over-export, unsafe import, MCP mutation, broad bind, backup-restore bypass, and local-path leakage cases are tested or explicitly mitigated.

### Step 5: Backup and Restore v0

Commit goal: `feat: add local backup and restore`

Work:

- Add local backup export.
- Add local restore into quarantine/review.
- Add `docs/backups.md` and restore safety tests.
- Keep encrypted backup optional and local-only if included.

Acceptance:

- Backup does not include generated local DB/export/render folders by default.
- Restore validates before activation.
- Restore cannot bypass validation, redaction, or review rules.

### Step 6: Context Pack Collector and Composer v1 Decision

Commit goal: `docs: decide context pack collector and composer v1 scope`

Work:

- Add a short decision record for collectors and save-as-pack.
- Define whether Composer v1 saves a pack, recipe, or export profile.
- Define review status and validation requirements.

Acceptance:

- Implementation scope is unambiguous before writing code.
- Skill/Agent Kit expansion remains frozen.

### Step 7: Packaging, Upgrade, and Release Hardening

Commit goal: `chore: add v1 packaging and release gates`

Work:

- Add `docs/install.md`, `docs/upgrade.md`, `docs/release-process.md`, `docs/pack-migrations.md`, `docs/troubleshooting.md`, `docs/faq.md`, `docs/known-issues.md`, and `RELEASE_NOTES.md`.
- Add `release:verify` and `demo:verify`.
- Re-run Docker smoke.

Acceptance:

- Fresh clone, Docker, CLI, demo, backup/restore, and rebuild flows are documented and verifiable.

## Do Not Start

Do not start these until the v1 core gate is explicitly cleared:

- Phase 29 private registry prototype.
- Signing implementation.
- Public marketplace.
- Public registry.
- New Skills or Agent Kit expansion.
- Hosted service.
- Telemetry.
- Runtime execution.

