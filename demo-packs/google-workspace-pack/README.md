# Google Workspace Pack

Public-safe starter context for organizing fictional Google Workspace knowledge.

This starter pack is a curated local example, not a marketplace listing and not an endorsement by Google. Third-party marks are used only as identifiers.

The records are synthetic, public-safe notes for exercising Contextarr validation, review, render, compose, and export flows. The pack contains no credentials, no private data, no install hooks, and no executable commands.

## Why this pack exists

This pack shows how a team can turn fictional Workspace operating rules into reviewed AI context without granting an assistant direct access to Drive, Docs, Sheets, Calendar, or admin settings.

## What an AI can safely know

- Which synthetic content classes are internal draft, cross-team reviewed, public-safe excerpt, or archived.
- How fictional owners decide whether a document summary is safe for an external collaborator.
- That unknown permissions, missing review status, and live links are blockers rather than details to infer.

## What must never be exported

- Real file IDs, document URLs, meeting links, user emails, customer names, account names, or permission lists.
- Unreviewed raw workspace dumps or private comments from collaborative documents.
- Anything that implies Contextarr can change sharing permissions or operate a Google Workspace account.

## Best export target

Use `llms-txt` or `markdown` when the assistant only needs public-safe sharing guidance. Use `json-records` when another local review tool needs the record metadata and source mapping.

## Demo question to ask

What can be shared with an external collaborator safely?

## Proof path

Start with `records/access-and-sharing-rules.md` and `records/shared-drive-policy.md`, then compare the matching raw notes under `raw/` to confirm the exported guidance is source-backed and synthetic.
