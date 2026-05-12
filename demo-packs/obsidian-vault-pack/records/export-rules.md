---
id: obsidian-vault-pack.export-rules
title: Export Rules
type: knowledge_vault_note
pack: obsidian-vault-pack
tags:
  - starter
  - public_safe
  - local_markdown_knowledge
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-09
sources:
  - obsidian-vault-pack-export-rules-source
review_status: approved
---

# Export Rules

## Summary

Export Rules describes a fictional Markdown vault called Atlas Notes with local knowledge, daily notes, and export rules. It gives Obsidian and Markdown users turning notes into reviewed AI context a reviewed, local, public-safe context record that can be rendered for humans and reused in target-specific AI briefs.

## Key Facts

| Area | Demo detail | Why it matters |
| --- | --- | --- |
| Scope | Exports prefer summaries, decision records, and source notes over raw notes. | Keeps the pack specific without exposing private operational data. |
| Review use | Targets can receive ChatGPT, Claude, Codex, Markdown, JSON, or read-only MCP context. | Keeps the pack specific without exposing private operational data. |
| AI value | Redaction runs before any public-safe brief is prepared. | Keeps the pack specific without exposing private operational data. |

## Exclusion Workflow

| Note signal | Export decision | Reason |
| --- | --- | --- |
| `privacy: private` or `privacy: sensitive` | Exclude | Private context is outside the public-safe demo scope. |
| `note_kind: daily` | Exclude by default | Daily notes often mix planning, personal context, and raw observations. |
| `review_status: draft` | Exclude | Draft content has not been checked against the pack boundary. |
| `source_status: imported` | Summarize only after review | Imports may contain copied or unlicensed source material. |
| `tags: [public_safe, evergreen]` with approval | Eligible | Reviewed evergreen notes can support a concise AI brief. |

The assistant should answer exclusion questions by naming the metadata reason and the safer alternative, such as exporting the reviewed record instead of the raw note.

## Important Boundaries

- Do not include private journal entries, health notes, location data, or personal contacts.
- Do not export daily notes by default.
- Do not treat backlinks or tags as proof unless a record is reviewed.
- This record is synthetic demo content and is not a live connector, credential source, or automation runbook.

## Do Not Assume

- Do not assume omitted private files, identities, metrics, or service names exist.
- Do not treat this record as permission to mutate repositories, cloud resources, accounts, documents, or local machines.
- Do not expand the scenario beyond the reviewed source notes listed in the pack.

## Useful AI Questions

- What does this record let an assistant safely understand about Obsidian Vault Pack?
- Which assumptions should be checked before using this context in an export?
- What should stay out of a public-safe brief for this pack?

## Redaction Notes

- Replace environment-specific identifiers with role labels before export.
- Keep private paths, tokens, emails, customer names, and live links out of generated briefs.
- Prefer source summaries and reviewed boundaries over raw operational dumps.
- Do not expose raw note titles when a title itself looks personal or source-only.

## Source Notes

- Record ID: `obsidian-vault-pack.export-rules`
- Source material is a synthetic local note in this pack's `raw/` folder.
- Review status is approved for public-safe demos, but the context remains non-executable.
