---
id: home-assistant-pack.device-groups
title: Device Groups
type: home_automation_note
pack: home-assistant-pack
tags:
  - starter
  - public_safe
  - home_automation
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-09
sources:
  - home-assistant-pack-device-groups-source
review_status: approved
---

# Device Groups

Devices are grouped by operational role rather than brand, exact room, or unique identifier.

## Synthetic Operating Context

- Lighting devices are split between everyday scenes and utility visibility.
- Climate devices include thermostat class, air-quality class, and circulation helper class.
- Presence-safe sensors report coarse occupancy state only and exclude personal tracking.
- Energy monitors are used for trend awareness, not billing-grade claims.
- Security-sensitive devices are restricted and excluded from public examples.

## Assistant Use

Assistants may summarize this home automation operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
