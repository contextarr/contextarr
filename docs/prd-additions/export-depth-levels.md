# Contextarr PRD Addition: Export Depth Levels

## 1. Purpose

This document adds Export Depth Levels to the Contextarr product plan.

This addition does not replace the existing Contextarr PRD. It extends the Export Profile and Export Brief model.

The existing product remains:

```text
Local sources in.
Validated Context Packs out.
Human-readable dashboard.
Redaction-aware exports.
Read-only MCP.
```

This addition clarifies that export target and export depth are separate.

Example:

```yaml
target: chatgpt
depth: standard
privacy_mode: redacted
```

Export target defines where the export is going.

Export depth defines how much context is included and how it is packaged.

## 2. Strategic Summary

Contextarr should not treat a ChatGPT export, Codex export, file-upload bundle, and MCP query entry point as the same shape.

Most AI tools can understand the same underlying context, but they do not consume context the same way.

Web chat needs self-contained briefs.

Agents and MCP clients need queryable entry points.

File-upload workflows need multi-file bundles.

Human review needs readable source-backed reports.

Export Depth Levels allow Contextarr to keep one canonical source of truth while generating the right slice for the selected tool, task, privacy mode, and workflow.

The core principle is:

```text
Build context once.
Review it once.
Export the right depth for the tool and task.
```

## 3. Product Definition

An Export Depth Level is a named packaging strategy used by an Export Profile.

It controls:

1. How much content is included.
2. Whether output is a single file or multi-file bundle.
3. Whether output is self-contained or query-oriented.
4. Whether source summaries are short or detailed.
5. Whether full records, summaries, or selected facts are included.
6. Whether the output is meant for web chat, agent/MCP, file upload, human audit, or archive.
7. How token budget warnings are generated.
8. How redaction and review warnings are surfaced.

## 4. Core Vocabulary

### 4.1 Export Target

The destination or consumer of an export.

Examples:

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
13. llms.txt.
14. AGENTS.md.
15. CLAUDE.md.
16. Read-only MCP.

### 4.2 Export Depth

The amount and packaging style of context included in an export.

Supported export depths:

1. capsule.
2. standard.
3. deep.
4. full.
5. attachment_bundle.
6. mcp_query.

### 4.3 Export Brief

The generated output sent to an AI tool or human.

An Export Brief may be generated from:

1. A Context Pack.
2. A selected set of Context Pack records.
3. A Skill, later.
4. An Agent Kit, later.
5. A Composer selection.

### 4.4 Attachment Bundle

An Attachment Bundle is a multi-file export for targets that support file upload.

It is useful when a single pasted prompt is too dense, too long, or too hard to inspect.

### 4.5 MCP Query Export

An MCP Query export is a minimal starter export for MCP-capable clients.

It should not contain all context. It should describe the available approved context and how the client should query it through read-only MCP tools.

## 5. Export Depth Levels

### 5.1 capsule

A compact task-starting brief.

Use for:

1. Quick chat prompts.
2. Lightweight handoffs.
3. Initial agent instructions.
4. Small follow-up tasks.
5. High-level orientation.

Typical size:

500 to 1,500 tokens.

Typical contents:

1. Task goal.
2. Short Context Pack summary.
3. Short Skill summary, later.
4. Top relevant records.
5. Key constraints.
6. Redaction notice.
7. Output format.

Recommended defaults:

- Web chat: allowed.
- Agent/MCP: allowed as entry point.
- Human audit: insufficient.
- Complex project work: usually too brief.

### 5.2 standard

A self-contained working brief for most web chat use.

Use for:

1. ChatGPT.
2. Claude.
3. Local web chat interfaces.
4. Normal support tasks.
5. Planning tasks.
6. Research synthesis.
7. Writing tasks.
8. Light coding guidance.

Typical size:

2,000 to 8,000 tokens.

Typical contents:

1. Start-here instructions.
2. Task goal.
3. Included Context Pack records.
4. Included Skill instructions, later.
5. Output format.
6. Constraints.
7. Source summary.
8. Redaction notice.
9. Known warnings.

Recommended defaults:

- ChatGPT: default.
- Claude: default for normal web chat.
- Generic Markdown: default.
- Contractor handoff: default when redacted.
- MCP: not default.

### 5.3 deep

A larger standalone brief for complex tasks.

Use for:

1. Strategic work.
2. Detailed project planning.
3. Complex troubleshooting.
4. Major implementation planning.
5. Long-context Claude or ChatGPT sessions.
6. Large project review.
7. High-context research tasks.

Typical size:

8,000 to 25,000+ tokens.

Typical contents:

1. Full task framing.
2. Full relevant Skill instructions, later.
3. Expanded Context Pack records.
4. Relevant decisions.
5. Known constraints.
6. Examples.
7. Source notes.
8. Health warnings.
9. Redaction summary.
10. Export readiness warnings.

Recommended defaults:

- Claude long-context: optional.
- ChatGPT long-context: optional.
- Codex planning: optional.
- Contractor handoff: only if explicitly requested and redacted.
- MCP: not default.

### 5.4 full

A near-complete export of approved selected content.

Use for:

1. Archival handoff.
2. Manual audit.
3. High-context model sessions.
4. Large-window tools.
5. Migration review.
6. Full local review.

Typical size:

Large. Token budget warnings are likely.

Typical contents:

1. All selected approved records.
2. Full selected source summaries.
3. Full selected Skill instructions, later.
4. Review status.
5. Redaction report summary.
6. Validation report summary.
7. Source map summary.
8. Pack Health summary.

Recommended defaults:

- Human audit: allowed.
- Large context chat: optional.
- Contractor handoff: not default.
- MCP: not default.
- Public-safe export: only if every included record is public-safe.

### 5.5 attachment_bundle

A multi-file export bundle for tools that support file upload.

Use for:

1. ChatGPT file uploads.
2. Claude project files.
3. Consultant handoff.
4. Manual review.
5. Large context transfer.
6. Audit workflows.

Typical files:

```text
00-start-here.md
01-context-pack.md
02-records.md
03-source-summary.md
04-health-and-redaction.json
05-validation-report.json
```

For Agent Kits later:

```text
00-start-here.md
01-agent-kit.md
02-skill-instructions.md
03-context-records.md
04-source-summary.md
05-health-and-redaction.json
06-validation-report.json
```

Typical contents:

1. Start-here instructions.
2. Manifest summary.
3. Included records.
4. Included instructions, later.
5. Source summaries.
6. Health warnings.
7. Redaction warnings.
8. Validation report.
9. Export metadata.

Recommended defaults:

- ChatGPT file upload: recommended for large exports.
- Claude project upload: recommended for large exports.
- Human audit: recommended.
- MCP: not default.

### 5.6 mcp_query

A minimal entry-point export for MCP-capable agents.

Use for:

1. Local agents.
2. Claude Desktop with MCP.
3. Codex or other MCP-capable clients.
4. Contextarr read-only MCP.
5. Local automation clients that can query approved context.

Typical size:

500 to 2,000 tokens.

Typical contents:

1. Agent Kit or Context Pack summary.
2. Available read-only tools.
3. Query guidance.
4. Approved record scopes.
5. Redaction rules.
6. Privacy boundaries.
7. Result size limits.
8. Instruction to query rather than ask the user to paste all context.

Recommended defaults:

- MCP-capable clients: default.
- Web chat without MCP: insufficient.
- File-upload workflows: not appropriate.

## 6. Default Depth by Target

Use these defaults unless overridden by the user or profile.

| Target | Default depth | Notes |
|---|---|---|
| chatgpt | standard | Use attachment_bundle when file upload is available and context is large. |
| claude | standard | Use deep for long-context work. Use attachment_bundle for project upload. |
| codex | standard | Use deep for implementation planning. |
| claude_code | mcp_query or standard | Prefer mcp_query when MCP is available, otherwise use standard or deep project brief. |
| cursor | standard | Use mcp_query when connected to MCP. |
| opencode | standard | Use mcp_query when connected to MCP. |
| open_webui | standard | Use generic Markdown-compatible structure. |
| anythingllm | attachment_bundle | Prefer chunk-friendly documents. |
| hermes | mcp_query | Prefer queryable local context if available. |
| openclaw | mcp_query | Must preserve non-executable boundaries. |
| generic_markdown | standard | Human-readable, copyable. |
| json | full | Machine-readable selected records. |
| llms_txt | standard | Public-safe or approved selected records only. |
| agents_md | standard | Agent instruction and project context. |
| claude_md | standard | Claude-specific project context. |
| read_only_mcp | mcp_query | Queryable context, least disclosure by default. |

## 7. Export Profile Schema Addition

Later implementation should extend export profiles with:

```ts
type ExportDepth =
  | "capsule"
  | "standard"
  | "deep"
  | "full"
  | "attachment_bundle"
  | "mcp_query";
```

Example:

```yaml
id: chatgpt-standard
name: ChatGPT Standard Brief
target: chatgpt
format: markdown
depth: standard
privacy_mode: redacted
token_budget: 8000
include:
  records:
    - ai-workstation.local-ai-stack
exclude_tags:
  - secret
  - never_export
sections:
  - start_here
  - task_goal
  - relevant_context
  - constraints
  - output_format
  - redaction_notice
  - sources
```

Attachment bundle example:

```yaml
id: chatgpt-attachment-bundle
name: ChatGPT Attachment Bundle
target: chatgpt
format: markdown_bundle
depth: attachment_bundle
privacy_mode: redacted
token_budget: 50000
bundle:
  files:
    - id: start_here
      path: 00-start-here.md
      sections:
        - task_goal
        - how_to_use_bundle
        - redaction_notice
    - id: context_pack
      path: 01-context-pack.md
      sections:
        - pack_summary
        - included_records
    - id: source_summary
      path: 03-source-summary.md
      sections:
        - sources
        - license_notes
    - id: health
      path: 04-health-and-redaction.json
      sections:
        - health
        - redaction_report
```

MCP query example:

```yaml
id: local-agent-mcp-query
name: Local Agent MCP Query Entry
target: read_only_mcp
format: markdown
depth: mcp_query
privacy_mode: redacted
token_budget: 2000
sections:
  - kit_or_pack_summary
  - available_mcp_tools
  - query_guidance
  - privacy_boundaries
  - result_limits
```

## 8. Export Readiness Rules

Export readiness must evaluate target and depth together.

Add warnings:

### export.depth.too_brief

The selected depth may not include enough context for standalone web chat use.

Example:

```yaml
target: chatgpt
depth: capsule
selected_task: implementation_plan
reason: task likely requires more records and constraints
```

### export.depth.too_large

The selected depth likely exceeds the target token budget.

Example:

```yaml
target: chatgpt
depth: full
estimated_tokens: 85000
token_budget: 24000
```

### export.depth.attachment_recommended

The selected export is large enough that an attachment bundle would be safer than a pasted brief.

### export.depth.mcp_recommended

The selected target supports MCP or agent querying and would benefit from mcp_query mode.

### export.depth.not_self_contained

The selected export assumes queryable context and is not suitable for web chat without MCP access.

### export.depth.privacy_risk

The selected depth includes broader context than the selected task requires.

## 9. Export Depth Rules

1. Export target and export depth are separate fields.
2. Web chat targets default to standard.
3. MCP-capable targets default to mcp_query.
4. File-upload workflows may recommend attachment_bundle.
5. Large-window tools may allow deep or full.
6. Redaction rules apply at every depth.
7. Privacy mode applies at every depth.
8. Review status applies at every depth.
9. Token budget applies at every depth.
10. Export preview must show estimated token count.
11. Export preview must warn when selected depth is likely too brief for standalone use.
12. Export preview must warn when selected depth exceeds target token budget.
13. Export preview must warn when attachment bundle is recommended.
14. Export preview must warn when MCP query mode is selected for a non-MCP workflow.
15. Export depth must never include draft records by default.
16. Export depth must never include blocked records.
17. Export depth must never include unreviewed AI-generated content by default.
18. Export depth must not bypass redaction rules.
19. Export depth must not bypass privacy mode.
20. Export depth must not bypass source trust or license warnings.
21. Export depth must not cause Contextarr to execute code, run tools, or call networks.

## 10. UI Requirements

When exporting, the UI should allow the user to choose:

1. Target.
2. Depth.
3. Privacy mode.
4. Token budget.
5. Included packs.
6. Included records.
7. Included Skills later.
8. Included Agent Kit later.
9. Output format.
10. Copy or download.

Export preview must show:

1. Estimated tokens.
2. Included record count.
3. Excluded record count.
4. Redaction warnings.
5. Source warnings.
6. License warnings.
7. Stale warnings.
8. Export depth warnings.
9. Whether output is self-contained.
10. Whether attachment bundle is recommended.
11. Whether MCP query mode is recommended.
12. Whether target/depth/profile is blocked.

## 11. CLI Requirements

Later implementation should support:

```bash
contextarr export <pack-id> --target chatgpt --depth standard --privacy redacted
contextarr export <pack-id> --target chatgpt --depth attachment_bundle --out ./exports/kit
contextarr export <pack-id> --target read_only_mcp --depth mcp_query
```

Rules:

1. `--depth` defaults from target when omitted.
2. CLI should warn when depth is inappropriate for target.
3. CLI should require an output directory for `attachment_bundle`.
4. CLI should emit deterministic output for the same source, target, depth, and privacy settings.
5. CLI should never export draft or blocked content by default.

## 12. MCP Requirements

For MCP-capable workflows:

1. `mcp_query` depth should be the default.
2. The static entry brief should be small.
3. The AI client should query approved records through read-only MCP.
4. MCP must enforce redaction.
5. MCP must enforce approved-content-only defaults.
6. MCP must respect result size limits.
7. MCP must not mutate files.
8. MCP must not execute Skills.
9. MCP must not run shell commands.
10. MCP must not call external services.

## 13. Skills and Agent Kits Integration

This addition applies to future Skills and Agent Kits after the core Context Pack system is complete.

Skill exports should support the same depth model where relevant:

1. capsule.
2. standard.
3. deep.
4. full.
5. attachment_bundle.
6. mcp_query.

Agent Kit exports should support all depth levels.

Agent Kit export profile example:

```yaml
id: rep-portal-bug-ticket-standard
name: Rep Portal Bug Ticket Standard Brief
target: chatgpt
format: markdown
depth: standard
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
  - start_here
  - kit_summary
  - task_goal
  - included_skills
  - relevant_context
  - output_format
  - constraints
  - redaction_notice
  - sources
```

Agent Kit attachment bundle example:

```yaml
id: rep-portal-bug-ticket-bundle
name: Rep Portal Bug Ticket Attachment Bundle
target: chatgpt
format: markdown_bundle
depth: attachment_bundle
privacy_mode: redacted
bundle:
  files:
    - id: start_here
      path: 00-start-here.md
    - id: agent_kit
      path: 01-agent-kit.md
    - id: skills
      path: 02-skill-instructions.md
    - id: context
      path: 03-context-records.md
    - id: sources
      path: 04-source-summary.md
    - id: health
      path: 05-health-and-redaction.json
```

Agent Kit MCP query example:

```yaml
id: rep-portal-bug-ticket-mcp
name: Rep Portal Bug Ticket MCP Query Entry
target: read_only_mcp
format: markdown
depth: mcp_query
privacy_mode: redacted
sections:
  - kit_summary
  - available_mcp_tools
  - query_guidance
  - privacy_boundaries
  - result_limits
```

## 14. Phase Placement

Do not implement Export Depth Levels in Phase 1 to Phase 3.

Planning only:

Add this document now.

Implementation later:

1. Phase 7 or Phase 8, depending on current repo phase naming: Context Pack export depth.
2. Phase 18 of the v1 plan: export profile maturity and target adapters.
3. Phase 24 of the Skills and Agent Kits roadmap: Agent Kit export depth.
4. Phase 25 of the Skills and Agent Kits roadmap: MCP query mode refinement for Agent Kits.

If the repo uses the v1 bridge plan, implement first in the Context Pack export engine phase, then extend later to Skills and Agent Kits only after those objects exist.

## 15. Non-Goals

This addition does not add:

1. New source of truth.
2. New pack format replacement.
3. Executable exports.
4. Runtime agent behavior.
5. Chat UI.
6. Hosted export service.
7. Public share links.
8. Public GEO pack hosting.
9. Marketplace.
10. Skills implementation.
11. Agent Kits implementation.
12. MCP implementation.
13. Importers.
14. AI summarization.
15. Automatic approval.
16. Cloud sync.
17. Telemetry.

## 16. Success Criteria

This addition succeeds if:

1. Export target and export depth are understood as separate concepts.
2. Web chat exports can be self-contained.
3. MCP exports can stay small and query-oriented.
4. Attachment bundles solve large-context web chat workflows.
5. Users can choose concise or deep output intentionally.
6. Export previews warn when an export is too brief, too large, not self-contained, or privacy-risky.
7. The same canonical Context Pack can produce multiple safe export shapes.
8. Redaction and review rules apply at every depth.
9. Future Skills and Agent Kits inherit the same export depth model.
10. No implementation leaks into Phase 1 to Phase 3.

## 17. Final Recommendation

Add Export Depth Levels as a standalone PRD addition.

Do not edit the main PRD.

Do not implement yet.

Use the addition later to guide export engine, Agent Kit export, attachment bundle, and MCP query-mode work.
