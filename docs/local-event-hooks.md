# Local Event Hooks

Status: future automation design. No hooks, webhooks, remote delivery, or event-triggered actions are implemented by this document.

Current code implements no Local Event Hook API endpoints, no outbound webhook delivery, and no event-triggered automation runtime. Any future hook support must be app-level configuration, disabled by default, and metadata-first.

## Core Rule

```text
Webhooks are app settings, not pack content.
```

Context Packs, Skills, Agent Kits, and registry artifacts must not define hooks, callbacks, install triggers, or remote posting behavior.

## Never Allow

- Webhooks inside Context Packs.
- Webhooks inside Skills.
- Webhooks exposed through MCP.
- Webhook-triggered shell commands.
- Webhook-triggered agent actions.
- Webhook-triggered external connectors.
- Remote webhook URLs hidden inside imported artifacts.
- Pack-defined fields such as `onImportWebhook`, `onExportWebhook`, `postToUrl`, `callbackUrl`, `notifyEndpoint`, or `installHook`.

## Future Inbound Local Hooks

After local API hardening, Contextarr may add explicit inbound local hooks:

- `POST /api/hooks/rescan`
- `POST /api/hooks/validate`
- `POST /api/hooks/import-dry-run`
- `POST /api/hooks/recalculate-health`
- `POST /api/hooks/recalculate-readiness`
- `POST /api/hooks/backup`

Rules:

- Localhost by default.
- Auth token required.
- LAN mode explicit only.
- No public internet bind.
- Rate limited.
- Idempotent where possible.
- Metadata-only local audit log.
- Never approves records automatically.
- Never exposes draft content to MCP.

## Future Outbound Local Event Hooks

Later, Contextarr may add app-level Local Event Hooks for local automation tools such as local n8n, Home Assistant, or a local logging endpoint.

Example events:

- `pack.validation_failed`
- `pack.health_changed`
- `pack.readiness_blocked`
- `review.item_created`
- `export.generated`
- `redaction.hit`
- `source.stale_detected`
- `backup.created`
- `mcp.query_blocked`

Payloads should be metadata-first:

```json
{
  "eventType": "pack.readiness_blocked",
  "packId": "docker-containers-pack",
  "status": "blocked",
  "issueCodes": ["readiness.blocked_by_safety"],
  "recordCount": 10,
  "sourceCount": 6,
  "bodyIncluded": false
}
```

Default exclusions:

- No record bodies.
- No export bodies.
- No raw MCP queries.
- No raw MCP responses.
- No secrets.
- No full file paths unless explicitly enabled for local diagnostics.

## Remote Hooks

Remote hook delivery is post-v1 at the earliest and should require:

- Disabled by default.
- Explicit per-endpoint consent.
- Endpoint allowlist.
- Event allowlist.
- Payload preview.
- HMAC signing.
- Retry limits.
- Local audit log.
- Test delivery button.
- No body content by default.

## UI Language

Use:

```text
Local Event Hooks
```

Avoid generic "webhooks" copy in the main UI because it implies remote automation and weakens the local-first trust story.
