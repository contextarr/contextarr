import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const forbiddenPaths = [
  "tools/brand-kit/package-lock.json",
  "tools/brand-kit/node_modules",
];

const requiredFiles = [
  "assets/brand/README.md",
  "assets/brand/manifest.json",
  "assets/brand/preview.html",
  "assets/brand/svg/app-icon.svg",
  "assets/brand/svg/favicon-mark.svg",
  "assets/brand/svg/icon-only.svg",
  "assets/brand/svg/primary-horizontal.svg",
  "assets/brand/svg/wordmark-only.svg",
  "tools/brand-kit/generate-brand-kit.mjs",
  "tools/brand-kit/package.json",
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(repoRoot, file))) {
    fail(`Missing required brand file: ${file}`);
  }
}

for (const file of forbiddenPaths) {
  const tracked = execFileSync("git", ["ls-files", "--", file], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
  if (tracked) {
    fail(`Forbidden brand artifact is tracked: ${file}`);
  }
}

const trackedPng = execFileSync("git", ["ls-files", "--", "assets/brand/png", "assets/brand/browser-preview.png"], {
  cwd: repoRoot,
  encoding: "utf8",
}).trim();
if (trackedPng) {
  fail(`Generated PNG preview assets must stay untracked:\n${trackedPng}`);
}

const manifestPath = path.join(repoRoot, "assets/brand/manifest.json");
const manifestText = fs.readFileSync(manifestPath, "utf8");
if (/generatedAt/i.test(manifestText) || /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(manifestText)) {
  fail("Brand manifest must not contain timestamp churn.");
}

if (!/Sora/.test(manifestText) || !/Chakra Petch/.test(manifestText)) {
  fail("Brand manifest must document the production font system.");
}

const svgDir = path.join(repoRoot, "assets/brand/svg");
for (const file of fs.readdirSync(svgDir).filter((name) => name.endsWith(".svg"))) {
  const svg = fs.readFileSync(path.join(svgDir, file), "utf8");
  if (/<image\b/i.test(svg) || /base64,/i.test(svg)) {
    fail(`Production SVG contains embedded raster payload: ${file}`);
  }
}

const dirty = execFileSync(
  "git",
  [
    "diff",
    "--",
    "assets/brand/README.md",
    "assets/brand/manifest.json",
    "assets/brand/preview.html",
    "assets/brand/svg",
    "tools/brand-kit/generate-brand-kit.mjs",
    "tools/brand-kit/package.json",
    "tools/brand-kit/verify-brand-kit.mjs",
  ],
  { cwd: repoRoot, encoding: "utf8" },
);
if (dirty.trim()) {
  fail("Brand build changed tracked files. Run pnpm brand:build and commit the generated SVG/manifest output.");
}

if (!process.exitCode) {
  console.log("Contextarr brand kit verified.");
}
