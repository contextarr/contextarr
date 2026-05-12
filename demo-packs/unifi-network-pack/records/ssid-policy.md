---
id: unifi-network-pack.ssid-policy
title: SSID Policy
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
  - unifi-network-pack-ssid-policy-source
review_status: approved
---

# SSID Policy

Wireless networks are named by audience and risk level in documentation.

## Synthetic Operating Context

- Primary SSID category is for trusted household devices.
- Guest SSID category is time-bounded and isolated from local services.
- IoT SSID category is limited to onboarding and approved service discovery.
- Lab SSID category is disabled unless a test window is documented.
- Passwords, QR codes, and real SSID names are never included.

## Assistant Use

Assistants may summarize this network operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
