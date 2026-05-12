---
id: unifi-network-pack.firewall-notes
title: Firewall Notes
type: network_note
pack: unifi-network-pack
tags:
  - starter
  - public_safe
  - networking
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-09
sources:
  - unifi-network-pack-firewall-notes-source
review_status: approved
---

# Firewall Notes

Firewall notes record intent, review ownership, and risk category without rule exports.

## Synthetic Operating Context

- Default posture is deny between client zones unless an approved service path exists.
- Guest and IoT traffic are blocked from management surfaces.
- Lab-to-core exceptions expire at the end of a test window.
- Media discovery exceptions are narrow and documented by purpose.
- Firewall changes require a plain-English reason and rollback expectation.
- Allowed paths are described by traffic class, not by numeric ports or copied rule syntax.
- Remote-support traffic is marked review-only unless the maintainer has confirmed the support window is active.
- Deny decisions should preserve the business reason, such as guest privacy, IoT containment, or management-plane protection.
- Exceptions that support casting, printing, or controller reachability must identify the owning segment and expiry posture.

## Assistant Use

Assistants may summarize this network operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
