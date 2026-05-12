---
id: tailscale-vpn-pack.tailnet-overview
title: Tailnet Overview
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
  - tailscale-vpn-pack-tailnet-overview-source
review_status: approved
---

# Tailnet Overview

Northstar Tailnet is a synthetic private connectivity model for a homelab and small project workspace.

## Synthetic Operating Context

- The tailnet connects maintainer laptops, one lab server class, one media server class, and selected mobile clients.
- Access is grouped by maintainer, observer, service, and temporary collaborator roles.
- The default posture is private access to specific services, not broad flat-network reachability.
- Public examples use generic node labels only.
- The pack avoids real tailnet names, emails, device keys, domains, and node identifiers.

## Assistant Use

Assistants may summarize this private network operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
