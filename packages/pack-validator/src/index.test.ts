import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatValidationResult, toValidationReportV1, validatePack } from "./index";

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../test/fixtures");

function fixture(name: string): string {
  return path.join(fixturesDir, name);
}

function withTempValidPack(prefix: string, callback: (packPath: string) => void): void {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const packPath = path.join(tempRoot, "valid-minimal-pack");

  try {
    fs.cpSync(fixture("valid-minimal-pack"), packPath, { recursive: true });
    callback(packPath);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function updateOverviewRecord(packPath: string, update: (content: string) => string): void {
  const recordPath = path.join(packPath, "records", "overview.md");
  fs.writeFileSync(recordPath, update(fs.readFileSync(recordPath, "utf8")), "utf8");
}

function declareValidationChecks(packPath: string, checks: string[]): void {
  fs.writeFileSync(
    path.join(packPath, "rules", "validation.yaml"),
    `checks:\n${checks.map((check) => `  - ${check}`).join("\n")}\n`,
    "utf8"
  );
}

describe("validatePack", () => {
  it("validates a minimal valid pack", () => {
    const result = validatePack(fixture("valid-minimal-pack"));

    expect(result.valid).toBe(true);
    expect(result.summary.errors).toBe(0);
    expect(result.validationStatus).toBe("valid");
    expect(result.exportReadiness.status).toBe("ready");
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

  it("reports relative source paths that resolve outside the pack root", () => {
    withTempValidPack("contextarr-source-path-outside-", (packPath) => {
      const sourcesPath = path.join(packPath, "sources", "sources.yaml");
      fs.writeFileSync(
        sourcesPath,
        fs.readFileSync(sourcesPath, "utf8").replace("raw/manual-note.md", "../../outside/manual-note.md"),
        "utf8"
      );

      const result = validatePack(packPath);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          code: "source.path_outside_pack",
          file: "sources/sources.yaml",
          path: "sources.manual-source.path"
        })
      );
    });
  });

  it.each([
    ["POSIX absolute path", "/etc/passwd"],
    ["Windows drive path", "C:\\Users\\Rob\\secret.md"],
    ["Windows UNC path", "\\\\server\\share\\secret.md"]
  ])("reports %s source paths as blocking errors", (_label, sourcePath) => {
    withTempValidPack("contextarr-source-path-absolute-", (packPath) => {
      const sourcesPath = path.join(packPath, "sources", "sources.yaml");
      fs.writeFileSync(
        sourcesPath,
        fs.readFileSync(sourcesPath, "utf8").replace("path: raw/manual-note.md", `path: ${JSON.stringify(sourcePath)}`),
        "utf8"
      );

      const result = validatePack(packPath);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          code: "source.path_absolute",
          file: "sources/sources.yaml",
          path: "sources.manual-source.path"
        })
      );
    });
  });

  it("reports source paths that stay inside the pack but do not exist", () => {
    withTempValidPack("contextarr-source-path-missing-", (packPath) => {
      const sourcesPath = path.join(packPath, "sources", "sources.yaml");
      fs.writeFileSync(
        sourcesPath,
        fs.readFileSync(sourcesPath, "utf8").replace("raw/manual-note.md", "raw/missing-note.md"),
        "utf8"
      );

      const result = validatePack(packPath);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          code: "source.path_missing",
          file: "sources/sources.yaml",
          path: "sources.manual-source.path"
        })
      );
    });
  });

  it("reports pack-local source path symlinks that escape the pack root", () => {
    withTempValidPack("contextarr-source-path-symlink-", (packPath) => {
      const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-source-path-outside-"));
      const outsideSource = path.join(outsideDir, "manual-note.md");
      fs.writeFileSync(outsideSource, "outside source note\n", "utf8");

      const linkedSource = path.join(packPath, "raw", "manual-note.md");
      fs.rmSync(linkedSource);
      try {
        fs.symlinkSync(outsideSource, linkedSource, "file");
      } catch {
        fs.rmSync(outsideDir, { force: true, recursive: true });
        return;
      }

      try {
        const result = validatePack(packPath);

        expect(result.valid).toBe(false);
        expect(result.issues).toContainEqual(
          expect.objectContaining({
            severity: "error",
            code: "source.path_outside_pack",
            file: "sources/sources.yaml",
            path: "sources.manual-source.path"
          })
        );
      } finally {
        fs.rmSync(outsideDir, { force: true, recursive: true });
      }
    });
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

  it("reports docs, license, stale source, redaction, and shell-command research warnings", () => {
    const missingReadme = validatePack(fixture("missing-readme-pack"));
    const missingLicense = validatePack(fixture("missing-source-license-pack"));
    const unknownLicense = validatePack(fixture("unknown-source-license-pack"));
    const copyleftLicense = validatePack(fixture("copyleft-source-license-pack"));
    const staleSource = validatePack(fixture("stale-source-pack"), { currentDate: "2026-05-08T00:00:00Z" });
    const redactionWarning = validatePack(fixture("redaction-warning-pack"));
    const shellCommand = validatePack(fixture("shell-command-content-pack"));

    expect(missingReadme).toMatchObject({ valid: true, validationStatus: "valid_with_warnings" });
    expect(missingReadme.issues).toContainEqual(expect.objectContaining({ code: "docs.readme_missing" }));
    expect(missingReadme.summary.docsWarnings).toBe(1);

    expect(missingLicense.issues).toContainEqual(expect.objectContaining({ code: "source.license_missing" }));
    expect(missingLicense.summary.licenseMissing).toBe(1);
    expect(missingLicense.summary.licenseWarnings).toBe(1);

    expect(unknownLicense.issues).toContainEqual(expect.objectContaining({ code: "source.license_unknown" }));
    expect(unknownLicense.summary.licenseUnknown).toBe(1);

    expect(copyleftLicense.issues).toContainEqual(expect.objectContaining({ code: "source.license_risk" }));
    expect(copyleftLicense.summary.licenseRisks).toBe(1);

    expect(staleSource.issues).toContainEqual(expect.objectContaining({ code: "source.stale" }));
    expect(staleSource.summary.staleSources).toBe(1);
    expect(staleSource.exportReadiness.status).toBe("ready_with_warnings");
    expect(staleSource.summary.exportProfilesWithWarnings).toBeGreaterThan(0);

    expect(redactionWarning.issues).toContainEqual(expect.objectContaining({ code: "redaction.hit_warn" }));
    expect(redactionWarning.redactionHits).toHaveLength(1);
    expect(redactionWarning.summary.redactionHits).toBe(1);

    expect(shellCommand.valid).toBe(false);
    expect(shellCommand.issues).toContainEqual(expect.objectContaining({ code: "scan.shell_command" }));
  });

  it("does not let one broken export profile block valid profiles", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-pack-readiness-"));
    const packPath = path.join(tempRoot, "valid-minimal-pack");

    try {
      fs.cpSync(fixture("valid-minimal-pack"), packPath, { recursive: true });
      fs.writeFileSync(
        path.join(packPath, "exports", "broken.yaml"),
        ["id: broken-profile", "target: codex", "format: markdown"].join("\n"),
        "utf8"
      );

      const result = validatePack(packPath);
      const goodProfile = result.exportReadiness.profiles.find((profile) => profile.id === "codex-context");
      const brokenProfile = result.exportReadiness.profiles.find((profile) => profile.id === "broken");

      expect(result.valid).toBe(false);
      expect(goodProfile).toMatchObject({ status: "ready", blockingIssueCodes: [] });
      expect(brokenProfile).toMatchObject({ status: "blocked" });
      expect(result.summary.exportProfilesBlocked).toBe(1);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("does not attribute redaction warn hits in non-record files to records", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-redaction-attribution-"));
    const packPath = path.join(tempRoot, "redaction-warning-pack");

    try {
      fs.cpSync(fixture("redaction-warning-pack"), packPath, { recursive: true });
      fs.appendFileSync(path.join(packPath, "README.md"), "\nreview-only-fixture\nid: redaction-warning-pack.overview\n", "utf8");

      const result = validatePack(packPath);
      const readmeHit = result.redactionHits.find((hit) => hit.file === "README.md");
      const recordHit = result.redactionHits.find((hit) => hit.file === "records/overview.md");

      expect(readmeHit).toMatchObject({ file: "README.md" });
      expect(readmeHit?.recordId).toBeUndefined();
      expect(recordHit?.recordId).toBe("redaction-warning-pack.overview");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("does not enforce record policy checks unless they are declared", () => {
    withTempValidPack("contextarr-pack-policy-undeclared-", (packPath) => {
      updateOverviewRecord(packPath, (content) =>
        content
          .replace("  - test", "  - test\n  - secret")
          .replace("source_status: source_backed", "source_status: draft")
          .replace("privacy: public_safe", "privacy: private")
          .replace("review_status: approved", "review_status: draft")
      );

      const result = validatePack(packPath);

      expect(result.valid).toBe(true);
      expect(result.issues.some((issue) => issue.code.startsWith("record_policy."))).toBe(false);
    });
  });

  it("enforces approved_content_only when declared", () => {
    withTempValidPack("contextarr-pack-policy-approved-", (packPath) => {
      updateOverviewRecord(packPath, (content) => content.replace("review_status: approved", "review_status: needs_review"));
      declareValidationChecks(packPath, ["approved_content_only"]);

      const result = validatePack(packPath);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          code: "record_policy.approved_content_only",
          file: "records/overview.md",
          path: "review_status"
        })
      );
    });
  });

  it("reports unknown validation policy checks", () => {
    withTempValidPack("contextarr-pack-policy-unknown-", (packPath) => {
      declareValidationChecks(packPath, ["approved_content_only_typo"]);

      const result = validatePack(packPath);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          code: "rules.validation.unknown_check",
          file: "rules/validation.yaml",
          path: "checks",
          message: expect.stringContaining("approved_content_only_typo")
        })
      );
    });
  });

  it("enforces public_safe_only when declared", () => {
    withTempValidPack("contextarr-pack-policy-public-safe-", (packPath) => {
      updateOverviewRecord(packPath, (content) => content.replace("privacy: public_safe", "privacy: sensitive"));
      declareValidationChecks(packPath, ["public_safe_only"]);

      const result = validatePack(packPath);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          code: "record_policy.public_safe_only",
          file: "records/overview.md",
          path: "privacy"
        })
      );
    });
  });

  it("enforces draft_records_require_review when declared", () => {
    withTempValidPack("contextarr-pack-policy-draft-review-", (packPath) => {
      updateOverviewRecord(packPath, (content) => content.replace("source_status: source_backed", "source_status: draft"));
      declareValidationChecks(packPath, ["draft_records_require_review"]);

      const result = validatePack(packPath);

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          severity: "error",
          code: "record_policy.draft_records_require_review",
          file: "records/overview.md",
          path: "review_status"
        })
      );
    });
  });

  it("enforces no_secret_tags when declared", () => {
    const forbiddenTags = ["secret", "never_export", "private", "sensitive", "customer_private", "health", "financial"];

    withTempValidPack("contextarr-pack-policy-secret-tags-", (packPath) => {
      updateOverviewRecord(packPath, (content) =>
        content.replace("  - test", forbiddenTags.map((tag) => `  - ${tag}`).join("\n"))
      );
      declareValidationChecks(packPath, ["no_secret_tags"]);

      const result = validatePack(packPath);

      expect(result.valid).toBe(false);
      expect(result.summary.errors).toBe(forbiddenTags.length);
      for (const tag of forbiddenTags) {
        expect(result.issues).toContainEqual(
          expect.objectContaining({
            severity: "error",
            code: "record_policy.no_secret_tags",
            file: "records/overview.md",
            path: "tags",
            message: expect.stringContaining(tag)
          })
        );
      }
    });
  });

  it("emits deterministic validation report v1", () => {
    const first = toValidationReportV1(validatePack(fixture("deterministic-validation-pack"), { currentDate: "2026-05-08T00:00:00Z" }));
    const second = toValidationReportV1(validatePack(fixture("deterministic-validation-pack"), { currentDate: "2026-05-08T00:00:00Z" }));

    expect(first).toEqual(second);
    expect(first.schemaVersion).toBe("contextarr.validation-report.v1");
  });

  it("formats a human-readable report", () => {
    const result = validatePack(fixture("missing-manifest-pack"));

    expect(formatValidationResult(result)).toContain("Validation failed");
  });
});
