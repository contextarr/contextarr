import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPackExports } from "@contextarr/export-profiles";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const generatedAt = "2026-05-10T00:00:00.000Z";

const expectedStarterCount = 12;
const expectedProfileCount = 8;
const expectedTargets = new Set(["agents_md", "chatgpt", "claude", "claude_md", "codex", "generic_markdown", "json", "llms_txt"]);
const blockedTags = new Set(["secret", "never_export", "imported_draft"]);

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listPackDirs() {
  return fs
    .readdirSync(demoPacksDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(demoPacksDir, entry.name))
    .sort();
}

function hasLocalPath(value) {
  return (
    value.includes(repoRoot) ||
    /[A-Za-z]:[\\/]/.test(value) ||
    /(^|[\s"'])\/(?:Users|home|tmp|var|mnt|Volumes|opt)\//.test(value)
  );
}

function checkArtifact(packId, artifact) {
  const serialized = JSON.stringify(artifact);

  if (hasLocalPath(serialized)) {
    fail(`${packId}/${artifact.profileId} leaked a local absolute path.`);
  }

  if (artifact.excludedRecords.length !== 0) {
    fail(`${packId}/${artifact.profileId} excluded starter records unexpectedly.`);
  }

  for (const record of artifact.includedRecords) {
    if (record.privacy !== "public_safe") {
      fail(`${packId}/${artifact.profileId} included non-public record ${record.id}.`);
    }

    const tags = Array.isArray(record.tags) ? record.tags : [];
    for (const tag of tags) {
      if (blockedTags.has(tag)) {
        fail(`${packId}/${artifact.profileId} included blocked tag ${tag} on ${record.id}.`);
      }
    }
  }

  for (const warning of artifact.warnings) {
    if (!warning.code || !warning.message) {
      fail(`${packId}/${artifact.profileId} has malformed warning metadata.`);
    }
    if (hasLocalPath(JSON.stringify(warning))) {
      fail(`${packId}/${artifact.profileId} warning metadata leaked a local path.`);
    }
  }
}

const starterPacks = listPackDirs()
  .map((packPath) => ({
    packPath,
    manifest: readJson(path.join(packPath, "contextarr-pack.json"))
  }))
  .filter(({ manifest }) => manifest.starterPack === true)
  .sort((left, right) => left.manifest.id.localeCompare(right.manifest.id));

if (starterPacks.length !== expectedStarterCount) {
  fail(`Expected ${expectedStarterCount} starter Context Packs; found ${starterPacks.length}.`);
}

for (const { packPath, manifest } of starterPacks) {
  const first = buildPackExports({ packPath, generatedAt });
  const second = buildPackExports({ packPath, generatedAt });

  try {
    assert.deepStrictEqual(second, first);
  } catch (error) {
    fail(`${manifest.id} export artifacts are not deterministic: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (first.length !== expectedProfileCount) {
    fail(`${manifest.id} should export ${expectedProfileCount} canonical profiles; found ${first.length}.`);
  }

  const targets = new Set(first.map((artifact) => artifact.target));
  for (const target of expectedTargets) {
    if (!targets.has(target)) {
      fail(`${manifest.id} is missing canonical export target: ${target}.`);
    }
  }

  for (const artifact of first) {
    checkArtifact(manifest.id, artifact);
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`Starter export determinism verified for ${starterPacks.length} Context Packs.`);
}
