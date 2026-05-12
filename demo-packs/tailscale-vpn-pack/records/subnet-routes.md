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
- Route ownership uses fictional roles such as "home-lab steward", "media steward", and "temporary project owner".
- A stale route fact is any route category whose owner, purpose, or review window is missing.
- Broad route categories are marked review-first when a narrower service share would answer the same support need.
- Assistants may identify route documentation gaps but must not infer or invent address ranges.

## Assistant Use

Assistants may summarize this private network operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
