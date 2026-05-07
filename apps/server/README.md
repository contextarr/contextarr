# Contextarr Server

Local Fastify API server and rebuildable SQLite index for Contextarr packs.

Implemented in Phase 3:

- load and validate local pack folders
- rebuild SQLite derived index from pack files
- expose pack, record, health, search, and rescan API endpoints

Run locally:

```bash
pnpm --filter @contextarr/server dev
```

Rebuild the derived index:

```bash
pnpm --filter @contextarr/server rescan
```

The server binds to `127.0.0.1` by default and does not mutate pack files.
