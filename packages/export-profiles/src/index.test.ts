import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { buildPackExport, ExportError, listPackExportProfiles } from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const fixturesDir = path.join(repoRoot, "packages/pack-validator/test/fixtures");
const tempDirs: string[] = [];

function demoPack(name: string): string {
  return path.join(demoPacksDir, name);
}

function copyFixture(name = "valid-minimal-pack"): string {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-export-"));
  const packPath = path.join(tempRoot, name);
  fs.cpSync(path.join(fixturesDir, name), packPath, { recursive: true });
  tempDirs.push(tempRoot);
  return packPath;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("export profile engine", () => {
  it("lists all Phase 7 profile targets for a demo pack", () => {
    const profiles = listPackExportProfiles({ packPath: demoPack("ai-workstation-pack") }).map(({ profile }) => ({
      id: profile.id,
      target: profile.target,
      format: profile.format
    }));

    expect(profiles).toEqual(
      expect.arrayContaining([
        { id: "ai-workstation-chatgpt", target: "chatgpt", format: "markdown" },
        { id: "ai-workstation-claude", target: "claude", format: "markdown" },
        { id: "ai-workstation-codex", target: "codex", format: "markdown" },
        { id: "ai-workstation-markdown", target: "markdown", format: "markdown" },
        { id: "ai-workstation-json-records", target: "json_records", format: "json" }
      ])
    );
  });

  it("builds ChatGPT, Claude, Codex, Markdown, and JSON exports from demo profiles", () => {
    for (const profileId of [
      "ai-workstation-chatgpt",
      "ai-workstation-claude",
      "ai-workstation-codex",
      "ai-workstation-markdown"
    ]) {
      const artifact = buildPackExport({
        packPath: demoPack("ai-workstation-pack"),
        profileId,
        generatedAt: "2026-05-07T00:00:00.000Z"
      });

      expect(artifact.content).toContain("AI Workstation Pack");
      expect(artifact.includedRecords.map((record) => record.id)).toEqual([
        "ai-workstation.hardware-overview",
        "ai-workstation.local-ai-stack",
        "ai-workstation.storage-layout",
        "ai-workstation.networking-notes",
        "ai-workstation.troubleshooting-workflow"
      ]);
      expect(artifact.sources).toHaveLength(5);
      expect(artifact.filename).toMatch(/\.(md)$/);
    }

    const jsonArtifact = buildPackExport({
      packPath: demoPack("ai-workstation-pack"),
      profileId: "ai-workstation-json-records",
      generatedAt: "2026-05-07T00:00:00.000Z"
    });
    const parsed = JSON.parse(jsonArtifact.content);

    expect(jsonArtifact.mimeType).toBe("application/json");
    expect(parsed.records).toHaveLength(5);
    expect(parsed.sources).toHaveLength(5);
  });

  it("applies remove, mask, and warn redaction patterns deterministically", () => {
    const packPath = copyFixture();
    fs.writeFileSync(
      path.join(packPath, "records", "overview.md"),
      fs
        .readFileSync(path.join(packPath, "records", "overview.md"), "utf8")
        .replace("This fake record is safe and source-backed.", "codeword = fake-value\nemail test@example.com\nwarnword"),
      "utf8"
    );
    fs.writeFileSync(
      path.join(packPath, "rules", "redaction.yaml"),
      [
        "redact_tags:",
        "  - secret",
        "  - never_export",
        "patterns:",
        "  - name: codeword_like",
        "    regex: \"(codeword)\\\\s*[:=]\\\\s*[^\\\\s]+\"",
        "    action: remove",
        "  - name: email",
        "    regex: \"[A-Z0-9._%+-]+@[A-Z0-9.-]+\\\\.[A-Z]{2,}\"",
        "    flags: i",
        "    action: mask",
        "  - name: warnword",
        "    regex: \"warnword\"",
        "    action: warn"
      ].join("\n"),
      "utf8"
    );

    const artifact = buildPackExport({ packPath, profileId: "codex-context" });

    expect(artifact.content).toContain("[redacted]");
    expect(artifact.content).toContain("[masked]");
    expect(artifact.content).not.toContain("fake-value");
    expect(artifact.content).not.toContain("test@example.com");
    expect(artifact.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "redaction.warn" })]));
  });

  it("excludes secret records in redacted exports", () => {
    const packPath = copyFixture();
    const recordPath = path.join(packPath, "records", "overview.md");
    fs.writeFileSync(fs.realpathSync(recordPath), fs.readFileSync(recordPath, "utf8").replace("privacy: public_safe", "privacy: secret"), "utf8");

    const artifact = buildPackExport({ packPath, profileId: "codex-context" });

    expect(artifact.includedRecords).toHaveLength(0);
    expect(artifact.excludedRecords).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "valid.overview", reason: expect.stringContaining("secret") })])
    );
  });

  it("fails clearly for missing profiles and missing record references", () => {
    const packPath = copyFixture();

    expect(() => buildPackExport({ packPath, profileId: "missing" })).toThrow(ExportError);

    fs.writeFileSync(
      path.join(packPath, "exports", "codex.yaml"),
      fs.readFileSync(path.join(packPath, "exports", "codex.yaml"), "utf8").replace("valid.overview", "valid.missing"),
      "utf8"
    );

    expect(() => buildPackExport({ packPath, profileId: "codex-context" })).toThrow(/missing record/);
  });
});
