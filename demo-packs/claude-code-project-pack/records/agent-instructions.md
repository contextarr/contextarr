---
id: claude-code-project.agent-instructions
title: Agent Instructions
type: policy
pack: claude-code-project-pack
tags:
  - agent
  - instructions
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-07
sources:
  - claude-code-agent-note
review_status: approved
---

# Agent Instructions

## Summary

The demo agent should inspect files first, keep changes scoped, prefer existing patterns, and verify before reporting completion.

## Rules

| Rule | Demo Meaning |
|---|---|
| Inspect first | Understand the local shape before editing |
| Stay scoped | Avoid unrelated refactors |
| Verify locally | Run relevant checks before handoff |
| Report clearly | Summarize changed behavior and tests |

## Notes

These are generic coding-agent instructions with no private operational details.
