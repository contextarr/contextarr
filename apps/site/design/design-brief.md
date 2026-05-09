# Contextarr Landing Page Design Brief

## Objective

Rebuild the Contextarr homepage into a serious open-source product site that feels designed by a human operator. The homepage should explain the product through its actual object model and workflow, not through generic AI SaaS language.

## Core Message

Stop re-explaining your systems to AI.

Contextarr is a self-hosted context automation system and pack manager for AI assistants and agents. It turns local files, records, source maps, validation rules, redaction rules, and export profiles into validated Context Packs.

## Required Truths

- Current status: Phase 12 terminology planning, with the original PRD implemented through Phase 11 locally.
- Local files are the source of truth.
- SQLite is a rebuildable derived index.
- Context Packs are data-only and source-backed.
- MCP is local and read-only.
- Exports are explicit generated artifacts.
- Importers exist in CLI/core form, but web importer UI and API importer endpoints are not included yet.
- Composer previews exist, but saving composed exports as new packs is not included yet.
- Skills and Agent Kits are future direction only.
- Contextarr prepares Agent Kits later; it does not run them.

## Visual Principles

1. Lead with the product object.
   The Context Pack is the artifact. Every major section should reinforce source-backed packs, records, review state, export profiles, or MCP boundaries.

2. Use real proof.
   The running dashboard screenshot is safe to use. Do not invent screenshots. If screenshots are absent, use a labeled workflow diagram only.

3. Build a technical manual, not a launch gimmick.
   The site should feel like a self-hosted OSS tool with a sharp product point of view: quiet, precise, inspectable.

4. Replace decoration with structure.
   Use ruled grids, tables, terminal-like metadata, and screenshot plates. Avoid floating gradient orbs, giant blobs, and card soup.

5. Keep copy compact.
   Use direct labels, short paragraphs, and status language that does not overclaim maturity.

## Design Tokens

- Background: near-black `#05070b`
- Surface: `#0b111a`
- Raised surface: `#101925`
- Line: `#223247`
- Soft line: `rgba(144, 170, 204, 0.22)`
- Text: `#f4f7fb`
- Muted: `#9ba9ba`
- Faint: `#6d7b8d`
- Accent blue: `#2f7cff`
- Accent cyan: `#24d7ff`
- Positive: `#4be28a`
- Warning: `#f5b84b`
- Danger: `#ff5f77`

## Typography

Use self-hosted IBM Plex:

- IBM Plex Sans Variable for body and display.
- IBM Plex Mono for metadata, chips, manifests, and route labels.
- No external font requests.
- No viewport-width font scaling except clamp-based responsive display sizes.
- No negative letter spacing.

## Homepage Structure

1. Header
   Compact wordmark, GitHub, Security, Roadmap, Docs, View on GitHub.

2. Hero + Real Proof
   Huge headline, tight subheadline, phase status, CTAs, proof chips, and a large real dashboard screenshot plate.

3. Context Pack Anatomy
   Manifest, records, source references, review state, export profiles. This section explains the core object.

4. Source to Export Pipeline
   Local files -> Validate -> Index -> Review -> Render -> Export -> Read-only MCP.

5. Current Build Ledger
   Implemented vs not included yet, pulled from `status.ts`.

6. Security Boundaries
   Hard boundary list with explicit local-first posture.

7. Future Direction
   Skills tell agents how to work. Context Packs tell agents what to know. Agent Kits combine both for a task. Planned after core pack system stabilizes.

8. Built in Public CTA
   GitHub, Security, Roadmap.

## Prototype Verdict

Prototype A is the recommended direction: "technical field manual with real dashboard proof." It is more mature, less gimmicky, and better aligned with Contextarr's current stage than a synthetic command-center workbench.

Prototype B is useful for component density and pack anatomy details, but it risks looking like another fake product interface if used above the fold.

## Acceptance Criteria

- Homepage first viewport does not contain a fake screenshot.
- Real dashboard screenshot is labeled as real product proof.
- No cloud, telemetry, marketplace, agent runner, production-ready, fake testimonial, or fake logo claims.
- Security, roadmap, privacy, llms routes stay factually aligned.
- Static Astro only; no hydration, cookies, analytics, external scripts, or third-party embeds.
- Desktop and mobile screenshots are captured after implementation.
