import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const contractPath = path.join(repoRoot, "docs/public-surface-contract.json");
const manifestPath = path.join(repoRoot, "docs/screenshots/v0.1.0-alpha.1/manifest.json");

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hashFile(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(repoRoot, relativePath))).digest("hex");
}

function pngSize(relativePath) {
  const buffer = fs.readFileSync(path.join(repoRoot, relativePath));
  if (buffer.length < 33 || buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail(`${relativePath} is not a valid PNG.`);
    return { width: 0, height: 0 };
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function listDirs(relativePath) {
  return fs
    .readdirSync(path.join(repoRoot, relativePath), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function countRecordFiles(packDirName) {
  const recordsDir = path.join(repoRoot, "demo-packs", packDirName, "records");
  if (!fs.existsSync(recordsDir)) {
    return 0;
  }
  return fs.readdirSync(recordsDir).filter((file) => file.endsWith(".md")).length;
}

function routeToFile(route) {
  if (route === "/") {
    return "apps/site/src/pages/index.astro";
  }
  return `apps/site/src/pages${route}.astro`;
}

if (!fs.existsSync(contractPath)) {
  fail("Missing docs/public-surface-contract.json.");
}

if (!fs.existsSync(manifestPath)) {
  fail("Missing screenshot manifest for public surface verification.");
}

if (!failed) {
  const contract = readJson(contractPath);
  const manifest = readJson(manifestPath);
  const demoPackDirs = listDirs("demo-packs");
  const skillDirs = listDirs("demo-skills");
  const starterPackCount = demoPackDirs.filter((dir) => {
    const manifestFile = path.join(repoRoot, "demo-packs", dir, "contextarr-pack.json");
    const pack = readJson(manifestFile);
    return pack.starterPack === true;
  }).length;
  const recordCount = demoPackDirs.reduce((total, dir) => total + countRecordFiles(dir), 0);

  const inventoryChecks = [
    ["demo pack", demoPackDirs.length, contract.inventory.demoPacks],
    ["starter pack", starterPackCount, contract.inventory.starterPacks],
    ["record", recordCount, contract.inventory.records],
    ["skill", skillDirs.length, contract.inventory.skills]
  ];

  for (const [label, actual, expected] of inventoryChecks) {
    if (actual !== expected) {
      fail(`Public surface ${label} count drifted: expected ${expected}, got ${actual}.`);
    }
  }

  for (const [key, expected] of Object.entries(contract.inventory)) {
    if (typeof expected !== "number") {
      continue;
    }
    if (manifest.inventory?.[key] !== expected) {
      fail(`Screenshot manifest inventory.${key} must be ${expected}; got ${manifest.inventory?.[key]}.`);
    }
  }

  const routeFiles = [];
  for (const route of contract.website.routes ?? []) {
    const routeFile = routeToFile(route);
    routeFiles.push(routeFile);
    if (!fs.existsSync(path.join(repoRoot, routeFile))) {
      fail(`Public site route ${route} is missing source file ${routeFile}.`);
    }
  }

  const screenshot = contract.screenshots.homepageSource;
  const siteCopy = contract.screenshots.homepageSiteCopy;
  if (hashFile(screenshot) !== hashFile(siteCopy)) {
    fail("Site homepage screenshot must match the reviewed Pack Library screenshot byte-for-byte.");
  }

  const { width, height } = pngSize(screenshot);
  if (width < contract.screenshots.minimumWidth || height < contract.screenshots.minimumHeight) {
    fail(
      `Homepage screenshot is too small: expected at least ${contract.screenshots.minimumWidth}x${contract.screenshots.minimumHeight}, got ${width}x${height}.`
    );
  }

  if (manifest.publicHomepageImage?.file !== path.basename(screenshot)) {
    fail("Screenshot manifest publicHomepageImage.file must point at the Pack Library screenshot.");
  }
  if (manifest.publicHomepageImage?.approvedForHomepage !== true || manifest.publicHomepageImage?.approvedForOpenGraph !== true) {
    fail("Screenshot manifest must approve the current Pack Library image for homepage and Open Graph use.");
  }

  const publicSurfaceFiles = [
    "README.md",
    "docs/public-surface.md",
    "docs/known-limitations.md",
    "docs/release-checklist.md",
    "docs/faq.md",
    "docs/screenshots/README.md",
    "apps/site/src/content/site.ts",
    "apps/site/src/components/Hero.astro",
    "apps/site/src/components/StatusSection.astro",
    ...routeFiles,
    "apps/site/src/layouts/BaseLayout.astro"
  ];
  const publicSurfaceText = publicSurfaceFiles.map((file) => `${file}\n${read(file)}`).join("\n\n");
  const currentPublicClaimFiles = [
    "README.md",
    "apps/site/src/content/site.ts",
    "apps/site/src/components/Hero.astro",
    "apps/site/src/components/StatusSection.astro",
    ...routeFiles
  ];
  const currentPublicClaimText = currentPublicClaimFiles.map((file) => `${file}\n${read(file)}`).join("\n\n");

  for (const phrase of contract.publicCopy.requiredPhrases) {
    if (!publicSurfaceText.includes(phrase)) {
      fail(`Public surface copy is missing required phrase: ${phrase}`);
    }
  }

  for (const name of contract.inventory.demoPackNames ?? []) {
    if (!publicSurfaceText.includes(name)) {
      fail(`Public surface copy is missing current demo pack name: ${name}`);
    }
  }

  for (const phrase of contract.screenshots.forbiddenLegacyLabels ?? []) {
    const matcher = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (matcher.test(currentPublicClaimText)) {
      fail(`Public surface copy still contains retired label: ${phrase}`);
    }
  }

  for (const phrase of contract.publicCopy.forbiddenPhrases) {
    const matcher = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (matcher.test(currentPublicClaimText)) {
      fail(`Public surface copy still contains forbidden current-positioning phrase: ${phrase}`);
    }
  }

  if (!publicSurfaceText.includes("15 packs / 120 records / 8 skills")) {
    fail("Public surface must show the current verified dashboard count: 15 packs / 120 records / 8 skills.");
  }

  if (!publicSurfaceText.includes("https://contextarr.com")) {
    fail("Public surface docs must include the launch website target.");
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr public surface verified.");
}
