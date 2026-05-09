# Contextarr Agent Kits

Agent Kits are Contextarr objects for pairing reusable instructions with source-backed context. Phase 27 supports schemas, validation, public-safe demo Agent Kits, read-only SQLite indexing/search, a local Composer save flow, Library/detail/health surfaces, profile-driven export generation, read-only MCP exposure, and public-safe data-only templates.

## Definition

An Agent Kit is a task-ready pairing of one or more Skills with one or more Context Packs, plus target tool, export format, redaction rules, compatibility metadata, and kit-specific usage instructions.

Contextarr prepares Agent Kits. It does not run them.

## Agent Kit Self-Description Requirement

Every Agent Kit must be self-describing. An Agent Kit does not require a separate Skill to explain how it should be used. The Agent Kit itself must include usage instructions that tell the target AI assistant or agent how to interpret the kit, what task it is for, which Skills and Context Packs are included, what boundaries apply, and what output is expected.

```text
Skills tell agents how to work.
Context Packs tell agents what to know.
Agent Kits tell agents how this specific bundle should be used for this specific task.
```

Skills are reusable task capability modules. Agent Kit usage instructions are kit-specific operating instructions. Skills should not be used as bootloaders whose only purpose is explaining how to use Agent Kits.

## Intended Use

Agent Kits are meant to make repeated AI-assisted work safer and more consistent:

- Select the relevant Context Packs.
- Select the relevant Skills.
- Apply privacy and redaction rules.
- Choose a target tool such as ChatGPT, Claude, Codex, Claude Code, Cursor, OpenCode, Open WebUI, AnythingLLM, Hermes, OpenClaw, or a local MCP client.
- Generate an Export Brief for use outside Contextarr.

## Current Data Shape

An Agent Kit references:

- Task goal.
- Agent role.
- Usage instructions file.
- Output contract.
- Execution boundary.
- Included Context Packs.
- Included Skills.
- Target tool and default export profile.
- Target-specific export profile YAML files.
- Redaction, validation, and compatibility rules.
- Compatibility notes.

The public-safe examples live under `demo-agent-kits/` and remain read-only demo source material. Locally composed Agent Kits are saved under `CONTEXTARR_AGENT_KITS_DIR`, which defaults to ignored `agent-kits/`.

Phase 27 adds public-safe templates under `agent-kit-templates/`. The default template root is `CONTEXTARR_AGENT_KIT_TEMPLATES_DIR=./agent-kit-templates`. Templates are committed source material; generated Agent Kits are not. Template-created kits are written only as unreviewed local drafts under `CONTEXTARR_AGENT_KITS_DIR`.

## Read-Only API

Phase 21 and Phase 22 add local API endpoints:

- `GET /api/agent-kits`
- `GET /api/agent-kits/:id`
- `GET /api/agent-kits/:id/context-packs`
- `GET /api/agent-kits/:id/skills`
- `GET /api/agent-kits/:id/exports`
- `GET /api/agent-kits/:id/exports/:profileId/preview`
- `GET /api/search?type=agent-kit&q=`
- `GET /api/agent-kits/:id/health`
- `POST /api/agent-kits`
- `GET /api/agent-kit-templates`
- `GET /api/agent-kit-templates/:id`
- `POST /api/agent-kit-templates/:id/create`

`POST /api/agent-kits` accepts metadata plus selected Context Pack IDs and Skill IDs. It does not accept a filesystem path. The server writes a data-only Agent Kit inside the configured local Agent Kit directory, validates it before indexing, and then refreshes the derived SQLite index.

`POST /api/agent-kit-templates/:id/create` applies a validated template and safe request overrides, then writes through the same Agent Kit writer. It does not accept arbitrary paths, trust overrides, execution flags, or overwrite behavior.

The preview route returns a generated local export artifact plus selected relationship summaries. It is read-only and does not execute Skills, run Agent Kits, fetch URLs, call AI APIs, or write generated files.

## Phase 23: Library, Detail, and Health

Phase 23 adds read-only Agent Kit Library and detail surfaces and local-only health/review material.

- Library and detail are derived views of local Agent Kit files and SQLite state.
- Health checks are deterministic and persisted as local status rows.
- No Agent Kit runner, evaluator, or execution endpoint is added.
- Agent Kit health/detail exports stay read-only and do not modify source files.

Future schema examples must include:

```json
{
  "taskGoal": "Draft a clear support ticket from user notes, screenshots, and relevant support context.",
  "agentRole": "Support ticket drafting assistant",
  "usageInstructionsPath": "instructions/usage.md",
  "outputContract": "Return a ticket draft with title, issue, observed behaviour, expected behaviour, reproduction steps, impact, and notes.",
  "executionBoundary": "Contextarr prepares this Agent Kit. It does not run agents, execute Skills, call tools, or perform actions."
}
```

## Recommended Folder Shape

```text
agent-kits/
  support-ticket-kit/
    contextarr-agent-kit.json
    README.md
    CHANGELOG.md
    LICENSE
    instructions/
      usage.md
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

## Export Requirements

Every Agent Kit export must begin with Agent Kit Instructions before included Skills or Context Pack content.

```markdown
# Agent Kit Instructions

You are using the [Agent Kit Name] Agent Kit.

## Task Goal
...

## Agent Role
...

## Included Skills
...

## Included Context Packs
...

## Usage Rules
...

## Output Contract
...

## Safety Boundary
Contextarr prepared this Agent Kit. Contextarr does not execute it.
```

## Future Validation Requirements

Agent Kit validation must warn or fail when:

- `taskGoal` is missing.
- `agentRole` is missing.
- `usageInstructionsPath` is missing.
- The usage instruction file is missing.
- `outputContract` is missing.
- `executionBoundary` is missing.
- An export profile does not include an Agent Kit Instructions opening section.
- The Agent Kit depends on a Skill whose only purpose is explaining how to use Agent Kits.

These checks must be included from the first Agent Kit schema and validator phase. Self-description must not be deferred to later polish.

## Future Health Signals

Agent Kit Health should include:

- Self-description completeness.
- Usage instructions present.
- Output contract present.
- Safety boundary present.

## Source Of Truth

Agent Kit source files are local, inspectable, and versionable. Generated Export Briefs, previews, search indexes, and MCP responses remain derived artifacts.

## Phase 24: Export Engine

Phase 24 builds deterministic Agent Kit export previews by merging profile-selected Context Pack records and Skill documents. Export generation strips local source paths, excludes secret and `never_export` content, preserves profile order, and exposes copy/download in the browser without server-side generated-file writes.

## Phase 25: Read-Only MCP

Phase 25 exposes Agent Kits through local stdio MCP tools:

- `list_agent_kits`
- `get_agent_kit_summary`
- `query_agent_kit_context`
- `build_agent_kit_export_preview`

These tools reuse the derived SQLite index and local export engine. They do not write Agent Kit files, run Agent Kits, execute Skills, fetch URLs, call AI APIs, expose local filesystem paths, or bypass redaction rules.

## Phase 27: Templates

Phase 27 adds eight public-safe templates: coding task, support ticket, research brief, security review, homelab troubleshooting, contractor handoff, internal KB assistant, and product comparison.

Templates prefill the Agent Kit Composer with suggested Context Packs, Skills, target, format, redaction mode, and token budget. The user still reviews the draft before saving. Saved template drafts use `trustLevel: "unreviewed"` and `lastReviewedAt: null`.

## Boundaries

Contextarr does not implement registry behavior, marketplace behavior, cloud behavior, telemetry, arbitrary path writes, or Agent Kit execution behavior.
