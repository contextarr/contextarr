---
id: docker-containers-pack.volumes-and-storage
title: Volumes And Storage
type: container_note
pack: docker-containers-pack
tags:
  - starter
  - public_safe
  - containers
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-09
sources:
  - docker-containers-pack-volumes-and-storage-source
review_status: approved
---

# Volumes And Storage

Storage is documented by data class so backup priority is clear without host paths.

## Synthetic Operating Context

- `config-state` holds service settings and is backed up before updates.
- `media-cache` can be rebuilt and has lower backup priority.
- `user-content-demo` is durable and reviewed before migration.
- `metrics-retention` is pruned on a fixed schedule to avoid unbounded growth.
- Bind mounts, device paths, and disk serials are intentionally omitted.

## Assistant Use

Assistants may summarize this container operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
