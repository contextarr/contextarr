# Implementation Status

This file is the shipped-versus-planned source of truth for implementation claims. Roadmaps and PRD additions define target behavior; this status file records what is present in this checkout.

## Current

- Context Pack schema and validation.
- Demo Context Packs, including 12 curated starter packs.
- Local SQLite-derived index for packs, records, sources, exports, Skills, and Agent Kits.
- Local API for packs, records, search, health, exports, Skills, Agent Kits, collectors, composition, backup, and restore surfaces.
- Pack Library UI with brand-aware cards and starter/local/imported grouping.
- Profile-driven exports for ChatGPT, Claude, Codex, generic Markdown, JSON, AGENTS.md, CLAUDE.md, and llms.txt targets.
- Non-executable Skills as data-only instruction artifacts.
- Non-executable Agent Kits as data-only compositions of Context Packs and Skills.
- Read-only MCP surfaces where implemented by the local server package.
- Local importers and collectors that create draft content for review.
- Backup and restore tooling for local Context Packs.

## Planned Or Guarded

- Public registry behavior.
- Marketplace behavior.
- Remote installation or auto-activation.
- Creator accounts.
- Payments.
- Live SaaS connectors.
- Telemetry.
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

Third-party marks are identifiers only and do not imply endorsement, partnership, official status, or ownership of pack content.
