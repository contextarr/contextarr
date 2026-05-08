import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadSkills } from "./skill-loader";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoSkillsDir = path.join(repoRoot, "demo-skills");
const validatorFixturesDir = path.join(repoRoot, "packages/skill-validator/test/fixtures");
const validSkillFixture = path.join(validatorFixturesDir, "valid-skill");

function withTempSkills(mutator: (root: string, skillPath: string) => void): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-skills-"));
  const skillPath = path.join(root, "valid-skill");
  fs.cpSync(validSkillFixture, skillPath, { recursive: true });
  mutator(root, skillPath);
  return root;
}

describe("loadSkills", () => {
  it("loads all eight demo Skills", () => {
    const result = loadSkills(demoSkillsDir);

    expect(result.skipped).toHaveLength(0);
    expect(result.skills.map((skill) => skill.manifest.id).sort()).toEqual(
      [
        "support-ticket-writing-skill",
        "bug-report-structuring-skill",
        "implementation-planning-skill",
        "research-synthesis-skill",
        "security-review-skill",
        "homelab-troubleshooting-skill",
        "internal-kb-answering-skill",
        "contractor-briefing-skill"
      ].sort()
    );
  });

  it("loads expected demo Skill totals", () => {
    const result = loadSkills(demoSkillsDir);

    expect(result.skills.reduce((count, skill) => count + skill.instructions.length, 0)).toBe(24);
    expect(result.skills.reduce((count, skill) => count + skill.examples.length, 0)).toBe(16);
    expect(result.skills.reduce((count, skill) => count + skill.sources.length, 0)).toBe(24);
    expect(result.skills.reduce((count, skill) => count + skill.exportProfiles.length, 0)).toBe(48);
  });

  it("skips invalid Skills without failing the whole load", () => {
    const result = loadSkills(validatorFixturesDir);

    expect(result.skills.map((skill) => skill.manifest.id)).toEqual(["valid-skill"]);
    expect(result.skipped.length).toBeGreaterThan(1);
  });

  it("reports a missing Skills directory without throwing", () => {
    const result = loadSkills(path.join(os.tmpdir(), "contextarr-skills-does-not-exist"));

    expect(result.skills).toHaveLength(0);
    expect(result.skipped).toEqual(
      expect.arrayContaining([expect.objectContaining({ issues: [expect.objectContaining({ code: "skills_dir.missing" })] })])
    );
  });

  it("loads warning-only optional folders as empty collections", () => {
    const tempRoot = withTempSkills((_root, skillPath) => {
      fs.rmSync(path.join(skillPath, "examples"), { recursive: true, force: true });
      fs.rmSync(path.join(skillPath, "exports"), { recursive: true, force: true });
    });

    try {
      const result = loadSkills(tempRoot);

      expect(result.skipped).toHaveLength(0);
      expect(result.skills[0]).toMatchObject({ manifest: { id: "valid-skill" }, examples: [], exportProfiles: [] });
      expect(result.skills[0].validation.summary.warnings).toBeGreaterThanOrEqual(2);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("skips malformed example content without failing the whole load", () => {
    const tempRoot = withTempSkills((_root, skillPath) => {
      fs.writeFileSync(path.join(skillPath, "examples", "bad.md"), "---\nid: bad-example\n---\n\nBad example.", "utf8");
    });

    try {
      const result = loadSkills(tempRoot);

      expect(result.skills).toHaveLength(0);
      expect(result.skipped).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            skillId: "valid-skill",
            issues: expect.arrayContaining([expect.objectContaining({ code: "example.schema" })])
          })
        ])
      );
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
