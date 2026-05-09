import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadBenchmarkTask,
  runBenchmark,
  runBenchmarkGate,
  scoreBenchmarkCondition,
  writeBenchmarkGateReports,
  writeBenchmarkReport
} from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const benchmarkDir = path.join(repoRoot, "demo-evals");
const packsDir = path.join(repoRoot, "demo-packs");
const tempDirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-benchmark-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("context quality benchmark harness", () => {
  it("loads accepted G2 task fixtures", () => {
    const loaded = loadBenchmarkTask({
      benchmarkDir,
      packsDir,
      taskId: "ai-workstation-troubleshooting"
    });

    expect(loaded.manifest.id).toBe("contextarr-demo-benchmark-fixtures");
    expect(loaded.task.conditions).toEqual(["no_context", "manual_prompt", "raw_notes", "contextarr_export"]);
    expect(loaded.expectedFacts.requiredFacts).toHaveLength(4);
    expect(loaded.scoringRubric.maxScore).toBe(100);
  });

  it("runs deterministic local scoring and includes Contextarr export input", () => {
    const first = runBenchmark({
      benchmarkDir,
      packsDir,
      taskId: "support-ticket-drafting"
    });
    const second = runBenchmark({
      benchmarkDir,
      packsDir,
      taskId: "support-ticket-drafting"
    });

    expect(first).toEqual(second);
    expect(first.conditions.map((condition) => condition.id)).toEqual([
      "no_context",
      "manual_prompt",
      "raw_notes",
      "contextarr_export"
    ]);
    expect(first.conditions.find((condition) => condition.id === "contextarr_export")).toMatchObject({
      passed: true,
      matchedFacts: ["std-fact-001", "std-fact-002", "std-fact-003", "std-fact-004"]
    });
  });

  it("writes deterministic JSON and Markdown reports", () => {
    const outDir = tempDir();
    const result = writeBenchmarkReport({
      benchmarkDir,
      packsDir,
      taskId: "contractor-handoff",
      outDir
    });

    expect(fs.existsSync(result.jsonPath)).toBe(true);
    expect(fs.existsSync(result.markdownPath)).toBe(true);
    expect(JSON.parse(fs.readFileSync(result.jsonPath, "utf8"))).toMatchObject({
      schemaVersion: "contextarr.benchmark-report.v1",
      taskId: "contractor-handoff",
      sampleOnly: true
    });
    expect(fs.readFileSync(result.markdownPath, "utf8")).toContain("# Context Quality Benchmark: Contractor Handoff");
  });

  it("fails a condition deterministically when local output leaks sensitive values", () => {
    const loaded = loadBenchmarkTask({
      benchmarkDir,
      packsDir,
      taskId: "codex-implementation-brief"
    });
    const scored = scoreBenchmarkCondition({
      conditionId: "manual_prompt",
      sourcePath: "inline-test-output",
      content: "token = abcdefghijkl\nThe fictional project separates apps, packages, docs, and fixtures.",
      task: loaded.task,
      expectedFacts: loaded.expectedFacts,
      scoringRubric: loaded.scoringRubric
    });

    expect(scored.passed).toBe(false);
    expect(scored.failures).toContain("sensitive.secret_assignment");
    expect(scored.scores.sensitiveLeakage).toBe(0);
  });

  it("passes the G4 local gate for accepted demo fixtures", () => {
    const gate = runBenchmarkGate({
      benchmarkDir,
      packsDir,
      minimumContextarrExportScore: 80
    });

    expect(gate).toMatchObject({
      schemaVersion: "contextarr.benchmark-gate.v1",
      passed: true,
      summary: {
        tasks: 5,
        passed: 5,
        failed: 0,
        minimumContextarrExportScore: 80
      }
    });
    expect(gate.tasks.every((task) => task.contextarrExportScore !== null)).toBe(true);
    expect(gate.tasks.every((task) => task.missingFacts.length === 0)).toBe(true);
  });

  it("blocks the G4 local gate when Contextarr export output leaks sensitive values", () => {
    const outputsDir = tempDir();
    const taskDir = path.join(outputsDir, "codex-implementation-brief");
    fs.mkdirSync(taskDir, { recursive: true });
    fs.writeFileSync(path.join(taskDir, "contextarr_export.md"), "token = abcdefghijkl\n", "utf8");

    const gate = runBenchmarkGate({
      benchmarkDir,
      packsDir,
      conditionOutputsDir: outputsDir,
      taskIds: ["codex-implementation-brief"],
      minimumContextarrExportScore: 80
    });

    expect(gate.passed).toBe(false);
    expect(gate.tasks[0].checks).toContainEqual(
      expect.objectContaining({
        id: "contextarr_export_sensitive_leakage",
        passed: false
      })
    );
  });

  it("writes G4 gate reports beside deterministic G3 reports", () => {
    const outDir = tempDir();
    const result = writeBenchmarkGateReports({
      benchmarkDir,
      packsDir,
      taskIds: ["internal-kb-answer"],
      outDir
    });

    expect(result.gate.passed).toBe(true);
    expect(fs.existsSync(result.gateJsonPath)).toBe(true);
    expect(fs.existsSync(result.gateMarkdownPath)).toBe(true);
    expect(result.reportFiles).toHaveLength(1);
    expect(fs.existsSync(path.join(outDir, "internal-kb-answer.json"))).toBe(true);
    expect(fs.readFileSync(result.gateMarkdownPath, "utf8")).toContain("# Context Quality Benchmark Gate");
  });
});
