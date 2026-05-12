---
id: ai-workstation.safety-boundaries
title: Safety Boundaries
type: policy
pack: ai-workstation-pack
tags:
  - safety
  - boundaries
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-12
sources:
  - ai-workstation-safety-note
review_status: approved
---

# Safety Boundaries

## Summary

The fictional workstation pack gives assistants enough context to reason about local AI setup while keeping execution, network access, and private machine details out of scope.

## Boundaries

| Boundary | Demo Rule |
|---|---|
| Execution | Do not include runnable commands or scripts in exported guidance |
| Secrets | Do not request credentials, tokens, account IDs, or private keys |
| Network | Treat external access as unavailable unless a separate approved task says otherwise |
| Identity | Avoid real usernames, hostnames, addresses, and machine serial details |

## Notes

This policy is intentionally conservative so the pack can be used in public demos.
