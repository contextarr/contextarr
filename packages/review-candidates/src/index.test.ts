import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  dryRunReviewCandidateActivation,
  getReviewCandidate,
  getReviewCandidateActivationPlan,
  listReviewCandidates,
  type ReviewCandidateRoot
} from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const validPackFixture = path.join(repoRoot, "packages/pack-validator/test/fixtures/valid-minimal-pack");
const shellCommandPackFixture = path.join(repoRoot, "packages/security-scanner/test/fixtures/shell-command-pack");

describe("@contextarr/review-candidates", () => {
  it("lists valid draft candidates without record bodies or absolute paths", () => {
    const root = tempRoot();
    const candidateDir = path.join(root, "drafts", "valid-draft");
    fs.cpSync(validPackFixture, candidateDir, { recursive: true });
    const absoluteSourcePath = path.join(root, "private-sources", "manual-note.md").replace(/\\/g, "/");
    fs.writeFileSync(
      path.join(candidateDir, "sources", "sources.yaml"),
      [
        "sources:",
        "  - id: manual-source",
        "    type: markdown",
        "    title: Manual Source",
        `    path: '${absoluteSourcePath.replace(/'/g, "''")}'`,
        "    retrieved_at: 2026-05-07T00:00:00Z",
        "    license: MIT",
        "    trust: local",
        "    status: current",
        ""
      ].join("\n")
    );

    const result = listReviewCandidates({
      roots: [{ rootPath: path.join(root, "drafts"), sourceKind: "draft_pack" }],
      displayRoot: root
    });

    expect(result.counts).toMatchObject({ total: 1, readyForReview: 1, skippedRoots: 0 });
    expect(result.candidates[0]).toMatchObject({
      sourceKind: "draft_pack",
      pathLabel: "drafts/valid-draft",
      packId: "valid-minimal-pack",
      status: "ready_for_review",
      activeConflict: false,
      counts: { records: 1, sources: 1, exportProfiles: 1 }
    });
    expect(JSON.stringify(result)).not.toContain(root);

    const detail = getReviewCandidate({
      roots: [{ rootPath: path.join(root, "drafts"), sourceKind: "draft_pack" }],
      displayRoot: root,
      key: result.candidates[0].key
    });

    expect(detail?.records).toEqual([
      expect.objectContaining({
        id: "valid.overview",
        title: "Valid Overview",
        file: "records/overview.md"
      })
    ]);
    expect(detail?.sources).toEqual([
      expect.objectContaining({
        id: "manual-source",
        path: "private-sources/manual-note.md"
      })
    ]);
    expect(JSON.stringify(detail)).not.toContain("This is a valid minimal context pack");
    expect(JSON.stringify(detail)).not.toContain(root);

    const plan = getReviewCandidateActivationPlan({
      roots: [{ rootPath: path.join(root, "drafts"), sourceKind: "draft_pack" }],
      displayRoot: root,
      activePacksRoot: path.join(root, "active-packs"),
      key: result.candidates[0].key
    });

    expect(plan).toMatchObject({
      schemaVersion: "contextarr.review-candidate-activation-plan.v1",
      packId: "valid-minimal-pack",
      status: "ready",
      canActivate: true,
      target: {
        activePacksRootLabel: "active-packs",
        pathLabel: "active-packs/valid-minimal-pack",
        activeConflict: false
      }
    });
    expect(plan?.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "validation", status: "warning" }),
        expect.objectContaining({ id: "candidate-contents", status: "pass" }),
        expect.objectContaining({ id: "active-conflict", status: "pass" }),
        expect.objectContaining({ id: "write-boundary", status: "pass" })
      ])
    );
    expect(plan?.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "candidate.validation_warnings" })]));
    expect(plan?.boundaries.join(" ")).toContain("No record bodies");
    expect(JSON.stringify(plan)).not.toContain(root);

    const dryRun = dryRunReviewCandidateActivation({
      roots: [{ rootPath: path.join(root, "drafts"), sourceKind: "draft_pack" }],
      displayRoot: root,
      activePacksRoot: path.join(root, "active-packs"),
      key: result.candidates[0].key,
      now: new Date("2026-05-10T00:00:00.000Z")
    });

    expect(dryRun).toMatchObject({
      schemaVersion: "contextarr.review-candidate-activation-dry-run.v1",
      generatedAt: "2026-05-10T00:00:00.000Z",
      packId: "valid-minimal-pack",
      status: "ready",
      canActivate: true,
      target: {
        pathLabel: "active-packs/valid-minimal-pack",
        activeConflict: false
      },
      effects: {
        filesMoved: false,
        sqliteMutated: false,
        exportsGenerated: false,
        mcpExposed: false,
        networkAccessed: false
      }
    });
    expect(dryRun?.proofId).toMatch(/^[a-f0-9]{24}$/);
    expect(dryRun?.manualActions).toEqual(expect.arrayContaining([expect.stringContaining("contextarr rescan")]));
    expect(JSON.stringify(dryRun)).not.toContain(root);
  });

  it("marks invalid, blocked, duplicate, missing-root, and quarantine candidates deterministically", () => {
    const root = tempRoot();
    const draftRoot = path.join(root, "drafts");
    const quarantineRoot = path.join(root, "restored");
    fs.mkdirSync(path.join(draftRoot, "invalid-pack"), { recursive: true });
    fs.writeFileSync(path.join(draftRoot, "invalid-pack", "README.md"), "# Missing manifest\n");
    fs.cpSync(shellCommandPackFixture, path.join(draftRoot, "blocked-pack"), { recursive: true });
    fs.cpSync(validPackFixture, path.join(draftRoot, "duplicate-pack"), { recursive: true });
    fs.cpSync(validPackFixture, path.join(quarantineRoot, "restored-pack"), { recursive: true });

    const roots: ReviewCandidateRoot[] = [
      { rootPath: draftRoot, sourceKind: "draft_pack" },
      { rootPath: quarantineRoot, sourceKind: "restored_quarantine", label: "restored" },
      { rootPath: path.join(root, "missing"), sourceKind: "imported_pack" }
    ];
    const result = listReviewCandidates({
      roots,
      activePackIds: ["valid-minimal-pack"],
      displayRoot: root
    });

    expect(result.counts).toMatchObject({
      total: 4,
      invalid: 1,
      blocked: 1,
      duplicateActiveId: 2,
      skippedRoots: 1
    });
    expect(result.skippedRoots[0]).toMatchObject({ sourceKind: "imported_pack", reason: "missing" });
    expect(result.candidates.find((candidate) => candidate.pathLabel.endsWith("invalid-pack"))?.status).toBe("invalid");
    expect(result.candidates.find((candidate) => candidate.pathLabel.endsWith("blocked-pack"))?.status).toBe("blocked");
    expect(result.candidates.find((candidate) => candidate.sourceKind === "restored_quarantine")?.sourceLabel).toBe("restored");
    expect(JSON.stringify(result)).not.toContain(root);

    const duplicate = result.candidates.find((candidate) => candidate.pathLabel.endsWith("duplicate-pack"));
    const duplicatePlan = getReviewCandidateActivationPlan({
      roots,
      activePackIds: ["valid-minimal-pack"],
      displayRoot: root,
      activePacksRoot: path.join(root, "active-packs"),
      key: duplicate?.key ?? ""
    });
    expect(duplicatePlan).toMatchObject({
      status: "blocked",
      canActivate: false,
      target: { activeConflict: true }
    });
    expect(duplicatePlan?.blockers).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "candidate.duplicate_active_id" })])
    );

    const blocked = result.candidates.find((candidate) => candidate.pathLabel.endsWith("blocked-pack"));
    const blockedPlan = getReviewCandidateActivationPlan({
      roots,
      activePackIds: ["valid-minimal-pack"],
      displayRoot: root,
      activePacksRoot: path.join(root, "active-packs"),
      key: blocked?.key ?? ""
    });
    expect(blockedPlan).toMatchObject({ status: "blocked", canActivate: false });
    expect(blockedPlan?.blockers).toEqual(expect.arrayContaining([expect.objectContaining({ code: "candidate.blocked" })]));
    expect(JSON.stringify(duplicatePlan)).not.toContain(root);
    expect(JSON.stringify(blockedPlan)).not.toContain(root);

    const duplicateDryRun = dryRunReviewCandidateActivation({
      roots,
      activePackIds: ["valid-minimal-pack"],
      displayRoot: root,
      activePacksRoot: path.join(root, "active-packs"),
      key: duplicate?.key ?? "",
      now: new Date("2026-05-10T00:00:00.000Z")
    });
    expect(duplicateDryRun).toMatchObject({ status: "blocked", canActivate: false });
    expect(duplicateDryRun?.blockers).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "candidate.duplicate_active_id" })])
    );
    expect(duplicateDryRun?.manualActions[0]).toContain("Resolve every blocker");
  });
});

function tempRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-review-candidates-"));
}
