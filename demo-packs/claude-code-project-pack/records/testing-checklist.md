---
id: claude-code-project.testing-checklist
title: Testing Checklist
type: checklist
pack: claude-code-project-pack
tags:
  - tests
  - quality
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-07
sources:
  - claude-code-testing-note
review_status: approved
---

# Testing Checklist

## Summary

The demo project expects type checks, unit tests, fixture validation, and manual smoke checks when behavior changes.

## Checklist

| Check | When |
|---|---|
| Typecheck | Any TypeScript change |
| Unit tests | Any schema or validator change |
| Fixture validation | Any pack format change |
| Smoke check | Any CLI behavior change |

## Notes

The checklist uses fake examples and does not reference private CI systems.
