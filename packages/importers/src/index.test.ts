import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
import { afterEach, describe, expect, it } from "vitest";
import { validatePack } from "@contextarr/pack-validator";
import {
  detectImportKind,
  importToDraftPack,
  ImporterError,
  previewImport,
  type DraftImportResult
} from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixturesDir = path.join(repoRoot, "packages/importers/test/fixtures");
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("@contextarr/importers", () => {
  it("detects importer kinds from local inputs", () => {
    expect(detectImportKind(fixture("markdown-folder"))).toBe("markdown");
    expect(detectImportKind(fixture("obsidian-vault"))).toBe("obsidian");
    expect(detectImportKind(fixture("chatgpt-export"))).toBe("chatgpt");
    expect(detectImportKind(fixture("claude-export"))).toBe("claude");
    expect(detectImportKind(fixture("folder-files"))).toBe("folder");
  });

  it("previews generic folder imports and warns for unsupported files", () => {
    const preview = previewImport({ inputPath: fixture("folder-files"), kind: "folder", packId: "folder-fixture" });

    expect(preview.records.map((record) => record.title)).toEqual(["Config", "Notes"]);
    expect(preview.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "import.unsupported_file", file: "image.png" })])
    );
  });

  it("imports Markdown folders with deterministic ids and validates generated draft packs", () => {
    const first = previewImport({ inputPath: fixture("markdown-folder"), kind: "markdown", packId: "markdown-fixture" });
    const second = previewImport({ inputPath: fixture("markdown-folder"), kind: "markdown", packId: "markdown-fixture" });
    const result = writeImport({ inputPath: fixture("markdown-folder"), kind: "markdown", packId: "markdown-fixture" });

    expect(second.records.map((record) => record.id)).toEqual(first.records.map((record) => record.id));
    expect(first.records[0]).toMatchObject({
      id: "markdown-fixture.note-a",
      tags: expect.arrayContaining(["imported_draft", "markdown_import", "never_export", "planning"])
    });
    expect(result.validation.summary.errors).toBe(0);
    expect(validatePack(result.packPath).valid).toBe(true);
  });

  it("imports Obsidian vault notes and skips Obsidian system files", () => {
    const result = writeImport({ inputPath: fixture("obsidian-vault"), kind: "obsidian", packId: "obsidian-fixture" });
    const recordFile = path.join(result.packPath, "records", "projects-workbench.md");
    const record = fs.readFileSync(recordFile, "utf8");

    expect(result.recordCount).toBe(1);
    expect(record).toContain("ai_workflow");
    expect(record).toContain("review");
    expect(result.validation.summary.errors).toBe(0);
  });

  it("imports ChatGPT extracted folders and zip exports", () => {
    const extracted = writeImport({ inputPath: fixture("chatgpt-export"), kind: "chatgpt", packId: "chatgpt-fixture" });
    const zipped = writeImport({ inputPath: zipFixture("chatgpt-export", "chatgpt-export.zip"), kind: "auto", packId: "chatgpt-zip" });

    expect(extracted.kind).toBe("chatgpt");
    expect(extracted.recordCount).toBe(2);
    expect(zipped.kind).toBe("chatgpt");
    expect(zipped.recordCount).toBe(2);
    expect(extracted.validation.summary.errors).toBe(0);
    expect(zipped.validation.summary.errors).toBe(0);
  });

  it("imports Claude extracted folders and zip exports", () => {
    const extracted = writeImport({ inputPath: fixture("claude-export"), kind: "claude", packId: "claude-fixture" });
    const zipped = writeImport({ inputPath: zipFixture("claude-export", "claude-export.zip"), kind: "auto", packId: "claude-zip" });

    expect(extracted.kind).toBe("claude");
    expect(extracted.recordCount).toBe(2);
    expect(zipped.kind).toBe("claude");
    expect(zipped.recordCount).toBe(2);
    expect(extracted.validation.summary.errors).toBe(0);
    expect(zipped.validation.summary.errors).toBe(0);
  });

  it("honors maxRecords with a warning", () => {
    const preview = previewImport({
      inputPath: fixture("chatgpt-export"),
      kind: "chatgpt",
      packId: "limited-chatgpt",
      maxRecords: 1
    });

    expect(preview.records).toHaveLength(1);
    expect(preview.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "import.max_records" })]));
  });

  it("fails if output exists unless overwrite is set", () => {
    const outputDir = tempDir();
    const options = {
      inputPath: fixture("markdown-folder"),
      kind: "markdown" as const,
      packId: "existing-pack",
      outputDir
    };

    importToDraftPack(options);
    expect(() => importToDraftPack(options)).toThrow(ImporterError);
    expect(importToDraftPack({ ...options, overwrite: true }).recordCount).toBe(2);
  });

  it("fails clearly for malformed ChatGPT exports", () => {
    expect(() =>
      previewImport({ inputPath: fixture("malformed-chatgpt"), kind: "chatgpt", packId: "bad-chatgpt" })
    ).toThrow(ImporterError);
  });
});

function fixture(name: string): string {
  return path.join(fixturesDir, name);
}

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-importers-"));
  tempDirs.push(dir);
  return dir;
}

function writeImport(options: {
  inputPath: string;
  kind: "auto" | "folder" | "markdown" | "obsidian" | "chatgpt" | "claude";
  packId: string;
}): DraftImportResult {
  return importToDraftPack({
    ...options,
    outputDir: tempDir(),
    generatedAt: "2026-01-01T00:00:00.000Z"
  });
}

function zipFixture(fixtureName: string, zipName: string): string {
  const root = fixture(fixtureName);
  const entries: Record<string, Uint8Array> = {};

  for (const file of listFiles(root)) {
    entries[path.relative(root, file).replace(/\\/g, "/")] = new Uint8Array(fs.readFileSync(file));
  }

  const zipPath = path.join(tempDir(), zipName);
  fs.writeFileSync(zipPath, Buffer.from(zipSync(entries)));
  return zipPath;
}

function listFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}
