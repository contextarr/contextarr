import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { toValidationReportV1, validatePack, type ValidationReportV1, type ValidationResult } from "@contextarr/pack-validator";

export const BACKUP_SCHEMA_VERSION = "contextarr.backup.v1";
export const RESTORE_REPORT_SCHEMA_VERSION = "contextarr.restore-report.v1";

export interface CreateContextPackBackupOptions {
  packsDir: string;
  outputDir: string;
  backupId?: string;
  createdAt?: string;
  currentDate?: string | Date;
}

export interface RestoreContextPackBackupOptions {
  backupPath: string;
  outputDir: string;
  restoredAt?: string;
  currentDate?: string | Date;
}

export interface BackupFileEntry {
  path: string;
  sizeBytes: number;
  sha256: string;
}

export interface BackupPackEntry {
  packId: string;
  name: string;
  version: string;
  description: string;
  sourcePath: string;
  backupPath: string;
  manifestPath: "contextarr-pack.json";
  manifestSha256: string;
  fileCount: number;
  byteLength: number;
  files: BackupFileEntry[];
  validation: Pick<ValidationReportV1, "valid" | "validationStatus" | "summary" | "issues" | "exportReadiness">;
}

export interface ContextPackBackupManifest {
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  backupId: string;
  createdAt: string;
  objectType: "context-packs";
  format: "directory";
  sourcePath: string;
  sqliteIncluded: false;
  activation: {
    restoreMode: "quarantine_review";
    requiresValidationBeforeActivation: true;
    automaticActivation: false;
  };
  summary: {
    packCount: number;
    fileCount: number;
    byteLength: number;
    validationErrors: number;
    validationWarnings: number;
  };
  packs: BackupPackEntry[];
}

export interface BackupResult {
  backupId: string;
  backupPath: string;
  manifestPath: string;
  manifestSha256Path: string;
  manifestSha256: string;
  packCount: number;
  fileCount: number;
  byteLength: number;
  validationErrors: number;
  validationWarnings: number;
}

export interface RestoredPackEntry {
  packId: string;
  packPath: string;
  checksumStatus: "verified";
  quarantineStatus: "review_required" | "invalid";
  validation: Pick<ValidationReportV1, "valid" | "validationStatus" | "summary" | "issues" | "exportReadiness">;
}

export interface RestoreReport {
  schemaVersion: typeof RESTORE_REPORT_SCHEMA_VERSION;
  backupId: string;
  restoredAt: string;
  sourceBackupPath: string;
  outputPath: string;
  status: "restored_to_quarantine" | "restored_with_validation_errors";
  activation: {
    automaticActivation: false;
    requiresManualReview: true;
    instructions: string;
  };
  summary: {
    packCount: number;
    validationErrors: number;
    validationWarnings: number;
  };
  packs: RestoredPackEntry[];
}

export interface RestoreResult {
  backupId: string;
  outputPath: string;
  reportPath: string;
  status: RestoreReport["status"];
  packCount: number;
  validationErrors: number;
  validationWarnings: number;
  packs: RestoredPackEntry[];
}

export class BackupError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "BackupError";
  }
}

export function createContextPackBackup(options: CreateContextPackBackupOptions): BackupResult {
  const sourcePath = path.resolve(options.packsDir);
  const outputRoot = path.resolve(options.outputDir);

  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isDirectory()) {
    throw new BackupError("backup.input_unreadable", `Backup source is not a readable directory: ${options.packsDir}`);
  }

  const createdAt = options.createdAt ?? new Date().toISOString();
  const backupId = safePathPart(options.backupId ?? defaultBackupId(createdAt), "backup id");
  const backupRoot = path.resolve(outputRoot, backupId);

  assertInsidePath(outputRoot, backupRoot, "Backup output path must stay inside the requested output directory.");
  if (fs.existsSync(backupRoot)) {
    throw new BackupError("backup.output_exists", `Backup output already exists: ${backupRoot}`);
  }

  const packTargets = resolvePackTargets(sourcePath);
  const validations = packTargets.map((packPath) => validatePack(packPath, { currentDate: options.currentDate }));
  const invalid = validations.filter((result) => !result.valid);
  if (invalid.length > 0) {
    throw new BackupError(
      "backup.validation_failed",
      `Backup source contains ${invalid.length} invalid Context Pack(s). Fix validation errors before backing up.`
    );
  }

  const packs: BackupPackEntry[] = [];
  let totalFiles = 0;
  let totalBytes = 0;

  try {
    for (let index = 0; index < packTargets.length; index += 1) {
      const packPath = packTargets[index]!;
      const validation = validations[index]!;
      const manifest = readManifest(packPath);
      const packId = safePathPart(validation.packId ?? manifest.id, "pack id");
      const packBackupPath = path.join("packs", packId);
      const packBackupRoot = path.resolve(backupRoot, packBackupPath);
      assertInsidePath(backupRoot, packBackupRoot, "Pack backup path must stay inside the backup root.");

      const files = listPackFiles(packPath);
      const entries: BackupFileEntry[] = [];
      let packBytes = 0;

      for (const file of files) {
        const relativeFile = normalizePath(path.relative(packPath, file));
        assertSafeRelativePath(relativeFile);
        const destination = path.resolve(packBackupRoot, relativeFile);
        assertInsidePath(packBackupRoot, destination, "Pack file backup path must stay inside the pack backup root.");

        const bytes = fs.readFileSync(file);
        const sha256 = sha256Bytes(bytes);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination, bytes);

        entries.push({
          path: relativeFile,
          sizeBytes: bytes.byteLength,
          sha256
        });
        packBytes += bytes.byteLength;
      }

      entries.sort((left, right) => left.path.localeCompare(right.path));
      totalFiles += entries.length;
      totalBytes += packBytes;

      const manifestEntry = entries.find((entry) => entry.path === "contextarr-pack.json");
      if (!manifestEntry) {
        throw new BackupError("backup.manifest_missing", `Pack manifest was not copied for ${packId}.`);
      }

      packs.push({
        packId,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        sourcePath: displayLocalPath(packPath),
        backupPath: normalizePath(packBackupPath),
        manifestPath: "contextarr-pack.json",
        manifestSha256: manifestEntry.sha256,
        fileCount: entries.length,
        byteLength: packBytes,
        files: entries,
        validation: compactValidation(validation)
      });
    }

    packs.sort((left, right) => left.packId.localeCompare(right.packId));

    const manifest: ContextPackBackupManifest = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      backupId,
      createdAt,
      objectType: "context-packs",
      format: "directory",
      sourcePath: displayLocalPath(sourcePath),
      sqliteIncluded: false,
      activation: {
        restoreMode: "quarantine_review",
        requiresValidationBeforeActivation: true,
        automaticActivation: false
      },
      summary: {
        packCount: packs.length,
        fileCount: totalFiles,
        byteLength: totalBytes,
        validationErrors: packs.reduce((count, pack) => count + pack.validation.summary.errors, 0),
        validationWarnings: packs.reduce((count, pack) => count + pack.validation.summary.warnings, 0)
      },
      packs
    };

    const manifestPath = path.join(backupRoot, "contextarr-backup.json");
    const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
    fs.writeFileSync(manifestPath, manifestJson, "utf8");
    const manifestSha256 = sha256Text(manifestJson);
    const manifestSha256Path = path.join(backupRoot, "contextarr-backup.sha256");
    fs.writeFileSync(manifestSha256Path, `${manifestSha256}  contextarr-backup.json\n`, "utf8");

    return {
      backupId,
      backupPath: backupRoot,
      manifestPath,
      manifestSha256Path,
      manifestSha256,
      packCount: packs.length,
      fileCount: totalFiles,
      byteLength: totalBytes,
      validationErrors: manifest.summary.validationErrors,
      validationWarnings: manifest.summary.validationWarnings
    };
  } catch (error) {
    fs.rmSync(backupRoot, { recursive: true, force: true });
    throw error;
  }
}

export function restoreContextPackBackup(options: RestoreContextPackBackupOptions): RestoreResult {
  const backupRoot = path.resolve(options.backupPath);
  const outputRoot = path.resolve(options.outputDir);

  if (!fs.existsSync(backupRoot) || !fs.statSync(backupRoot).isDirectory()) {
    throw new BackupError("restore.input_unreadable", `Restore source is not a readable backup directory: ${options.backupPath}`);
  }

  const manifestPath = path.join(backupRoot, "contextarr-backup.json");
  if (!fs.existsSync(manifestPath)) {
    throw new BackupError("restore.manifest_missing", "Backup manifest is missing: contextarr-backup.json");
  }

  verifyBackupManifestChecksum(backupRoot, manifestPath);
  const manifest = readBackupManifest(manifestPath);
  const restoreRoot = path.resolve(outputRoot, manifest.backupId);

  assertInsidePath(outputRoot, restoreRoot, "Restore output path must stay inside the requested output directory.");
  if (fs.existsSync(restoreRoot)) {
    throw new BackupError("restore.output_exists", `Restore output already exists: ${restoreRoot}`);
  }

  const backupRelativeToRestore = path.relative(backupRoot, restoreRoot);
  if (backupRelativeToRestore === "" || (!backupRelativeToRestore.startsWith("..") && !path.isAbsolute(backupRelativeToRestore))) {
    throw new BackupError("restore.output_inside_backup", "Restore output must not be created inside the backup artifact.");
  }

  const packs: RestoredPackEntry[] = [];

  try {
    for (const pack of manifest.packs) {
      const packId = safePathPart(pack.packId, "pack id");
      const sourcePackRoot = path.resolve(backupRoot, pack.backupPath);
      const destinationPackRoot = path.resolve(restoreRoot, packId);
      assertInsidePath(backupRoot, sourcePackRoot, "Backup pack path must stay inside the backup root.");
      assertInsidePath(restoreRoot, destinationPackRoot, "Restore pack path must stay inside the restore root.");

      for (const file of pack.files) {
        assertSafeRelativePath(file.path);
        const sourceFile = path.resolve(sourcePackRoot, file.path);
        const destinationFile = path.resolve(destinationPackRoot, file.path);
        assertInsidePath(sourcePackRoot, sourceFile, "Backup file path must stay inside the backup pack root.");
        assertInsidePath(destinationPackRoot, destinationFile, "Restore file path must stay inside the restore pack root.");

        if (!fs.existsSync(sourceFile) || !fs.statSync(sourceFile).isFile()) {
          throw new BackupError("restore.file_missing", `Backup file is missing: ${pack.packId}/${file.path}`);
        }

        const bytes = fs.readFileSync(sourceFile);
        const actualSha = sha256Bytes(bytes);
        if (actualSha !== file.sha256) {
          throw new BackupError("restore.checksum_mismatch", `Checksum mismatch for ${pack.packId}/${file.path}.`);
        }

        fs.mkdirSync(path.dirname(destinationFile), { recursive: true });
        fs.writeFileSync(destinationFile, bytes);
      }

      const manifestFile = path.join(destinationPackRoot, pack.manifestPath);
      if (sha256Bytes(fs.readFileSync(manifestFile)) !== pack.manifestSha256) {
        throw new BackupError("restore.manifest_checksum_mismatch", `Manifest checksum mismatch for ${pack.packId}.`);
      }

      const validation = validatePack(destinationPackRoot, { currentDate: options.currentDate });
      packs.push({
        packId,
        packPath: displayLocalPath(destinationPackRoot),
        checksumStatus: "verified",
        quarantineStatus: validation.valid ? "review_required" : "invalid",
        validation: compactValidation(validation)
      });
    }

    const validationErrors = packs.reduce((count, pack) => count + pack.validation.summary.errors, 0);
    const validationWarnings = packs.reduce((count, pack) => count + pack.validation.summary.warnings, 0);
    const report: RestoreReport = {
      schemaVersion: RESTORE_REPORT_SCHEMA_VERSION,
      backupId: manifest.backupId,
      restoredAt: options.restoredAt ?? new Date().toISOString(),
      sourceBackupPath: displayLocalPath(backupRoot),
      outputPath: displayLocalPath(restoreRoot),
      status: validationErrors > 0 ? "restored_with_validation_errors" : "restored_to_quarantine",
      activation: {
        automaticActivation: false,
        requiresManualReview: true,
        instructions:
          "Restored Context Packs are quarantined local files. Validate and review them before manually moving them into an active packs directory."
      },
      summary: {
        packCount: packs.length,
        validationErrors,
        validationWarnings
      },
      packs
    };

    fs.mkdirSync(restoreRoot, { recursive: true });
    const reportPath = path.join(restoreRoot, "restore-report.json");
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    return {
      backupId: manifest.backupId,
      outputPath: restoreRoot,
      reportPath,
      status: report.status,
      packCount: packs.length,
      validationErrors,
      validationWarnings,
      packs
    };
  } catch (error) {
    fs.rmSync(restoreRoot, { recursive: true, force: true });
    throw error;
  }
}

function resolvePackTargets(targetPath: string): string[] {
  if (fs.existsSync(path.join(targetPath, "contextarr-pack.json"))) {
    return [targetPath];
  }

  const childPacks = fs
    .readdirSync(targetPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(targetPath, entry.name))
    .filter((candidate) => fs.existsSync(path.join(candidate, "contextarr-pack.json")))
    .sort((left, right) => left.localeCompare(right));

  if (childPacks.length === 0) {
    throw new BackupError("backup.no_packs", `No Context Packs found under backup source: ${targetPath}`);
  }

  return childPacks;
}

function compactValidation(result: ValidationResult): BackupPackEntry["validation"] {
  const report = toValidationReportV1(result);
  return {
    valid: report.valid,
    validationStatus: report.validationStatus,
    summary: report.summary,
    issues: report.issues,
    exportReadiness: report.exportReadiness
  };
}

function readManifest(packPath: string): { id: string; name: string; version: string; description: string } {
  const manifestPath = path.join(packPath, "contextarr-pack.json");
  const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    id?: unknown;
    name?: unknown;
    version?: unknown;
    description?: unknown;
  };

  return {
    id: String(parsed.id ?? path.basename(packPath)),
    name: String(parsed.name ?? parsed.id ?? path.basename(packPath)),
    version: String(parsed.version ?? "unknown"),
    description: String(parsed.description ?? "")
  };
}

function readBackupManifest(manifestPath: string): ContextPackBackupManifest {
  const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as ContextPackBackupManifest;
  if (parsed.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new BackupError("restore.unsupported_schema", `Unsupported backup schema version: ${String(parsed.schemaVersion)}`);
  }
  if (parsed.objectType !== "context-packs" || parsed.format !== "directory") {
    throw new BackupError("restore.unsupported_format", "Backup manifest is not a Context Pack directory backup.");
  }
  if (!Array.isArray(parsed.packs) || parsed.packs.length === 0) {
    throw new BackupError("restore.empty_backup", "Backup manifest contains no Context Packs.");
  }
  safePathPart(parsed.backupId, "backup id");
  return parsed;
}

function verifyBackupManifestChecksum(backupRoot: string, manifestPath: string): void {
  const checksumPath = path.join(backupRoot, "contextarr-backup.sha256");
  if (!fs.existsSync(checksumPath)) {
    throw new BackupError("restore.manifest_checksum_missing", "Backup manifest checksum file is missing.");
  }

  const content = fs.readFileSync(checksumPath, "utf8").trim();
  const [expectedSha, filename] = content.split(/\s+/);
  if (filename !== "contextarr-backup.json" || !expectedSha) {
    throw new BackupError("restore.manifest_checksum_invalid", "Backup manifest checksum file is malformed.");
  }

  const actualSha = sha256Bytes(fs.readFileSync(manifestPath));
  if (actualSha !== expectedSha) {
    throw new BackupError("restore.manifest_checksum_mismatch", "Backup manifest checksum does not match.");
  }
}

function listPackFiles(packPath: string): string[] {
  const files: string[] = [];

  function walk(directory: string): void {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
      } else if (entry.isFile()) {
        files.push(absolutePath);
      }
    }
  }

  walk(packPath);
  return files.sort((left, right) => left.localeCompare(right));
}

function defaultBackupId(createdAt: string): string {
  const stamp = createdAt.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-+|-+$/g, "");
  return `contextarr-backup-${stamp || "local"}`;
}

function safePathPart(value: string, label: string): string {
  if (!/^[a-zA-Z0-9._-]+$/.test(value) || value.includes("..")) {
    throw new BackupError("path.unsafe", `Unsafe ${label}: ${value}`);
  }
  return value;
}

function assertSafeRelativePath(value: string): void {
  if (value === "" || path.isAbsolute(value) || value.split("/").includes("..") || /[\x00-\x1f\x7f]/.test(value)) {
    throw new BackupError("path.unsafe_relative", `Unsafe backup file path: ${value}`);
  }
}

function assertInsidePath(root: string, candidate: string, message: string): void {
  const relative = path.relative(root, candidate);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return;
  }
  throw new BackupError("path.escape", message);
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function displayLocalPath(value: string): string {
  const cwd = path.resolve(process.env.INIT_CWD ?? process.cwd());
  const relative = path.relative(cwd, path.resolve(value));
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return normalizePath(relative);
  }
  return path.basename(value);
}

function sha256Bytes(bytes: Buffer | Uint8Array): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function sha256Text(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}
