import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const smokeRoot = path.join(repoRoot, ".contextarr-cache", "backup-smoke");

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function assertInsideRepo(targetPath) {
  const resolved = path.resolve(targetPath);
  const relative = path.relative(repoRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to operate outside repo: ${resolved}`);
  }
  return resolved;
}

function prepare() {
  const resolved = assertInsideRepo(smokeRoot);
  fs.rmSync(resolved, { recursive: true, force: true });
  fs.mkdirSync(resolved, { recursive: true });
  console.log("Contextarr backup smoke workspace prepared.");
}

function check() {
  const requiredFiles = ["docs/backups.md", "docs/restore.md"];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(repoRoot, file))) {
      fail(`Missing backup doc: ${file}`);
    }
  }

  const readme = read("README.md");
  for (const link of requiredFiles) {
    if (!readme.includes(link)) {
      fail(`README is missing backup doc link: ${link}`);
    }
  }

  const packageJson = JSON.parse(read("package.json"));
  const backupScript = packageJson.scripts?.["backup:verify"] ?? "";
  const releaseScript = packageJson.scripts?.["release:verify"] ?? "";
  if (!backupScript.includes("contextarr backup demo-packs")) {
    fail("backup:verify must run a demo-packs backup smoke.");
  }
  if (!backupScript.includes("contextarr restore .contextarr-cache/backup-smoke/backups/backup-smoke")) {
    fail("backup:verify must run a restore smoke from the generated backup.");
  }
  if (!releaseScript.includes("pnpm backup:verify")) {
    fail("release:verify must include backup:verify.");
  }

  const backupManifestPath = path.join(smokeRoot, "backups", "backup-smoke", "contextarr-backup.json");
  const checksumPath = path.join(smokeRoot, "backups", "backup-smoke", "contextarr-backup.sha256");
  const restoreReportPath = path.join(smokeRoot, "restored", "backup-smoke", "restore-report.json");
  for (const file of [backupManifestPath, checksumPath, restoreReportPath]) {
    if (!fs.existsSync(file)) {
      fail(`Missing backup smoke artifact: ${path.relative(repoRoot, file).replace(/\\/g, "/")}`);
    }
  }

  if (fs.existsSync(backupManifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(backupManifestPath, "utf8"));
    if (manifest.schemaVersion !== "contextarr.backup.v1") {
      fail("Backup smoke manifest has the wrong schema version.");
    }
    if (manifest.summary?.packCount !== 5) {
      fail(`Expected backup smoke packCount=5, got ${manifest.summary?.packCount}.`);
    }
    if (manifest.summary?.validationErrors !== 0 || manifest.summary?.validationWarnings !== 0) {
      fail("Backup smoke manifest must have zero validation errors and warnings.");
    }
    if (manifest.sqliteIncluded !== false || manifest.activation?.automaticActivation !== false) {
      fail("Backup manifest must exclude SQLite and disable automatic activation.");
    }
  }

  if (fs.existsSync(restoreReportPath)) {
    const report = JSON.parse(fs.readFileSync(restoreReportPath, "utf8"));
    if (report.schemaVersion !== "contextarr.restore-report.v1") {
      fail("Restore smoke report has the wrong schema version.");
    }
    if (report.status !== "restored_to_quarantine") {
      fail(`Expected restored_to_quarantine, got ${report.status}.`);
    }
    if (report.summary?.packCount !== 5 || report.summary?.validationErrors !== 0) {
      fail("Restore smoke report must include five valid demo packs.");
    }
    if (report.summary?.scannerBlocked !== 0) {
      fail(`Restore smoke report must have zero scanner-blocked packs, got ${report.summary?.scannerBlocked}.`);
    }
    for (const pack of report.packs ?? []) {
      if (pack.quarantineStatus !== "review_required") {
        fail(`Restored pack ${pack.packId ?? "(unknown)"} must remain in review_required quarantine.`);
      }
      if (pack.securityScan?.status !== "policy_clean") {
        fail(`Restored pack ${pack.packId ?? "(unknown)"} must have a policy_clean security scan.`);
      }
      if (pack.securityScan?.recommendedAction !== "quarantine") {
        fail(`Restored pack ${pack.packId ?? "(unknown)"} must keep quarantine as the scanner action.`);
      }
    }
    if (report.activation?.automaticActivation !== false || report.activation?.requiresManualReview !== true) {
      fail("Restore report must require manual review and avoid automatic activation.");
    }
  }

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log("Contextarr backup/restore verification passed.");
  }
}

function validateRestored() {
  const restoredPath = ".contextarr-cache/backup-smoke/restored/backup-smoke";
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "apps/cli/src/index.ts", "validate", restoredPath, "--json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      shell: false
    }
  );

  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");

  if (result.status !== 1) {
    fail(`Expected restored quarantine validation to exit 1, got ${result.status}.`);
  }

  let report;
  try {
    const jsonStart = result.stdout.indexOf("{");
    const jsonEnd = result.stdout.lastIndexOf("}");
    report = JSON.parse(result.stdout.slice(jsonStart, jsonEnd + 1));
  } catch {
    fail("Restored quarantine validation did not emit parseable JSON.");
    report = undefined;
  }

  if (report) {
    if (report.valid !== false) {
      fail("Restored quarantine validation must report valid=false until manual review.");
    }

    const results = Array.isArray(report.results) ? report.results : [report];
    if (results.length !== 5) {
      fail(`Expected restored quarantine validation to include five packs, got ${results.length}.`);
    }

    for (const pack of results) {
      if (pack.valid !== false) {
        fail(`Restored pack ${pack.packId ?? "(unknown)"} must not be activation-valid before manual review.`);
      }
      if (pack.securityScan?.status !== "policy_clean") {
        fail(`Restored pack ${pack.packId ?? "(unknown)"} must remain policy_clean in validation.`);
      }
      if (pack.securityScan?.recommendedAction !== "quarantine") {
        fail(`Restored pack ${pack.packId ?? "(unknown)"} must validate with quarantine as the scanner action.`);
      }
      if (pack.securityGate?.status !== "review" || pack.securityGate?.recommendedAction !== "quarantine") {
        fail(`Restored pack ${pack.packId ?? "(unknown)"} must require securityGate review/quarantine.`);
      }
    }
  }

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log("Contextarr restored backup validation gate verified.");
  }
}

const mode = process.argv[2] ?? "check";
if (mode === "prepare") {
  prepare();
} else if (mode === "validate-restored") {
  validateRestored();
} else if (mode === "check") {
  check();
} else {
  console.error("Usage: node tools/launch/verify-backups.mjs prepare|validate-restored|check");
  process.exitCode = 2;
}
