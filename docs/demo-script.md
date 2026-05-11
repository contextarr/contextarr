# Contextarr Demo Script

This is the Wave 1 demo proof artifact. It gives a local-only recording path, shot list, checklist, and smoke evidence instructions without committing generated screenshots or video.

## Recording Title

Stop re-explaining your systems to AI.

## Wave 1 Demo Proof Scope

- Use this document as the script-ready local recording checklist for `v0.1.0-alpha.1`.
- Keep all scratch evidence under `.contextarr-cache/demo-proof/<stamp>/` or another ignored local folder.
- Do not commit generated screenshots, screen recordings, transcripts, terminal logs, Docker volumes, local databases, or generated exports unless a later review explicitly approves them.
- The reviewable repo artifact is this script and checklist. A recorded video remains a later approval step.
- The demo must prove local preparation, validation, review boundaries, and deterministic export preview. It must not imply hosted cloud sync, telemetry, marketplace publishing, remote install, Skill execution, Agent Kit runtime, or external AI calls.

## Recording Rules

- Use fake data only.
- Use public-safe examples only.
- Do not include credentials, tokens, private paths, private system details, or real customer data.
- Do not call external AI APIs during the repository demo.
- Do not show marketplace, cloud sync, telemetry, executable pack behavior, Skill execution, or Agent Kit runtime behavior.
- Keep the demo local: Contextarr prepares local Context Packs and exports; it does not publish or run agent behavior.

## Local Proof Bundle

Create this ignored local folder only when a recording pass is assigned:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$demoRoot = ".contextarr-cache/demo-proof/$stamp"
New-Item -ItemType Directory -Force $demoRoot | Out-Null
```

Suggested local-only files for a future recording pass:

- `.contextarr-cache/demo-proof/<stamp>/smoke-evidence.md`
- `.contextarr-cache/demo-proof/<stamp>/recording-notes.md`
- `.contextarr-cache/demo-proof/<stamp>/contextarr-wave1-demo.mp4`

These files are operator evidence only. They should stay ignored until reviewed and explicitly approved for a release package.

## Preflight

1. Confirm the worktree only contains the intended demo-doc changes.
2. Run `pnpm docs:verify`.
3. Run `pnpm screenshots:verify`.
4. Run `git diff --check`.
5. For a release-quality recording pass, also run `pnpm release:verify` before capture.
6. Start the local Docker preview. Prefer `http://127.0.0.1:3210`; if an existing `contextarr-app-1` already occupies `3210`, use an alternate local port such as `http://127.0.0.1:33211`.
7. Confirm the app loads, `/api/health` is ok, and `authRequired` is `true`.
8. Confirm the visible demo counts: 15 packs, 12 starters, 4 collectors, 0 review items, and 0 draft candidates.

## Local Smoke Evidence

Run these commands during a future assigned recording pass and paste the summarized results into the local `smoke-evidence.md` file. Do not commit the evidence file unless it is explicitly reviewed and approved.

```powershell
$base = "http://127.0.0.1:3210"
$token = "contextarr-local-preview-token"
$headers = @{ "X-Contextarr-Token" = $token }

$health = Invoke-RestMethod "$base/api/health"
$packs = Invoke-RestMethod "$base/api/packs" -Headers $headers
$starters = Invoke-RestMethod "$base/api/packs?starter=true" -Headers $headers
$collectors = Invoke-RestMethod "$base/api/context-pack-collectors" -Headers $headers
$reviewItems = Invoke-RestMethod "$base/api/review-items" -Headers $headers
$drafts = Invoke-RestMethod "$base/api/review-candidates" -Headers $headers
$packHealth = Invoke-RestMethod "$base/api/packs/ai-workstation-pack/health" -Headers $headers
$exportPreview = Invoke-RestMethod "$base/api/packs/ai-workstation-pack/exports/ai-workstation-codex/preview" -Headers $headers
$composeBody = @{
  title = "Wave 1 demo preview"
  target = "codex"
  format = "markdown"
  privacyMode = "redacted"
  selections = @(
    @{
      packId = "ai-workstation-pack"
      recordIds = @("ai-workstation.local-ai-stack")
    }
  )
  excludeTags = @("secret", "never_export", "imported_draft")
} | ConvertTo-Json -Depth 8
$composePreview = Invoke-RestMethod "$base/api/compose/preview" -Method Post -Headers $headers -ContentType "application/json" -Body $composeBody

@"
# Contextarr Wave 1 Demo Smoke Evidence

- Local URL: $base
- Health status: $($health.status)
- Auth required: $($health.authRequired)
- Packs: $($packs.packs.Count)
- Starter packs: $($starters.packs.Count)
- Collectors: $($collectors.collectors.Count)
- Open review items: $($reviewItems.counts.open)
- Draft candidates: $($drafts.candidates.Count)
- AI Workstation health: $($packHealth.status)
- Codex export preview profile: $($exportPreview.profileId)
- Composer preview profile: $($composePreview.profileId)

Expected values: health ok, auth required true, 15 packs, 12 starter packs, 4 collectors, 0 open review items, 0 draft candidates, AI Workstation healthy, export preview returned, composer preview returned.
"@ | Set-Content -Path "$demoRoot/smoke-evidence.md" -Encoding UTF8
```

If the Docker preview uses an alternate host port, change `$base` to the active `http://127.0.0.1:<port>` URL and record the port in the evidence file.

## Recording Checklist

- [ ] Proof bundle path is ignored and local-only.
- [ ] `pnpm docs:verify` passed.
- [ ] `pnpm screenshots:verify` passed.
- [ ] `git diff --check` passed.
- [ ] Docker preview is running on the recorded local port.
- [ ] `/api/health` reports `status: ok` and `authRequired: true`.
- [ ] Library shows 15 packs and 12 starter Context Packs.
- [ ] AI Workstation Pack detail and Pack Health are visible.
- [ ] Review Queue shows 0 open review items.
- [ ] Draft Intake shows 0 draft candidates.
- [ ] Collectors shows 4 local collector options.
- [ ] Codex export preview returns local generated content.
- [ ] Composer preview returns local generated content without saving public output.
- [ ] Raw Markdown source files are shown as source of truth.
- [ ] Known limitations remain visible.
- [ ] No real private data, credentials, local private paths, or customer data appear on screen.
- [ ] No generated screenshot or recording artifact is staged.

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

## Timeline Target

- 0:00 to 0:15: Problem and local app.
- 0:15 to 0:35: Library, starter packs, and pack detail.
- 0:35 to 0:55: Health, review queue, and draft intake boundaries.
- 0:55 to 1:15: Collectors and export preview.
- 1:15 to 1:35: Composer preview and rebuildability.
- 1:35 to 1:45: Limitations and close.

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

## Evidence Acceptance

A Wave 1 demo proof pass is acceptable when:

- The local smoke evidence records the expected counts and preview responses.
- The recording follows the shot plan without showing private data or unsupported launch claims.
- Generated media remains untracked until review approval.
- `pnpm docs:verify`, `pnpm screenshots:verify`, and `git diff --check` pass after any doc changes.

## Optional Advanced Preview Mention

If asked, show that Skills and Agent Kits exist as advanced-preview data objects. Keep the wording clear: Contextarr prepares Agent Kits, but it does not run them.
