# Contextarr Launch Site Polish Plan

Status: queued implementation plan.

This plan captures the next site-hardening pass after the launch site expansion. It is intentionally scoped to public-site polish, route verification, and drift prevention. It does not include deploy, DNS, tags, release publishing, package publishing, registry work, marketplace work, or product runtime changes.

## Goals

1. Keep the public website accurate as the repo grows.
2. Make the site easier to trust before going live.
3. Reduce manual drift in demo-pack data.
4. Add durable route smoke checks instead of relying on one-off manual preview checks.
5. Do a final desktop/tablet/mobile visual QA pass on the launch pages.

## Current Rating

Current site quality: 8.2/10.

The site now has a coherent launch structure, focused navigation, FAQ, demo packs, run-local path, pack format explanation, security/privacy pages, and public-surface verification. The remaining gap is polish and drift prevention, not core positioning.

## Workstream 1: Route Smoke Verification

### Problem

`pnpm site:verify` builds the site, and `pnpm public-surface:verify` checks source files and claims. The current verifier confirms route source files exist, but it does not verify the built routes are reachable.

### Build

Add a launch route verifier:

```bash
pnpm site-routes:verify
```

Suggested script:

```text
tools/launch/verify-site-routes.mjs
```

Behavior:

- Read expected routes from `docs/public-surface-contract.json`.
- Build the static site or verify against `apps/site/dist` after `pnpm site:verify`.
- Confirm generated files exist for:
  - `/`
  - `/how-it-works`
  - `/use-cases`
  - `/run-locally`
  - `/demo-packs`
  - `/security`
  - `/pack-format`
  - `/roadmap`
  - `/docs`
  - `/faq`
  - `/privacy`
  - `/llms.txt`
  - `/llms-full.txt`
  - `/robots.txt`
- Optionally support `--url http://127.0.0.1:4323` to smoke a live dev or preview server.
- For HTML routes, assert the page has:
  - a `<title>`
  - a `<main id="main">`
  - primary nav links
  - footer links

### Acceptance

- `pnpm site-routes:verify` passes after `pnpm site:verify`.
- `pnpm site:verify` may be updated to include route verification if the command stays fast.
- Failure output names the exact missing route or broken file.

## Workstream 2: Demo Pack Data Drift Prevention

### Problem

The `/demo-packs` page uses manually maintained metadata in `apps/site/src/content/site.ts`. The public verifier checks overall inventory and pack names, but not every per-pack count or whether site data matches pack manifests.

### Build Option A: Verifier First

Keep the static site data for now, but strengthen verification:

- Read every `demo-packs/*/contextarr-pack.json`.
- Count `records/*.md`.
- Count export profile files under `exports/`.
- Compare repo-derived values against `demoPackCards` in `apps/site/src/content/site.ts`.
- Fail if:
  - a pack is missing from the site data
  - a site pack does not exist in the repo
  - record count differs
  - export profile count differs
  - current display name differs
  - retired pack names appear in current public site copy

Suggested location:

```text
tools/launch/verify-public-surface.mjs
```

### Build Option B: Generated Data Later

If Astro import constraints stay clean, move toward generated demo-pack data:

```text
tools/launch/generate-site-demo-pack-data.mjs
apps/site/src/content/generated-demo-packs.ts
```

Do not do this first if it complicates launch. The verifier-first approach is safer and enough for the next pass.

### Acceptance

- Public surface verification fails on stale pack counts.
- Public surface verification fails on stale display names.
- `Jellyfin Server Pack`, `Notion Workspace Pack`, `16 packs`, and `80 records` remain blocked from current public copy.

## Workstream 3: Visual QA Across Breakpoints

### Problem

The site has been manually tuned heavily. It needs a disciplined visual smoke pass across the actual launch routes, not just the homepage.

### Build

Use the local preview server at `http://127.0.0.1:4323/`.

Check these routes:

- `/`
- `/how-it-works`
- `/use-cases`
- `/run-locally`
- `/demo-packs`
- `/security`
- `/pack-format`
- `/roadmap`
- `/docs`
- `/faq`
- `/privacy`

Breakpoints:

- Desktop: `1440x1000`
- Wide desktop: `1920x1080`
- Tablet: `820x1180`
- Mobile: `390x844`

Look for:

- nav wrap or crowding
- oversized hero headlines
- cards with uneven heights that look broken
- text clipped inside pills/buttons/cards
- unreadable gray body copy
- sections with excessive empty left/right space
- route heroes that are centered when they should be left-aligned
- blue card-title treatment missing from Security/Roadmap/Privacy style pages
- footer link wrapping that feels sloppy

### Optional Automation

Add a script later:

```text
tools/launch/capture-site-smoke.mjs
```

Output:

```text
.contextarr-cache/site-smoke/<route>-<viewport>.png
```

Keep generated screenshots out of Git unless explicitly reviewed and approved.

### Acceptance

- No launch route has obvious layout breakage on desktop, tablet, or mobile.
- Privacy, Security, Roadmap, FAQ, Docs, Demo Packs, and Pack Format share the same visual language.
- `git status` does not gain unreviewed screenshot artifacts.

## Workstream 4: CSS Maintainability

### Problem

`apps/site/src/styles/global.css` is doing too much. It is acceptable for launch, but continued page additions will make it harder to reason about changes.

### Build

Do not do a broad CSS refactor before launch. Instead:

1. Add a short comment block separating launch-page components in `global.css`.
2. Extract only if the next pass becomes confusing:
   - reusable page cards
   - route bands
   - demo-pack cards
   - docs index cards
3. Prefer scoped Astro component styles for new complex sections after the first live site.

### Acceptance

- No visual regression.
- CSS organization is easier to scan.
- No large unrelated design refactor happens before live site.

## Workstream 5: Copy Tightening

### Problem

The site is much clearer now, but some pages may still repeat the same concept too often.

### Review Pass

Check for repeated lines across:

- homepage
- `/how-it-works`
- `/pack-format`
- `/faq`
- `/security`
- `/privacy`

Keep repeated claims only when they serve a different visitor intent:

- Homepage: first impression.
- How it works: Assemble, Review, Route.
- Pack format: concrete artifact.
- FAQ: direct objection handling.
- Security/Privacy: trust boundaries.

### Phrases To Preserve

- Own your AI context.
- Validate it locally. Export it anywhere.
- Assemble, Review, Route.
- Human-readable HTML.
- Read-only MCP.
- SQLite is rebuildable.
- Contextarr prepares context. It does not run agents.

### Acceptance

- No page feels like a docs mirror.
- No page makes future registry, marketplace, hosted vault, telemetry, package publishing, or agent runtime sound active.
- Skills wording remains precise:
  - Native Skills are non-executing instruction artifacts.
  - Imported external Skills may later be preserved unmodified as untrusted artifacts.
  - Contextarr does not mutate or run imported Skill scripts.

## Workstream 6: Final Launch Gate

Run:

```bash
pnpm --filter @contextarr/site check
pnpm site:verify
pnpm public-surface:verify
pnpm docs:verify
pnpm site-routes:verify
git diff --check
```

Manual route smoke:

```text
http://127.0.0.1:4323/
http://127.0.0.1:4323/how-it-works
http://127.0.0.1:4323/use-cases
http://127.0.0.1:4323/run-locally
http://127.0.0.1:4323/demo-packs
http://127.0.0.1:4323/security
http://127.0.0.1:4323/pack-format
http://127.0.0.1:4323/roadmap
http://127.0.0.1:4323/docs
http://127.0.0.1:4323/faq
http://127.0.0.1:4323/privacy
```

## Stop Rules

Stop and report instead of widening scope if:

- a fix would require deploy, DNS, GitHub release, tag, package publish, registry, marketplace, or public action
- demo-pack data generation becomes a larger Astro/build-system refactor
- visual QA reveals a design issue that requires a new design system
- any wording implies hosted vault, telemetry, agent runtime, or live connectors
- public copy claims a feature that is only planned

## Suggested Implementation Order

1. Add `tools/launch/verify-site-routes.mjs`.
2. Add `site-routes:verify` to `package.json`.
3. Extend `public-surface:verify` with per-pack data checks.
4. Run full site/docs checks.
5. Do visual QA across routes and breakpoints.
6. Make only targeted layout/copy fixes.
7. Run final launch gate.

## Expected Outcome

Best case:

- Launch site remains visually consistent.
- Route smoke is automated.
- Demo-pack data drift is caught before public launch.
- Public copy is accurate, compact, and launch-safe.

Good case:

- Route verification and pack drift checks are implemented.
- Remaining visual issues are small and documented.

Bad case:

- A visual or data-generation issue turns into a larger refactor.
- The result should still be a precise blocker list, not a vague launch delay.
