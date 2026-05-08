# Contextarr Skills

Skills are future Contextarr objects for reusable AI work instructions. Phase 12 documents the concept only. No schema code is added in Phase 12.

## Definition

A Skill is a local, source-backed, non-executable instruction artifact that tells an AI assistant or agent how to do a specific kind of work.

Examples:

- Support ticket writing.
- Bug report structuring.
- Implementation planning.
- Research synthesis.
- Security review.
- Homelab troubleshooting.
- Internal KB answering.

## Future Contents

A future Skill folder may include:

- A Skill manifest.
- Instruction Markdown.
- Examples.
- Source map.
- Validation, safety, and freshness rules.
- Target compatibility metadata.
- Review metadata.

The exact schema begins in Phase 13.

## Safety Rules

Skills must remain data-only. A Skill must not include scripts, shell commands, browser automation, hidden network calls, API keys, credential prompts, runtime plugins, background tasks, or tool execution logic.

Contextarr may validate, review, index, preview, pair, and export Skills in later phases. Contextarr must not execute Skills.

## Review Model

Skills should have source metadata, author metadata, review status, and compatibility notes. AI-drafted Skills must enter review before they are approved for exports or Agent Kits.

## Phase 12 Boundary

Phase 12 does not implement `contextarr-skill.json`, Skill instruction frontmatter, Skill validation, demo Skills, Skill Library UI, Skill health, Skill exports, or MCP Skill tools.
