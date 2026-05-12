---
id: aws-infrastructure-pack.iam-boundaries
title: IAM Boundaries
type: infrastructure_note
pack: aws-infrastructure-pack
tags:
  - starter
  - public_safe
  - cloud_infrastructure
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-09
sources:
  - aws-infrastructure-pack-iam-boundaries-source
review_status: approved
---

# IAM Boundaries

IAM is described by job function, short review loops, and least-privilege maintenance access.

## Synthetic Operating Context

- `viewer` can inspect health, inventory, and logs without changing infrastructure.
- `deployer` can promote reviewed application artifacts but cannot create IAM roles.
- `platform-maintainer` can update shared networking, backups, and monitoring after review.
- `break-glass` is a sealed emergency path with post-incident review.
- The record omits real policies, ARNs, usernames, access keys, and permission snippets.

## Assistant Use

Assistants may summarize this cloud infrastructure context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
