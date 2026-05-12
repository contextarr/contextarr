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

The fictional stack separates chat UI, model serving, coding-agent tools, and pack exports so each layer can be reasoned about independently. The demo operator treats slow inference as a routing question first: identify whether the bottleneck belongs to the model-serving lane, the dashboard lane, the agent-brief lane, or the derived index lane before recommending any change.

## Key Components

| Component | Demo Role |
|---|---|
| Local model server | Serves small and medium test models |
| Web UI | Provides manual chat and inspection |
| Coding-agent tools | Consume exported project context |
| Contextarr | Validates and exports reusable context packs |

## Synthetic Operating Texture

- `model-router-demo` accepts requests from the chat UI and coding-agent tools, then routes them to either a quick-response lane or a larger-analysis lane.
- `inference-shelf-demo` is the first service to inspect when responses are slow but the dashboard and exports remain healthy.
- `context-index-demo` is rebuildable derived state; stale search results point here, not at the model-serving lane.
- `export-preview-demo` prepares target-shaped Markdown briefs and should not be treated as a live automation worker.
- `operator-dashboard-demo` is for human review of health, freshness, and export status, not for secret storage.

## Slow Inference Triage

If only AI responses feel slow, inspect the model-serving lane first. If record search is stale or missing, inspect the derived index lane. If a target brief looks wrong, inspect export preview status and source review state before blaming inference.

## Notes

The stack is intentionally generic and contains no real model names, hostnames, accounts, or private paths.
