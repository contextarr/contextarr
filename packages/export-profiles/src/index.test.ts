import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildAgentKitExport,
  buildComposedExport,
  buildPackExport,
  buildSkillExport,
  ExportError,
  listAgentKitExportProfiles,
  listPackExportProfiles,
  listSkillExportProfiles
} from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const demoSkillsDir = path.join(repoRoot, "demo-skills");
const demoAgentKitsDir = path.join(repoRoot, "demo-agent-kits");
const fixturesDir = path.join(repoRoot, "packages/pack-validator/test/fixtures");
const tempDirs: string[] = [];

function demoPack(name: string): string {
  return path.join(demoPacksDir, name);
}

function demoSkill(name: string): string {
  return path.join(demoSkillsDir, name);
}

function demoAgentKit(name: string): string {
  return path.join(demoAgentKitsDir, name);
}

function copyFixture(name = "valid-minimal-pack"): string {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-export-"));
  const packPath = path.join(tempRoot, name);
  fs.cpSync(path.join(fixturesDir, name), packPath, { recursive: true });
  tempDirs.push(tempRoot);
  return packPath;
}

function copyDemoSkill(name = "support-ticket-writing-skill"): string {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-skill-export-"));
  const skillPath = path.join(tempRoot, name);
  fs.cpSync(demoSkill(name), skillPath, { recursive: true });
  tempDirs.push(tempRoot);
  return skillPath;
}

function copyDemoObjectSet(): { root: string; packsDir: string; skillsDir: string; agentKitPath: string } {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-agent-kit-export-"));
  const packsDir = path.join(tempRoot, "demo-packs");
  const skillsDir = path.join(tempRoot, "demo-skills");
  const agentKitsDir = path.join(tempRoot, "demo-agent-kits");
  fs.mkdirSync(packsDir, { recursive: true });
  fs.mkdirSync(skillsDir, { recursive: true });
  fs.mkdirSync(agentKitsDir, { recursive: true });

  for (const packId of ["internal-support-kb-pack", "fake-product-line-pack"]) {
    fs.cpSync(demoPack(packId), path.join(packsDir, packId), { recursive: true });
  }

  for (const skillId of ["support-ticket-writing-skill", "bug-report-structuring-skill"]) {
    fs.cpSync(demoSkill(skillId), path.join(skillsDir, skillId), { recursive: true });
  }

  const agentKitPath = path.join(agentKitsDir, "support-ticket-writing-kit");
  fs.cpSync(demoAgentKit("support-ticket-writing-kit"), agentKitPath, { recursive: true });
  tempDirs.push(tempRoot);
  return { root: tempRoot, packsDir, skillsDir, agentKitPath };
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
        { id: "ai-workstation-markdown", target: "generic_markdown", format: "markdown" },
        { id: "ai-workstation-json-records", target: "json", format: "json" },
        { id: "ai-workstation-agents-md", target: "agents_md", format: "markdown" },
        { id: "ai-workstation-claude-md", target: "claude_md", format: "markdown" },
        { id: "ai-workstation-llms-txt", target: "llms_txt", format: "text" }
      ])
    );
  });

  it("builds ChatGPT, Claude, Codex, Markdown, and JSON exports from demo profiles", () => {
    for (const profileId of [
      "ai-workstation-chatgpt",
      "ai-workstation-claude",
      "ai-workstation-codex",
      "ai-workstation-markdown",
      "ai-workstation-agents-md",
      "ai-workstation-claude-md",
      "ai-workstation-llms-txt"
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
      expect(artifact.filename).toMatch(/\.(md|txt)$/);
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

  it("lists all Phase 18 profile targets for a demo Skill", () => {
    const profiles = listSkillExportProfiles({ skillPath: demoSkill("support-ticket-writing-skill") }).map(({ profile }) => ({
      id: profile.id,
      target: profile.target,
      format: profile.format
    }));

    expect(profiles).toEqual(
      expect.arrayContaining([
        { id: "support-ticket-writing-skill-chatgpt", target: "chatgpt", format: "markdown" },
        { id: "support-ticket-writing-skill-claude", target: "claude", format: "markdown" },
        { id: "support-ticket-writing-skill-codex", target: "codex", format: "markdown" },
        { id: "support-ticket-writing-skill-claude-code", target: "claude_code", format: "markdown" },
        { id: "support-ticket-writing-skill-markdown", target: "markdown", format: "markdown" },
        { id: "support-ticket-writing-skill-json", target: "json", format: "json" }
      ])
    );
  });

  it("builds ChatGPT, Claude, Codex, Claude Code, Markdown, and JSON Skill exports", () => {
    for (const profileId of [
      "support-ticket-writing-skill-chatgpt",
      "support-ticket-writing-skill-claude",
      "support-ticket-writing-skill-codex",
      "support-ticket-writing-skill-claude-code",
      "support-ticket-writing-skill-markdown"
    ]) {
      const artifact = buildSkillExport({
        skillPath: demoSkill("support-ticket-writing-skill"),
        profileId,
        generatedAt: "2026-05-07T00:00:00.000Z"
      });

      expect(artifact.packId).toBe("support-ticket-writing-skill");
      expect(artifact.content).toContain("Support Ticket Writing Skill");
      expect(artifact.includedRecords.map((document) => document.id)).toEqual([
        "support-ticket-writing-skill.triage-response",
        "support-ticket-writing-skill.customer-safe-wording",
        "support-ticket-writing-skill.handoff-summary",
        "support-ticket-writing-skill.example-ticket-intake",
        "support-ticket-writing-skill.example-known-issue-update"
      ]);
      expect(artifact.sources).toHaveLength(3);
      expect(artifact.sources[0]).not.toHaveProperty("path");
      expect(artifact.filename).toMatch(/\.(md)$/);
      expect(JSON.stringify(artifact)).not.toContain(repoRoot);
    }

    const jsonArtifact = buildSkillExport({
      skillPath: demoSkill("support-ticket-writing-skill"),
      profileId: "support-ticket-writing-skill-json",
      generatedAt: "2026-05-07T00:00:00.000Z"
    });
    const parsed = JSON.parse(jsonArtifact.content);

    expect(jsonArtifact.mimeType).toBe("application/json");
    expect(parsed.exportKind).toBe("skill");
    expect(parsed.documents).toHaveLength(5);
    expect(parsed.sources).toHaveLength(3);
    expect(JSON.stringify(parsed)).not.toContain("docs/support-style-guide.md");
    expect(jsonArtifact.content).toContain("credential_requests");
    expect(jsonArtifact.content).toContain("hidden_prompts");
  });

  it("lists and builds Agent Kit exports from selected Context Packs and Skills", () => {
    const profiles = listAgentKitExportProfiles({
      agentKitPath: demoAgentKit("support-ticket-writing-kit"),
      contextPacksDir: demoPacksDir,
      skillsDir: demoSkillsDir
    }).map(({ profile }) => ({
      id: profile.id,
      target: profile.target,
      format: profile.format
    }));

    expect(profiles).toEqual(
      expect.arrayContaining([
        { id: "support-ticket-writing-kit-chatgpt", target: "chatgpt", format: "markdown" },
        { id: "support-ticket-writing-kit-claude", target: "claude", format: "markdown" },
        { id: "support-ticket-writing-kit-codex", target: "codex", format: "markdown" }
      ])
    );

    const artifact = buildAgentKitExport({
      agentKitPath: demoAgentKit("support-ticket-writing-kit"),
      contextPacksDir: demoPacksDir,
      skillsDir: demoSkillsDir,
      profileId: "support-ticket-writing-kit-codex",
      generatedAt: "2026-05-07T00:00:00.000Z"
    });

    expect(artifact.packId).toBe("support-ticket-writing-kit");
    expect(artifact.content).toContain("Agent Kit Export: Support Ticket Writing Kit");
    expect(artifact.content).toContain("Support Ticket Writing Skill");
    expect(artifact.content).toContain("Internal Support KB Pack");
    expect(artifact.content.indexOf("## Included Skills")).toBeLessThan(artifact.content.indexOf("## Relevant Context"));
    expect(artifact.includedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "support-ticket-writing-skill.triage-response" }),
        expect.objectContaining({ id: "internal-support.ticket-intake" })
      ])
    );
    expect(artifact.sources.every((source) => !("path" in source))).toBe(true);
    expect(JSON.stringify(artifact)).not.toContain(repoRoot);
  });

  it("builds Agent Kit JSON exports without local source paths", () => {
    const { agentKitPath, packsDir, skillsDir } = copyDemoObjectSet();
    fs.writeFileSync(
      path.join(agentKitPath, "exports", "json.yaml"),
      [
        "id: support-ticket-writing-kit-json",
        "name: Support Ticket Writing Kit JSON Export",
        "target: json_records",
        "format: json",
        "privacy_mode: redacted",
        "include:",
        "  context_packs:",
        "    - internal-support-kb-pack",
        "    - fake-product-line-pack",
        "  skills:",
        "    - support-ticket-writing-skill",
        "    - bug-report-structuring-skill",
        "exclude_tags:",
        "  - secret",
        "  - never_export",
        "  - imported_draft",
        "sections:",
        "  - included_skills",
        "  - relevant_context"
      ].join("\n"),
      "utf8"
    );
    fs.writeFileSync(
      path.join(agentKitPath, "rules", "compatibility.yaml"),
      fs
        .readFileSync(path.join(agentKitPath, "rules", "compatibility.yaml"), "utf8")
        .replace(/supported_targets:\r?\n(?:  - .+\r?\n)+/, "supported_targets:\n  - chatgpt\n  - claude\n  - codex\n  - json_records\n"),
      "utf8"
    );

    const artifact = buildAgentKitExport({
      agentKitPath,
      contextPacksDir: packsDir,
      skillsDir,
      profileId: "support-ticket-writing-kit-json",
      generatedAt: "2026-05-07T00:00:00.000Z"
    });
    const parsed = JSON.parse(artifact.content);

    expect(artifact.mimeType).toBe("application/json");
    expect(parsed.exportKind).toBe("agent_kit");
    expect(parsed.records.length).toBeGreaterThan(0);
    expect(parsed.skillDocuments.length).toBeGreaterThan(0);
    expect(JSON.stringify(parsed.sources)).not.toContain("path");
    expect(artifact.content).not.toContain(repoRoot);
  });

  it("never includes secret or never-export Context Pack records in Agent Kit output", () => {
    const { agentKitPath, packsDir, skillsDir } = copyDemoObjectSet();
    const secretRecord = path.join(packsDir, "internal-support-kb-pack", "records", "ticket-intake.md");
    fs.writeFileSync(
      secretRecord,
      `${fs
        .readFileSync(secretRecord, "utf8")
        .replace("privacy: public_safe", "privacy: secret")
        .replace("tags:\n  - support", "tags:\n  - support\n  - never_export")
        .trim()}\n\nSECRET AGENT KIT EXPORT SHOULD NOT INCLUDE THIS.\n`,
      "utf8"
    );
    fs.writeFileSync(
      path.join(agentKitPath, "exports", "full.yaml"),
      [
        "id: support-ticket-writing-kit-full",
        "name: Support Ticket Writing Kit Full Export",
        "target: codex",
        "format: markdown",
        "privacy_mode: full",
        "include:",
        "  context_packs:",
        "    - internal-support-kb-pack",
        "    - fake-product-line-pack",
        "  skills:",
        "    - support-ticket-writing-skill",
        "    - bug-report-structuring-skill",
        "exclude_tags:",
        "  - never_export",
        "  - imported_draft",
        "sections:",
        "  - relevant_context"
      ].join("\n"),
      "utf8"
    );

    const artifact = buildAgentKitExport({
      agentKitPath,
      contextPacksDir: packsDir,
      skillsDir,
      profileId: "support-ticket-writing-kit-full"
    });

    expect(artifact.content).not.toContain("SECRET AGENT KIT EXPORT SHOULD NOT INCLUDE THIS");
    expect(artifact.includedRecords.map((record) => record.id)).not.toContain("internal-support.ticket-intake");
    expect(artifact.excludedRecords).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "internal-support.ticket-intake" })])
    );
  });

  it("keeps private Context Pack records in redacted Agent Kit exports unless blocked by tags or rules", () => {
    const { agentKitPath, packsDir, skillsDir } = copyDemoObjectSet();
    const privateRecord = path.join(packsDir, "internal-support-kb-pack", "records", "ticket-intake.md");
    fs.writeFileSync(
      privateRecord,
      `${fs
        .readFileSync(privateRecord, "utf8")
        .replace("privacy: public_safe", "privacy: private")
        .trim()}\n\nPRIVATE CONTEXT SHOULD REMAIN IN REDACTED AGENT KIT EXPORTS.\n`,
      "utf8"
    );

    const artifact = buildAgentKitExport({
      agentKitPath,
      contextPacksDir: packsDir,
      skillsDir,
      profileId: "support-ticket-writing-kit-codex"
    });

    expect(artifact.includedRecords.map((record) => record.id)).toContain("internal-support.ticket-intake");
    expect(artifact.content).toContain("PRIVATE CONTEXT SHOULD REMAIN IN REDACTED AGENT KIT EXPORTS.");
    expect(artifact.excludedRecords.map((record) => record.id)).not.toContain("internal-support.ticket-intake");
  });

  it("excludes non-approved Context Pack records from Agent Kit exports by default", () => {
    const { agentKitPath, packsDir, skillsDir } = copyDemoObjectSet();
    const draftRecord = path.join(packsDir, "internal-support-kb-pack", "records", "ticket-intake.md");
    fs.writeFileSync(
      draftRecord,
      `${fs
        .readFileSync(draftRecord, "utf8")
        .replace("review_status: approved", "review_status: draft")
        .trim()}\n\nDRAFT AGENT KIT CONTEXT SHOULD NOT EXPORT.\n`,
      "utf8"
    );

    const artifact = buildAgentKitExport({
      agentKitPath,
      contextPacksDir: packsDir,
      skillsDir,
      profileId: "support-ticket-writing-kit-codex"
    });

    expect(artifact.content).not.toContain("DRAFT AGENT KIT CONTEXT SHOULD NOT EXPORT");
    expect(artifact.includedRecords.map((record) => record.id)).not.toContain("internal-support.ticket-intake");
    expect(artifact.excludedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "internal-support.ticket-intake", reason: expect.stringContaining("review status is draft") })
      ])
    );
  });

  it("honors Agent Kit export sections when reporting included records and sources", () => {
    const { agentKitPath, packsDir, skillsDir } = copyDemoObjectSet();
    fs.writeFileSync(
      path.join(agentKitPath, "exports", "context-only.yaml"),
      [
        "id: support-ticket-writing-kit-context-only",
        "name: Support Ticket Writing Kit Context Only Export",
        "target: codex",
        "format: markdown",
        "privacy_mode: redacted",
        "include:",
        "  context_packs:",
        "    - internal-support-kb-pack",
        "    - fake-product-line-pack",
        "  skills:",
        "    - support-ticket-writing-skill",
        "    - bug-report-structuring-skill",
        "exclude_tags:",
        "  - secret",
        "  - never_export",
        "  - imported_draft",
        "sections:",
        "  - relevant_context"
      ].join("\n"),
      "utf8"
    );

    const artifact = buildAgentKitExport({
      agentKitPath,
      contextPacksDir: packsDir,
      skillsDir,
      profileId: "support-ticket-writing-kit-context-only"
    });

    expect(artifact.content).not.toContain("## Agent Kit Summary");
    expect(artifact.content).not.toContain("## Included Skills");
    expect(artifact.includedRecords.map((record) => record.id)).not.toContain("support-ticket-writing-skill.triage-response");
    expect(artifact.sources.some((source) => source.id.startsWith("support-ticket-writing-skill:"))).toBe(false);
    expect(artifact.includedRecords).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "internal-support.ticket-intake" })])
    );
  });

  it("reports missing Agent Kit export dependency roots as sanitized ExportErrors", () => {
    expect(() =>
      buildAgentKitExport({
        agentKitPath: demoAgentKit("support-ticket-writing-kit"),
        contextPacksDir: path.join(os.tmpdir(), "missing-contextarr-packs-dir"),
        skillsDir: demoSkillsDir,
        profileId: "support-ticket-writing-kit-codex"
      })
    ).toThrow(ExportError);
  });

  it("excludes private, secret-tagged, and unapproved Skill documents", () => {
    const skillPath = copyDemoSkill();
    const corePath = path.join(skillPath, "instructions", "triage-response.md");
    const privatePath = path.join(skillPath, "instructions", "customer-safe-wording.md");
    const draftPath = path.join(skillPath, "examples", "ticket-intake.md");

    fs.writeFileSync(
      corePath,
      fs.readFileSync(corePath, "utf8").replace(/tags:\r?\n/, "tags:\n  - secret\n"),
      "utf8"
    );
    fs.writeFileSync(privatePath, fs.readFileSync(privatePath, "utf8").replace("privacy: public_safe", "privacy: private"), "utf8");
    fs.writeFileSync(draftPath, fs.readFileSync(draftPath, "utf8").replace("review_status: approved", "review_status: draft"), "utf8");

    const artifact = buildSkillExport({ skillPath, profileId: "support-ticket-writing-skill-codex" });

    expect(artifact.includedRecords.map((document) => document.id)).toEqual([
      "support-ticket-writing-skill.handoff-summary",
      "support-ticket-writing-skill.example-known-issue-update"
    ]);
    expect(artifact.excludedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "excluded-skill-document-1", title: "Excluded Skill Document", tags: [], sources: [] }),
        expect.objectContaining({ id: "excluded-skill-document-2", title: "Excluded Skill Document", tags: [], sources: [] }),
        expect.objectContaining({ id: "excluded-skill-document-3", title: "Excluded Skill Document", tags: [], sources: [] })
      ])
    );
    expect(JSON.stringify(artifact.excludedRecords)).not.toContain("Triage Response");
    expect(JSON.stringify(artifact.excludedRecords)).not.toContain("support-ticket-writing-skill.triage-response");
    expect(artifact.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "skill_document.excluded" })]));
  });

  it("honors Skill export section selection", () => {
    const skillPath = copyDemoSkill();
    const profilePath = path.join(skillPath, "exports", "codex.yaml");
    fs.writeFileSync(
      profilePath,
      fs
        .readFileSync(profilePath, "utf8")
        .replace(/sections:\r?\n(?:  - .+\r?\n?)+/m, "sections:\n  - instructions\n"),
      "utf8"
    );

    const artifact = buildSkillExport({ skillPath, profileId: "support-ticket-writing-skill-codex" });

    expect(artifact.includedRecords.map((document) => document.id)).toEqual([
      "support-ticket-writing-skill.triage-response",
      "support-ticket-writing-skill.customer-safe-wording",
      "support-ticket-writing-skill.handoff-summary"
    ]);
    expect(artifact.content).not.toContain("Known Issue Update");
    expect(artifact.content).not.toContain("## Safety Rules");
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

  it("excludes private and sensitive records in redacted pack exports", () => {
    const packPath = copyFixture();
    const privatePath = path.join(packPath, "records", "private.md");
    const sensitivePath = path.join(packPath, "records", "sensitive.md");
    const baseRecord = fs.readFileSync(path.join(packPath, "records", "overview.md"), "utf8");

    fs.writeFileSync(
      privatePath,
      baseRecord
        .replace("id: valid.overview", "id: valid.private")
        .replace("title: Valid Overview", "title: Private Context")
        .replace("privacy: public_safe", "privacy: private"),
      "utf8"
    );
    fs.writeFileSync(
      sensitivePath,
      baseRecord
        .replace("id: valid.overview", "id: valid.sensitive")
        .replace("title: Valid Overview", "title: Sensitive Context")
        .replace("privacy: public_safe", "privacy: sensitive"),
      "utf8"
    );
    fs.writeFileSync(
      path.join(packPath, "exports", "codex.yaml"),
      fs
        .readFileSync(path.join(packPath, "exports", "codex.yaml"), "utf8")
        .replace("    - valid.overview", "    - valid.overview\n    - valid.private\n    - valid.sensitive"),
      "utf8"
    );

    const artifact = buildPackExport({ packPath, profileId: "codex-context" });

    expect(artifact.includedRecords.map((record) => record.id)).toEqual(["valid.overview"]);
    expect(artifact.excludedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "valid.private", reason: expect.stringContaining("private") }),
        expect.objectContaining({ id: "valid.sensitive", reason: expect.stringContaining("sensitive") })
      ])
    );
  });

  it("excludes non-approved Context Pack records from pack exports by default", () => {
    const packPath = copyFixture();
    const draftPath = path.join(packPath, "records", "draft.md");
    const baseRecord = fs.readFileSync(path.join(packPath, "records", "overview.md"), "utf8");
    fs.writeFileSync(
      draftPath,
      baseRecord
        .replace("id: valid.overview", "id: valid.draft")
        .replace("title: Valid Overview", "title: Draft Context")
        .replace("review_status: approved", "review_status: draft"),
      "utf8"
    );
    fs.writeFileSync(
      path.join(packPath, "exports", "codex.yaml"),
      fs.readFileSync(path.join(packPath, "exports", "codex.yaml"), "utf8").replace("    - valid.overview", "    - valid.overview\n    - valid.draft"),
      "utf8"
    );

    const artifact = buildPackExport({ packPath, profileId: "codex-context" });

    expect(artifact.includedRecords.map((record) => record.id)).toEqual(["valid.overview"]);
    expect(artifact.excludedRecords).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "valid.draft", reason: expect.stringContaining("review status is draft") })])
    );
    expect(artifact.content).not.toContain("Draft Context");
  });

  it("omits local source paths from pack exports", () => {
    const packPath = copyFixture();
    const artifact = buildPackExport({ packPath, profileId: "codex-context" });

    expect(JSON.stringify(artifact.sources)).not.toContain("path");
    expect(artifact.content).not.toContain("../raw/manual-note.md");
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

  it("rejects pack export manifest paths that resolve outside the pack root before validation reads content", () => {
    const packPath = copyFixture();
    const outsideRecords = path.join(path.dirname(packPath), "outside-records");
    fs.cpSync(path.join(packPath, "records"), outsideRecords, { recursive: true });
    const manifestPath = path.join(packPath, "contextarr-pack.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    manifest.recordsPath = "../outside-records";
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

    expect(() => buildPackExport({ packPath, profileId: "codex-context" })).toThrow(/outside the object root/);
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

  it("excludes non-approved Context Pack records from composed exports by default", () => {
    const packPath = copyFixture();
    const draftPath = path.join(packPath, "records", "review-draft.md");
    const baseRecord = fs.readFileSync(path.join(packPath, "records", "overview.md"), "utf8");
    fs.writeFileSync(
      draftPath,
      baseRecord
        .replace("id: valid.overview", "id: valid.review-draft")
        .replace("title: Valid Overview", "title: Review Draft")
        .replace("review_status: approved", "review_status: draft"),
      "utf8"
    );

    const artifact = buildComposedExport({
      target: "codex",
      format: "markdown",
      selections: [{ packPath, recordIds: ["valid.overview", "valid.review-draft"] }],
      generatedAt: "2026-05-07T00:00:00.000Z"
    });

    expect(artifact.includedRecords.map((record) => record.id)).toEqual(["valid.overview"]);
    expect(artifact.excludedRecords).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "valid.review-draft", reason: expect.stringContaining("review status is draft") })])
    );
    expect(artifact.content).not.toContain("Review Draft");
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
