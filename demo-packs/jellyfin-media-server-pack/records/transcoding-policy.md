---
id: jellyfin-media-server-pack.transcoding-policy
title: Transcoding Policy
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
  - jellyfin-media-server-pack-transcoding-policy-source
review_status: approved
---

# Transcoding Policy

Transcoding decisions balance user experience, resource limits, and fallbacks.

## Synthetic Operating Context

- Direct play is preferred for local clients whenever format and bandwidth allow.
- Hardware transcoding is reserved for remote clients, older devices, and constrained sessions.
- The transcode cache is disposable and monitored for runaway growth.
- Quality complaints are documented by client class, media class, and observed symptom.
- The record excludes codec commands, device mappings, and driver setup steps.

## Assistant Use

Assistants may summarize this media server operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
