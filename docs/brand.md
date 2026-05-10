# Contextarr Brand Kit

Contextarr uses a deterministic brand kit generated from `tools/brand-kit`.

## Brand Direction

- Positioning: Contextarr is the context layer. Validated. Source-backed. Export-ready. Not an agent runner.
- Primary logo colors: green `#22C55E`, blue `#2563EB`, navy `#0B1220`, slate `#111827`, white `#FFFFFF`.
- Semantic UI-only colors: warning orange `#F59E0B`, error red `#EF4444`.
- The product UI should use green for validation, source-backed trust, and ready states; blue for structure, selection, links, and export-ready affordances.
- Do not reintroduce the older violet/cyan brand direction. Cyan-like UI variables may remain as compatibility aliases, but their values should resolve to the approved blue.

## Assets

- SVG delivery files live in `assets/brand/svg/`.
- The current approved logo art is stored as high-resolution PNG source renders and embedded inside SVG containers so GitHub, docs, and web consumers preserve the supplied artwork exactly.
- `assets/brand/manifest.json` records the palette, source generator, and asset index.
- `assets/brand/preview.html` is a local review page for the SVG set.
- PNG previews are generated locally under `assets/brand/png/` and intentionally ignored.
- `apps/web/src/brand.ts` owns web app favicon/theme metadata.
- `apps/web/src/styles.css` owns the dashboard UI color tokens.
- `packages/renderer/src/static.ts` owns the static HTML export palette.
- Docker copies `assets/` and builds the web app inside the image, so `pnpm docker:verify` is the Docker brand smoke after logo changes.
- The Cloudflare-facing website must use these same source assets and palette before it is made live.

## Build

```bash
pnpm brand:build
pnpm brand:verify
pnpm --filter @contextarr/brand-kit base64
```

The checked-in SVGs intentionally preserve the approved high-resolution renders. They are not pure-vector redraws; do not retrace or reinterpret the logo unless a future task explicitly scopes a pure-vector rebuild.
