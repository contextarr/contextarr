import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importToDraftPack } from "@contextarr/importers";
import { getPackExposureReadiness, openDatabase, rebuildIndex } from "@contextarr/server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const smokeRoot = path.join(repoRoot, ".contextarr-cache", "exposure-smoke");
const activePacksDir = path.join(smokeRoot, "active-packs");
const skillsDir = path.join(smokeRoot, "skills");
const importedSkillsDir = path.join(smokeRoot, "imported-skills");
const agentKitsDir = path.join(smokeRoot, "agent-kits");
const demoAgentKitsDir = path.join(smokeRoot, "demo-agent-kits");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function createMarkdownInput(label) {
  const inputDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-exposure-input-"));
  fs.writeFileSync(path.join(inputDir, "note.md"), `# ${label}\n\nPrivate draft exposure smoke note.\n`, "utf8");
  return inputDir;
}

function createActiveDraftPack(packId, name) {
  const inputPath = createMarkdownInput(name);
  try {
    return importToDraftPack({
      inputPath,
      kind: "markdown",
      outputDir: activePacksDir,
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

function hashDirectory(root) {
  const hash = crypto.createHash("sha256");
  for (const file of listFiles(root).sort()) {
    hash.update(path.relative(root, file).replace(/\\/g, "/"));
    hash.update(fs.readFileSync(file));
  }
  return hash.digest("hex");
}

function createConfig(packsDir) {
  return {
    host: "127.0.0.1",
    port: 3210,
    packsDir,
    draftPacksDir: path.join(smokeRoot, "draft-packs"),
    importedPacksDir: path.join(smokeRoot, "imported-packs"),
    composedPacksDir: path.join(smokeRoot, "composed-packs"),
    skillsDir,
    importedSkillsDir,
    agentKitsDir,
    demoAgentKitsDir,
    agentKitTemplatesDir: path.join(smokeRoot, "agent-kit-templates"),
    databasePath: ":memory:",
    localImportsEnabled: false
  };
}

fs.rmSync(smokeRoot, { recursive: true, force: true });
for (const dir of [
  activePacksDir,
  skillsDir,
  importedSkillsDir,
  agentKitsDir,
  demoAgentKitsDir,
  path.join(smokeRoot, "draft-packs"),
  path.join(smokeRoot, "imported-packs"),
  path.join(smokeRoot, "composed-packs"),
  path.join(smokeRoot, "agent-kit-templates")
]) {
  fs.mkdirSync(dir, { recursive: true });
}

const demoDb = openDatabase(":memory:");
rebuildIndex(demoDb, demoPacksDir, [skillsDir, importedSkillsDir], [demoAgentKitsDir, agentKitsDir]);
const demoReadiness = getPackExposureReadiness(demoDb, createConfig(demoPacksDir), "ai-workstation-pack");
if (!demoReadiness) {
  fail("Expected AI Workstation exposure readiness report.");
}
if (
  demoReadiness.summary.recordCount !== 5 ||
  demoReadiness.summary.exportEligibleRecords !== 5 ||
  demoReadiness.summary.mcpEligibleRecords !== 5 ||
  demoReadiness.summary.blockedRecords !== 0 ||
  demoReadiness.summary.exportProfileCount !== 8
) {
  fail(`Unexpected demo exposure summary: ${JSON.stringify(demoReadiness.summary)}`);
}
if (JSON.stringify(demoReadiness).includes(demoPacksDir)) {
  fail("Demo exposure readiness leaked a local absolute pack path.");
}
demoDb.close();

const draftResult = createActiveDraftPack("exposure-smoke-pack", "Exposure Smoke Pack");
const beforeHash = hashDirectory(draftResult.packPath);
const draftDb = openDatabase(":memory:");
const config = createConfig(activePacksDir);
rebuildIndex(draftDb, activePacksDir, [skillsDir, importedSkillsDir], [demoAgentKitsDir, agentKitsDir]);
const draftReadiness = getPackExposureReadiness(draftDb, config, "exposure-smoke-pack");
if (!draftReadiness) {
  fail("Expected draft exposure readiness report.");
}
if (
  draftReadiness.summary.recordCount !== 1 ||
  draftReadiness.summary.exportEligibleRecords !== 0 ||
  draftReadiness.summary.mcpEligibleRecords !== 0 ||
  draftReadiness.summary.blockedRecords !== 1
) {
  fail(`Unexpected draft exposure summary: ${JSON.stringify(draftReadiness.summary)}`);
}
const recordBlockers = new Set(draftReadiness.records[0]?.blockers.map((blocker) => blocker.code));
for (const code of ["record.review_status", "record.privacy.not_public_safe", "record.tag.never_export", "record.tag.imported_draft"]) {
  if (!recordBlockers.has(code)) {
    fail(`Draft exposure readiness did not include blocker ${code}.`);
  }
}
if (hashDirectory(draftResult.packPath) !== beforeHash) {
  fail("Exposure readiness smoke mutated the active draft pack files.");
}
if (JSON.stringify(draftReadiness).includes(smokeRoot)) {
  fail("Draft exposure readiness leaked a local absolute smoke path.");
}
draftDb.close();

console.log("Context Pack exposure readiness smoke verified.");
