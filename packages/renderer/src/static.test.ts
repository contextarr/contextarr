import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { renderPackToStaticHtml, renderPacksToStaticHtml, StaticRenderError } from "./static";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const tempDirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-renderer-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("static HTML rendering", () => {
  it("renders AI Workstation Pack to index and record pages", () => {
    const outDir = tempDir();
    const result = renderPackToStaticHtml({
      packPath: path.join(demoPacksDir, "ai-workstation-pack"),
      outputDir: outDir
    });

    const index = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
    const record = fs.readFileSync(path.join(outDir, "records", "ai-workstation.local-ai-stack.html"), "utf8");

    expect(result).toMatchObject({ packsRendered: 1, recordsRendered: 5 });
    expect(index).toContain("AI Workstation Pack");
    expect(index).toContain("Export Profiles");
    expect(index).toContain("Sources");
    expect(record).toContain("Local AI Stack");
    expect(record).toContain("<table>");
    expect(record).toContain("../contextarr-static.css");
    expect(index).not.toContain("<script");
    expect(record).not.toContain("<script");
  });

  it("renders all demo packs with a root library page", () => {
    const outDir = tempDir();
    const result = renderPacksToStaticHtml({ packsDir: demoPacksDir, outputDir: outDir });

    expect(result).toMatchObject({ packsRendered: 5, recordsRendered: 25 });
    expect(fs.existsSync(path.join(outDir, "index.html"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "packs", "ai-workstation-pack", "index.html"))).toBe(true);
    expect(fs.readFileSync(path.join(outDir, "packs", "ai-workstation-pack", "records", "ai-workstation.local-ai-stack.html"), "utf8")).toContain("../../../contextarr-static.css");
    expect(fs.readFileSync(path.join(outDir, "index.html"), "utf8")).not.toContain("<script");
  });

  it("rejects invalid packs", () => {
    const outDir = tempDir();

    expect(() =>
      renderPackToStaticHtml({
        packPath: path.join(repoRoot, "packages", "pack-validator", "test", "fixtures", "missing-manifest-pack"),
        outputDir: outDir
      })
    ).toThrow(StaticRenderError);
  });
});
