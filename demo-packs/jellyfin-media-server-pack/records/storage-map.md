---
id: jellyfin-media-server-pack.storage-map
title: Storage Map
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
  - jellyfin-media-server-pack-storage-map-source
review_status: approved
---

# Storage Map

Storage is documented by role and recoverability without host paths.

## Synthetic Operating Context

- `media-primary` represents large read-heavy media storage.
- `metadata-state` represents configuration, posters, indexes, and plugin state.
- `transcode-cache` is disposable and should not be backed up.
- `incoming-review` holds newly added media until naming and metadata are checked.
- `offline-copy` represents a disconnected backup target verified during maintenance.

## Assistant Use

Assistants may summarize this media server operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
