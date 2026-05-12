# Obsidian Vault Pack

Public-safe starter context for a fictional local Markdown knowledge vault.

This starter pack is a curated local example, not a marketplace listing and not an endorsement by Dynalist. Third-party marks are used only as identifiers.

The records are synthetic, public-safe notes for exercising Contextarr validation, review, render, compose, and export flows. The pack contains no credentials, no private data, no install hooks, and no executable commands.

## Why this pack exists

This pack demonstrates how a fictional Markdown vault can separate useful personal knowledge structure from notes that should never become AI context.

## What an AI can safely know

- The reviewed taxonomy for synthetic notes, including privacy class, review status, source status, freshness, and tag intent.
- Which example folders are safe summaries versus raw, daily, private, or source-only material.
- How export decisions should favor reviewed records over loose backlinks or raw note bodies.

## What must never be exported

- Private journals, health details, location notes, personal contacts, unreviewed daily notes, or source-only imports.
- Notes marked private, sensitive, draft, stale, never-export, or review-needed.
- Real vault paths, device paths, sync details, private backlinks, or copied third-party note content.

## Best export target

Use `markdown` for a human-readable AI brief or `json-records` when the consuming tool needs frontmatter-like metadata for review gates.

## Demo question to ask

Which notes should be excluded before export?

## Proof path

Review `records/frontmatter-rules.md` and `records/export-rules.md`, then compare them with `raw/frontmatter-rules.md` and `raw/export-rules.md` for the source-backed exclusion logic.
