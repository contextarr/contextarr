# Contextarr Security Notes

Contextarr v0.1 is local-first, data-only, and human-review centered.

## Hard Boundaries

- No telemetry.
- No marketplace.
- No executable packs.
- No executable Skills.
- No Agent Kit runner.
- No scripts inside packs.
- No hidden network calls from pack content.
- No hosted cloud.
- No managed AI dependency.
- No direct Gmail, banking, brokerage, or sensitive account connectors.
- No real private data in this public repository.

## Pack Safety

Packs are folders of manifests, Markdown records, source maps, export profiles, and rules. The validator and runtime must read pack files only. They must not execute pack content, run shell commands, fetch source URLs, or rewrite packs during validation, indexing, exports, MCP access, or Composer previews. API and export surfaces must not expose absolute local source paths; Context Pack exports omit local source paths from source summaries.

## Derived State

SQLite is rebuildable local state. Pack files remain the source of truth. Review status changes are stored in SQLite only during v0.1 and do not mutate pack files.

## Exports And Composer

Exports and Composer previews are temporary derived artifacts. They apply profile privacy modes, exclude tags, and redaction rules. Generated artifacts may be copied or downloaded locally by the browser, but Contextarr does not upload them or call AI APIs.

## MCP

The MCP server is stdio-only and read-only. It does not host an HTTP/SSE MCP endpoint, mutate packs, Skills, or Agent Kits, run tools, execute Skills, run Agent Kits, call external APIs, or log raw returned context. Phase 25 extends MCP to Skills and Agent Kits with privacy-aware bodies, scoped Agent Kit context search, local export previews, and path-free responses.

## Skills And Agent Kits

Skills are non-executable instruction artifacts. Phase 18 stores them as local files, validates them with Zod and safety scans, indexes them into read-only SQLite/API views, displays them in read-only UI screens, generates deterministic health/review items without editing Skill files, and builds read-only export previews. Phase 22 adds non-executable Agent Kit schemas, fake demo Agent Kits, Agent Kit indexing/API/search, and a validated local Composer save flow. Phase 23 adds read-only Agent Kit Library and detail views plus local health/status artifacts. Phase 24 adds read-only Agent Kit export previews that strip local source paths and exclude secret or `never_export` content. Phase 25 exposes Skills and Agent Kits to MCP clients without mutation or execution. Contextarr prepares Agent Kits. It does not run them.

Agent Kit saves are constrained to `CONTEXTARR_AGENT_KITS_DIR`, defaulting to ignored `agent-kits/`. The browser sends object IDs and metadata only; it never sends an output path. Saved kits are validated before they are indexed.

Skill review status changes are local SQLite state only. They never rewrite `contextarr-skill.json`, instruction Markdown, examples, source maps, export profiles, or rules.

Skill validation rejects executable files, script files, shell-command patterns, hidden instruction patterns, network-directed wording, credential requests, unsafe manifest permissions, and relaxed safety rules. Demo Skills are fake, public-safe, and mounted read-only in Docker.

Skill manifest paths must remain relative to the Skill folder. Read-only Skill API responses expose metadata and content needed by the UI, but not local Skill filesystem paths. Skill instruction and example Markdown is sanitized before display and must not execute scripts, event handlers, iframes, or `javascript:` links.
