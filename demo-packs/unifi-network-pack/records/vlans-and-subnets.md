---
id: unifi-network-pack.vlans-and-subnets
title: VLANs And Subnets
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
  - unifi-network-pack-vlans-and-subnets-source
review_status: approved
---

# VLANs And Subnets

Segmentation is documented as intent rather than numeric VLAN IDs or private ranges.

## Synthetic Operating Context

- Trusted devices can reach shared services and management-approved resources.
- Guest devices reach the internet only and cannot discover internal services.
- IoT devices are isolated except for approved controller or media paths.
- Lab devices change often and must not bridge into management surfaces.
- Media devices can discover playback services without broad administrative reach.
- Operations traffic is treated as a maintainer-only class and is not mixed with routine client traffic.
- Camera-like IoT devices may publish status to approved monitoring categories but must not initiate broad client discovery.
- Printer-like shared devices are handled as narrow utility exceptions, not as trusted endpoints.
- Any new cross-segment path must name the source class, destination class, traffic purpose, and review owner.

## Assistant Use

Assistants may summarize this network operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
