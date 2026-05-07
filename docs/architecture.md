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
- Add read-only MCP later as a local context access layer.

## Monorepo Shape

```text
apps/web
apps/server
apps/cli
packages/schema
packages/renderer
packages/pack-validator
packages/export-profiles
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
7. MCP, when added, exposes selected context through read-only local tools.

## Source of Truth

Pack folders are authoritative. SQLite tables, search indexes, generated exports, static render output, and MCP responses are derived and must be safe to rebuild from local files.

## Backend Direction

Fastify is the preferred v0 API server because Contextarr is local-server-first and benefits from mature routing, schema-friendly request handling, and straightforward test support.

## Frontend Direction

The web app is a power-user dashboard, not a marketing site. Phase 4 implemented the app shell and API-backed Pack Library. Phase 5 added hash-based pack and record detail views plus sanitized record rendering. Phase 6 added deterministic Pack Health and Review Queue views. Phase 7 adds export preview, copy, and download flows for profile-driven generated artifacts.

## Renderer Direction

The shared renderer converts Markdown to sanitized HTML for both the web UI and static output. Static HTML is a local generated artifact only; it must contain CSS but no user JavaScript or external scripts.

## Database Direction

SQLite is the only v0 database. Do not add Postgres or a vector database in v0. SQLite FTS5 is implemented for local full-text record search, with safe fallback behavior for punctuation-heavy UI queries.

Review item statuses are local SQLite app state. Rescans preserve statuses by deterministic fingerprints and mark missing generated issues as resolved, but review actions do not edit pack files.

Generated exports are derived artifacts. The CLI may write them to ignored local folders such as `generated-exports/`; API previews return content only and do not write files.

## Local API Direction

The local API binds to `127.0.0.1` by default. Local development can run without auth, but setting `CONTEXTARR_API_TOKEN` requires a bearer token or `X-Contextarr-Token` header for protected API routes.

## MCP Direction

MCP is later-phase and read-only in v0/v1. It must not mutate files, run commands, call external services, or expose raw private sources unless explicitly configured.
