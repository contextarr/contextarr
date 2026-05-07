import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validatePack } from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");

const expectedPackIds = [
  "ai-workstation-pack",
  "jellyfin-server-pack",
  "claude-code-project-pack",
  "internal-support-kb-pack",
  "fake-product-line-pack"
];

const requiredFiles = [
  "contextarr-pack.json",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "sources/sources.yaml",
  "exports/chatgpt.yaml",
  "exports/claude.yaml",
  "exports/codex.yaml",
  "rules/validation.yaml",
  "rules/redaction.yaml",
  "rules/freshness.yaml"
];

describe("demo packs", () => {
  it("includes the expected public-safe demo pack directories", () => {
    const actualPackIds = fs
      .readdirSync(demoPacksDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(actualPackIds).toEqual([...expectedPackIds].sort());
  });

  it.each(expectedPackIds)("%s has the required files and exactly five records", (packId) => {
    const packPath = path.join(demoPacksDir, packId);

    for (const requiredFile of requiredFiles) {
      expect(fs.existsSync(path.join(packPath, requiredFile)), `${packId} missing ${requiredFile}`).toBe(true);
    }

    const recordFiles = fs.readdirSync(path.join(packPath, "records")).filter((file) => file.endsWith(".md"));

    expect(recordFiles).toHaveLength(5);
  });

  it.each(expectedPackIds)("%s validates with zero errors", (packId) => {
    const result = validatePack(path.join(demoPacksDir, packId));

    expect(result.summary.errors, JSON.stringify(result.issues, null, 2)).toBe(0);
    expect(result.valid).toBe(true);
  });
});
