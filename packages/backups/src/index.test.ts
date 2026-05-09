import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  BackupError,
  createContextPackBackup,
  restoreContextPackBackup,
  type ContextPackBackupManifest,
  type RestoreReport
} from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const fixturesDir = path.join(repoRoot, "packages/pack-validator/test/fixtures");
const tempDirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-backups-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("@contextarr/backups", () => {
  it("creates an inspectable Context Pack backup with checksums and validation metadata", () => {
    const outDir = tempDir();
    const result = createContextPackBackup({
      packsDir: demoPacksDir,
      outputDir: outDir,
      backupId: "unit-backup",
      createdAt: "2026-05-08T00:00:00.000Z",
      currentDate: "2026-05-08T00:00:00.000Z"
    });

    expect(result).toMatchObject({
      backupId: "unit-backup",
      packCount: 5,
      validationErrors: 0,
      validationWarnings: 0
    });
    expect(fs.existsSync(result.manifestPath)).toBe(true);
    expect(fs.existsSync(result.manifestSha256Path)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(result.manifestPath, "utf8")) as ContextPackBackupManifest;
    expect(manifest).toMatchObject({
      schemaVersion: "contextarr.backup.v1",
      objectType: "context-packs",
      sqliteIncluded: false,
      activation: {
        restoreMode: "quarantine_review",
        requiresValidationBeforeActivation: true,
        automaticActivation: false
      },
      summary: {
        packCount: 5,
        validationErrors: 0,
        validationWarnings: 0
      }
    });
    expect(manifest.packs.map((pack) => pack.packId)).toContain("ai-workstation-pack");
    expect(manifest.packs.every((pack) => pack.files.some((file) => file.path === "contextarr-pack.json"))).toBe(true);
    expect(manifest.packs.every((pack) => /^[a-f0-9]{64}$/.test(pack.manifestSha256))).toBe(true);
  });

  it("restores a backup into quarantine and validates restored packs before activation", () => {
    const outDir = tempDir();
    const restoreDir = tempDir();
    const backup = createContextPackBackup({
      packsDir: demoPacksDir,
      outputDir: outDir,
      backupId: "unit-restore",
      createdAt: "2026-05-08T00:00:00.000Z",
      currentDate: "2026-05-08T00:00:00.000Z"
    });

    const restore = restoreContextPackBackup({
      backupPath: backup.backupPath,
      outputDir: restoreDir,
      restoredAt: "2026-05-08T00:01:00.000Z",
      currentDate: "2026-05-08T00:01:00.000Z"
    });

    expect(restore).toMatchObject({
      backupId: "unit-restore",
      status: "restored_to_quarantine",
      packCount: 5,
      validationErrors: 0,
      validationWarnings: 0
    });
    expect(fs.existsSync(path.join(restore.outputPath, "ai-workstation-pack", "contextarr-pack.json"))).toBe(true);

    const report = JSON.parse(fs.readFileSync(restore.reportPath, "utf8")) as RestoreReport;
    expect(report).toMatchObject({
      schemaVersion: "contextarr.restore-report.v1",
      status: "restored_to_quarantine",
      activation: {
        automaticActivation: false,
        requiresManualReview: true
      }
    });
    expect(report.packs.every((pack) => pack.checksumStatus === "verified")).toBe(true);
    expect(report.packs.every((pack) => pack.quarantineStatus === "review_required")).toBe(true);
  });

  it("refuses to back up invalid packs", () => {
    expect(() =>
      createContextPackBackup({
        packsDir: path.join(fixturesDir, "invalid-permissions-pack"),
        outputDir: tempDir(),
        backupId: "invalid-pack",
        currentDate: "2026-05-08T00:00:00.000Z"
      })
    ).toThrow(BackupError);
  });

  it("refuses to restore tampered backup files", () => {
    const outDir = tempDir();
    const restoreDir = tempDir();
    const backup = createContextPackBackup({
      packsDir: path.join(demoPacksDir, "ai-workstation-pack"),
      outputDir: outDir,
      backupId: "tamper-backup",
      createdAt: "2026-05-08T00:00:00.000Z",
      currentDate: "2026-05-08T00:00:00.000Z"
    });

    const tamperedRecord = path.join(
      backup.backupPath,
      "packs",
      "ai-workstation-pack",
      "records",
      "local-ai-stack.md"
    );
    fs.appendFileSync(tamperedRecord, "\nTampered after backup.\n", "utf8");

    expect(() =>
      restoreContextPackBackup({
        backupPath: backup.backupPath,
        outputDir: restoreDir,
        restoredAt: "2026-05-08T00:01:00.000Z",
        currentDate: "2026-05-08T00:01:00.000Z"
      })
    ).toThrow(/Checksum mismatch/);
    expect(fs.existsSync(path.join(restoreDir, "tamper-backup"))).toBe(false);
  });

  it("does not overwrite existing backup or restore output", () => {
    const outDir = tempDir();
    const backup = createContextPackBackup({
      packsDir: path.join(demoPacksDir, "ai-workstation-pack"),
      outputDir: outDir,
      backupId: "no-overwrite",
      createdAt: "2026-05-08T00:00:00.000Z",
      currentDate: "2026-05-08T00:00:00.000Z"
    });

    expect(() =>
      createContextPackBackup({
        packsDir: path.join(demoPacksDir, "ai-workstation-pack"),
        outputDir: outDir,
        backupId: "no-overwrite",
        createdAt: "2026-05-08T00:00:00.000Z",
        currentDate: "2026-05-08T00:00:00.000Z"
      })
    ).toThrow(/already exists/);

    const restoreDir = tempDir();
    restoreContextPackBackup({
      backupPath: backup.backupPath,
      outputDir: restoreDir,
      restoredAt: "2026-05-08T00:01:00.000Z",
      currentDate: "2026-05-08T00:01:00.000Z"
    });
    expect(() =>
      restoreContextPackBackup({
        backupPath: backup.backupPath,
        outputDir: restoreDir,
        restoredAt: "2026-05-08T00:02:00.000Z",
        currentDate: "2026-05-08T00:02:00.000Z"
      })
    ).toThrow(/already exists/);
  });
});
