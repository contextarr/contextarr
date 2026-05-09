# Migration to Context Pack v1

Status: v1.0 schema freeze candidate.

This guide defines the migration posture for Context Pack files before v1.0. Current demo packs already validate cleanly against the v1 candidate expectations.

## Migration Principles

- Files remain source of truth.
- SQLite is deleted and rebuilt, not migrated as source content.
- Validation is read-only.
- Migration helpers must not fetch URLs, run scripts, call AI APIs, or rewrite packs without explicit user action.
- Imported or restored content must not become trusted automatically.

## Preflight

For each pack:

```bash
pnpm --filter @contextarr/cli contextarr validate <pack> --json
```

Resolve all errors before considering the pack v1-ready. Resolve warnings or explicitly document why they are acceptable.

## Required Cleanup

Before v1:

- Ensure manifest permissions disable command and network access.
- Add source license metadata where known.
- Add source freshness metadata where useful.
- Ensure export profiles use canonical targets.
- Exclude `secret`, `never_export`, and unreviewed draft tags from redacted exports.
- Keep README, CHANGELOG, and LICENSE present for user-facing packs.

## Compatibility Expectations

Existing valid v0.1-style Context Packs should either:

- validate without changes, or
- validate with clear warnings and documented migration steps.

Breaking changes require:

- compatibility fixture
- migration note
- validator warning or controlled error
- docs update

## SQLite Rebuild

After migrating files:

```bash
pnpm --filter @contextarr/server rescan
```

The database may be deleted and rebuilt from local files. Pack content must not depend on hidden database-only state.

## Frozen Expansion Boundary

Do not use migration-to-v1 work to add new Skills, Agent Kits, registry behavior, marketplace behavior, signing implementation, or execution behavior.

