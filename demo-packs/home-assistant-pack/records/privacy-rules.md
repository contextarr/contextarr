---
id: home-assistant-pack.privacy-rules
title: Privacy Rules
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
  - home-assistant-pack-privacy-rules-source
review_status: approved
---

# Privacy Rules

Privacy rules define what must stay out of context packs and public demos.

## Synthetic Operating Context

- Exclude occupant names, routines, arrivals, departures, and room-level presence history.
- Exclude camera images, door histories, alarm states, and lock controls.
- Exclude exact geolocation, address clues, WiFi names, tokens, and webhook paths.
- Summarize logs as categories and symptoms, not raw event streams.
- Public examples use fictional room groups and generic device classes only.

## Assistant Use

Assistants may summarize this home automation operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
