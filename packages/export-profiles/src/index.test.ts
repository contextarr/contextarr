import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { buildComposedExport, buildPackExport, ExportError, listPackExportProfiles } from "./index";

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

  it("excludes unapproved and private records from trusted exports without leaking metadata", () => {
    const packPath = copyFixture();
    const recordPath = path.join(packPath, "records", "overview.md");
    fs.writeFileSync(
      fs.realpathSync(recordPath),
      fs
        .readFileSync(recordPath, "utf8")
        .replace("title: Valid Overview", "title: Private Draft Fixture")
        .replace("privacy: public_safe", "privacy: private")
        .replace("review_status: approved", "review_status: draft"),
      "utf8"
    );

    const artifact = buildPackExport({ packPath, profileId: "codex-context" });

    expect(artifact.includedRecords).toHaveLength(0);
    expect(artifact.content).not.toContain("Private Draft Fixture");
    expect(artifact.excludedRecords).toEqual([
      expect.objectContaining({
        id: "valid.overview",
        title: "[redacted]",
        tags: [],
        sources: [],
        reason: expect.stringContaining("review_status is draft")
      })
    ]);
  });

  it("preserves benign profile-exclusion metadata separately from trusted visibility redaction", () => {
    const packPath = copyFixture();
    fs.writeFileSync(
      path.join(packPath, "records", "overview.md"),
      fs.readFileSync(path.join(packPath, "records", "overview.md"), "utf8").replace("  - test", "  - safe_skip"),
      "utf8"
    );
    fs.writeFileSync(
      path.join(packPath, "exports", "codex.yaml"),
      fs
        .readFileSync(path.join(packPath, "exports", "codex.yaml"), "utf8")
        .replace("  - secret", "  - safe_skip"),
      "utf8"
    );

    const artifact = buildPackExport({ packPath, profileId: "codex-context" });

    expect(artifact.includedRecords).toHaveLength(0);
    expect(artifact.excludedRecords).toEqual([
      expect.objectContaining({
        id: "valid.overview",
        title: "Valid Overview",
        tags: ["safe_skip"],
        sources: ["manual-source"],
        reason: "Excluded by profile tag: safe_skip"
      })
    ]);
  });

  it("allows explicitly full exports to include approved private records but still excludes secret records", () => {
    const packPath = copyFixture();
    const recordPath = path.join(packPath, "records", "overview.md");
    fs.writeFileSync(
      recordPath,
      fs.readFileSync(recordPath, "utf8").replace("privacy: public_safe", "privacy: private"),
      "utf8"
    );
    fs.writeFileSync(
      path.join(packPath, "records", "secret.md"),
      fs
        .readFileSync(recordPath, "utf8")
        .replace("id: valid.overview", "id: valid.secret")
        .replace("title: Valid Overview", "title: Secret Overview")
        .replace("privacy: private", "privacy: secret"),
      "utf8"
    );
    fs.writeFileSync(
      path.join(packPath, "exports", "codex.yaml"),
      fs
        .readFileSync(path.join(packPath, "exports", "codex.yaml"), "utf8")
        .replace("privacy_mode: redacted", "privacy_mode: full")
        .replace("    - valid.overview", "    - valid.overview\n    - valid.secret"),
      "utf8"
    );

    const artifact = buildPackExport({ packPath, profileId: "codex-context" });

    expect(artifact.includedRecords.map((record) => record.id)).toEqual(["valid.overview"]);
    expect(artifact.excludedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "valid.secret",
          title: "[redacted]",
          reason: expect.stringContaining("privacy is secret")
        })
      ])
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

  it("builds composed markdown and JSON exports in selected record order", () => {
    const selections = [
      {
        packPath: demoPack("ai-workstation-pack"),
        recordIds: ["ai-workstation.local-ai-stack", "ai-workstation.networking-notes"]
      },
      {
        packPath: demoPack("claude-code-project-pack"),
        recordIds: ["claude-code-project.agent-instructions"]
      }
    ];

    const markdown = buildComposedExport({
      title: "Workbench Handoff",
      target: "codex",
      format: "markdown",
      selections,
      generatedAt: "2026-05-07T00:00:00.000Z"
    });

    expect(markdown.filename).toBe("workbench-handoff-codex.md");
    expect(markdown.includedRecords.map((record) => record.id)).toEqual([
      "ai-workstation.local-ai-stack",
      "ai-workstation.networking-notes",
      "claude-code-project.agent-instructions"
    ]);
    expect(markdown.content.indexOf("Local AI Stack")).toBeLessThan(markdown.content.indexOf("Networking Notes"));

    const json = buildComposedExport({
      title: "Workbench Handoff",
      target: "json_records",
      format: "json",
      selections,
      generatedAt: "2026-05-07T00:00:00.000Z"
    });
    const parsed = JSON.parse(json.content);

    expect(json.mimeType).toBe("application/json");
    expect(parsed.exportKind).toBe("composed");
    expect(parsed.records.map((record: { id: string }) => record.id)).toEqual(markdown.includedRecords.map((record) => record.id));
  });

  it("applies composed privacy, default excluded tags, and token budget warnings", () => {
    const packPath = copyFixture();
    fs.writeFileSync(
      path.join(packPath, "records", "draft.md"),
      fs
        .readFileSync(path.join(packPath, "records", "overview.md"), "utf8")
        .replace("id: valid.overview", "id: valid.draft")
        .replace("title: Valid Overview", "title: Draft Import")
        .replace("tags:\n  - test", "tags:\n  - imported_draft")
        .replace("privacy: public_safe", "privacy: private"),
      "utf8"
    );

    const artifact = buildComposedExport({
      target: "codex",
      format: "markdown",
      selections: [{ packPath, recordIds: ["valid.overview", "valid.draft"] }],
      tokenBudget: 1,
      generatedAt: "2026-05-07T00:00:00.000Z"
    });

    expect(artifact.includedRecords.map((record) => record.id)).toEqual(["valid.overview"]);
    expect(artifact.excludedRecords).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "valid.draft", reason: expect.stringContaining("imported_draft") })])
    );
    expect(artifact.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "token_budget.exceeded" })]));
  });

  it("excludes unapproved and private records from composed trusted exports", () => {
    const packPath = copyFixture();
    fs.writeFileSync(
      path.join(packPath, "records", "private-draft.md"),
      fs
        .readFileSync(path.join(packPath, "records", "overview.md"), "utf8")
        .replace("id: valid.overview", "id: valid.private-draft")
        .replace("title: Valid Overview", "title: Private Draft Composed")
        .replace("privacy: public_safe", "privacy: private")
        .replace("review_status: approved", "review_status: draft"),
      "utf8"
    );

    const artifact = buildComposedExport({
      target: "codex",
      format: "markdown",
      selections: [{ packPath, recordIds: ["valid.overview", "valid.private-draft"] }],
      generatedAt: "2026-05-07T00:00:00.000Z"
    });

    expect(artifact.includedRecords.map((record) => record.id)).toEqual(["valid.overview"]);
    expect(artifact.content).not.toContain("Private Draft Composed");
    expect(artifact.excludedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "valid.private-draft",
          title: "[redacted]",
          reason: expect.stringContaining("review_status is draft")
        })
      ])
    );
  });

  it("fails clearly for invalid composed export requests", () => {
    expect(() =>
      buildComposedExport({
        target: "codex",
        format: "markdown",
        selections: []
      })
    ).toThrow(/requires at least one selected record/);

    expect(() =>
      buildComposedExport({
        target: "codex",
        format: "markdown",
        selections: [{ packPath: demoPack("ai-workstation-pack"), recordIds: ["missing.record"] }]
      })
    ).toThrow(/missing record/);

    expect(() =>
      buildComposedExport({
        target: "unsupported",
        format: "markdown",
        selections: [{ packPath: demoPack("ai-workstation-pack"), recordIds: ["ai-workstation.local-ai-stack"] }]
      })
    ).toThrow(ExportError);
  });
});
