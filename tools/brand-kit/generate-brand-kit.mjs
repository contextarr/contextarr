import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const brandRoot = path.join(repoRoot, "assets", "brand");
const sourceDir = path.join(brandRoot, "source");
const individualSourceDir = path.join(sourceDir, "individual");
const sourceBoardPath = path.join(sourceDir, "contextarr-brand-system-v0.1.png");
const downloadedBoardPath = "D:/Downloads/Screenshot 2026-05-09 161142.png";
const svgDir = path.join(brandRoot, "svg");
const pngDir = path.join(brandRoot, "png");
const smallPngDir = path.join(pngDir, "small");

const palette = {
  green: "#22C55E",
  blue: "#2563EB",
  navy: "#0B1220",
  slate: "#111827",
  white: "#FFFFFF",
  warningOrange: "#F59E0B",
  errorRed: "#EF4444",
};

const sourceImages = [
  {
    id: "primary-horizontal-dark",
    file: "primary-horizontal-dark.png",
    original: "D:/Downloads/Screenshot 2026-05-09 162903.png",
    description: "High-resolution dark-background primary horizontal lockup.",
  },
  {
    id: "primary-horizontal-light",
    file: "primary-horizontal-light.png",
    original: "D:/Downloads/Screenshot 2026-05-09 163018.png",
    description: "High-resolution light-background primary horizontal lockup.",
  },
  {
    id: "icon-mark",
    file: "icon-mark.png",
    original: "D:/Downloads/Screenshot 2026-05-09 163006.png",
    description: "High-resolution standalone Contextarr mark.",
  },
  {
    id: "app-icon-square",
    file: "app-icon-square.png",
    original: "D:/Downloads/Screenshot 2026-05-09 162950.png",
    description: "High-resolution rounded-square application icon.",
  },
  {
    id: "app-icon-circle",
    file: "app-icon-circle.png",
    original: "D:/Downloads/Screenshot 2026-05-09 162958.png",
    description: "High-resolution circular application icon.",
  },
  {
    id: "monochrome-white",
    file: "monochrome-white.png",
    original: "D:/Downloads/Screenshot 2026-05-09 163028.png",
    description: "High-resolution white monochrome lockup on dark background.",
  },
  {
    id: "monochrome-dark",
    file: "monochrome-dark.png",
    original: "D:/Downloads/Screenshot 2026-05-09 163042.png",
    description: "High-resolution dark monochrome lockup on light background.",
  },
  {
    id: "single-color-green",
    file: "single-color-green.png",
    original: "D:/Downloads/Screenshot 2026-05-09 163050.png",
    description: "High-resolution single-color green lockup.",
  },
];

const sourceMap = new Map(sourceImages.map((source) => [source.id, source]));

const assetSpecs = [
  {
    name: "primary-horizontal",
    title: "Contextarr primary horizontal logo lockup",
    source: "primary-horizontal-dark",
  },
  {
    name: "primary-horizontal-flat",
    title: "Contextarr primary horizontal logo lockup",
    source: "primary-horizontal-dark",
    note: "Alias of the approved dark primary lockup kept for existing consumers.",
  },
  {
    name: "primary-horizontal-light",
    title: "Contextarr light background horizontal logo lockup",
    source: "primary-horizontal-light",
    surface: "light",
  },
  {
    name: "wordmark-only",
    title: "Contextarr wordmark and tagline",
    source: "primary-horizontal-dark",
    crop: { left: 470, top: 122, width: 1165, height: 332 },
  },
  {
    name: "wordmark-only-light",
    title: "Contextarr wordmark and tagline on light background",
    source: "primary-horizontal-light",
    crop: { left: 520, top: 214, width: 1180, height: 354 },
    surface: "light",
  },
  {
    name: "icon-only",
    title: "Contextarr icon mark",
    source: "icon-mark",
  },
  {
    name: "icon-only-flat",
    title: "Contextarr icon mark",
    source: "icon-mark",
    note: "Alias of the approved standalone mark kept for existing consumers.",
  },
  {
    name: "mini-mark",
    title: "Contextarr mini mark",
    source: "icon-mark",
    fitContent: { size: 512, padding: 28 },
  },
  {
    name: "favicon-mark",
    title: "Contextarr favicon mark",
    source: "icon-mark",
    fitContent: { size: 256, padding: 18 },
  },
  {
    name: "app-icon",
    title: "Contextarr app icon",
    source: "app-icon-square",
  },
  {
    name: "app-icon-circle",
    title: "Contextarr circular app icon",
    source: "app-icon-circle",
  },
  {
    name: "monochrome-white",
    title: "Contextarr monochrome white logo",
    source: "monochrome-white",
  },
  {
    name: "monochrome-dark",
    title: "Contextarr monochrome dark logo",
    source: "monochrome-dark",
    surface: "light",
  },
  {
    name: "single-color-green",
    title: "Contextarr single color green logo",
    source: "single-color-green",
  },
  {
    name: "stacked-lockup",
    title: "Contextarr compact horizontal lockup",
    source: "primary-horizontal-dark",
    note: "Uses the full approved primary render to avoid clipping the wordmark.",
  },
  {
    name: "small-size-check",
    title: "Contextarr generated minimum size check",
    source: "icon-mark",
    smallSizeCheck: true,
  },
  {
    name: "brand-sheet",
    title: "Contextarr brand system board",
    sourceBoard: true,
  },
];

async function copyIfMissing(sourcePath, targetPath) {
  try {
    await fs.access(targetPath);
    return;
  } catch {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
  }
}

async function ensureSourceFiles() {
  await fs.mkdir(individualSourceDir, { recursive: true });
  await copyIfMissing(downloadedBoardPath, sourceBoardPath);

  for (const source of sourceImages) {
    await copyIfMissing(source.original, path.join(individualSourceDir, source.file));
  }
}

async function fileSha256(filePath) {
  const bytes = await fs.readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

function sourcePath(sourceId) {
  const source = sourceMap.get(sourceId);
  if (!source) throw new Error(`Unknown brand source image: ${sourceId}`);
  return path.join(individualSourceDir, source.file);
}

function svgWrap({ width, height, title, desc, pngBase64 }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(desc)}</desc>
  <image x="0" y="0" width="${width}" height="${height}" href="data:image/png;base64,${pngBase64}" preserveAspectRatio="none"/>
</svg>
`;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function contentSquare(buffer, { size, padding }) {
  const image = sharp(buffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const isBrandPixel =
        (g > 70 && g > r * 1.15 && g > b * 0.8) ||
        (b > 75 && b > r * 1.2) ||
        (max > 115 && max - min > 28);

      if (!isBrandPixel) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < 0 || maxY < 0) {
    return sharp(buffer).resize(size, size, { fit: "contain" }).png().toBuffer();
  }

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(info.width - 1, maxX + padding);
  maxY = Math.min(info.height - 1, maxY + padding);

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const side = Math.max(cropWidth, cropHeight);
  const left = Math.max(0, Math.min(info.width - side, Math.round(minX - (side - cropWidth) / 2)));
  const top = Math.max(0, Math.min(info.height - side, Math.round(minY - (side - cropHeight) / 2)));

  return sharp(buffer)
    .extract({ left, top, width: side, height: side })
    .resize(size, size, { fit: "contain" })
    .png()
    .toBuffer();
}

async function smallSizeCheck(buffer) {
  const mark = await contentSquare(buffer, { size: 512, padding: 32 });
  const canvasWidth = 980;
  const canvasHeight = 260;
  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
      <rect width="${canvasWidth}" height="${canvasHeight}" fill="${palette.navy}"/>
      <text x="42" y="54" fill="${palette.green}" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="5">MINIMUM SIZE CHECK</text>
      <text x="166" y="226" fill="${palette.white}" font-family="Arial, sans-serif" font-size="16">16px</text>
      <text x="354" y="226" fill="${palette.white}" font-family="Arial, sans-serif" font-size="16">32px</text>
      <text x="558" y="226" fill="${palette.white}" font-family="Arial, sans-serif" font-size="16">64px</text>
      <text x="762" y="226" fill="${palette.white}" font-family="Arial, sans-serif" font-size="16">128px</text>
    </svg>`,
  );

  return sharp(background)
    .composite([
      { input: await sharp(mark).resize(16, 16).png().toBuffer(), left: 166, top: 128 },
      { input: await sharp(mark).resize(32, 32).png().toBuffer(), left: 344, top: 114 },
      { input: await sharp(mark).resize(64, 64).png().toBuffer(), left: 548, top: 98 },
      { input: await sharp(mark).resize(128, 128).png().toBuffer(), left: 748, top: 66 },
    ])
    .png()
    .toBuffer();
}

async function buildPng(spec) {
  if (spec.sourceBoard) {
    return fs.readFile(sourceBoardPath);
  }

  const inputPath = sourcePath(spec.source);
  const input = await fs.readFile(inputPath);

  if (spec.smallSizeCheck) {
    return smallSizeCheck(input);
  }

  if (spec.fitContent) {
    return contentSquare(input, spec.fitContent);
  }

  let image = sharp(input);
  if (spec.crop) image = image.extract(spec.crop);
  return image.png().toBuffer();
}

async function writeText(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

async function writeBinary(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

async function writeAsset(spec) {
  const png = await buildPng(spec);
  const metadata = await sharp(png).metadata();
  const pngPath = path.join(pngDir, `${spec.name}.png`);
  const svgPath = path.join(svgDir, `${spec.name}.svg`);
  await writeBinary(pngPath, png);
  await writeText(
    svgPath,
    svgWrap({
      width: metadata.width,
      height: metadata.height,
      title: spec.title,
      desc: spec.sourceBoard
        ? "Exact approved Contextarr brand system board preserved as supplied."
        : "Exact pixels from the approved high-resolution Contextarr source render preserved in an SVG container.",
      pngBase64: png.toString("base64"),
    }),
  );
  return {
    name: spec.name,
    title: spec.title,
    width: metadata.width,
    height: metadata.height,
    surface: spec.surface ?? "dark",
    source: spec.sourceBoard ? "brand-sheet" : spec.source,
    svg: `assets/brand/svg/${spec.name}.svg`,
    pngPreview: `assets/brand/png/${spec.name}.png`,
    note: spec.note,
  };
}

async function renderSizedPng(name, sourcePng, size) {
  const pngPath = path.join(smallPngDir, `${name}-${size}.png`);
  await fs.mkdir(path.dirname(pngPath), { recursive: true });
  await sharp(sourcePng).resize(size, size, { fit: "contain" }).png().toFile(pngPath);
}

function htmlPreview(assets) {
  const cards = assets
    .filter((asset) => asset.name !== "brand-sheet")
    .map((asset) => {
      const light = asset.surface === "light";
      return `<section class="${light ? "light" : "dark"}"><h2>${asset.name}.svg</h2><img src="svg/${asset.name}.svg" alt="${asset.name}"></section>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Contextarr Brand Assets</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, sans-serif; background: #1f1f1f; color: #fff; }
    body { margin: 0; padding: 28px; }
    h1 { margin: 0 0 24px; font-size: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 22px; align-items: start; }
    section { border: 1px solid #303844; border-radius: 8px; padding: 16px; display: grid; gap: 14px; overflow: hidden; }
    section.dark { background: #0B1220; }
    section.light { background: #f7f7f7; color: #111827; }
    h2 { margin: 0; font-size: 13px; letter-spacing: .16em; color: #22C55E; text-transform: uppercase; }
    img { width: 100%; max-height: 360px; object-fit: contain; display: block; }
  </style>
</head>
<body>
  <h1>Contextarr Brand Assets</h1>
  <main class="grid">
${cards}
  </main>
</body>
</html>
`;
}

async function main() {
  await ensureSourceFiles();
  await fs.mkdir(svgDir, { recursive: true });
  await fs.mkdir(pngDir, { recursive: true });

  const assets = [];
  for (const spec of assetSpecs) {
    assets.push(await writeAsset(spec));
  }

  const iconPng = path.join(pngDir, "icon-only.png");
  const miniPng = path.join(pngDir, "mini-mark.png");
  const faviconPng = path.join(pngDir, "favicon-mark.png");
  const appPng = path.join(pngDir, "app-icon.png");
  const appCirclePng = path.join(pngDir, "app-icon-circle.png");
  for (const size of [16, 32, 64, 128]) await renderSizedPng("icon-only", iconPng, size);
  for (const size of [16, 32, 64, 128]) await renderSizedPng("mini-mark", miniPng, size);
  for (const size of [16, 32, 64]) await renderSizedPng("favicon-mark", faviconPng, size);
  for (const size of [128, 256, 512]) await renderSizedPng("app-icon", appPng, size);
  for (const size of [128, 256, 512]) await renderSizedPng("app-icon-circle", appCirclePng, size);

  const sourceManifest = [];
  for (const source of sourceImages) {
    const sourceFile = path.join(individualSourceDir, source.file);
    sourceManifest.push({
      id: source.id,
      path: `assets/brand/source/individual/${source.file}`,
      original: source.original,
      sha256: await fileSha256(sourceFile),
      description: source.description,
    });
  }

  const manifest = {
    source: "tools/brand-kit/generate-brand-kit.mjs",
    sourceBoard: "assets/brand/source/contextarr-brand-system-v0.1.png",
    sourceBoardOriginal: downloadedBoardPath,
    sourceImages: sourceManifest,
    mode: "individual-source-raster-svg-wrappers",
    palette: {
      primary: {
        green: palette.green,
        blue: palette.blue,
        navy: palette.navy,
        slate: palette.slate,
        white: palette.white,
      },
      semanticUiOnly: {
        warningOrange: palette.warningOrange,
        errorRed: palette.errorRed,
      },
    },
    usage: {
      positioning: "Contextarr is the context layer. Validated. Source-backed. Export-ready. Not an agent runner.",
      note: "These SVG files intentionally embed the approved high-resolution PNG renders so the logos preserve the supplied art exactly. They are SVG containers, not pure vector redraws.",
    },
    assets,
  };

  await writeText(path.join(brandRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeText(path.join(brandRoot, "preview.html"), htmlPreview(assets));
  await writeText(
    path.join(brandRoot, "README.md"),
    `# Contextarr Brand Assets

Brand assets generated from the approved individual high-resolution Contextarr renders.

## Build

\`\`\`bash
pnpm brand:build
pnpm --filter @contextarr/brand-kit base64
\`\`\`

## Output

- \`assets/brand/source/contextarr-brand-system-v0.1.png\`: approved reference board
- \`assets/brand/source/individual/\`: approved individual source renders
- \`assets/brand/svg/\`: SVG containers with exact embedded PNG artwork
- \`assets/brand/png/\`: PNG previews generated from the same source artwork
- \`assets/brand/png/small/\`: generated small-size PNG exports
- \`assets/brand/base64/\`: generated base64 and data URI exports
- \`assets/brand/preview.html\`: browser review page
- \`assets/brand/manifest.json\`: palette, source images, and asset index

These files intentionally preserve the supplied renders. Do not redraw, reinterpret, or retrace these assets unless a future pass explicitly asks for a pure-vector rebuild.
`,
  );

  console.log(`Generated ${assets.length} individual-source SVG files under ${path.relative(repoRoot, svgDir)}`);
}

await main();
