import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CollectorError,
  listContextPackCollectors,
  previewContextPackCollector,
  runContextPackCollector
} from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const markdownFixture = path.join(repoRoot, "packages/importers/test/fixtures/markdown-folder");

function tempOutputRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-collectors-"));
}

describe("Context Pack collectors", () => {
  it("lists the four v0 local Context Pack collectors", () => {
    expect(listContextPackCollectors().map((collector) => collector.id)).toEqual([
      "blank-pack-starter",
      "markdown-folder",
      "project-notes",
      "support-kb-starter"
    ]);
  });

  it("writes a private unreviewed blank draft pack under the requested output root", () => {
    const outputDir = tempOutputRoot();
    const result = runContextPackCollector({
      collectorId: "blank-pack-starter",
      outputDir,
      packId: "../Blank Pack!",
      generatedAt: "2026-05-08T00:00:00.000Z"
    });

    const manifest = JSON.parse(fs.readFileSync(path.join(result.packPath, "contextarr-pack.json"), "utf8"));
    const record = fs.readFileSync(path.join(result.packPath, "records", "overview.md"), "utf8");

    expect(result.packId).toBe("blank-pack");
    expect(result.recordCount).toBe(1);
    expect(result.validation.valid).toBe(true);
    expect(manifest).toMatchObject({
      id: "blank-pack",
      visibility: "private",
      trustLevel: "unreviewed",
      containsExecutableCode: false,
      requiresNetwork: false
    });
    expect(record).toContain("review_status: draft");
    expect(record).toContain("never_export");
    expect(path.relative(outputDir, result.packPath)).not.toMatch(/^\.\./);
  });

  it("previews and writes Markdown folder drafts with import-safe defaults", () => {
    const outputDir = tempOutputRoot();
    const preview = previewContextPackCollector({
      collectorId: "markdown-folder",
      inputPath: markdownFixture,
      packId: "collector-markdown-draft",
      maxRecords: 1
    });
    const result = runContextPackCollector({
      collectorId: "markdown-folder",
      inputPath: markdownFixture,
      outputDir,
      packId: "collector-markdown-draft",
      maxRecords: 1,
      generatedAt: "2026-05-08T00:00:00.000Z"
    });

    expect(preview.records).toHaveLength(1);
    expect(result.recordCount).toBe(1);
    expect(result.validation.valid).toBe(true);
    expect(fs.readFileSync(path.join(result.packPath, "records", "note-a.md"), "utf8")).toContain("never_export");
  });

  it("rejects existing draft output unless overwrite is set", () => {
    const outputDir = tempOutputRoot();
    runContextPackCollector({ collectorId: "support-kb-starter", outputDir, packId: "support-kb-smoke" });

    expect(() => runContextPackCollector({ collectorId: "support-kb-starter", outputDir, packId: "support-kb-smoke" })).toThrow(
      CollectorError
    );

    const overwritten = runContextPackCollector({
      collectorId: "support-kb-starter",
      outputDir,
      packId: "support-kb-smoke",
      overwrite: true
    });
    expect(overwritten.recordCount).toBe(4);
  });

  it("returns controlled errors for missing local input paths", () => {
    expect(() =>
      previewContextPackCollector({
        collectorId: "project-notes",
        inputPath: path.join(os.tmpdir(), "contextarr-missing-notes")
      })
    ).toThrow(/does not exist/);
  });
});
