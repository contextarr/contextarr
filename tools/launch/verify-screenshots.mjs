import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const screenshotDir = path.join(repoRoot, "docs/screenshots/v0.1.0-alpha.1");
const manifestPath = path.join(screenshotDir, "manifest.json");

const requiredScreenshots = [
  "pack-library-grid.png",
  "dense-table.png",
  "pack-detail.png",
  "record-source-detail.png",
  "pack-health.png",
  "export-preview.png",
  "cli-output.png",
  "security-boundary.png"
];

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  const pngSignature = "89504e470d0a1a0a";

  if (buffer.length < 33 || buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    fail(`${path.relative(repoRoot, filePath)} is not a valid PNG screenshot.`);
    return { width: 0, height: 0, byteLength: buffer.length };
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    byteLength: buffer.length
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

if (!fs.existsSync(screenshotDir)) {
  fail("Missing reviewed alpha screenshot directory: docs/screenshots/v0.1.0-alpha.1");
}

if (!fs.existsSync(manifestPath)) {
  fail("Missing reviewed alpha screenshot manifest.");
}

if (!failed) {
  const manifest = readJson(manifestPath);
  const manifestFiles = new Set((manifest.screenshots ?? []).map((entry) => entry.file));

  if (manifest.release !== "v0.1.0-alpha.1") {
    fail("Screenshot manifest must target v0.1.0-alpha.1.");
  }

  if (manifest.reviewed !== true || manifest.privateDataReviewed !== true) {
    fail("Screenshot manifest must mark screenshots as reviewed and private-data checked.");
  }

  for (const file of requiredScreenshots) {
    const filePath = path.join(screenshotDir, file);

    if (!fs.existsSync(filePath)) {
      fail(`Missing reviewed screenshot: ${file}`);
      continue;
    }

    if (!manifestFiles.has(file)) {
      fail(`Screenshot manifest is missing entry: ${file}`);
    }

    const { width, height, byteLength } = readPngSize(filePath);
    if (width < 1200 || height < 800) {
      fail(`${file} must be at least 1200x800; got ${width}x${height}.`);
    }
    if (byteLength < 20_000) {
      fail(`${file} looks too small to be a real reviewed screenshot (${byteLength} bytes).`);
    }
  }

  for (const entry of manifest.screenshots ?? []) {
    if (!entry.file || !entry.slot || !entry.source || entry.reviewed !== true) {
      fail(`Screenshot manifest entry is incomplete: ${JSON.stringify(entry)}`);
    }
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr alpha screenshots verified.");
}
