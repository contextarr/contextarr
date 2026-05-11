# Contextarr Demo Script

## Recording Title

Stop re-explaining your systems to AI.

## Recording Rules

- Use fake data only.
- Use public-safe examples only.
- Do not include credentials, tokens, private paths, private system details, or real customer data.
- Do not call external AI APIs during the repository demo.
- Do not show marketplace, cloud sync, telemetry, executable pack behavior, Skill execution, or Agent Kit runtime behavior.
- Keep the demo local: Contextarr prepares local Context Packs and exports; it does not publish or run agent behavior.

## Preflight

1. Run `pnpm release:verify` before recording.
2. Run `pnpm docs:verify` and `pnpm screenshots:verify` after any release-package checkpoint.
3. Start the local Docker preview. Prefer `http://127.0.0.1:3210`; if an existing `contextarr-app-1` already occupies `3210`, use an alternate local port such as `http://127.0.0.1:33211`.
4. Confirm the app loads, `/api/health` is ok, and `authRequired` is `true`.
5. Confirm the visible demo counts: 15 packs, 12 starters, 4 collectors, 0 review items, and 0 draft candidates.

## Shot Plan

| Scene | Screen Action | Narration |
| --- | --- | --- |
| 1. Problem | Show a local note with a fake AI workstation question and a deliberately thin generic answer. | "A normal AI session starts with too little project context. Contextarr keeps the explanation local and reusable." |
| 2. Local App | Open the Docker preview at the active local port. | "This is the local Contextarr preview. No cloud sync, marketplace, telemetry, or external AI API call is involved." |
| 3. Pack Library | Show the Pack Library. Pause on the counts: 15 packs and 12 starter packs. | "The library is made of public-safe local examples, including curated starter Context Packs." |
| 4. Pack Detail | Open AI Workstation Pack. Show records, sources, and Pack Health. | "A pack turns scattered local knowledge into reviewable records with source context and health checks." |
| 5. Review State | Open Review Queue and Draft Intake. Show 0 review items and 0 draft candidates. | "Release-candidate data stays review-bound. Nothing is silently promoted, exported, or exposed through MCP." |
| 6. Collectors | Open Collectors and show the 4 collector options. | "Collectors can prepare local draft material, but drafts still require review before becoming active packs." |
| 7. Codex Export | Preview a Codex export. | "Exports are deterministic previews for supported targets. This is a local preview endpoint, not a publish action." |
| 8. Composer Preview | Open Composer and build a preview without saving public output. | "Composer can assemble a draft preview while keeping generated material local and review-bound." |
| 9. Rebuildability | Show raw Markdown files, then mention SQLite as derived cache. | "The source of truth is local files. SQLite is rebuildable from those files." |
| 10. Close | Show quickstart docs, known limitations, and release notes. | "The alpha is a developer preview: local-first, public-safe, and explicitly not published yet." |

## Proof Points To Keep Visible

- Static UI loads in the local Docker preview.
- `/api/health` is ok and `authRequired` is `true`.
- 15 packs and 12 starters are visible.
- `ai-workstation` health is healthy.
- Review Queue has 0 review items.
- Draft Intake has 0 draft candidates.
- Collectors show 4 options.
- Codex export preview responds.
- Composer preview responds.

## Optional Advanced Preview Mention

If asked, show that Skills and Agent Kits exist as advanced-preview data objects. Keep the wording clear: Contextarr prepares Agent Kits, but it does not run them.
