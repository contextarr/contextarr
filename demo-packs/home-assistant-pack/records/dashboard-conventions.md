---
id: home-assistant-pack.dashboard-conventions
title: Dashboard Conventions
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
  - home-assistant-pack-dashboard-conventions-source
review_status: approved
---

# Dashboard Conventions

Dashboards are organized for quick status review while keeping sensitive household context out of exports.

## Synthetic Operating Context

- Main dashboard shows room comfort, lighting state, and high-level maintenance alerts.
- Energy dashboard shows trends and device classes, not account or billing details.
- Maintenance dashboard tracks batteries, integrations, backups, and stale automations.
- Guest dashboard exposes only non-sensitive comfort controls.
- Restricted dashboard categories are never included in public sample exports.

## Assistant Use

Assistants may summarize this home automation operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
