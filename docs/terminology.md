# Contextarr Terminology

Phase 12 starts the second PRD track by locking vocabulary before implementation. No schema code is added in Phase 12.

## Core Terms

### Context Pack

A Context Pack is a structured, versioned, source-backed bundle of reusable context. It tells an AI assistant or agent what it needs to know.

Context Packs remain the core source-of-truth object in Contextarr. Pack folders are still local files, and derived indexes, exports, render output, and MCP responses must remain rebuildable.

### Skill

A Skill is a structured, reusable, non-executable instruction artifact. It tells an AI assistant or agent how to perform a type of work.

In Contextarr, a Skill is data-only. It may contain instructions, decision rules, examples, output formats, constraints, safety rules, compatibility metadata, and review metadata. It must not contain executable scripts, shell commands, hidden network calls, API keys, browser automation, tool execution logic, credential prompts, background tasks, or runtime plugins.

### Agent Kit

An Agent Kit is a task-ready pairing of one or more Context Packs with one or more Skills, plus target, export profile, redaction rules, compatibility metadata, and kit-specific usage instructions.

Contextarr prepares Agent Kits. It does not run them.

Every Agent Kit must be self-describing. It does not require a separate Skill to explain how it should be used.

### Export Brief

An Export Brief is a generated output artifact for an AI tool or human. It may be built from a Context Pack, a Skill, an Agent Kit, or selected records and instructions.

An Export Brief is not source of truth. It is derived output.

## Relationship

```text
Context Packs tell agents what to know.
Skills tell agents how to work.
Agent Kits tell agents how this specific bundle should be used for this specific task.
Export Briefs are generated from those ingredients.
```

## Phase 12 Boundary

Phase 12 defines the language and guardrails only. It does not add Skill schemas, Agent Kit schemas, validation logic, demo Skills, demo Agent Kits, UI, API endpoints, MCP extensions, importers, export engines, marketplace behavior, telemetry, cloud services, or execution behavior.
