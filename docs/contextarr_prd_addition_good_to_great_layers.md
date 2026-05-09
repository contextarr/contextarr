# Contextarr PRD Addition: Good to Great Layers

Version: 0.1 draft
Date: 2026-05-09
Owner: Rob
Status: Planning addition

Status note: Check [implementation-status.md](implementation-status.md) before treating any command, export target, registry/trust artifact, scanner, Skill, Agent Kit, or marketplace behavior in this planning addition as shipped.

## 1. Purpose

This document adds five product layers that move Contextarr from a solid local Context Pack system into a category-defining context quality platform.

This addition does not replace the main Contextarr PRD, the Phase 1 to Phase 3 research delta, the phase-by-phase v1 plan, the CLI-first addition, the registry trust addition, or the Skills and Agent Kits addition.

It extends them.

The five added layers are:

1. Context Quality Benchmark.
2. Pack Authoring SDK and CI.
3. Trust and Provenance Layer.
4. Agent Interface Contract.
5. Official Starter Ecosystem.

These layers are not random features. They are strategic upgrades that directly answer the strongest outside criticisms of Contextarr:

1. This is just another memory app.
2. I already have provider memory, AGENTS.md, CLAUDE.md, Cursor rules, and Obsidian.
3. Maintaining Context Packs sounds like work.
4. The schema feels over-engineered.
5. Without a shared ecosystem, Contextarr has weak pull.
6. With a shared ecosystem, Contextarr becomes a security risk.
7. MCP may not be the dominant agent interface forever.
8. Exports must be visibly better than manual prompting.

## 2. Source of Truth

The main Contextarr PRD remains the source of truth.

This document is additive.

When this document conflicts with the main PRD, use the main PRD unless a later decision record explicitly adopts the change.

When this document conflicts with the v1 phase plan, use this rule:

```text
Context Packs reach v1.0 first.
Good-to-great layers may add docs, tests, fixtures, quality gates, and CLI contracts before v1.0, but they must not derail the core Context Pack system.
```

When this document conflicts with the Skills and Agent Kits PRD addition, use this rule:

```text
Skills and Agent Kits remain post-core unless explicitly pulled forward. Their future requirements may influence schemas, exports, registry trust, and CLI contracts now, but implementation waits until Context Packs prove adoption.
```

## 3. Strategic Summary

The current Contextarr plan is good because it defines a disciplined local-first product:

```text
Local sources in.
Validated Context Packs out.
Human-readable dashboard.
Redaction-aware exports.
Read-only MCP.
```

This addition makes it great by adding a quality system:

```text
Measurable context quality.
Authorable context packages.
Provenance-backed trust.
Agent-safe interfaces.
Official starter ecosystem.
```

The revised category target is:

```text
Context quality infrastructure for AI agents.
```

The revised technical identity is:

```text
A local-first package manager, validator, benchmark harness, authoring SDK, provenance layer, and agent interface for AI-ready context.
```

## 4. Product Thesis Added

AI tools are moving toward memory, context windows, project instructions, Skills, MCP, CLI agents, IDE agents, and provider-native recall.

That makes generic memory a weak category.

The durable value is not remembering more.

The durable value is improving context quality.

Contextarr should own context quality by answering these questions:

1. Is this context source-backed?
2. Is it current?
3. Is it reviewed?
4. Is it safe?
5. Is it redacted?
6. Is it export-ready?
7. Is it target-optimized?
8. Is it reproducible?
9. Is it better than manual prompting?
10. Can an agent consume it without being granted execution power?

## 5. New Product Principles

The existing Contextarr principles remain binding. Add these.

### 5.1 Context Quality Principle

Contextarr should not only store context. It should measure and improve context quality.

A Context Pack is valuable only when it is source-backed, reviewed, current, safe, redaction-aware, and useful to downstream AI tools.

### 5.2 Proof Before Claims Principle

Any claim that Contextarr improves AI output should be supported by demos, fixtures, before-and-after examples, export snapshots, or benchmark tasks.

Avoid vague claims such as:

```text
Better AI memory.
Smarter context.
100 percent safe.
```

Prefer concrete claims:

```text
This export includes 18 approved records, 7 sources, 0 critical issues, 2 stale warnings, and a redacted contractor-safe brief.
```

### 5.3 Authoring Experience Principle

Context Packs should be as easy to author, validate, test, and share as a small open-source package.

Authoring should not require users to memorize schema details.

Contextarr should provide scaffolding, linting, examples, tests, export snapshots, and clear fix guidance.

### 5.4 Provenance Before Registry Principle

A registry item is not trustworthy merely because it exists.

Trust requires manifest validation, source maps, hashes, signatures, scanner reports, review metadata, license status, revocation state, and local re-verification.

### 5.5 Agent Interface Contract Principle

Agents should be able to use Contextarr safely without MCP.

The CLI, export system, and read-only MCP should all expose the same trusted core through deterministic, bounded, redaction-aware interfaces.

### 5.6 Starter Ecosystem Principle

Contextarr should ship with enough official starter packs, templates, export profiles, and examples that users immediately understand the product without connecting private data.

The starter ecosystem is not a marketplace.

It is official, curated, fake or public-safe, and designed to teach conventions.

## 6. Five Layers Overview

| Layer | Purpose | Primary user value | Strategic value |
|---|---|---|---|
| Context Quality Benchmark | Prove Contextarr improves outputs | Users see measurable benefit | Differentiates from vague memory tools |
| Pack Authoring SDK and CI | Make packs easy to create and maintain | Lower authoring friction | Enables ecosystem and registry |
| Trust and Provenance Layer | Make shared artifacts verifiable | Users can trust imports | Enables future registry and private team distribution |
| Agent Interface Contract | Make CLI and exports first-class agent surfaces | Agents can use Contextarr without MCP | Reduces dependency on MCP enthusiasm |
| Official Starter Ecosystem | Seed useful examples and templates | Users get value immediately | Creates ecosystem gravity before marketplace |

## 7. Layer 1: Context Quality Benchmark

### 7.1 Purpose

Create a repeatable way to prove that Contextarr outputs improve AI task results compared with no context, manual prompting, raw notes, or provider memory alone.

### 7.2 Problem

The product thesis says users waste time re-explaining context and that structured context helps AI perform better.

That claim must be demonstrated.

Without evidence, Contextarr risks sounding like another memory system.

### 7.3 Product Definition

The Context Quality Benchmark is a local and optionally publishable benchmark harness that compares AI task performance across context conditions.

Benchmark modes:

1. No context.
2. Manual prompt.
3. Raw notes pasted.
4. Contextarr export.
5. Contextarr CLI brief.
6. Contextarr MCP query, if MCP exists.

### 7.4 Benchmark Task Types

Initial benchmark task types:

1. Technical troubleshooting answer.
2. Coding-agent implementation prompt.
3. Support ticket drafting.
4. Contractor handoff brief.
5. Architecture decision recovery.
6. Internal KB answer.
7. Product comparison.
8. Redacted external share.

### 7.5 Scoring Dimensions

Each benchmark should score:

1. Task success.
2. Grounding accuracy.
3. Source coverage.
4. Hallucination rate.
5. Sensitive leakage.
6. Stale context handling.
7. Instruction following.
8. Output structure.
9. Token efficiency.
10. Repeatability.

### 7.6 Benchmark Folder Structure

Recommended structure:

```text
contextarr/
  demo-evals/
    README.md
    benchmark-manifest.json
    tasks/
      ai-workstation-troubleshooting/
        task.yaml
        no-context-prompt.md
        manual-prompt.md
        expected-facts.yaml
        scoring-rubric.yaml
        sample-outputs/
          no-context.md
          manual.md
          contextarr-export.md
          contextarr-brief.md
      support-ticket-drafting/
        task.yaml
        expected-output.md
        scoring-rubric.yaml
    reports/
      sample-report.md
      sample-report.json
```

### 7.7 Benchmark Manifest Example

```json
{
  "schemaVersion": "contextarr.benchmark.v1",
  "id": "ai-workstation-troubleshooting",
  "name": "AI Workstation Troubleshooting Benchmark",
  "packIds": ["ai-workstation-pack"],
  "taskType": "technical_troubleshooting",
  "conditions": [
    "no_context",
    "manual_prompt",
    "raw_notes",
    "contextarr_export",
    "contextarr_cli_brief",
    "contextarr_mcp_query"
  ],
  "scoring": {
    "taskSuccess": 30,
    "groundingAccuracy": 25,
    "sensitiveLeakage": 20,
    "sourceCoverage": 10,
    "outputStructure": 10,
    "tokenEfficiency": 5
  }
}
```

### 7.8 Benchmark Report Schema

```ts
interface ContextQualityBenchmarkReportV1 {
  schemaVersion: "contextarr.benchmark-report.v1";
  benchmarkId: string;
  taskId: string;
  packIds: string[];
  exportProfileIds: string[];
  generatedAt?: string;
  conditions: Array<{
    id: string;
    label: string;
    inputTokens?: number;
    outputTokens?: number;
    score: number;
    scores: {
      taskSuccess: number;
      groundingAccuracy: number;
      sensitiveLeakage: number;
      sourceCoverage: number;
      outputStructure: number;
      tokenEfficiency: number;
    };
    passed: boolean;
    notes: string[];
  }>;
  winner: string;
  summary: string;
}
```

### 7.9 Non-Goals

Do not build:

1. Hosted benchmark service.
2. Leaderboard.
3. Model benchmark company.
4. Automatic cloud model evaluation.
5. Vendor ranking system.
6. Telemetry.
7. Hidden model calls.

### 7.10 Acceptance Criteria

The Context Quality Benchmark succeeds if:

1. Demo benchmark tasks exist.
2. Each task has expected facts and scoring rubric.
3. Contextarr exports can be compared against no-context and manual-prompt baselines.
4. Reports are deterministic when sample outputs are fixed.
5. Sensitive leakage can be marked as a failure.
6. Stale source handling can be scored.
7. Users can understand why Contextarr output scored better or worse.

## 8. Layer 2: Pack Authoring SDK and CI

### 8.1 Purpose

Make Context Pack creation fast, reliable, testable, and ecosystem-ready.

### 8.2 Problem

A strict schema is good, but strict schemas can feel like friction.

If users must hand-author YAML and JSON without tooling, the pack ecosystem will not grow.

### 8.3 Product Definition

The Pack Authoring SDK is a set of CLI commands, templates, tests, docs, and optional CI workflows that help users create valid Context Packs without memorizing the schema.

### 8.4 Authoring Commands

Recommended commands:

```text
contextarr init pack
contextarr init record
contextarr init source-map
contextarr init export-profile
contextarr lint <pack-path>
contextarr test-pack <pack-path>
contextarr snapshot-export <pack-id> --target codex
contextarr explain <issue-code>
contextarr autofix <pack-path> --dry-run
```

### 8.5 Authoring Templates

Initial templates:

1. Project Pack.
2. Technical System Pack.
3. Internal KB Pack.
4. Support Process Pack.
5. Product Line Pack.
6. Homelab System Pack.
7. AI Workstation Pack.
8. Client Handoff Pack.
9. Contractor Handoff Pack.
10. Decision Log Pack.

### 8.6 Authoring SDK Folder Structure

```text
contextarr/
  packages/
    pack-authoring/
      src/
        templates/
        scaffolders/
        lint/
        snapshots/
        explain/
      tests/
  templates/
    context-pack/
      project/
      technical-system/
      internal-kb/
      support-process/
      product-line/
  .github/
    workflows/
      contextarr-pack-check.yml.example
```

### 8.7 Pack Test Types

Pack authoring tests should include:

1. Schema validity.
2. Source reference validity.
3. Export profile validity.
4. Redaction rule tests.
5. Snapshot export tests.
6. Stale source tests with fixed current date.
7. License warning tests.
8. Security scanner tests, later.
9. Renderer snapshot tests.
10. CLI JSON output tests.

### 8.8 Export Snapshot Tests

Export snapshot tests should prove that a pack produces stable output for a given target.

Example:

```text
contextarr snapshot-export ai-workstation-pack --target codex --out snapshots/codex.md
contextarr test-pack ai-workstation-pack --snapshots
```

Rules:

1. Snapshots are deterministic.
2. Snapshots exclude runtime timestamps unless explicitly allowed.
3. Snapshots include redaction warnings.
4. Snapshots fail if approved content changes without updating snapshot.
5. Snapshots can be updated explicitly.

### 8.9 GitHub Action Example

Provide an example workflow only.

```yaml
name: Contextarr Pack Check

on:
  pull_request:
  push:
    branches: [main]

jobs:
  validate-packs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm contextarr validate ./packs --json
      - run: pnpm contextarr test-pack ./packs
```

### 8.10 Non-Goals

Do not build:

1. Hosted CI service.
2. Pack publishing service.
3. Remote registry install.
4. AI auto-authoring without review.
5. Auto-fix that silently changes pack content.
6. Marketplace submission flow.

### 8.11 Acceptance Criteria

The Pack Authoring SDK succeeds if:

1. A user can scaffold a valid pack.
2. A user can scaffold a valid record.
3. A user can validate a pack locally.
4. A user can understand validation errors.
5. A user can run pack tests in CI.
6. A user can snapshot export output.
7. Generated files are readable and source-backed.
8. No generated pack content is executable.

## 9. Layer 3: Trust and Provenance Layer

### 9.1 Purpose

Make Context Packs, Skills, Agent Kits, templates, and export profiles verifiable enough for future sharing, private registries, and public registry review.

### 9.2 Problem

Shared AI artifacts are dangerous if users cannot verify what they contain, where they came from, whether they changed, whether they were reviewed, and whether they were revoked.

Scanning is useful but not enough.

Trust requires provenance.

### 9.3 Product Definition

The Trust and Provenance Layer adds package-integrity, source-integrity, review, signing, revocation, and bill-of-materials concepts to Contextarr artifacts.

### 9.4 Trust Artifacts

Future artifacts:

```text
contextarr-pack.lock
contextarr-provenance.json
contextarr-bom.json
validation-report.json
scanner-report.json
signature.sig
revocation.json
source-hashes.json
```

### 9.5 Lockfile

Purpose:

```text
Freeze the exact source, record, export profile, validation, and dependency state used to generate a pack or export.
```

Example:

```json
{
  "schemaVersion": "contextarr.lock.v1",
  "packId": "ai-workstation-pack",
  "packVersion": "1.0.0",
  "generatedFrom": {
    "manifestHash": "sha256:...",
    "recordsHash": "sha256:...",
    "sourcesHash": "sha256:...",
    "exportsHash": "sha256:...",
    "rulesHash": "sha256:..."
  },
  "sourceHashes": [
    {
      "sourceId": "workstation-manual-note",
      "hashAlgorithm": "sha256",
      "hash": "...",
      "calculatedAt": "2026-05-09T00:00:00Z"
    }
  ],
  "validationReportHash": "sha256:...",
  "scannerReportHash": null
}
```

### 9.6 Provenance File

Purpose:

```text
Describe who authored, reviewed, generated, validated, signed, and exported an artifact.
```

Example:

```json
{
  "schemaVersion": "contextarr.provenance.v1",
  "artifactId": "ai-workstation-pack",
  "artifactType": "context_pack",
  "version": "1.0.0",
  "createdBy": "local-user",
  "reviewedBy": "local-user",
  "validatedBy": "contextarr-validator",
  "validatorVersion": "0.1.0",
  "signedBy": null,
  "sourceType": "local",
  "trustLevel": "local",
  "reviewStatus": "approved"
}
```

### 9.7 Context BOM

A Context BOM is a bill of materials for a Contextarr artifact.

It lists:

1. Manifest.
2. Records.
3. Sources.
4. Export profiles.
5. Rules.
6. Assets.
7. Dependencies.
8. Licenses.
9. Hashes.
10. Review state.

Example file:

```text
contextarr-bom.json
```

### 9.8 Signing Model

Signing applies later, after local validation and scanner reports are stable.

Signable objects:

1. Context Pack artifact.
2. Validation report.
3. Scanner report.
4. Export snapshot.
5. Registry manifest.
6. Context BOM.

Signature roles:

1. Local author signature.
2. Publisher signature.
3. Contextarr official signature.
4. Private team registry signature.
5. Public registry signature.

### 9.9 Revocation Model

Revocable objects:

1. Registry artifact version.
2. Publisher key.
3. Official starter pack version.
4. Verified template version.
5. Agent Kit template version.

Revocation reasons:

1. Malware.
2. Prompt injection.
3. Credential exposure.
4. License violation.
5. Impersonation.
6. Stale critical source.
7. Publisher compromise.
8. Policy violation.
9. Confirmed user report.

### 9.10 Non-Goals

Do not build:

1. Public registry before trust model.
2. Marketplace payments.
3. Anonymous public uploads.
4. Perfect security claims.
5. Auto-activation from registry.
6. Background revocation network checks without user approval.
7. Executable artifact support.

### 9.11 Acceptance Criteria

The Trust and Provenance Layer succeeds if:

1. Pack hashes can be generated deterministically.
2. Source hashes can be tracked.
3. Validation reports can be hashed.
4. Scanner reports can be attached later.
5. Provenance metadata is readable.
6. Context BOM is generated.
7. Registry artifacts can be verified before activation.
8. Revoked artifacts can be blocked.
9. The user can inspect trust state in CLI and UI.

## 10. Layer 4: Agent Interface Contract

### 10.1 Purpose

Make Contextarr useful to agents through CLI and exports even when MCP is not used.

### 10.2 Problem

Agent tooling is not settling on a single interface. Some agents prefer MCP. Others prefer CLI, repo instructions, shell commands, generated briefs, AGENTS.md, CLAUDE.md, or direct files.

Contextarr should not be MCP-only.

### 10.3 Product Definition

The Agent Interface Contract defines what external agents can ask Contextarr for, what Contextarr guarantees, what it refuses, and what output shapes agents can rely on.

### 10.4 Interface Surfaces

1. CLI.
2. Export files.
3. Local API.
4. Read-only MCP.
5. Static rendered output.
6. Raw local files.

### 10.5 Agent Contract Guarantees

Contextarr guarantees:

1. Deterministic JSON output in agent mode.
2. Stable exit codes.
3. Redaction by default for agent-facing commands.
4. Approved content only by default.
5. Draft, blocked, rejected, revoked, and invalid content excluded by default.
6. No execution of pack content.
7. No shell commands from packs.
8. No hidden network calls.
9. Output size limits.
10. Source-backed facts when available.
11. Review and freshness warnings.
12. Clear machine-readable errors.

### 10.6 Agent Contract Refusals

Contextarr refuses:

1. Executing pack instructions.
2. Running Skills.
3. Running Agent Kits.
4. Acting as an agent runtime.
5. Auto-approving draft content.
6. Exporting blocked content by default.
7. Returning raw private sources by default.
8. Fetching remote registry content without explicit user command.
9. Bypassing redaction rules.
10. Mutating files from read-only commands.

### 10.7 Core Agent Commands

Required command families:

```text
contextarr validate
contextarr inspect
contextarr health
contextarr explain-health
contextarr export
contextarr brief
contextarr query
contextarr review
contextarr import --dry-run
contextarr import --quarantine
contextarr doctor
```

### 10.8 Agent Mode

`--agent` means:

1. Non-interactive.
2. Deterministic.
3. JSON by default unless otherwise requested.
4. No colour.
5. No progress animation.
6. Redacted output by default.
7. Approved content only.
8. Bounded output size.
9. Stable error codes.
10. No writes unless command is mutating and `--yes` is supplied.

### 10.9 Agent Interface Docs

Add:

```text
docs/agent-interface-contract.md
docs/cli-first-agent-interface.md
docs/cli-command-contract.md
docs/cli-agent-mode.md
docs/agent-usage.md
docs/cli-json-schemas.md
```

### 10.10 Non-Goals

Do not build:

1. Agent runner.
2. Workflow engine.
3. Autonomous background agent.
4. Mutating MCP.
5. Tool execution layer.
6. Shell execution layer.
7. Skill execution.
8. Agent Kit runtime.

### 10.11 Acceptance Criteria

The Agent Interface Contract succeeds if:

1. Codex can ask Contextarr for a task brief through CLI.
2. Claude Code can consume generated project instructions.
3. Local agents can query approved context without MCP.
4. MCP remains optional.
5. CLI and MCP share core logic.
6. Exports remain deterministic.
7. Agent-facing outputs are redaction-aware.
8. The contract is documented and testable.

## 11. Layer 5: Official Starter Ecosystem

### 11.1 Purpose

Create immediate value, teach conventions, and seed future ecosystem behaviour without launching an unsafe public marketplace.

### 11.2 Problem

Without shared examples, Contextarr feels like an empty framework.

With an open marketplace too early, Contextarr becomes a security and support problem.

The middle path is an official starter ecosystem.

### 11.3 Product Definition

The Official Starter Ecosystem is a curated set of official demo packs, starter packs, templates, export profiles, redaction profiles, validation rule sets, benchmark tasks, and examples.

It is local-first and bundled or installable from trusted release artifacts.

It is not a public marketplace.

### 11.4 Starter Content Types

1. Official demo packs.
2. Official starter packs.
3. Official pack templates.
4. Official export profiles.
5. Official redaction rule sets.
6. Official validation rule sets.
7. Official benchmark tasks.
8. Official authoring examples.
9. Official contractor brief examples.
10. Official coding-agent brief examples.

### 11.5 Initial Official Packs

1. Contextarr Project Pack.
2. AI Workstation Pack.
3. Homelab Network Pack.
4. Local AI Stack Pack.
5. Jellyfin Server Pack.
6. Claude Code Project Pack.
7. Internal Support KB Pack.
8. Fake Product Line Pack.
9. Contractor Handoff Pack.
10. Support Ticket Workflow Pack.
11. Security Review Pack.
12. Pack Authoring Example Pack.

### 11.6 Initial Official Export Profiles

1. ChatGPT Concise Brief.
2. ChatGPT Deep Brief.
3. Claude Deep Context Brief.
4. Codex Implementation Brief.
5. Claude Code Project Brief.
6. AGENTS.md.
7. CLAUDE.md.
8. llms.txt.
9. Redacted Contractor Brief.
10. Support Handoff Brief.
11. Research Synthesis Brief.
12. Security Review Brief.

### 11.7 Initial Official Templates

1. Project Pack Template.
2. Technical System Pack Template.
3. Internal KB Pack Template.
4. Support Process Pack Template.
5. Product Line Pack Template.
6. Homelab System Pack Template.
7. AI Workstation Pack Template.
8. Client Handoff Pack Template.
9. Contractor Handoff Pack Template.
10. Decision Log Template.
11. Export Profile Template.
12. Redaction Rule Template.

### 11.8 Local Starter Gallery

The local starter gallery should appear in the dashboard only after core library views exist.

It should show:

1. Official starter packs.
2. Templates.
3. Export profiles.
4. Benchmarks.
5. Validation status.
6. Source status.
7. Trust level.
8. Install/copy/create actions.

Rules:

1. Starter content is official only.
2. No community uploads.
3. No payments.
4. No remote install in v0.
5. No public marketplace language.
6. No fake private data.
7. No executable content.

### 11.9 Non-Goals

Do not build:

1. Public marketplace.
2. Creator accounts.
3. Payments.
4. Anonymous uploads.
5. Public GEO pack content farm.
6. Auto-install from remote sources.
7. Executable templates.
8. Third-party documentation dumps.

### 11.10 Acceptance Criteria

The Official Starter Ecosystem succeeds if:

1. A new user can understand Contextarr from official packs alone.
2. Starter packs validate cleanly.
3. Templates scaffold valid packs.
4. Export profiles show clear target-specific value.
5. Benchmark tasks prove before-and-after value.
6. No starter content includes private or real sensitive data.
7. Starter content teaches authoring conventions.
8. Starter content prepares the path to a future trusted registry.

## 12. Phase Plan Addition

This section adds Good-to-Great phases. These are named G-phases to avoid colliding with the existing Contextarr core phase plan.

G-phases may be inserted into existing phases where noted.

Do not skip the core Context Pack phases.

## G0: Category, Quality, and Agent Contract Docs

### Recommended placement

Immediately after Phase 0 or alongside Phase 0 hardening.

### Goal

Add docs that define the five good-to-great layers and prevent future scope drift.

### Build

Create:

```text
docs/context-quality.md
docs/product-defense-roadmap.md
docs/agent-interface-contract.md
docs/official-starter-ecosystem.md
docs/authoring-sdk.md
docs/trust-and-provenance.md
```

Update:

```text
README.md
docs/architecture.md
docs/security-model.md
docs/non-goals.md
docs/roadmap-phases.md
AGENTS.md
```

### Acceptance criteria

1. Context Quality is defined.
2. CLI-first agent contract is defined.
3. Official starter ecosystem is defined.
4. Trust and provenance layer is defined.
5. Authoring SDK is defined.
6. No implementation is added beyond docs.
7. No marketplace, cloud, executable pack, Skill, or Agent Kit implementation is added.

### Codex hard boundaries

Do not implement product functionality.
Do not add new packages.
Do not build UI.
Do not build marketplace.
Do not build registry.
Do not build Skills or Agent Kits.

## G1: Context Quality Benchmark Design

### Recommended placement

After Phase 1 schema and validator, before or during Phase 2 demo packs.

### Goal

Define benchmark schemas, folders, task formats, and scoring rubrics.

### Build

Create:

```text
docs/context-quality-benchmark.md
docs/benchmark-schema.md
demo-evals/README.md
demo-evals/benchmark-manifest.example.json
demo-evals/tasks/example-task/task.yaml
demo-evals/tasks/example-task/scoring-rubric.yaml
```

### Acceptance criteria

1. Benchmark file structure is documented.
2. Task schema is documented.
3. Scoring rubric is documented.
4. No model calls are implemented.
5. No hosted benchmark service is added.

## G2: Demo Benchmark Fixtures

### Recommended placement

During Phase 2 demo packs.

### Goal

Add benchmark fixtures using the official demo packs.

### Build

Create benchmark tasks for:

1. AI Workstation troubleshooting.
2. Support ticket drafting.
3. Contractor handoff.
4. Codex implementation brief.
5. Internal KB answer.

Add:

```text
demo-evals/tasks/ai-workstation-troubleshooting/**
demo-evals/tasks/support-ticket-drafting/**
demo-evals/tasks/contractor-handoff/**
demo-evals/tasks/codex-implementation-brief/**
demo-evals/tasks/internal-kb-answer/**
```

### Acceptance criteria

1. All benchmark fixtures use fake or public-safe demo data.
2. Each task references demo packs.
3. Each task includes no-context prompt.
4. Each task includes expected facts.
5. Each task includes scoring rubric.
6. Each task can be used later by export and brief commands.

## G3: Benchmark Harness v0

### Recommended placement

After Phase 8 export engine v0.

### Goal

Run benchmark comparisons against fixed sample outputs and generated exports.

### Build

Add package or module:

```text
packages/context-quality
```

Add CLI command:

```text
contextarr benchmark run <task-id> --sample-only --json
contextarr benchmark report <task-id> --out reports/
```

### Acceptance criteria

1. Benchmark command can load fixtures.
2. Benchmark command can compare fixed sample outputs.
3. Benchmark command can include Contextarr export output.
4. Report JSON is deterministic.
5. No external AI APIs are called.
6. No telemetry is added.

## G4: Export Quality Benchmark Gate

### Recommended placement

Before v0.1 public preview or before Phase 12 launch docs.

### Goal

Use benchmarks as a release gate for demo exports.

### Build

Add release checks:

```text
pnpm benchmark:demo
pnpm benchmark:report
```

### Acceptance criteria

1. Demo exports are benchmarked.
2. Reports show Contextarr export compared with no-context and manual baseline samples.
3. Sensitive leakage failures block release.
4. Broken source references lower score.
5. Stale warnings appear in benchmark report.

## G5: Pack Authoring SDK Design

### Recommended placement

After Phase 1 validator or alongside Phase 2 demo packs.

### Goal

Define authoring SDK commands, templates, and CI workflow before implementation.

### Build

Create:

```text
docs/pack-authoring-sdk.md
docs/pack-ci.md
docs/export-snapshot-testing.md
docs/pack-scaffolding.md
```

### Acceptance criteria

1. Authoring commands are defined.
2. Template structure is defined.
3. Snapshot export testing is defined.
4. GitHub Action example is documented.
5. No scaffolder implementation yet unless explicitly scoped.

## G6: Pack Scaffolder v0

### Recommended placement

After Phase 2 demo packs validate.

### Goal

Let users scaffold valid Context Packs and records.

### Build

Add package:

```text
packages/pack-authoring
```

Add commands:

```text
contextarr init pack
contextarr init record
contextarr init export-profile
```

### Acceptance criteria

1. Generated pack validates.
2. Generated record validates.
3. Generated export profile validates.
4. Generated files are human-readable.
5. Generated files include no private data.
6. Generated files include no executable content.

## G7: Pack Lint and Explain v0

### Recommended placement

After Phase 1 validator and G6 scaffolder.

### Goal

Make validation errors understandable and actionable.

### Build

Add commands:

```text
contextarr lint <pack-path>
contextarr explain <issue-code>
```

### Acceptance criteria

1. Lint wraps validation report with actionable guidance.
2. Explain returns human-readable descriptions for issue codes.
3. JSON mode exists.
4. Agent mode exists.
5. No auto-fix writes by default.

## G8: Export Snapshot Tests

### Recommended placement

After Phase 8 export engine.

### Goal

Make export quality testable for pack authors.

### Build

Add commands:

```text
contextarr snapshot-export <pack-id> --target codex --out snapshots/codex.md
contextarr test-pack <pack-path> --snapshots
```

### Acceptance criteria

1. Snapshot output is deterministic.
2. Snapshot tests fail on unexpected export changes.
3. Snapshots exclude runtime timestamps unless explicitly allowed.
4. Snapshot tests work in CI.

## G9: Pack Authoring CI Template

### Recommended placement

After G6 to G8.

### Goal

Help pack authors test packs in GitHub or local CI.

### Build

Create:

```text
.github/workflows/contextarr-pack-check.yml.example
docs/ci.md
```

### Acceptance criteria

1. Example CI validates packs.
2. Example CI runs pack tests.
3. Example CI runs export snapshot tests when snapshots exist.
4. Example CI does not publish anything.
5. Example CI does not call external AI APIs.

## G10: Trust and Provenance Design

### Recommended placement

After Phase 1 research-delta validation or alongside Registry Trust Foundation docs.

### Goal

Define lockfiles, provenance, Context BOM, signing, and revocation before implementation.

### Build

Create:

```text
docs/trust-and-provenance.md
docs/context-bom.md
docs/pack-lockfile.md
docs/signing-model.md
docs/revocation-model.md
```

### Acceptance criteria

1. Lockfile format is documented.
2. Provenance format is documented.
3. Context BOM format is documented.
4. Signing model is documented.
5. Revocation model is documented.
6. No registry implementation is added.

## G11: Source and Pack Hashes v0

### Recommended placement

After Phase 1 source hash metadata and Phase 3 indexer.

### Goal

Generate deterministic source and pack hashes.

### Build

Add commands:

```text
contextarr hash <pack-path> --json
contextarr hash-source <source-id> --pack <pack-id> --json
```

Add derived index fields if not already present.

### Acceptance criteria

1. Pack hash is deterministic.
2. Source hash is deterministic for local files.
3. Hashes are included in validation or health report.
4. Hash changes create review items later.
5. No remote source fetching is added.

## G12: Lockfile and Context BOM v0

### Recommended placement

After G11 and before registry prototype.

### Goal

Generate lockfiles and Context BOM files for local packs.

### Build

Add commands:

```text
contextarr lock <pack-id> --out contextarr-pack.lock
contextarr bom <pack-id> --out contextarr-bom.json
```

### Acceptance criteria

1. Lockfile includes pack, record, source, export, and rule hashes.
2. Context BOM lists pack components.
3. Output is deterministic.
4. CLI JSON mode exists.
5. No signing required yet.

## G13: Signed Reports and Provenance v0

### Recommended placement

After scanner/reporting and before verified registry prototype.

### Goal

Attach signatures to validation, scanner, provenance, and BOM artifacts.

### Build

Add commands later:

```text
contextarr sign validation-report.json
contextarr verify-signature validation-report.json
contextarr provenance <pack-id> --out contextarr-provenance.json
```

### Acceptance criteria

1. Signing model is implemented locally or documented as pending.
2. Unsigned artifacts remain local or imported, not verified.
3. Signature mismatch blocks verified status.
4. No public registry required.

## G14: Agent Interface Contract Docs

### Recommended placement

Immediately after Phase 0 or alongside CLI-first addition.

### Goal

Document how external agents use Contextarr safely.

### Build

Create:

```text
docs/agent-interface-contract.md
docs/cli-first-agent-interface.md
docs/cli-command-contract.md
docs/cli-agent-mode.md
docs/agent-usage.md
docs/cli-json-schemas.md
```

### Acceptance criteria

1. CLI-first interface is defined.
2. JSON envelopes are defined.
3. Exit codes are defined.
4. Agent mode is defined.
5. Codex and Claude Code usage examples exist.
6. MCP remains optional.

## G15: CLI Agent Commands v0

### Recommended placement

Implement gradually across Phase 1, Phase 3, Phase 7, and Phase 8.

### Goal

Make Contextarr usable by agents without MCP.

### Build

Commands by phase:

Phase 1:

```text
contextarr validate <path> --json --agent
```

Phase 3:

```text
contextarr inspect <pack-id> --json --agent
contextarr query <pack-id> "..." --json --agent
contextarr rescan --json
```

Phase 7:

```text
contextarr health <pack-id> --json --agent
contextarr review list --json
```

Phase 8:

```text
contextarr export <pack-id> --target codex --json --agent
contextarr brief <pack-id> --for codex --task "..." --json --agent
```

### Acceptance criteria

1. Commands are deterministic in agent mode.
2. Commands use stable JSON output.
3. Commands use stable exit codes.
4. Commands exclude unapproved content by default.
5. Commands redact by default in agent mode.
6. Commands do not execute pack content.

## G16: Agent Usage Examples and Repo Integration

### Recommended placement

After G15 begins and before public preview.

### Goal

Show agents how to use Contextarr in real workflows.

### Build

Create:

```text
docs/agent-workflows.md
docs/codex-workflow.md
docs/claude-code-workflow.md
AGENTS.md updates
```

Examples:

```text
contextarr brief contextarr-project-pack --for codex --task "Implement Phase 5 renderer" --agent --json
contextarr validate ./demo-packs --agent --json
contextarr health contextarr-project-pack --agent --json
contextarr export contextarr-project-pack --target agents-md --out AGENTS.md
contextarr query contextarr-project-pack "What are the hard non-goals?" --agent --json
```

### Acceptance criteria

1. Agent workflows are copyable.
2. Workflows avoid MCP dependency.
3. Workflows include hard boundaries.
4. Workflows do not suggest executing pack content.

## G17: Official Starter Ecosystem Design

### Recommended placement

Before Phase 2 demo packs or during Phase 2.

### Goal

Define official starter packs, templates, export profiles, and benchmark tasks.

### Build

Create:

```text
docs/official-starter-ecosystem.md
docs/starter-pack-policy.md
docs/starter-template-catalog.md
```

### Acceptance criteria

1. Starter catalog is defined.
2. Starter content rules are defined.
3. Official-only policy is defined.
4. No marketplace language is introduced.
5. No third-party docs dumps are allowed.

## G18: Official Starter Packs v0

### Recommended placement

During Phase 2 demo packs and before public preview.

### Goal

Expand demo packs into a stronger starter library.

### Build

Add starter packs as appropriate:

```text
demo-packs/contextarr-project-pack
demo-packs/homelab-network-pack
demo-packs/local-ai-stack-pack
demo-packs/contractor-handoff-pack
demo-packs/support-ticket-workflow-pack
demo-packs/security-review-pack
```

### Acceptance criteria

1. Starter packs validate with zero errors.
2. Starter packs are fake or public-safe.
3. Starter packs include source maps.
4. Starter packs include export profiles.
5. Starter packs include examples.
6. No starter pack includes real private data.

## G19: Starter Templates and Export Profiles

### Recommended placement

After Phase 2 and before or during Phase 8 export engine.

### Goal

Make official templates and export profiles reusable.

### Build

Add:

```text
templates/context-pack/**
templates/export-profile/**
templates/redaction-rules/**
templates/validation-rules/**
```

Export profiles:

1. ChatGPT Concise Brief.
2. ChatGPT Deep Brief.
3. Claude Deep Context Brief.
4. Codex Implementation Brief.
5. Claude Code Project Brief.
6. AGENTS.md.
7. CLAUDE.md.
8. llms.txt.
9. Redacted Contractor Brief.
10. Support Handoff Brief.
11. Research Synthesis Brief.
12. Security Review Brief.

### Acceptance criteria

1. Templates generate valid objects.
2. Export profiles validate.
3. Profiles are target-specific.
4. Profiles include redaction behaviour.
5. Profiles include source summary behaviour.

## G20: Local Starter Gallery

### Recommended placement

After Phase 4 dashboard and Phase 5 detail views.

### Goal

Make official starter content visible and usable without a marketplace.

### Build

Add UI section:

```text
Starter Library
```

Show:

1. Official packs.
2. Templates.
3. Export profiles.
4. Benchmark tasks.
5. Trust level.
6. Validation status.
7. Source count.
8. Record count.
9. Create from template.
10. Open demo.

### Acceptance criteria

1. Starter Library contains official content only.
2. No remote install.
3. No payments.
4. No community uploads.
5. No marketplace copy.
6. User can create a local pack from a template.

## G21: Good-to-Great Release Gate

### Recommended placement

Before v1.0 release candidate.

### Goal

Add final product gates that prove Contextarr is not just good but excellent.

### Build

Add release checklist:

```text
docs/good-to-great-release-gate.md
```

Gate criteria:

1. Context Quality Benchmark demo report exists.
2. Pack Authoring SDK can scaffold and validate a pack.
3. Pack tests can run locally.
4. Export snapshot tests work for at least one demo pack.
5. Trust and provenance docs exist.
6. Pack hash or lockfile exists, if implemented.
7. CLI agent mode exists for validate, health, export, and brief.
8. Official starter library exists.
9. Starter Library has no marketplace affordance.
10. No non-goal slipped in.

### Acceptance criteria

1. Release gate is documented.
2. Gate is run before v1.0.
3. Failures are documented.
4. Scope additions are blocked unless justified by decision record.

## 13. Updated Recommended Implementation Order

This addition modifies the implementation order without replacing the core PRD.

Recommended order:

1. Phase 0: Repo initialization and guardrails.
2. G0: Category, quality, and agent contract docs.
3. Phase 1: Pack schema and validator.
4. G1: Context Quality Benchmark design.
5. G5: Pack Authoring SDK design.
6. G10: Trust and Provenance design.
7. G14: Agent Interface Contract docs.
8. G17: Official Starter Ecosystem design.
9. Phase 2: Demo packs.
10. G2: Demo benchmark fixtures.
11. G18: Official starter packs v0.
12. Phase 3: Local index and API.
13. G11: Source and pack hashes v0, if Phase 1 and Phase 3 support it.
14. Phase 4: Dashboard shell and library.
15. Phase 5: Pack detail and record rendering.
16. G20: Local Starter Gallery, if dashboard is ready.
17. Phase 6: Static renderer.
18. Phase 7: Pack Health and Review Queue.
19. G7: Pack lint and explain v0.
20. Phase 8: Export engine.
21. G3: Benchmark harness v0.
22. G8: Export snapshot tests.
23. G15: CLI agent commands v0.
24. G19: Starter templates and export profiles.
25. Phase 9: Read-only MCP.
26. G16: Agent usage examples and repo integration.
27. Phase 12: v0.1 public preview, if early feedback is desired.
28. Phase 10: Importers v0.
29. G6: Pack scaffolder v0, if not already implemented.
30. G9: Pack Authoring CI template.
31. Phase 11: Composer v0.
32. Phase 14 to Phase 21: Continue v1 hardening.
33. G12: Lockfile and Context BOM v0.
34. G13: Signed reports and provenance v0.
35. G21: Good-to-Great Release Gate.
36. Phase 22 onward: Alpha, schema freeze, security review, release candidate, v1 stable.

## 14. Updated Repo Structure Additions

Add over time:

```text
contextarr/
  demo-evals/
    README.md
    benchmark-manifest.example.json
    tasks/
    reports/

  templates/
    context-pack/
    export-profile/
    redaction-rules/
    validation-rules/

  packages/
    context-quality/
    pack-authoring/

  docs/
    context-quality.md
    context-quality-benchmark.md
    product-defense-roadmap.md
    agent-interface-contract.md
    cli-first-agent-interface.md
    pack-authoring-sdk.md
    trust-and-provenance.md
    context-bom.md
    pack-lockfile.md
    official-starter-ecosystem.md
    starter-pack-policy.md
    good-to-great-release-gate.md
```

Do not add all packages immediately.

Docs first.

Implementation follows phase gates.

## 15. Updated Success Criteria

### 15.1 Technical Success

This addition succeeds technically if:

1. Context quality can be benchmarked.
2. Packs can be scaffolded and tested.
3. Export outputs can be snapshot-tested.
4. Pack hashes and source hashes can be generated.
5. Provenance metadata can be produced.
6. CLI agent mode works for core operations.
7. Official starter packs validate.
8. Official templates generate valid packs.
9. Starter Library works without marketplace features.
10. No execution support is introduced.

### 15.2 User Success

This addition succeeds for users if:

1. Users understand the product faster through starter content.
2. Users can create packs without hand-writing every file.
3. Users trust Contextarr because reports are visible.
4. Users prefer generated briefs over manual prompts.
5. Users use CLI commands from agents.
6. Users maintain packs because health and review signals are actionable.
7. Users ask for more templates, not a generic chatbot.
8. Users ask for official packs, private registry, or setup services.

### 15.3 Ecosystem Success

This addition succeeds for ecosystem growth if:

1. Third parties can author packs reliably.
2. Pack tests work in CI.
3. Export snapshot tests catch unintended changes.
4. Starter templates are copied and adapted.
5. Official packs demonstrate conventions.
6. Future registry artifacts have provenance requirements.
7. Users understand the difference between official, local, imported, verified, and unreviewed.

### 15.4 Monetization Readiness

This addition improves monetization readiness if users ask for:

1. Paid setup.
2. Paid migration.
3. Paid official Pro templates.
4. Paid vertical starter packs.
5. Paid Contextarr Studio.
6. Private team registry.
7. Verified registry access.
8. Pack authoring support.

## 16. Kill, Pause, or Refocus Signals

Pause or refocus if:

1. Benchmarks do not show Contextarr output improving real task performance.
2. Users do not prefer exports over manual prompting.
3. Pack authoring remains too complex after scaffolding.
4. Review Queue still feels like busywork.
5. Starter packs do not help users understand the product.
6. Users only ask for chatbot features.
7. Users only ask for cloud sync.
8. Users primarily ask for executable Skills or agent runtime.
9. Registry trust work becomes security theater without practical user value.
10. CLI agent mode becomes a workflow runner instead of an interface.

## 17. Codex Guidance

### 17.1 Global Rules

Codex must follow these rules when implementing this addition:

1. Do not skip the core Context Pack phases.
2. Do not build all G-phases at once.
3. Prefer docs before implementation.
4. Add tests with every implementation phase.
5. Keep local files as source of truth.
6. Keep SQLite derived and rebuildable.
7. Keep packs data-only.
8. Do not add executable packs.
9. Do not add executable Skills.
10. Do not add Agent Kit runtime.
11. Do not build marketplace before trust model.
12. Do not add cloud services.
13. Do not add telemetry.
14. Do not call external AI APIs.
15. Do not include real private data.
16. Do not copy third-party content, scanner logic, export templates, or docs.
17. Stop after the requested phase.

### 17.2 Required Codex Final Report Format

Every Codex implementation pass for this addition must end with:

1. Summary.
2. Files created.
3. Files changed.
4. Commands run.
5. Tests run.
6. Checks passed.
7. Blockers.
8. Security notes.
9. Deviations from PRD.
10. Next recommended prompt.

## 18. Codex Prompt: G0 Planning Addition

Use this first.

```text
You are Codex acting as senior product architect and repo operator for Contextarr.

Goal:
Add the Good-to-Great PRD addition docs and roadmap references without implementing functionality.

Create or update:
- docs/context-quality.md
- docs/product-defense-roadmap.md
- docs/agent-interface-contract.md
- docs/official-starter-ecosystem.md
- docs/authoring-sdk.md
- docs/trust-and-provenance.md
- docs/roadmap-phases.md
- README.md
- docs/security-model.md
- docs/non-goals.md
- AGENTS.md if present or needed

Hard boundaries:
Do not implement app functionality.
Do not add packages.
Do not build benchmark harness.
Do not build scaffolder.
Do not build provenance signing.
Do not build starter gallery UI.
Do not build marketplace.
Do not build registry.
Do not build Skills.
Do not build Agent Kits.
Do not add cloud services.
Do not add telemetry.

Acceptance criteria:
- The five Good-to-Great layers are documented.
- Roadmap includes G-phases without disrupting core phase order.
- README explains context quality positioning.
- Security model preserves no-execution boundaries.
- Non-goals remain explicit.
- AGENTS.md tells future agents not to skip phases or build non-goals.

Run available docs and test checks.
Stop after docs and roadmap updates.
```

## 19. Final Recommendation

Add these five layers.

Do not add them as a feature pile.

Add them as quality infrastructure.

The core Contextarr product remains:

```text
Local files as source of truth.
Validated Context Packs.
Human-readable dashboard.
Pack Health.
Redaction-aware exports.
CLI-first agent interface.
Read-only MCP.
```

The great version becomes:

```text
Measurable context quality.
Authorable and testable packs.
Provenance-backed trust.
Agent-safe CLI and export contracts.
Official starter ecosystem.
```

That is the path from good to great.
