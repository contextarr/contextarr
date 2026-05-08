import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateSkill } from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoSkillsDir = path.join(repoRoot, "demo-skills");

const expectedSkillIds = [
  "bug-report-structuring-skill",
  "contractor-briefing-skill",
  "homelab-troubleshooting-skill",
  "implementation-planning-skill",
  "internal-kb-answering-skill",
  "research-synthesis-skill",
  "security-review-skill",
  "support-ticket-writing-skill"
];

const requiredFiles = [
  "contextarr-skill.json",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "sources/sources.yaml",
  "exports/chatgpt.yaml",
  "exports/claude.yaml",
  "exports/codex.yaml",
  "exports/markdown.yaml",
  "rules/safety.yaml",
  "rules/validation.yaml",
  "rules/freshness.yaml"
];

describe("demo skills", () => {
  it("includes the expected public-safe demo Skill directories", () => {
    const actualSkillIds = fs
      .readdirSync(demoSkillsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(actualSkillIds).toEqual([...expectedSkillIds].sort());
  });

  it.each(expectedSkillIds)("%s has the required files, instructions, and examples", (skillId) => {
    const skillPath = path.join(demoSkillsDir, skillId);

    for (const requiredFile of requiredFiles) {
      expect(fs.existsSync(path.join(skillPath, requiredFile)), `${skillId} missing ${requiredFile}`).toBe(true);
    }

    const instructionFiles = fs.readdirSync(path.join(skillPath, "instructions")).filter((file) => file.endsWith(".md"));
    const exampleFiles = fs.readdirSync(path.join(skillPath, "examples")).filter((file) => file.endsWith(".md"));

    expect(instructionFiles).toHaveLength(3);
    expect(exampleFiles).toHaveLength(2);
  });

  it.each(expectedSkillIds)("%s validates with zero errors", (skillId) => {
    const result = validateSkill(path.join(demoSkillsDir, skillId));

    expect(result.summary.errors, JSON.stringify(result.issues, null, 2)).toBe(0);
    expect(result.summary.warnings, JSON.stringify(result.issues, null, 2)).toBe(0);
    expect(result.valid).toBe(true);
  });
});
