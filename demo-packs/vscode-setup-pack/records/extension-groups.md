---
id: vscode-setup-pack.extension-groups
title: Extension Groups
type: editor_note
pack: vscode-setup-pack
tags:
  - starter
  - public_safe
  - development_environment
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-09
sources:
  - vscode-setup-pack-extension-groups-source
review_status: approved
---

# Extension Groups

## Summary

Extension Groups describes a fictional workstation profile for repeatable editor setup across TypeScript, Markdown, and local API projects. It gives developers who want AI help with editor context without pasting private settings files a reviewed, local, public-safe context record that can be rendered for humans and reused in target-specific AI briefs.

## Key Facts

| Area | Demo detail | Why it matters |
| --- | --- | --- |
| Scope | Extension classes: language support, markdown preview, test runner, accessibility, and Git review. | Keeps the pack specific without exposing private operational data. |
| Review use | Recommended status is advisory, not an auto-install list. | Keeps the pack specific without exposing private operational data. |
| AI value | Deprecated extensions remain documented until removed from active profiles. | Keeps the pack specific without exposing private operational data. |

## Extension Role Matrix

| Group | Used for | Coding-agent relevance | Export boundary |
| --- | --- | --- | --- |
| Language support | TypeScript-like, Markdown, and structured-data editing. | Helps an agent understand expected diagnostics and formatting. | No private extension IDs or synced setting dumps. |
| Debug support | Browser, API, and test-session inspection labels. | Helps route a task to the debug scenario matrix. | No launch configuration or secret-bearing variables. |
| Review support | Git diff, prose review, and accessibility checks. | Helps an agent choose review context before editing. | No repository URLs or contributor identity. |
| Comfort settings | Theme, font-size class, and keyboard preference labels. | Usually not relevant unless the task is accessibility-oriented. | No machine-specific settings payload. |

## Selection Rule

For a coding-agent task, prefer the narrowest extension group that explains the work surface. Do not turn extension categories into an installation checklist or claim a real workstation has those extensions installed.

## Important Boundaries

- Do not export real extension IDs tied to a private workspace if they reveal customer context.
- Do not include absolute machine paths, tokens, SSH hosts, or copied settings dumps.
- Do not tell an agent to install extensions or change the editor automatically.
- This record is synthetic demo content and is not a live connector, credential source, or automation runbook.

## Do Not Assume

- Do not assume omitted private files, identities, metrics, or service names exist.
- Do not treat this record as permission to mutate repositories, cloud resources, accounts, documents, or local machines.
- Do not expand the scenario beyond the reviewed source notes listed in the pack.

## Useful AI Questions

- What does this record let an assistant safely understand about VS Code Setup Pack?
- Which assumptions should be checked before using this context in an export?
- What should stay out of a public-safe brief for this pack?

## Redaction Notes

- Replace environment-specific identifiers with role labels before export.
- Keep private paths, tokens, emails, customer names, and live links out of generated briefs.
- Prefer source summaries and reviewed boundaries over raw operational dumps.

## Source Notes

- Record ID: `vscode-setup-pack.extension-groups`
- Source material is a synthetic local note in this pack's `raw/` folder.
- Review status is approved for public-safe demos, but the context remains non-executable.
