# Upgrade Notes

Contextarr is still pre-v1. Treat upgrades as source-controlled local workspace updates until v1.0 is cut.

## Recommended Local Upgrade

```bash
git pull --ff-only
pnpm install
pnpm v1-core:verify
```

If Docker assets changed:

```bash
docker compose build
docker compose up
```

## Derived Data

SQLite data is derived from local files. If the index looks stale, stop the server, delete the local database file or Docker volume only when you intend to rebuild, and run a rescan.

```bash
pnpm --filter @contextarr/server rescan
```

Do not treat SQLite as the backup source. Context Pack folders are the source of truth.

## Compatibility

Run:

```bash
pnpm compatibility:verify
```

This keeps current demo packs and representative older fixture shapes validating against the v1 schema freeze candidate.

## When To Pause

Pause and review before upgrading if:

- You have local draft imports under ignored roots.
- You have local draft Agent Kits under `agent-kits/`.
- You changed demo packs for private testing.
- You rely on a local SQLite file that has not been rebuilt recently.

