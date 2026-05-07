import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import {
  contextPackManifestSchema,
  exportProfileSchema,
  recordFrontmatterSchema,
  sourceMapSchema,
  type ContextPackManifest,
  type ExportProfile,
  type Source
} from "@contextarr/schema";
import { validatePack } from "@contextarr/pack-validator";
import type { LoadedPack, LoadedRecord, LoadPacksResult, SkippedPack } from "./types";

export function loadPacks(packsDir: string): LoadPacksResult {
  if (!fs.existsSync(packsDir) || !fs.statSync(packsDir).isDirectory()) {
    return {
      packs: [],
      skipped: [
        {
          packPath: packsDir,
          issues: [
            {
              severity: "error",
              code: "packs_dir.missing",
              message: `Packs directory does not exist: ${packsDir}`
            }
          ]
        }
      ]
    };
  }

  const packs: LoadedPack[] = [];
  const skipped: SkippedPack[] = [];

  for (const entry of fs.readdirSync(packsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packPath = path.join(packsDir, entry.name);
    const validation = validatePack(packPath);
    const manifest = readManifest(packPath);

    if (!validation.valid || !manifest) {
      skipped.push({
        packPath,
        packId: manifest?.id,
        issues: validation.issues
      });
      continue;
    }

    packs.push({
      packPath,
      manifest,
      validation,
      records: readRecords(packPath, manifest),
      sources: readSources(packPath, manifest),
      exportProfiles: readExportProfiles(packPath, manifest)
    });
  }

  return { packs, skipped };
}

function readManifest(packPath: string): ContextPackManifest | undefined {
  const manifestPath = path.join(packPath, "contextarr-pack.json");

  if (!fs.existsSync(manifestPath)) {
    return undefined;
  }

  return contextPackManifestSchema.parse(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
}

function readRecords(packPath: string, manifest: ContextPackManifest): LoadedRecord[] {
  const recordsDir = path.join(packPath, manifest.recordsPath);
  const records: LoadedRecord[] = [];

  for (const file of listFiles(recordsDir).filter((recordPath) => recordPath.toLowerCase().endsWith(".md"))) {
    const parsed = matter(fs.readFileSync(file, "utf8"));
    records.push({
      file: normalizePath(path.relative(packPath, file)),
      metadata: recordFrontmatterSchema.parse(parsed.data),
      body: parsed.content.trim()
    });
  }

  return records;
}

function readSources(packPath: string, manifest: ContextPackManifest): Source[] {
  const sourceMapPath = path.join(packPath, manifest.sourcesPath);
  const sourceMap = sourceMapSchema.parse(YAML.parse(fs.readFileSync(sourceMapPath, "utf8")));
  return sourceMap.sources;
}

function readExportProfiles(packPath: string, manifest: ContextPackManifest): ExportProfile[] {
  const exportsDir = path.join(packPath, manifest.exportsPath);

  return listFiles(exportsDir)
    .filter((file) => [".yaml", ".yml"].includes(path.extname(file).toLowerCase()))
    .map((file) => exportProfileSchema.parse(YAML.parse(fs.readFileSync(file, "utf8"))));
}

function listFiles(root: string): string[] {
  const files: string[] = [];

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}
