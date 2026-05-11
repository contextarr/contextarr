import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
import { afterEach, describe, expect, it } from "vitest";
import { validatePack } from "@contextarr/pack-validator";
import { validateSkill } from "@contextarr/skill-validator";
import {
  detectImportKind,
  detectSkillImportKind,
  importToDraftPack,
  importSkillToDraft,
  ImporterError,
  previewImport,
  previewSkillImport,
  type DraftImportResult,
  type DraftSkillImportResult
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

  it("detects Skill importer kinds from local inputs", () => {
    expect(detectSkillImportKind(fixture("skill-markdown-folder"))).toBe("markdown");
    expect(detectSkillImportKind(fixture("prompt-templates"))).toBe("prompt-template");
    expect(detectSkillImportKind(fixture("claude-skill"))).toBe("claude-skill");
    expect(detectSkillImportKind(fixture("chatgpt-prompts"))).toBe("chatgpt-prompts");
    expect(detectSkillImportKind(fixture("skill-folder-files"))).toBe("folder");
  });

  it("previews Skill folder imports and blocks executable or credential-like files", () => {
    const preview = previewSkillImport({
      inputPath: fixture("skill-folder-files"),
      kind: "folder",
      skillId: "folder-skill-fixture"
    });

    expect(preview.documents.map((document) => document.title)).toEqual(["Instructions"]);
    expect(preview.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "skill_import.executable_file", file: "unsafe.ps1" }),
        expect.objectContaining({ code: "skill_import.blocked_content", file: "credentials.txt" })
      ])
    );
  });

  it("imports Markdown folders with deterministic Skill ids and validates generated drafts", () => {
    const first = previewSkillImport({
      inputPath: fixture("skill-markdown-folder"),
      kind: "markdown",
      skillId: "markdown-skill-fixture"
    });
    const second = previewSkillImport({
      inputPath: fixture("skill-markdown-folder"),
      kind: "markdown",
      skillId: "markdown-skill-fixture"
    });
    const result = writeSkillImport({
      inputPath: fixture("skill-markdown-folder"),
      kind: "markdown",
      skillId: "markdown-skill-fixture"
    });

    expect(second.documents.map((document) => document.id)).toEqual(first.documents.map((document) => document.id));
    expect(first.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "markdown-skill-fixture.handoff-note",
          tags: expect.arrayContaining(["imported_draft", "markdown_skill_import", "never_export"])
        })
      ])
    );
    expect(result.validation.summary.errors).toBe(0);
    expect(validateSkill(result.skillPath).summary.errors).toBe(0);
    expect(fs.existsSync(path.join(result.skillPath, "exports"))).toBe(true);
  });

  it("imports Claude Skill folders and ChatGPT prompt exports", () => {
    const claude = writeSkillImport({
      inputPath: fixture("claude-skill"),
      kind: "claude-skill",
      skillId: "claude-skill-fixture"
    });
    const prompts = writeSkillImport({
      inputPath: fixture("chatgpt-prompts"),
      kind: "chatgpt-prompts",
      skillId: "chatgpt-prompt-skill"
    });

    expect(claude.documentCount).toBe(2);
    expect(claude.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "skill_import.executable_file" })]));
    expect(prompts.documentCount).toBe(2);
    expect(prompts.validation.summary.errors).toBe(0);
  });

  it("keeps script-bearing external Skill imports data-only without execution approval", () => {
    const result = writeSkillImport({
      inputPath: fixture("claude-skill"),
      kind: "claude-skill",
      skillId: "script-bearing-claude-skill"
    });
    const manifest = JSON.parse(fs.readFileSync(path.join(result.skillPath, "contextarr-skill.json"), "utf8"));
    const generatedFiles = listFiles(result.skillPath).map((file) => path.relative(result.skillPath, file).replace(/\\/g, "/"));
    const instructionFiles = generatedFiles.filter((file) => file.startsWith("instructions/") && file.endsWith(".md"));
    const instructionText = instructionFiles
      .map((file) => fs.readFileSync(path.join(result.skillPath, file), "utf8"))
      .join("\n");
    const serializedManifest = JSON.stringify(manifest);

    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "skill_import.executable_file", file: "unsafe.sh" })])
    );
    expect(generatedFiles).not.toContain("unsafe.sh");
    expect(generatedFiles.some((file) => file.startsWith("scripts/"))).toBe(false);
    expect(manifest).toMatchObject({
      containsExecutableCode: false,
      requiresNetwork: false,
      trustLevel: "unreviewed",
      permissions: {
        runCommands: false,
        networkAccess: false,
        toolExecution: false
      }
    });
    expect(serializedManifest).not.toContain("approved_for_execution");
    expect(serializedManifest).not.toContain("approvedForExecution");
    expect(instructionText).toContain("privacy: private");
    expect(instructionText).toContain("review_status: draft");
    expect(instructionText).toContain("never_export");
  });

  it("imports a single ChatGPT prompt object as one draft document", () => {
    const result = writeSkillImport({
      inputPath: fixture("chatgpt-single-prompt"),
      kind: "chatgpt-prompts",
      skillId: "single-prompt-skill"
    });

    expect(result.documentCount).toBe(1);
    expect(result.validation.summary.errors).toBe(0);
  });

  it("imports prompt templates and honors max docs with a warning", () => {
    const preview = previewSkillImport({
      inputPath: fixture("chatgpt-prompts"),
      kind: "chatgpt-prompts",
      skillId: "limited-prompt-skill",
      maxDocs: 1
    });
    const promptTemplate = writeSkillImport({
      inputPath: fixture("prompt-templates"),
      kind: "prompt-template",
      skillId: "prompt-template-skill"
    });

    expect(preview.documents).toHaveLength(1);
    expect(preview.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "skill_import.max_docs" })]));
    expect(promptTemplate.documentCount).toBe(1);
    expect(promptTemplate.validation.summary.errors).toBe(0);
  });

  it("fails clearly for malformed Skill imports and existing output", () => {
    const outputDir = tempDir();
    const options = {
      inputPath: fixture("skill-markdown-folder"),
      kind: "markdown" as const,
      skillId: "existing-skill",
      outputDir
    };

    importSkillToDraft(options);
    expect(() => importSkillToDraft(options)).toThrow(ImporterError);
    expect(importSkillToDraft({ ...options, overwrite: true }).documentCount).toBe(2);
    expect(() =>
      previewSkillImport({
        inputPath: fixture("malformed-chatgpt-prompts"),
        kind: "chatgpt-prompts",
        skillId: "bad-prompts"
      })
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

function writeSkillImport(options: {
  inputPath: string;
  kind: "auto" | "folder" | "markdown" | "prompt-template" | "claude-skill" | "chatgpt-prompts";
  skillId: string;
}): DraftSkillImportResult {
  return importSkillToDraft({
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
