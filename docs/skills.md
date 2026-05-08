# Contextarr Skills

Skills are Contextarr objects for reusable AI work instructions. Phase 12 introduced the terminology; Phases 13 through 18 add non-executable Skill schemas, validation, demo Skills, indexing, read-only API surfaces, the Skill Library, deterministic Skill Health and review items, and profile-driven Skill exports. Phase 25 exposes approved Skill metadata and privacy-aware documents through the read-only MCP server.

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

## Contents

A Skill folder may include:

- A Skill manifest.
- Instruction Markdown.
- Examples.
- Source map.
- Validation, safety, and freshness rules.
- Target compatibility metadata.
- Review metadata.

The current schema and validator live in `packages/schema` and `packages/skill-validator`.

## Safety Rules

Skills must remain data-only. A Skill must not include scripts, shell commands, browser automation, hidden network calls, API keys, credential prompts, runtime plugins, background tasks, or tool execution logic.

Contextarr can validate, review, index, preview, pair, and export Skills as data-only artifacts. Contextarr must not execute Skills.

## Review Model

Skills have source metadata, author metadata, review status, and compatibility notes. Phase 17 adds deterministic Skill Health and object-aware review queue items stored in SQLite only. AI-drafted Skills must enter review before they are approved for exports or Agent Kits.

## Export Model

Phase 18 adds read-only Skill export previews for ChatGPT, Claude, Codex, Claude Code, Markdown, and JSON. Exports are generated artifacts, not source of truth. They include approved Skill instructions and examples selected by the profile, omit local filesystem paths from source summaries, and exclude secret, private, sensitive, draft, `never_export`, and `imported_draft` material by default.

## MCP Model

Phase 25 adds read-only MCP Skill tools:

- `list_skills`
- `get_skill_summary`
- `get_skill`

The tools return path-free JSON and reuse the derived SQLite index. Secret Skill document bodies are never returned. Private, internal, or sensitive Skill document bodies require `CONTEXTARR_MCP_ALLOW_PRIVATE=true`.

## Boundary

Current Skill support still does not implement Skill execution, marketplace behavior, telemetry, cloud services, or file mutation from review actions.
