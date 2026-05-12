import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const demoPacksRoot = path.join(repoRoot, "demo-packs");
const evalsRoot = path.join(repoRoot, "demo-evals");

const requiredFiles = [
  "README.md",
  "no-context-prompt.md",
  "raw-notes-prompt.md",
  "contextarr-export-prompt.md",
  "expected-facts.yaml",
  "sensitive-facts.yaml",
  "scoring-rubric.yaml",
  "sample-outputs/no-context.md",
  "sample-outputs/raw-notes.md",
  "sample-outputs/contextarr-export.md",
  "report.json",
  "report.md"
];

const blockedSamplePatterns = [
  { name: "AWS access key shape", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "GitHub token shape", pattern: /gh[pousr]_[A-Za-z0-9_]{20,}/ },
  { name: "OpenAI API key shape", pattern: /sk-[A-Za-z0-9]{20,}/ },
  { name: "private key block", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "email address", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { name: "IPv4 address", pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/ },
  { name: "Windows user path", pattern: /\b[A-Z]:\\Users\\[^\\\s]+/i },
  { name: "Unix home path", pattern: /\/home\/[A-Za-z0-9_-]+/ },
  { name: "shell command snippet", pattern: /(?:^|\n)\s*(?:sudo|curl|wget|ssh|scp|docker|kubectl|npm|pnpm|yarn|powershell|cmd\.exe)\s+/i },
  { name: "brand endorsement phrase", pattern: /\b(?:officially endorsed|certified partner|guaranteed best|approved by|sponsored by)\b/i }
];

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    fail(`Invalid JSON in ${path.relative(repoRoot, filePath)}: ${error.message}`);
    return null;
  }
}

function meaningfulYamlLines(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function listDirectories(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

const packSlugs = listDirectories(demoPacksRoot).filter((slug) =>
  fs.existsSync(path.join(demoPacksRoot, slug, "contextarr-pack.json"))
);
const evalSlugs = listDirectories(evalsRoot);

if (packSlugs.length !== 15) {
  fail(`Expected exactly 15 demo packs, found ${packSlugs.length}.`);
}

if (evalSlugs.length !== 15) {
  fail(`Expected exactly 15 demo eval folders, found ${evalSlugs.length}.`);
}

const packIdsBySlug = new Map();
for (const slug of packSlugs) {
  const manifest = readJson(path.join(demoPacksRoot, slug, "contextarr-pack.json"));
  if (manifest?.id) {
    packIdsBySlug.set(slug, manifest.id);
  } else {
    fail(`Demo pack ${slug} is missing contextarr-pack.json id.`);
  }
}

for (const slug of packSlugs) {
  if (!evalSlugs.includes(slug)) {
    fail(`Missing demo eval folder for pack slug: ${slug}`);
  }
}

for (const slug of evalSlugs) {
  if (!packIdsBySlug.has(slug)) {
    fail(`Unexpected demo eval folder without matching demo pack: ${slug}`);
    continue;
  }

  const evalDir = path.join(evalsRoot, slug);
  for (const requiredFile of requiredFiles) {
    const filePath = path.join(evalDir, requiredFile);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      fail(`Missing required eval file: ${path.relative(repoRoot, filePath)}`);
    }
  }

  const packId = packIdsBySlug.get(slug);
  const readmePath = path.join(evalDir, "README.md");
  const reportPath = path.join(evalDir, "report.json");
  const report = fs.existsSync(reportPath) ? readJson(reportPath) : null;
  const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf8") : "";
  const reportPackId = report?.packId ?? report?.metadata?.packId;

  if (reportPackId !== packId && !readme.includes(packId)) {
    fail(`Eval ${slug} must reference real pack id ${packId} in README or report metadata.`);
  }

  for (const factFile of ["expected-facts.yaml", "sensitive-facts.yaml"]) {
    const filePath = path.join(evalDir, factFile);
    if (fs.existsSync(filePath) && meaningfulYamlLines(filePath).length < 2) {
      fail(`${path.relative(repoRoot, filePath)} must contain non-empty facts.`);
    }
  }

  for (const sampleFile of [
    "sample-outputs/no-context.md",
    "sample-outputs/raw-notes.md",
    "sample-outputs/contextarr-export.md"
  ]) {
    const filePath = path.join(evalDir, sampleFile);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const sample = fs.readFileSync(filePath, "utf8");
    for (const blocked of blockedSamplePatterns) {
      if (blocked.pattern.test(sample)) {
        fail(`${path.relative(repoRoot, filePath)} contains blocked ${blocked.name}.`);
      }
    }
  }

  const scores = report?.scores ?? {};
  const noContext = scores["no-context"];
  const rawNotes = scores["raw-notes"];
  const contextarrExport = scores["contextarr-export"];
  if (
    typeof noContext !== "number" ||
    typeof rawNotes !== "number" ||
    typeof contextarrExport !== "number" ||
    !(contextarrExport > rawNotes && rawNotes > noContext)
  ) {
    fail(`Eval ${slug} report.json must score contextarr-export > raw-notes > no-context.`);
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr demo eval fixtures verified: 15 folders, required files, pack references, safety scan, and score ordering passed.");
}
