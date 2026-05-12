---
id: tailscale-vpn-pack.subnet-routes
title: Subnet Routes
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
  - tailscale-vpn-pack-subnet-routes-source
review_status: approved
---

# Subnet Routes

Subnet route notes are high-level because route advertisements can expose private network structure.

## Synthetic Operating Context

- Home-lab route category is used only when individual service exposure is insufficient.
- Media route category is read-mostly and reviewed for client need.
- Management route category is discouraged and requires explicit maintainer review.
- Route approval notes include purpose, expiry, and observed impact.
- Numeric routes, gateways, and interface names are omitted.

## Assistant Use

Assistants may summarize this private network operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
