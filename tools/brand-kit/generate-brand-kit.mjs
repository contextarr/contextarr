import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import TextToSVG from "text-to-svg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(__dirname, "../..");
const outRoot = path.join(repoRoot, "assets", "brand");
const svgDir = path.join(outRoot, "svg");
const pngDir = path.join(outRoot, "png");

const wordFont = TextToSVG.loadSync(require.resolve("typeface-sora/files/sora-latin-700.woff"));
const taglineFont = TextToSVG.loadSync(
  require.resolve("typeface-chakra-petch/files/chakra-petch-latin-500.woff"),
);

const palette = {
  deepNavy: "#0B1020",
  deepNavy2: "#050A16",
  indigo: "#1A2340",
  electricBlue: "#276BFF",
  blue: "#4F8BFF",
  violet: "#7B5CFF",
  cyan: "#22D3E8",
  slate: "#9AA3B2",
  white: "#F7FAFF",
  ink: "#07101F",
};

function xmlHeader(width, height, body, defs = "") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Contextarr logo</title>
  <desc id="desc">Validated context, ready for agents.</desc>
${defs}
${body}
</svg>
`;
}

function defs() {
  return `  <defs>
    <linearGradient id="ca-stroke" x1="52" y1="24" x2="204" y2="216" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${palette.cyan}"/>
      <stop offset="0.45" stop-color="${palette.electricBlue}"/>
      <stop offset="1" stop-color="${palette.violet}"/>
    </linearGradient>
    <linearGradient id="ca-layer-top" x1="76" y1="74" x2="180" y2="134" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${palette.cyan}"/>
      <stop offset="0.5" stop-color="${palette.blue}"/>
      <stop offset="1" stop-color="${palette.electricBlue}"/>
    </linearGradient>
    <linearGradient id="ca-layer-mid" x1="76" y1="100" x2="180" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${palette.blue}"/>
      <stop offset="0.62" stop-color="${palette.electricBlue}"/>
      <stop offset="1" stop-color="${palette.violet}"/>
    </linearGradient>
    <linearGradient id="ca-layer-bottom" x1="76" y1="125" x2="180" y2="186" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${palette.electricBlue}"/>
      <stop offset="1" stop-color="${palette.violet}"/>
    </linearGradient>
    <linearGradient id="ca-word-light" x1="0" y1="0" x2="0" y2="96" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#DCE5F4"/>
    </linearGradient>
    <linearGradient id="ca-arr" x1="0" y1="0" x2="160" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${palette.electricBlue}"/>
      <stop offset="1" stop-color="${palette.violet}"/>
    </linearGradient>
    <linearGradient id="ca-tagline" x1="0" y1="0" x2="520" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${palette.cyan}"/>
      <stop offset="0.52" stop-color="${palette.blue}"/>
      <stop offset="1" stop-color="${palette.violet}"/>
    </linearGradient>
    <radialGradient id="ca-node" cx="40%" cy="32%" r="70%">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.42" stop-color="${palette.cyan}"/>
      <stop offset="1" stop-color="${palette.electricBlue}"/>
    </radialGradient>
    <filter id="ca-soft-glow" x="-35%" y="-35%" width="170%" height="170%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.15 0 0 0 0 0.42 0 0 0 0 1 0 0 0 0.6 0" result="blueGlow"/>
      <feMerge>
        <feMergeNode in="blueGlow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="ca-app-shadow" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000814" flood-opacity="0.55"/>
    </filter>
  </defs>`;
}

function sheetPath(y) {
  return `M128 ${y - 31} C132 ${y - 31} 136 ${y - 29} 140 ${y - 27} L183 ${y - 4} C188 ${y - 1} 188 ${y + 5} 183 ${y + 8} L139 ${y + 33} C132 ${y + 37} 124 ${y + 37} 117 ${y + 33} L73 ${y + 8} C68 ${y + 5} 68 ${y - 1} 73 ${y - 4} L116 ${y - 27} C120 ${y - 29} 124 ${y - 31} 128 ${y - 31} Z`;
}

function symbolGroup({
  mono = false,
  color = palette.white,
  simplified = false,
  glow = true,
  x = 0,
  y = 0,
  size = 256,
} = {}) {
  const scale = size / 256;
  const stroke = mono ? color : "url(#ca-stroke)";
  const nodeFill = mono ? color : "url(#ca-node)";
  const topFill = mono ? color : "url(#ca-layer-top)";
  const midFill = mono ? color : "url(#ca-layer-mid)";
  const bottomFill = mono ? color : "url(#ca-layer-bottom)";
  const opacityMid = mono ? "0.72" : "1";
  const opacityBottom = mono ? "0.48" : "1";
  const filter = glow && !mono ? ` filter="url(#ca-soft-glow)"` : "";
  const sideNodes = simplified
    ? ""
    : `    <g fill="${nodeFill}" stroke="${stroke}" stroke-width="3.5">
      <circle cx="31" cy="103" r="6.5"/>
      <circle cx="225" cy="103" r="6.5"/>
      <path d="M38 103 H52 M204 103 H218" fill="none" stroke-linecap="round"/>
      <path d="M52 103 v33 M204 103 v33" fill="none" stroke-linecap="round" opacity="0.72"/>
    </g>`;

  return `  <g transform="translate(${x} ${y}) scale(${scale})"${filter}>
    <path d="M128 18 L202 61 C206 63 208 67 208 72 V151 C208 156 206 160 202 162 L134 204 C130 207 126 207 122 204 L54 162 C50 160 48 156 48 151 V72 C48 67 50 63 54 61 L122 20 C124 19 126 18 128 18 Z"
      fill="none" stroke="${stroke}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M128 56 V86" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="128" cy="44" r="13" fill="${nodeFill}" stroke="${stroke}" stroke-width="3"/>
${sideNodes}
    <path d="${sheetPath(146)}" fill="${bottomFill}" opacity="${opacityBottom}"/>
    <path d="${sheetPath(122)}" fill="${midFill}" opacity="${opacityMid}"/>
    <path d="${sheetPath(98)}" fill="${topFill}"/>
    <path d="M75 142 L128 173 L181 142" fill="none" stroke="${mono ? color : "#BFE9FF"}" stroke-opacity="${mono ? "0.45" : "0.36"}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M75 167 L128 198 L181 167" fill="none" stroke="${mono ? color : "#FFFFFF"}" stroke-opacity="${mono ? "0.36" : "0.26"}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function wordMetrics(text, size) {
  return wordFont.getMetrics(text, { x: 0, y: 0, fontSize: size, anchor: "top" });
}

function letteredTextWidth(text, size, tracking) {
  let width = 0;
  let hasGlyph = false;
  for (const char of text) {
    if (char === " ") {
      width += size * 0.55 + tracking;
      continue;
    }
    if (hasGlyph) {
      width += tracking;
    }
    width += taglineFont.getMetrics(char, { x: 0, y: 0, fontSize: size, anchor: "top" }).width;
    hasGlyph = true;
  }
  return width;
}

function wordmarkGroup({
  x,
  y,
  size = 92,
  contextFill = "url(#ca-word-light)",
  arrFill = "url(#ca-arr)",
  taglineFill = "url(#ca-tagline)",
  tagline = true,
} = {}) {
  const contextText = "Context";
  const arrText = "arr";
  const contextWidth = wordMetrics(contextText, size).width;
  const arrX = x + contextWidth - size * 0.018;
  const arrWidth = wordMetrics(arrText, size).width;
  const wordmarkWidth = arrX + arrWidth - x;
  const contextD = wordFont.getD(contextText, { x, y, fontSize: size, anchor: "top" });
  const arrD = wordFont.getD(arrText, { x: arrX, y, fontSize: size, anchor: "top" });
  const taglineText = "VALIDATED CONTEXT. READY FOR AGENTS.";
  const taglineSize = Math.round(size * 0.17);
  const taglineTracking = Math.max(1.6, size * 0.045);
  const taglineWidth = letteredTextWidth(taglineText, taglineSize, taglineTracking);
  const tagX = x + (wordmarkWidth - taglineWidth) / 2;
  const tag = tagline
    ? letteredText({
        text: taglineText,
        x: tagX,
        y: y + size + 16,
        size: taglineSize,
        tracking: taglineTracking,
        fill: taglineFill,
      })
    : "";

  return `  <g>
    <path d="${contextD}" fill="${contextFill}"/>
    <path d="${arrD}" fill="${arrFill}"/>
${tag}
  </g>`;
}

function letteredText({ text, x, y, size, tracking, fill }) {
  let cursor = x;
  const paths = [];
  let hasGlyph = false;
  for (const char of text) {
    if (char === " ") {
      cursor += size * 0.55 + tracking;
      continue;
    }
    if (hasGlyph) {
      cursor += tracking;
    }
    const d = taglineFont.getD(char, { x: cursor, y, fontSize: size, anchor: "top" });
    paths.push(`<path d="${d}"/>`);
    cursor += taglineFont.getMetrics(char, { x: 0, y: 0, fontSize: size, anchor: "top" }).width;
    hasGlyph = true;
  }
  return `    <g fill="${fill}">
      ${paths.join("\n      ")}
    </g>`;
}

function horizontalLockup({ light = false, glow = !light } = {}) {
  const width = 980;
  const height = 260;
  const body = `${symbolGroup({ x: 36, y: 30, size: 196, glow })}
${wordmarkGroup({
  x: 282,
  y: 72,
  size: 90,
  contextFill: light ? palette.ink : "url(#ca-word-light)",
  arrFill: "url(#ca-arr)",
  taglineFill: light ? "url(#ca-arr)" : "url(#ca-tagline)",
})}`;
  return xmlHeader(width, height, body, defs());
}

function iconOnly({ mini = false, mono = false, monoColor = palette.white, glow = !mini && !mono } = {}) {
  const width = 256;
  const height = 256;
  const body = symbolGroup({ mono, color: monoColor, simplified: mini, glow, x: 0, y: 0, size: 256 });
  return xmlHeader(width, height, body, defs());
}

function appIcon() {
  const width = 512;
  const height = 512;
  const body = `  <rect x="48" y="48" width="416" height="416" rx="92" fill="${palette.deepNavy}" stroke="#334268" stroke-width="3" filter="url(#ca-app-shadow)"/>
  <rect x="72" y="72" width="368" height="368" rx="74" fill="#0D1836" opacity="0.62"/>
${symbolGroup({ x: 98, y: 86, size: 316, glow: true })}`;
  return xmlHeader(width, height, body, defs());
}

function monochromeLockup({ color, light = false } = {}) {
  const width = 900;
  const height = 220;
  const body = `${symbolGroup({ mono: true, color, simplified: false, glow: false, x: 34, y: 24, size: 172 })}
${wordmarkGroup({
  x: 246,
  y: 62,
  size: 78,
  contextFill: color,
  arrFill: color,
  taglineFill: color,
})}`;
  const background = light
    ? `  <rect width="${width}" height="${height}" fill="#F6F8FB"/>\n`
    : "";
  return xmlHeader(width, height, `${background}${body}`, defs());
}

function stackedLockup() {
  const width = 620;
  const height = 430;
  const textWidth = wordMetrics("Contextarr", 76).width;
  const textX = Math.round((width - textWidth) / 2);
  const body = `${symbolGroup({ x: 218, y: 34, size: 184, glow: true })}
${wordmarkGroup({ x: textX, y: 240, size: 76 })}`;
  return xmlHeader(width, height, body, defs());
}

function wordmarkOnly({ light = false } = {}) {
  const width = 650;
  const height = 150;
  const body = wordmarkGroup({
    x: 24,
    y: 22,
    size: 76,
    contextFill: light ? palette.ink : "url(#ca-word-light)",
    arrFill: "url(#ca-arr)",
    taglineFill: light ? "url(#ca-arr)" : "url(#ca-tagline)",
  });
  return xmlHeader(width, height, body, defs());
}

function paletteSwatch(x, y, fill, label, hex) {
  return `  <g transform="translate(${x} ${y})">
    <rect width="92" height="92" rx="14" fill="${fill}" stroke="#5B6B91" stroke-opacity="0.55"/>
    <text x="46" y="124" fill="#D7DEEE" font-family="Arial, sans-serif" font-size="16" text-anchor="middle">${label}</text>
    <text x="46" y="148" fill="#8D98B2" font-family="Arial, sans-serif" font-size="15" text-anchor="middle">${hex}</text>
  </g>`;
}

function brandSheet() {
  const width = 1448;
  const height = 1185;
  const panel = (x, y, w, h) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#050A16" stroke="#23304C" stroke-width="1.5"/>`;
  const body = `  <rect width="${width}" height="${height}" fill="#030712"/>
  <g opacity="0.25" stroke="#16213A" stroke-width="1">
    ${Array.from({ length: 18 }, (_, i) => `<path d="M${i * 84} 0 V${height}"/>`).join("\n    ")}
    ${Array.from({ length: 13 }, (_, i) => `<path d="M0 ${i * 84} H${width}"/>`).join("\n    ")}
  </g>
  ${panel(18, 18, 1000, 438)}
  <text x="44" y="58" fill="#89A0FF" font-family="Arial, sans-serif" font-size="16" letter-spacing="4">1. PRIMARY HORIZONTAL LOCKUP</text>
${symbolGroup({ x: 92, y: 104, size: 214, glow: true })}
${wordmarkGroup({ x: 360, y: 154, size: 96 })}
  ${panel(1042, 18, 388, 288)}
  <text x="1068" y="58" fill="#89A0FF" font-family="Arial, sans-serif" font-size="16" letter-spacing="4">2. APP ICON</text>
  <g transform="translate(1124 78) scale(0.36)">
    <rect x="48" y="48" width="416" height="416" rx="92" fill="${palette.deepNavy}" stroke="#334268" stroke-width="3"/>
    <rect x="72" y="72" width="368" height="368" rx="74" fill="#0D1836" opacity="0.62"/>
${symbolGroup({ x: 98, y: 86, size: 316, glow: true })}
  </g>
  ${panel(1042, 318, 388, 138)}
  <text x="1068" y="358" fill="#89A0FF" font-family="Arial, sans-serif" font-size="16" letter-spacing="4">3. MINI MARK</text>
${symbolGroup({ x: 1164, y: 368, size: 78, simplified: true, glow: false })}
  ${panel(18, 468, 698, 198)}
  <rect x="18" y="468" width="698" height="198" rx="14" fill="#F6F8FB"/>
  <text x="44" y="510" fill="#263F96" font-family="Arial, sans-serif" font-size="16" letter-spacing="4">4. LIGHT BACKGROUND</text>
${symbolGroup({ x: 78, y: 522, size: 118, glow: false })}
${wordmarkGroup({ x: 250, y: 542, size: 60, contextFill: palette.ink, arrFill: "url(#ca-arr)", taglineFill: "url(#ca-arr)" })}
  ${panel(728, 468, 702, 198)}
  <text x="754" y="510" fill="#89A0FF" font-family="Arial, sans-serif" font-size="16" letter-spacing="4">5. MONOCHROME WHITE</text>
${symbolGroup({ mono: true, color: palette.white, x: 786, y: 518, size: 112, glow: false })}
${wordmarkGroup({ x: 960, y: 545, size: 58, contextFill: palette.white, arrFill: palette.white, taglineFill: palette.white })}
  ${panel(18, 678, 698, 198)}
  <text x="44" y="720" fill="#89A0FF" font-family="Arial, sans-serif" font-size="16" letter-spacing="4">6. STACKED LOCKUP</text>
${symbolGroup({ x: 318, y: 710, size: 96, glow: true })}
${wordmarkGroup({ x: 236, y: 790, size: 52 })}
  ${panel(728, 678, 702, 198)}
  <rect x="728" y="678" width="702" height="198" rx="14" fill="#F6F8FB"/>
  <text x="754" y="720" fill="#263F96" font-family="Arial, sans-serif" font-size="16" letter-spacing="4">7. MONOCHROME DARK</text>
${symbolGroup({ mono: true, color: palette.ink, x: 786, y: 730, size: 106, glow: false })}
${wordmarkGroup({ x: 958, y: 756, size: 56, contextFill: palette.ink, arrFill: palette.ink, taglineFill: palette.ink })}
  ${panel(18, 898, 1412, 250)}
  <text x="44" y="940" fill="#89A0FF" font-family="Arial, sans-serif" font-size="16" letter-spacing="4">8. COLOR PALETTE</text>
  ${paletteSwatch(44, 966, palette.deepNavy, "Deep Navy", "#0B1020")}
  ${paletteSwatch(150, 966, palette.electricBlue, "Electric Blue", "#276BFF")}
  ${paletteSwatch(256, 966, palette.violet, "Violet", "#7B5CFF")}
  ${paletteSwatch(362, 966, palette.cyan, "Cyan", "#22D3E8")}
  ${paletteSwatch(468, 966, palette.slate, "Slate", "#9AA3B2")}
  <path d="M640 922 V1048" stroke="#31405F"/>
${symbolGroup({ x: 684, y: 956, size: 72, glow: false })}
  <text x="780" y="992" fill="#F7FAFF" font-family="Arial, sans-serif" font-size="19" font-weight="700">Primary mark</text>
  <text x="780" y="1022" fill="#9AA3B2" font-family="Arial, sans-serif" font-size="16">Structured context, validated and ready for agents.</text>
  <path d="M44 1134 H1404" stroke="#23304C"/>
  <text x="44" y="1163" fill="#F7FAFF" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="2">CONTEXTARR IS THE CONTEXT &amp; CONTROL LAYER. NOT AN AGENT RUNNER.</text>`;
  return xmlHeader(width, height, body, defs());
}

function smallSizeCheck() {
  const width = 680;
  const height = 190;
  const label = (x, text) =>
    `<text x="${x}" y="164" fill="#9AA3B2" font-family="Arial, sans-serif" font-size="14" text-anchor="middle">${text}</text>`;
  const body = `  <rect width="${width}" height="${height}" fill="#050A16"/>
  <text x="24" y="32" fill="#89A0FF" font-family="Arial, sans-serif" font-size="15" letter-spacing="3">SMALL SIZE CHECK</text>
  <g transform="translate(44 58)">${symbolGroup({ x: 0, y: 0, size: 16, simplified: true, glow: false })}</g>
  ${label(52, "16")}
  <g transform="translate(100 50)">${symbolGroup({ x: 0, y: 0, size: 32, simplified: true, glow: false })}</g>
  ${label(116, "32")}
  <g transform="translate(164 34)">${symbolGroup({ x: 0, y: 0, size: 64, simplified: true, glow: false })}</g>
  ${label(196, "64 mini")}
  <path d="M270 42 V150" stroke="#23304C"/>
  <g transform="translate(314 50)">${symbolGroup({ x: 0, y: 0, size: 32, glow: false })}</g>
  ${label(330, "32")}
  <g transform="translate(380 34)">${symbolGroup({ x: 0, y: 0, size: 64, glow: false })}</g>
  ${label(412, "64")}
  <g transform="translate(486 2)">${symbolGroup({ x: 0, y: 0, size: 128, glow: false })}</g>
  ${label(550, "128 icon")}`;
  return xmlHeader(width, height, body, defs());
}

function faviconMark() {
  const width = 64;
  const height = 64;
  const localDefs = `  <defs>
    <linearGradient id="fav-stroke" x1="14" y1="8" x2="50" y2="58" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${palette.cyan}"/>
      <stop offset="0.52" stop-color="${palette.electricBlue}"/>
      <stop offset="1" stop-color="${palette.violet}"/>
    </linearGradient>
    <linearGradient id="fav-fill" x1="18" y1="18" x2="46" y2="48" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${palette.cyan}"/>
      <stop offset="0.55" stop-color="${palette.electricBlue}"/>
      <stop offset="1" stop-color="${palette.violet}"/>
    </linearGradient>
  </defs>`;
  const body = `  <path d="M32 6 L51 17 C53 18 54 20 54 22 V42 C54 44 53 46 51 47 L35 57 C33 58 31 58 29 57 L13 47 C11 46 10 44 10 42 V22 C10 20 11 18 13 17 L29 7 C30 6 31 6 32 6 Z" fill="none" stroke="url(#fav-stroke)" stroke-width="4" stroke-linejoin="round"/>
  <path d="M18 27 L32 19 L46 27 L32 35 Z" fill="url(#fav-fill)"/>
  <path d="M18 37 L32 45 L46 37" fill="none" stroke="url(#fav-stroke)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 45 L32 52 L44 45" fill="none" stroke="url(#fav-stroke)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  return xmlHeader(width, height, body, localDefs);
}

const assets = [
  ["primary-horizontal.svg", horizontalLockup({ light: false })],
  ["primary-horizontal-flat.svg", horizontalLockup({ light: false, glow: false })],
  ["primary-horizontal-light.svg", horizontalLockup({ light: true })],
  ["wordmark-only.svg", wordmarkOnly({ light: false })],
  ["wordmark-only-light.svg", wordmarkOnly({ light: true })],
  ["icon-only.svg", iconOnly()],
  ["icon-only-flat.svg", iconOnly({ glow: false })],
  ["mini-mark.svg", iconOnly({ mini: true })],
  ["favicon-mark.svg", faviconMark()],
  ["app-icon.svg", appIcon()],
  ["monochrome-white.svg", monochromeLockup({ color: palette.white })],
  ["monochrome-dark.svg", monochromeLockup({ color: palette.ink })],
  ["stacked-lockup.svg", stackedLockup()],
  ["brand-sheet.svg", brandSheet()],
  ["small-size-check.svg", smallSizeCheck()],
];

async function writeText(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

async function renderPng(name, svg) {
  const pngPath = path.join(pngDir, name.replace(/\.svg$/, ".png"));
  await fs.mkdir(path.dirname(pngPath), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(pngPath);
}

async function renderSizedPng(name, svg, size) {
  const pngPath = path.join(pngDir, "small", `${name}-${size}.png`);
  await fs.mkdir(path.dirname(pngPath), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, size, { fit: "contain" }).png().toFile(pngPath);
}

function htmlPreview() {
  const cards = assets
    .filter(([name]) => name !== "brand-sheet.svg")
    .map(([name]) => {
      const light = name.includes("light") || name.includes("dark");
      return `<section class="${light ? "light" : "dark"}"><h2>${name}</h2><img src="svg/${name}" alt="${name}"></section>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Contextarr Brand Assets</title>
  <style>
    :root { color-scheme: dark; font-family: Arial, sans-serif; background: #030712; color: #f7faff; }
    body { margin: 0; padding: 32px; }
    h1 { margin: 0 0 24px; font-size: 24px; letter-spacing: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; }
    section { border: 1px solid #253451; border-radius: 8px; padding: 18px; min-height: 180px; display: grid; align-content: center; gap: 14px; }
    section.dark { background: #050a16; }
    section.light { background: #f6f8fb; color: #07101f; }
    h2 { margin: 0; font-size: 13px; letter-spacing: .16em; color: #89a0ff; text-transform: uppercase; }
    img { max-width: 100%; max-height: 260px; object-fit: contain; }
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
  await fs.mkdir(svgDir, { recursive: true });
  await fs.mkdir(pngDir, { recursive: true });

  for (const [name, svg] of assets) {
    await writeText(path.join(svgDir, name), svg);
    await renderPng(name, svg);
  }

  const miniSvg = assets.find(([name]) => name === "mini-mark.svg")[1];
  const faviconSvg = assets.find(([name]) => name === "favicon-mark.svg")[1];
  const iconSvg = assets.find(([name]) => name === "icon-only-flat.svg")[1];
  for (const size of [16, 32, 64]) {
    await renderSizedPng("mini-mark", miniSvg, size);
  }
  for (const size of [16, 32, 64]) {
    await renderSizedPng("favicon-mark", faviconSvg, size);
  }
  for (const size of [32, 64, 128]) {
    await renderSizedPng("icon-only-flat", iconSvg, size);
  }

  const manifest = {
    source: "tools/brand-kit/generate-brand-kit.mjs",
    font: {
      wordmarkFamily: "Sora",
      taglineFamily: "Chakra Petch",
      packages: ["typeface-sora", "typeface-chakra-petch"],
      license: "MIT packages, bundled Google Fonts under OFL-1.1",
      note: "Wordmark and tagline are converted to SVG paths for portable rendering. Sora carries the product name; Chakra Petch is used only as a compact technical accent.",
    },
    palette,
    assets: assets.map(([name]) => ({
      svg: `assets/brand/svg/${name}`,
      pngPreview: `assets/brand/png/${name.replace(/\.svg$/, ".png")}`,
    })),
  };

  await writeText(path.join(outRoot, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  await writeText(path.join(outRoot, "preview.html"), htmlPreview());
  await writeText(
    path.join(outRoot, "README.md"),
    `# Contextarr Brand Assets

Generated SVG brand set for Contextarr.

## Build

\`\`\`bash
pnpm brand:build
\`\`\`

## Output

- \`assets/brand/svg/\`: production SVGs
- \`assets/brand/png/\`: PNG previews rendered from the SVGs
- \`assets/brand/png/small/\`: small-size checks for favicon and tray usage
- \`assets/brand/preview.html\`: browser review page
- \`assets/brand/manifest.json\`: palette, font, and asset index

The wordmark uses path outlines generated from open-source Sora and Chakra Petch font packages so the SVGs do not depend on a viewer having fonts installed.
`,
  );

  console.log(`Generated ${assets.length} SVG files under ${path.relative(repoRoot, svgDir)}`);
}

await main();
