import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importToDraftPack } from "@contextarr/importers";
import {
  getPackReviewStatus,
  getReviewItems,
  openDatabase,
  promoteRecordReviewStatus,
  rebuildIndex
} from "@contextarr/server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const smokeRoot = path.join(repoRoot, ".contextarr-cache", "approval-smoke");
const activePacksDir = path.join(smokeRoot, "active-packs");
const draftPacksDir = path.join(smokeRoot, "draft-packs");
const importedPacksDir = path.join(smokeRoot, "imported-packs");
const composedPacksDir = path.join(smokeRoot, "composed-packs");
const skillsDir = path.join(smokeRoot, "skills");
const importedSkillsDir = path.join(smokeRoot, "imported-skills");
const agentKitsDir = path.join(smokeRoot, "agent-kits");
const demoAgentKitsDir = path.join(smokeRoot, "demo-agent-kits");
const agentKitTemplatesDir = path.join(smokeRoot, "agent-kit-templates");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function createMarkdownInput(label) {
  const inputDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-approval-input-"));
  fs.writeFileSync(path.join(inputDir, "note.md"), `# ${label}\n\nPublic-safe explicit approval smoke note.\n`, "utf8");
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

function firstRecordCandidate(status, packId) {
  if (status.packId !== packId || status.records.length !== 1) {
    fail(`Expected one review candidate for ${packId}.`);
  }
  const [candidate] = status.records;
  if (candidate.currentStatus !== "draft") {
    fail(`Expected ${packId} record to start as draft, got ${candidate.currentStatus}.`);
  }
  if (!candidate.promotion?.canPromote) {
    fail(`Expected ${packId} record to be promotable: ${(candidate.promotion?.blockingReasons ?? []).join("; ")}`);
  }
  return candidate;
}

fs.rmSync(smokeRoot, { recursive: true, force: true });
for (const dir of [
  activePacksDir,
  draftPacksDir,
  importedPacksDir,
  composedPacksDir,
  skillsDir,
  importedSkillsDir,
  agentKitsDir,
  demoAgentKitsDir,
  agentKitTemplatesDir
]) {
  fs.mkdirSync(dir, { recursive: true });
}

createActiveDraftPack("approval-smoke-pack", "Approval Smoke Pack");
createActiveDraftPack("approval-blocked-pack", "Approval Blocked Pack");

const config = {
  host: "127.0.0.1",
  port: 3210,
  packsDir: activePacksDir,
  draftPacksDir,
  importedPacksDir,
  composedPacksDir,
  skillsDir,
  importedSkillsDir,
  agentKitsDir,
  demoAgentKitsDir,
  agentKitTemplatesDir,
  databasePath: ":memory:",
  localImportsEnabled: false
};

const db = openDatabase(":memory:");
rebuildIndex(db, activePacksDir, [skillsDir, importedSkillsDir], [demoAgentKitsDir, agentKitsDir]);

const status = getPackReviewStatus(db, config, "approval-smoke-pack");
if (JSON.stringify(status).includes(smokeRoot)) {
  fail("Review status response leaked local absolute root paths.");
}
const candidate = firstRecordCandidate(status, "approval-smoke-pack");
const openReviewItemsBefore = getReviewItems(db, {
  packId: "approval-smoke-pack",
  type: "review_status",
  status: "open"
});
if (openReviewItemsBefore.length !== 1) {
  fail(`Expected one open review_status item before approval, got ${openReviewItemsBefore.length}.`);
}

const promoted = promoteRecordReviewStatus(db, config, "approval-smoke-pack", candidate.id, {
  reviewStatus: "approved",
  expectedHash: candidate.contentHash,
  reviewedAt: "2026-05-09"
});
if (promoted.previousStatus !== "draft" || promoted.reviewStatus !== "approved") {
  fail("Approval promotion did not report draft -> approved.");
}
if (promoted.record?.reviewStatus !== "approved" || promoted.record?.lastReviewed !== "2026-05-09") {
  fail("Updated record did not carry approved review metadata.");
}
if (promoted.exportReady !== false || promoted.mcpReady !== false) {
  fail("Approval promotion incorrectly exposed draft/private/never_export content.");
}
if (!promoted.warnings.some((warning) => warning.includes("Draft-blocking tags remain"))) {
  fail("Approval promotion did not warn that draft-blocking tags still block export/MCP exposure.");
}
if (promoted.rescan.packsIndexed !== 2 || promoted.rescan.packsSkipped !== 0) {
  fail("Approval promotion did not rebuild a clean active pack index.");
}

const openReviewItemsAfter = getReviewItems(db, {
  packId: "approval-smoke-pack",
  type: "review_status",
  status: "open"
});
if (openReviewItemsAfter.length !== 0) {
  fail("Open review_status item remained after file-backed approval promotion.");
}

const activePackPath = path.join(activePacksDir, "approval-smoke-pack");
const copiedRecordText = listFiles(path.join(activePackPath, "records"))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
if (
  !copiedRecordText.includes("review_status: approved") ||
  !copiedRecordText.includes("last_reviewed: 2026-05-09") ||
  !copiedRecordText.includes("privacy: private") ||
  !copiedRecordText.includes("never_export")
) {
  fail("Approved record file did not preserve expected review/private/draft-blocking metadata.");
}

let staleHashBlocked = false;
try {
  promoteRecordReviewStatus(db, config, "approval-smoke-pack", candidate.id, {
    reviewStatus: "needs_review",
    expectedHash: candidate.contentHash,
    reviewedAt: "2026-05-09"
  });
} catch (error) {
  staleHashBlocked = error?.code === "record.hash_mismatch";
}
if (!staleHashBlocked) {
  fail("Stale content hash did not block review status promotion.");
}

const blockedStatus = getPackReviewStatus(db, config, "approval-blocked-pack");
const blockedCandidate = firstRecordCandidate(blockedStatus, "approval-blocked-pack");
fs.writeFileSync(path.join(activePacksDir, "approval-blocked-pack", "unsafe.ps1"), "Write-Host unsafe\n", "utf8");
let scannerBlocked = false;
try {
  promoteRecordReviewStatus(db, config, "approval-blocked-pack", blockedCandidate.id, {
    reviewStatus: "approved",
    expectedHash: blockedCandidate.contentHash,
    reviewedAt: "2026-05-09"
  });
} catch (error) {
  scannerBlocked = error?.code === "review.promotion_blocked" && !JSON.stringify(error).includes(smokeRoot);
}
if (!scannerBlocked) {
  fail("Scanner-blocked active pack was not rejected without leaking local paths.");
}

console.log("Context Pack approval promotion smoke verified.");
