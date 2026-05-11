# Contextarr PRD Addition: Agentic AI Context Readiness and Local Observability

Version: 0.1 draft Date: 2026-05-10 Owner: Rob Status: Planning addition

Status note: This PRD addition is accepted planning scope only. [../implementation-status.md](../implementation-status.md) is the shipped-versus-planned source of truth for the current checkout.

## 1. Purpose

This document adds an Agentic AI Context Readiness and Local Observability layer to Contextarr.

It translates the Harvard Business Review Analytic Services report, *Solving Agentic AI's Data Infrastructure and Telemetry Needs*, into a focused Contextarr product addition.

The report validates that agentic AI success depends on clean data, integrated workflows, governance, observability, cost control, and evaluation. Contextarr should not become a telemetry platform, agent runner, cloud analytics product, or enterprise workflow automation suite. Contextarr should own the narrower and more defensible layer:

```text
Validated, source-backed, redacted, reviewable, exportable context infrastructure for AI assistants and agents.
```

This addition defines:

1. Context Readiness Score.
2. Local Observability.
3. Governance metadata for agent use.
4. Export and MCP evidence logs.
5. Token and context-cost awareness.
6. Agentic AI Readiness starter pack.
7. Context Quality Benchmark integration.
8. UI, API, CLI, schema, and database additions.
9. Ordered implementation phases.
10. Codex implementation guidance.

## 2. Source of Truth

The main Contextarr PRD remains the source of truth.

This document is additive. It does not replace the main PRD, the Phase 1 to Phase 3 research delta, the phase-by-phase v1 plan, the Skills and Agent Kits PRD addition, the Good to Great Layers addition, or the Starter Context Packs and Object UI addition.

When this document conflicts with the main Contextarr PRD, use the main PRD unless a later decision record explicitly adopts this addition.

When this document conflicts with the v1 phase plan, use this rule:

```text
Context Packs reach v1.0 first.
Context Readiness and Local Observability may strengthen Pack Health, exports, MCP logs, benchmarks, and docs before v1.0, but must not derail the core Context Pack build order.
```

When this document conflicts with the Skills and Agent Kits PRD addition, use this rule:

```text
Skills and Agent Kits remain future objects.
This addition may define agent-readiness metadata and governance fields that later help Agent Kits, but it must not implement Skills, Agent Kits, execution, or agent runtime features before the core Context Pack system proves adoption.
```

## 3. Executive Summary

Agentic AI changes what context systems need to provide.

Basic AI memory helps an assistant remember facts.

Agentic AI context infrastructure must answer harder questions:

1. Is this context accurate enough for an agent to use?
2. Is it source-backed?
3. Is it current?
4. Is it reviewed?
5. Is it safe to export?
6. Is it governed by clear boundaries?
7. Is it observable locally after use?
8. Can the user see what was sent, when, to which target, and under which redaction mode?
9. Can the same context be reused across ChatGPT, Claude, Codex, Claude Code, Cursor, Open WebUI, AnythingLLM, local agents, CLI workflows, and read-only MCP?
10. Can the user prove Contextarr is not executing, phoning home, or hiding data movement?

This PRD addition makes Contextarr stronger by adding a measurable readiness layer and local evidence trail.

The key product upgrade:

```text
Pack Health says whether a Context Pack is valid and maintained.
Context Readiness says whether that context is ready for agentic AI use.
Local Observability shows what Contextarr exported, queried, redacted, reviewed, and warned about locally.
```

## 4. Strategic Interpretation of the HBR Report

The report highlights several agentic AI adoption constraints that map directly to Contextarr's product surface:

| Report theme                                         | Contextarr product implication                                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Agentic AI needs better data infrastructure          | Context Packs become structured local context infrastructure.                                              |
| Data quality and hygiene are core barriers           | Contextarr needs source-backed records, schema validation, review status, and confidence metadata.         |
| Governance must define what agents can access and do | Add agent governance metadata and export policy boundaries.                                                |
| Observability is required because agents act fast    | Add local evidence logs for exports, MCP queries, reviews, redaction hits, and benchmark runs.             |
| Telemetry volume and cost increase with agentic AI   | Add token budgets, export size limits, result size limits, and context bloat warnings.                     |
| Unclear ROI slows adoption                           | Add Context Quality Benchmark and before-after demo reports.                                               |
| Workflows must be redesigned, not merely automated   | Add readiness starter packs and process-mapping records without turning Contextarr into a workflow runner. |
| Evaluation frameworks are needed                     | Add readiness reports, benchmark reports, export snapshots, and release gates.                             |

The report does not justify building a Cribl-style telemetry pipeline.

The report does justify Contextarr becoming:

```text
A local-first context readiness, governance, and evidence layer for agentic AI.
```

## 5. Product Thesis Added

Contextarr should not be positioned as generic AI memory.

Contextarr should be positioned as:

```text
Agentic AI context infrastructure.
```

More precise:

```text
A local-first context infrastructure layer that turns scattered knowledge, SOPs, decisions, system state, and project context into validated, redacted, source-backed context for AI assistants and agents.
```

The new thesis:

```text
Agentic AI needs context that is not only available, but ready.
Contextarr measures, maintains, governs, and exports that readiness from local files.
```

The durable value is not remembering more.

The durable value is making context:

1. Source-backed.
2. Current.
3. Reviewed.
4. Redaction-aware.
5. Governed.
6. Export-ready.
7. Agent-safe.
8. Locally observable.
9. Deterministic.
10. Portable across tools.

## 6. Category and Positioning

### 6.1 Existing category

```text
Self-hosted context automation system and pack manager for AI assistants and agents.
```

### 6.2 Added category language

```text
Local-first context readiness infrastructure for agentic AI.
```

### 6.3 Technical description

```text
Contextarr validates, reviews, renders, redacts, exports, and locally observes source-backed Context Packs for AI assistants and agents. It provides Context Readiness scores, governance metadata, export evidence, token-budget visibility, and read-only local access without becoming a chatbot, telemetry platform, hosted vault, or agent runner.
```

### 6.4 GitHub README phrasing

```text
Contextarr is a local-first context infrastructure system for agentic AI. It keeps Context Packs in readable files, validates source-backed records, shows context readiness, redacts sensitive details, generates target-specific exports, and exposes approved context through CLI and read-only MCP.
```

### 6.5 Homepage phrasing

```text
Stop sending unreviewed context to agents.
Keep your context local, source-backed, reviewed, redacted, and ready for any AI tool.
```

### 6.6 Enterprise-adjacent phrasing

```text
Contextarr helps teams prepare trusted context for agentic AI without handing execution authority, cloud storage, or hidden telemetry to the context layer.
```

## 7. Product Boundaries

### 7.1 What this addition adds

This addition may add:

1. Context Readiness Score.
2. Context Readiness Report.
3. Local Observability logs.
4. Export history metadata.
5. MCP query metadata logs.
6. Review activity events.
7. Redaction event history.
8. Token budget and context-size warnings.
9. Agent governance metadata.
10. Governance rules file.
11. Agentic AI Readiness starter pack.
12. Readiness dashboard.
13. Local activity dashboard.
14. Readiness CLI commands.
15. Readiness API endpoints.
16. Read-only MCP readiness summary tool, later.
17. Context Quality Benchmark integration.
18. Release gates for readiness and leakage.

### 7.2 What this addition must not add

This addition must not add:

1. Hosted telemetry.
2. Product analytics.
3. Phone-home tracking.
4. Cloud observability dashboard.
5. Agent runner.
6. Workflow automation engine.
7. Live agent action capture.
8. Direct Gmail connector.
9. Direct Slack connector.
10. Direct Google Drive connector.
11. Direct Jira connector.
12. Direct CRM connector.
13. Direct bank or brokerage connector.
14. External SIEM integration in v0 or v1.
15. Always-on capture.
16. Mutating MCP.
17. Agent action tools.
18. Shell command execution.
19. Browser automation.
20. Public marketplace.
21. Public registry.
22. Hosted sync.
23. Managed AI subscription.
24. Hidden network checks.
25. Uploading logs or diagnostics automatically.

## 8. Core Vocabulary

### 8.1 Context Pack

A structured, versioned, source-backed bundle of reusable context.

### 8.2 Pack Health

A deterministic measure of whether a Context Pack is structurally valid, safe, reviewed, current, and export-ready.

### 8.3 Context Readiness

A higher-level measure of whether a Context Pack is ready for AI assistant or agent use.

Context Readiness includes Pack Health but adds governance, redaction fit, target fit, local observability, token-budget readiness, and evaluation readiness.

### 8.4 Local Observability

A local-only evidence layer that records metadata about Contextarr activity.

It answers:

1. What was exported?
2. Which pack was queried?
3. Which records were included?
4. Which redaction rules fired?
5. Which target profile was used?
6. Which warnings existed at the time?
7. What was the output hash?
8. Which review actions happened?

It does not mean cloud telemetry.

### 8.5 Product Telemetry

Automatic transmission of product usage data to Contextarr, analytics vendors, or cloud services.

Product telemetry remains a non-goal.

### 8.6 Agent Governance Metadata

Pack, record, export, or profile metadata that defines how AI assistants and agents may use the context.

Examples:

1. Advisory only.
2. Human review required.
3. Export allowed only in redacted mode.
4. Do not use for production changes.
5. Do not use for financial, medical, legal, or credential decisions.

### 8.7 Context Readiness Report

A deterministic report that explains the Context Readiness score, warnings, blockers, included dimensions, and suggested fixes.

### 8.8 Local Evidence Event

A structured local event stored in SQLite or local log files.

Examples:

1. `export.generated`
2. `mcp.query`
3. `review.item_created`
4. `readiness.calculated`
5. `redaction.hit`
6. `source.changed`
7. `benchmark.run`

### 8.9 Agentic AI Readiness Pack

A starter Context Pack that helps a user or team document strategy, data sources, governance, context boundaries, evaluation, and observability plans before deploying AI agents.

## 9. User Personas Added

### 9.1 AI Agent Power User

Uses ChatGPT, Claude, Codex, Claude Code, Cursor, OpenCode, Open WebUI, AnythingLLM, OpenClaw, Hermes, or local MCP clients.

Pain:

1. Agent output depends heavily on context quality.
2. Repeated prompting is inefficient.
3. It is unclear what context was sent to which tool.
4. Long prompts create cost and context bloat.
5. Sensitive details may leak into exports.
6. No simple way exists to prove context is reviewed and current.

Needs:

1. Readiness score.
2. Redaction warnings.
3. Export history.
4. Token budget warnings.
5. CLI and MCP access.
6. Evidence that draft or blocked records are not being used.

### 9.2 Developer or Coding-Agent User

Uses Codex, Claude Code, Cursor, OpenCode, or local coding agents.

Pain:

1. Project instructions drift.
2. AGENTS.md and CLAUDE.md get stale.
3. Agent prompts over-include irrelevant context.
4. It is unclear whether generated briefs match current repo state.
5. Agent runs need final reports and boundaries.

Needs:

1. Target-specific export readiness.
2. Export snapshot hashes.
3. Governance metadata for coding agents.
4. Context bloat warnings.
5. Local activity history.
6. Pack and source hash changes.

### 9.3 Internal KB Owner

Maintains support docs, SOPs, product docs, or operating procedures.

Pain:

1. Employees and AI assistants use stale information.
2. Sensitive data can appear in answers or exports.
3. Governance is abstract and disconnected from actual workflows.
4. It is unclear which docs are AI-ready.

Needs:

1. Context Readiness dashboard.
2. Review queue tied to readiness.
3. Governance rules by pack and record.
4. Redaction previews.
5. Export history.
6. Local audit trail.

### 9.4 Consultant or Operator

Uses AI to support multiple clients, projects, systems, or handoffs.

Pain:

1. Client context must be separated.
2. Contractor exports must be redacted.
3. Project handoffs need evidence of what was shared.
4. Reused templates need confidence and safety controls.

Needs:

1. Redacted export history.
2. Output hashes.
3. Pack lineage.
4. Governance tags.
5. Contractor-safe readiness status.
6. Local diagnostics without uploading private content.

### 9.5 Security-Conscious Self-Hosted User

Uses Docker, local AI, homelab systems, local files, and private networks.

Pain:

1. Does not trust hidden telemetry.
2. Wants evidence of what happens locally.
3. Needs safe MCP defaults.
4. Wants raw file ownership.

Needs:

1. No automatic upload.
2. Local-only logs.
3. Configurable retention.
4. Audit-friendly event metadata.
5. Disable logging of raw bodies by default.
6. Export and MCP result size limits.

## 10. Core Product Objects Added

### 10.1 Context Readiness Report

A deterministic report generated for a pack, composition, export, or agent-facing brief.

It contains:

1. Pack ID.
2. Score.
3. Status.
4. Dimension scores.
5. Blocking issues.
6. Warning issues.
7. Suggested actions.
8. Export readiness summary.
9. Governance readiness summary.
10. Redaction readiness summary.
11. Local observability summary.
12. Token budget summary.
13. Generated timestamp, optional and excluded in deterministic test mode.

### 10.2 Readiness Dimension

A scored category inside a Context Readiness Report.

Initial dimensions:

1. Data quality.
2. Source coverage.
3. Freshness and review.
4. Governance.
5. Redaction and safety.
6. Export fit.
7. Local observability.
8. Token efficiency.
9. Benchmark evidence.

### 10.3 Local Evidence Event

A local event stored in SQLite or a local file-backed log.

It is app state, not pack source of truth.

### 10.4 Export Evidence Record

A local metadata record for generated exports.

It stores:

1. Pack ID.
2. Export profile ID.
3. Target.
4. Privacy mode.
5. Generated time.
6. Record count.
7. Source count.
8. Token estimate.
9. Redaction warning count.
10. Readiness status at generation time.
11. Output hash.
12. Optional output body if user explicitly enables export body history.

### 10.5 MCP Query Evidence Record

A local metadata record for read-only MCP usage.

It stores:

1. Tool name.
2. Pack ID.
3. Query hash.
4. Returned record IDs.
5. Redaction profile.
6. Result size.
7. Warnings count.
8. Timestamp.
9. Client label if configured.

It does not store raw query text by default.

### 10.6 Governance Rule

A structured rule defining how AI tools may use a pack, record, or export.

### 10.7 Token Budget Warning

A warning produced when export size, MCP response size, or Composer output exceeds target-specific limits.

### 10.8 Readiness Starter Pack

A starter pack that demonstrates governance, process-mapping, evaluation, source inventory, and observability planning for AI agents.

## 11. Pack Health vs Context Readiness

Pack Health remains the foundation.

Context Readiness sits above it.

| Area                          | Pack Health   | Context Readiness       |
| ----------------------------- | ------------- | ----------------------- |
| Schema validity               | Yes           | Uses Pack Health result |
| Source reference validity     | Yes           | Uses Pack Health result |
| Review status                 | Yes           | Uses Pack Health result |
| Stale source warnings         | Yes           | Uses Pack Health result |
| Redaction hits                | Yes           | Uses Pack Health result |
| Export profile validity       | Yes           | Uses Pack Health result |
| Agent governance              | No or limited | Yes                     |
| Target-specific fit           | Limited       | Yes                     |
| Local evidence logs           | No            | Yes                     |
| Token budget fit              | Limited       | Yes                     |
| Benchmark evidence            | No            | Yes                     |
| MCP exposure readiness        | Limited       | Yes                     |
| Decision authority boundaries | No            | Yes                     |

Summary:

```text
Pack Health is necessary but not sufficient.
Context Readiness means the pack is ready to support AI assistant or agent workflows under defined limits.
```

## 12. Context Readiness Scoring Model

### 12.1 Score range

```text
0 to 100
```

### 12.2 Status labels

```text
ready
ready_with_warnings
not_ready
blocked
unknown
```

### 12.3 Default dimension weights

| Dimension            | Weight |
| -------------------- | ------ |
| Data quality         | 15     |
| Source coverage      | 15     |
| Freshness and review | 15     |
| Governance           | 15     |
| Redaction and safety | 15     |
| Export fit           | 10     |
| Local observability  | 5      |
| Token efficiency     | 5      |
| Benchmark evidence   | 5      |
| Total                | 100    |

### 12.4 Data quality dimension

Measures whether records are structured, complete, and reliable.

Inputs:

1. Required record fields present.
2. Confidence values present.
3. Source status present.
4. Privacy classification present.
5. Record type valid.
6. Tags present where expected.
7. Body content not empty.
8. No duplicate record IDs.
9. No broken internal links.
10. No conflicting metadata states.

Scoring:

```text
Full points: all required fields present, no duplicate IDs, no empty approved records.
Partial points: warnings exist but pack can be used safely.
Zero points: critical schema or record issues block use.
```

### 12.5 Source coverage dimension

Measures whether approved context can be traced to sources.

Inputs:

1. Source map exists.
2. Record sources resolve.
3. Source license status exists.
4. Source trust level exists.
5. Source hash exists for local files where supported.
6. Source coverage percentage.
7. Unsupported source types.
8. Missing source references.

Suggested scoring:

```text
100 percent source coverage: full dimension score.
75 to 99 percent: minor warning.
50 to 74 percent: major warning.
Below 50 percent: not ready unless pack is explicitly manual or synthetic.
Broken source references: blocked if approved records depend on them.
```

### 12.6 Freshness and review dimension

Measures whether context has been reviewed recently enough to be trusted.

Inputs:

1. `lastReviewedAt` on pack.
2. `last_reviewed` on records.
3. Source `retrieved_at`.
4. Source `last_checked_at`.
5. Source `stale_after_days`.
6. Source `stale_reason`.
7. Review queue count.
8. Draft or unreviewed records.

Suggested scoring:

```text
Full points: no stale sources, no overdue records, no required review items.
Partial points: stale low-risk records or minor review warnings.
Zero points: high-risk stale records or unreviewed records included in export profile.
```

### 12.7 Governance dimension

Measures whether the pack has concrete agent-use boundaries.

Inputs:

1. Governance rule file exists.
2. Allowed targets declared.
3. Prohibited use cases declared.
4. Human-in-loop rules declared.
5. Decision authority declared.
6. Audience and sharing level declared.
7. Sensitive-use restrictions declared.
8. MCP exposure rules declared.

Suggested scoring:

```text
Full points: governance rules exist and match export profiles.
Partial points: pack has basic privacy metadata but no explicit agent governance.
Zero points: pack is exposed to agents without governance metadata and contains sensitive or internal records.
```

### 12.8 Redaction and safety dimension

Measures whether sensitive data and unsafe instructions are controlled.

Inputs:

1. Redaction rules exist.
2. Redaction patterns validated.
3. Secret scanner clear.
4. Shell command scanner clear.
5. No executable files.
6. No hidden network instructions.
7. Sensitive records excluded from redacted exports.
8. Redaction preview available.
9. Redaction hit count.
10. Unresolved redaction warnings.

Suggested scoring:

```text
Full points: no unresolved critical warnings, redaction rules exist and exports pass.
Partial points: warning hits exist but are acknowledged or excluded.
Zero points: secret patterns, shell patterns, executable content, or sensitive content in public-safe export.
```

### 12.9 Export fit dimension

Measures whether the pack can produce useful, target-specific output.

Inputs:

1. Export profiles exist.
2. Target-specific profiles validate.
3. Records included by profile are approved.
4. Privacy mode supported.
5. Source summary behavior defined.
6. Token estimate available.
7. Target-specific sections exist.
8. Export output deterministic.

Suggested scoring:

```text
Full points: primary target exports ready with no warnings.
Partial points: generic exports work but target-specific profiles are weak.
Zero points: no export profile or primary target export blocked.
```

### 12.10 Local observability dimension

Measures whether Contextarr can show evidence of use and changes.

Inputs:

1. Export history enabled.
2. MCP query metadata enabled.
3. Review activity events generated.
4. Redaction history recorded.
5. Source change events recorded.
6. Output hashes generated.
7. Retention policy configured.
8. Raw body logging disabled by default.

Suggested scoring:

```text
Full points: local evidence exists for exports, reviews, and MCP queries.
Partial points: only export evidence exists.
Zero points: no local evidence exists for agent-facing use.
```

### 12.11 Token efficiency dimension

Measures whether context is sized appropriately for target tools.

Inputs:

1. Token estimate.
2. Target budget.
3. Record count.
4. Source summary length.
5. Duplicated records.
6. Stale unused records.
7. Export bloat warnings.
8. MCP result size limit.

Suggested scoring:

```text
Full points: exports fit target budgets with useful context density.
Partial points: exports exceed soft budget but remain usable.
Zero points: export exceeds hard target limit or includes obvious redundant context.
```

### 12.12 Benchmark evidence dimension

Measures whether Contextarr output has been tested for task usefulness.

Inputs:

1. Benchmark task exists.
2. Expected facts file exists.
3. Scoring rubric exists.
4. Sample baseline exists.
5. Contextarr export sample exists.
6. Benchmark report exists.
7. Sensitive leakage checks pass.

Suggested scoring:

```text
Full points: benchmark report exists and passes required thresholds.
Partial points: benchmark fixture exists but report is missing.
Zero points: no benchmark evidence exists.
```

This dimension can remain low-weight in v0 and v1 so it does not block normal pack usage.

## 13. Blocking Conditions

A pack, composition, or export is `blocked` for agent use if any of these are true:

1. Pack validation fails.
2. Pack includes executable files.
3. Shell command pattern scanner has unresolved critical hits.
4. Credential or secret scanner has unresolved critical hits.
5. Export profile includes blocked records.
6. Export profile includes unreviewed AI drafts by default.
7. Redacted export includes records tagged `never_export`.
8. Governance file forbids the selected target.
9. Governance file requires human review and review is missing.
10. MCP access is requested for records marked `mcp_excluded`.
11. Source references are broken for required records.
12. Pack trust level is `blocked`.
13. Pack is revoked, later.
14. Export output exceeds configured hard token or size limit.

## 14. Warning Conditions

A pack, composition, or export is `ready_with_warnings` if any of these are true:

1. Low-risk stale source exists.
2. Missing benchmark evidence.
3. Missing explicit governance file for public-safe pack.
4. Redaction warn hit exists but no critical hit.
5. Token budget soft limit exceeded.
6. Source license unknown.
7. Source license risk exists but content is not redistributed.
8. Some records lack confidence metadata.
9. Pack has never been exported.
10. MCP query logging disabled.
11. Export history disabled.
12. Review cadence not configured.
13. Source hash missing for local files.

## 15. Governance Metadata Requirements

### 15.1 Governance file

Add optional file:

```text
rules/governance.yaml
```

This file is optional at first, then recommended for readiness scoring, then required for high-risk export profiles later.

### 15.2 Governance schema example

```yaml
schemaVersion: contextarr.governance.v1
packId: ai-workstation-pack
agentUse:
  allowed: true
  allowedTargets:
    - chatgpt
    - claude
    - codex
    - claude_code
    - read_only_mcp
  prohibitedTargets: []
  decisionAuthority: advisory_only
  humanInLoop: required_for_actions
  allowedUseCases:
    - troubleshooting
    - summarization
    - implementation_planning
    - documentation
  prohibitedUseCases:
    - credential_handling
    - production_change_without_review
    - financial_decision
    - legal_decision
    - medical_decision
  mcp:
    allowed: true
    rawSourceAccess: false
    approvedRecordsOnly: true
    maxResultTokens: 6000
  exports:
    defaultPrivacyMode: redacted
    requirePreviewBeforeCopy: true
    includeGovernanceNotice: true
  review:
    requiresHumanReviewBeforeAgentUse: true
    staleAfterDays: 60
```

### 15.3 Record-level governance frontmatter

Add optional record frontmatter fields:

```yaml
agent_policy:
  exposure: exportable
  decision_authority: reference_only
  requires_human_review_before_use: false
  mcp_access: allowed
  raw_source_access: denied
  prohibited_use_cases:
    - production_change
    - credential_handling
```

Allowed `exposure` values:

```text
exportable
redacted_only
internal_only
mcp_only
never_export
blocked
```

Allowed `decision_authority` values:

```text
reference_only
advisory_only
human_approval_required
not_for_decisions
```

Allowed `mcp_access` values:

```text
allowed
summary_only
denied
```

### 15.4 Export profile governance

Add optional export profile fields:

```yaml
governance:
  requireHumanReview: true
  decisionAuthority: advisory_only
  allowedAudience:
    - owner
    - internal_team
  maxPrivacyClass: internal
  includeGovernanceNotice: true
  blockIfReadinessBelow: 75
  blockIfCriticalWarnings: true
```

## 16. Local Observability Requirements

### 16.1 Principle

All observability is local by default.

No automatic upload.

No product analytics.

No remote telemetry.

No crash upload.

No hidden network calls.

### 16.2 Evidence logs are local app state

Local evidence logs are not source-of-truth pack content.

They are stored in SQLite or local log files under the user-controlled data directory.

Recommended path:

```text
./data/contextarr.db
./data/logs/
```

### 16.3 Raw body storage default

Do not store raw export bodies, raw record bodies, raw MCP queries, or raw MCP responses by default.

Store hashes, IDs, counts, statuses, warnings, and metadata.

Optional setting later:

```text
Store full export bodies: off by default
Store raw MCP query text: off by default
Store raw MCP response body: off by default
```

### 16.4 Retention defaults

Default retention:

| Event type                | Default retention  |
| ------------------------- | ------------------ |
| Export metadata           | 180 days           |
| MCP query metadata        | 30 days            |
| Review activity           | 365 days           |
| Redaction hit metadata    | 180 days           |
| Source change metadata    | 365 days           |
| Benchmark report metadata | Keep until deleted |
| Doctor diagnostics        | User-created only  |

Users can shorten retention.

Do not silently extend retention.

### 16.5 Event types

Initial event types:

```text
pack.rescanned
pack.validation_completed
pack.health_calculated
pack.readiness_calculated
source.changed
source.stale_detected
source.hash_changed
review.item_created
review.item_resolved
review.item_ignored
record.reviewed
record.approved
record.rejected
redaction.hit
redaction.previewed
export.previewed
export.generated
export.copied
export.downloaded
export.failed
mcp.server_started
mcp.tool_called
mcp.query_completed
mcp.query_blocked
benchmark.run_started
benchmark.run_completed
benchmark.run_failed
import.dry_run_completed
import.completed
backup.created
backup.restored
settings.changed
```

### 16.6 Event schema

```ts
interface LocalEvidenceEventV1 {
  schemaVersion: "contextarr.local-evidence-event.v1";
  id: string;
  eventType: string;
  objectType:
    | "pack"
    | "record"
    | "source"
    | "export_profile"
    | "export"
    | "mcp_query"
    | "review_item"
    | "benchmark"
    | "import_session"
    | "system";
  objectId?: string;
  packId?: string;
  recordId?: string;
  sourceId?: string;
  exportProfileId?: string;
  actorType: "user" | "system" | "cli" | "api" | "mcp_client";
  actorLabel?: string;
  createdAt: string;
  privacyClass: "public_safe" | "internal" | "sensitive_metadata";
  summary: string;
  metadata: Record<string, unknown>;
  bodyStored: false;
  bodyHash?: string;
}
```

### 16.7 Export evidence schema

```ts
interface ExportEvidenceV1 {
  schemaVersion: "contextarr.export-evidence.v1";
  id: string;
  packId: string;
  compositionId?: string;
  exportProfileId: string;
  target: string;
  privacyMode: "full" | "redacted" | "public_safe" | "custom";
  generatedAt: string;
  generatedBy: "ui" | "cli" | "api" | "mcp";
  recordCount: number;
  sourceCount: number;
  estimatedTokens?: number;
  outputBytes?: number;
  outputHashAlgorithm: "sha256";
  outputHash: string;
  readinessStatus: "ready" | "ready_with_warnings" | "not_ready" | "blocked" | "unknown";
  packHealthStatus: string;
  redactionWarningCount: number;
  criticalWarningCount: number;
  warningCodes: string[];
  bodyStored: boolean;
}
```

### 16.8 MCP query evidence schema

```ts
interface McpQueryEvidenceV1 {
  schemaVersion: "contextarr.mcp-query-evidence.v1";
  id: string;
  toolName: string;
  clientLabel?: string;
  packId?: string;
  queryHashAlgorithm?: "sha256";
  queryHash?: string;
  rawQueryStored: false;
  returnedRecordIds: string[];
  returnedSourceIds: string[];
  redactionMode: string;
  resultBytes: number;
  estimatedResultTokens?: number;
  warningCodes: string[];
  blocked: boolean;
  blockReason?: string;
  createdAt: string;
}
```

## 17. Database Additions

SQLite remains derived and rebuildable where possible.

Evidence logs are local app state, not source-of-truth pack content.

### 17.1 New tables

```text
context_readiness_reports
local_evidence_events
export_evidence
mcp_query_evidence
governance_rules
readiness_dimension_scores
token_budget_warnings
benchmark_evidence
```

### 17.2 `context_readiness_reports`

Fields:

```text
id TEXT PRIMARY KEY
pack_id TEXT NOT NULL
schema_version TEXT NOT NULL
score INTEGER NOT NULL
status TEXT NOT NULL
generated_at TEXT NOT NULL
data_quality_score INTEGER NOT NULL
source_coverage_score INTEGER NOT NULL
freshness_review_score INTEGER NOT NULL
governance_score INTEGER NOT NULL
redaction_safety_score INTEGER NOT NULL
export_fit_score INTEGER NOT NULL
local_observability_score INTEGER NOT NULL
token_efficiency_score INTEGER NOT NULL
benchmark_evidence_score INTEGER NOT NULL
blocking_issue_count INTEGER NOT NULL DEFAULT 0
warning_issue_count INTEGER NOT NULL DEFAULT 0
critical_warning_count INTEGER NOT NULL DEFAULT 0
report_json TEXT NOT NULL
```

### 17.3 `local_evidence_events`

Fields:

```text
id TEXT PRIMARY KEY
schema_version TEXT NOT NULL
event_type TEXT NOT NULL
object_type TEXT NOT NULL
object_id TEXT
pack_id TEXT
record_id TEXT
source_id TEXT
export_profile_id TEXT
actor_type TEXT NOT NULL
actor_label TEXT
created_at TEXT NOT NULL
privacy_class TEXT NOT NULL
summary TEXT NOT NULL
metadata_json TEXT NOT NULL
body_stored INTEGER NOT NULL DEFAULT 0
body_hash TEXT
```

### 17.4 `export_evidence`

Fields:

```text
id TEXT PRIMARY KEY
schema_version TEXT NOT NULL
pack_id TEXT NOT NULL
composition_id TEXT
export_profile_id TEXT NOT NULL
target TEXT NOT NULL
privacy_mode TEXT NOT NULL
generated_at TEXT NOT NULL
generated_by TEXT NOT NULL
record_count INTEGER NOT NULL
source_count INTEGER NOT NULL
estimated_tokens INTEGER
output_bytes INTEGER
output_hash_algorithm TEXT NOT NULL
output_hash TEXT NOT NULL
readiness_status TEXT NOT NULL
pack_health_status TEXT NOT NULL
redaction_warning_count INTEGER NOT NULL DEFAULT 0
critical_warning_count INTEGER NOT NULL DEFAULT 0
warning_codes_json TEXT NOT NULL
body_stored INTEGER NOT NULL DEFAULT 0
```

### 17.5 `mcp_query_evidence`

Fields:

```text
id TEXT PRIMARY KEY
schema_version TEXT NOT NULL
tool_name TEXT NOT NULL
client_label TEXT
pack_id TEXT
query_hash_algorithm TEXT
query_hash TEXT
raw_query_stored INTEGER NOT NULL DEFAULT 0
returned_record_ids_json TEXT NOT NULL
returned_source_ids_json TEXT NOT NULL
redaction_mode TEXT NOT NULL
result_bytes INTEGER NOT NULL
estimated_result_tokens INTEGER
warning_codes_json TEXT NOT NULL
blocked INTEGER NOT NULL DEFAULT 0
block_reason TEXT
created_at TEXT NOT NULL
```

### 17.6 `governance_rules`

Fields:

```text
pack_id TEXT PRIMARY KEY
schema_version TEXT NOT NULL
rules_path TEXT NOT NULL
agent_use_allowed INTEGER NOT NULL DEFAULT 0
allowed_targets_json TEXT NOT NULL
prohibited_targets_json TEXT NOT NULL
decision_authority TEXT NOT NULL
human_in_loop TEXT NOT NULL
allowed_use_cases_json TEXT NOT NULL
prohibited_use_cases_json TEXT NOT NULL
mcp_allowed INTEGER NOT NULL DEFAULT 0
raw_source_access INTEGER NOT NULL DEFAULT 0
approved_records_only INTEGER NOT NULL DEFAULT 1
max_result_tokens INTEGER
review_required INTEGER NOT NULL DEFAULT 0
```

### 17.7 Existing table additions

Add to `packs`:

```text
context_readiness_score INTEGER
context_readiness_status TEXT
governance_status TEXT
observability_status TEXT
last_readiness_calculated_at TEXT
export_evidence_count INTEGER NOT NULL DEFAULT 0
mcp_query_count INTEGER NOT NULL DEFAULT 0
last_exported_at TEXT
last_mcp_queried_at TEXT
```

Add to `export_profiles`:

```text
block_if_readiness_below INTEGER
include_governance_notice INTEGER NOT NULL DEFAULT 0
token_soft_limit INTEGER
token_hard_limit INTEGER
```

Add to `review_items`:

```text
readiness_dimension TEXT
blocks_agent_use INTEGER NOT NULL DEFAULT 0
```

## 18. API Requirements

### 18.1 `GET /api/packs/:id/readiness`

Returns latest Context Readiness Report.

Response:

```ts
{
  packId: string;
  score: number;
  status: "ready" | "ready_with_warnings" | "not_ready" | "blocked" | "unknown";
  generatedAt: string;
  dimensions: Array<{
    id: string;
    name: string;
    score: number;
    weight: number;
    status: string;
    issueCodes: string[];
    suggestedActions: string[];
  }>;
  blockers: Array<{
    code: string;
    message: string;
    objectType?: string;
    objectId?: string;
  }>;
  warnings: Array<{
    code: string;
    message: string;
    objectType?: string;
    objectId?: string;
  }>;
  summary: {
    packHealthStatus: string;
    exportReadiness: string;
    governanceStatus: string;
    observabilityStatus: string;
    tokenEfficiencyStatus: string;
    benchmarkEvidenceStatus: string;
  };
}
```

### 18.2 `POST /api/packs/:id/readiness/recalculate`

Recalculates readiness from current indexed state.

Rules:

1. Does not mutate pack files.
2. Writes derived readiness report to SQLite.
3. Creates `pack.readiness_calculated` local evidence event.
4. Returns report.

### 18.3 `GET /api/readiness`

Returns readiness summaries for all indexed packs.

Query parameters:

```text
status
minScore
target
privacyMode
hasBlockers
hasWarnings
```

### 18.4 `GET /api/events`

Returns local evidence events.

Query parameters:

```text
packId
eventType
objectType
from
to
limit
cursor
```

Default behavior:

1. Return metadata only.
2. No raw bodies.
3. Sort newest first.
4. Limit default 50.

### 18.5 `GET /api/exports/history`

Returns export evidence records.

Query parameters:

```text
packId
target
privacyMode
from
to
limit
cursor
```

### 18.6 `GET /api/mcp/query-log`

Returns MCP query evidence records.

Query parameters:

```text
packId
toolName
clientLabel
blocked
from
to
limit
cursor
```

### 18.7 `GET /api/governance/:packId`

Returns parsed governance rules and readiness status.

### 18.8 `GET /api/token-budget/:packId`

Returns token budget warnings for export profiles and latest exports.

### 18.9 API hard boundaries

1. No endpoint uploads telemetry.
2. No endpoint sends data outside local server.
3. No endpoint executes pack content.
4. No endpoint mutates pack source files except existing explicitly scoped local write flows such as import drafts, review state, or backups.
5. No endpoint exposes raw MCP query text unless user explicitly enabled raw query storage.

## 19. CLI Requirements

### 19.1 Readiness command

```text
contextarr readiness <pack-id>
contextarr readiness <pack-id> --json
contextarr readiness <pack-id> --agent
contextarr readiness ./demo-packs/ai-workstation-pack --json
```

Behavior:

1. Calculates or retrieves Context Readiness Report.
2. `--json` returns deterministic JSON when possible.
3. `--agent` implies JSON, no color, no progress animations, approved content only.

### 19.2 Readiness explain command

```text
contextarr readiness explain <pack-id>
contextarr readiness explain <pack-id> --dimension governance
contextarr readiness explain <pack-id> --issue governance.missing
```

### 19.3 Governance command

```text
contextarr governance validate <pack-path>
contextarr governance show <pack-id>
contextarr governance init <pack-path>
```

Rules:

1. `init` creates a safe template only.
2. No governance command enables execution.
3. Governance validates against schema and pack metadata.

### 19.4 Events command

```text
contextarr events list --pack <pack-id>
contextarr events list --event export.generated --json
contextarr events prune --older-than 180d --dry-run
contextarr events prune --older-than 180d --yes
```

### 19.5 Export history command

```text
contextarr export history --pack <pack-id>
contextarr export history --target codex --json
contextarr export show <export-id> --metadata
```

Default:

1. Show metadata only.
2. Do not show export body unless body storage was enabled.

### 19.6 MCP log command

```text
contextarr mcp log --pack <pack-id>
contextarr mcp log --blocked
contextarr mcp log --json
```

### 19.7 Token budget command

```text
contextarr token-budget <pack-id>
contextarr token-budget <pack-id> --target claude
contextarr token-budget <pack-id> --profile codex-implementation-brief
```

### 19.8 Benchmark readiness command

```text
contextarr benchmark readiness <pack-id>
contextarr benchmark readiness <pack-id> --json
```

This command summarizes whether benchmark evidence exists for the pack.

### 19.9 Agent mode rules

`--agent` means:

1. JSON output by default.
2. Deterministic field ordering where practical.
3. Stable exit codes.
4. No progress animations.
5. No color.
6. No raw private bodies.
7. Redacted output by default.
8. Approved content only.
9. Bounded output size.
10. Machine-readable error codes.

## 20. UI Requirements

### 20.1 Pack Library additions

Add these fields to pack cards and dense table when data exists:

```text
Readiness score
Readiness status
Governance status
Last exported
Last MCP queried
Token warning count
```

Do not make the card visually noisy. Show readiness as a compact badge or score.

### 20.2 Pack Detail additions

Add a new tab:

```text
Readiness
```

Optional later tab:

```text
Activity
```

Pack Detail Readiness tab should show:

1. Overall Context Readiness score.
2. Status label.
3. Dimension score breakdown.
4. Blockers.
5. Warnings.
6. Suggested actions.
7. Governance summary.
8. Export readiness summary.
9. Token budget summary.
10. Observability summary.
11. Benchmark evidence summary.
12. Recalculate button.

### 20.3 Health page additions

Add cross-pack readiness view:

1. Packs blocked for agent use.
2. Packs ready with warnings.
3. Packs missing governance.
4. Packs with stale agent-facing records.
5. Packs with redaction warnings.
6. Packs with export bloat warnings.
7. Packs without benchmark evidence.

### 20.4 Local Activity page

Add page:

```text
Activity
```

Or add under System if navigation should remain smaller.

Activity page filters:

1. Pack.
2. Event type.
3. Object type.
4. Date range.
5. Actor type.
6. Warning status.

Default event cards:

1. Export generated.
2. MCP query completed.
3. Review item created.
4. Source changed.
5. Readiness calculated.
6. Redaction hit.
7. Benchmark completed.

### 20.5 Export History UI

Add under Exports page:

1. Export history table.
2. Pack.
3. Target.
4. Privacy mode.
5. Generated time.
6. Token estimate.
7. Output hash.
8. Readiness status at generation time.
9. Redaction warning count.
10. View metadata.
11. Rebuild export from current pack, if profile still exists.

Do not store or show full export body by default.

### 20.6 MCP Query Log UI

Add under MCP settings or Activity page:

1. Tool called.
2. Pack queried.
3. Returned records count.
4. Redaction mode.
5. Result size.
6. Warning count.
7. Blocked status.
8. Client label.
9. Timestamp.

Do not show raw query text by default.

### 20.7 Governance UI

Add Governance card on Pack Detail Overview.

Show:

1. Agent use allowed or denied.
2. Allowed targets.
3. Decision authority.
4. Human-in-loop rule.
5. MCP access rule.
6. Raw source access status.
7. Prohibited use cases.
8. Missing governance warnings.

### 20.8 Token budget UI

Add token budget preview on:

1. Export preview.
2. Composer.
3. Pack readiness tab.
4. MCP result settings.

Warnings:

```text
Soft budget exceeded
Hard budget exceeded
Large source summary
Duplicate context detected
Stale records included
High private context ratio
```

### 20.9 Settings UI

Add Local Observability settings:

1. Enable export metadata history, on by default.
2. Enable MCP query metadata, on by default once MCP is enabled.
3. Store full export bodies, off by default.
4. Store raw MCP query text, off by default.
5. Store raw MCP response body, off by default.
6. Retention periods.
7. Prune now.
8. Export local evidence bundle.
9. Redact evidence bundle.

## 21. Export and Composer Requirements

### 21.1 Export preflight

Before generating an export, Contextarr should run an export preflight.

Preflight checks:

1. Pack validation status.
2. Pack Health status.
3. Context Readiness status.
4. Governance target allowlist.
5. Human review requirement.
6. Redaction warnings.
7. Sensitive tag inclusion.
8. Token budget.
9. Draft or blocked record inclusion.
10. Source freshness.
11. Export profile validity.

### 21.2 Export blocking behavior

Block export by default when:

1. Critical safety issue exists.
2. Governance forbids target.
3. Redaction profile fails in redacted mode.
4. Export includes `never_export` records.
5. Export includes unapproved AI draft records.
6. Token hard limit exceeded.
7. Pack trust level is `blocked`.

Allow override only for local owner in explicit full-context mode, later, and never for critical executable or credential issues.

### 21.3 Export evidence creation

Every generated export creates export evidence metadata.

Evidence should include:

1. Export ID.
2. Output hash.
3. Target.
4. Privacy mode.
5. Readiness status at generation time.
6. Warning codes.
7. Record count.
8. Source count.
9. Token estimate.

### 21.4 Composer readiness preview

Composer should show:

1. Combined readiness score for selected records.
2. Governance conflicts.
3. Redaction warnings.
4. Token budget warnings.
5. Draft or blocked records excluded by default.
6. Export target compatibility.
7. Source coverage summary.
8. Freshness summary.

### 21.5 Export governance notice

If `includeGovernanceNotice` is true, exports include a compact notice:

```text
Governance Notice
This brief is advisory context only. It is generated from approved records in Contextarr. Do not treat it as permission to execute changes, handle credentials, make financial decisions, or bypass human review.
```

Target-specific profiles may customize this.

## 22. MCP Requirements

### 22.1 MCP remains read-only

MCP remains read-only in v0 and v1.

No mutation.

No shell execution.

No network calls.

No agent actions.

No raw private source dump by default.

### 22.2 MCP readiness-aware behavior

MCP tools should check readiness before returning context.

Default behavior:

1. Return approved content only.
2. Apply redaction settings.
3. Respect governance rules.
4. Respect result size limits.
5. Include warning metadata.
6. Create MCP query evidence metadata.

### 22.3 Future MCP tools

Add later:

```text
get_pack_readiness
get_governance_summary
get_context_evidence_summary
```

These tools are read-only.

### 22.4 `get_pack_readiness`

Input:

```ts
{
  packId: string;
}
```

Output:

```ts
{
  packId: string;
  readinessScore: number;
  readinessStatus: string;
  blockers: string[];
  warnings: string[];
  allowedTargets: string[];
  decisionAuthority: string;
  humanInLoop: string;
}
```

### 22.5 `get_governance_summary`

Input:

```ts
{
  packId: string;
}
```

Output:

```ts
{
  packId: string;
  agentUseAllowed: boolean;
  allowedTargets: string[];
  prohibitedUseCases: string[];
  decisionAuthority: string;
  humanInLoop: string;
  mcpRawSourceAccess: boolean;
}
```

### 22.6 MCP logging privacy

Do not log raw query text by default.

Do not log raw response body by default.

Store query hash, returned IDs, result size, and warning codes.

## 23. Security and Privacy Requirements

### 23.1 Local-only observability

All observability remains local unless the user manually exports a diagnostics bundle.

### 23.2 No product telemetry

Contextarr must not automatically collect or transmit usage analytics.

### 23.3 No hidden network calls

Readiness calculation, evidence logging, governance validation, and token estimates must not call external services.

### 23.4 Diagnostics bundle rules

If a diagnostics bundle includes evidence logs:

1. Redact pack IDs if configured.
2. Mask file paths if configured.
3. Exclude raw record bodies by default.
4. Exclude export bodies by default.
5. Exclude raw MCP queries by default.
6. Include warning counts and issue codes.
7. Require explicit user action to save or share.

### 23.5 High-risk data rules

Readiness should warn or block exports involving:

1. Credentials.
2. API keys.
3. Health records.
4. Financial records.
5. Child data.
6. Legal documents.
7. Customer private data.
8. Security incident details.
9. Home address or precise location.
10. Raw personal journal content.

### 23.6 Governance for high-risk data

If a pack contains sensitive categories, governance metadata should be required for `ready` status.

Without governance, status should be `ready_with_warnings` or `not_ready` depending severity.

## 24. Token Budget and Cost Awareness

### 24.1 Purpose

Agentic AI can make context usage expensive.

Contextarr should help users avoid dumping too much context into every AI tool.

### 24.2 Token budget fields

Export profiles may include:

```yaml
token_budget:
  soft_limit: 12000
  hard_limit: 20000
  estimate_method: heuristic
  warn_on_duplicate_sections: true
  warn_on_stale_records: true
```

### 24.3 Token budget warning codes

```text
token.soft_limit_exceeded
token.hard_limit_exceeded
token.duplicate_context_detected
token.stale_records_included
token.source_summary_too_large
token.private_context_ratio_high
token.target_budget_missing
```

### 24.4 Token efficiency reports

Token report should show:

1. Estimated tokens.
2. Target budget.
3. Record count.
4. Source count.
5. Largest records.
6. Largest sections.
7. Excluded records.
8. Redacted token estimate.
9. Suggested cuts.

### 24.5 Cost language

Do not show CAD or USD cost estimates unless model pricing is configured or manually entered by the user.

Default to token and size warnings.

## 25. Agentic AI Readiness Starter Pack

### 25.1 Purpose

Create a starter Context Pack that helps users or teams document whether they are ready to use AI agents safely and effectively.

This starter pack is not a report mirror.

It is a fake or public-safe example of how Contextarr structures agent-readiness context.

### 25.2 Pack ID

```text
agentic-ai-readiness-pack
```

### 25.3 Name

```text
Agentic AI Readiness Pack
```

### 25.4 Type

```text
agentic_ai_readiness
```

### 25.5 Good demo story

```text
Before giving agents access to important context, build a readiness pack that defines strategy, data sources, governance, redaction rules, evaluation criteria, and local observability expectations.
```

### 25.6 Suggested manifest metadata

```json
{
  "id": "agentic-ai-readiness-pack",
  "name": "Agentic AI Readiness Pack",
  "version": "1.0.0",
  "description": "A fake public-safe starter pack for planning agentic AI context readiness, governance, evaluation, and local observability.",
  "type": "agentic_ai_readiness",
  "visibility": "local",
  "trustLevel": "curated",
  "containsPersonalData": false,
  "containsExecutableCode": false,
  "requiresNetwork": false,
  "assets": {
    "brandId": "contextarr",
    "accentColor": "#14b8a6",
    "coverRecipe": "generated_v1"
  },
  "starterPack": true,
  "starterCategory": "agentic_ai",
  "starterSortOrder": 13
}
```

### 25.7 Records

```text
strategy-and-goals.md
agent-use-cases.md
data-source-inventory.md
context-readiness-model.md
governance-boundaries.md
human-in-loop-policy.md
privacy-and-redaction-rules.md
observability-plan.md
cost-and-token-budget.md
evaluation-and-benchmark-plan.md
risk-register.md
implementation-roadmap.md
```

### 25.8 Record details

| Record                           | Purpose                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| strategy-and-goals.md            | Defines why agents are being considered and what outcomes matter.                        |
| agent-use-cases.md               | Lists candidate use cases and excludes high-risk use cases.                              |
| data-source-inventory.md         | Lists fake source categories and readiness state.                                        |
| context-readiness-model.md       | Defines readiness scoring dimensions.                                                    |
| governance-boundaries.md         | Defines target, use-case, and decision-authority limits.                                 |
| human-in-loop-policy.md          | Defines when humans must review or approve outputs.                                      |
| privacy-and-redaction-rules.md   | Defines privacy classes and redaction expectations.                                      |
| observability-plan.md            | Defines local evidence logs and review reporting.                                        |
| cost-and-token-budget.md         | Defines token limits and context bloat controls.                                         |
| evaluation-and-benchmark-plan.md | Defines benchmark task types and success criteria.                                       |
| risk-register.md                 | Tracks prompt injection, stale context, leakage, over-export, and false authority risks. |
| implementation-roadmap.md        | Shows how to move from context audit to safe agent use.                                  |

### 25.9 Sources

```text
synthetic-agentic-ai-readiness-note
manual-governance-template
manual-context-quality-template
manual-observability-template
public-safe-evaluation-template
```

### 25.10 Export profiles

```text
chatgpt-readiness-brief
claude-readiness-review
codex-implementation-brief
generic-markdown
json-records
agents-md
claude-md
llms-txt
```

### 25.11 Redaction focus

```text
real system names
private project names
employee names
customer names
internal URLs
security incident details
credentials
cost data
vendor contracts
```

### 25.12 Safety boundaries

1. No real company data.
2. No copied third-party report text.
3. No executable content.
4. No shell commands.
5. No live connectors.
6. No policy claims that imply legal advice.
7. No automatic governance decisions.
8. No public marketplace listing.

## 26. Context Quality Benchmark Integration

### 26.1 Readiness benchmark types

Add benchmark tasks for:

1. Agentic AI readiness review.
2. Governance gap analysis.
3. Redacted contractor brief.
4. Codex implementation prompt.
5. Support KB answer.
6. Homelab troubleshooting.
7. Data source inventory summary.
8. Sensitive leakage detection.

### 26.2 Readiness benchmark scoring

Scoring dimensions:

1. Grounding accuracy.
2. Governance boundary recognition.
3. Sensitive leakage avoidance.
4. Stale source handling.
5. Output structure.
6. Actionability.
7. Token efficiency.
8. Human-in-loop clarity.

### 26.3 Benchmark gates

Release gate should fail if:

1. Redacted export leaks sensitive fake data.
2. Benchmark output claims authority to act.
3. Output ignores governance boundaries.
4. Output uses stale records without warning.
5. Contextarr export performs worse than manual baseline in all sample tasks.

## 27. Readiness Report Schema

```ts
interface ContextReadinessReportV1 {
  schemaVersion: "contextarr.context-readiness-report.v1";
  packId: string;
  packVersion?: string;
  generatedAt?: string;
  score: number;
  status: "ready" | "ready_with_warnings" | "not_ready" | "blocked" | "unknown";
  dimensions: Array<{
    id:
      | "data_quality"
      | "source_coverage"
      | "freshness_review"
      | "governance"
      | "redaction_safety"
      | "export_fit"
      | "local_observability"
      | "token_efficiency"
      | "benchmark_evidence";
    label: string;
    score: number;
    weight: number;
    status: "passing" | "warning" | "failing" | "blocked" | "unknown";
    issueCodes: string[];
    suggestedActions: string[];
  }>;
  blockers: Array<{
    code: string;
    severity: "critical";
    message: string;
    objectType?: string;
    objectId?: string;
    suggestedAction?: string;
  }>;
  warnings: Array<{
    code: string;
    severity: "warning";
    message: string;
    objectType?: string;
    objectId?: string;
    suggestedAction?: string;
  }>;
  summary: {
    packHealthStatus: string;
    validationStatus: string;
    exportReadiness: string;
    governanceStatus: string;
    observabilityStatus: string;
    tokenEfficiencyStatus: string;
    benchmarkEvidenceStatus: string;
    redactionWarningCount: number;
    staleSourceCount: number;
    reviewItemCount: number;
    criticalIssueCount: number;
  };
}
```

## 28. Readiness Issue Codes

### 28.1 Governance issue codes

```text
governance.missing
governance.invalid
governance.target_not_allowed
governance.human_review_required
governance.decision_authority_missing
governance.prohibited_use_case
governance.raw_source_access_blocked
governance.mcp_not_allowed
governance.sensitive_pack_requires_rules
```

### 28.2 Observability issue codes

```text
observability.export_history_disabled
observability.mcp_log_disabled
observability.no_export_evidence
observability.no_review_activity
observability.raw_body_logging_enabled_warning
observability.retention_not_configured
observability.output_hash_missing
```

### 28.3 Token issue codes

```text
token.soft_limit_exceeded
token.hard_limit_exceeded
token.duplicate_context_detected
token.target_budget_missing
token.stale_records_included
token.source_summary_too_large
```

### 28.4 Benchmark issue codes

```text
benchmark.missing
benchmark.fixture_missing
benchmark.report_missing
benchmark.sensitive_leakage_failed
benchmark.governance_boundary_failed
benchmark.contextarr_export_underperformed
```

### 28.5 Readiness issue codes

```text
readiness.blocked_by_validation
readiness.blocked_by_safety
readiness.blocked_by_redaction
readiness.blocked_by_governance
readiness.not_enough_source_coverage
readiness.review_overdue
readiness.mcp_not_ready
readiness.export_not_ready
```

## 29. Implementation Phase Plan

Use prefix `AR` for Agentic Readiness phases.

These phases are additive. Do not skip the core Context Pack phases.

## AR0: PRD Addition and Decision Record

### Placement

Immediately, as a docs-only planning pass.

### Goal

Add this PRD addition and a decision record to the repo.

### Build

Create:

```text
docs/prd-additions/agentic-ai-context-readiness-local-observability.md
docs/decision-records/decision-agentic-ai-context-readiness.md
```

Update if appropriate:

```text
docs/roadmap-phases.md
docs/non-goals.md
docs/security-model.md
docs/architecture.md
README.md
AGENTS.md
```

### Acceptance criteria

1. This PRD is added.
2. Decision record states local observability is not product telemetry.
3. Non-goals block cloud telemetry, agent runtime, and hidden network calls.
4. No functionality is implemented.
5. No schemas are changed.
6. No UI is added.
7. No external services are added.

### Hard boundaries

1. Docs only.
2. No implementation.
3. No telemetry.
4. No agent runner.
5. No MCP changes.
6. No marketplace.
7. No cloud.

## AR1: Readiness and Governance Schema Design

### Placement

After Phase 1 Pack Schema and Validator, or as a small schema follow-up.

### Goal

Define schemas for Context Readiness Reports and governance rules.

### Build

Add schemas for:

```text
ContextReadinessReportV1
GovernanceRulesV1
TokenBudgetRulesV1
ReadinessIssueCode
```

Files likely changed:

```text
packages/schema/src/readiness.ts
packages/schema/src/governance.ts
packages/schema/src/token-budget.ts
packages/schema/src/index.ts
packages/schema/src/**/*.test.ts
docs/context-readiness-schema.md
docs/governance-rules.md
```

### Acceptance criteria

1. Readiness report schema validates.
2. Governance rules schema validates.
3. Token budget schema validates.
4. Invalid governance targets fail.
5. Invalid decision authority fails.
6. Existing packs remain valid without governance file.
7. No readiness engine is implemented yet unless explicitly scoped.

### Hard boundaries

1. Additive schema only.
2. No UI.
3. No MCP changes.
4. No cloud telemetry.
5. No agent execution.

## AR2: Local Evidence Event Schema and Storage

### Placement

After Phase 3 Local Index and API.

### Goal

Create local evidence tables and event writing helpers.

### Build

Add:

```text
local_evidence_events
export_evidence
mcp_query_evidence
```

Add event writer service:

```text
apps/server/src/events/local-evidence.ts
apps/server/src/events/export-evidence.ts
apps/server/src/events/mcp-query-evidence.ts
```

Add docs:

```text
docs/local-observability.md
docs/evidence-events.md
```

### Acceptance criteria

1. Tables are created.
2. Event writer validates event shape.
3. No raw bodies stored by default.
4. Retention settings exist or are documented as future.
5. Unit tests prove metadata-only logging.
6. Deleting pack DB and rebuilding preserves pack index but does not pretend app event logs are source-of-truth pack content.

### Hard boundaries

1. No external logging service.
2. No automatic upload.
3. No product analytics.
4. No raw body logging by default.

## AR3: Context Readiness Engine v0

### Placement

After Phase 7 Pack Health and Review Queue.

### Goal

Calculate Context Readiness from existing validation, health, source, redaction, export, governance, and event metadata.

### Build

Add:

```text
apps/server/src/readiness/readiness-engine.ts
apps/server/src/readiness/dimensions.ts
apps/server/src/readiness/issue-codes.ts
apps/server/src/readiness/readiness-engine.test.ts
```

### Acceptance criteria

1. Readiness score is deterministic.
2. Blocking conditions work.
3. Warnings are explainable.
4. Score uses Pack Health but does not replace it.
5. Missing governance warns, not blocks, for public-safe demo packs.
6. Critical safety issues block readiness.
7. Tests cover ready, ready\_with\_warnings, not\_ready, and blocked states.

### Hard boundaries

1. No AI calls.
2. No external services.
3. No hidden network checks.
4. No agent execution.

## AR4: Readiness API

### Placement

After AR3.

### Goal

Expose Context Readiness through local API.

### Build

Endpoints:

```text
GET /api/packs/:id/readiness
POST /api/packs/:id/readiness/recalculate
GET /api/readiness
```

Files:

```text
apps/server/src/api/readiness-routes.ts
apps/server/src/api.ts
apps/server/src/api/readiness-routes.test.ts
```

### Acceptance criteria

1. API returns readiness report.
2. Recalculate endpoint does not mutate pack source files.
3. Recalculate writes local evidence event.
4. List endpoint supports filters.
5. Invalid pack returns useful error.
6. Tests pass.

## AR5: Governance Rules Integration

### Placement

After AR1 and AR3, before export and MCP hardening.

### Goal

Parse and enforce `rules/governance.yaml` in readiness and export preflight.

### Build

Add:

```text
apps/server/src/governance/governance-loader.ts
apps/server/src/governance/governance-validator.ts
apps/server/src/governance/governance-loader.test.ts
```

### Acceptance criteria

1. Governance file loads from pack folder.
2. Missing governance generates readiness warning where appropriate.
3. Invalid governance file generates validation issue.
4. Target allowlist affects export preflight.
5. MCP raw source rules are visible but not yet enforced unless MCP exists.

### Hard boundaries

1. Governance describes boundaries only.
2. Governance does not grant execution authority.
3. Governance does not call external policy systems.

## AR6: Export Evidence and Token Budget Integration

### Placement

After Phase 8 Export Engine.

### Goal

Record export metadata and show token budget warnings.

### Build

Add:

```text
apps/server/src/exports/export-evidence.ts
apps/server/src/exports/token-budget.ts
apps/server/src/exports/export-preflight.ts
apps/server/src/exports/**/*.test.ts
```

API:

```text
GET /api/exports/history
GET /api/token-budget/:packId
```

### Acceptance criteria

1. Every generated export creates metadata evidence.
2. Output hash is generated.
3. Token estimate stored when available.
4. Redaction warning count stored.
5. Readiness status at export time stored.
6. Export body not stored by default.
7. Soft and hard token warnings work.
8. Export preflight can block on governance and critical warnings.

## AR7: MCP Query Evidence Integration

### Placement

After Phase 9 Read-Only MCP.

### Goal

Record local metadata for MCP queries and enforce readiness-aware guardrails.

### Build

Add:

```text
apps/server/src/mcp/mcp-evidence.ts
apps/server/src/mcp/mcp-readiness.ts
apps/server/src/mcp/**/*.test.ts
```

API:

```text
GET /api/mcp/query-log
```

Optional future MCP tools:

```text
get_pack_readiness
get_governance_summary
```

### Acceptance criteria

1. MCP query metadata is recorded.
2. Raw query text is not stored by default.
3. Returned record IDs are stored.
4. Result size is stored.
5. Blocked MCP requests produce evidence records.
6. Governance raw source access is respected.
7. Readiness warnings can be included in MCP output.
8. MCP remains read-only.

## AR8: Readiness UI

### Placement

After Phase 4 and Phase 5 dashboard and pack detail pages, and after AR3 readiness engine.

### Goal

Show Context Readiness in the local web UI.

### Build

Add:

```text
apps/web/src/pages/ReadinessPage.tsx
apps/web/src/components/readiness/**
apps/web/src/pages/PackDetailPage.tsx updates
```

### Acceptance criteria

1. Pack cards can show readiness status.
2. Pack detail has Readiness tab.
3. Readiness dimension breakdown is visible.
4. Blockers and warnings are actionable.
5. Governance summary is visible.
6. Token budget summary is visible.
7. No telemetry settings imply cloud upload.

## AR9: Local Activity UI

### Placement

After AR2 and after web dashboard exists.

### Goal

Show local evidence events in UI.

### Build

Add:

```text
apps/web/src/pages/ActivityPage.tsx
apps/web/src/components/activity/**
apps/web/src/components/exports/ExportHistoryTable.tsx
apps/web/src/components/mcp/McpQueryLogTable.tsx
```

### Acceptance criteria

1. Activity list loads events.
2. Filters work.
3. Export history table works.
4. MCP query log table works if MCP exists.
5. Raw bodies are not displayed by default.
6. Retention settings are visible.

## AR10: CLI Commands

### Placement

After AR3, AR6, and AR7 as relevant.

### Goal

Expose readiness, governance, events, export history, and token budgets via CLI.

### Build

Commands:

```text
contextarr readiness
contextarr readiness explain
contextarr governance validate
contextarr governance show
contextarr events list
contextarr export history
contextarr mcp log
contextarr token-budget
```

### Acceptance criteria

1. Commands support `--json`.
2. Commands support `--agent` where relevant.
3. Commands use stable exit codes.
4. Commands do not show raw private bodies by default.
5. Tests cover JSON output.

## AR11: Agentic AI Readiness Starter Pack

### Placement

After Phase 2 demo packs or during starter pack expansion.

### Goal

Add the Agentic AI Readiness Pack as an official starter pack.

### Build

Create:

```text
demo-packs/agentic-ai-readiness-pack/**
```

Required files:

```text
contextarr-pack.json
README.md
CHANGELOG.md
LICENSE
records/
sources/sources.yaml
exports/
rules/validation.yaml
rules/redaction.yaml
rules/freshness.yaml
rules/governance.yaml
examples/
```

### Acceptance criteria

1. Pack validates with zero errors.
2. Pack uses fake or public-safe content.
3. Pack includes governance file.
4. Pack includes readiness-themed records.
5. Pack includes all required export profiles.
6. No copied third-party report text.
7. No executable content.

## AR12: Benchmark Integration

### Placement

After Good to Great benchmark G1 and G3, and after Phase 8 export engine.

### Goal

Connect readiness scoring to benchmark evidence.

### Build

Add benchmark fixtures:

```text
demo-evals/tasks/agentic-ai-readiness-review/**
demo-evals/tasks/governance-gap-analysis/**
demo-evals/tasks/redacted-agent-brief/**
```

### Acceptance criteria

1. Benchmark evidence can contribute to readiness score.
2. Missing benchmark evidence warns only.
3. Sensitive leakage benchmark failure blocks public-safe export readiness.
4. Reports are deterministic with fixed sample outputs.
5. No external AI calls required.

## AR13: Release Gate and Docs Hardening

### Placement

Before v0.1 public preview if implemented early, otherwise before v1.0 release candidate.

### Goal

Add readiness and local observability to release verification.

### Build

Add docs:

```text
docs/context-readiness.md
docs/local-observability.md
docs/governance-rules.md
docs/token-budgeting.md
docs/readiness-release-gate.md
```

Add scripts if appropriate:

```text
pnpm readiness:verify
pnpm observability:verify
```

### Acceptance criteria

1. Readiness docs are complete.
2. Local observability docs clearly say no cloud telemetry.
3. Release gate checks demo pack readiness.
4. Export evidence works.
5. MCP query evidence works if MCP exists.
6. No non-goals slipped in.

## AR14: Post-v1 Private Team Readiness Research, Optional

### Placement

After v1.0 and after evidence of team demand.

### Goal

Research how Context Readiness, governance, and local evidence would support private team registries.

### Build

Docs only:

```text
docs/private-team-readiness-requirements.md
docs/team-governance-model.md
docs/team-evidence-export.md
```

### Acceptance criteria

1. Private team requirements are documented.
2. No private registry implementation.
3. No cloud sync.
4. No hosted telemetry.
5. No public marketplace.

## 30. Integration With Existing Phase Plan

Recommended insertion order:

1. Phase 0: Repo initialization and guardrails.
2. AR0: PRD addition and decision record.
3. Phase 1: Pack schema and validator.
4. AR1: Readiness and governance schema design.
5. Phase 2: Demo packs.
6. AR11: Agentic AI Readiness Starter Pack, if starter packs are being expanded.
7. Phase 3: Local index and API.
8. AR2: Local evidence event schema and storage.
9. Phase 4: Dashboard shell and library.
10. Phase 5: Pack detail and record rendering.
11. Phase 7: Pack Health and Review Queue.
12. AR3: Context Readiness Engine v0.
13. AR4: Readiness API.
14. AR5: Governance Rules Integration.
15. AR8: Readiness UI.
16. AR9: Local Activity UI.
17. Phase 8: Export Engine v0.
18. AR6: Export Evidence and Token Budget Integration.
19. Phase 9: Read-Only MCP v0.
20. AR7: MCP Query Evidence Integration.
21. AR10: CLI Commands.
22. Good to Great G3: Benchmark Harness v0.
23. AR12: Benchmark Integration.
24. AR13: Release Gate and Docs Hardening.
25. Continue existing v1 hardening.

Do not implement AR features ahead of the underlying core phase they depend on.

## 31. Testing Requirements

### 31.1 Schema tests

1. Valid governance file passes.
2. Invalid governance target fails.
3. Invalid decision authority fails.
4. Invalid human-in-loop value fails.
5. Valid readiness report passes.
6. Invalid readiness status fails.
7. Token budget soft and hard limits validate.

### 31.2 Readiness engine tests

Fixtures:

1. `ready-pack`.
2. `ready-with-warnings-pack`.
3. `missing-governance-pack`.
4. `blocked-by-safety-pack`.
5. `blocked-by-redaction-pack`.
6. `token-hard-limit-pack`.
7. `mcp-not-allowed-pack`.

Expectations:

1. Scores are deterministic.
2. Status labels are correct.
3. Blocking issue codes are correct.
4. Suggested actions exist.
5. Missing benchmark evidence does not block.
6. Critical safety issues block.

### 31.3 Evidence tests

1. Export evidence stores metadata only by default.
2. MCP evidence stores query hash only by default.
3. Event writer rejects unknown event type unless configured.
4. Retention pruning dry-run does not delete records.
5. Retention pruning with `--yes` deletes matching old events.
6. Redacted diagnostics exclude raw bodies.

### 31.4 API tests

1. `GET /api/packs/:id/readiness` returns report.
2. `POST /api/packs/:id/readiness/recalculate` writes event.
3. `GET /api/readiness` filters by status.
4. `GET /api/events` filters by pack and type.
5. `GET /api/exports/history` returns metadata only.
6. `GET /api/mcp/query-log` returns metadata only.

### 31.5 UI tests

1. Readiness badge displays.
2. Readiness tab renders dimensions.
3. Blockers link to records or settings.
4. Export history table hides raw body.
5. MCP query log hides raw query.
6. Settings default raw body storage to off.

### 31.6 Security tests

1. Critical scanner issue blocks readiness.
2. Governance target deny blocks export.
3. Raw source access denied blocks MCP raw source request.
4. Export hard token limit blocks export.
5. Sensitive record in public-safe export blocks export.
6. Local evidence bundle redacts sensitive metadata when configured.

## 32. Documentation Requirements

Create or update:

```text
docs/prd-additions/agentic-ai-context-readiness-local-observability.md
docs/decision-records/decision-agentic-ai-context-readiness.md
docs/context-readiness.md
docs/local-observability.md
docs/governance-rules.md
docs/token-budgeting.md
docs/export-evidence.md
docs/mcp-query-evidence.md
docs/readiness-release-gate.md
docs/non-goals.md
docs/security-model.md
docs/roadmap-phases.md
README.md
AGENTS.md
```

Docs must state:

1. Local observability is not product telemetry.
2. Nothing is uploaded automatically.
3. Contextarr does not run agents.
4. Contextarr does not execute pack content.
5. MCP remains read-only.
6. Raw bodies are not logged by default.
7. Evidence logs are local app state.
8. Export history is metadata-first.
9. Governance metadata describes boundaries, not permissions to act.
10. Context Readiness does not certify legal, medical, financial, or security correctness.

## 33. Success Criteria

This addition succeeds if:

1. Users understand whether a pack is ready for agentic AI use.
2. Users can see why readiness is blocked or degraded.
3. Users can prove what context was exported, at least by metadata and hash.
4. Users can see which packs lack governance.
5. Users can see redaction and token-budget risks before export.
6. MCP queries create local metadata evidence.
7. No product telemetry is added.
8. No agent execution is added.
9. The readiness starter pack teaches the enterprise-relevant story.
10. Benchmark evidence can support product claims.
11. Contextarr is better positioned as context infrastructure, not generic memory.

## 34. Kill, Pause, or Refocus Signals

Pause or refocus if:

1. Readiness score becomes vague or unexplainable.
2. Users treat readiness as a false guarantee of correctness.
3. Local observability feels like surveillance instead of evidence.
4. Evidence logs start storing too much sensitive body content.
5. The feature pulls Contextarr toward hosted analytics.
6. Users ask mostly for agent execution instead of context readiness.
7. Token budget warnings are noisy and ignored.
8. Governance metadata becomes too complex for power users to maintain.
9. Activity UI becomes more prominent than Pack Health or exports.
10. This work delays schema, validator, demo packs, export engine, or read-only MCP.

## 35. Monetization Implications

This addition strengthens later monetization without adding cloud costs.

Possible paid layers later:

1. Setup service for Agentic AI Readiness Packs.
2. Migration service for SOPs and internal KBs.
3. Paid readiness templates.
4. Paid governance templates.
5. Paid vertical starter packs.
6. Contextarr Studio UI for readiness, review, redaction, and export evidence.
7. Private team registry later, only after trust model matures.

Do not monetize by:

1. Selling hosted telemetry.
2. Selling managed AI before trust is earned.
3. Building cloud sync early.
4. Running agents for users.
5. Selling public marketplace access early.

## 36. Codex Guidance

### 36.1 Global rules

Codex must follow these rules for all AR phases:

1. Do not skip core Context Pack phases.
2. Do not implement all AR phases at once.
3. Start with docs and decision records.
4. Add tests with every implementation phase.
5. Keep local files as source of truth.
6. Keep SQLite derived for pack content.
7. Treat evidence logs as local app state.
8. Do not add cloud telemetry.
9. Do not add product analytics.
10. Do not add external logging services.
11. Do not add agent execution.
12. Do not add mutating MCP.
13. Do not execute pack content.
14. Do not add direct Gmail, Slack, Drive, Jira, CRM, bank, or brokerage connectors.
15. Do not add public marketplace or public registry.
16. Do not store raw MCP queries or response bodies by default.
17. Do not store export bodies by default.
18. Do not call external AI APIs.
19. Do not include real private data.
20. Stop after the requested phase.

### 36.2 Final report format

Each Codex implementation pass must end with:

1. Summary.
2. Files created.
3. Files changed.
4. Commands run.
5. Tests run.
6. Checks passed.
7. Blockers.
8. Security notes.
9. Privacy notes.
10. Deviations from PRD.
11. Next recommended prompt.

## 37. Codex Prompt: AR0 Docs and Decision Record

Use this first.

```text
You are Codex acting as senior product architect and repo operator for Contextarr.

Goal:
Add a new PRD addition for Agentic AI Context Readiness and Local Observability. This is a documentation and planning pass only.

Source of truth:
Follow the existing Contextarr PRD and phase plan. Contextarr is local-first, self-hosted, data-only, non-executable, source-backed, reviewable, redaction-aware, export-focused, and read-only MCP first. The core object is the Context Pack. Context Packs reach stability before Skills and Agent Kits are implemented.

Context:
A recent Harvard Business Review Analytic Services report on agentic AI data infrastructure and telemetry highlights that agentic AI requires better data quality, governance, observability, workflow readiness, evaluation, and cost control. Contextarr should apply these findings narrowly. It should not become a telemetry platform, hosted analytics product, agent runner, cloud vault, or workflow automation engine.

Files to create:
- docs/prd-additions/agentic-ai-context-readiness-local-observability.md
- docs/decision-records/decision-agentic-ai-context-readiness.md

Files to update if they exist and if appropriate:
- docs/roadmap-phases.md
- docs/non-goals.md
- docs/security-model.md
- docs/architecture.md
- README.md
- AGENTS.md

Content requirements for the PRD addition:
1. Define the purpose of the addition.
2. State that it does not replace the main PRD.
3. Define the strategic thesis: agentic AI needs context readiness, not generic memory.
4. Define Context Readiness Score.
5. Define Local Observability and explicitly distinguish it from product telemetry.
6. Define governance metadata for agent use.
7. Define export evidence metadata.
8. Define MCP query evidence metadata.
9. Define token budget and context bloat warnings.
10. Define the Agentic AI Readiness starter pack.
11. Define benchmark integration with Context Quality Benchmark.
12. Define UI additions.
13. Define API additions.
14. Define CLI additions.
15. Define SQLite additions.
16. Define security and privacy rules.
17. Define ordered AR phases from AR0 through AR14.
18. Define tests and acceptance criteria.
19. Define success criteria, kill signals, monetization implications, and Codex guidance.

Decision record requirements:
Use this structure:
- Title
- Status: Proposed
- Date
- Context
- Decision
- Consequences
- Alternatives considered
- Non-goals

Decision must state:
- Contextarr will add a Context Readiness and Local Observability layer.
- Local observability means local evidence logs only.
- Contextarr will not add hosted telemetry or automatic analytics upload.
- Contextarr will not become an agent runner.
- Contextarr will not execute pack content.
- Contextarr will not add direct live connectors for Gmail, Slack, Drive, Jira, CRM, banking, or brokerage in this decision.
- Contextarr will keep MCP read-only.
- Contextarr will use readiness to strengthen exports, governance, review, benchmarks, and local evidence.

Roadmap update requirements:
If docs/roadmap-phases.md exists, add a short section mapping AR phases to the existing core phase plan:
- AR0 immediately as docs.
- AR1 after Phase 1 schema and validator.
- AR2 after Phase 3 local index and API.
- AR3 after Phase 7 Pack Health and Review Queue.
- AR6 after Phase 8 Export Engine.
- AR7 after Phase 9 Read-Only MCP.
- AR11 during starter pack expansion.
- AR13 before release gate.

Non-goals update requirements:
Ensure non-goals still block:
- hosted cloud vault
- hosted telemetry
- product analytics
- public marketplace
- public registry
- executable packs
- agent runner
- workflow engine
- mutating MCP
- hidden network calls
- live connectors
- direct Gmail connector
- direct bank connector
- telemetry upload

AGENTS.md update requirements:
If AGENTS.md exists, add a rule that agents must not implement readiness, evidence logging, telemetry, MCP logging, governance rules, starter packs, or UI unless the prompt explicitly scopes that phase.

Hard boundaries:
- Do not implement app functionality.
- Do not alter schemas.
- Do not create database migrations.
- Do not add UI routes.
- Do not add API routes.
- Do not add MCP tools.
- Do not add event logging code.
- Do not add cloud services.
- Do not add telemetry.
- Do not add product analytics.
- Do not add agent execution.
- Do not add direct connectors.
- Do not include real private data.
- Do not copy third-party report text into starter pack content.

Validation:
Run available docs checks or tests already present in the repo.
If no docs checks exist, report that none were available.
Do not invent passing checks.

Final report format:
- Summary
- Files created
- Files changed
- Commands run
- Tests or docs checks run
- Checks passed
- Blockers
- Security notes
- Privacy notes
- Deviations from this prompt
- Next recommended prompt

Stop after docs and planning updates.
```

## 38. Final Recommendation

Add this PRD addition now as docs and a decision record.

Do not implement the engine yet.

The correct sequence is:

```text
Docs first.
Schema after validator foundation.
Local evidence after SQLite index exists.
Readiness engine after Pack Health exists.
Export evidence after Export Engine exists.
MCP evidence after read-only MCP exists.
UI after API exists.
Benchmark integration after export and benchmark harness exist.
```

The Harvard report should sharpen Contextarr, not expand it into the wrong product.

Final product line:

```text
Contextarr prepares trusted context for agentic AI.
It does not run agents.
It does not phone home.
It does not hide what was shared.
```
