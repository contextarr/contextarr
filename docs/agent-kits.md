# Contextarr Agent Kits

Agent Kits are future Contextarr objects for pairing reusable instructions with source-backed context. Phase 12 documents the concept only. No schema code is added in Phase 12.

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

## Future Data Shape

A future Agent Kit may reference:

- Task goal.
- Agent role.
- Usage instructions file.
- Output contract.
- Execution boundary.
- Included Context Packs.
- Included Skills.
- Selected records or instruction files.
- Target and format.
- Export profile.
- Redaction and exclusion rules.
- Health and review metadata.
- Compatibility notes.

The exact schema begins in Phase 19.

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

Agent Kit source files will be local, inspectable, and versionable. Generated Export Briefs, previews, search indexes, and MCP responses remain derived artifacts.

## Phase 12 Boundary

Phase 12 does not implement Agent Kit schemas, demo Agent Kits, Agent Kit indexing, Agent Kit API endpoints, Agent Kit Composer UI, Agent Kit exports, MCP Agent Kit tools, registry behavior, marketplace behavior, cloud behavior, telemetry, or execution behavior.
