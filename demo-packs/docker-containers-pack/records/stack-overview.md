---
id: docker-containers-pack.stack-overview
title: Stack Overview
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
  - docker-containers-pack-stack-overview-source
review_status: approved
---

# Stack Overview

Maple Dock is a synthetic self-hosted stack for a small household lab.

## Synthetic Operating Context

- Core services include a reverse proxy, dashboard, media indexer, document vault, metrics collector, and backup helper.
- Experimental services live in a separate stack and cannot share persistent volumes with core services.
- Containers are grouped by ingress, applications, data stores, observability, and maintenance.
- Service ownership is documented by role rather than personal name.
- The pack documents relationships and risk, not executable compose syntax.

## Assistant Use

Assistants may summarize this container operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
