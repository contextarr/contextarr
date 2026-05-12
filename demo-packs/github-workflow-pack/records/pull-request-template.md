---
id: github-workflow-pack.pull-request-template
title: Pull Request Template
type: repo_workflow_note
pack: github-workflow-pack
tags:
  - starter
  - public_safe
  - devops_collaboration
confidence: high
source_status: source_backed
freshness: current
privacy: public_safe
last_reviewed: 2026-05-09
sources:
  - github-workflow-pack-pull-request-template-source
review_status: approved
---

# Pull Request Template

## Summary

Pull Request Template describes a fictional open-source repository called Northstar Docs that uses reviewed issues, pull requests, and release notes. It gives maintainers who want AI agents to understand contribution workflow without live GitHub access a reviewed, local, public-safe context record that can be rendered for humans and reused in target-specific AI briefs.

## Key Facts

| Area | Demo detail | Why it matters |
| --- | --- | --- |
| Scope | Required PR fields: intent, changed surfaces, tests, screenshots if UI changed, and rollout notes. | Keeps the pack specific without exposing private operational data. |
| Review use | Reviewers expect risk callouts for exports, security, and public copy. | Keeps the pack specific without exposing private operational data. |
| AI value | Draft PRs can be used for agent work but do not imply approval. | Keeps the pack specific without exposing private operational data. |

## PR Evidence Matrix

| Template area | Review-ready signal | Release-ready signal |
| --- | --- | --- |
| Intent | Problem and scoped fix are clear. | Intent is reflected in release notes without overclaiming. |
| Verification | Checks are named at the evidence level. | Release evidence is current and linked to the candidate state by description. |
| Risk | Security, export, and public-copy risks are called out. | High-risk changes have owner approval and mitigation notes. |
| Non-actions | Out-of-scope work is explicit. | Deferred work is represented as a known limitation when relevant. |

## Agent Review Cue

For coding-agent tasks, this template lets an assistant decide whether a PR has enough information for review. It does not let the assistant approve a release, create a tag, publish artifacts, or infer private reviewer identity.

## Important Boundaries

- Do not treat this pack as a GitHub connector or automation token.
- Do not invent security disclosure outcomes, maintainer approvals, or release dates.
- Do not include real organization names, repository URLs, issue numbers, or contributor emails.
- This record is synthetic demo content and is not a live connector, credential source, or automation runbook.

## Do Not Assume

- Do not assume omitted private files, identities, metrics, or service names exist.
- Do not treat this record as permission to mutate repositories, cloud resources, accounts, documents, or local machines.
- Do not expand the scenario beyond the reviewed source notes listed in the pack.

## Useful AI Questions

- What does this record let an assistant safely understand about GitHub Workflow Pack?
- Which assumptions should be checked before using this context in an export?
- What should stay out of a public-safe brief for this pack?

## Redaction Notes

- Replace environment-specific identifiers with role labels before export.
- Keep private paths, tokens, emails, customer names, and live links out of generated briefs.
- Prefer source summaries and reviewed boundaries over raw operational dumps.

## Source Notes

- Record ID: `github-workflow-pack.pull-request-template`
- Source material is a synthetic local note in this pack's `raw/` folder.
- Review status is approved for public-safe demos, but the context remains non-executable.
