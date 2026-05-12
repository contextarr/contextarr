---
id: unifi-network-pack.device-inventory
title: Device Inventory
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
  - unifi-network-pack-device-inventory-source
review_status: approved
---

# Device Inventory

Inventory uses broad device classes and location labels.

## Synthetic Operating Context

- Gateway appliance is the primary routing device with config-backup ownership.
- Core switch feeds office, media, and access-point uplinks.
- Access points use coverage roles: main floor, work area, and fringe area.
- Infrastructure clients include controller host, monitoring node, and backup target categories.
- Device records include lifecycle status and owner role, never serials or MACs.

## Assistant Use

Assistants may summarize this network operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
