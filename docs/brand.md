# Contextarr Brand Kit

Contextarr uses a deterministic SVG brand kit generated from `tools/brand-kit`.

## Assets

- Production SVGs live in `assets/brand/svg/`.
- `assets/brand/manifest.json` records the palette, source generator, and asset index.
- `assets/brand/preview.html` is a local review page for the SVG set.
- PNG previews are generated locally under `assets/brand/png/` and intentionally ignored.

## Build

```bash
pnpm brand:build
pnpm brand:verify
```

The wordmark is converted to SVG paths from the open-source Oxanium font package so the checked-in SVGs render consistently without requiring the font on the viewer's machine.
