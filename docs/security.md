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

Packs are folders of manifests, Markdown records, source maps, export profiles, and rules. The validator and runtime must read pack files only. They must not execute pack content, run shell commands, fetch source URLs, or rewrite packs during validation, indexing, exports, MCP access, or Composer previews.

## Derived State

SQLite is rebuildable local state. Pack files remain the source of truth. Review status changes are stored in SQLite only during v0.1 and do not mutate pack files.

## Exports And Composer

Exports and Composer previews are temporary derived artifacts. They apply profile privacy modes, exclude tags, and redaction rules. Generated artifacts may be copied or downloaded locally by the browser, but Contextarr does not upload them or call AI APIs.

## MCP

The MCP server is stdio-only and read-only. It does not host an HTTP/SSE MCP endpoint, mutate packs, run tools, call external APIs, or log raw returned context.

## Skills And Agent Kits

Phase 12 defines future Skills and Agent Kits as docs only. Skills are non-executable instruction artifacts. Agent Kits pair Skills with Context Packs. Contextarr prepares Agent Kits. It does not run them.
