# Public Surface Contract

This file is the launch-facing contract for the GitHub README, public website source, social profile copy, screenshots, and release checklist. It exists so the public image follows the real repo instead of drifting behind it.

## Current Public Positioning

Contextarr is a local-first Context Pack system for preparing trusted AI context from files you control.

Use this short form:

> Own your AI context. Validate it locally. Export it anywhere.

Use this longer form:

> Contextarr validates, reviews, redacts, exports, and serves approved Context Packs through CLI, local API, dashboard, and read-only MCP. It is not an agent runner and does not provide a hosted vault.

Website hero copy should keep the first read focused on the working loop:

> Build validated Context Packs from local files, notes, sources, and rules, then reuse them across the AI tools you already use.

> Use Context Packs through human-readable HTML, exports, CLI, API, Docker, and read-only MCP.

It may also include a compact target line:

> Current export profiles include ChatGPT, Claude, Codex, generic Markdown, JSON, AGENTS.md, CLAUDE.md, and llms.txt. Generated Markdown briefs can also be used with other AI tools that accept pasted or file-based context.

Website loop section should use:

> Local sources in. Validated Context Packs out.

> Contextarr keeps pack files on disk, validates trusted records, builds a rebuildable local index, and generates approved outputs for AI tools.

> Files stay local &middot; SQLite is rebuildable &middot; HTML renders are reviewable &middot; MCP is read-only

The website FAQ and README should define the product name without making it the hero message:

> In Contextarr, "arr" stands for Assemble, Review, Route.

> Contextarr assembles trusted context from local sources, reviews it through validation, redaction, freshness, and human approval, then routes the right version through human-readable HTML, exports, CLI, API, Docker, and read-only MCP.

## Website Status

`https://contextarr.com` is the launch website target. The site may host public copy, docs links, screenshots, and install instructions. The core app remains local-first and file-backed.

The focused launch site map is:

- `/`
- `/how-it-works`
- `/use-cases`
- `/run-locally`
- `/demo-packs`
- `/security`
- `/pack-format`
- `/roadmap`
- `/docs`
- `/faq`

Before DNS or hosting cutover, run:

```bash
pnpm public-surface:verify
pnpm site:verify
```

## Current Inventory

The public website and launch screenshots must match:

- 15 public-safe demo packs.
- 12 curated starter packs.
- 120 demo records.
- 8 demo Skills.

These counts are verified against `demo-packs/`, `demo-skills/`, the reviewed screenshot manifest, and the site hero screenshot.

## Screenshot Rules

The homepage and Open Graph image use:

- Source screenshot: `docs/screenshots/v0.1.0-alpha.1/pack-library-grid.png`.
- Site copy: `apps/site/public/screenshots/contextarr-dashboard.png`.

The current approved image is the wide Pack Library capture showing the current 15-pack dashboard state. Public screenshots must not show retired demo objects such as `Jellyfin Server Pack`, `Notion Workspace Pack`, `16 packs`, or `80 records`.

## Copy Rules

Avoid public positioning that makes Contextarr sound like a generic automation platform, hosted memory product, agent runner, registry, marketplace, or vector/RAG system.

Preferred language:

- Own your AI context.
- Assemble, Review, Route.
- Validate it locally. Export it anywhere.
- Local-first Context Packs.
- Trusted AI context from files you control.
- Human-readable HTML.
- Redaction-aware exports.
- Read-only local MCP.
- No hosted vault.
- Contextarr prepares context; it does not run agents.
- Imported external Skills may be preserved unmodified and unexecuted.

Do not use these as current public claims:

- Self-hosted context automation.
- Hosted vault.
- Agent runner.
- Public marketplace.
- Public registry.
- Vector database.
- Generic RAG app.

Historical planning docs may mention older language, but README, site source, social profile prep, release docs, and screenshot docs should follow this contract.
