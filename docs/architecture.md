# Contextarr Architecture

## Summary

Contextarr is a local-first context pack compiler and manager. Source files are the source of truth; runtime indexes, rendered output, exports, cache files, and MCP responses are derived artifacts that must be rebuildable.

## Core Decisions

- Use a TypeScript monorepo managed by pnpm.
- Use local files as the durable source of truth.
- Use SQLite as a rebuildable derived index and app state store.
- Use Node.js with Fastify for the local API server.
- Use React + Vite for the local web dashboard.
- Use Zod for schemas and validation.
- Use sanitized Markdown rendering for human-readable records and static output.
- Use Docker Compose for local operation.
- Use read-only stdio MCP as a local context access layer.

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
3. The server indexes approved local pack files into SQLite with FTS5 search.
4. The web UI reads from the local API.
5. The renderer produces sanitized human-readable output.
6. Export profiles produce target-specific context files.
7. The MCP server exposes selected context through read-only local stdio tools.
8. Importers can generate local draft pack folders from selected local inputs.
9. Composer builds temporary custom exports from selected local records.

## Source of Truth

Pack folders are authoritative. SQLite tables, search indexes, generated exports, static render output, and MCP responses are derived and must be safe to rebuild from local files.

## Backend Direction

Fastify is the preferred v0 API server because Contextarr is local-server-first and benefits from mature routing, schema-friendly request handling, and straightforward test support.

## Frontend Direction

The web app is a power-user dashboard, not a marketing site. Phase 4 implemented the app shell and API-backed Pack Library. Phase 5 added hash-based pack and record detail views plus sanitized record rendering. Phase 6 added deterministic Pack Health and Review Queue views. Phase 7 added export preview, copy, and download flows for profile-driven generated artifacts. Phase 10 added a read-only Composer workflow for temporary custom exports.

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

## MCP Direction

MCP is implemented as a local stdio process in `apps/mcp`. It uses the official TypeScript SDK, reuses the derived SQLite index, and exposes read-only tools for packs, records, search, export profiles, and export previews. It must not mutate files, run commands, call external services, or expose raw private sources unless explicitly configured.

## Importer Direction

Phase 9 importers are CLI/core only. They read local folders, Markdown folders, Obsidian vaults, ChatGPT exports, and Claude exports, then write generated draft pack folders. They must not add API import endpoints, web importer screens, MCP mutation, live connectors, cloud sync, or external API calls.

## Composer Direction

Phase 10 Composer v0 selects indexed packs and records, filters by local metadata, chooses a target and privacy mode, and calls the local compose preview API. It reuses the export engine and redaction rules. Saving composed packs is deferred.
