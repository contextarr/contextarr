import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase, type ContextarrDatabase } from "../db";
import { rebuildIndex } from "../indexer";
import type { ServerConfig } from "../types";
import { getPackReadinessReport, type ContextReadinessReport } from "./readiness-engine";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const fixedGeneratedAt = "2026-05-11T12:00:00.000Z";
const packId = "ai-workstation-pack";

const openDbs: ContextarrDatabase[] = [];
const tempRoots: string[] = [];

interface TestContext {
  db: ContextarrDatabase;
  config: ServerConfig;
}

afterEach(() => {
  while (openDbs.length > 0) {
    openDbs.pop()?.close();
  }

  while (tempRoots.length > 0) {
    fs.rmSync(tempRoots.pop() as string, { recursive: true, force: true });
  }
});

describe("getPackReadinessReport", () => {
  it("uses the supplied generatedAt and reports missing governance as a warning", () => {
    const { db, config } = createTestContext();

    const report = mustGetReport(db, config);

    expect(report.generatedAt).toBe(fixedGeneratedAt);
    expect(report.status).toBe("review_needed");
    expect(report.dimensions.governance).toMatchObject({
      status: "review_needed",
      score: 80,
      evidence: {
        rulesFile: "rules/governance.yaml",
        present: false,
        evaluation: "presence_only"
      }
    });
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "governance.missing",
          severity: "warning",
          evidence: expect.objectContaining({
            dimension: "governance",
            rulesFile: "rules/governance.yaml",
            present: false
          })
        })
      ])
    );
  });

  it("reports governance as ready when the pack includes a governance rules file", () => {
    const { db, config } = createTestContext(copyDemoPackWithGovernance());

    const report = mustGetReport(db, config);

    expect(report.generatedAt).toBe(fixedGeneratedAt);
    expect(report.status).toBe("ready");
    expect(report.dimensions.governance).toMatchObject({
      status: "ready",
      score: 100,
      evidence: {
        rulesFile: "rules/governance.yaml",
        present: true,
        evaluation: "presence_only"
      }
    });
    expect(report.issues.map((issue) => issue.code)).not.toContain("governance.missing");
  });

  it("blocks readiness when no export profiles are indexed", () => {
    const { db, config } = createTestContext(copyDemoPackWithGovernance());
    db.prepare("DELETE FROM export_profiles WHERE pack_id = ?").run(packId);

    const report = mustGetReport(db, config);

    expect(report.status).toBe("blocked");
    expect(report.dimensions.export).toMatchObject({
      status: "blocked",
      score: 0,
      evidence: expect.objectContaining({
        exportProfileCount: 0,
        exportEligibleProfiles: 0
      })
    });
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "export.no_profiles",
          severity: "blocker",
          evidence: expect.objectContaining({ dimension: "export" })
        })
      ])
    );
  });

  it("blocks export readiness when no records are eligible for default export", () => {
    const { db, config } = createTestContext(copyDemoPackWithGovernance());
    blockAllRecords(db);

    const report = mustGetReport(db, config);

    expect(report.status).toBe("blocked");
    expect(report.dimensions.export.status).toBe("blocked");
    expect(report.dimensions.export.score).toBeLessThan(100);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "export.no_eligible_records",
          severity: "blocker",
          evidence: expect.objectContaining({
            dimension: "export",
            recordCount: 5
          })
        })
      ])
    );
  });

  it("blocks MCP readiness when no records are eligible for read-only MCP exposure", () => {
    const { db, config } = createTestContext(copyDemoPackWithGovernance());
    blockAllRecords(db);

    const report = mustGetReport(db, config);

    expect(report.status).toBe("blocked");
    expect(report.dimensions.mcp).toMatchObject({
      status: "blocked",
      score: 0,
      evidence: expect.objectContaining({
        mcpEligibleRecords: 0,
        recordCount: 5
      })
    });
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "mcp.no_eligible_records",
          severity: "blocker",
          evidence: expect.objectContaining({
            dimension: "mcp",
            recordCount: 5
          })
        })
      ])
    );
  });

  it("distinguishes warning-only reports from blocker reports", () => {
    const warningContext = createTestContext(copyDemoPackWithGovernance());
    warningContext.db
      .prepare(
        `UPDATE export_profiles
         SET readiness_status = ?, readiness_warning_codes_json = ?
         WHERE pack_id = ? AND id = ?`
      )
      .run("ready_with_warnings", JSON.stringify(["export_profile.warning_for_test"]), packId, "ai-workstation-codex");

    const warningReport = mustGetReport(warningContext.db, warningContext.config);

    expect(warningReport.status).toBe("review_needed");
    expect(warningReport.dimensions.export.status).toBe("review_needed");
    expect(warningReport.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "export.profile_warnings",
          severity: "warning"
        })
      ])
    );

    const blockerContext = createTestContext(copyDemoPackWithGovernance());
    blockerContext.db.prepare("DELETE FROM export_profiles WHERE pack_id = ?").run(packId);

    const blockerReport = mustGetReport(blockerContext.db, blockerContext.config);

    expect(blockerReport.status).toBe("blocked");
    expect(blockerReport.dimensions.export.status).toBe("blocked");
    expect(blockerReport.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "export.no_profiles",
          severity: "blocker"
        })
      ])
    );
  });

  it("does not leak absolute local paths in issue evidence", () => {
    const packsDir = copyDemoPackWithGovernance();
    const { db, config } = createTestContext(packsDir);
    blockAllRecords(db);
    db.prepare(
      `UPDATE export_profiles
       SET readiness_status = ?, readiness_blocking_codes_json = ?
       WHERE pack_id = ? AND id = ?`
    ).run("blocked", JSON.stringify(["export_profile.blocked_for_test"]), packId, "ai-workstation-codex");

    const report = mustGetReport(db, config);
    const serializedEvidence = JSON.stringify(report.issues.map((issue) => issue.evidence));

    expect(serializedEvidence).not.toContain(repoRoot);
    expect(serializedEvidence).not.toContain(packsDir);
    expect(serializedEvidence).not.toMatch(/[A-Za-z]:[\\/]/);
  });
});

function createTestContext(packsDir = demoPacksDir): TestContext {
  const db = openDatabase(":memory:");
  openDbs.push(db);
  const config: ServerConfig = {
    host: "127.0.0.1",
    port: 0,
    packsDir,
    draftPacksDir: path.join(os.tmpdir(), "contextarr-no-draft-packs"),
    composedPacksDir: path.join(os.tmpdir(), "contextarr-no-composed-packs"),
    reviewCandidateDirs: [],
    skillsDir: path.join(os.tmpdir(), "contextarr-no-demo-skills"),
    importedSkillsDir: path.join(os.tmpdir(), "contextarr-no-imported-skills"),
    agentKitsDir: path.join(os.tmpdir(), "contextarr-no-agent-kits"),
    agentKitTemplatesDir: path.join(os.tmpdir(), "contextarr-no-agent-kit-templates"),
    databasePath: ":memory:",
    localImportsEnabled: false
  };
  rebuildIndex(db, packsDir);
  return { db, config };
}

function copyDemoPackWithGovernance(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-readiness-"));
  tempRoots.push(root);
  fs.cpSync(path.join(demoPacksDir, packId), path.join(root, packId), { recursive: true });
  const rulesDir = path.join(root, packId, "rules");
  fs.mkdirSync(rulesDir, { recursive: true });
  fs.writeFileSync(
    path.join(rulesDir, "governance.yaml"),
    "version: 1\nstatus: presence-only-fixture\n",
    "utf8"
  );
  return root;
}

function mustGetReport(
  db: ContextarrDatabase,
  config: ServerConfig,
  id = packId
): ContextReadinessReport {
  const report = getPackReadinessReport(db, config, id, fixedGeneratedAt);
  expect(report).toBeDefined();
  return report as ContextReadinessReport;
}

function blockAllRecords(db: ContextarrDatabase): void {
  db.prepare("UPDATE records SET review_status = ? WHERE pack_id = ?").run("draft", packId);
}
