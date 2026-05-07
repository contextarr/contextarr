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

MCP is later-phase and read-only. It must not:

- Mutate files.
- Run commands.
- Call network services.
- Access secrets.
- Return raw private source dumps unless explicitly configured.

## Human Review

AI-drafted content, when supported later, must enter a review queue. It must not become approved pack content, be exported, or appear in MCP responses by default without human review.

Phase 6 review queue actions are SQLite-only local app state. Accept, Ignore, and Mark Reviewed do not mutate records, manifests, source maps, rules, or export profiles.

## Telemetry

Telemetry is disabled and out of scope. Contextarr should not phone home by default.
