# Decision: Starter Context Packs

## Status

Accepted.

## Context

Contextarr needs realistic local examples that demonstrate Context Packs, export profiles, brand-aware cards, and object-library filtering without becoming a marketplace, remote registry, connector system, or agent runtime.

The repo already includes non-executing Skills and Agent Kits as advanced-preview objects. Contextarr Native Skills are data-only, while future imported external Skill artifacts may be preserved unmodified and unexecuted. This decision adapts starter-pack language to that shipped state: Skills and Agent Kits exist, but Contextarr does not execute them.

## Decision

- Mark exactly 12 curated demo packs as starter Context Packs.
- Use `starterPack`, `starterCategory`, and `starterSortOrder` as manifest metadata and derived SQLite/API/UI fields.
- Replace the Notion starter with an Obsidian starter.
- Keep legacy demo packs as non-starter examples unless explicitly flagged later.
- Retire the legacy Jellyfin demo from the indexed demo set and use Jellyfin Media Server Pack as the canonical Jellyfin example.
- Use brand IDs and local logo assets only as identifiers.
- Keep all starter content synthetic, original, source-backed, public-safe, and non-executable.

## Consequences

- Agents and humans can filter starter packs deterministically.
- Starter pack order is stable in API results.
- Brand-aware UI can render starter cards without making official or endorsement claims.
- Future marketplace or registry work still requires an explicit scoped phase.
