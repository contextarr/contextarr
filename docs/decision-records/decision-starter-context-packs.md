# Decision: Starter Context Packs

## Status

Accepted.

## Context

Contextarr needs realistic local examples that demonstrate Context Packs, export profiles, brand-aware cards, and object-library filtering without becoming a marketplace, remote registry, connector system, or agent runtime.

The repo already includes non-executable Skills and Agent Kits as data-only objects. This decision adapts starter-pack language to that shipped state: Skills and Agent Kits exist, but they do not execute.

## Decision

- Mark exactly 12 curated demo packs as starter Context Packs.
- Use `starterPack`, `starterCategory`, and `starterSortOrder` as manifest metadata and derived SQLite/API/UI fields.
- Replace the Notion starter with an Obsidian starter.
- Keep legacy demo packs as non-starter examples unless explicitly flagged later.
- Keep Jellyfin Server Pack as legacy demo content and use Jellyfin Media Server Pack for the starter set.
- Use brand IDs and local logo assets only as identifiers.
- Keep all starter content synthetic, original, source-backed, public-safe, and non-executable.

## Consequences

- Agents and humans can filter starter packs deterministically.
- Starter pack order is stable in API results.
- Brand-aware UI can render starter cards without making official or endorsement claims.
- Future marketplace or registry work still requires an explicit scoped phase.
