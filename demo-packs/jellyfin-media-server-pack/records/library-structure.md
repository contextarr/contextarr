---
id: jellyfin-media-server-pack.library-structure
title: Library Structure
type: media_server_note
pack: jellyfin-media-server-pack
tags:
  - starter
  - public_safe
  - self_hosted_media
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-09
sources:
  - jellyfin-media-server-pack-library-structure-source
review_status: approved
---

# Library Structure

Libraries are organized around browsing needs rather than real titles or personal viewing patterns.

## Synthetic Operating Context

- Movies, series, music, home videos, and learning media are separate library classes.
- Home videos are private and excluded from public examples.
- Metadata corrections are recorded as category-level decisions, not title logs.
- Experimental libraries must not change stable naming rules.
- Library scans are scheduled to avoid active viewing windows.

## Assistant Use

Assistants may summarize this media server operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
