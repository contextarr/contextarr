import fs from "node:fs";
import path from "node:path";
import { buildPackExport } from "../../export-profiles/src/index";

export type BenchmarkConditionId =
  | "no_context"
  | "manual_prompt"
  | "raw_notes"
  | "contextarr_export"
  | "contextarr_cli_brief"
  | "contextarr_mcp_query";

export interface BenchmarkManifest {
  schemaVersion: "contextarr.benchmark.v1";
  id: string;
  name: string;
  description: string;
  conditions: BenchmarkConditionId[];
  futureConditions?: BenchmarkConditionId[];
  safetyRules: {
    allowExternalModelCalls: boolean;
    allowTelemetry: boolean;
    allowNetworkFetch: boolean;
    allowShellExecution: boolean;
    failOnSensitiveLeakage: boolean;
    failOnUnapprovedContent: boolean;
  };
  tasks: BenchmarkManifestTask[];
  scoring: Record<string, number>;
}

export interface BenchmarkManifestTask {
  id: string;
  taskType: string;
  packIds: string[];
  taskPath: string;
}

export interface BenchmarkTask {
  schemaVersion: "contextarr.benchmark-task.v1";
  id: string;
  name: string;
  taskType: string;
  packIds: string[];
  exportProfileIds: string[];
  conditions: BenchmarkConditionId[];
  futureConditions?: BenchmarkConditionId[];
  prompt: string;
  targetAudience: string;
  expectedOutput: {
    format: string;
    requiredSections: string[];
  };
  blockedBehavior: string[];
}

export interface ExpectedFacts {
  schemaVersion: "contextarr.expected-facts.v1";
  taskId: string;
  requiredFacts: RequiredFact[];
  forbiddenClaims: Array<{ id: string; text: string }>;
  staleWarnings: Array<{ sourceId: string; expectedHandling: string }>;
  sensitiveFacts: Array<{ id: string; handling: string }>;
}

export interface RequiredFact {
  id: string;
  recordId?: string;
  sourceId: string;
  text: string;
  weight: number;
}

export interface ScoringRubric {
  schemaVersion: "contextarr.scoring-rubric.v1";
  taskId: string;
  maxScore: number;
  failRules: Array<{
    id: string;
    dimension: string;
    when: string;
    result: string;
  }>;
  dimensions: Record<string, { max: number; criteria: string[] }>;
}

export interface LoadedBenchmarkTask {
  benchmarkDir: string;
  taskDir: string;
  manifest: BenchmarkManifest;
  manifestTask: BenchmarkManifestTask;
  task: BenchmarkTask;
  expectedFacts: ExpectedFacts;
  scoringRubric: ScoringRubric;
}

export interface BenchmarkConditionResult {
  id: BenchmarkConditionId;
  label: string;
  sourcePath: string;
  contentTokens: number;
  score: number;
  maxScore: number;
  scores: Record<string, number>;
  passed: boolean;
  matchedFacts: string[];
  missingFacts: string[];
  failures: string[];
  notes: string[];
}

export interface BenchmarkReport {
  schemaVersion: "contextarr.benchmark-report.v1";
  benchmarkId: string;
  taskId: string;
  taskName: string;
  packIds: string[];
  exportProfileIds: string[];
  sampleOnly: true;
  staleWarnings: Array<{ sourceId: string; expectedHandling: string }>;
  conditions: BenchmarkConditionResult[];
  winner: string | null;
  summary: string;
}

export interface RunBenchmarkOptions {
  benchmarkDir: string;
  taskId: string;
  packsDir?: string;
  conditionOutputsDir?: string;
}

export interface WriteBenchmarkReportOptions extends RunBenchmarkOptions {
  outDir: string;
}

export interface WriteBenchmarkReportResult {
  report: BenchmarkReport;
  jsonPath: string;
  markdownPath: string;
}

export interface BenchmarkGateOptions {
  benchmarkDir: string;
  packsDir?: string;
  conditionOutputsDir?: string;
  taskIds?: string[];
  minimumContextarrExportScore?: number;
}

export interface BenchmarkGateCheck {
  id: string;
  passed: boolean;
  message: string;
}

export interface BenchmarkGateTaskResult {
  taskId: string;
  taskName: string;
  passed: boolean;
  contextarrExportScore: number | null;
  baselineScores: Partial<Record<BenchmarkConditionId, number>>;
  matchedFacts: string[];
  missingFacts: string[];
  failures: string[];
  staleWarnings: Array<{ sourceId: string; expectedHandling: string }>;
  checks: BenchmarkGateCheck[];
}

export interface BenchmarkGateResult {
  schemaVersion: "contextarr.benchmark-gate.v1";
  benchmarkId: string;
  taskIds: string[];
  sampleOnly: true;
  minimumContextarrExportScore: number;
  passed: boolean;
  summary: {
    tasks: number;
    passed: number;
    failed: number;
    minimumContextarrExportScore: number;
    contextarrExportMinimumObservedScore: number | null;
    failures: number;
    staleWarnings: number;
  };
  tasks: BenchmarkGateTaskResult[];
}

export interface WriteBenchmarkGateReportsOptions extends BenchmarkGateOptions {
  outDir: string;
}

export interface WriteBenchmarkGateReportsResult {
  gate: BenchmarkGateResult;
  gateJsonPath: string;
  gateMarkdownPath: string;
  reportFiles: Array<{ taskId: string; jsonPath: string; markdownPath: string }>;
}

interface BenchmarkGateRun {
  gate: BenchmarkGateResult;
  reports: BenchmarkReport[];
}

export class BenchmarkError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "BenchmarkError";
  }
}

const fixedExportGeneratedAt = "1970-01-01T00:00:00.000Z";
const conditionFixtureFiles: Partial<Record<BenchmarkConditionId, string>> = {
  no_context: "no-context-prompt.md",
  manual_prompt: "manual-prompt.md",
  raw_notes: "raw-notes.md"
};
const supportedG3Conditions = new Set<BenchmarkConditionId>([
  "no_context",
  "manual_prompt",
  "raw_notes",
  "contextarr_export"
]);
const dimensionOrder = [
  "taskSuccess",
  "groundingAccuracy",
  "sensitiveLeakage",
  "sourceCoverage",
  "outputStructure",
  "tokenEfficiency"
];
const defaultMinimumContextarrExportScore = 80;
const stopwords = new Set([
  "about",
  "after",
  "against",
  "and",
  "are",
  "before",
  "being",
  "can",
  "from",
  "into",
  "should",
  "that",
  "the",
  "their",
  "then",
  "this",
  "when",
  "with",
  "without",
  "would"
]);

export function loadBenchmarkTask(options: RunBenchmarkOptions): LoadedBenchmarkTask {
  const benchmarkDir = path.resolve(options.benchmarkDir);
  const manifestPath = path.join(benchmarkDir, "benchmark-manifest.example.json");
  const manifest = parseManifest(readJsonObject(manifestPath));
  assertLocalOnlySafety(manifest);

  const manifestTask = manifest.tasks.find((task) => task.id === options.taskId);
  if (!manifestTask) {
    throw new BenchmarkError("benchmark.task_not_found", `Benchmark task not found: ${options.taskId}`);
  }

  const taskPath = path.join(benchmarkDir, manifestTask.taskPath);
  const taskDir = path.dirname(taskPath);
  const task = parseTask(readYamlObject(taskPath), taskPath);
  const expectedFacts = parseExpectedFacts(readYamlObject(path.join(taskDir, "expected-facts.yaml")), task.id);
  const scoringRubric = parseScoringRubric(readYamlObject(path.join(taskDir, "scoring-rubric.yaml")), task.id);

  validateTaskConsistency(manifest, manifestTask, task, expectedFacts, scoringRubric, taskDir);

  return {
    benchmarkDir,
    taskDir,
    manifest,
    manifestTask,
    task,
    expectedFacts,
    scoringRubric
  };
}

export function listBenchmarkTaskIds(options: { benchmarkDir: string }): string[] {
  const benchmarkDir = path.resolve(options.benchmarkDir);
  const manifestPath = path.join(benchmarkDir, "benchmark-manifest.example.json");
  const manifest = parseManifest(readJsonObject(manifestPath));
  assertLocalOnlySafety(manifest);
  return manifest.tasks.map((task) => task.id);
}

export function runBenchmark(options: RunBenchmarkOptions): BenchmarkReport {
  const loaded = loadBenchmarkTask(options);
  const conditions = loaded.task.conditions
    .filter((condition) => supportedG3Conditions.has(condition))
    .map((condition) => loadConditionContent(loaded, condition, options))
    .filter((condition): condition is { id: BenchmarkConditionId; sourcePath: string; content: string } => Boolean(condition))
    .map((condition) =>
      scoreBenchmarkCondition({
        conditionId: condition.id,
        sourcePath: condition.sourcePath,
        content: condition.content,
        task: loaded.task,
        expectedFacts: loaded.expectedFacts,
        scoringRubric: loaded.scoringRubric
      })
    );

  const winner = conditions
    .filter((condition) => condition.passed)
    .slice()
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))[0]?.id ?? null;

  return {
    schemaVersion: "contextarr.benchmark-report.v1",
    benchmarkId: loaded.manifest.id,
    taskId: loaded.task.id,
    taskName: loaded.task.name,
    packIds: loaded.task.packIds,
    exportProfileIds: loaded.task.exportProfileIds,
    sampleOnly: true,
    staleWarnings: loaded.expectedFacts.staleWarnings,
    conditions,
    winner,
    summary: formatSummary(conditions, winner)
  };
}

export function runBenchmarkGate(options: BenchmarkGateOptions): BenchmarkGateResult {
  return runBenchmarkGateWithReports(options).gate;
}

function runBenchmarkGateWithReports(options: BenchmarkGateOptions): BenchmarkGateRun {
  const taskIds = options.taskIds?.length ? options.taskIds : listBenchmarkTaskIds({ benchmarkDir: options.benchmarkDir });
  const reports = taskIds.map((taskId) =>
    runBenchmark({
      benchmarkDir: options.benchmarkDir,
      packsDir: options.packsDir,
      conditionOutputsDir: options.conditionOutputsDir,
      taskId
    })
  );
  const minimumContextarrExportScore = options.minimumContextarrExportScore ?? defaultMinimumContextarrExportScore;
  const tasks = reports.map((report) => evaluateGateTask(report, minimumContextarrExportScore));
  const exportScores = tasks
    .map((task) => task.contextarrExportScore)
    .filter((score): score is number => typeof score === "number");
  const passed = tasks.every((task) => task.passed);

  const gate: BenchmarkGateResult = {
    schemaVersion: "contextarr.benchmark-gate.v1",
    benchmarkId: reports[0]?.benchmarkId ?? "contextarr-demo-benchmark-fixtures",
    taskIds,
    sampleOnly: true,
    minimumContextarrExportScore,
    passed,
    summary: {
      tasks: tasks.length,
      passed: tasks.filter((task) => task.passed).length,
      failed: tasks.filter((task) => !task.passed).length,
      minimumContextarrExportScore,
      contextarrExportMinimumObservedScore: exportScores.length ? Math.min(...exportScores) : null,
      failures: tasks.reduce((count, task) => count + task.checks.filter((check) => !check.passed).length, 0),
      staleWarnings: tasks.reduce((count, task) => count + task.staleWarnings.length, 0)
    },
    tasks
  };

  return {
    gate,
    reports
  };
}

export function writeBenchmarkReport(options: WriteBenchmarkReportOptions): WriteBenchmarkReportResult {
  const report = runBenchmark(options);
  const outDir = path.resolve(options.outDir);
  fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, `${report.taskId}.json`);
  const markdownPath = path.join(outDir, `${report.taskId}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(markdownPath, renderBenchmarkMarkdown(report), "utf8");

  return {
    report,
    jsonPath,
    markdownPath
  };
}

export function writeBenchmarkGateReports(options: WriteBenchmarkGateReportsOptions): WriteBenchmarkGateReportsResult {
  const { gate, reports } = runBenchmarkGateWithReports(options);
  const outDir = path.resolve(options.outDir);
  fs.mkdirSync(outDir, { recursive: true });

  const reportFiles = reports.map((report) => {
    const jsonPath = path.join(outDir, `${report.taskId}.json`);
    const markdownPath = path.join(outDir, `${report.taskId}.md`);
    fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    fs.writeFileSync(markdownPath, renderBenchmarkMarkdown(report), "utf8");
    return {
      taskId: report.taskId,
      jsonPath,
      markdownPath
    };
  });

  const gateJsonPath = path.join(outDir, "benchmark-gate.json");
  const gateMarkdownPath = path.join(outDir, "benchmark-gate.md");
  fs.writeFileSync(gateJsonPath, `${JSON.stringify(gate, null, 2)}\n`, "utf8");
  fs.writeFileSync(gateMarkdownPath, renderBenchmarkGateMarkdown(gate), "utf8");

  return {
    gate,
    gateJsonPath,
    gateMarkdownPath,
    reportFiles
  };
}

export function scoreBenchmarkCondition(options: {
  conditionId: BenchmarkConditionId;
  sourcePath: string;
  content: string;
  task: BenchmarkTask;
  expectedFacts: ExpectedFacts;
  scoringRubric: ScoringRubric;
}): BenchmarkConditionResult {
  const normalizedContent = normalizeForMatching(options.content);
  const totalFactWeight = Math.max(
    1,
    options.expectedFacts.requiredFacts.reduce((sum, fact) => sum + fact.weight, 0)
  );
  const matchedFacts = options.expectedFacts.requiredFacts.filter((fact) => factMatches(fact, normalizedContent));
  const matchedFactWeight = matchedFacts.reduce((sum, fact) => sum + fact.weight, 0);
  const coverageRatio = matchedFactWeight / totalFactWeight;
  const forbiddenHits = options.expectedFacts.forbiddenClaims.filter((claim) =>
    normalizedContent.includes(normalizeForMatching(claim.text))
  );
  const sensitiveHits = findSensitiveLeakage(options.content);
  const failedSafety = forbiddenHits.length > 0 || sensitiveHits.length > 0;
  const sectionRatio = sectionCoverageRatio(options.task.expectedOutput.requiredSections, normalizedContent);
  const scores: Record<string, number> = {};

  for (const dimension of dimensionOrder) {
    const max = options.scoringRubric.dimensions[dimension]?.max ?? 0;
    scores[dimension] = scoreDimension(dimension, max, coverageRatio, sectionRatio, failedSafety, options.content);
  }

  const score = Object.values(scores).reduce((sum, value) => sum + value, 0);
  const missingFacts = options.expectedFacts.requiredFacts
    .filter((fact) => !matchedFacts.some((matched) => matched.id === fact.id))
    .map((fact) => fact.id);
  const failures = [
    ...forbiddenHits.map((claim) => claim.id),
    ...sensitiveHits
  ].sort((left, right) => left.localeCompare(right));
  const passed = failures.length === 0;

  return {
    id: options.conditionId,
    label: labelForCondition(options.conditionId),
    sourcePath: normalizePath(options.sourcePath),
    contentTokens: estimateTokens(options.content),
    score,
    maxScore: options.scoringRubric.maxScore,
    scores,
    passed,
    matchedFacts: matchedFacts.map((fact) => fact.id),
    missingFacts,
    failures,
    notes: formatConditionNotes(matchedFacts.length, options.expectedFacts.requiredFacts.length, failures)
  };
}

export function renderBenchmarkMarkdown(report: BenchmarkReport): string {
  const lines = [
    `# Context Quality Benchmark: ${report.taskName}`,
    "",
    `Benchmark: ${report.benchmarkId}`,
    `Task: ${report.taskId}`,
    `Sample only: ${report.sampleOnly ? "yes" : "no"}`,
    `Winner: ${report.winner ?? "none"}`,
    `Stale warnings: ${report.staleWarnings.length > 0 ? report.staleWarnings.length : "none"}`,
    "",
    "## Summary",
    "",
    report.summary,
    "",
    "## Conditions",
    ""
  ];

  for (const condition of report.conditions) {
    lines.push(
      `### ${condition.label}`,
      "",
      `- Score: ${condition.score}/${condition.maxScore}`,
      `- Passed: ${condition.passed ? "yes" : "no"}`,
      `- Source: ${condition.sourcePath}`,
      `- Matched facts: ${condition.matchedFacts.length > 0 ? condition.matchedFacts.join(", ") : "none"}`,
      `- Missing facts: ${condition.missingFacts.length > 0 ? condition.missingFacts.join(", ") : "none"}`,
      `- Failures: ${condition.failures.length > 0 ? condition.failures.join(", ") : "none"}`,
      ""
    );
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderBenchmarkGateMarkdown(gate: BenchmarkGateResult): string {
  const lines = [
    "# Context Quality Benchmark Gate",
    "",
    `Benchmark: ${gate.benchmarkId}`,
    `Sample only: ${gate.sampleOnly ? "yes" : "no"}`,
    `Status: ${gate.passed ? "passed" : "failed"}`,
    `Minimum Contextarr export score: ${gate.minimumContextarrExportScore}`,
    "",
    "## Summary",
    "",
    `Tasks: ${gate.summary.tasks}`,
    `Passed: ${gate.summary.passed}`,
    `Failed: ${gate.summary.failed}`,
    `Contextarr export minimum observed score: ${gate.summary.contextarrExportMinimumObservedScore ?? "none"}`,
    `Failures: ${gate.summary.failures}`,
    `Stale warnings: ${gate.summary.staleWarnings}`,
    "",
    "## Tasks",
    ""
  ];

  for (const task of gate.tasks) {
    lines.push(
      `### ${task.taskName}`,
      "",
      `- Task: ${task.taskId}`,
      `- Status: ${task.passed ? "passed" : "failed"}`,
      `- Contextarr export score: ${task.contextarrExportScore ?? "missing"}`,
      `- Baselines: ${formatBaselineScores(task.baselineScores)}`,
      `- Missing facts: ${task.missingFacts.length > 0 ? task.missingFacts.join(", ") : "none"}`,
      `- Failures: ${task.failures.length > 0 ? task.failures.join(", ") : "none"}`,
      `- Stale warnings: ${task.staleWarnings.length > 0 ? task.staleWarnings.length : "none"}`,
      ""
    );

    for (const check of task.checks) {
      lines.push(`  - ${check.passed ? "PASS" : "FAIL"} ${check.id}: ${check.message}`);
    }

    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function evaluateGateTask(report: BenchmarkReport, minimumContextarrExportScore: number): BenchmarkGateTaskResult {
  const contextarrExport = report.conditions.find((condition) => condition.id === "contextarr_export");
  const noContext = report.conditions.find((condition) => condition.id === "no_context");
  const baselineScores: Partial<Record<BenchmarkConditionId, number>> = {};

  for (const condition of report.conditions) {
    if (condition.id !== "contextarr_export") {
      baselineScores[condition.id] = condition.score;
    }
  }

  const checks: BenchmarkGateCheck[] = [
    {
      id: "contextarr_export_present",
      passed: Boolean(contextarrExport),
      message: contextarrExport ? "Contextarr export condition is present." : "Contextarr export condition is missing."
    }
  ];

  if (contextarrExport) {
    const sensitiveFailures = contextarrExport.failures.filter((failure) => failure.startsWith("sensitive."));
    checks.push(
      {
        id: "contextarr_export_passed",
        passed: contextarrExport.passed,
        message: contextarrExport.passed ? "Contextarr export passed deterministic safety checks." : "Contextarr export failed deterministic safety checks."
      },
      {
        id: "contextarr_export_minimum_score",
        passed: contextarrExport.score >= minimumContextarrExportScore,
        message: `Contextarr export score ${contextarrExport.score}/${contextarrExport.maxScore}; minimum is ${minimumContextarrExportScore}.`
      },
      {
        id: "contextarr_export_required_facts",
        passed: contextarrExport.missingFacts.length === 0,
        message:
          contextarrExport.missingFacts.length === 0
            ? "Contextarr export includes every required fact."
            : `Contextarr export is missing required facts: ${contextarrExport.missingFacts.join(", ")}.`
      },
      {
        id: "contextarr_export_sensitive_leakage",
        passed: sensitiveFailures.length === 0,
        message:
          sensitiveFailures.length === 0
            ? "No sensitive leakage failures were detected."
            : `Sensitive leakage failures detected: ${sensitiveFailures.join(", ")}.`
      },
      {
        id: "contextarr_export_beats_no_context",
        passed: noContext ? contextarrExport.score > noContext.score : true,
        message: noContext
          ? `Contextarr export score ${contextarrExport.score}; no-context score ${noContext.score}.`
          : "No-context baseline is unavailable for comparison."
      }
    );
  }

  return {
    taskId: report.taskId,
    taskName: report.taskName,
    passed: checks.every((check) => check.passed),
    contextarrExportScore: contextarrExport?.score ?? null,
    baselineScores,
    matchedFacts: contextarrExport?.matchedFacts ?? [],
    missingFacts: contextarrExport?.missingFacts ?? [],
    failures: contextarrExport?.failures ?? [],
    staleWarnings: report.staleWarnings,
    checks
  };
}

function loadConditionContent(
  loaded: LoadedBenchmarkTask,
  condition: BenchmarkConditionId,
  options: RunBenchmarkOptions
): { id: BenchmarkConditionId; sourcePath: string; content: string } | undefined {
  const override = options.conditionOutputsDir
    ? readConditionOutputOverride(options.conditionOutputsDir, loaded.task.id, condition)
    : undefined;
  if (override) {
    return {
      id: condition,
      ...override
    };
  }

  const fixtureFile = conditionFixtureFiles[condition];
  if (fixtureFile) {
    const sourcePath = path.join(loaded.taskDir, fixtureFile);
    return {
      id: condition,
      sourcePath,
      content: fs.readFileSync(sourcePath, "utf8")
    };
  }

  if (condition === "contextarr_export") {
    return buildContextarrExportCondition(loaded, options);
  }

  return undefined;
}

function buildContextarrExportCondition(
  loaded: LoadedBenchmarkTask,
  options: RunBenchmarkOptions
): { id: BenchmarkConditionId; sourcePath: string; content: string } | undefined {
  const packsDir = path.resolve(options.packsDir ?? "demo-packs");
  const packId = loaded.task.packIds[0];
  const profileId = loaded.task.exportProfileIds[0];

  if (!packId || !profileId) {
    return undefined;
  }

  const packPath = path.join(packsDir, packId);
  if (!fs.existsSync(packPath)) {
    throw new BenchmarkError("benchmark.pack_not_found", `Benchmark pack path is not readable: ${packPath}`);
  }

  const artifact = buildPackExport({
    packPath,
    profileId,
    generatedAt: fixedExportGeneratedAt
  });

  return {
    id: "contextarr_export",
    sourcePath: `contextarr-export:${packId}/${profileId}`,
    content: artifact.content
  };
}

function readConditionOutputOverride(
  outputsDir: string,
  taskId: string,
  condition: BenchmarkConditionId
): { sourcePath: string; content: string } | undefined {
  const candidates = [
    path.join(outputsDir, taskId, `${condition}.md`),
    path.join(outputsDir, taskId, `${condition}.txt`),
    path.join(outputsDir, `${taskId}-${condition}.md`),
    path.join(outputsDir, `${taskId}-${condition}.txt`)
  ];
  const match = candidates.find((candidate) => fs.existsSync(candidate));

  return match
    ? {
        sourcePath: match,
        content: fs.readFileSync(match, "utf8")
      }
    : undefined;
}

function parseManifest(value: Record<string, unknown>): BenchmarkManifest {
  const id = assertString(value.id, "manifest.id");
  const name = assertString(value.name, "manifest.name");
  const description = assertString(value.description, "manifest.description");
  const conditions = assertStringArray(value.conditions, "manifest.conditions") as BenchmarkConditionId[];
  const futureConditions = value.futureConditions
    ? (assertStringArray(value.futureConditions, "manifest.futureConditions") as BenchmarkConditionId[])
    : undefined;
  const safetyRules = assertObject(value.safetyRules, "manifest.safetyRules");
  const scoring = assertNumberRecord(value.scoring, "manifest.scoring");
  const tasks = assertArray(value.tasks, "manifest.tasks").map((task, index) => parseManifestTask(task, index));

  if (value.schemaVersion !== "contextarr.benchmark.v1") {
    throw new BenchmarkError("benchmark.schema_version", "Unsupported benchmark manifest schema version.");
  }

  return {
    schemaVersion: "contextarr.benchmark.v1",
    id,
    name,
    description,
    conditions,
    futureConditions,
    safetyRules: {
      allowExternalModelCalls: assertBoolean(safetyRules.allowExternalModelCalls, "manifest.safetyRules.allowExternalModelCalls"),
      allowTelemetry: assertBoolean(safetyRules.allowTelemetry, "manifest.safetyRules.allowTelemetry"),
      allowNetworkFetch: assertBoolean(safetyRules.allowNetworkFetch, "manifest.safetyRules.allowNetworkFetch"),
      allowShellExecution: assertBoolean(safetyRules.allowShellExecution, "manifest.safetyRules.allowShellExecution"),
      failOnSensitiveLeakage: assertBoolean(safetyRules.failOnSensitiveLeakage, "manifest.safetyRules.failOnSensitiveLeakage"),
      failOnUnapprovedContent: assertBoolean(safetyRules.failOnUnapprovedContent, "manifest.safetyRules.failOnUnapprovedContent")
    },
    tasks,
    scoring
  };
}

function parseManifestTask(value: unknown, index: number): BenchmarkManifestTask {
  const task = assertObject(value, `manifest.tasks.${index}`);
  return {
    id: assertString(task.id, `manifest.tasks.${index}.id`),
    taskType: assertString(task.taskType, `manifest.tasks.${index}.taskType`),
    packIds: assertStringArray(task.packIds, `manifest.tasks.${index}.packIds`),
    taskPath: assertString(task.taskPath, `manifest.tasks.${index}.taskPath`)
  };
}

function parseTask(value: Record<string, unknown>, filePath: string): BenchmarkTask {
  if (value.schemaVersion !== "contextarr.benchmark-task.v1") {
    throw new BenchmarkError("benchmark.task_schema_version", `Unsupported benchmark task schema version: ${filePath}`);
  }

  const expectedOutput = assertObject(value.expectedOutput, "task.expectedOutput");
  return {
    schemaVersion: "contextarr.benchmark-task.v1",
    id: assertString(value.id, "task.id"),
    name: assertString(value.name, "task.name"),
    taskType: assertString(value.taskType, "task.taskType"),
    packIds: assertStringArray(value.packIds, "task.packIds"),
    exportProfileIds: assertStringArray(value.exportProfileIds, "task.exportProfileIds"),
    conditions: assertStringArray(value.conditions, "task.conditions") as BenchmarkConditionId[],
    futureConditions: value.futureConditions
      ? (assertStringArray(value.futureConditions, "task.futureConditions") as BenchmarkConditionId[])
      : undefined,
    prompt: assertString(value.prompt, "task.prompt"),
    targetAudience: assertString(value.targetAudience, "task.targetAudience"),
    expectedOutput: {
      format: assertString(expectedOutput.format, "task.expectedOutput.format"),
      requiredSections: assertStringArray(expectedOutput.requiredSections, "task.expectedOutput.requiredSections")
    },
    blockedBehavior: assertStringArray(value.blockedBehavior, "task.blockedBehavior")
  };
}

function parseExpectedFacts(value: Record<string, unknown>, taskId: string): ExpectedFacts {
  if (value.schemaVersion !== "contextarr.expected-facts.v1") {
    throw new BenchmarkError("benchmark.expected_facts_schema_version", `Unsupported expected facts schema for task: ${taskId}`);
  }

  return {
    schemaVersion: "contextarr.expected-facts.v1",
    taskId: assertString(value.taskId, "expectedFacts.taskId"),
    requiredFacts: assertArray(value.requiredFacts, "expectedFacts.requiredFacts").map((fact, index) =>
      parseRequiredFact(fact, index)
    ),
    forbiddenClaims: assertArray(value.forbiddenClaims ?? [], "expectedFacts.forbiddenClaims").map((claim, index) =>
      parseTextItem(claim, `expectedFacts.forbiddenClaims.${index}`)
    ),
    staleWarnings: assertArray(value.staleWarnings ?? [], "expectedFacts.staleWarnings").map((warning, index) => {
      const object = assertObject(warning, `expectedFacts.staleWarnings.${index}`);
      return {
        sourceId: assertString(object.sourceId, `expectedFacts.staleWarnings.${index}.sourceId`),
        expectedHandling: assertString(object.expectedHandling, `expectedFacts.staleWarnings.${index}.expectedHandling`)
      };
    }),
    sensitiveFacts: assertArray(value.sensitiveFacts ?? [], "expectedFacts.sensitiveFacts").map((fact, index) => {
      const object = assertObject(fact, `expectedFacts.sensitiveFacts.${index}`);
      return {
        id: assertString(object.id, `expectedFacts.sensitiveFacts.${index}.id`),
        handling: assertString(object.handling, `expectedFacts.sensitiveFacts.${index}.handling`)
      };
    })
  };
}

function parseRequiredFact(value: unknown, index: number): RequiredFact {
  const fact = assertObject(value, `expectedFacts.requiredFacts.${index}`);
  return {
    id: assertString(fact.id, `expectedFacts.requiredFacts.${index}.id`),
    recordId: fact.recordId ? assertString(fact.recordId, `expectedFacts.requiredFacts.${index}.recordId`) : undefined,
    sourceId: assertString(fact.sourceId, `expectedFacts.requiredFacts.${index}.sourceId`),
    text: assertString(fact.text, `expectedFacts.requiredFacts.${index}.text`),
    weight: assertNumber(fact.weight, `expectedFacts.requiredFacts.${index}.weight`)
  };
}

function parseScoringRubric(value: Record<string, unknown>, taskId: string): ScoringRubric {
  if (value.schemaVersion !== "contextarr.scoring-rubric.v1") {
    throw new BenchmarkError("benchmark.scoring_rubric_schema_version", `Unsupported scoring rubric schema for task: ${taskId}`);
  }

  const dimensions = assertObject(value.dimensions, "rubric.dimensions");
  const parsedDimensions: ScoringRubric["dimensions"] = {};
  for (const key of Object.keys(dimensions).sort((left, right) => left.localeCompare(right))) {
    const dimension = assertObject(dimensions[key], `rubric.dimensions.${key}`);
    parsedDimensions[key] = {
      max: assertNumber(dimension.max, `rubric.dimensions.${key}.max`),
      criteria: assertStringArray(dimension.criteria, `rubric.dimensions.${key}.criteria`)
    };
  }

  return {
    schemaVersion: "contextarr.scoring-rubric.v1",
    taskId: assertString(value.taskId, "rubric.taskId"),
    maxScore: assertNumber(value.maxScore, "rubric.maxScore"),
    failRules: assertArray(value.failRules ?? [], "rubric.failRules").map((rule, index) => {
      const object = assertObject(rule, `rubric.failRules.${index}`);
      return {
        id: assertString(object.id, `rubric.failRules.${index}.id`),
        dimension: assertString(object.dimension, `rubric.failRules.${index}.dimension`),
        when: assertString(object.when, `rubric.failRules.${index}.when`),
        result: assertString(object.result, `rubric.failRules.${index}.result`)
      };
    }),
    dimensions: parsedDimensions
  };
}

function validateTaskConsistency(
  manifest: BenchmarkManifest,
  manifestTask: BenchmarkManifestTask,
  task: BenchmarkTask,
  expectedFacts: ExpectedFacts,
  scoringRubric: ScoringRubric,
  taskDir: string
): void {
  if (task.id !== manifestTask.id || expectedFacts.taskId !== task.id || scoringRubric.taskId !== task.id) {
    throw new BenchmarkError("benchmark.task_mismatch", `Benchmark task IDs do not match for ${manifestTask.id}.`);
  }

  if (task.taskType !== manifestTask.taskType) {
    throw new BenchmarkError("benchmark.task_type_mismatch", `Benchmark task type mismatch for ${task.id}.`);
  }

  for (const packId of manifestTask.packIds) {
    if (!task.packIds.includes(packId)) {
      throw new BenchmarkError("benchmark.pack_mismatch", `Manifest pack ${packId} is missing from task ${task.id}.`);
    }
  }

  for (const condition of task.conditions) {
    if (!manifest.conditions.includes(condition)) {
      throw new BenchmarkError("benchmark.condition_mismatch", `Task ${task.id} uses condition not in manifest: ${condition}`);
    }
  }

  for (const condition of ["no_context", "manual_prompt", "raw_notes"] as BenchmarkConditionId[]) {
    const fixtureFile = conditionFixtureFiles[condition]!;
    if (!fs.existsSync(path.join(taskDir, fixtureFile))) {
      throw new BenchmarkError("benchmark.condition_file_missing", `Task ${task.id} is missing ${fixtureFile}.`);
    }
  }
}

function assertLocalOnlySafety(manifest: BenchmarkManifest): void {
  const { safetyRules } = manifest;
  if (
    safetyRules.allowExternalModelCalls ||
    safetyRules.allowTelemetry ||
    safetyRules.allowNetworkFetch ||
    safetyRules.allowShellExecution
  ) {
    throw new BenchmarkError(
      "benchmark.safety_boundary",
      "G3 benchmark fixtures must disable external model calls, telemetry, network fetches, and shell execution."
    );
  }
}

function scoreDimension(
  dimension: string,
  max: number,
  coverageRatio: number,
  sectionRatio: number,
  failedSafety: boolean,
  content: string
): number {
  if (max <= 0) {
    return 0;
  }

  if (dimension === "sensitiveLeakage") {
    return failedSafety ? 0 : max;
  }

  if (dimension === "outputStructure") {
    return Math.round(max * sectionRatio);
  }

  if (dimension === "tokenEfficiency") {
    return tokenEfficiencyScore(max, content);
  }

  if (dimension === "taskSuccess") {
    return Math.round(max * (coverageRatio * 0.8 + sectionRatio * 0.2));
  }

  if (dimension === "groundingAccuracy") {
    return failedSafety ? 0 : Math.round(max * coverageRatio);
  }

  if (dimension === "sourceCoverage") {
    return Math.round(max * coverageRatio);
  }

  return Math.round(max * coverageRatio);
}

function tokenEfficiencyScore(max: number, content: string): number {
  const tokens = estimateTokens(content);
  if (tokens <= 750) {
    return max;
  }
  if (tokens <= 1500) {
    return Math.max(0, max - 1);
  }
  if (tokens <= 2500) {
    return Math.max(0, max - 2);
  }
  return Math.max(0, Math.floor(max / 2));
}

function factMatches(fact: RequiredFact, normalizedContent: string): boolean {
  const normalizedFact = normalizeForMatching(fact.text);
  if (normalizedContent.includes(normalizedFact)) {
    return true;
  }

  if (fact.recordId && normalizedContent.includes(normalizeForMatching(fact.recordId))) {
    return true;
  }

  if (normalizedContent.includes(normalizeForMatching(fact.sourceId))) {
    return true;
  }

  const factTokens = importantTokens(normalizedFact);
  if (factTokens.length === 0) {
    return false;
  }

  const outputTokens = new Set(importantTokens(normalizedContent));
  const matched = factTokens.filter((token) => outputTokens.has(token)).length;
  return matched >= Math.min(3, factTokens.length) && matched / factTokens.length >= 0.55;
}

function sectionCoverageRatio(requiredSections: string[], normalizedContent: string): number {
  if (requiredSections.length === 0) {
    return 1;
  }

  const matched = requiredSections.filter((section) => {
    const normalized = normalizeForMatching(section.replace(/_/g, " "));
    const raw = normalizeForMatching(section);
    return normalizedContent.includes(normalized) || normalizedContent.includes(raw);
  }).length;

  return matched / requiredSections.length;
}

function findSensitiveLeakage(content: string): string[] {
  const checks: Array<[string, RegExp]> = [
    ["sensitive.secret_assignment", /\b(?:api[_-]?key|secret|password|private\s+key|credential|token)\s*[:=]\s*[A-Za-z0-9_./=-]{6,}/i],
    ["sensitive.private_ipv4", /\b(?:10|192\.168)\.\d{1,3}\.\d{1,3}\b/],
    ["sensitive.private_ipv4", /\b172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}\b/],
    ["sensitive.private_windows_path", /\b[A-Z]:\\Users\\[^ \n\r]+/i]
  ];

  return Array.from(new Set(checks.filter(([, regex]) => regex.test(content)).map(([code]) => code))).sort((left, right) =>
    left.localeCompare(right)
  );
}

function formatConditionNotes(matchedCount: number, requiredCount: number, failures: string[]): string[] {
  const notes = [`Matched ${matchedCount} of ${requiredCount} required fact(s).`];
  if (failures.length > 0) {
    notes.push(`Failed safety checks: ${failures.join(", ")}.`);
  }
  return notes;
}

function formatSummary(conditions: BenchmarkConditionResult[], winner: string | null): string {
  if (conditions.length === 0) {
    return "No benchmark conditions were scored.";
  }

  const conditionList = conditions.map((condition) => `${condition.id}=${condition.score}`).join(", ");
  return winner
    ? `Highest passing condition: ${winner}. Scores: ${conditionList}.`
    : `No condition passed. Scores: ${conditionList}.`;
}

function formatBaselineScores(scores: Partial<Record<BenchmarkConditionId, number>>): string {
  const entries = Object.entries(scores)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([condition, score]) => `${condition}=${score}`);
  return entries.length > 0 ? entries.join(", ") : "none";
}

function labelForCondition(condition: BenchmarkConditionId): string {
  const labels: Record<BenchmarkConditionId, string> = {
    no_context: "No Context",
    manual_prompt: "Manual Prompt",
    raw_notes: "Raw Notes",
    contextarr_export: "Contextarr Export",
    contextarr_cli_brief: "Contextarr CLI Brief",
    contextarr_mcp_query: "Contextarr MCP Query"
  };
  return labels[condition];
}

function readJsonObject(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) {
    throw new BenchmarkError("benchmark.file_not_found", `Benchmark file not found: ${filePath}`);
  }
  return assertObject(JSON.parse(fs.readFileSync(filePath, "utf8")), filePath);
}

function readYamlObject(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) {
    throw new BenchmarkError("benchmark.file_not_found", `Benchmark file not found: ${filePath}`);
  }
  return assertObject(parseFixtureYaml(fs.readFileSync(filePath, "utf8")), filePath);
}

function parseFixtureYaml(source: string): unknown {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const parsed = parseYamlBlock(lines, 0, 0).value;
  return parsed;
}

function parseYamlBlock(lines: string[], index: number, indent: number): { value: unknown; index: number } {
  const next = nextYamlLine(lines, index);
  if (!next) {
    return { value: {}, index };
  }

  return next.indent === indent && next.text.startsWith("- ")
    ? parseYamlArray(lines, next.index, indent)
    : parseYamlObjectBlock(lines, next.index, indent);
}

function parseYamlObjectBlock(lines: string[], index: number, indent: number): { value: Record<string, unknown>; index: number } {
  const object: Record<string, unknown> = {};
  let cursor = index;

  while (cursor < lines.length) {
    const current = nextYamlLine(lines, cursor);
    if (!current) {
      return { value: object, index: lines.length };
    }
    if (current.indent < indent || current.text.startsWith("- ")) {
      return { value: object, index: current.index };
    }
    if (current.indent > indent) {
      cursor = current.index + 1;
      continue;
    }

    const { key, rawValue } = parseYamlKeyValue(current.text);
    if (rawValue === "|") {
      const multiline = readYamlMultiline(lines, current.index + 1, indent + 2);
      object[key] = multiline.value;
      cursor = multiline.index;
      continue;
    }

    if (rawValue === "") {
      const nested = parseYamlBlock(lines, current.index + 1, indent + 2);
      object[key] = nested.value;
      cursor = nested.index;
      continue;
    }

    object[key] = parseYamlScalar(rawValue);
    cursor = current.index + 1;
  }

  return { value: object, index: cursor };
}

function parseYamlArray(lines: string[], index: number, indent: number): { value: unknown[]; index: number } {
  const values: unknown[] = [];
  let cursor = index;

  while (cursor < lines.length) {
    const current = nextYamlLine(lines, cursor);
    if (!current) {
      return { value: values, index: lines.length };
    }
    if (current.indent < indent || current.indent > indent || !current.text.startsWith("- ")) {
      return { value: values, index: current.index };
    }

    const itemText = current.text.slice(2).trim();
    if (itemText.includes(":")) {
      const item: Record<string, unknown> = {};
      const { key, rawValue } = parseYamlKeyValue(itemText);
      let nextIndex = current.index + 1;

      if (rawValue === "|") {
        const multiline = readYamlMultiline(lines, nextIndex, indent + 4);
        item[key] = multiline.value;
        nextIndex = multiline.index;
      } else if (rawValue === "") {
        const nested = parseYamlBlock(lines, nextIndex, indent + 4);
        item[key] = nested.value;
        nextIndex = nested.index;
      } else {
        item[key] = parseYamlScalar(rawValue);
      }

      const continuation = parseYamlObjectBlock(lines, nextIndex, indent + 2);
      Object.assign(item, continuation.value);
      values.push(item);
      cursor = continuation.index;
      continue;
    }

    values.push(parseYamlScalar(itemText));
    cursor = current.index + 1;
  }

  return { value: values, index: cursor };
}

function readYamlMultiline(lines: string[], index: number, indent: number): { value: string; index: number } {
  const collected: string[] = [];
  let cursor = index;

  while (cursor < lines.length) {
    const rawLine = lines[cursor];
    if (rawLine.trim() === "") {
      collected.push("");
      cursor += 1;
      continue;
    }

    const currentIndent = leadingSpaces(rawLine);
    if (currentIndent < indent) {
      break;
    }

    collected.push(rawLine.slice(Math.min(indent, rawLine.length)));
    cursor += 1;
  }

  return { value: collected.join("\n").trimEnd(), index: cursor };
}

function nextYamlLine(lines: string[], index: number): { index: number; indent: number; text: string } | undefined {
  for (let cursor = index; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (line.trim() === "" || line.trimStart().startsWith("#")) {
      continue;
    }
    return {
      index: cursor,
      indent: leadingSpaces(line),
      text: line.trim()
    };
  }
  return undefined;
}

function parseYamlKeyValue(text: string): { key: string; rawValue: string } {
  const separator = text.indexOf(":");
  if (separator === -1) {
    throw new BenchmarkError("benchmark.invalid_shape", `Expected YAML key/value line: ${text}`);
  }
  return {
    key: text.slice(0, separator).trim(),
    rawValue: text.slice(separator + 1).trim()
  };
}

function parseYamlScalar(value: string): unknown {
  if (value === "[]") {
    return [];
  }
  if (value === "{}") {
    return {};
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function leadingSpaces(value: string): number {
  return value.length - value.trimStart().length;
}

function parseTextItem(value: unknown, pathLabel: string): { id: string; text: string } {
  const object = assertObject(value, pathLabel);
  return {
    id: assertString(object.id, `${pathLabel}.id`),
    text: assertString(object.text, `${pathLabel}.text`)
  };
}

function assertObject(value: unknown, pathLabel: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BenchmarkError("benchmark.invalid_shape", `Expected object at ${pathLabel}.`);
  }
  return value as Record<string, unknown>;
}

function assertArray(value: unknown, pathLabel: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new BenchmarkError("benchmark.invalid_shape", `Expected array at ${pathLabel}.`);
  }
  return value;
}

function assertStringArray(value: unknown, pathLabel: string): string[] {
  const values = assertArray(value, pathLabel);
  for (const [index, item] of values.entries()) {
    assertString(item, `${pathLabel}.${index}`);
  }
  return values as string[];
}

function assertNumberRecord(value: unknown, pathLabel: string): Record<string, number> {
  const object = assertObject(value, pathLabel);
  const parsed: Record<string, number> = {};
  for (const key of Object.keys(object).sort((left, right) => left.localeCompare(right))) {
    parsed[key] = assertNumber(object[key], `${pathLabel}.${key}`);
  }
  return parsed;
}

function assertString(value: unknown, pathLabel: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BenchmarkError("benchmark.invalid_shape", `Expected non-empty string at ${pathLabel}.`);
  }
  return value;
}

function assertNumber(value: unknown, pathLabel: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new BenchmarkError("benchmark.invalid_shape", `Expected finite number at ${pathLabel}.`);
  }
  return value;
}

function assertBoolean(value: unknown, pathLabel: string): boolean {
  if (typeof value !== "boolean") {
    throw new BenchmarkError("benchmark.invalid_shape", `Expected boolean at ${pathLabel}.`);
  }
  return value;
}

function normalizeForMatching(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_./\\:-]+/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function importantTokens(value: string): string[] {
  return Array.from(
    new Set(
      normalizeForMatching(value)
        .split(" ")
        .filter((token) => token.length >= 4 && !stopwords.has(token))
    )
  ).sort((left, right) => left.localeCompare(right));
}

function estimateTokens(content: string): number {
  return Math.max(1, Math.ceil(content.length / 4));
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}
