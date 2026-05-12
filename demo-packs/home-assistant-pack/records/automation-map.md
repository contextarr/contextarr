---
id: home-assistant-pack.automation-map
title: Automation Map
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
  - home-assistant-pack-automation-map-source
review_status: approved
---

# Automation Map

Automation records describe intent, guardrails, and review status without executable YAML.

## Synthetic Operating Context

- Comfort automations adjust lights and climate based on broad mode categories.
- Utility automations send maintenance reminders for filters, batteries, and backup checks.
- Energy automations reduce nonessential load during synthetic peak windows.
- Notification automations avoid sensitive occupancy details in message text.
- Safety-impacting automations require manual review and are not executable examples.
- Access-related automations, including locks, doors, and alarm-adjacent states, are review-only and excluded from demo changes.
- Comfort automations may be adjusted at the policy-description level when they do not imply occupancy, security, or health decisions.
- Water, heat, and power-protection automations are treated as safety-impacting because false actions can cause damage.
- Every automation class lists an owner role, allowed assistant action, and human-review trigger.

## Assistant Use

Assistants may summarize this home automation operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
