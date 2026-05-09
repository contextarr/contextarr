import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { toValidationReportV1, validatePack } from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const compatibilityDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../test/compatibility");

const canonicalTargets = new Set(["chatgpt", "claude", "codex", "generic_markdown", "json", "agents_md", "claude_md", "llms_txt"]);

describe("Context Pack v1 compatibility", () => {
  it("keeps every demo pack valid with canonical export targets", () => {
    for (const entry of fs.readdirSync(demoPacksDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const packPath = path.join(demoPacksDir, entry.name);
      const result = validatePack(packPath, { currentDate: "2026-05-08T00:00:00Z" });

      expect(result.valid, entry.name).toBe(true);
      expect(result.summary.errors, entry.name).toBe(0);
      expect(result.summary.warnings, entry.name).toBe(0);
      expect(result.validationStatus, entry.name).toBe("valid");
      expect(result.exportReadiness.status, entry.name).toBe("ready");
      expect(result.exportReadiness.profiles, entry.name).toHaveLength(8);
      for (const profile of result.exportReadiness.profiles) {
        expect(canonicalTargets.has(profile.target), `${entry.name}:${profile.id}:${profile.target}`).toBe(true);
      }
    }
  });

  it("keeps a legacy v0.1-style valid pack compatible with validation report v1", () => {
    const packPath = path.join(compatibilityDir, "legacy-v0-1-pack");
    const result = validatePack(packPath, { currentDate: "2026-05-08T00:00:00Z" });
    const report = toValidationReportV1(result);

    expect(result.valid).toBe(true);
    expect(result.summary.errors).toBe(0);
    expect(result.summary.warnings).toBe(0);
    expect(result.validationStatus).toBe("valid");
    expect(report.schemaVersion).toBe("contextarr.validation-report.v1");
    expect(report.summary).toMatchObject({
      redactionHits: 0,
      exportProfilesReady: 1,
      staleSources: 0,
      licenseWarnings: 0,
      docsWarnings: 0
    });
    expect(report.exportReadiness).toMatchObject({ status: "ready" });
  });
});
