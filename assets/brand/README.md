# Contextarr Brand Assets

Brand assets generated from the approved individual high-resolution Contextarr renders.

## Build

```bash
pnpm brand:build
pnpm --filter @contextarr/brand-kit base64
```

## Output

- `assets/brand/source/contextarr-brand-system-v0.1.png`: approved reference board
- `assets/brand/source/individual/`: approved individual source renders
- `assets/brand/svg/`: SVG containers with exact embedded PNG artwork
- `assets/brand/png/`: PNG previews generated from the same source artwork
- `assets/brand/png/small/`: generated small-size PNG exports
- `assets/brand/base64/`: generated base64 and data URI exports
- `assets/brand/preview.html`: browser review page
- `assets/brand/manifest.json`: palette, source images, and asset index

These files intentionally preserve the supplied renders. Do not redraw, reinterpret, or retrace these assets unless a future pass explicitly asks for a pure-vector rebuild.
