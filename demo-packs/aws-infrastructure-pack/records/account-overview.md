---
id: aws-infrastructure-pack.account-overview
title: Account Overview
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
  - aws-infrastructure-pack-account-overview-source
review_status: approved
---

# Account Overview

The demo organization uses sandbox, staging, and production account categories without account numbers, ARNs, real users, or billing identifiers.

## Synthetic Operating Context

- Sandbox is disposable and time-boxed for provider feature trials.
- Staging mirrors production shape with synthetic data only.
- Production hosts static front ends, queue-backed jobs, and a small metrics collector.
- Billing and change ownership are documented by role, not by personal identity.
- No record is a live account inventory, credential source, or deployment target.

## Assistant Use

Assistants may summarize this cloud infrastructure context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
