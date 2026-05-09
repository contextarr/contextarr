import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runContextPackCollector } from "@contextarr/collectors";
import { validatePack } from "@contextarr/pack-validator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const smokeRoot = path.join(repoRoot, ".contextarr-cache", "collectors-smoke");
const markdownFixture = path.join(repoRoot, "packages", "importers", "test", "fixtures", "markdown-folder");

function fail(message) {
  console.error(message);
  process.exit(1);
}

fs.rmSync(smokeRoot, { recursive: true, force: true });
fs.mkdirSync(smokeRoot, { recursive: true });

const blank = runContextPackCollector({
  collectorId: "blank-pack-starter",
  outputDir: smokeRoot,
  packId: "collector-blank-smoke",
  generatedAt: "2026-05-08T00:00:00.000Z"
});
const markdown = runContextPackCollector({
  collectorId: "markdown-folder",
  outputDir: smokeRoot,
  inputPath: markdownFixture,
  packId: "collector-markdown-smoke",
  generatedAt: "2026-05-08T00:00:00.000Z"
});
const projectNotes = runContextPackCollector({
  collectorId: "project-notes",
  outputDir: smokeRoot,
  inputPath: markdownFixture,
  packId: "collector-project-notes-smoke",
  generatedAt: "2026-05-08T00:00:00.000Z"
});
const supportKb = runContextPackCollector({
  collectorId: "support-kb-starter",
  outputDir: smokeRoot,
  packId: "collector-support-kb-smoke",
  generatedAt: "2026-05-08T00:00:00.000Z"
});

for (const result of [blank, markdown, projectNotes, supportKb]) {
  if (!result.validation.valid) {
    fail(`${result.packId} did not validate from collector output.`);
  }
  const validation = validatePack(result.packPath);
  if (!validation.valid) {
    fail(`${result.packId} failed a fresh validation pass.`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(result.packPath, "contextarr-pack.json"), "utf8"));
  if (manifest.visibility !== "private" || manifest.trustLevel !== "unreviewed") {
    fail(`${result.packId} is not private/unreviewed.`);
  }
  const recordFiles = fs.readdirSync(path.join(result.packPath, "records")).filter((file) => file.endsWith(".md"));
  const records = recordFiles.map((file) => fs.readFileSync(path.join(result.packPath, "records", file), "utf8")).join("\n");
  if (!records.includes("never_export") || !records.includes("review_status: draft")) {
    fail(`${result.packId} records are missing draft export safety metadata.`);
  }
}

if (fs.existsSync(path.join(repoRoot, "draft-packs"))) {
  fail("collector smoke must not create the default draft-packs/ root.");
}

console.log("Context Pack collector smoke verified.");
