# Contextarr Non-Goals

Contextarr is intentionally narrow at the start. The first product shape is:

```text
Local sources in.
Validated Context Packs out.
Human-readable dashboard.
Profile-driven AI exports.
Read-only local MCP.
```

## Not Contextarr

Contextarr is not:

- A chatbot.
- A hosted memory vault.
- A public marketplace.
- An agent runner.
- An Obsidian clone.
- A generic RAG app.
- A cloud sync product.

## v0 Boundaries

Contextarr v0 must not include:

- Hosted cloud storage.
- Public marketplace or registry.
- Marketplace payments.
- Executable packs.
- Script packs.
- Shell commands inside packs.
- Hidden network calls.
- Telemetry.
- Direct Gmail connector.
- Direct banking or brokerage connector.
- Mobile app.
- Real private data in the public repository.

## Why These Boundaries Exist

Contextarr is a preparation and review layer for context, not a runtime that acts on the user's behalf. Keeping packs data-only makes them easier to inspect, validate, export, redact, and share safely.
