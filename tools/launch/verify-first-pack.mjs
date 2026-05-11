import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  listContextPackCollectors,
  previewContextPackCollector,
  runContextPackCollector
} from "@contextarr/collectors";
import { buildPackExports } from "@contextarr/export-profiles";
import { importToDraftPack } from "@contextarr/importers";
import { validatePack } from "@contextarr/pack-validator";
import {
  dryRunReviewCandidateActivation,
  getReviewCandidate,
  getReviewCandidateActivationPlan,
  listReviewCandidates
} from "@contextarr/review-candidates";
import {
  getPack,
  getPacks,
  openDatabase,
  rebuildIndex,
  searchIndex
} from "@contextarr/server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const smokeRoot = path.join(repoRoot, ".contextarr-cache", "first-pack-verify");
const draftPacksDir = path.join(smokeRoot, "draft-packs");
const importedPacksDir = path.join(smokeRoot, "imported-packs");
const activeDataDir = path.join(smokeRoot, "data");
const databasePath = path.join(activeDataDir, "contextarr.db");
const markdownFixture = path.join(repoRoot, "packages", "importers", "test", "fixtures", "markdown-folder");
const activationFixture = path.join(repoRoot, "packages", "pack-validator", "test", "fixtures", "valid-minimal-pack");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const generatedAt = "2026-05-11T00:00:00.000Z";

const supportDraftId = "first-pack-support-kb-draft";
const markdownDraftId = "first-pack-markdown-import-draft";
const readyDraftId = "first-pack-ready-draft";
const readyRecordId = `${readyDraftId}.overview`;
const readySourceId = `${readyDraftId}.source.manual`;
const hiddenReadyBody = "This first-pack verification body must not appear in default exports before activation.";

function assertInsideRepo(targetPath) {
  const resolved = path.resolve(targetPath);
  const relative = path.relative(repoRoot, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to operate outside repo: ${resolved}`);
  }
  return resolved;
}

function resetSmokeRoot() {
  assertInsideRepo(smokeRoot);
  fs.rmSync(smokeRoot, { recursive: true, force: true });
  fs.mkdirSync(draftPacksDir, { recursive: true });
  fs.mkdirSync(importedPacksDir, { recursive: true });
  fs.mkdirSync(activeDataDir, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeMarkdownRecord(filePath, frontmatter, body) {
  fs.writeFileSync(filePath, `---\n${renderSimpleYaml(frontmatter)}---\n\n${body.trim()}\n`, "utf8");
}

function renderSimpleYaml(value) {
  const lines = [];
  for (const [key, item] of Object.entries(value)) {
    if (Array.isArray(item)) {
      lines.push(`${key}:`);
      for (const entry of item) {
        lines.push(`  - ${entry}`);
      }
      continue;
    }
    lines.push(`${key}: ${item}`);
  }
  return `${lines.join("\n")}\n`;
}

function hasAbsoluteLocalPath(value) {
  return (
    /[A-Za-z]:[\\/]/.test(value) ||
    value.includes(repoRoot) ||
    /(^|[\s"'])\/(?:Users|home|tmp|var|mnt|Volumes|opt)\//.test(value)
  );
}

function createReviewReadyDraftCandidate() {
  const candidatePath = path.join(draftPacksDir, readyDraftId);
  fs.cpSync(activationFixture, candidatePath, { recursive: true });

  const manifestPath = path.join(candidatePath, "contextarr-pack.json");
  const manifest = readJson(manifestPath);
  writeJson(manifestPath, {
    ...manifest,
    id: readyDraftId,
    name: "First-Pack Ready Draft",
    version: "0.0.0-draft",
    description: "Fixture-backed draft candidate used by the local first-pack adoption verifier.",
    type: "imported_draft",
    visibility: "private",
    trustLevel: "unreviewed",
    author: "Contextarr First-Pack Verifier",
    license: "UNLICENSED",
    createdAt: generatedAt,
    updatedAt: generatedAt,
    lastReviewedAt: null,
    containsPersonalData: true,
    containsExecutableCode: false,
    requiresNetwork: false,
    permissions: {
      readVault: false,
      writeDrafts: false,
      runCommands: false,
      networkAccess: false
    },
    assets: {
      accentColor: "#38BDF8"
    }
  });

  const recordPath = path.join(candidatePath, "records", "overview.md");
  writeMarkdownRecord(
    recordPath,
    {
      id: readyRecordId,
      title: "First-Pack Ready Draft Overview",
      type: "summary",
      pack: readyDraftId,
      tags: ["first_pack_verify", "imported_draft", "never_export"],
      confidence: "unknown",
      source_status: "imported",
      freshness: "unknown",
      privacy: "private",
      sources: [readySourceId],
      review_status: "draft"
    },
    `# First-Pack Ready Draft Overview\n\n${hiddenReadyBody}`
  );

  const sourcesPath = path.join(candidatePath, "sources", "sources.yaml");
  fs.writeFileSync(
    sourcesPath,
    [
      "sources:",
      `  - id: ${readySourceId}`,
      "    type: markdown",
      "    title: First-pack verifier fixture source",
      "    path: fixtures/first-pack-ready-draft.md",
      "    license: UNLICENSED",
      "    license_status: unknown",
      "    trust: unreviewed",
      "    status: unknown",
      ""
    ].join("\n"),
    "utf8"
  );

  const exportPath = path.join(candidatePath, "exports", "codex.yaml");
  fs.writeFileSync(
    exportPath,
    [
      "id: codex-context",
      "name: Codex Context",
      "target: codex",
      "format: markdown",
      "privacy_mode: redacted",
      "include:",
      "  records:",
      `    - ${readyRecordId}`,
      "exclude_tags:",
      "  - secret",
      "  - never_export",
      "  - imported_draft",
      "token_budget: 8000",
      "sections:",
      "  - summary",
      "  - sources",
      ""
    ].join("\n"),
    "utf8"
  );

  const validation = validatePack(candidatePath);
  assert.equal(validation.valid, true, "fixture-backed first-pack draft should validate");
  return candidatePath;
}

function findCandidate(candidates, packId) {
  const candidate = candidates.find((item) => item.packId === packId);
  assert.ok(candidate, `Draft Intake did not list candidate ${packId}`);
  return candidate;
}

function assertNoDefaultExposure(db, packIds, readyCandidatePath) {
  for (const packId of packIds) {
    assert.equal(getPack(db, packId), undefined, `${packId} should not be indexed before activation`);
  }

  const searchResults = searchIndex(db, "first-pack", "all");
  const serializedSearch = JSON.stringify(searchResults);
  for (const packId of packIds) {
    assert.equal(serializedSearch.includes(packId), false, `${packId} leaked into active search results before activation`);
  }

  const directArtifacts = buildPackExports({ packPath: readyCandidatePath, generatedAt });
  assert.ok(directArtifacts.length > 0, "fixture-backed draft should have an export profile for default exposure checks");
  for (const artifact of directArtifacts) {
    assert.equal(
      artifact.includedRecords.some((record) => record.id === readyRecordId),
      false,
      "draft/private/never_export record should not be included in default export artifacts"
    );
    assert.equal(artifact.content.includes(hiddenReadyBody), false, "default export content leaked draft body text");
    assert.ok(
      artifact.excludedRecords.some((record) => record.id === readyRecordId),
      "default export should explain that the draft record was excluded"
    );
  }
}

resetSmokeRoot();

const collectors = listContextPackCollectors();
assert.deepEqual(
  collectors.map((collector) => collector.id).sort(),
  ["blank-pack-starter", "markdown-folder", "project-notes", "support-kb-starter"].sort(),
  "first-pack starter collector list changed unexpectedly"
);

const supportPreview = previewContextPackCollector({
  collectorId: "support-kb-starter",
  packId: supportDraftId,
  name: "First Pack Support KB Draft"
});
assert.equal(supportPreview.packId, supportDraftId, "support starter preview should honor the selected draft id");
assert.equal(supportPreview.records.length, 4, "support starter preview should show the four first-pack starter records");
assert.ok(
  supportPreview.records.every((record) => record.tags.includes("imported_draft") && record.tags.includes("never_export")),
  "support starter preview should mark records as draft and never-export"
);

const supportDraft = runContextPackCollector({
  collectorId: "support-kb-starter",
  outputDir: draftPacksDir,
  packId: supportDraftId,
  name: "First Pack Support KB Draft",
  overwrite: true,
  generatedAt
});
assert.equal(supportDraft.validation.valid, true, "support starter collector draft should validate");

const markdownDraft = importToDraftPack({
  inputPath: markdownFixture,
  kind: "markdown",
  outputDir: importedPacksDir,
  packId: markdownDraftId,
  name: "First Pack Markdown Import Draft",
  overwrite: true,
  generatedAt
});
assert.equal(markdownDraft.validation.valid, true, "Markdown fixture import draft should validate");

const readyDraftPath = createReviewReadyDraftCandidate();

const db = openDatabase(databasePath);
try {
  const indexResult = rebuildIndex(db, demoPacksDir, [], []);
  assert.equal(indexResult.packsIndexed, 15, "active demo index should contain the 15 public-safe demo packs");
  assert.equal(
    getPacks(db).filter((pack) => pack.starterPack).length,
    12,
    "active demo index should expose 12 curated starter packs for selection"
  );

  const roots = [
    { rootPath: draftPacksDir, sourceKind: "draft_pack", label: "draft-packs" },
    { rootPath: importedPacksDir, sourceKind: "imported_pack", label: "imported-packs" }
  ];
  const activePackIds = getPacks(db).map((pack) => pack.id);
  const intake = listReviewCandidates({
    roots,
    activePackIds,
    displayRoot: repoRoot
  });
  assert.equal(intake.counts.total, 3, "Draft Intake should show the two generated drafts plus the fixture-backed candidate");
  assert.equal(intake.counts.readyForReview, 3, "all first-pack smoke candidates should be ready for human review listing");
  assert.equal(intake.skippedRoots.length, 0, "Draft Intake should not skip first-pack smoke roots");
  assert.equal(hasAbsoluteLocalPath(JSON.stringify(intake)), false, "Draft Intake output should not leak absolute local paths");

  const supportCandidate = findCandidate(intake.candidates, supportDraftId);
  const markdownCandidate = findCandidate(intake.candidates, markdownDraftId);
  const readyCandidate = findCandidate(intake.candidates, readyDraftId);
  assert.equal(supportCandidate.sourceKind, "draft_pack", "collector draft should appear as a draft_pack candidate");
  assert.equal(markdownCandidate.sourceKind, "imported_pack", "imported draft should appear as an imported_pack candidate");

  const readyDetail = getReviewCandidate({
    roots,
    activePackIds,
    displayRoot: repoRoot,
    key: readyCandidate.key
  });
  assert.ok(readyDetail, "fixture-backed candidate detail should be visible in Draft Intake");
  assert.equal(readyDetail.records[0]?.reviewStatus, "draft", "Draft Intake detail should show draft review status");
  assert.equal(readyDetail.records[0]?.privacy, "private", "Draft Intake detail should show private draft privacy");
  assert.deepEqual(readyDetail.records[0]?.tags.sort(), ["first_pack_verify", "imported_draft", "never_export"].sort());

  const readyPlan = getReviewCandidateActivationPlan({
    roots,
    activePackIds,
    displayRoot: repoRoot,
    activePacksRoot: path.join(smokeRoot, "active-packs"),
    key: readyCandidate.key
  });
  assert.ok(readyPlan, "activation plan should be available for fixture-backed candidate");
  assert.equal(readyPlan.schemaVersion, "contextarr.review-candidate-activation-plan.v1");
  assert.equal(readyPlan.canActivate, true, "fixture-backed candidate should be filesystem-ready for activation dry-run proof");
  assert.equal(readyPlan.status, "ready", "fixture-backed activation plan should report ready");

  const readyDryRun = dryRunReviewCandidateActivation({
    roots,
    activePackIds,
    displayRoot: repoRoot,
    activePacksRoot: path.join(smokeRoot, "active-packs"),
    key: readyCandidate.key,
    now: new Date(generatedAt)
  });
  assert.ok(readyDryRun, "activation dry-run proof should be available for fixture-backed candidate");
  assert.equal(readyDryRun.schemaVersion, "contextarr.review-candidate-activation-dry-run.v1");
  assert.equal(readyDryRun.canActivate, true, "fixture-backed activation dry-run should be ready");
  assert.deepEqual(readyDryRun.effects, {
    filesMoved: false,
    sqliteMutated: false,
    exportsGenerated: false,
    mcpExposed: false,
    networkAccessed: false
  });

  const supportPlan = getReviewCandidateActivationPlan({
    roots,
    activePackIds,
    displayRoot: repoRoot,
    activePacksRoot: path.join(smokeRoot, "active-packs"),
    key: supportCandidate.key
  });
  assert.ok(supportPlan, "activation plan should be available for generated collector draft");
  assert.ok(
    supportPlan.blockers.some((blocker) => blocker.code === "candidate.no_export_profiles") || supportPlan.canActivate,
    "generated collector draft should either be ready or explain the current missing export-profile gap"
  );

  const supportDryRun = dryRunReviewCandidateActivation({
    roots,
    activePackIds,
    displayRoot: repoRoot,
    activePacksRoot: path.join(smokeRoot, "active-packs"),
    key: supportCandidate.key,
    now: new Date(generatedAt)
  });
  assert.ok(supportDryRun, "activation dry-run should be available for generated collector draft");
  assert.equal(supportDryRun.effects.filesMoved, false, "collector draft dry-run must not move files");
  assert.equal(supportDryRun.effects.sqliteMutated, false, "collector draft dry-run must not mutate SQLite");
  assert.equal(supportDryRun.effects.exportsGenerated, false, "collector draft dry-run must not generate exports");
  assert.equal(supportDryRun.effects.mcpExposed, false, "collector draft dry-run must not expose MCP records");
  assert.equal(supportDryRun.effects.networkAccessed, false, "collector draft dry-run must not access the network");

  assertNoDefaultExposure(db, [supportDraftId, markdownDraftId, readyDraftId], readyDraftPath);
} finally {
  db.close();
}

console.log("Contextarr first-pack verifier passed.");
console.log(`- Starter selection: ${collectors.length} local collectors and 12 curated active starter packs verified.`);
console.log(`- Draft creation: collector draft ${supportDraftId} and import draft ${markdownDraftId} created under .contextarr-cache/first-pack-verify/.`);
console.log("- Draft Intake: generated drafts plus a fixture-backed activation candidate are visible with sanitized labels.");
console.log("- Activation: fixture-backed candidate has deterministic activation plan and dry-run proof; generated drafts dry-run without moving files.");
console.log("- Non-exposure: first-pack drafts are absent from active index/search and default export content before activation.");
