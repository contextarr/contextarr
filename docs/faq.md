# FAQ

## Is Contextarr Cloud Hosted?

No. The current product is local-first and self-hosted.

## Is SQLite The Source Of Truth?

No. SQLite is a derived, rebuildable index. Context Pack files are the source of truth.

## Can Contextarr Execute Skills Or Agent Kits?

No. Contextarr prepares, validates, previews, and exports data-only artifacts. It does not run agents, execute Skills, execute Agent Kits, run shell commands, or call tools.

## Are Skills And Agent Kits Still Being Expanded?

No further Skills or Agent Kit expansion should happen until Context Pack core v1.0 readiness is explicitly accepted or superseded by a decision record.

## Is There A Marketplace?

No. Marketplace and public registry behavior are explicitly blocked.

## Can I Put Private Data In Demo Packs?

No. Committed demo packs and fixtures must remain fake and public-safe.

## How Do I Check The Core?

```bash
pnpm v1-core:verify
pnpm compatibility:verify
pnpm security:verify
```

