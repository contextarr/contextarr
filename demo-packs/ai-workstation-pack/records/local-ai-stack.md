---
id: ai-workstation.local-ai-stack
title: Local AI Stack
type: system_component
pack: ai-workstation-pack
tags:
  - ai
  - local
  - inference
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-07
sources:
  - ai-workstation-stack-note
review_status: approved
---

# Local AI Stack

## Summary

The fictional stack separates chat UI, model serving, coding-agent tools, and pack exports so each layer can be reasoned about independently.

## Key Components

| Component | Demo Role |
|---|---|
| Local model server | Serves small and medium test models |
| Web UI | Provides manual chat and inspection |
| Coding-agent tools | Consume exported project context |
| Contextarr | Validates and exports reusable context packs |

## Notes

The stack is intentionally generic and contains no real model names, hostnames, accounts, or private paths.
