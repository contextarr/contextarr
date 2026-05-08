import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateAgentKit } from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoAgentKitsDir = path.join(repoRoot, "demo-agent-kits");

const expectedAgentKits = [
  "claude-code-implementation-kit",
  "contextarr-renderer-implementation-kit",
  "contractor-handoff-kit",
  "homelab-troubleshooting-kit",
  "internal-kb-answering-kit",
  "product-research-kit",
  "security-review-kit",
  "support-ticket-writing-kit"
];

const requiredFiles = [
  "contextarr-agent-kit.json",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "exports/chatgpt.yaml",
  "exports/claude.yaml",
  "exports/codex.yaml",
  "rules/validation.yaml",
  "rules/redaction.yaml",
  "rules/compatibility.yaml",
  "examples/sample-export.md"
];

describe("demo Agent Kits", () => {
  it("contains exactly the eight public-safe demo Agent Kits", () => {
    const directories = fs
      .readdirSync(demoAgentKitsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(directories).toEqual(expectedAgentKits);
  });

  it("includes the required manifest, docs, profiles, rules, and examples", () => {
    for (const kitId of expectedAgentKits) {
      for (const relativeFile of requiredFiles) {
        expect(fs.existsSync(path.join(demoAgentKitsDir, kitId, relativeFile)), `${kitId} missing ${relativeFile}`).toBe(true);
      }
    }
  });

  it("keeps every demo Agent Kit data-only and public-safe", () => {
    for (const kitId of expectedAgentKits) {
      const manifest = JSON.parse(fs.readFileSync(path.join(demoAgentKitsDir, kitId, "contextarr-agent-kit.json"), "utf8"));

      expect(manifest).toMatchObject({
        id: kitId,
        visibility: "local",
        trustLevel: "official",
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
        target: "codex",
        exportProfile: `${kitId}-codex`,
        privacyMode: "redacted"
      });
      expect(manifest.contextPacks.length).toBeGreaterThan(0);
      expect(manifest.skills.length).toBeGreaterThan(0);
    }
  });

  it("validates every demo Agent Kit with zero issues", () => {
    for (const kitId of expectedAgentKits) {
      const result = validateAgentKit(path.join(demoAgentKitsDir, kitId));

      expect(result.valid, JSON.stringify(result.issues, null, 2)).toBe(true);
      expect(result.summary).toEqual({ errors: 0, warnings: 0, infos: 0 });
    }
  });
});
