# Non-Executable Skills

Contextarr Skills are instruction artifacts, not executable plugins. This boundary is part of the product definition.

## Core Rule

Contextarr prepares Agent Kits. It does not run them.

Skills may describe how an AI assistant should work, but they must not give Contextarr the ability to perform that work.

Skills should not be used as bootloaders whose only purpose is explaining how to use Agent Kits. Every Agent Kit must carry its own usage instructions, task goal, output contract, and safety boundary.

## Forbidden In Skills

Skills must not contain or request:

- Executable scripts.
- Shell commands.
- Browser automation.
- Hidden network calls.
- API-calling behavior.
- Runtime plugins.
- Credential prompts.
- API keys or secrets.
- Background tasks.
- Autonomous actions.
- Tool execution logic.

## Future Validation Direction

Phase 13 should make these rules machine-checkable for Skill manifests, instruction files, source maps, and safety rules.

Validation should fail or warn when Skills include executable files, command patterns, credential patterns, hidden network assumptions, missing source references, missing review metadata, or unsafe compatibility claims.

## Export And MCP Direction

Future Skill and Agent Kit exports must preserve redaction rules, review status, and target compatibility. Future MCP exposure must stay read-only and must not execute Skills or mutate files.

## Phase 12 Boundary

No schema code is added in Phase 12. This document is a product and safety guardrail for later implementation phases.
