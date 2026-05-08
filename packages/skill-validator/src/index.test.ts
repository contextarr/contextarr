import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatSkillValidationResult, validateSkill } from "./index";

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../test/fixtures");

function fixture(name: string): string {
  return path.join(fixturesDir, name);
}

describe("validateSkill", () => {
  it("passes a valid non-executable Skill fixture", () => {
    const result = validateSkill(fixture("valid-skill"));

    expect(result.valid).toBe(true);
    expect(result.summary.errors).toBe(0);
    expect(result.summary.warnings).toBe(0);
    expect(formatSkillValidationResult(result)).toContain("Skill validation passed");
  });

  it("reports a missing Skill manifest", () => {
    const result = validateSkill(fixture("missing-manifest-skill"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "skill_manifest.missing" }));
  });

  it("rejects unsafe Skill manifest permissions", () => {
    const result = validateSkill(fixture("invalid-permissions-skill"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "skill_manifest.run_commands" }));
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "skill_manifest.tool_execution" }));
  });

  it("rejects missing source references", () => {
    const result = validateSkill(fixture("missing-source-reference-skill"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "instruction.source_missing" }));
  });

  it("rejects script files inside Skills", () => {
    const result = validateSkill(fixture("script-file-skill"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "skill.script_file" }));
  });

  it("rejects shell command, hidden instruction, and credential request patterns", () => {
    const shellResult = validateSkill(fixture("unsafe-instruction-skill"));
    const credentialResult = validateSkill(fixture("credential-request-skill"));

    expect(shellResult.valid).toBe(false);
    expect(shellResult.issues).toContainEqual(expect.objectContaining({ code: "scan.shell_command" }));
    expect(shellResult.issues).toContainEqual(expect.objectContaining({ code: "scan.hidden_instruction" }));
    expect(credentialResult.valid).toBe(false);
    expect(credentialResult.issues).toContainEqual(expect.objectContaining({ code: "scan.credential_request" }));
  });

  it("rejects network-directed instructions and relaxed safety rules", () => {
    const networkResult = validateSkill(fixture("network-instruction-skill"));
    const relaxedResult = validateSkill(fixture("relaxed-safety-rules-skill"));

    expect(networkResult.valid).toBe(false);
    expect(networkResult.issues).toContainEqual(expect.objectContaining({ code: "scan.network_instruction" }));
    expect(relaxedResult.valid).toBe(false);
    expect(relaxedResult.issues).toContainEqual(expect.objectContaining({ code: "rules.safety.relaxed_disallowed" }));
  });

  it("enforces custom safety patterns from rules/safety.yaml", () => {
    const result = validateSkill(fixture("custom-safety-pattern-skill"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "rules.safety.pattern_match" }));
  });
});
