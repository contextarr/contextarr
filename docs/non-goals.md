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
- Starter packs that behave like marketplace listings.
- Public marketplace before registry trust model is implemented.
- Anonymous public uploads.
- Marketplace payments.
- Executable packs.
- Executable registry artifacts.
- Script packs.
- Shell commands inside packs.
- Remote install with auto-activation.
- Remote logo fetching.
- Live SaaS, cloud, source-control, or workspace connectors from starter packs.
- Hidden network calls.
- Claims of perfect prompt-injection detection.
- Registry items bypassing local validation.
- Encrypted artifacts bypassing scanner review.
- Telemetry.
- Direct Gmail connector.
- Direct banking or brokerage connector.
- Mobile app.
- Real private data in the public repository.
- Copied third-party documentation in demo or starter packs.

## Starter Pack Boundaries

Starter packs are curated local examples. They identify familiar tools or platforms only so users can understand the shape of a pack. Third-party marks and names are identifiers only and do not imply endorsement, partnership, official status, or source ownership.

Starter packs must stay data-only. They must not include credentials, install hooks, shell snippets, executable commands, telemetry, or live connector behavior.

## Why These Boundaries Exist

Contextarr is a preparation and review layer for context, not a runtime that acts on the user's behalf. Keeping packs data-only makes them easier to inspect, validate, export, redact, and share safely.
