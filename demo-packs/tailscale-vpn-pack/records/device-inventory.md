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
- Stale personal-device entries are flagged when the owner class is unknown, the role is unclear, or the device no longer maps to an active support need.
- Route-capable devices must name a fictional route owner such as "lab steward" or "media steward" before review can pass.
- Shared-device classes are described by purpose only and avoid real person names, machine names, and operating-system fingerprints.
- Break-glass maintainer access is documented as a review category, not as a standing credential or bypass path.

## Assistant Use

Assistants may summarize this private network operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
