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

The local API should bind to `127.0.0.1` by default. LAN mode must be explicit and warning-gated later. If the API is enabled beyond a local-only development path, it should require a local auth token.

## Read-Only MCP

MCP is later-phase and read-only. It must not:

- Mutate files.
- Run commands.
- Call network services.
- Access secrets.
- Return raw private source dumps unless explicitly configured.

## Human Review

AI-drafted content, when supported later, must enter a review queue. It must not become approved pack content, be exported, or appear in MCP responses by default without human review.

## Telemetry

Telemetry is disabled and out of scope. Contextarr should not phone home by default.
