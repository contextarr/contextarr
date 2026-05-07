import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatValidationResult, validatePack } from "./index";

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../test/fixtures");

function fixture(name: string): string {
  return path.join(fixturesDir, name);
}

describe("validatePack", () => {
  it("validates a minimal valid pack", () => {
    const result = validatePack(fixture("valid-minimal-pack"));

    expect(result.valid).toBe(true);
    expect(result.summary.errors).toBe(0);
  });

  it("reports a missing manifest", () => {
    const result = validatePack(fixture("missing-manifest-pack"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "manifest.missing" }));
  });

  it("reports disallowed manifest permissions", () => {
    const result = validatePack(fixture("invalid-permissions-pack"));

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "manifest.executable_code" }),
        expect.objectContaining({ code: "manifest.requires_network" }),
        expect.objectContaining({ code: "manifest.run_commands" }),
        expect.objectContaining({ code: "manifest.network_access" })
      ])
    );
  });

  it("reports duplicate record IDs", () => {
    const result = validatePack(fixture("duplicate-records-pack"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "record.duplicate_id" }));
  });

  it("reports missing source references", () => {
    const result = validatePack(fixture("missing-source-pack"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "record.source_missing" }));
  });

  it("reports invalid export profiles", () => {
    const result = validatePack(fixture("invalid-export-profile-pack"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "export_profile.schema" }));
  });

  it("reports executable and script files", () => {
    const result = validatePack(fixture("executable-file-pack"));

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "pack.executable_file" }),
        expect.objectContaining({ code: "pack.script_file" })
      ])
    );
  });

  it("reports secret-like content", () => {
    const result = validatePack(fixture("secret-content-pack"));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "scan.credential_pattern" }));
  });

  it("formats a human-readable report", () => {
    const result = validatePack(fixture("missing-manifest-pack"));

    expect(formatValidationResult(result)).toContain("Validation failed");
  });
});
