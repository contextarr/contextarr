---
id: aws-infrastructure-pack.cost-controls
title: Cost Controls
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
  - aws-infrastructure-pack-cost-controls-source
review_status: approved
---

# Cost Controls

The account set is operated like a cost-aware homelab where unmanaged spend is an incident.

## Synthetic Operating Context

- Durable resources use synthetic labels: core, experiment, backup, or observability.
- Sandbox resources carry a review date and owner-role note.
- Monthly spend review focuses on idle compute, oversized databases, unbounded logs, and stale snapshots.
- Cost anomalies are triaged before adding new services.
- Budget examples are relative thresholds, not real dollar commitments.

## Assistant Use

Assistants may summarize this cloud infrastructure context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
