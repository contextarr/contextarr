---
id: tailscale-vpn-pack.access-controls
title: Access Controls
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
  - tailscale-vpn-pack-access-controls-source
review_status: approved
---

# Access Controls

Access control documentation describes policy intent without ACL files.

## Synthetic Operating Context

- Maintainers can reach admin surfaces for lab services and review logs.
- Observers can reach dashboards and read-only service pages where explicitly allowed.
- Service identities are limited to their workload category.
- Temporary collaborators are scoped to one project service and one expiration date.
- Broad access exceptions require a written reason and cleanup date.

## Assistant Use

Assistants may summarize this private network operations context, compare boundaries, and identify documentation gaps. They must not provide commands, scripts, secrets, credentials, live URLs, private identifiers, provider-console steps, or claims about real systems.
