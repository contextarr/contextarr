# MCP Safety Model

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating any MCP behavior, transport mode, or content-visibility gate as shipped.

## Purpose

MCP safety is part of product trust. Contextarr MCP must expose approved context without becoming a mutation, execution, connector, or agent-action surface.

This document is a dedicated MCP safety model. It complements `docs/mcp.md` and `docs/security-model.md`.

MCP is optional. Agents and power users must be able to use Contextarr through deterministic CLI commands without MCP.

## Required Defaults

- localhost bind by default.
- LAN mode off by default.
- LAN mode warning.
- Local token if API/MCP exposed beyond default.
- Read-only tools only.
- Approved content only by default.
- Draft content excluded by default.
- Blocked/revoked content excluded.
- Redaction-aware responses.
- Result size limits.
- Raw source access disabled by default.
- Local query logs.
- No mutation.
- No shell execution.
- No network calls.
- No secret access.
- No agent actions.

Target requirement; not necessarily implemented in current code. Current MCP is stdio-based; localhost/LAN language applies to future network-capable exposure.

## Future MCP Tools

- `list_packs`.
- `get_pack_summary`.
- `query_pack_context`.
- `get_record`.
- `list_export_profiles`.
- `build_export_preview`.

Do not add mutating tools.

## Content Visibility Rules

- Approved public-safe records are visible by default.
- Draft, imported draft, rejected, blocked, deprecated, and future revoked records are excluded by default.
- Private, internal, or sensitive records require explicit local opt-in and still obey redaction rules.
- Secret records are never returned.
- Raw source files are not returned by default.
- Export previews use the same redaction and profile rules as the export engine.

Target requirement; not necessarily implemented in current code. Approved-content-only MCP visibility is a required completion gate.

## Result Limits

MCP responses should enforce:

- Maximum result count.
- Maximum record body characters.
- Maximum export preview characters.
- Query length limits.
- Deterministic truncation or refusal messages when limits are exceeded.

## Query Logging

Local query logs may store:

- Tool name.
- Pack ID or record ID.
- Query hash.
- Query length.
- Result count.
- Timing.
- Sanitized flags.

Local query logs must not store raw query text, returned context, secrets, or raw source content.

## LAN Mode

LAN mode is off by default. If a future HTTP or remote-capable MCP mode exists, it must require:

- Explicit user configuration.
- Warning about local network exposure.
- Local token or equivalent auth.
- Same read-only and approved-content-only rules.
- No broad bind without explicit configuration.

## Acceptance Criteria

- MCP cannot mutate files.
- MCP cannot execute commands.
- MCP cannot fetch URLs or call external APIs.
- MCP cannot expose secrets.
- MCP excludes draft and unapproved content by default.
- MCP responses are redaction-aware and size-limited.
- MCP docs do not imply hosted MCP or agent execution.
