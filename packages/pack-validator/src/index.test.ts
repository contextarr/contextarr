import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { formatValidationResult, validatePack } from "./index";

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../test/fixtures");
const tempDirs: string[] = [];

function fixture(name: string): string {
  return path.join(fixturesDir, name);
}

function tempPackFromFixture(name: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-validator-"));
  tempDirs.push(dir);
  const packPath = path.join(dir, name);
  fs.cpSync(fixture(name), packPath, { recursive: true });
  return packPath;
}

function replaceRecordFrontmatter(packPath: string, replacements: Record<string, string>): void {
  const recordPath = path.join(packPath, "records", "overview.md");
  let content = fs.readFileSync(recordPath, "utf8");

  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(`^${key}: .*$`, "m"), `${key}: ${value}`);
  }

  fs.writeFileSync(recordPath, content, "utf8");
}

function appendValidationChecks(packPath: string, checks: string[]): void {
  const validationPath = path.join(packPath, "rules", "validation.yaml");
  fs.appendFileSync(validationPath, `\n${checks.map((check) => `  - ${check}`).join("\n")}\n`, "utf8");
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

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

  it("enforces core validation policy checks when declared", () => {
    const packPath = tempPackFromFixture("valid-minimal-pack");
    appendValidationChecks(packPath, [
      "approved_content_only",
      "public_safe_only",
      "draft_records_require_review",
      "no_secret_tags"
    ]);
    replaceRecordFrontmatter(packPath, {
      privacy: "private",
      source_status: "draft"
    });

    const recordPath = path.join(packPath, "records", "overview.md");
    const content = fs.readFileSync(recordPath, "utf8").replace("  - test", "  - secret");
    fs.writeFileSync(recordPath, content, "utf8");

    const result = validatePack(packPath);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "policy.public_safe_only" }),
        expect.objectContaining({ code: "policy.draft_records_require_review" }),
        expect.objectContaining({ code: "policy.no_secret_tags" })
      ])
    );
  });

  it("enforces approved_content_only for unapproved records", () => {
    const packPath = tempPackFromFixture("valid-minimal-pack");
    appendValidationChecks(packPath, ["approved_content_only"]);
    replaceRecordFrontmatter(packPath, {
      review_status: "needs_review"
    });

    const result = validatePack(packPath);

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "policy.approved_content_only" }));
  });

  it("allows approved imported records through draft_records_require_review", () => {
    const packPath = tempPackFromFixture("valid-minimal-pack");
    appendValidationChecks(packPath, ["draft_records_require_review"]);
    replaceRecordFrontmatter(packPath, {
      source_status: "imported",
      review_status: "approved"
    });

    const result = validatePack(packPath);

    expect(result.valid).toBe(true);
    expect(result.issues).not.toContainEqual(expect.objectContaining({ code: "policy.draft_records_require_review" }));
  });

  it("formats a human-readable report", () => {
    const result = validatePack(fixture("missing-manifest-pack"));

    expect(formatValidationResult(result)).toContain("Validation failed");
  });
});
