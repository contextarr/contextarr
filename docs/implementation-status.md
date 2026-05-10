# Implementation Status

This file is the shipped-versus-planned source of truth for implementation claims. Roadmaps and PRD additions define target behavior; this status file records what is present in this checkout.

## Core Working Now

- Context Pack schema, validation, deterministic validation reports, and local scanner reports.
- Sixteen public-safe demo Context Packs, including 12 curated starter packs.
- Local SQLite-derived index for packs, records, sources, exports, health, review items, Skills, and Agent Kits.
- Local API for packs, records, search, health, exports, collectors, composition, backup, and restore surfaces.
- Pack Library UI with brand-aware cards and starter/local/imported grouping.
- Pack detail, record detail, Pack Health, Review Queue, Export Center, and Composer views.
- Profile-driven Context Pack exports for ChatGPT, Claude, Codex, generic Markdown, JSON, AGENTS.md, CLAUDE.md, and llms.txt targets.
- CLI commands for Context Pack validation, static rendering, export generation, local draft imports, scanner reports, backup, and quarantine restore.
- Read-only MCP surfaces where implemented by the local server package.
- Backup and restore tooling for local Context Packs, with validation-before-activation and quarantine-only restore.
- Context Pack collectors and Composer save-as-draft-pack flows that write private unreviewed drafts without activating them.

## Advanced Preview, Data-Only, Frozen

- Non-executable Skills as data-only instruction artifacts.
- Non-executable Agent Kits as data-only compositions of Context Packs and Skills.
- Skill and Agent Kit validation, demo fixtures, SQLite/API indexing, search, health/review items, read-only UI views, export previews, and read-only MCP tools where implemented.
- Local Skill importers gated behind `CONTEXTARR_ENABLE_LOCAL_IMPORTS=true`.
- Agent Kit templates that create unreviewed local draft Agent Kits only.

These surfaces are present, but they are not the public headline for the first release. Further Skills or Agent Kit expansion remains frozen behind the v1 bridge gate until Context Pack core readiness is accepted or superseded by a decision record.

Contextarr prepares Agent Kits. It does not run them.

## Planned Or Guarded

- Tagged GitHub release.
- npm package publishing.
- Public registry behavior.
- Marketplace behavior.
- Remote installation or auto-activation.
- Creator accounts.
- Payments.
- Live SaaS connectors.
- Telemetry.
- Hosted cloud sync.
- Signing implementation.
- Agent runtime behavior.
- Executable packs, executable Skills, or executable Agent Kits.

## Starter Pack Status

Current starter packs are curated local examples, not marketplace listings. The starter set is:

1. OpenAI Prompt Engineering Pack
2. Claude Code Project Pack
3. Google Workspace Pack
4. AWS Infrastructure Pack
5. Jellyfin Media Server Pack
6. Docker Containers Pack
7. UniFi Network Pack
8. VS Code Setup Pack
9. GitHub Workflow Pack
10. Home Assistant Pack
11. Tailscale VPN Pack
12. Obsidian Vault Pack

The repository also keeps legacy/non-starter demo packs for fixture coverage. Third-party marks are identifiers only and do not imply endorsement, partnership, official status, or ownership of pack content.
