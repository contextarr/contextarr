import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const brandRoot = path.join(repoRoot, "assets", "brand");
const svgDir = path.join(brandRoot, "svg");
const pngDir = path.join(brandRoot, "png");

const requiredFiles = [
  "assets/brand/README.md",
  "assets/brand/manifest.json",
  "assets/brand/preview.html",
  "assets/brand/source/contextarr-brand-system-v0.1.png",
  "assets/brand/source/individual/app-icon-circle.png",
  "assets/brand/source/individual/app-icon-square.png",
  "assets/brand/source/individual/icon-mark.png",
  "assets/brand/source/individual/monochrome-dark.png",
  "assets/brand/source/individual/monochrome-white.png",
  "assets/brand/source/individual/primary-horizontal-dark.png",
  "assets/brand/source/individual/primary-horizontal-light.png",
  "assets/brand/source/individual/single-color-green.png",
  "assets/brand/svg/app-icon-circle.svg",
  "assets/brand/svg/app-icon.svg",
  "assets/brand/svg/brand-sheet.svg",
  "assets/brand/svg/favicon-mark.svg",
  "assets/brand/svg/icon-only.svg",
  "assets/brand/svg/mini-mark.svg",
  "assets/brand/svg/monochrome-dark.svg",
  "assets/brand/svg/monochrome-white.svg",
  "assets/brand/svg/primary-horizontal.svg",
  "assets/brand/svg/primary-horizontal-light.svg",
  "assets/brand/svg/single-color-green.svg",
  "assets/brand/svg/small-size-check.svg",
  "assets/brand/svg/wordmark-only.svg",
  "tools/brand-kit/generate-brand-kit.mjs",
  "tools/brand-kit/package.json",
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function readRepoFile(file) {
  return fs.readFileSync(path.join(repoRoot, file), "utf8");
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(repoRoot, file))) {
    fail(`Missing required brand file: ${file}`);
  }
}

const trackedPng = execFileSync("git", ["ls-files", "--", "assets/brand/png", "assets/brand/base64"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
if (trackedPng) {
  fail(`Generated PNG/base64 assets must stay untracked:\n${trackedPng}`);
}

const manifestText = readRepoFile("assets/brand/manifest.json");
if (/generatedAt/i.test(manifestText) || /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(manifestText)) {
  fail("Brand manifest must not contain timestamp churn.");
}

for (const color of ["#22C55E", "#2563EB", "#0B1220", "#111827", "#FFFFFF", "#F59E0B", "#EF4444"]) {
  if (!manifestText.includes(color)) {
    fail(`Brand manifest is missing required palette color: ${color}`);
  }
}

const manifest = JSON.parse(manifestText);
if (manifest.mode !== "individual-source-raster-svg-wrappers") {
  fail("Brand manifest must record individual source raster wrapper mode.");
}

if (!Array.isArray(manifest.sourceImages) || manifest.sourceImages.length !== 8) {
  fail("Brand manifest must record the eight approved individual source renders.");
}

async function diffSvgAgainstPng(asset) {
  const svgPath = path.join(repoRoot, asset.svg);
  const pngPath = path.join(repoRoot, asset.pngPreview);
  const svg = fs.readFileSync(svgPath, "utf8");
  if (!/<image\b/i.test(svg) || !/data:image\/png;base64,/i.test(svg)) {
    fail(`Individual source SVG must embed its approved PNG artwork: ${asset.svg}`);
    return;
  }

  const rendered = await sharp(svgPath).png().toBuffer();
  const expected = fs.readFileSync(pngPath);
  const renderedPng = PNG.sync.read(rendered);
  const expectedPng = PNG.sync.read(expected);
  if (renderedPng.width !== expectedPng.width || renderedPng.height !== expectedPng.height) {
    fail(`Rendered SVG dimensions differ from PNG crop: ${asset.svg}`);
    return;
  }
  const diffPixels = pixelmatch(
    expectedPng.data,
    renderedPng.data,
    null,
    expectedPng.width,
    expectedPng.height,
    { threshold: 0 },
  );
  if (diffPixels !== 0) {
    fail(`Rendered SVG does not exactly match PNG crop: ${asset.svg} (${diffPixels} pixels differ)`);
  }
}

for (const asset of manifest.assets) {
  await diffSvgAgainstPng(asset);
}

if (!process.exitCode) {
  console.log("Contextarr individual-source brand kit verified.");
}
