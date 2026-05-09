# Contextarr Architecture

Status note: Check [implementation-status.md](implementation-status.md) before treating CLI modes, approved-only gates, export targets, or future Skill/Agent Kit behavior as shipped.

## Summary

Contextarr is a local-first context pack compiler and manager. Source files are the source of truth; runtime indexes, rendered output, exports, cache files, CLI responses, and MCP responses are derived artifacts that must be rebuildable.

Phase 12 begins the second PRD track as documentation only. It keeps Context Packs as the core source-backed knowledge object and defines future Skills, Agent Kits, and Export Briefs before any schema or runtime work begins.

## Core Decisions

- Use a TypeScript monorepo managed by pnpm.
- Use local files as the durable source of truth.
- Use SQLite as a rebuildable derived index and app state store.
- Use Node.js with Fastify for the local API server.
- Use React + Vite for the local web dashboard.
- Use Zod for schemas and validation.
- Use sanitized Markdown rendering for human-readable records and static output.
- Use Docker Compose for local operation.
- Use CLI as the primary deterministic automation interface for agents, scripts, CI, local tools, and power users.
- Use read-only stdio MCP as a local context access layer.
- Keep future Skills and Agent Kits data-only and non-executable.

## Shared Core Surface Model

Contextarr exposes the same trusted core through multiple surfaces:

- CLI for deterministic automation and agent-safe commands.
- Web UI for human review and maintenance.
- Local API for the dashboard and integrations.
- Read-only MCP for optional live query from compatible clients.
- Exports for portable AI-ready artifacts.

The core engine must sit below all surfaces. Validation, indexing, health, review, render, redact, compose, query, import, and export logic should live in shared packages or shared server/core modules and be called by the CLI, Local API, Web UI, and MCP.

Rules:

- Do not make MCP the internal source of truth.
- Do not make CLI shell out to MCP.
- Do not make API shell out to CLI.
- Do not make MCP shell out to CLI.
- Do not make the Web UI the only way to inspect packs.
- Keep files as source of truth and SQLite as derived rebuildable state.

## Monorepo Shape

```text
apps/web
apps/server
apps/cli
apps/mcp
packages/schema
packages/renderer
packages/pack-validator
packages/export-profiles
packages/importers
tools/brand-kit
assets/brand
demo-packs
docs
```

## Data Flow

1. Pack files live in local folders.
2. The validator reads pack manifests, records, sources, exports, and rules.
3. The server indexes local pack files into SQLite with FTS5 search; approved-only exposure is a required safety gate where documented.
4. The CLI calls shared core functions for deterministic automation and explicit local artifacts.
5. The web UI reads from the local API.
6. The renderer produces sanitized human-readable output.
7. Export profiles produce target-specific context files.
8. The MCP server exposes selected context through read-only local stdio tools.
9. Importers can generate local draft pack folders from selected local inputs.
10. Composer builds temporary custom exports from selected local records.
11. Docker Compose can serve the built web app and local API from one Fastify origin.

## Source of Truth

Pack folders are authoritative. SQLite tables, search indexes, generated exports, CLI reports, static render output, and MCP responses are derived and must be safe to rebuild from local files.

## CLI Direction

The CLI is the primary automation interface. It must support agents and power users through deterministic commands without requiring MCP as commands are implemented.

CLI requirements:

- Stable JSON mode.
- Stable exit codes.
- Strict `--agent` mode.
- Dry-run support for risky operations.
- Clear stdout/stderr separation.
- Machine-readable errors.
- Redacted and approved-content-only defaults for agent-facing commands.
- Explicit write commands and explicit activation commands.
- No hidden network calls.
- No execution of pack content.
- No shell-out to MCP, API, Web UI, or other surfaces.

## Backend Direction

Fastify is the preferred v0 API server because Contextarr is local-server-first and benefits from mature routing, schema-friendly request handling, and straightforward test support.

## Frontend Direction

The web app is a power-user dashboard, not a marketing site. Phase 4 implemented the app shell and API-backed Pack Library. Phase 5 added hash-based pack and record detail views plus sanitized record rendering. Phase 7 added deterministic Pack Health and Review Queue views. Phase 8 added export preview, copy, and download flows for profile-driven generated artifacts. Phase 11 added a read-only Composer workflow for temporary custom exports and same-origin serving of built web assets for the Docker preview.

## Renderer Direction

The shared renderer converts Markdown to sanitized HTML for both the web UI and static output. Static HTML is a local generated artifact only; it must contain CSS but no user JavaScript or external scripts.

## Database Direction

SQLite is the only v0 database. Do not add Postgres or a vector database in v0. SQLite FTS5 is implemented for local full-text record search, with safe fallback behavior for punctuation-heavy UI queries.

Review item statuses are local SQLite app state. Rescans preserve statuses by deterministic fingerprints and mark missing generated issues as resolved, but review actions do not edit pack files.

Generated exports are derived artifacts. The CLI may write them to ignored local folders such as `generated-exports/`; API previews return content only and do not write files.

MCP query metadata is local SQLite app state. It records tool name, related ids, query hash and length, result count, timing, and sanitized metadata only. It must not store raw result content or full raw query text.

Imported draft packs are generated local files under explicit ignored output directories such as `imported-packs/`. They are not approved packs by default; imported records are private drafts tagged `imported_draft` and `never_export`.

Composed exports are temporary derived artifacts. The web UI can preview, copy, and browser-download them, but Phase 10 does not save composed packs or mutate pack files.

## Local API Direction

The local API binds to `127.0.0.1` by default. Local development can run without auth, but setting `CONTEXTARR_API_TOKEN` requires a bearer token or `X-Contextarr-Token` header for protected API routes.

When `CONTEXTARR_WEB_DIST_DIR` is set, the server also serves the built web app from that directory. API routes keep priority under `/api/*`; unknown API routes return JSON 404 responses while non-API browser routes fall back to `index.html`.

## Docker Direction

Docker Compose is a local preview path for v0.1, not a hosted deployment recipe. It builds the Vite app, runs the Fastify server on `0.0.0.0:3210`, mounts `demo-packs` read-only, and stores derived SQLite state in a Docker volume.

## MCP Direction

MCP is implemented as a local stdio process in `apps/mcp`. It uses the official TypeScript SDK, reuses the derived SQLite index, and exposes read-only tools for packs, records, search, export profiles, and export previews. It must not mutate files, run commands, call external services, or expose raw private sources unless explicitly configured.

## Importer Direction

Phase 10 importers are CLI/core only. They read local folders, Markdown folders, Obsidian vaults, ChatGPT exports, and Claude exports, then write generated draft pack folders. They must not add API import endpoints, web importer screens, MCP mutation, live connectors, cloud sync, or external API calls.

## Composer Direction

Phase 11 Composer v0 selects indexed packs and records, filters by local metadata, chooses a target and privacy mode, and calls the local compose preview API. It reuses the export engine and redaction rules. Saving composed packs is deferred.

## Skills and Agent Kits Direction

The second PRD adds future terminology for Skills and Agent Kits:

- Context Packs tell agents what to know.
- Skills tell agents how to work.
- Agent Kits combine both for a specific task.
- Export Briefs are generated from those ingredients.

Contextarr prepares Agent Kits. It does not run them.

No schema code is added in Phase 12. Future Skill and Agent Kit files must remain local, inspectable, source-backed, reviewable, and non-executable. Future indexes, previews, exports, and MCP responses must remain derived artifacts.
