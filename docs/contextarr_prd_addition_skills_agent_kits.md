# Contextarr PRD Addition: Skills and Agent Kits

## 1. Purpose

This document adds a future Skills and Agent Kits layer to the Contextarr product plan.

This addition does not replace the existing Contextarr PRD. It extends it after the core Context Pack system is complete.

The original product remains:

```text
Local sources in.
Validated Context Packs out.
Human-readable dashboard.
Redaction-aware exports.
Read-only MCP.
```

This addition expands the future product into:

```text
Context Packs provide grounding.
Skills provide reusable capability instructions.
Agent Kits combine both for specific AI-assisted work.
```

## 2. Strategic Summary

Contextarr should eventually support building, tracking, validating, pairing, composing, and exporting Skills with Context Packs into Agent Kits.

The purpose is to give users a safe, local-first, source-backed preparation layer for AI assistants and agents.

Contextarr prepares Agent Kits.

Contextarr does not run Agent Kits.

This boundary is critical.

## 3. New Product Thesis

AI tools in 2026 are increasingly organized around reusable Skills. Skills teach an assistant or agent how to perform a type of work.

Contextarr should not compete with agent runtimes or executable skill platforms. Instead, Contextarr should own the preparation layer that makes skills safer, more contextual, more portable, and more reviewable.

The distinction:

```text
Skills tell agents how to work.
Context Packs tell agents what to know.
Agent Kits combine both for a specific task.
```

The opportunity is to become the local-first system for maintaining the ingredients that make agent work reliable:

1. Trusted context.
2. Reusable skill instructions.
3. Redaction rules.
4. Export profiles.
5. Target-specific formatting.
6. Human review.
7. Source traceability.
8. Safety validation.
9. Deterministic output.
10. Read-only local access.

## 4. Updated Product Definition

Contextarr is a self-hosted context and agent preparation system for AI assistants and agents.

It helps users build, validate, review, render, redact, compose, and export:

1. Context Packs.
2. Skills.
3. Agent Kits.
4. Export Briefs.

Contextarr remains local-first, data-only, non-executable, and human-review centered.

## 5. Updated Category Positioning

### 5.1 Primary Category

```text
Self-hosted context automation and agent kit manager.
```

### 5.2 Short Product Description

```text
Contextarr turns local knowledge and reusable agent instructions into validated Context Packs and Agent Kits for AI assistants and agents.
```

### 5.3 Public Messaging

```text
Skills tell agents how to work.
Context Packs tell agents what to know.
Agent Kits combine both for a specific task.
```

### 5.4 Developer Messaging

```text
Contextarr is a local-first system for maintaining source-backed context, non-executable skills, export profiles, and task-ready Agent Kits across ChatGPT, Claude, Codex, Claude Code, Cursor, Open WebUI, AnythingLLM, OpenCode, Hermes, OpenClaw, and local MCP clients.
```

## 6. Core Vocabulary

### 6.1 Context Pack

A Context Pack is a structured, versioned, source-backed bundle of reusable context.

It tells the AI what it needs to know.

Examples:

1. Contextarr Project Pack.
2. AI Workstation Pack.
3. Jellyfin Server Pack.
4. Internal Support KB Pack.
5. Claude Code Project Pack.
6. Product Line Pack.
7. Contractor Handoff Pack.
8. Homelab Network Pack.

### 6.2 Skill

A Skill is a structured, reusable, non-executable instruction bundle that tells an AI assistant or agent how to perform a specific type of work.

In Contextarr v1, a Skill is data-only.

It may include:

1. Instructions.
2. Decision rules.
3. Output formats.
4. Examples.
5. Constraints.
6. Safety rules.
7. Compatibility metadata.
8. Target-specific adapters.
9. Input expectations.
10. Review status.

It must not include:

1. Executable scripts.
2. Shell commands.
3. Hidden network calls.
4. API keys.
5. Tool execution logic.
6. Browser automation.
7. Credential prompts.
8. Background tasks.
9. Autonomous actions.
10. Runtime plugins.

A Contextarr Skill teaches the assistant how to respond or structure work. It does not give Contextarr the ability to execute that work.

### 6.3 Agent Kit

An Agent Kit is a task-ready pairing of one or more Skills with one or more Context Packs, plus export profile, target tool, redaction rules, and compatibility metadata.

It is the composed working setup for a specific AI task.

Examples:

1. Contextarr Phase 5 Renderer Agent Kit.
2. Homelab Troubleshooting Agent Kit.
3. Support Ticket Writing Agent Kit.
4. Internal KB Answering Agent Kit.
5. Contractor Handoff Agent Kit.
6. Claude Code Implementation Agent Kit.
7. Product Research Agent Kit.
8. Security Review Agent Kit.

### 6.4 Export Brief

An Export Brief is the generated output sent to an AI tool or human.

It may be created from:

1. A Context Pack.
2. A Skill.
3. An Agent Kit.
4. A selected set of records and instructions.

Examples:

1. ChatGPT Project Brief.
2. Claude Deep Context Brief.
3. Codex Implementation Brief.
4. Redacted Contractor Brief.
5. Claude Code Agent Kit Brief.
6. Generic Markdown Brief.
7. JSON Agent Kit Export.

### 6.5 Library

The Library is the local dashboard view that lists Context Packs, Skills, Agent Kits, and Export Briefs.

### 6.6 Composer

The Composer is the interface for selecting Context Packs, Skills, rules, target tools, and export formats to create an Agent Kit or Export Brief.

## 7. Product Boundaries

### 7.1 What Contextarr Adds

Contextarr may add:

1. Local Skill Library.
2. Skill schema.
3. Skill validator.
4. Skill health.
5. Skill review queue.
6. Skill source maps.
7. Skill examples.
8. Skill compatibility metadata.
9. Skill export profiles.
10. Skill pairing with Context Packs.
11. Agent Kit schema.
12. Agent Kit composer.
13. Agent Kit validation.
14. Agent Kit health.
15. Agent Kit preview.
16. Agent Kit export.
17. Agent Kit static rendering.
18. Read-only MCP access to approved Agent Kits.
19. Import of local, data-only skill folders.
20. Conversion of approved instructions into Skills.

### 7.2 What Contextarr Must Not Add

Contextarr must not add:

1. Skill execution.
2. Shell command execution.
3. Browser automation.
4. Agent runtime.
5. Autonomous background agents.
6. Arbitrary tool calling.
7. API-calling Skills.
8. Hidden network access.
9. Public Skill marketplace.
10. Remote Skill auto-install.
11. Executable Skill packs.
12. Scripted workflows.
13. Credentialed external connectors.
14. Gmail connector.
15. Banking connector.
16. Brokerage connector.
17. Passive always-on capture.
18. Hosted public Skill registry in v1.
19. Managed AI execution.
20. Telemetry.

### 7.3 Core Safety Phrase

```text
Contextarr prepares Agent Kits. It does not run them.
```

## 8. Updated Product Principles

The existing Contextarr principles remain binding. The following principles are added.

### 8.1 Non-Executable Skill Principle

Skills in Contextarr are instruction and formatting artifacts only.

They must never execute code, call tools, run commands, or trigger network actions.

### 8.2 Capability Separation Principle

Skills describe how work should be done.

Execution belongs to the downstream AI assistant, agent client, IDE, or MCP-capable runtime.

Contextarr does not become the runtime.

### 8.3 Pairing Principle

A Skill is more useful when paired with the right Context Pack.

Contextarr should help users pair capability instructions with source-backed context safely and intentionally.

### 8.4 Target Awareness Principle

The same Skill and Context Pack may need different formatting for ChatGPT, Claude, Codex, Claude Code, Cursor, OpenCode, Open WebUI, AnythingLLM, Hermes, OpenClaw, or local MCP clients.

Agent Kits must support target-specific export profiles.

### 8.5 Review Before Use Principle

A Skill, Context Pack, or Agent Kit should not be marked approved until a human reviews it.

AI-drafted Skills must enter the review queue.

### 8.6 Least Capability Principle

Agent Kit exports should include only the Skills, context, rules, and instructions required for the selected task.

Do not over-export instructions or context.

### 8.7 Skill Provenance Principle

A Skill should have source metadata, author metadata, review metadata, and compatibility metadata.

Users should be able to inspect why a Skill says what it says.

### 8.8 No Marketplace Until Trust Matures Principle

No public marketplace for Skills, Context Packs, or Agent Kits until the format, signing model, permission model, manual review process, abuse controls, reputation system, and security posture are mature.

## 9. Updated Non-Goals

The existing non-goals remain. Add these explicit non-goals:

1. No executable Skills.
2. No Skill marketplace in v1.
3. No community Skill auto-install.
4. No Skill runner.
5. No workflow automation engine.
6. No API execution layer.
7. No browser automation layer.
8. No terminal automation layer.
9. No credentialed Skill actions.
10. No direct tool-calling orchestration.
11. No background Skill scheduler.
12. No agent runtime UI.
13. No hosted Agent Kit cloud.
14. No remote Agent Kit registry by default.
15. No unreviewed AI-generated Skills in exports.
16. No mixing private Context Packs into public Agent Kits without explicit redaction review.

## 10. User Personas Added

### 10.1 Agent Power User

Uses multiple agent tools, such as Codex, Claude Code, Cursor, OpenCode, OpenClaw, Hermes, Open WebUI, and local MCP clients.

Pain:

1. Skills and instructions are scattered across tools.
2. Agent setup differs per tool.
3. Reusable instructions are copied manually.
4. Project context and task instructions are not paired cleanly.
5. It is hard to know which setup produced which result.

Needs:

1. Local Skill Library.
2. Context Pack pairing.
3. Agent Kit composer.
4. Target-specific exports.
5. Versioning and review status.
6. Redaction rules.
7. Repeatable agent setup.

### 10.2 Internal Operations Builder

Builds AI-assisted workflows for support, sales, operations, QA, training, or reporting.

Pain:

1. SOPs live separately from prompt instructions.
2. AI outputs vary by assistant.
3. Users need consistent task guidance.
4. Internal knowledge must be redacted before sharing.
5. Team instructions drift over time.

Needs:

1. Skills for writing, analysis, ticket creation, QA, and summaries.
2. Context Packs for internal systems and processes.
3. Agent Kits for repeatable tasks.
4. Review and approval flow.
5. Human-readable exports.
6. Version history.

### 10.3 Consultant or Client Operator

Works across multiple clients or projects.

Pain:

1. Client context must be separated.
2. Skills may be reused across clients.
3. Context must be redacted per client.
4. Handoffs must be repeatable.
5. AI tools change per engagement.

Needs:

1. Reusable Skills.
2. Client-specific Context Packs.
3. Agent Kits per client and task.
4. Redacted export profiles.
5. Audit-friendly review metadata.

### 10.4 Skill Author

Creates reusable prompt instructions, output formats, or task patterns.

Pain:

1. Skills are hard to validate.
2. Examples are scattered.
3. Target compatibility is unclear.
4. Safety boundaries are rarely explicit.
5. Users confuse instructions with executable automation.

Needs:

1. Skill schema.
2. Skill examples.
3. Compatibility metadata.
4. Safety checks.
5. Export adapters.
6. Versioned files.

## 11. New Core Product Objects

### 11.1 Skill

A Skill is a local, versioned, data-only instruction artifact.

A Skill can represent:

1. A writing pattern.
2. A coding review method.
3. A research method.
4. A support ticket drafting process.
5. A troubleshooting framework.
6. A QA checklist.
7. A summarization style.
8. A product comparison method.
9. A security review method.
10. A handoff process.
11. A teaching method.
12. A project planning method.

### 11.2 Skill Record

A Skill Record is a structured unit inside a Skill.

Examples:

1. Instruction block.
2. Output format.
3. Decision rule.
4. Anti-pattern.
5. Example input.
6. Example output.
7. Target-specific note.
8. Safety warning.
9. Review note.
10. Version note.

### 11.3 Agent Kit

An Agent Kit is a composed object that references Context Packs and Skills.

It does not duplicate all source content by default.

It defines:

1. Purpose.
2. Target task.
3. Target AI tool.
4. Included Context Packs.
5. Included Skills.
6. Export profile.
7. Redaction mode.
8. Compatibility rules.
9. Review status.
10. Output format.
11. Token budget.
12. Source references.

### 11.4 Skill Health

Skill Health measures whether a Skill is valid, safe, reviewed, current, compatible, and export-ready.

Signals:

1. Schema validity.
2. Required files present.
3. Instructions reviewed.
4. Examples present.
5. Safety rules present.
6. Target compatibility declared.
7. No disallowed command patterns.
8. No executable files.
9. No secret patterns.
10. No hidden network instructions.
11. Last reviewed date.
12. Export readiness.

### 11.5 Agent Kit Health

Agent Kit Health measures whether the combined Skill and Context Pack pairing is valid and safe.

Signals:

1. Referenced Skills exist.
2. Referenced Context Packs exist.
3. Skills are approved.
4. Context Packs are approved.
5. Export profile exists.
6. Redaction rules apply.
7. Target compatibility is valid.
8. Token budget is respected or warned.
9. Sensitive context warnings are resolved.
10. Review status is current.

## 12. Skill Folder Format

### 12.1 Recommended Skill Folder

```text
skills/
  support-ticket-writing/
    contextarr-skill.json
    README.md
    CHANGELOG.md
    LICENSE
    instructions/
      core.md
      ticket-structure.md
      tone-rules.md
      anti-patterns.md
    examples/
      good-ticket.md
      bad-ticket.md
      screenshot-to-ticket.md
    sources/
      sources.yaml
    exports/
      chatgpt.yaml
      claude.yaml
      codex.yaml
      generic-markdown.yaml
    rules/
      validation.yaml
      safety.yaml
      freshness.yaml
    assets/
      cover.png
```

### 12.2 Skill Manifest

File:

```text
contextarr-skill.json
```

Example:

```json
{
  "id": "support-ticket-writing",
  "name": "Support Ticket Writing",
  "version": "1.0.0",
  "description": "Reusable instructions for turning issue notes, screenshots, and system context into clear support tickets.",
  "type": "writing_skill",
  "visibility": "local",
  "trustLevel": "local",
  "author": "Contextarr Demo",
  "license": "MIT",
  "createdAt": "2026-05-07T00:00:00Z",
  "updatedAt": "2026-05-07T00:00:00Z",
  "lastReviewedAt": null,
  "containsPersonalData": false,
  "containsExecutableCode": false,
  "requiresNetwork": false,
  "permissions": {
    "readVault": false,
    "writeDrafts": false,
    "runCommands": false,
    "networkAccess": false,
    "browserAutomation": false,
    "toolExecution": false
  },
  "instructionsPath": "instructions",
  "examplesPath": "examples",
  "sourcesPath": "sources/sources.yaml",
  "exportsPath": "exports",
  "rulesPath": "rules",
  "targets": [
    "chatgpt",
    "claude",
    "codex",
    "claude_code",
    "generic_markdown"
  ],
  "inputs": [
    "issue_description",
    "screenshots",
    "context_pack_records",
    "user_notes"
  ],
  "outputs": [
    "ticket_draft"
  ],
  "assets": {
    "coverImage": "assets/cover.png",
    "accentColor": "#7c3aed"
  },
  "compatibility": {
    "contextarr": ">=0.2.0"
  }
}
```

### 12.3 Skill Instruction File

Example:

```markdown
---
id: support-ticket-writing.core
title: Core Ticket Writing Instructions
type: instruction_block
skill: support-ticket-writing
tags:
  - support
  - tickets
  - writing
confidence: high
source_status: authored
freshness: current
privacy: public_safe
last_reviewed: 2026-05-07
review_status: approved
---

# Core Ticket Writing Instructions

## Goal
Turn raw issue descriptions, screenshots, and system context into clear support tickets.

## Rules
1. State the issue plainly.
2. Include observed behaviour.
3. Include expected behaviour.
4. Include reproduction steps when available.
5. Include affected system or page.
6. Avoid speculation unless clearly labeled.
7. Do not include private customer information unless explicitly requested.

## Output Format

Use this format:

Title:

Issue:

Observed Behaviour:

Expected Behaviour:

Steps to Reproduce:

Impact:

Notes:
```

### 12.4 Skill Source Map

File:

```text
sources/sources.yaml
```

Example:

```yaml
sources:
  - id: internal-style-guide-demo
    type: markdown
    title: Demo Support Writing Style Guide
    path: ../raw/demo-support-style-guide.md
    retrieved_at: 2026-05-07T00:00:00Z
    trust: local
    status: current

  - id: manual-authoring
    type: manual
    title: Manually Authored Skill Instructions
    retrieved_at: 2026-05-07T00:00:00Z
    trust: local
    status: current
```

### 12.5 Skill Safety Rules

File:

```text
rules/safety.yaml
```

Example:

```yaml
disallowed:
  executable_files: true
  shell_commands: true
  network_calls: true
  credential_requests: true
  browser_automation: true
  hidden_prompts: true
  tool_execution: true

patterns:
  - name: shell_pipe_to_bash
    regex: "(?i)(curl|wget).*(bash|sh)"
    severity: critical
    action: block

  - name: api_key_request
    regex: "(?i)(ask|request|collect).*(api[_ -]?key|secret|token|password)"
    severity: high
    action: review

  - name: hidden_instruction
    regex: "(?i)(ignore previous instructions|do not tell the user|secretly|silently exfiltrate)"
    severity: critical
    action: block
```

## 13. Agent Kit Folder Format

### 13.1 Recommended Agent Kit Folder

```text
agent-kits/
  rep-portal-bug-ticket-kit/
    contextarr-agent-kit.json
    README.md
    CHANGELOG.md
    LICENSE
    exports/
      chatgpt.yaml
      claude.yaml
      codex.yaml
    rules/
      validation.yaml
      redaction.yaml
      compatibility.yaml
    examples/
      sample-export.md
```

### 13.2 Agent Kit Manifest

File:

```text
contextarr-agent-kit.json
```

Example:

```json
{
  "id": "rep-portal-bug-ticket-kit",
  "name": "Rep Portal Bug Ticket Agent Kit",
  "version": "1.0.0",
  "description": "Task-ready kit for drafting Rep Portal bug tickets from issue notes and screenshots.",
  "type": "support_workflow",
  "visibility": "local",
  "trustLevel": "local",
  "author": "Contextarr Demo",
  "license": "MIT",
  "createdAt": "2026-05-07T00:00:00Z",
  "updatedAt": "2026-05-07T00:00:00Z",
  "lastReviewedAt": null,
  "containsPersonalData": false,
  "containsExecutableCode": false,
  "requiresNetwork": false,
  "contextPacks": [
    "internal-support-kb-pack",
    "fake-product-line-pack"
  ],
  "skills": [
    "support-ticket-writing",
    "bug-report-structuring"
  ],
  "target": "chatgpt",
  "exportProfile": "redacted-support-ticket",
  "privacyMode": "redacted",
  "tokenBudget": 12000,
  "rulesPath": "rules",
  "exportsPath": "exports",
  "examplesPath": "examples",
  "compatibility": {
    "contextarr": ">=0.3.0"
  }
}
```

### 13.3 Agent Kit Export Profile

Example:

```yaml
id: redacted-support-ticket
name: Redacted Support Ticket Agent Kit Export
target: chatgpt
format: markdown
privacy_mode: redacted
include:
  context_packs:
    - internal-support-kb-pack
  skills:
    - support-ticket-writing
    - bug-report-structuring
exclude_tags:
  - secret
  - health
  - financial
  - customer_private
  - never_export
token_budget: 12000
sections:
  - kit_summary
  - task_goal
  - included_skills
  - relevant_context
  - output_format
  - constraints
  - redaction_notice
  - sources
```

## 14. Updated App Information Architecture

### 14.1 Updated Left Navigation

Current navigation should eventually become:

1. Library.
2. Context Packs.
3. Skills.
4. Agent Kits.
5. Sources.
6. Review Queue.
7. Composer.
8. Exports.
9. Health.
10. Registry, local only in v1.
11. Settings.
12. System.

### 14.2 Library Views

The Library should support filtering by object type:

1. Context Packs.
2. Skills.
3. Agent Kits.
4. Export Briefs.

View modes:

1. Cover Grid.
2. Compact Cards.
3. Dense Table.

Dense Table columns:

1. Name.
2. Object Type.
3. Category.
4. Trust.
5. Health.
6. Review Status.
7. Sources.
8. Records or Instructions.
9. Compatible Targets.
10. Last Reviewed.
11. Version.
12. Actions.

### 14.3 Skill Detail Page

Header:

1. Skill name.
2. Description.
3. Type.
4. Health score.
5. Trust badge.
6. Version.
7. Last reviewed.
8. Compatible targets.
9. Export button.
10. Compose Agent Kit button.
11. Edit metadata button.

Tabs:

1. Overview.
2. Instructions.
3. Examples.
4. Sources.
5. Exports.
6. Health.
7. Activity.
8. Changelog.

Overview content:

1. Summary.
2. Use cases.
3. Inputs.
4. Outputs.
5. Safety boundaries.
6. Compatible targets.
7. Related Context Packs.
8. Related Agent Kits.

### 14.4 Agent Kit Detail Page

Header:

1. Agent Kit name.
2. Description.
3. Type.
4. Health score.
5. Trust badge.
6. Target tool.
7. Version.
8. Last reviewed.
9. Export button.
10. Preview button.
11. Edit composition button.

Tabs:

1. Overview.
2. Context Packs.
3. Skills.
4. Rules.
5. Export Preview.
6. Health.
7. Activity.
8. Changelog.

Overview content:

1. Task goal.
2. Included Context Packs.
3. Included Skills.
4. Export target.
5. Redaction mode.
6. Token budget.
7. Health warnings.
8. Review status.
9. Last export.

### 14.5 Composer Updates

Composer should support:

1. Select Context Packs.
2. Select records from Context Packs.
3. Select Skills.
4. Select Skill instruction sections.
5. Choose target tool.
6. Choose export profile.
7. Set privacy mode.
8. Apply redaction rules.
9. Estimate token usage.
10. Preview generated output.
11. Save as Agent Kit.
12. Export as brief.

## 15. Updated Workflows

### 15.1 Build a Skill From Scratch

1. User chooses New Skill.
2. User selects Skill type.
3. Contextarr suggests a Skill template.
4. User writes or imports instructions.
5. User adds examples.
6. User defines expected inputs and outputs.
7. User defines safety rules.
8. Contextarr validates the Skill.
9. Skill enters review queue.
10. User approves Skill.
11. Skill appears in Library.
12. Skill becomes available in Composer.

### 15.2 Import a Local Skill Folder

1. User selects local Skill folder.
2. Contextarr scans files.
3. Contextarr validates manifest and instruction files.
4. Contextarr checks for disallowed scripts, commands, network patterns, and credential requests.
5. Contextarr builds derived index.
6. Skill appears as unreviewed.
7. User reviews and approves.

### 15.3 Build an Agent Kit

1. User opens Composer.
2. User selects target task.
3. User selects one or more Context Packs.
4. User selects one or more Skills.
5. User chooses target AI tool.
6. User chooses export profile.
7. Contextarr checks compatibility.
8. Contextarr checks redaction rules.
9. Contextarr estimates token usage.
10. User previews output.
11. User saves as Agent Kit.
12. Agent Kit appears in Library.

### 15.4 Export an Agent Kit

1. User opens Agent Kit.
2. User selects export target.
3. Contextarr builds export preview.
4. Contextarr shows redaction warnings.
5. Contextarr shows token estimate.
6. User approves export.
7. Contextarr generates Export Brief.
8. User copies or downloads output.

### 15.5 Query Agent Kit Through Read-Only MCP

1. User enables read-only MCP.
2. AI client connects locally.
3. AI client calls `list_agent_kits`.
4. AI client calls `get_agent_kit_summary`.
5. AI client calls `query_agent_kit_context`.
6. Contextarr returns selected, redacted, approved context and skill instructions.
7. Contextarr logs local query metadata.
8. MCP does not mutate files or execute Skills.

## 16. Updated Validation Requirements

### 16.1 Skill Validation

The validator must check:

1. `contextarr-skill.json` exists.
2. Required manifest fields exist.
3. `containsExecutableCode` is false.
4. `requiresNetwork` is false unless only used as metadata warning.
5. Permissions do not allow command execution, network access, browser automation, or tool execution.
6. Instructions folder exists.
7. Instruction frontmatter is valid.
8. Instruction IDs are unique.
9. Source IDs referenced by instructions exist.
10. Export profiles are valid.
11. Safety rules are valid.
12. No obvious executable files exist.
13. No shell command patterns exist in Skill metadata.
14. No credential request patterns exist.
15. No hidden instruction patterns exist.
16. Compatible targets are declared.
17. Last reviewed metadata exists or warning is emitted.
18. AI-drafted instructions are not approved by default.

### 16.2 Agent Kit Validation

The validator must check:

1. `contextarr-agent-kit.json` exists.
2. Required manifest fields exist.
3. Referenced Context Packs exist.
4. Referenced Skills exist.
5. Referenced Context Packs are valid.
6. Referenced Skills are valid.
7. Export profile exists.
8. Target tool is supported.
9. Included Skills declare compatibility with the target.
10. Redaction rules exist if privacy mode is redacted.
11. Token budget can be estimated.
12. Agent Kit does not reference blocked or deprecated objects.
13. Agent Kit does not include unreviewed AI drafts unless explicitly allowed.
14. Agent Kit does not include sensitive records in public-safe exports.
15. Agent Kit does not claim executable capabilities.

## 17. Updated Health Requirements

### 17.1 Skill Health Signals

Skill Health should include:

1. Schema validity.
2. Instruction completeness.
3. Example coverage.
4. Source coverage.
5. Safety rules present.
6. Review status.
7. Last reviewed date.
8. Target compatibility.
9. Export readiness.
10. Disallowed pattern scan.
11. Deprecated target warnings.
12. Unreviewed AI draft warnings.

### 17.2 Agent Kit Health Signals

Agent Kit Health should include:

1. Context Pack health.
2. Skill health.
3. Pairing compatibility.
4. Target compatibility.
5. Export readiness.
6. Redaction readiness.
7. Token budget status.
8. Review status.
9. Broken reference count.
10. Sensitive data warning count.
11. Deprecated dependency count.
12. Unreviewed dependency count.

### 17.3 Health Labels

Use clear labels:

```text
Validation: Passing or Failing
Review: Approved, Pending, Draft, Blocked
Export: Ready, Warning, Blocked
Safety: Clear, Warning, Critical
```

Avoid confusing combinations such as:

```text
Health 100 percent plus Not Reviewed
```

## 18. Updated Export Requirements

### 18.1 Skill Export

Skill exports should include:

1. Skill summary.
2. Purpose.
3. Inputs.
4. Outputs.
5. Core instructions.
6. Output format.
7. Examples, optional.
8. Safety constraints.
9. Target-specific notes.
10. Source summary.

### 18.2 Agent Kit Export

Agent Kit exports should include:

1. Agent Kit summary.
2. Task goal.
3. Target AI tool.
4. Included Skills.
5. Included Context Packs.
6. Relevant records.
7. Output instructions.
8. Constraints.
9. Redaction notice.
10. Source summary.
11. Review status.
12. Date generated.

### 18.3 Target-Specific Export Rules

#### ChatGPT

Output should be readable Markdown with clear sections and concise instruction hierarchy.

#### Claude

Output may include deeper context, stronger constraints, and longer source summaries.

#### Codex

Output should prioritize implementation scope, files, commands to avoid, acceptance criteria, tests, and final report expectations.

#### Claude Code

Output should prioritize project conventions, repo state, instructions, task boundaries, safety rules, and target files.

#### Cursor

Output should prioritize project state, codebase instructions, relevant files, and specific task instructions.

#### Open WebUI

Output should prioritize general Markdown or JSON compatible with local workflows.

#### AnythingLLM

Output should prioritize document-style Markdown, source summaries, and chunk-friendly structure.

#### OpenClaw or Hermes

Output should prioritize agent instructions, context boundaries, and non-executable safety warnings.

## 19. Updated MCP Requirements

### 19.1 MCP Scope

MCP remains read-only in v0 and v1.

For Skills and Agent Kits, MCP must expose only approved, redaction-aware, non-executable content.

### 19.2 Future MCP Tools

Add later:

1. `list_skills`
2. `get_skill_summary`
3. `get_skill`
4. `list_agent_kits`
5. `get_agent_kit_summary`
6. `query_agent_kit_context`
7. `build_agent_kit_export_preview`

### 19.3 MCP Rules

1. No mutation.
2. No Skill execution.
3. No shell execution.
4. No browser automation.
5. No network access.
6. No secret access.
7. No raw private source dump unless explicitly configured.
8. Respect privacy and redaction rules.
9. Return approved content only by default.
10. Log local query metadata.

## 20. Updated Security Requirements

### 20.1 Skill Safety

Every Skill must pass validation before activation.

Required checks:

1. No executable files.
2. No scripts.
3. No shell commands.
4. No hidden binary payloads.
5. No remote script includes.
6. No API key patterns.
7. No credential request patterns.
8. No disallowed permissions.
9. Source map present.
10. License field present.
11. Trust level present.
12. Safety rules present.
13. Review status present.
14. Target compatibility declared.

### 20.2 Agent Kit Safety

Every Agent Kit must pass validation before export-ready status.

Required checks:

1. All referenced Context Packs exist.
2. All referenced Skills exist.
3. No blocked objects are included.
4. Redaction mode is valid.
5. Export profile is valid.
6. Target tool is supported.
7. Token estimate exists.
8. Sensitive records are flagged.
9. Unreviewed Skills are flagged.
10. Unreviewed Context Packs are flagged.
11. No executable capability is claimed.

### 20.3 Skill Trust Levels

Trust levels:

1. Official.
2. Verified.
3. Local.
4. Imported.
5. Unreviewed.
6. Deprecated.
7. Blocked.

v1 should only support:

1. Official demo Skills.
2. Local user-created Skills.
3. Imported unreviewed local Skills.

No public community Skill marketplace.

### 20.4 Installation Rules

v1:

1. Install from local folder.
2. Install from local zip.
3. Validate before activation.
4. Show contents and permissions.
5. Mark imported Skills as unreviewed.
6. Do not allow remote install by default.

Later only:

1. Install from GitHub URL with warnings.
2. Signature verification.
3. Trust model.
4. Review workflow.
5. Local allowlist.

## 21. Updated Architecture

### 21.1 Monorepo Additions

Add later:

```text
packages/skill-schema
packages/skill-validator
packages/agent-kit-schema
packages/agent-kit-validator
packages/kit-composer
skills-demo
agent-kits-demo
```

Alternative if keeping packages consolidated:

```text
packages/schema
  src/context-pack
  src/skill
  src/agent-kit

packages/pack-validator
  src/context-pack
  src/skill
  src/agent-kit

packages/export-profiles
  src/context-pack
  src/skill
  src/agent-kit
```

Preferred for v1:

Keep schema and validator packages consolidated to avoid package sprawl until the concept proves value.

### 21.2 Directory Additions

```text
contextarr/
  skills/
  agent-kits/
  demo-skills/
  demo-agent-kits/
```

Do not add these before core Context Pack phases are stable.

### 21.3 Database Table Additions

SQLite derived index should later add:

1. skills.
2. skill_instructions.
3. skill_sources.
4. skill_exports.
5. skill_health.
6. agent_kits.
7. agent_kit_context_packs.
8. agent_kit_skills.
9. agent_kit_exports.
10. agent_kit_health.
11. agent_kit_events.

SQLite remains rebuildable from local source folders except settings and logs.

### 21.4 Search Additions

Search should support:

1. Skills by name.
2. Skills by type.
3. Skills by compatible target.
4. Skills by input/output type.
5. Agent Kits by task.
6. Agent Kits by target tool.
7. Agent Kits by included Context Pack.
8. Agent Kits by included Skill.
9. Health status.
10. Review status.

## 22. Demo Content Additions

### 22.1 Demo Skills

Create later:

1. Support Ticket Writing Skill.
2. Bug Report Structuring Skill.
3. Claude Code Implementation Planning Skill.
4. Security Review Skill.
5. Research Synthesis Skill.
6. Homelab Troubleshooting Skill.
7. Internal KB Answering Skill.
8. Redacted Contractor Briefing Skill.

### 22.2 Demo Agent Kits

Create later:

1. Rep Portal Bug Ticket Agent Kit.
2. Contextarr Phase Implementation Agent Kit.
3. Homelab Troubleshooting Agent Kit.
4. Internal Support Answering Agent Kit.
5. Contractor Handoff Agent Kit.
6. AI Workstation Debugging Agent Kit.
7. Product Research Agent Kit.
8. Security Review Agent Kit.

All demo content must be fake or public-safe.

No real company data.

No credentials.

No private personal data.

No executable scripts.

## 23. Phase Plan Addition

This section adds future phases after the current PRD sequence.

The original Phase 0 through Phase 11 remain unchanged.

Do not begin these phases until Context Packs, validation, demo packs, local index, dashboard, renderer, health, exports, and read-only MCP are working.

### Phase 12: Terminology and Schema Planning

Goals:

1. Finalize terminology.
2. Decide whether Context Pack remains the core context object.
3. Define Skill as non-executable instruction artifact.
4. Define Agent Kit as composed pairing object.
5. Add documentation without implementation.

Deliverables:

1. `docs/skills.md`
2. `docs/agent-kits.md`
3. `docs/terminology.md`
4. `docs/non-executable-skills.md`
5. Updated README terminology section.
6. No app functionality required.

Acceptance criteria:

1. Docs clearly define Context Pack, Skill, Agent Kit, and Export Brief.
2. Docs state that Contextarr prepares but does not run Agent Kits.
3. Docs preserve all no-execution boundaries.
4. No schema code is added yet unless explicitly scoped.

### Phase 13: Skill Schema and Validator

Goals:

1. Define Skill manifest schema.
2. Define Skill instruction frontmatter schema.
3. Define Skill source map schema.
4. Define Skill export profile schema.
5. Define Skill safety rules schema.
6. Implement Skill validator.

Deliverables:

1. Zod schema for `contextarr-skill.json`.
2. Zod schema for Skill instruction frontmatter.
3. Zod schema for Skill safety rules.
4. CLI validation support:

```text
contextarr validate-skill <path>
```

or unified:

```text
contextarr validate <path>
```

5. JSON validation output.
6. Human-readable validation report.
7. Tests with valid and invalid Skill fixtures.

Acceptance criteria:

1. Valid demo Skill passes.
2. Skill containing script files fails.
3. Skill containing shell command patterns fails or produces critical warning.
4. Skill requesting credentials fails or produces high severity warning.
5. Missing source references fail.
6. Missing required metadata fails.
7. Tests pass.

Hard boundaries:

1. Do not build Skill execution.
2. Do not build Skill marketplace.
3. Do not build Agent Kits yet.
4. Do not add network installs.

### Phase 14: Demo Skills

Goals:

Create realistic fake demo Skills.

Demo Skills:

1. Support Ticket Writing Skill.
2. Bug Report Structuring Skill.
3. Claude Code Implementation Planning Skill.
4. Research Synthesis Skill.
5. Security Review Skill.
6. Homelab Troubleshooting Skill.
7. Internal KB Answering Skill.
8. Redacted Contractor Briefing Skill.

Each Skill must include:

1. `contextarr-skill.json`
2. README.md
3. LICENSE
4. CHANGELOG.md
5. Instruction Markdown files.
6. Example files.
7. `sources/sources.yaml`
8. Export profiles.
9. Safety rules.
10. Freshness rules.

Deliverables:

1. `demo-skills/`
2. Valid Skills.
3. Validation report.
4. No private data.
5. No executable scripts.

Acceptance criteria:

1. All demo Skills validate.
2. Each Skill has at least 3 instruction files.
3. Each Skill has at least 2 examples.
4. Each Skill has safety rules.
5. Each Skill has at least ChatGPT, Claude, and generic Markdown export profile.

### Phase 15: Skill Index and API

Goals:

1. Load Skills.
2. Index Skills into SQLite.
3. Expose Skill API endpoints.
4. Search Skills.

API endpoints:

1. `GET /api/skills`
2. `GET /api/skills/:id`
3. `GET /api/skills/:id/instructions`
4. `GET /api/skills/:id/examples`
5. `GET /api/skills/:id/exports`
6. `GET /api/search?type=skill&q=`
7. `POST /api/rescan`

Deliverables:

1. Skill loader.
2. Skill instruction loader.
3. Skill source loader.
4. SQLite tables.
5. Search integration.
6. Tests for loading demo Skills.

Acceptance criteria:

1. Demo Skills load into index.
2. API returns Skill metadata.
3. API returns instruction files.
4. Search finds Skills by name, type, target, and tags.
5. SQLite remains rebuildable from files.

### Phase 16: Skill Library UI

Goals:

1. Add Skills section to UI.
2. Add Skill Library views.
3. Add Skill detail page.
4. Add Skill instruction rendering.
5. Add Skill examples rendering.

Deliverables:

1. Skills nav item.
2. Skill library table.
3. Skill card view.
4. Skill detail page.
5. Instruction tab.
6. Examples tab.
7. Sources tab.
8. Health placeholder.

Acceptance criteria:

1. Demo Skills display cleanly.
2. Markdown rendering is sanitized.
3. Skill safety boundaries are visible.
4. Compatible targets are visible.
5. Review status is visible.

Hard boundaries:

1. No Skill execution buttons.
2. No run controls.
3. No tool-calling UI.
4. No marketplace UI.

### Phase 17: Skill Health and Review Queue

Goals:

1. Calculate Skill Health.
2. Generate Skill review items.
3. Show Skill issues in Review Queue.
4. Add deterministic Skill safety checks.

Health checks:

1. Missing required fields.
2. Missing examples.
3. Missing safety rules.
4. Stale review date.
5. Broken source references.
6. Invalid export profile.
7. Disallowed shell command patterns.
8. Credential request patterns.
9. Hidden instruction patterns.
10. Unreviewed AI drafts.

Deliverables:

1. Skill Health engine.
2. Review item generation.
3. Review Queue filters for Skills.
4. Skill Health badges.
5. Tests.

Acceptance criteria:

1. Unsafe Skill fixture is blocked or marked critical.
2. Missing safety rules produce warnings.
3. Broken source references produce review items.
4. Review Queue can filter by object type Skill.
5. Health score is explainable.

### Phase 18: Skill Export Engine

Goals:

1. Export Skills independently.
2. Support target-specific Skill exports.
3. Preview Skill export.
4. Copy or download Skill export.

Targets:

1. ChatGPT.
2. Claude.
3. Codex.
4. Claude Code.
5. Generic Markdown.
6. JSON.

Deliverables:

1. Skill export profile parser.
2. Skill export renderer.
3. CLI export command.
4. UI preview.
5. Copy and download.
6. Tests.

Acceptance criteria:

1. Demo Skills export to Markdown.
2. Target-specific sections render correctly.
3. Safety rules are included where appropriate.
4. Export respects privacy and review status.
5. Unreviewed Skills warn before export.

### Phase 19: Agent Kit Schema and Validator

Goals:

1. Define Agent Kit manifest schema.
2. Define Agent Kit export profile schema.
3. Define Agent Kit compatibility rules.
4. Implement Agent Kit validator.

Deliverables:

1. Zod schema for `contextarr-agent-kit.json`.
2. Zod schema for Agent Kit export profiles.
3. Zod schema for Agent Kit compatibility rules.
4. CLI validation support:

```text
contextarr validate-agent-kit <path>
```

or unified:

```text
contextarr validate <path>
```

5. Tests with valid and invalid Agent Kit fixtures.

Acceptance criteria:

1. Valid Agent Kit passes.
2. Missing referenced Context Pack fails.
3. Missing referenced Skill fails.
4. Incompatible target fails or warns.
5. Sensitive context without redaction warns or blocks depending profile.
6. Agent Kit claiming execution fails.

Hard boundaries:

1. Do not execute Agent Kits.
2. Do not add runtime.
3. Do not build background agent system.

### Phase 20: Demo Agent Kits

Goals:

Create realistic fake demo Agent Kits pairing existing demo Context Packs with demo Skills.

Demo Agent Kits:

1. Rep Portal Bug Ticket Agent Kit.
2. Contextarr Phase Implementation Agent Kit.
3. Homelab Troubleshooting Agent Kit.
4. Internal Support Answering Agent Kit.
5. Contractor Handoff Agent Kit.
6. AI Workstation Debugging Agent Kit.
7. Product Research Agent Kit.
8. Security Review Agent Kit.

Each Agent Kit must include:

1. `contextarr-agent-kit.json`
2. README.md
3. LICENSE
4. CHANGELOG.md
5. Export profiles.
6. Validation rules.
7. Redaction rules.
8. Compatibility rules.
9. Sample export.

Deliverables:

1. `demo-agent-kits/`
2. Valid Agent Kits.
3. Sample exports.
4. Validation reports.

Acceptance criteria:

1. All demo Agent Kits validate.
2. Each Agent Kit references valid demo Context Packs and demo Skills.
3. Each Agent Kit has at least one target-specific export profile.
4. No private data.
5. No executable content.

### Phase 21: Agent Kit Index and API

Goals:

1. Load Agent Kits.
2. Index Agent Kit relationships.
3. Expose Agent Kit API endpoints.
4. Search Agent Kits.

API endpoints:

1. `GET /api/agent-kits`
2. `GET /api/agent-kits/:id`
3. `GET /api/agent-kits/:id/context-packs`
4. `GET /api/agent-kits/:id/skills`
5. `GET /api/agent-kits/:id/export-preview`
6. `GET /api/search?type=agent-kit&q=`
7. `POST /api/rescan`

Deliverables:

1. Agent Kit loader.
2. Relationship resolver.
3. SQLite tables.
4. API endpoints.
5. Tests.

Acceptance criteria:

1. Demo Agent Kits load.
2. API resolves included Context Packs and Skills.
3. API flags broken references.
4. Search works by target, task, Skill, and Context Pack.

### Phase 22: Agent Kit Composer UI

Goals:

1. Add Agent Kit Composer.
2. Allow users to pair Context Packs and Skills.
3. Select target tool and export profile.
4. Preview output.
5. Save Agent Kit.

Composer steps:

1. Name Agent Kit.
2. Define task goal.
3. Select Context Packs.
4. Select records or tags.
5. Select Skills.
6. Select Skill sections.
7. Choose target tool.
8. Choose export profile.
9. Choose redaction mode.
10. Preview.
11. Save.

Deliverables:

1. Composer UI updates.
2. Agent Kit save flow.
3. Export preview.
4. Validation before save.
5. Token estimate.

Acceptance criteria:

1. User can create Agent Kit from existing demo Context Packs and Skills.
2. Invalid pairing warns user.
3. Redaction warnings appear.
4. Saved Agent Kit appears in Library.
5. No runtime execution is exposed.

### Phase 23: Agent Kit Detail UI and Health

Goals:

1. Add Agent Kit detail pages.
2. Show included Context Packs.
3. Show included Skills.
4. Show Agent Kit Health.
5. Show export preview.

Deliverables:

1. Agent Kit library view.
2. Agent Kit detail header.
3. Overview tab.
4. Context Packs tab.
5. Skills tab.
6. Rules tab.
7. Export Preview tab.
8. Health tab.

Acceptance criteria:

1. Demo Agent Kits display cleanly.
2. Health is explainable.
3. Broken references are visible.
4. Redaction warnings are visible.
5. Target compatibility is visible.

### Phase 24: Agent Kit Export Engine

Goals:

1. Build full Agent Kit exports.
2. Merge selected Context Pack content and Skill instructions.
3. Apply target-specific formatting.
4. Apply redaction rules.
5. Generate copyable and downloadable output.

Targets:

1. ChatGPT.
2. Claude.
3. Codex.
4. Claude Code.
5. Cursor.
6. OpenCode.
7. Open WebUI.
8. AnythingLLM.
9. Generic Markdown.
10. JSON.

Deliverables:

1. Agent Kit export parser.
2. Agent Kit export renderer.
3. Token estimate.
4. Redaction pipeline.
5. CLI export command.
6. UI preview.
7. Copy and download.
8. Tests.

Acceptance criteria:

1. Demo Agent Kits export successfully.
2. Included Skills appear before or beside relevant context according to profile.
3. Redaction rules apply.
4. Export warnings are visible.
5. CLI and UI produce matching deterministic output.

### Phase 25: Read-Only MCP for Skills and Agent Kits

Goals:

1. Extend read-only MCP to Skills.
2. Extend read-only MCP to Agent Kits.
3. Preserve no-mutation and no-execution boundaries.

MCP tools:

1. `list_skills`
2. `get_skill_summary`
3. `get_skill`
4. `list_agent_kits`
5. `get_agent_kit_summary`
6. `query_agent_kit_context`
7. `build_agent_kit_export_preview`

Deliverables:

1. MCP tool schemas.
2. MCP handlers.
3. Redaction-aware output.
4. Local query logs.
5. Docs.
6. Tests.

Acceptance criteria:

1. MCP can list approved Skills.
2. MCP can list approved Agent Kits.
3. MCP can retrieve Agent Kit summaries.
4. MCP does not mutate files.
5. MCP does not execute Skills.
6. MCP respects redaction rules.

### Phase 26: Local Skill Importers

Goals:

1. Import local data-only Skills.
2. Convert plain Markdown instructions into draft Skills.
3. Convert prompt templates into draft Skills.
4. Keep imported Skills unreviewed by default.

Supported imports:

1. Local folder.
2. Local zip.
3. Markdown folder.
4. Prompt template folder.
5. Claude-style skill folder, local only and non-executable content only.
6. ChatGPT prompt collection, basic.

Deliverables:

1. Import wizard.
2. Import CLI.
3. Draft Skill creation.
4. Review queue integration.
5. Safety scan.
6. Tests.

Acceptance criteria:

1. Imported Skills are marked unreviewed.
2. Disallowed files are blocked.
3. Scripts are blocked.
4. Shell command patterns produce critical warnings.
5. User can approve safe imported Skill after review.

### Phase 27: Agent Kit Templates

Goals:

1. Provide reusable Agent Kit templates.
2. Help users create task-ready kits faster.
3. Avoid creating an execution runtime.

Templates:

1. Coding task kit.
2. Support ticket kit.
3. Research brief kit.
4. Security review kit.
5. Homelab troubleshooting kit.
6. Contractor handoff kit.
7. Internal KB assistant kit.
8. Product comparison kit.

Deliverables:

1. Template schema.
2. Template library.
3. UI selection.
4. Generated draft Agent Kit.
5. Docs.

Acceptance criteria:

1. Templates produce valid draft Agent Kits.
2. Templates do not include private data.
3. Templates do not include executable instructions.
4. User must review before export-ready.

### Phase 28: Signing and Trust Model Research

Goals:

Research and design future trust model before any remote registry.

Topics:

1. Local signatures.
2. Checksums.
3. Author identity.
4. Trust levels.
5. Revocation.
6. Security review workflow.
7. Safe import warnings.
8. Abuse controls.
9. Community contribution process.
10. Private team registry requirements.

Deliverables:

1. `docs/signing-and-trust-model.md`
2. `docs/private-registry-requirements.md`
3. `docs/marketplace-non-goals.md`
4. No public marketplace implementation.

Acceptance criteria:

1. Trust model is documented.
2. Security risks are documented.
3. Public marketplace remains blocked.
4. Private registry is scoped as later only.

### Phase 29: Private Team Registry Prototype, Later Only

Goals:

Prototype private team distribution of Context Packs, Skills, and Agent Kits.

This phase is optional and only after strong pull.

Boundaries:

1. Private registry only.
2. Authenticated access only.
3. No public marketplace.
4. No anonymous uploads.
5. No executable content.
6. Validation before activation.
7. Manual review required.

Deliverables:

1. Private registry design.
2. Local registry client.
3. Admin approval workflow.
4. Signature verification.
5. Audit log.
6. Docs.

Acceptance criteria:

1. Only approved users can access registry.
2. All downloads validate before activation.
3. Unreviewed items are quarantined.
4. No remote execution.
5. No public discovery.

## 24. Codex Guidance for Future Skill and Agent Kit Work

### 24.1 Global Rules for Codex

Codex must follow these rules for all Skill and Agent Kit phases:

1. Do not implement execution.
2. Do not add shell command running.
3. Do not add browser automation.
4. Do not add API-calling Skills.
5. Do not add public marketplace.
6. Do not add remote install by default.
7. Do not add telemetry.
8. Do not include real private data.
9. Do not skip validation.
10. Do not build UI before schema and demo content exist.
11. Keep files as source of truth.
12. Keep SQLite rebuildable.
13. Require tests.
14. Produce final report.

### 24.2 Required Final Report Format

Each Codex phase must end with:

1. Summary.
2. Files created.
3. Files changed.
4. Commands run.
5. Tests run.
6. Checks passed.
7. Blockers.
8. Security notes.
9. Next recommended prompt.

## 25. Success Criteria for Skill and Agent Kit Addition

### 25.1 Technical Success

The addition succeeds if:

1. Skills validate as data-only instruction artifacts.
2. Agent Kits can pair Skills and Context Packs.
3. Agent Kits export useful task-ready briefs.
4. Health and review queues catch unsafe or stale objects.
5. MCP exposes Skills and Agent Kits read-only.
6. Files remain readable and source-backed.
7. SQLite remains rebuildable.
8. No execution capability is added.

### 25.2 User Success

The addition succeeds if users:

1. Reuse the same Skill across multiple Context Packs.
2. Reuse the same Context Pack with multiple Skills.
3. Export Agent Kits to more than one AI tool.
4. Ask for target-specific adapters.
5. Ask for better Skill templates.
6. Create their own local Skills.
7. Maintain Agent Kits over time.

### 25.3 Monetization Signals

Signals:

1. Users ask for paid Skill templates.
2. Users ask for Agent Kit setup services.
3. Teams ask for private Agent Kit libraries.
4. Consultants want client-specific Agent Kits.
5. Users ask for a paid desktop UX for composing Agent Kits.

### 25.4 Kill or Pause Signals

Pause if:

1. Users confuse Agent Kits with an agent runner.
2. Users mainly ask for execution features.
3. Skill validation becomes a security burden.
4. Agent Kit composition feels too complex.
5. Users do not reuse Skills.
6. Users do not export Agent Kits.
7. The feature distracts from core Context Pack adoption.

## 26. Updated Demo Script

Title:

```text
Skills tell agents how to work. Context Packs tell agents what to know.
```

Flow:

1. Open a fresh ChatGPT, Claude, or Codex session.
2. Ask it to perform a task with no context and no Skill.
3. Show weak or generic result.
4. Open Contextarr.
5. Show a Context Pack with source-backed knowledge.
6. Show a Skill with reusable task instructions.
7. Open Composer.
8. Pair the Context Pack and Skill into an Agent Kit.
9. Select target AI tool.
10. Preview redacted export.
11. Copy export into AI tool or access through read-only MCP.
12. Ask same task again.
13. Show improved answer.
14. Show raw local files to prove ownership.
15. Show that no Skills were executed by Contextarr.

## 27. Final Recommendation

Add Skills and Agent Kits to the future Contextarr roadmap.

Do not add them before the current PRD core is complete.

The correct product evolution is:

```text
Phase 0 to Phase 11:
Context Packs, validation, demo packs, local index, dashboard, rendering, health, exports, read-only MCP.

Phase 12 onward:
Skills, Skill validation, Skill Library, Agent Kits, Agent Kit Composer, Agent Kit exports, read-only MCP for Agent Kits.
```

The key strategic line is:

```text
Skills tell agents how to work.
Context Packs tell agents what to know.
Agent Kits combine both for a specific task.
```

The key safety line is:

```text
Contextarr prepares Agent Kits. It does not run them.
```

This addition gives Contextarr a larger future category while preserving the original security posture, local-first trust model, and Context Pack foundation.
