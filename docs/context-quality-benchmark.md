# Context Quality Benchmark Design

Status note: This is the approved benchmark design. G2 public-safe fixture files now live under `demo-evals/`, G3 local deterministic benchmark commands are implemented, and G4 local benchmark gate behavior is implemented. External AI calls, network fetches, cloud services, CI enforcement, public release automation, model leaderboards, registry behavior, and telemetry remain unimplemented.

## Purpose

The Context Quality Benchmark is the Good-to-Great layer that proves whether Contextarr exports and briefs improve AI task outcomes compared with weak context baselines.

This document defines the benchmark design and records the G1/G2/G3/G4 review decisions. The G3 harness and G4 gate are local and deterministic only; they do not call model APIs, fetch remote sources, add telemetry, add cloud services, add CI enforcement, or add public release automation.

## G1 Review Decision

Status: Approved for G2 public-safe fixture work.

The G1 design is accepted as consistent with the Good-to-Great PRD addition: it defines the benchmark purpose, comparison conditions, task types, scoring dimensions, deterministic file shapes, report shape, and safety boundaries without implementing benchmark execution.

This approval authorizes only G2 static fixture data under `demo-evals/`. It does not authorize a benchmark harness, scripts, report generation, external AI calls, telemetry, release gates, private data, or package changes.

## Product Claim

Contextarr should not claim "better AI memory" in the abstract. It should prove context quality with inspectable comparisons:

```text
Same task.
Same expected facts.
Different context conditions.
Visible scoring.
Clear source and safety failures.
```

The benchmark exists to answer:

- Did Contextarr provide the right facts?
- Did it reduce hallucination?
- Did it include source-backed context?
- Did it avoid sensitive leakage?
- Did it handle stale context correctly?
- Did it produce a more useful output than a manual prompt?

## Benchmark Conditions

Future benchmark tasks should compare these conditions:

| Condition | Meaning | G1 status |
|---|---|---|
| `no_context` | The task prompt with no supporting context. | Design only. |
| `manual_prompt` | A human-written brief assembled manually. | Design only. |
| `raw_notes` | Unstructured pasted notes or source fragments. | Design only. |
| `contextarr_export` | Output from a Contextarr export profile. | Design only. |
| `contextarr_cli_brief` | Output from a future `contextarr brief` command. | Design only. |
| `contextarr_mcp_query` | Output from optional read-only MCP query. | Design only. |

Conditions that depend on unimplemented commands remain planning contracts until [implementation-status.md](implementation-status.md) marks those commands current.

## Initial Task Types

Planned task types:

- Technical troubleshooting answer.
- Coding-agent implementation prompt.
- Support ticket drafting.
- Contractor handoff brief.
- Architecture decision recovery.
- Internal KB answer.
- Product comparison.
- Redacted external share.

G1 defines these types. G2 adds public-safe task fixtures under `demo-evals/`.

## Scoring Dimensions

Each task should use an explicit scoring rubric with these dimensions:

| Dimension | What It Measures | Failure Examples |
|---|---|---|
| Task success | The answer actually solves the task. | Missing the requested action, vague answer, wrong workflow. |
| Grounding accuracy | Claims match expected facts and approved sources. | Invented facts, wrong constraints, unsupported claims. |
| Source coverage | Important source-backed facts are used. | Omits required source, ignores current record, misses known boundary. |
| Hallucination rate | Unsupported or fabricated details are limited. | Adds nonexistent services, dates, files, people, commands, or claims. |
| Sensitive leakage | Private or blocked content is not exposed. | Includes secrets, private notes, restricted sources, or blocked records. |
| Stale context handling | Stale, uncertain, or superseded facts are flagged. | Treats stale facts as current or ignores freshness warnings. |
| Instruction following | Output respects task instructions and boundaries. | Implements when asked to plan, runs forbidden actions, ignores scope. |
| Output structure | Output shape is useful for the target user or agent. | Missing sections, unreadable ordering, no actionable next steps. |
| Token efficiency | Output is concise without dropping required facts. | Bloated brief, duplicated content, irrelevant context. |
| Repeatability | Same inputs produce stable scoring and reports. | Hidden timestamps, non-deterministic ordering, external state drift. |

## Proposed Score Weights

Default score weights for early local reports:

```json
{
  "taskSuccess": 30,
  "groundingAccuracy": 25,
  "sensitiveLeakage": 20,
  "sourceCoverage": 10,
  "outputStructure": 10,
  "tokenEfficiency": 5
}
```

Dimension weights may vary by task type, but the rubric must be visible and deterministic.

Sensitive leakage should be allowed to fail a task regardless of total score.

## Future File Structure

Benchmark fixture material lives under a dedicated folder:

```text
demo-evals/
  README.md
  benchmark-manifest.example.json
  tasks/
    example-task/
      task.yaml
      expected-facts.yaml
      scoring-rubric.yaml
      no-context-prompt.md
      manual-prompt.md
      raw-notes.md
```

G2 creates only static fixture files. G3 adds local deterministic scoring and report generation without sample model outputs, external AI calls, telemetry, release gates, or CI enforcement. G4 adds a local gate command and local package scripts over the accepted G3 reports, without CI enforcement.

## Manifest Shape

Future benchmark manifests should be deterministic and local-file friendly.

Example design:

```json
{
  "schemaVersion": "contextarr.benchmark.v1",
  "id": "example-task",
  "name": "Example Context Quality Task",
  "description": "Compares context conditions for one AI task.",
  "packIds": ["example-pack"],
  "taskType": "technical_troubleshooting",
  "conditions": [
    "no_context",
    "manual_prompt",
    "raw_notes",
    "contextarr_export",
    "contextarr_cli_brief"
  ],
  "requiredSources": ["example-source"],
  "safetyRules": {
    "failOnSensitiveLeakage": true,
    "failOnUnapprovedContent": true,
    "allowExternalModelCalls": false,
    "allowTelemetry": false
  },
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

## Task Shape

Future `task.yaml` files should describe the user task, allowed inputs, expected facts, and blocked behavior.

Design shape:

```yaml
schemaVersion: contextarr.benchmark-task.v1
id: example-task
name: Example Context Quality Task
taskType: technical_troubleshooting
prompt: |
  Answer the user task using only the provided condition input.
targetAudience: coding_agent
expectedOutput:
  format: markdown
  requiredSections:
    - diagnosis
    - recommended_next_step
    - safety_notes
allowedInputs:
  - no_context
  - manual_prompt
  - raw_notes
  - contextarr_export
  - contextarr_cli_brief
blockedBehavior:
  - external_network_calls
  - private_data_disclosure
  - shell_execution
  - unreviewed_content_use
```

## Expected Facts Shape

Future `expected-facts.yaml` files should list source-backed facts that benchmark outputs should include or avoid.

Design shape:

```yaml
schemaVersion: contextarr.expected-facts.v1
taskId: example-task
requiredFacts:
  - id: fact-001
    sourceId: example-source
    text: "Example source-backed fact."
    weight: 10
forbiddenClaims:
  - id: forbidden-001
    text: "Unsupported claim that should fail grounding."
staleWarnings:
  - sourceId: old-source
    expectedHandling: "Flag as stale or uncertain."
sensitiveFacts:
  - id: sensitive-001
    handling: "Must not appear in output."
```

## Scoring Rubric Shape

Future `scoring-rubric.yaml` files should make pass/fail logic inspectable.

Design shape:

```yaml
schemaVersion: contextarr.scoring-rubric.v1
taskId: example-task
maxScore: 100
failRules:
  - id: sensitive-leak
    dimension: sensitiveLeakage
    when: sensitive_content_present
    result: fail
dimensions:
  taskSuccess:
    max: 30
    criteria:
      - "Directly answers the task."
      - "Includes a concrete next step."
  groundingAccuracy:
    max: 25
    criteria:
      - "Claims match expected facts."
      - "Unsupported claims are penalized."
  sensitiveLeakage:
    max: 20
    criteria:
      - "No sensitive, private, blocked, or unapproved content appears."
  sourceCoverage:
    max: 10
    criteria:
      - "Required source-backed facts are included."
  outputStructure:
    max: 10
    criteria:
      - "Uses the required sections in order."
  tokenEfficiency:
    max: 5
    criteria:
      - "Avoids irrelevant or duplicated context."
```

## Report Shape

G3 benchmark reports are deterministic when evaluated against fixed local condition text and Contextarr-generated export output.

Design shape:

```json
{
  "schemaVersion": "contextarr.benchmark-report.v1",
  "benchmarkId": "example-task",
  "taskId": "example-task",
  "packIds": ["example-pack"],
  "exportProfileIds": ["example-profile"],
  "staleWarnings": [],
  "conditions": [
    {
      "id": "contextarr_export",
      "label": "Contextarr Export",
      "inputTokens": 1200,
      "outputTokens": 650,
      "score": 88,
      "scores": {
        "taskSuccess": 28,
        "groundingAccuracy": 23,
        "sensitiveLeakage": 20,
        "sourceCoverage": 8,
        "outputStructure": 7,
        "tokenEfficiency": 2
      },
      "passed": true,
      "notes": ["Included required source-backed facts."]
    }
  ],
  "winner": "contextarr_export",
  "summary": "Contextarr export scored highest because it preserved source-backed facts without leaking sensitive content."
}
```

Generated timestamps should be omitted in deterministic mode unless the caller explicitly requests them.

## Gate Shape

G4 benchmark gates are deterministic local summaries over G3 reports.

Design shape:

```json
{
  "schemaVersion": "contextarr.benchmark-gate.v1",
  "benchmarkId": "contextarr-demo-benchmark-fixtures",
  "taskIds": ["support-ticket-drafting"],
  "sampleOnly": true,
  "minimumContextarrExportScore": 80,
  "passed": true,
  "summary": {
    "tasks": 1,
    "passed": 1,
    "failed": 0,
    "minimumContextarrExportScore": 80,
    "contextarrExportMinimumObservedScore": 83,
    "failures": 0,
    "staleWarnings": 0
  },
  "tasks": [
    {
      "taskId": "support-ticket-drafting",
      "passed": true,
      "contextarrExportScore": 83,
      "baselineScores": {
        "no_context": 40,
        "manual_prompt": 84,
        "raw_notes": 70
      },
      "missingFacts": [],
      "failures": [],
      "checks": [
        {
          "id": "contextarr_export_minimum_score",
          "passed": true,
          "message": "Contextarr export score 83/100; minimum is 80."
        }
      ]
    }
  ]
}
```

## Local Evaluation Policy

The first benchmark design should prefer fixed fixture inputs and deterministic scoring. That lets the project prove report format, safety handling, and scoring clarity without relying on external model calls.

Rules:

- Static fixture prompts, raw notes, expected facts, and rubrics are current in G2.
- Fixed sample model outputs are not part of the initial G2 fixture set.
- Local deterministic scoring is current in G3.
- Local deterministic gate behavior is current in G4.
- External AI evaluation is out of scope unless a future prompt explicitly changes the boundary.
- Hidden model calls are always rejected.
- Telemetry is always rejected.
- Reports must be readable by humans and agents.

## Safety Boundaries

Benchmark work must not:

- Execute pack content.
- Execute shell commands from packs.
- Fetch remote sources.
- Call external AI APIs.
- Upload benchmark inputs or outputs.
- Add telemetry.
- Include private data.
- Add scripts, package entries, generated reports, or harness files in a fixture-only pass.
- Add release-gate scripts in a fixture-only pass.

## G1 Acceptance Criteria

G1 is complete when:

- Benchmark purpose and conditions are documented.
- Benchmark task types are documented.
- Scoring dimensions and default weights are documented.
- File structure is documented before fixture execution exists.
- Manifest, task, expected-facts, scoring-rubric, and report shapes are documented.
- Non-goals repeat no harness, no scripts, no external AI calls, no telemetry, and no private data.
- G2 remains limited to public-safe static fixture files unless a future prompt scopes later work.

## G2 Fixture Status

G2 static public-safe fixtures now exist under `demo-evals/`.

## G2 Coverage Review Decision

Status: Accepted.

G2 fixture coverage is accepted for the next benchmark phase. The fixture set satisfies the PRD-listed G2 tasks:

| Task | Fixture path | Demo pack |
|---|---|---|
| AI Workstation troubleshooting | `demo-evals/tasks/ai-workstation-troubleshooting/` | `ai-workstation-pack` |
| Support ticket drafting | `demo-evals/tasks/support-ticket-drafting/` | `internal-support-kb-pack` |
| Contractor handoff | `demo-evals/tasks/contractor-handoff/` | `claude-code-project-pack` |
| Codex implementation brief | `demo-evals/tasks/codex-implementation-brief/` | `claude-code-project-pack` |
| Internal KB answer | `demo-evals/tasks/internal-kb-answer/` | `internal-support-kb-pack` |

Each accepted task includes:

- `task.yaml`.
- `no-context-prompt.md`.
- `manual-prompt.md`.
- `raw-notes.md`.
- `expected-facts.yaml`.
- `scoring-rubric.yaml`.

The task files reference current public-safe demo packs, current export profile IDs, and source-backed expected facts. The fixture set does not include sample model outputs, generated reports, harness code, package entries, external AI calls, network fetches, shell execution, telemetry, or private data.

## G3 Implementation Status

Status: Current.

G3 implements a local deterministic harness in `packages/context-quality` and exposes it through:

```bash
contextarr benchmark run <task-id> --sample-only --json
contextarr benchmark report <task-id> --out benchmark-reports/
```

Current G3 scope:

- Add a local deterministic fixture loader for `demo-evals/benchmark-manifest.example.json` and `demo-evals/tasks/*`.
- Add deterministic validation for benchmark manifests, task files, expected facts, and scoring rubrics.
- Add deterministic scoring against local fixture condition text and optional local condition output files.
- Include Contextarr-generated export output in memory through existing export code.
- Produce human-readable Markdown and JSON benchmark reports as local derived artifacts.
- Add focused tests for fixture loading, validation, scoring, report determinism, CLI wiring, report writes, agent-mode write blocking, and safety failures.

G3 must not:

- Call external AI APIs.
- Fetch remote sources.
- Add telemetry.
- Add cloud services.
- Add model leaderboards or vendor rankings.
- Add release gates or CI enforcement; local gate behavior belongs to G4, while CI enforcement remains unimplemented.
- Execute pack content or shell commands from fixtures.
- Treat `contextarr_cli_brief` or `contextarr_mcp_query` as current unless [implementation-status.md](implementation-status.md) marks those surfaces current.

## G3 Report Review Decision

Status: Accepted as a diagnostic report format, not as benchmark gate behavior.

Reviewed local G3 reports for:

- `support-ticket-drafting`
- `codex-implementation-brief`

The reviewed reports are useful for early scoring because they show deterministic differences between weak and stronger context conditions:

- `no_context` scores low when required facts are missing.
- `manual_prompt`, `raw_notes`, and `contextarr_export` can be compared on required fact coverage, source-backed content, safety failures, and token efficiency.
- `contextarr_export` matched the required facts and avoided sensitive leakage in the reviewed reports.
- A shorter manual or raw-notes baseline can still win when it includes every required fact with fewer tokens or closer prompt structure.

Important interpretation limits:

- Default G3 reports score local condition text and in-memory Contextarr export output. They do not call a model or judge a real generated answer.
- `outputStructure` is most useful when fixed local output samples are supplied through `--outputs`. Without fixed output samples, it is only a rough prompt-shape signal.
- A G3 score proves deterministic fixture/report behavior and context coverage, not final model performance.
- G3 report review must not be treated as approval to add release gates, package scripts, CI enforcement, hosted evaluation, external AI calls, or telemetry.

Decision:

- G3 is accepted for local diagnostic report review, fixture quality checks, and export coverage checks.
- G3 is not accepted as a release gate.
- If Contextarr needs benchmark results to block a release, fail a demo, or enforce minimum thresholds, use the current G4 local gate command and scripts.

## G4 Implementation Status

Status: Current.

G4 implements local deterministic benchmark gate behavior over the accepted G2 fixtures and G3 reports.

Current commands:

```bash
contextarr benchmark gate <task-id> --sample-only --json
contextarr benchmark gate --all --sample-only
contextarr benchmark gate --all --sample-only --out benchmark-reports/
pnpm benchmark:demo
pnpm benchmark:report
```

Current G4 gate checks:

- `contextarr_export` condition is present.
- `contextarr_export` passes deterministic safety checks.
- `contextarr_export` score is at least the configured minimum, default `80`.
- `contextarr_export` has no missing required facts.
- Sensitive leakage failures block the gate.
- `contextarr_export` scores higher than `no_context`.
- Gate output includes baseline scores for `no_context`, `manual_prompt`, and `raw_notes`.
- Gate reports include stale-warning counts, even when current public-safe fixtures have none.

Current G4 report behavior:

- Without `--out`, `contextarr benchmark gate` prints a concise gate result.
- With `--out`, it writes `benchmark-gate.json`, `benchmark-gate.md`, and per-task G3 JSON/Markdown reports.
- `pnpm benchmark:demo` runs the local gate without writing reports.
- `pnpm benchmark:report` writes local reports to `benchmark-reports/`.

Still out of scope unless separately and explicitly scoped:

- External AI calls.
- Network fetches.
- Telemetry.
- Hosted benchmark services.
- Model leaderboards or vendor rankings.
- Public release automation.
- CI enforcement beyond local scripts.
- New registry, marketplace, Skill, Agent Kit, or cloud behavior.
- Requiring `contextarr_export` to beat every manual or raw-notes baseline.
- Claiming final model-output quality without fixed local output samples or future explicitly scoped evaluation.

## Next Allowed Phase

G4 is complete as a local deterministic gate. The next Good-to-Great work should be explicitly scoped, such as G5 Pack Authoring SDK design details, and must not pull in scaffolders, provenance signing, starter galleries, registry behavior, Skills, Agent Kits, cloud services, external AI calls, or telemetry.
