---
id: tailscale-vpn-pack.exit-node-policy
title: Exit Node Policy
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
  - tailscale-vpn-pack-exit-node-policy-source
review_status: approved
---

# Exit Node Policy

Exit nodes are sensitive because they can change traffic path and privacy expectations.

## Synthetic Operating Context

- Exit-node use is disabled by default for routine homelab access.
- Temporary use requires a reason, owner role, and review window.
- Travel or untrusted-network scenarios are documented at policy level only.
- Exit-node devices must not also be experimental lab nodes.
- Usage evidence is summarized as policy review notes, not traffic logs.

## Assistant Use

Assistants may summarize this private network operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
