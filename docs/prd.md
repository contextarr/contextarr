# Contextarr Product Requirements Document and Build Plan

Status note: This is a product requirements and planning document. [docs/implementation-status.md](implementation-status.md) is the shipped-versus-planned source of truth for the current checkout.

## 1. Executive Summary

### 1.1 Product Name

**Contextarr**

Domain: `contextarr.com`

Working tagline:

**Self-hosted context automation for AI assistants and agents.**

### 1.2 Product Definition

Contextarr is a self-hosted context pack builder, manager, validator, renderer, composer, and exporter for AI assistants and agents.

It helps users create AI-ready context packs from guided collectors, local files, Markdown, Obsidian vaults, ChatGPT exports, Claude exports, OpenWhispr notes, GitHub repositories, documents, public source lists, existing packs, and AI-assisted draft workflows.

The core object is the **Context Pack**.

Contextarr is not a chatbot, not a hosted personal memory vault, not an agent runner, not a marketplace-first platform, not an Obsidian clone, and not a generic RAG app.

### 1.3 Core Thesis

AI tools are becoming more capable, but users still waste time re-explaining context across ChatGPT, Claude, Codex, Claude Code, OpenCode, Cursor, Open WebUI, AnythingLLM, OpenClaw, Hermes, and local models.

The durable opportunity is not generic AI memory. Frontier providers will keep absorbing that. The durable opportunity is a local-first, inspectable, source-backed, reviewable, redacted, cross-tool **context control layer**.

Contextarr should become the self-hosted system that lets power users and teams:

1. Build context packs.
2. Validate context packs.
3. Keep packs current.
4. Render packs for humans.
5. Export packs for AI tools.
6. Expose selected packs through read-only local MCP.
7. Compose custom packs from existing records and sources.

### 1.4 First Audience

The first audience is not mainstream consumers.

The first audience is:

1. AI power users.
2. Developers using Claude Code, Codex, OpenCode, Cursor, and local agents.
3. Self-hosted and homelab users.
4. Obsidian and Markdown users.
5. Local LLM users.
6. Consultants and operators who work across many systems.
7. Internal KB owners.
8. Privacy-sensitive professionals.
9. People already familiar with Docker, local apps, GitHub repos, and AI workflow tools.

### 1.5 Product Shape

Contextarr should start as an open-source self-hosted app with:

1. Local files as source of truth.
2. SQLite as rebuildable derived index and app state.
3. Docker-first deployment.
4. A local web dashboard.
5. A strict non-executable pack format.
6. Pack validation.
7. Pack health.
8. Review queue.
9. Human-readable HTML rendering.
10. Export profiles.
11. Read-only local MCP.
12. Fake demo packs.

Paid layers should come later, after the core proves pull.

### 1.6 Strategic Decision

Build Contextarr as:

```text
A self-hosted package manager for AI-ready context.
```

Do not build it first as:

```text
A broad personal AI memory app.
A hosted SaaS vault.
A public skill marketplace.
A GEO content site.
A general-purpose chatbot.
```

---

## 2. Product Principles

### 2.1 Source of Truth Principle

The source of truth is local, user-owned files.

SQLite, embeddings, search indexes, cached render output, generated exports, and MCP responses are derived from source files and must be rebuildable.

### 2.2 Human Review Principle

AI may draft context.

Humans approve context.

Nothing AI-generated becomes trusted pack content without review.

### 2.3 Data-Only Pack Principle

Context packs are data, metadata, prompts, records, source maps, collector definitions, validation rules, redaction rules, and export templates.

Context packs must not execute code in v0 or v1.

No scripts.
No shell commands.
No arbitrary network calls.
No browser automation.
No credentials.
No private API calls.
No hidden actions.

### 2.4 Read-Only MCP Principle

MCP in v0 and v1 is a read-only context access layer.

It must not mutate files, run code, call external services, or perform agent actions.

### 2.5 Local-First Principle

Contextarr must work without cloud storage, hosted sync, managed AI, or external accounts.

### 2.6 Reviewable HTML Principle

Every pack should be readable, inspectable, and reviewable by a human through the local web UI and optional static HTML output.

### 2.7 Least Disclosure Principle

Exports should include only the context needed for the selected target and task.

Redaction and export profiles are first-class features.

### 2.8 Power-User First Principle

Design for self-hosted, AI-tool-heavy power users first.

Do not dilute the first version trying to satisfy non-technical consumers.

### 2.9 Compatibility Over Lock-In

Contextarr should interoperate with Markdown, Obsidian, ChatGPT exports, Claude exports, GitHub repos, OpenWhispr notes, and common AI tools.

Users should not be trapped inside the Contextarr UI.

### 2.10 Security Before Marketplace

No public marketplace until the pack format, permission model, signing model, review process, and abuse controls are mature.

---

## 3. Non-Goals

Do not build these in the initial product:

1. Hosted personal context vault.
2. Public pack marketplace.
3. Public GEO pack content farm.
4. Scripted or executable packs.
5. Agent action runner.
6. Direct Gmail connector.
7. Direct bank or brokerage connector.
8. Passive always-on capture.
9. Mobile app.
10. Full OCR engine.
11. Deep codebase AST indexer competing with Graphify, Claude Code, Cursor, or Codex.
12. General chatbot UI.
13. Managed AI subscription.
14. Hosted sync.
15. Multi-user real-time collaboration.
16. Marketplace payments.
17. Creator accounts.
18. Public product/reference packs containing copyrighted manual dumps or scraped proprietary content.

---

## 4. User Personas

### 4.1 AI Power User

Uses multiple AI tools daily.

Pain:

1. Re-explains setup repeatedly.
2. Maintains prompts and context manually.
3. Uses ChatGPT, Claude, Codex, Open WebUI, local models, and agent tools.
4. Wants local, inspectable files.

Needs:

1. Context pack builder.
2. Export profiles.
3. Obsidian or Markdown import.
4. Source maps.
5. Human-readable dashboard.
6. Local MCP.

### 4.2 Developer or Coding-Agent User

Uses Claude Code, Codex, OpenCode, Cursor, GitHub Copilot, or local agents.

Pain:

1. Coding agents forget project state.
2. Repo instructions drift.
3. Context is siloed by tool.
4. Project handoffs are repetitive.

Needs:

1. Project context packs.
2. AGENTS.md or CODEX.md style exports.
3. Claude Code pack export.
4. Repo source import.
5. Local MCP access.
6. Pack health and stale detection.

### 4.3 Self-Hosted Homelab User

Uses Docker, arr apps, Jellyfin, UniFi, local AI, NAS, and internal tools.

Pain:

1. Systems documentation is scattered.
2. AI support requires many repeated facts.
3. Home lab context spans many systems.

Needs:

1. System packs.
2. Network packs.
3. Docker pack.
4. Hardware pack.
5. Local web UI.
6. Backup and health checks.

### 4.4 Consultant or Operator

Manages clients, projects, SOPs, workflows, and tools.

Pain:

1. Context changes between clients and projects.
2. AI answers are weak without background.
3. Must prepare handoffs and summaries.

Needs:

1. Client context packs.
2. Project recovery packs.
3. Review queue.
4. Redacted exports.
5. Setup services or Pro packs.

### 4.5 Internal KB Owner

Maintains internal support docs or operations docs.

Pain:

1. KB articles go stale.
2. Context contradictions exist across docs.
3. AI assistants need specific role context.

Needs:

1. Internal KB packs.
2. Role-specific exports.
3. Source maps.
4. Pack health.
5. Review queue.
6. Private team registry later.

---

## 5. Core Product Objects

### 5.1 Context Pack

A Context Pack is a structured, versioned bundle of AI-ready and human-readable context.

A pack can represent:

1. A person.
2. A project.
3. A company.
4. A product line.
5. A technical system.
6. A workflow.
7. An internal KB.
8. A support process.
9. A tool.
10. A domain research set.
11. A family or household context set.
12. A public reference set.

### 5.2 Record

A record is a structured unit inside a pack.

Examples:

1. Product model.
2. Decision.
3. Procedure.
4. Person.
5. Project.
6. Device.
7. Tool.
8. Source summary.
9. Configuration rule.
10. Preference.
11. Known issue.
12. Timeline event.

### 5.3 Source

A source is where context comes from.

Examples:

1. Markdown file.
2. Obsidian note.
3. ChatGPT conversation export.
4. Claude conversation export.
5. GitHub repository file.
6. PDF.
7. CSV.
8. OpenWhispr transcript.
9. Manual entry.
10. Public documentation URL.
11. Local document folder.

### 5.4 Collector

A collector is a guided workflow for building or updating a pack.

Collector types:

1. Form collector.
2. Text interview collector.
3. Voice interview collector.
4. Import collector.
5. AI-assisted source collector.
6. Update collector.

### 5.5 Export Profile

An export profile defines how selected pack content is transformed for a target.

Targets:

1. ChatGPT.
2. Claude.
3. Claude Code.
4. Codex.
5. OpenCode.
6. Cursor.
7. Open WebUI.
8. AnythingLLM.
9. Hermes.
10. OpenClaw.
11. Local agents.
12. Generic Markdown.
13. llms.txt style output.
14. JSON records.
15. CSV tables.

### 5.6 Review Item

A review item is something that requires user attention.

Examples:

1. Missing required field.
2. Broken source link.
3. Stale source.
4. Unreviewed AI draft.
5. Sensitive field included in export.
6. Conflicting records.
7. Failed validation.
8. License warning.
9. New source update detected.
10. Export profile needs refresh.

### 5.7 Pack Health

Pack Health measures whether a pack is current, source-backed, valid, safe, and export-ready.

Signals:

1. Schema validity.
2. Source freshness.
3. Review queue count.
4. Missing fields.
5. Broken links.
6. Sensitive export warnings.
7. Contradictions, later.
8. Source coverage.
9. Export readiness.
10. Human-reviewed status.

### 5.8 Composer

The Composer creates a new context pack or export from selected packs, records, tags, entities, or sources.

Examples:

1. Build a Claude research pack from selected product records.
2. Build a Codex project pack from project and system records.
3. Build a redacted support pack for a contractor.
4. Build a public-safe reference pack.
5. Build a temporary troubleshooting pack.

---

## 6. Pack Format

### 6.1 Pack Folder Structure

Recommended pack folder:

```text
packs/
  ai-workstation-pack/
    contextarr-pack.json
    README.md
    CHANGELOG.md
    LICENSE
    records/
      hardware.md
      gpus.md
      local-ai-stack.md
      storage.md
      networking.md
    sources/
      sources.yaml
    collectors/
      workstation-collector.yaml
    exports/
      chatgpt.yaml
      claude.yaml
      codex.yaml
    rules/
      validation.yaml
      redaction.yaml
      freshness.yaml
    assets/
      cover.png
    examples/
      sample-export.md
```

### 6.2 Manifest

File: `contextarr-pack.json`

Required fields:

```json
{
  "id": "ai-workstation-pack",
  "name": "AI Workstation Pack",
  "version": "1.0.0",
  "description": "Essential context for AI-powered developer workstations.",
  "type": "technical_system",
  "visibility": "local",
  "trustLevel": "local",
  "author": "Contextarr Demo",
  "license": "MIT",
  "createdAt": "2026-05-07T00:00:00Z",
  "updatedAt": "2026-05-07T00:00:00Z",
  "lastReviewedAt": null,
  "containsPersonalData": false,
  "containsExecutableCode": false,
  "requiresNetwork": false,
  "permissions": {
    "readVault": false,
    "writeDrafts": true,
    "runCommands": false,
    "networkAccess": false
  },
  "recordsPath": "records",
  "sourcesPath": "sources/sources.yaml",
  "exportsPath": "exports",
  "rulesPath": "rules",
  "assets": {
    "coverImage": "assets/cover.png",
    "accentColor": "#3b82f6"
  },
  "compatibility": {
    "contextarr": ">=0.1.0"
  }
}
```

### 6.3 Record Frontmatter

Example record:

```yaml
---
id: ai-workstation.local-ai-stack
title: Local AI Stack
type: system_component
pack: ai-workstation-pack
tags:
  - ai
  - local
  - stack
  - inference
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-07
sources:
  - ollama-docs
  - lm-studio-docs
  - open-webui-docs
review_status: approved
---
```

Body:

```markdown
# Local AI Stack

## Summary
Local-first software stack for development, inference, and orchestration.

## Key Components

| Component | Recommendation |
|---|---|
| Local model server | Ollama or LM Studio |
| UI | Open WebUI or AnythingLLM |
| Agent tooling | Codex, Claude Code, OpenCode |

## Notes
Use this pack when exporting context for AI workstation troubleshooting or local model setup.
```

### 6.4 Source Map

File: `sources/sources.yaml`

Example:

```yaml
sources:
  - id: ollama-docs
    type: url
    title: Ollama Documentation
    url: https://ollama.com/docs
    retrieved_at: 2026-05-07T00:00:00Z
    license: unknown
    trust: official
    status: current

  - id: workstation-manual-note
    type: markdown
    path: ../raw/workstation-notes.md
    retrieved_at: 2026-05-07T00:00:00Z
    trust: local
    status: current
```

### 6.5 Export Profile Schema

Example `exports/claude.yaml`:

```yaml
id: claude-deep-context
name: Claude Deep Context
target: claude
format: markdown
privacy_mode: redacted
include:
  records:
    - ai-workstation.local-ai-stack
    - ai-workstation.hardware
    - ai-workstation.gpus
exclude_tags:
  - secret
  - never_export
token_budget: 16000
sections:
  - summary
  - key_facts
  - constraints
  - do_not_assume
  - sources
```

### 6.6 Validation Rules

Example `rules/validation.yaml`:

```yaml
required_fields:
  record:
    - id
    - title
    - type
    - confidence
    - source_status
    - privacy

checks:
  - no_executable_code
  - no_shell_commands
  - no_api_keys
  - source_ids_exist
  - last_reviewed_present
  - export_profiles_valid
```

### 6.7 Redaction Rules

Example `rules/redaction.yaml`:

```yaml
redact_tags:
  - secret
  - health
  - financial
  - family_private
  - never_export

patterns:
  - name: api_key_like
    regex: "(?i)(api[_-]?key|secret|token)\\s*[:=]\\s*[^\\s]+"
    action: remove

  - name: email
    regex: "[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}"
    flags: i
    action: mask
```

### 6.8 Freshness Rules

Example `rules/freshness.yaml`:

```yaml
stale_after_days:
  default: 90
  technical_system: 60
  product_reference: 30
  internal_kb: 45
  personal_context: 120
```

---

## 7. Core Workflows

### 7.1 Build Pack From Scratch

1. User chooses New Pack.
2. User selects pack type.
3. Contextarr suggests a collector.
4. User answers guided questions.
5. Contextarr creates draft records.
6. User reviews and approves records.
7. Contextarr validates pack.
8. Pack appears in library.
9. Export profiles become available.

### 7.2 Build Pack From Existing Files

1. User adds a source folder.
2. Contextarr scans supported files.
3. Contextarr suggests records.
4. Drafts enter review queue.
5. User approves or edits.
6. Contextarr writes records to pack.

### 7.3 Build Pack From Obsidian Vault

1. User selects Obsidian vault path.
2. Contextarr scans Markdown and frontmatter.
3. User chooses folders or tags.
4. Contextarr suggests pack categories.
5. Draft records enter review queue.
6. User approves.

### 7.4 Build Pack From ChatGPT Export

1. User imports official ChatGPT export file.
2. Contextarr parses locally.
3. Contextarr groups conversations.
4. Contextarr suggests reusable facts and project records.
5. User reviews.
6. Approved records become pack content.

### 7.5 Build Pack From Claude Export

Same as ChatGPT export, with Claude-specific parsing.

### 7.6 Build Pack From OpenWhispr Notes

1. User points Contextarr at OpenWhispr notes or exports.
2. Contextarr filters notes using title or tag conventions.
3. Notes become draft sources.
4. User reviews transcript.
5. Contextarr turns approved transcript content into records.

### 7.7 Compose Custom Export

1. User opens Composer.
2. User selects packs or records.
3. User filters by tags, type, source status, health, freshness, or privacy.
4. User selects target.
5. Contextarr builds export preview.
6. User reviews redaction warnings.
7. User saves or copies export.

### 7.8 Query Through MCP

1. User enables read-only MCP.
2. AI client connects locally.
3. AI client calls `list_packs`.
4. AI client calls `query_pack_context`.
5. Contextarr returns selected, redacted, source-backed context.
6. Contextarr logs query metadata locally.

---

## 8. UI Requirements

### 8.1 App Shell

Left nav:

1. Library.
2. Packs.
3. Collectors.
4. Sources.
5. Review Queue.
6. Composer.
7. Exports.
8. Registry.
9. Health.
10. Settings.
11. System.

Top bar:

1. Global search.
2. Activity icon.
3. Import icon.
4. Notifications.
5. Help.
6. User/settings menu.

### 8.2 Pack Library Views

Required view modes:

1. Cover Grid.
2. Compact Cards.
3. Dense Table.

Cover Grid fields:

1. Cover image.
2. Pack name.
3. Pack type.
4. Health score.
5. Trust badge.
6. Last reviewed date.

Compact Card fields:

1. Thumbnail.
2. Pack name.
3. Description.
4. Category.
5. Health score.
6. Trust badge.
7. Source count.
8. Record count.
9. Last reviewed date.
10. Quick actions.

Dense Table columns:

1. Pack.
2. Type.
3. Trust.
4. Health.
5. Records.
6. Sources.
7. Review Queue.
8. Last Reviewed.
9. Version.
10. Actions.

### 8.3 Pack Detail Page

Header:

1. Cover image.
2. Pack name.
3. Description.
4. Type.
5. Health score.
6. Trust badge.
7. Version.
8. Last reviewed.
9. Export button.
10. Compose From This button.
11. Edit Metadata button.

Tabs:

1. Overview.
2. Records.
3. Sources.
4. Exports.
5. Health.
6. Activity.
7. Changelog.

Overview content:

1. Summary.
2. Pack stats.
3. Health warnings.
4. Export profiles.
5. Related packs.
6. Metadata.

Records content:

1. Section list.
2. Record table.
3. Human-readable record page.
4. Source links.
5. Confidence score.
6. Last reviewed.
7. Tags.
8. Related records.

Sources content:

1. Source table.
2. Source status.
3. Last checked.
4. Records depending on source.
5. Broken source warnings.

Exports content:

1. Export profiles.
2. Preview.
3. Token estimate.
4. Redaction warnings.
5. Copy/download.

Health content:

1. Health score breakdown.
2. Validation issues.
3. Review queue.
4. Stale records.
5. Broken links.
6. Redaction warnings.

### 8.4 Human-Readable Rendering

The rendered HTML must support:

1. Pack overview pages.
2. Record detail pages.
3. Tables.
4. Cards.
5. Timelines.
6. Source maps.
7. Export previews.
8. Changelogs.
9. Printable views later.
10. Static export later.

### 8.5 Theme and Customization

v0:

1. Dark mode.
2. Light mode.
3. Accent color.
4. Custom pack cover.
5. Generated cover fallback.

Later:

1. CSS-only themes.
2. Branded team exports.
3. Static site themes.

Security rule:

No theme JavaScript in v0 or v1.

---

## 9. MCP Requirements

### 9.1 MCP Scope

MCP is read-only in v0 and v1.

### 9.2 MCP Tools

Initial tools:

1. `list_packs`
2. `get_pack_summary`
3. `query_pack_context`
4. `get_record`
5. `list_export_profiles`
6. `build_export_preview`

### 9.3 MCP Tool Rules

1. No mutation.
2. No shell execution.
3. No network access.
4. No secret access.
5. No raw private source dump unless explicitly configured.
6. Respect pack privacy and export profile rules.
7. Log local query metadata.

### 9.4 Future MCP Tools

Later only:

1. `draft_record_update`
2. `draft_pack_update`
3. `list_review_items`

All write-like behavior must create drafts only.

---

## 10. Security Requirements

### 10.1 Pack Safety

Every pack must pass validation before activation.

Required checks:

1. No executable files.
2. No shell commands.
3. No scripts.
4. No hidden binary payloads.
5. No remote script includes.
6. No API key patterns.
7. No credential patterns.
8. No disallowed permissions.
9. Source map present.
10. License field present.
11. Trust level present.

### 10.2 Trust Levels

Trust levels:

1. Official.
2. Verified.
3. Community.
4. Local.
5. Unreviewed.
6. Deprecated.
7. Blocked.

v0 should only ship:

1. Official demo packs.
2. Local user-created packs.
3. Unreviewed imported packs.

### 10.3 Pack Installation Rules

v0:

1. Install from local folder.
2. Install from local zip.
3. No remote install by default.

v1:

1. Install from GitHub URL with warning.
2. Validate before activation.
3. Show permissions and contents.

### 10.4 AI-Drafted Content

AI-drafted content must be quarantined as draft.

It may not:

1. Become approved content automatically.
2. Be exported automatically.
3. Be included in MCP results by default.
4. Be published without review.

### 10.5 Local API Security

1. Bind to localhost by default.
2. Require local auth token if API is enabled.
3. Never bind to 0.0.0.0 unless user explicitly enables LAN mode.
4. Show warning before enabling LAN mode.
5. No external telemetry by default.

---

## 11. Architecture Recommendation

### 11.1 Recommended Stack

Initial stack should prioritize speed of implementation, readability, and Codex friendliness.

Recommended:

1. TypeScript monorepo.
2. Node.js backend.
3. Fastify or Hono API server.
4. SQLite with Drizzle or better-sqlite3.
5. React plus Vite for UI.
6. Tailwind or CSS variables for styling.
7. Lucide or similar icon set.
8. Zod for schema validation.
9. Docker Compose.
10. MCP SDK for local MCP server.
11. Markdown parser with sanitization.
12. Full-text search with SQLite FTS5.

Do not use Postgres in v0.
Do not use vector database in v0.
Do not use arbitrary plugin execution.

### 11.2 Monorepo Structure

```text
contextarr/
  README.md
  LICENSE
  package.json
  pnpm-workspace.yaml
  docker-compose.yml
  .env.example

  apps/
    web/
      src/
      public/
      vite.config.ts

    server/
      src/
        api/
        core/
        db/
        mcp/
        validation/
        exports/
        renderer/
        importers/
      tests/

    cli/
      src/

  packages/
    schema/
      src/
      schemas/
    renderer/
      src/
    export-profiles/
      src/
    pack-validator/
      src/

  demo-packs/
    ai-workstation-pack/
    jellyfin-media-server-pack/
    claude-code-project-pack/
    internal-support-kb-pack/
    fake-product-line-pack/

  docs/
    prd.md
    architecture.md
    pack-format.md
    security-model.md
    mcp.md
    demo-script.md
```

### 11.3 Database Tables

SQLite tables:

1. packs.
2. records.
3. sources.
4. review_items.
5. export_profiles.
6. exports.
7. pack_health.
8. events.
9. settings.
10. mcp_query_log.

SQLite must be rebuildable from pack folders except settings and logs.

### 11.4 File Watcher

v0 can use manual rescan.

v1 can add file watcher.

### 11.5 Search

v0:

1. SQLite FTS.
2. Tags.
3. Pack type.
4. Source status.
5. Health.

Later:

1. Optional embeddings.
2. Related records.
3. Semantic search.

---

## 12. Phase Plan

### Phase 0: Repo Initialization and Decision Records

Goals:

1. Create repo.
2. Add PRD.
3. Add architecture docs.
4. Add security model.
5. Add pack format docs.
6. Add non-goals.
7. Add first demo plan.

Deliverables:

1. Working monorepo structure.
2. README.
3. Docker Compose stub.
4. Docs.
5. No app functionality required yet.

### Phase 1: Pack Schema and Validator

Goals:

1. Define manifest schema.
2. Define record schema.
3. Define source map schema.
4. Define export profile schema.
5. Implement validator.
6. Validate demo packs.

Deliverables:

1. `contextarr validate ./demo-packs`
2. JSON output.
3. Human-readable validation report.
4. Tests.

### Phase 2: Demo Packs

Goals:

Create realistic fake packs:

1. AI Workstation Pack.
2. Jellyfin Media Server Pack.
3. Claude Code Project Pack.
4. Internal Support KB Pack.
5. Product Line Pack.

Deliverables:

1. Pack manifests.
2. Records.
3. Sources.
4. Export profiles.
5. Validation rules.
6. Covers or generated cover metadata.

### Phase 3: Local Index and API

Goals:

1. Load packs.
2. Build SQLite index.
3. Expose API endpoints.
4. Search packs and records.

API endpoints:

1. `GET /api/health`
2. `GET /api/packs`
3. `GET /api/packs/:id`
4. `GET /api/packs/:id/records`
5. `GET /api/records/:id`
6. `GET /api/search?q=`
7. `POST /api/rescan`

### Phase 4: Local Web Dashboard

Goals:

1. Build app shell.
2. Build pack library.
3. Build cover grid.
4. Build compact cards.
5. Build dense table.
6. Build pack detail page.
7. Build record detail view.

Deliverables:

1. Library page.
2. Pack detail page.
3. Record page.
4. Source page.
5. Review queue placeholder.

### Phase 5: Renderer and Static HTML

Goals:

1. Render pack pages from source.
2. Render record pages.
3. Render source maps.
4. Render health reports.
5. Render export previews.

Deliverables:

1. `contextarr render ./demo-packs --out ./dist`
2. Static output.
3. CSS-only theme.
4. Sanitized Markdown.

### Phase 6: Pack Health and Review Queue

Goals:

1. Calculate pack health v0.
2. Generate review items from validation.
3. Show review queue.
4. Allow accept, ignore, mark reviewed, and edit later.

Health checks:

1. Missing fields.
2. Stale review date.
3. Broken source reference.
4. Export profile invalid.
5. Sensitive field in export.
6. Unreviewed draft.

### Phase 7: Export Engine

Goals:

1. Build ChatGPT export.
2. Build Claude export.
3. Build Codex export.
4. Build generic Markdown export.
5. Build JSON records export.
6. Build redacted export.

Deliverables:

1. Export preview UI.
2. Copy button.
3. Download file.
4. CLI export command.

### Phase 8: Read-Only MCP

Goals:

1. Add MCP server.
2. Add `list_packs`.
3. Add `get_pack_summary`.
4. Add `query_pack_context`.
5. Add `get_record`.
6. Add setup docs for Claude Desktop or Claude Code where applicable.

Deliverables:

1. MCP server command.
2. Docs.
3. Demo using a local AI tool.

### Phase 9: Importers v1

Goals:

1. Local folder import.
2. Markdown folder import.
3. Obsidian import.
4. ChatGPT export parser, basic.
5. Claude export parser, basic.
6. Draft records only.

### Phase 10: Composer v0

Goals:

1. Select packs.
2. Select records.
3. Filter by tags.
4. Choose export profile.
5. Build custom temporary export.
6. Save as new pack later.

### Phase 11: Packaging and Launch

Goals:

1. Docker Compose stable.
2. README polished.
3. Screenshots.
4. Demo video script.
5. Security notes.
6. Roadmap.
7. GitHub release.

---

## 13. Codex Build Guidance

### 13.1 How Rob Should Guide Codex

Do not ask Codex to build everything at once.

Use small passes with acceptance criteria.

Each pass should:

1. State goal.
2. State hard boundaries.
3. State files to create.
4. State tests or validation to run.
5. Ask for a summary and next steps.

### 13.2 Global Codex Rules

Codex must follow these rules:

1. Do not deploy.
2. Do not buy domains.
3. Do not upload data.
4. Do not call external AI APIs unless explicitly asked.
5. Do not include real private data.
6. Do not build hosted cloud.
7. Do not build marketplace.
8. Do not add executable pack support.
9. Do not add direct Gmail or bank connectors.
10. Do not add telemetry.
11. Keep pack files as source of truth.
12. Keep SQLite rebuildable.
13. Write tests for schemas and validation.
14. Keep security model visible.

### 13.3 Codex Prompt 1: Initialize Repo

```text
You are Codex acting as senior full-stack architect and repo operator.

Project:
Contextarr.

Goal:
Initialize a new repo for a self-hosted context pack builder and manager for AI assistants and agents.

Hard boundaries:
Do not deploy.
Do not call AI APIs.
Do not add cloud services.
Do not add executable pack support.
Do not include real private data.
Do not build marketplace features.

Create a TypeScript monorepo with:
- apps/web
- apps/server
- apps/cli
- packages/schema
- packages/renderer
- packages/pack-validator
- packages/export-profiles
- demo-packs
- docs

Create:
README.md
LICENSE, Apache-2.0 unless otherwise blocked
package.json
pnpm-workspace.yaml
docker-compose.yml
.env.example
docs/prd.md
docs/architecture.md
docs/pack-format.md
docs/security-model.md
docs/roadmap-phases.md

The README should position Contextarr as:
A self-hosted context automation system and pack manager for AI assistants and agents.

Stop after repo skeleton, docs, and package setup. Do not implement app functionality yet.
```

### 13.4 Codex Prompt 2: Pack Schema and Validator

```text
Goal:
Implement the Contextarr pack schema and validator.

Create Zod schemas for:
- contextarr-pack.json manifest
- record frontmatter
- source map
- export profile
- validation rules
- redaction rules
- freshness rules

Create CLI command:
contextarr validate <path>

The validator must check:
- manifest exists
- required manifest fields
- containsExecutableCode is false
- permissions do not allow runCommands or networkAccess
- records folder exists
- record IDs are unique
- source IDs referenced by records exist
- export profiles are valid
- no obvious script files are present
- no shell command patterns in pack metadata

Add tests using fake fixture packs.

Stop after validator works and tests pass.
```

### 13.5 Codex Prompt 3: Demo Packs

```text
Goal:
Create realistic fake demo packs for Contextarr.

Create these packs under demo-packs:
1. ai-workstation-pack
2. jellyfin-media-server-pack
3. claude-code-project-pack
4. internal-support-kb-pack
5. fake-product-line-pack

Each pack must include:
- contextarr-pack.json
- README.md
- LICENSE
- CHANGELOG.md
- 5 to 10 records in Markdown with frontmatter
- sources/sources.yaml
- exports/chatgpt.yaml
- exports/claude.yaml
- exports/codex.yaml
- rules/validation.yaml
- rules/redaction.yaml
- rules/freshness.yaml

All data must be fake or public-safe.
No real private company data.
No credentials.
No executable scripts.

Run validator against all demo packs.
Stop after validation passes.
```

### 13.6 Codex Prompt 4: Index and API

```text
Goal:
Implement local pack indexing and a basic API server.

Use SQLite as derived index.
Do not treat SQLite as source of truth.
The index must be rebuildable from pack folders.

Implement:
- pack loader
- record loader
- source loader
- SQLite schema
- rescan command
- Fastify or Hono API server

API endpoints:
GET /api/health
GET /api/packs
GET /api/packs/:id
GET /api/packs/:id/records
GET /api/records/:id
GET /api/search?q=
POST /api/rescan

Add tests for loading demo packs.
Stop after API returns demo pack data.
```

### 13.7 Codex Prompt 5: Web UI Shell and Library

```text
Goal:
Build the initial Contextarr local web UI.

Use React, Vite, TypeScript, and local API.

Implement app shell:
- left sidebar
- top search bar
- system health card
- nav sections: Library, Packs, Collectors, Sources, Review Queue, Composer, Exports, Registry, Health, Settings

Implement Pack Library with three views:
- Cover Grid
- Compact Cards
- Dense Table

Use demo packs.
No external UI service.
No telemetry.

Style:
Dark, polished, self-hosted dashboard feel.
Power-user friendly.
Do not copy Radarr branding.

Stop after library views work.
```

### 13.8 Codex Prompt 6: Pack Detail and Record Rendering

```text
Goal:
Build pack detail pages and human-readable record rendering.

Implement:
- pack header
- tabs: Overview, Records, Sources, Exports, Health, Activity, Changelog
- Overview card
- Pack Stats
- Health Warnings placeholder
- Export Profiles card
- Related Packs placeholder
- Records tab with section list and record detail view
- Sources tab with source map table

Markdown rendering must sanitize HTML.
No user JavaScript.
No external scripts.

Stop after AI Workstation Pack displays cleanly.
```

### 13.9 Codex Prompt 7: Pack Health and Review Queue

```text
Goal:
Implement Pack Health v0 and Review Queue v0.

Health checks:
- missing required fields
- stale review date
- broken source references
- invalid export profile
- sensitive tag in export profile
- unreviewed draft record
- deprecated pack version flag

Review items must include:
- id
- type
- severity
- packId
- recordId optional
- sourceId optional
- message
- suggestedAction
- status

Implement UI:
- Review Queue page
- Pack Health page
- Health badges on library and detail pages

No AI contradiction scanner yet.
Stop after health and review queue are deterministic and tested.
```

### 13.10 Codex Prompt 8: Export Engine

```text
Goal:
Implement export engine for Contextarr.

Targets:
- ChatGPT
- Claude
- Codex
- Generic Markdown
- JSON records

Features:
- export profile parser
- include/exclude records
- privacy mode
- redaction rules
- source summary
- export preview
- copy to clipboard in UI
- download export file
- CLI export command

Do not call external AI APIs.
Do not upload data.

Stop after exports work for demo packs.
```

### 13.11 Codex Prompt 9: Read-Only MCP

```text
Goal:
Implement a read-only local MCP server for Contextarr.

Tools:
- list_packs
- get_pack_summary
- query_pack_context
- get_record
- list_export_profiles

Rules:
- read-only only
- no file mutation
- no shell commands
- no network calls
- no executable pack support
- respect redaction rules when configured

Add docs for connecting local AI tools.
Do not implement hosted MCP.
Stop after MCP can query demo packs.
```

### 13.12 Codex Prompt 10: First Launch Prep

```text
Goal:
Prepare Contextarr v0.1 for public preview.

Create:
- polished README
- screenshots folder placeholder
- docs/quickstart.md
- docs/docker.md
- docs/security.md
- docs/pack-authoring.md
- docs/export-profiles.md
- docs/mcp.md
- docs/roadmap.md
- docs/demo-script.md

Verify:
- docker compose up works
- demo packs load
- validator passes
- web UI works
- exports work
- MCP docs are correct

Stop before release. Do not publish to GitHub unless explicitly instructed.
```

---

## 14. Success Criteria

### 14.1 Technical MVP Success

Contextarr v0.1 succeeds if:

1. It loads demo packs.
2. It validates packs.
3. It renders packs in local UI.
4. It exports usable context for ChatGPT, Claude, and Codex.
5. It exposes read-only MCP.
6. It shows Pack Health and Review Queue.
7. It runs with Docker Compose.
8. Users can inspect all source files.

### 14.2 Community Success

Signals:

1. GitHub stars.
2. Issues from real users.
3. Pull requests.
4. Users asking for pack format improvements.
5. Users submitting demo packs.
6. Users asking for importers.
7. Users asking for Studio app.
8. Users asking for paid setup.

### 14.3 Monetization Signals

Signals:

1. Paid setup requests.
2. Requests for Pro packs.
3. Requests for private team registry.
4. Requests for polished desktop app.
5. Requests for migration from Obsidian or ChatGPT exports.

### 14.4 Kill or Pivot Signals

Pause if:

1. Users only see it as another memory server.
2. Nobody cares about pack format.
3. Nobody exports to more than one tool.
4. Users do not maintain packs after initial setup.
5. Security concerns dominate feedback.
6. The UI is too complicated for power users.

---

## 15. First Public Demo Script

Title:

**Stop re-explaining your systems to AI.**

Flow:

1. Open a fresh Claude or ChatGPT session.
2. Ask a specific question about a fake AI workstation or support KB.
3. Show the AI lacks context or asks for details.
4. Open Contextarr.
5. Show AI Workstation Pack.
6. Show records, sources, Pack Health, and review queue.
7. Export Claude or Codex pack.
8. Use export or MCP to answer the same question.
9. Show improved answer.
10. Open raw Markdown files to prove local ownership.
11. End with Docker quickstart and GitHub repo.

---

## 16. Final Recommendation

Build Contextarr.

Build it narrowly.

First version:

```text
Self-hosted context pack compiler and manager.
```

Not:

```text
Marketplace.
Cloud vault.
AI memory app.
Chatbot.
Public GEO registry.
Executable skill runner.
```

The first winning product is:

```text
Local sources in.
Validated context packs out.
Human-readable dashboard.
Read-only MCP.
AI exports.
```

If that gets pull, build:

1. Better importers.
2. Better collectors.
3. Pack composer.
4. Contextarr Studio.
5. Official Pro Packs.
6. Private team registry.

If that does not get pull, do not expand into consumer app, marketplace, or cloud features.
