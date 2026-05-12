# Contextarr Video Production Plan

Status: local-only production plan. No generated media is committed by default.

The launch video should prove the 5-minute cold-AI-fails / Contextarr-succeeds demo without creating public deployment, provider mutation, external AI API dependency, or release action.

## Capture Plan

Use browser capture against local surfaces only:

- Public static site dev or build preview for `/proof`, `/demo-packs`, and `/run-locally`.
- Docker preview at `http://127.0.0.1:3210` for the local dashboard if dashboard footage is needed.
- Terminal capture for validation, render, and export commands.
- Local editor or file view for `demo-packs/*/README.md`, `records/`, and `sources/sources.yaml` when showing source-backed context.

Do not capture private browser profiles, provider consoles, real customer data, credentials, private local paths, or external AI sessions.

## Remotion Plan

Use Remotion only as a local rendering layer if a scripted video is approved:

1. Capture local screenshots or short clips into an ignored operator folder.
2. Build a Remotion composition with these segments:
   - Cold AI question title card.
   - Raw notes are useful but insufficient.
   - Contextarr export.
   - Demo eval proof card.
   - Trust receipts and no-public-action boundaries.
3. Render to an ignored local output folder.
4. Review the video manually before any decision to publish, commit, or attach it to release notes.

Remotion should not call external AI APIs, generate claims, fetch hosted data, or publish output.

## Ignored Output Paths

Keep generated media and capture scratch under ignored paths such as:

```text
.contextarr-cache/demo-proof/
.contextarr-cache/video/
rendered/launch-proof-*/
video-output/
remotion-output/
```

If a path is not ignored yet, either use an already ignored cache path or add the ignore rule in a separate reviewed change before generating large artifacts.

## No External AI APIs

The video may describe a cold-AI comparison, but the repository demo capture should not require external AI API calls. If a model answer is shown, use prewritten public-safe text in the local script or a clearly labeled local mock. Do not show live ChatGPT, Claude, OpenAI API, Anthropic API, or other provider calls as part of the repo proof capture.

## No Deployment

Do not deploy the site, Cloudflare Pages project, Docker image, npm package, registry artifact, marketplace entry, or release video as part of this plan. Publishing is a separate approval-gated task.

## Production Checklist

- [ ] `pnpm public-surface:verify` passed after copy changes.
- [ ] `pnpm site:verify` passed after site changes.
- [ ] Generated media remains untracked.
- [ ] No private data appears in capture.
- [ ] The final video states local-only boundaries.
- [ ] The final video points to `docs/launch-proof.md` for receipts.
