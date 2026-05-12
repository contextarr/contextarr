---
id: tailscale-vpn-pack.device-inventory
title: Device Inventory
type: vpn_note
pack: tailscale-vpn-pack
tags:
  - starter
  - public_safe
  - networking_security
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-09
sources:
  - tailscale-vpn-pack-device-inventory-source
review_status: approved
---

# Device Inventory

Device inventory uses role categories and trust posture.

## Synthetic Operating Context

- Maintainer workstation class has administrative access to documented service categories.
- Mobile device class has limited personal access and no route-advertising role.
- Lab server class can expose selected internal services after review.
- Media server class is reachable by approved clients but cannot administer the tailnet.
- Temporary collaborator class expires after the project window closes.

## Assistant Use

Assistants may summarize this private network operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
