import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validatePack } from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixturesDir = path.join(repoRoot, "packages/pack-validator/test/fixtures");

function fixture(name: string) {
  return path.join(fixturesDir, name);
}

function issueCodes(packName: string) {
  return validatePack(fixture(packName), { currentDate: "2026-05-08T00:00:00Z" }).issues.map((issue) => issue.code);
}

describe("Context Pack v1 security fixture coverage", () => {
  it("blocks unsafe activation permissions", () => {
    expect(issueCodes("invalid-permissions-pack")).toEqual(
      expect.arrayContaining([
        "manifest.executable_code",
        "manifest.requires_network",
        "manifest.run_commands",
        "manifest.network_access"
      ])
    );
  });

  it("blocks executable and script files in packs", () => {
    expect(issueCodes("executable-file-pack")).toEqual(expect.arrayContaining(["pack.executable_file", "pack.script_file"]));
  });

  it("blocks credential-like content", () => {
    expect(issueCodes("secret-content-pack")).toContain("scan.credential_pattern");
  });

  it("blocks shell-command-like record content", () => {
    expect(issueCodes("shell-command-content-pack")).toContain("scan.shell_command");
  });

  it("keeps public-safe demo packs free of security issues", () => {
    const demoPacks = [
      "ai-workstation-pack",
      "jellyfin-server-pack",
      "claude-code-project-pack",
      "internal-support-kb-pack",
      "fake-product-line-pack"
    ];

    for (const packId of demoPacks) {
      const result = validatePack(path.join(repoRoot, "demo-packs", packId), {
        currentDate: "2026-05-08T00:00:00Z"
      });
      expect(result.summary.errors, packId).toBe(0);
      expect(result.summary.warnings, packId).toBe(0);
    }
  });
});
