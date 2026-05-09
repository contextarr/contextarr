import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importToDraftPack } from "@contextarr/importers";
import { validatePack } from "@contextarr/pack-validator";
import {
  activateContextPackDraft,
  getContextPackDraft,
  listContextPackDrafts
} from "@contextarr/server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const smokeRoot = path.join(repoRoot, ".contextarr-cache", "draft-review-smoke");
const activePacksDir = path.join(smokeRoot, "active-packs");
const draftPacksDir = path.join(smokeRoot, "draft-packs");
const importedPacksDir = path.join(smokeRoot, "imported-packs");
const composedPacksDir = path.join(smokeRoot, "composed-packs");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function createMarkdownInput(label) {
  const inputDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-draft-review-input-"));
  fs.writeFileSync(path.join(inputDir, "note.md"), `# ${label}\n\nPublic-safe draft review smoke note.\n`, "utf8");
  return inputDir;
}

function createDraft(outputDir, packId, name) {
  const inputPath = createMarkdownInput(name);
  try {
    return importToDraftPack({
      inputPath,
      kind: "markdown",
      outputDir,
      packId,
      name,
      overwrite: true,
      generatedAt: "2026-05-09T00:00:00.000Z"
    });
  } finally {
    fs.rmSync(inputPath, { recursive: true, force: true });
  }
}

function listFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

fs.rmSync(smokeRoot, { recursive: true, force: true });
for (const dir of [activePacksDir, draftPacksDir, importedPacksDir, composedPacksDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

createDraft(draftPacksDir, "draft-review-collector-smoke", "Draft Review Collector Smoke");
createDraft(importedPacksDir, "draft-review-imported-smoke", "Draft Review Imported Smoke");
createDraft(composedPacksDir, "draft-review-composed-smoke", "Draft Review Composed Smoke");

const config = {
  packsDir: activePacksDir,
  draftPacksDir,
  importedPacksDir,
  composedPacksDir
};

const drafts = listContextPackDrafts(config);
if (drafts.length !== 3) {
  fail(`Expected 3 draft packs, found ${drafts.length}.`);
}
if (new Set(drafts.map((draft) => draft.sourceType)).size !== 3) {
  fail("Draft inventory did not include collector, imported, and composed roots.");
}
if (JSON.stringify(drafts).includes(smokeRoot)) {
  fail("Draft inventory leaked local absolute root paths.");
}

const imported = drafts.find((draft) => draft.packId === "draft-review-imported-smoke");
if (!imported) {
  fail("Imported draft was not discovered.");
}
if (!imported.activation.canActivate) {
  fail(`Imported draft should be activatable: ${imported.activation.blockingReasons.join("; ")}`);
}

const detail = getContextPackDraft(config, imported.id);
if (!detail || detail.records.length !== 1) {
  fail("Draft detail did not include the expected record summary.");
}
if (detail.records[0].reviewStatus !== "draft" || detail.records[0].privacy !== "private") {
  fail("Draft detail did not preserve private draft record metadata.");
}

const activation = activateContextPackDraft(config, imported.id, { expectedHash: imported.contentHash });
if (!activation.activated || activation.activated.indexed !== false || activation.activated.approvalChanged !== false) {
  fail("Activation result did not preserve review-only activation flags.");
}
if (activation.activated.exportReady !== false || activation.activated.mcpReady !== false) {
  fail("Activation result incorrectly exposed export or MCP readiness.");
}

const activePackPath = path.join(activePacksDir, "draft-review-imported-smoke");
if (!fs.existsSync(path.join(activePackPath, "contextarr-pack.json"))) {
  fail("Activation did not copy the draft into the active packs root.");
}
const validation = validatePack(activePackPath);
if (validation.summary.errors !== 0) {
  fail("Activated draft copy does not validate.");
}
const copiedRecordText = listFiles(path.join(activePackPath, "records"))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
if (!copiedRecordText.includes("review_status: draft") || !copiedRecordText.includes("privacy: private") || !copiedRecordText.includes("never_export")) {
  fail("Activated draft copy lost draft/private/never_export record metadata.");
}

let duplicateBlocked = false;
try {
  activateContextPackDraft(config, imported.id, { expectedHash: imported.contentHash });
} catch (error) {
  duplicateBlocked = error?.code === "active_pack.exists";
}
if (!duplicateBlocked) {
  fail("Duplicate activation was not blocked.");
}

console.log("Context Pack draft review activation smoke verified.");
