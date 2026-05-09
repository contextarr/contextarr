# Contextarr Non-Goals

Status note: Check [implementation-status.md](implementation-status.md) before treating any CLI, MCP, registry, Skill, or Agent Kit behavior as shipped.

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
- A CLI agent runner.
- A workflow automation engine.
- An Obsidian clone.
- A generic RAG app.
- A cloud sync product.
- A code indexer.
- An MCP-only product.
- A public skill marketplace.

## v0 Boundaries

Contextarr v0 must not include:

- Hosted cloud storage.
- Public marketplace or registry.
- Public marketplace before trust model.
- Anonymous public uploads.
- Remote install with auto-activation.
- Marketplace payments.
- Executable packs.
- Executable Skills.
- Agent Kit runtime.
- CLI execution of pack instructions.
- CLI bypass of validation, review, or redaction rules.
- Script packs.
- Shell commands inside packs.
- Hidden network calls.
- Claims of perfect prompt-injection detection.
- Telemetry.
- Direct Gmail connector.
- Direct banking or brokerage connector.
- Direct cloud connectors before local importers prove value.
- Mobile app.
- Real private data in the public repository.

## Good-to-Great Planning Boundaries

The Good-to-Great layers are roadmap overlays. Unless a future prompt explicitly scopes the relevant G-phase, the current docs-only planning work must not include:

- Benchmark harness implementation.
- Benchmark fixture generation outside an explicitly scoped G2 pass.
- Benchmark scripts or external AI evaluation calls.
- Pack Authoring SDK package.
- Pack scaffolder.
- Pack lint, explain, or snapshot-test commands.
- CI workflow generation.
- Pack hashes, source hashes, lockfile generation, Context BOM generation, signing, or revocation implementation.
- Starter gallery UI.
- New starter packs or template folders.
- Marketplace or registry behavior.
- Skills or Agent Kits implementation.
- Cloud services.
- Telemetry.

## Why These Boundaries Exist

Contextarr is a preparation and review layer for context, not a runtime that acts on the user's behalf. Keeping packs data-only makes them easier to inspect, validate, export, redact, and share safely.

CLI-first agent access does not change that boundary. The CLI is a deterministic inspection, validation, export, health, import dry-run, quarantine, and brief-generation surface as commands are implemented. It is not an agent runner, Skill runner, Agent Kit runner, shell-command runner, or bypass around validation, review, redaction, quarantine, and approval rules.

MCP is not required for agent access. Agents must be able to use Contextarr through CLI commands without MCP.
