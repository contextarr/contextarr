# Cloudflare Pages Readiness

Contextarr has Cloudflare infrastructure reserved for the future public site, but it is not live.

## Current State

- Cloudflare Pages project: `contextarr`.
- Pages domain: `contextarr.pages.dev`.
- Production branch: `main`.
- Cloudflare zone: `contextarr.com`.
- Cloudflare zone status: `pending`.
- Namecheap nameservers: still `dns1.registrar-servers.com` and `dns2.registrar-servers.com`.
- Namecheap DNS cutover: not performed.
- Custom domain binding: not configured.
- Pages deployment: not created.
- Analytics, Zaraz, Web Analytics, and third-party tracking: not configured.

Cloudflare assigned these future nameservers for the zone:

```text
galilea.ns.cloudflare.com
yevgen.ns.cloudflare.com
```

Do not set those at Namecheap until the site has reviewed screenshots, updated status copy, and explicit go-live approval.

## Local Verification

Build the static site:

```bash
pnpm --filter @contextarr/site build
```

Run the Cloudflare Pages local preview:

```bash
pnpm --filter @contextarr/site cf:local
```

If Wrangler cannot infer the account from the current token, set `CLOUDFLARE_ACCOUNT_ID` in the local shell before running Cloudflare commands. Do not commit API tokens, account-local `.env` files, or deployment credentials.

## Future Launch Checklist

Before the first deployment:

- Replace the homepage placeholder with reviewed public-safe dashboard screenshots.
- Update status copy if Contextarr has moved beyond the current early preview state.
- Run `pnpm --filter @contextarr/site build`.
- Run `pnpm --filter @contextarr/site astro check`.
- Run the current repo verification command appropriate for the release phase.
- Confirm the built output has no analytics, tracking scripts, cookies, fake screenshots, fake customer logos, or production-readiness overclaims.

When launch is approved, deploy the built static output:

```bash
pnpm --filter @contextarr/site build
npx wrangler pages deploy apps/site/dist --project-name contextarr --branch main
```

After the deployment is reviewed, add the custom domain in Cloudflare Pages and only then change Namecheap nameservers to the Cloudflare nameservers listed above.
