# Contextarr 5-Minute Demo Script

Status: launch-proof recording script. This upgrades the Wave 1 checklist into a cold-AI-fails / Contextarr-succeeds proof path while preserving the local-only and no-media-commit boundaries.

## Recording Title

Stop re-explaining your systems to AI.

## Demo Promise

In five minutes, show that:

- A cold AI gives a generic or unsafe answer when it has no project context.
- Raw notes help, but they are not reviewed, structured, or target-ready.
- A Contextarr export gives the AI source-backed, reviewed context with visible boundaries.
- The proof stays local: no deployment, no external AI API call during capture, no telemetry, no publishing, and no agent execution.

## Recording Rules

- Use fake data only.
- Use public-safe demo packs only.
- Do not show credentials, tokens, private paths, real customer data, provider consoles, or private system details.
- Do not call external AI APIs during the repository demo capture.
- Do not imply hosted cloud sync, marketplace publishing, remote install, Skill execution, Agent Kit runtime, or production deployment.
- Do not commit generated screenshots, videos, transcripts, terminal logs, generated exports, Docker volumes, or local databases unless a later review explicitly approves them.

## Local Proof Bundle

Create this ignored local folder only when a recording pass is assigned:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$demoRoot = ".contextarr-cache/demo-proof/$stamp"
New-Item -ItemType Directory -Force $demoRoot | Out-Null
```

Suggested local-only files:

- `.contextarr-cache/demo-proof/<stamp>/smoke-evidence.md`
- `.contextarr-cache/demo-proof/<stamp>/recording-notes.md`
- `.contextarr-cache/demo-proof/<stamp>/contextarr-launch-proof-demo.mp4`

## Preflight

1. Confirm no generated media or local proof output is staged.
2. Run `pnpm public-surface:verify`.
3. Run `pnpm site:verify`.
4. Run `pnpm demo:validate`.
5. Start the Docker preview with `docker compose up`.
6. Prefer `http://127.0.0.1:3210`; if occupied, record the alternate local port.
7. Confirm the site `/proof`, `/demo-packs`, and `/run-locally` pages describe Launch proof, demo evals, Contextarr export, human-readable HTML, and Try Contextarr in 7 minutes.

## Five-Minute Timeline

| Time | Scene | Action | Narration |
| --- | --- | --- | --- |
| 0:00-0:30 | Cold AI fails | Ask one demo question with no context. | "A blank chat box can sound confident, but it does not know the reviewed system facts." |
| 0:30-1:10 | Raw notes are not enough | Show the matching pack's raw note or README question. | "Raw notes contain clues, but they mix source material, review burden, and missing boundaries." |
| 1:10-2:00 | Contextarr export | Run or show the matching Contextarr export. | "A Contextarr export packages approved records, source mapping, rules, and target formatting together." |
| 2:00-3:15 | Contextarr succeeds | Ask the same question with the export. | "Now the answer can route through known records and say what it does not know." |
| 3:15-4:10 | Trust receipts | Show `/proof`, demo eval card, validation command, and human-readable HTML path. | "The proof is inspectable: demo eval, best export, proof expectation, validation, and HTML." |
| 4:10-5:00 | Boundaries | Show launch-proof docs and no-public-action list. | "This is local proof, not a launch action: no deployment, no external API, no telemetry, and no agent execution." |

## Recommended Demo Eval

Use AI Workstation Pack first because it is easy to understand:

- Demo question: "Which local AI service should I inspect first if inference feels slow?"
- Best export: Codex or Claude for troubleshooting briefs; Markdown for human review.
- Proof eval: The answer should route through stack, capacity, safety, and workflow records before naming a first inspection point.

The same structure works for every demo eval listed on `/proof`.

## Smoke Evidence Commands

Record summarized results in the local proof bundle. Do not commit the evidence file without review approval.

```powershell
pnpm public-surface:verify
pnpm site:verify
pnpm demo:validate
pnpm --filter @contextarr/cli contextarr validate demo-packs --json
pnpm --filter @contextarr/cli contextarr render demo-packs/ai-workstation-pack --out rendered/launch-proof-ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --profile codex
```

## Acceptance Checklist

- [ ] Cold-AI failure is shown as lack of context, not model ridicule.
- [ ] Raw notes are shown as useful but not review-complete.
- [ ] Contextarr export is shown as the reviewed handoff.
- [ ] Human-readable HTML is mentioned or shown.
- [ ] Demo eval card is shown for the selected pack.
- [ ] Validation commands are named.
- [ ] Local-only, no-media-commit, no-external-AI-API, no-deployment, and no-agent-execution boundaries are stated.
- [ ] No generated recording artifact is staged.
