---
id: aws-infrastructure-pack.environment-map
title: Environment Map
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
  - aws-infrastructure-pack-environment-map-source
review_status: approved
---

# Environment Map

Environment boundaries are based on risk and data sensitivity rather than individual developer ownership.

## Synthetic Operating Context

- Development remains local-first unless a managed-service behavior must be tested.
- Sandbox can be destroyed at any time and must not hold durable state.
- Staging contains representative queues, object storage, and database shapes with synthetic seed data.
- Production promotion requires a reviewed change note and rollback note.
- The pack excludes executable deployment steps and live endpoint names.

## Environment Matrix

| Environment | Purpose | Data class | Change gate | AI-safe review cue |
| --- | --- | --- | --- | --- |
| Local | Validate architecture notes and examples. | Mock records only. | Peer review optional. | Good for wording and diagram checks. |
| Sandbox | Exercise disposable service shapes. | Synthetic seed data. | Cleanup owner acknowledged. | Good for impact questions with no durable state. |
| Staging | Rehearse queue, storage, and database relationships. | Representative fake data. | Change note and rollback note reviewed. | Good for backup and cost policy comparison. |
| Production-like | Describe approved intent, not live resources. | No data exported. | Separate owner approval required. | Good for naming the next reviewer, not for action steps. |

## Review Routing

- Backup policy questions route through backup and recovery before deployment patterns.
- Cost policy questions route through cost controls before environment promotion.
- Access questions route through IAM boundaries before any service-specific record.
- The safe answer should name the record sequence and stop before provider-console or command-level detail.

## Assistant Use

Assistants may summarize this cloud infrastructure context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
