# Contextarr Security Model

## Summary

Contextarr is local-first, source-backed, human-reviewed, and data-only. Pack content must be inspectable before it is trusted, exported, indexed, rendered, or exposed through MCP.

## Non-Goals

Contextarr v0 must not include:

- Hosted cloud.
- Public registry.
- Marketplace.
- Marketplace payments.
- Executable packs.
- Scripts inside packs.
- Agent action runner.
- Direct Gmail connector.
- Direct bank or brokerage connector.
- Managed AI dependency.
- Telemetry.
- Passive always-on capture.
- Real private data in the repository.

## Pack Safety Rules

Every activated pack must pass validation. Required checks later include:

- Manifest exists.
- License field exists.
- Trust level exists.
- Source map exists.
- No executable files.
- No scripts.
- No shell commands.
- No hidden binary payloads.
- No remote script includes.
- No API key patterns.
- No credential patterns.
- No disallowed permissions.

## Data-Only Pack Principle

Packs are data: metadata, prompts, records, source maps, collector definitions, validation rules, redaction rules, and export templates.

Packs must not run code in v0 or v1.

## Local API Security

The local API binds to `127.0.0.1` by default. LAN mode must be explicit and warning-gated later.

Local development can run without API auth while `CONTEXTARR_API_TOKEN` is empty or unset. When `CONTEXTARR_API_TOKEN` is set, all protected `/api/*` routes require either `Authorization: Bearer <token>` or `X-Contextarr-Token: <token>`. The health endpoint remains unauthenticated and reports only whether auth is required; it must never return the configured token.

## Rendering Security

Markdown rendering is sanitized before HTML is displayed or written to static output. Rendered pack content must not include user JavaScript, event handler attributes, external scripts, iframe embeds, or `javascript:` links. Static HTML output is local generated documentation and must remain CSS-only.

## Read-Only MCP

The MCP server is local, stdio-only, and read-only. It must not:

- Mutate files.
- Run commands.
- Call network services.
- Access secrets.
- Return raw private source dumps unless explicitly configured.

`CONTEXTARR_MCP_ALLOW_PRIVATE=false` is the default. Secret record bodies are never returned through MCP. Private, internal, or sensitive record bodies are omitted unless private MCP access is explicitly enabled. MCP query logs store metadata only: tool name, ids, query hash and length, result count, timing, and sanitized flags. They must not store raw query text or returned context.

## Human Review

AI-drafted content, when supported later, must enter a review queue. It must not become approved pack content, be exported, or appear in MCP responses by default without human review.

Phase 6 review queue actions are SQLite-only local app state. Accept, Ignore, and Mark Reviewed do not mutate records, manifests, source maps, rules, or export profiles.

## Export Security

Phase 7 exports are generated from validated local pack files and data-only export profiles. Export generation must not mutate pack files, fetch source URLs, call AI APIs, upload data, execute pack content, or bypass redaction rules. CLI output belongs under ignored local artifact folders such as `generated-exports/`.

MCP export previews reuse the same export engine and do not write generated files.

## Import Security

Phase 9 importers are local-only and produce draft packs under explicit ignored output folders. They must not fetch URLs, execute files, call AI APIs, upload data, or approve imported content.

Imported records default to `privacy: private`, `review_status: draft`, `source_status: imported`, and tags including `imported_draft` and `never_export`. Imported packs must be reviewed before use.

## Telemetry

Telemetry is disabled and out of scope. Contextarr should not phone home by default.
