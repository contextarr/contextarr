# Product Line Pack

Public-safe demo context for a fictional product line.

This pack demonstrates product overview, model comparison, support matrix, release notes, and sales/support FAQ records.

## Why this pack exists

This pack demonstrates how a fictional product team can give an AI enough context to answer buyer-fit and support-boundary questions without real pricing, customers, vendors, or availability claims.

## What an AI can safely know

- The invented Atlas Mini, Atlas Core, and Atlas Max positioning used for demo buyer segmentation.
- Which fictional buyer scenarios fit each model and which support topics should stay inside reviewed language.
- That uncertain requirements should become discovery questions instead of promises.

## What must never be exported

- Real customer names, market data, pricing, warranty terms, product roadmaps, vendor claims, or competitor comparisons.
- Promises about integrations, compliance, uptime, support response times, or future features.
- Anything that could be mistaken for a real brand endorsement, offer, or support commitment.

## Best export target

Use `chatgpt` or `claude` for buyer-fit demo prompts, and use `json-records` when checking source-backed product boundaries.

## Demo question to ask

Which fictional buyer segment fits the product best and what should support avoid promising?

## Proof path

Use `records/buyer-guide.md` and `records/support-matrix.md` as the reviewed path, with `raw/buyer-guide-note.md` and `raw/support-note.md` as the synthetic provenance notes.
