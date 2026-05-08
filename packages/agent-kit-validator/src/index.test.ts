import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { formatAgentKitValidationResult, validateAgentKit } from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixturesDir = path.join(repoRoot, "packages/agent-kit-validator/test/fixtures");
const tempDirs: string[] = [];

function fixture(name: string): string {
  return path.join(fixturesDir, name);
}

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-agent-kit-validator-"));
  tempDirs.push(dir);
  return dir;
}

function copyFixtureToTemp(fixtureName: string, tempName: string): string {
  const dir = path.join(tempDir(), tempName);
  fs.cpSync(fixture(fixtureName), dir, { recursive: true });
  return dir;
}

function replaceInFile(file: string, searchValue: string | RegExp, replaceValue: string): void {
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(searchValue, replaceValue), "utf8");
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("Agent Kit validator", () => {
  it("passes a valid non-executable Agent Kit", () => {
    const result = validateAgentKit(fixture("valid-agent-kit"));

    expect(result).toMatchObject({
      agentKitId: "valid-agent-kit",
      valid: true,
      summary: {
        errors: 0
      }
    });
  });

  it("does not expose absolute local paths in result or formatted output", () => {
    const result = validateAgentKit(fixture("valid-agent-kit"));
    const formatted = formatAgentKitValidationResult(result);
    const serialized = JSON.stringify(result);

    expect(formatted).toContain("valid-agent-kit");
    expect(formatted).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(serialized).not.toMatch(/[A-Za-z]:[\\/]/);
  });

  it("fails missing Context Pack references", () => {
    const result = validateAgentKit(fixture("missing-context-pack-agent-kit"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit.context_pack_missing" }));
  });

  it("fails missing Skill references", () => {
    const result = validateAgentKit(fixture("missing-skill-agent-kit"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit.skill_missing" }));
  });

  it("fails referenced Context Packs that exist but are invalid", () => {
    const dir = copyFixtureToTemp("valid-agent-kit", "invalid-pack-agent-kit");
    replaceInFile(path.join(dir, "contextarr-agent-kit.json"), /valid-minimal-pack/g, "invalid-permissions-pack");
    replaceInFile(path.join(dir, "exports/codex.yaml"), /valid-minimal-pack/g, "invalid-permissions-pack");
    replaceInFile(path.join(dir, "rules/compatibility.yaml"), /valid-minimal-pack/g, "invalid-permissions-pack");

    const result = validateAgentKit(dir, {
      contextPacksDir: path.join(repoRoot, "packages/pack-validator/test/fixtures"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit.context_pack_invalid" }));
  });

  it("fails referenced Skills that exist but are invalid", () => {
    const dir = copyFixtureToTemp("valid-agent-kit", "invalid-skill-agent-kit");
    replaceInFile(path.join(dir, "contextarr-agent-kit.json"), /valid-skill/g, "invalid-permissions-skill");
    replaceInFile(path.join(dir, "exports/codex.yaml"), /valid-skill/g, "invalid-permissions-skill");
    replaceInFile(path.join(dir, "rules/compatibility.yaml"), /valid-skill/g, "invalid-permissions-skill");

    const result = validateAgentKit(dir, {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(repoRoot, "packages/skill-validator/test/fixtures")
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit.skill_invalid" }));
  });

  it("warns when an included Skill does not declare the Agent Kit target", () => {
    const dir = copyFixtureToTemp("valid-agent-kit", "skill-target-warning-agent-kit");
    replaceInFile(path.join(dir, "contextarr-agent-kit.json"), /"target": "codex"/, '"target": "markdown"');
    replaceInFile(path.join(dir, "exports/codex.yaml"), /target: codex/, "target: markdown");
    replaceInFile(path.join(dir, "rules/compatibility.yaml"), /  - codex/g, "  - markdown");
    replaceInFile(path.join(dir, "rules/compatibility.yaml"), /target: codex/g, "target: markdown");

    const result = validateAgentKit(dir, {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit.skill_target_missing" }));
  });

  it("fails incompatible Agent Kit targets", () => {
    const result = validateAgentKit(fixture("incompatible-target-agent-kit"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_export_profile.target_mismatch" }));
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_compatibility.target_blocked" }));
  });

  it("fails executable or runtime claims", () => {
    const result = validateAgentKit(fixture("execution-claim-agent-kit"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_manifest.executable_code" }));
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_manifest.requires_network" }));
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_manifest.run_commands" }));
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit.execution_claimed" }));
  });

  it("warns when sensitive fixture context uses full privacy mode", () => {
    const result = validateAgentKit(fixture("sensitive-unredacted-agent-kit"));

    expect(result.valid).toBe(true);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_policy.sensitive_without_redaction" }));
  });

  it("fails public-safe profiles that include sensitive fixture context", () => {
    const result = validateAgentKit(fixture("public-safe-sensitive-agent-kit"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_policy.sensitive_public_safe" }));
  });

  it("fails Agent Kits that claim draft mutation permissions", () => {
    const result = validateAgentKit(fixture("mutating-agent-kit"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_manifest.write_drafts" }));
  });

  it("rejects manifest paths that escape the Agent Kit root", () => {
    const result = validateAgentKit(fixture("escape-path-agent-kit"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_manifest.path_outside_root" }));
  });

  it("rejects manifest paths that resolve outside the Agent Kit root through links", () => {
    const root = tempDir();
    const dir = path.join(root, "link-agent-kit");
    const externalRules = path.join(root, "external-rules");
    fs.cpSync(fixture("valid-agent-kit"), dir, { recursive: true });
    fs.mkdirSync(externalRules, { recursive: true });
    fs.writeFileSync(path.join(externalRules, "compatibility.yaml"), "supported_targets:\n  - codex\n", "utf8");
    fs.writeFileSync(path.join(externalRules, "redaction.yaml"), "redact_tags:\n  - secret\npatterns: []\n", "utf8");
    fs.rmSync(path.join(dir, "rules"), { recursive: true, force: true });

    try {
      fs.symlinkSync(externalRules, path.join(dir, "rules"), "junction");
    } catch {
      fs.symlinkSync(externalRules, path.join(dir, "rules"), "dir");
    }

    const result = validateAgentKit(dir, {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_manifest.path_outside_root" }));
  });

  it("supports explicit reference roots for standalone Agent Kit validation", () => {
    const result = validateAgentKit(fixture("valid-agent-kit"), {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(true);
  });

  it("allows normal documentation URLs without treating them as network actions", () => {
    const dir = copyFixtureToTemp("valid-agent-kit", "valid-agent-kit-with-doc-url");
    fs.appendFileSync(path.join(dir, "README.md"), "\nReference docs: https://example.com/contextarr-agent-kit\n", "utf8");

    const result = validateAgentKit(dir, {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(true);
    expect(result.issues).not.toContainEqual(expect.objectContaining({ code: "agent_kit_scan.network_instruction" }));
  });

  it("blocks credential requests, action-oriented network instructions, and shell command text", () => {
    const dir = copyFixtureToTemp("valid-agent-kit", "unsafe-text-agent-kit");
    fs.appendFileSync(
      path.join(dir, "README.md"),
      "\nPlease paste your API key, then visit https://example.com/admin, then run rm -rf temp-output.\n",
      "utf8"
    );

    const result = validateAgentKit(dir, {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_scan.credential_request" }));
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_scan.network_instruction" }));
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_scan.shell_command" }));
  });

  it("fails redacted profiles that are missing redaction rules", () => {
    const result = validateAgentKit(fixture("missing-redaction-agent-kit"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_rules.redaction_missing" }));
  });

  it("rejects reserved cloud, registry, telemetry, and runtime capability fields", () => {
    const result = validateAgentKit(fixture("reserved-field-agent-kit"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit.reserved_capability" }));
  });
});
