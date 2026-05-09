# Cloudflare Site Source Repair Plan

Date: 2026-05-09

## Goal

Make the Cloudflare-hosted Contextarr website deploy from repo source instead of a missing or stale local artifact, using the approved green/blue brand system.

## Current Source Of Truth

- Site source: `apps/site`
- Build command: `pnpm --filter @contextarr/site build`
- Build output: `apps/site/dist`
- Cloudflare config: `apps/site/wrangler.jsonc`
- Public brand mark: `apps/site/public/brand-mark.svg`
- Public favicon: `apps/site/public/favicon.svg`
- Product screenshot: `apps/site/public/screenshots/contextarr-dashboard.png`

## Repair Steps

1. Keep `apps/site` committed on `main` with all source, public assets, and `wrangler.jsonc`.
2. Configure Cloudflare Pages to use the repository root with:
   - Install command: `pnpm install --frozen-lockfile`
   - Build command: `pnpm --filter @contextarr/site build`
   - Output directory: `apps/site/dist`
   - Node version: `22`
3. Before publishing, run:
   - `pnpm --filter @contextarr/site check`
   - `pnpm --filter @contextarr/site build`
   - `pnpm --filter @contextarr/site cf:local`
4. Confirm the deployed preview has:
   - Green/blue Contextarr mark and favicon.
   - White `Context` plus green `arr` wordmark treatment.
   - No old purple/cyan logo assets.
   - Current local dashboard screenshot from the running app.
5. Only then attach the production domain or promote the preview.

## Guardrails

- Do not add analytics, telemetry, hosted app behavior, or cloud sync.
- Do not point the website at generated local `dist` files in Git.
- Do not deploy from old image-board screenshots or old purple/cyan brand assets.
- Keep the website static until explicitly scoped otherwise.
