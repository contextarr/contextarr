import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  formatAgentKitTemplateValidationResult,
  formatAgentKitValidationResult,
  validateAgentKit,
  validateAgentKitTemplate
} from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixturesDir = path.join(repoRoot, "packages/agent-kit-validator/test/fixtures");
const templatesDir = path.join(repoRoot, "agent-kit-templates");
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

function writeTemplateFixture(data: Record<string, unknown>, extraFiles: Record<string, string> = {}): string {
  const dir = path.join(tempDir(), String(data.id ?? "template-fixture"));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "contextarr-agent-kit-template.json"), `${JSON.stringify(data, null, 2)}\n`, "utf8");
  for (const [relativeFile, content] of Object.entries(extraFiles)) {
    const file = path.join(dir, relativeFile);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, "utf8");
  }
  return dir;
}

function validTemplateFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "valid-template",
    name: "Valid Agent Kit Template",
    version: "1.0.0",
    description: "Public-safe test template.",
    category: "testing",
    visibility: "local",
    trustLevel: "official",
    author: "Contextarr Tests",
    license: "MIT",
    createdAt: "2026-05-08T00:00:00Z",
    updatedAt: "2026-05-08T00:00:00Z",
    lastReviewedAt: "2026-05-08T00:00:00Z",
    containsPersonalData: false,
    containsExecutableCode: false,
    requiresNetwork: false,
    permissions: {
      readVault: false,
      writeDrafts: false,
      runCommands: false,
      networkAccess: false,
      browserAutomation: false,
      toolExecution: false
    },
    suggestedAgentKit: {
      id: "valid-template-kit",
      name: "Valid Template Kit",
      goal: "Create a public-safe draft Agent Kit for testing.",
      description: "Combines fake Context Pack and Skill references.",
      contextPacks: ["valid-minimal-pack"],
      skills: ["valid-skill"],
      target: "codex",
      format: "markdown",
      privacyMode: "redacted",
      excludeTags: ["secret", "never_export", "imported_draft"],
      tokenBudget: 12000
    },
    safetyNotes: ["Review the draft before export."],
    assets: {
      accentColor: "#38bdf8"
    },
    compatibility: {
      contextarr: ">=0.3.0"
    },
    ...overrides
  };
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

  it("allows non-selected export profiles for additional supported targets", () => {
    const dir = copyFixtureToTemp("valid-agent-kit", "multi-target-agent-kit");
    fs.writeFileSync(
      path.join(dir, "exports/chatgpt.yaml"),
      `id: valid-agent-kit-chatgpt
name: Valid Agent Kit ChatGPT Export
target: chatgpt
format: markdown
privacy_mode: redacted
include:
  context_packs:
    - valid-minimal-pack
  skills:
    - valid-skill
exclude_tags:
  - secret
  - never_export
token_budget: 12000
sections:
  - kit_summary
  - included_skills
  - relevant_context
`,
      "utf8"
    );
    replaceInFile(
      path.join(dir, "rules/compatibility.yaml"),
      "supported_targets:\n  - codex",
      "supported_targets:\n  - codex\n  - chatgpt"
    );

    const result = validateAgentKit(dir, {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(true);
    expect(result.issues).not.toContainEqual(expect.objectContaining({ code: "agent_kit_export_profile.target_mismatch" }));
  });

  it("fails non-selected export profiles with unsupported targets", () => {
    const dir = copyFixtureToTemp("valid-agent-kit", "unsupported-alternate-target-agent-kit");
    fs.writeFileSync(
      path.join(dir, "exports/chatgpt.yaml"),
      `id: valid-agent-kit-chatgpt
name: Valid Agent Kit ChatGPT Export
target: chatgpt
format: markdown
privacy_mode: redacted
include:
  context_packs:
    - valid-minimal-pack
  skills:
    - valid-skill
exclude_tags:
  - secret
  - never_export
token_budget: 12000
sections:
  - kit_summary
  - included_skills
  - relevant_context
`,
      "utf8"
    );

    const result = validateAgentKit(dir, {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_compatibility.target_blocked" }));
  });

  it("fails non-selected export profiles that omit required Context Packs", () => {
    const dir = copyFixtureToTemp("valid-agent-kit", "missing-required-pack-alternate-profile-agent-kit");
    fs.writeFileSync(
      path.join(dir, "exports/chatgpt.yaml"),
      `id: valid-agent-kit-chatgpt
name: Valid Agent Kit ChatGPT Export
target: chatgpt
format: markdown
privacy_mode: redacted
include:
  context_packs: []
  skills:
    - valid-skill
exclude_tags:
  - secret
  - never_export
token_budget: 12000
sections:
  - kit_summary
  - included_skills
  - relevant_context
`,
      "utf8"
    );
    replaceInFile(
      path.join(dir, "rules/compatibility.yaml"),
      "supported_targets:\n  - codex",
      "supported_targets:\n  - codex\n  - chatgpt"
    );

    const result = validateAgentKit(dir, {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_compatibility.context_pack_required" }));
  });

  it("fails non-selected export profiles that omit required Skills", () => {
    const dir = copyFixtureToTemp("valid-agent-kit", "missing-required-skill-alternate-profile-agent-kit");
    fs.writeFileSync(
      path.join(dir, "exports/chatgpt.yaml"),
      `id: valid-agent-kit-chatgpt
name: Valid Agent Kit ChatGPT Export
target: chatgpt
format: markdown
privacy_mode: redacted
include:
  context_packs:
    - valid-minimal-pack
  skills: []
exclude_tags:
  - secret
  - never_export
token_budget: 12000
sections:
  - kit_summary
  - included_skills
  - relevant_context
`,
      "utf8"
    );
    replaceInFile(
      path.join(dir, "rules/compatibility.yaml"),
      "supported_targets:\n  - codex",
      "supported_targets:\n  - codex\n  - chatgpt"
    );

    const result = validateAgentKit(dir, {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_compatibility.skill_required" }));
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

  it("validates the committed public-safe Agent Kit templates", () => {
    const templateDirs = fs.readdirSync(templatesDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());

    expect(templateDirs.map((entry) => entry.name).sort()).toEqual([
      "coding-task-kit-template",
      "contractor-handoff-kit-template",
      "homelab-troubleshooting-kit-template",
      "internal-kb-assistant-kit-template",
      "product-comparison-kit-template",
      "research-brief-kit-template",
      "security-review-kit-template",
      "support-ticket-kit-template"
    ]);

    for (const templateDir of templateDirs) {
      const result = validateAgentKitTemplate(path.join(templatesDir, templateDir.name), {
        contextPacksDir: path.join(repoRoot, "demo-packs"),
        skillsDir: path.join(repoRoot, "demo-skills")
      });

      expect(result.valid, formatAgentKitTemplateValidationResult(result)).toBe(true);
      expect(result.summary).toMatchObject({ errors: 0, warnings: 0, infos: 0 });
    }
  });

  it("fails Agent Kit templates with missing references", () => {
    const dir = writeTemplateFixture(validTemplateFixture());
    replaceInFile(path.join(dir, "contextarr-agent-kit-template.json"), /valid-minimal-pack/g, "missing-pack");
    replaceInFile(path.join(dir, "contextarr-agent-kit-template.json"), /valid-skill/g, "missing-skill");

    const result = validateAgentKitTemplate(dir, {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_template.context_pack_missing" }));
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_template.skill_missing" }));
  });

  it("fails unsafe Agent Kit template permissions and executable claims", () => {
    const dir = writeTemplateFixture(
      validTemplateFixture({
        containsExecutableCode: true,
        requiresNetwork: true,
        permissions: {
          readVault: false,
          writeDrafts: false,
          runCommands: true,
          networkAccess: false,
          browserAutomation: false,
          toolExecution: false
        }
      })
    );

    const result = validateAgentKitTemplate(dir, {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_template.schema" }));
  });

  it("fails Agent Kit templates with invalid target or format", () => {
    const template = validTemplateFixture();
    template.suggestedAgentKit = {
      ...(template.suggestedAgentKit as Record<string, unknown>),
      target: "shell",
      format: "binary"
    };
    const dir = writeTemplateFixture(template);

    const result = validateAgentKitTemplate(dir, {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_template.schema" }));
  });

  it("fails Agent Kit templates with script files and private-data-like content", () => {
    const dir = writeTemplateFixture(validTemplateFixture(), {
      "tools/setup.js": "console.log('not allowed');\n",
      "notes.md": "api_key = abcdefghijklmnop\n"
    });

    const result = validateAgentKitTemplate(dir, {
      contextPacksDir: path.join(fixturesDir, "context-packs"),
      skillsDir: path.join(fixturesDir, "skills")
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit.script_file" }));
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "agent_kit_scan.credential_pattern" }));
  });
});
