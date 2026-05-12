---
id: claude-code-project-pack.implementation-rules
title: Implementation Rules
type: project_note
pack: claude-code-project-pack
tags:
  - starter
  - public_safe
  - ai_coding
  - instructions
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-09
sources:
  - claude-code-project-pack-agent-instructions-source
review_status: approved
---

# Implementation Rules

## Summary

Implementation Rules describes a fictional TypeScript repository named Meridian Notes that uses AI coding agents for scoped implementation work. It gives maintainers preparing Claude Code, Codex, and local coding-agent handoffs a reviewed, local, public-safe context record that can be rendered for humans and reused in target-specific AI briefs. These rules turn a vague request into a bounded implementation brief rather than a broad rewrite.

## Key Facts

| Area | Demo detail | Why it matters |
| --- | --- | --- |
| Scope | This record keeps agent instructions scoped to a fictional TypeScript repository named Meridian Notes that uses AI coding agents for scoped implementation work. | Keeps the pack specific without exposing private operational data. |
| Review use | It is synthetic, public-safe, and intended to make target exports more useful. | Keeps the pack specific without exposing private operational data. |
| AI value | Unreviewed or sensitive details stay out of default exports. | Keeps the pack specific without exposing private operational data. |

## Brief Requirements

| Brief field | Public-safe content |
| --- | --- |
| Objective | One UI behavior to fix, stated in user-visible terms. |
| Scope | The fictional surface, component family, or record group involved. |
| Non-goals | No publishing, deployment, credential handling, large redesign, or unrelated cleanup. |
| Evidence | Reviewed records and raw notes that justify the implementation direction. |
| Verification | Targeted validation expectation described without executable commands. |

## Agent Hand-Off Rules

- Preserve existing user-authored work and treat unknown ownership as a reason to inspect before editing.
- Keep copy changes aligned with known limitations and implementation status.
- When a pack-format behavior changes, update fixtures and validator expectations together.
- Final reports should separate changed files, behavior improved, validation performed, and residual concerns.

## Important Boundaries

- Do not push, publish, deploy, tag releases, or change package distribution settings.
- Do not invent missing requirements; flag unknowns in the final report.
- Do not expose private repository paths, credentials, live issue links, or user names.
- This record is synthetic demo content and is not a live connector, credential source, or automation runbook.

## Do Not Assume

- Do not assume omitted private files, identities, metrics, or service names exist.
- Do not treat this record as permission to mutate repositories, cloud resources, accounts, documents, or local machines.
- Do not expand the scenario beyond the reviewed source notes listed in the pack.

## Useful AI Questions

- What does this record let an assistant safely understand about Claude Code Project Pack?
- Which assumptions should be checked before using this context in an export?
- What should stay out of a public-safe brief for this pack?

## Redaction Notes

- Replace environment-specific identifiers with role labels before export.
- Keep private paths, tokens, emails, customer names, and live links out of generated briefs.
- Prefer source summaries and reviewed boundaries over raw operational dumps.

## Source Notes

- Record ID: `claude-code-project-pack.implementation-rules`
- Source material is a synthetic local note in this pack's `raw/` folder.
- Review status is approved for public-safe demos, but the context remains non-executable.
