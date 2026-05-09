# CLI JSON Schemas

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating any JSON envelope as shipped.

## Purpose

This document describes planned CLI JSON shapes. It is documentation-first and does not imply that all schemas are implemented in TypeScript yet.

## 1. CliResultV1

```ts
interface CliResultV1<TData = unknown> {
  schemaVersion: "contextarr.cli-result.v1";
  command: string;
  status: "success" | "warning" | "blocked" | "failed";
  ok: boolean;
  data: TData;
  warnings: CliWarningV1[];
  errors: CliErrorV1[];
  meta: {
    generatedAt?: string;
    contextarrVersion: string;
    workingDirectory?: string;
    redacted: boolean;
  };
}
```

`generatedAt` is optional and should be omitted in deterministic validation, export, and report commands unless a caller supplies it or deterministic mode is disabled.

## 2. CliErrorV1

```ts
interface CliErrorV1 {
  code: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  message: string;
  file?: string;
  path?: string;
  hint?: string;
}
```

## 3. ValidateResultV1

```ts
interface ValidateResultV1 {
  targetPath: string;
  valid: boolean;
  packs: Array<{
    packPath: string;
    packId?: string;
    valid: boolean;
    issues: CliErrorV1[];
    summary: {
      errors: number;
      warnings: number;
      infos: number;
    };
  }>;
  summary: {
    packs: number;
    validPacks: number;
    invalidPacks: number;
    errors: number;
    warnings: number;
    infos: number;
  };
}
```

## 4. HealthResultV1

```ts
interface HealthResultV1 {
  packId: string;
  score: number;
  status: "healthy" | "degraded" | "needs_review" | "blocked";
  reviewQueueCount: number;
  checks: Array<{
    id: string;
    label: string;
    status: "pass" | "warning" | "error" | "blocked";
    count: number;
  }>;
  blockers: CliErrorV1[];
}
```

## 5. ExportResultV1

```ts
interface ExportResultV1 {
  packId: string;
  target?: string;
  profileId?: string;
  privacy: "redacted" | "full" | "public_safe";
  output?: {
    path?: string;
    filename?: string;
    mimeType?: string;
    bytes: number;
    estimatedTokens?: number;
  };
  includedRecords: Array<{
    id: string;
    title: string;
    privacy: string;
    sources: string[];
  }>;
  excludedRecords: Array<{
    id: string;
    title: string;
    reason: string;
  }>;
  warnings: CliWarningV1[];
}
```

## 6. BriefResultV1

```ts
interface BriefResultV1 {
  packId: string;
  target: "codex" | "claude-code" | "chatgpt" | "claude" | string;
  task: string;
  privacy: "redacted" | "full" | "public_safe";
  format: "json" | "markdown";
  sections: Array<{
    id: string;
    title: string;
    content: string | string[] | Record<string, unknown>;
    sources?: string[];
  }>;
  includedRecords: string[];
  excludedRecords: Array<{
    id: string;
    reason: string;
  }>;
  acceptanceCriteria: string[];
  securityNotes: string[];
}
```

For Codex target, brief sections should include task goal, phase scope, relevant source-backed context, hard boundaries, likely files or packages, commands to run, tests to run, acceptance criteria, security notes, final report format, and instruction to stop after requested scope.

For Claude Code target, brief sections should include project context, coding conventions, source-backed decisions, constraints, relevant records, safe file boundaries, test expectations, and review expectations.

For ChatGPT target, brief sections should include concise context, task goal, important facts, constraints, expected output, and relevant sources.

For Claude target, brief sections may include deeper context, source-backed facts, do-not-assume section, uncertainty warnings, stale warnings, and review status.

## 7. QueryResultV1

```ts
interface QueryResultV1 {
  query: string;
  packId?: string;
  privacy: "redacted" | "full" | "public_safe";
  resultCount: number;
  limit: number;
  results: Array<{
    recordId: string;
    packId: string;
    title: string;
    snippet: string;
    score?: number;
    sources: string[];
    redacted: boolean;
  }>;
}
```

## 8. ReviewListResultV1

```ts
interface ReviewListResultV1 {
  filters: {
    packId?: string;
    severity?: string;
    status?: string;
    type?: string;
  };
  counts: {
    total: number;
    open: number;
    filtered: number;
  };
  items: Array<{
    id: string;
    packId: string;
    recordId?: string;
    sourceId?: string;
    type: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    status: string;
    message: string;
    suggestedAction?: string;
  }>;
}
```

## 9. ImportDryRunResultV1

```ts
interface ImportDryRunResultV1 {
  inputPath: string;
  detectedKind: "folder" | "markdown" | "obsidian" | "chatgpt" | "claude" | "zip" | "unknown";
  quarantineRequired: boolean;
  wouldWrite: Array<{
    path: string;
    kind: "manifest" | "record" | "source" | "rule" | "export" | "asset" | "quarantine-metadata";
  }>;
  records: {
    detected: number;
    wouldImport: number;
    skipped: number;
  };
  warnings: CliWarningV1[];
  blockers: CliErrorV1[];
}
```

## 10. QuarantineResultV1, future

```ts
interface QuarantineResultV1 {
  items: Array<{
    id: string;
    kind: "pack" | "registry-artifact" | "skill" | "agent-kit" | "archive" | "unknown";
    source: string;
    status: "quarantined" | "blocked" | "activated" | "deleted";
    createdAt?: string;
    reviewStatus: "unreviewed" | "needs_review" | "approved" | "blocked";
    validation: {
      valid: boolean;
      errors: number;
      warnings: number;
    };
  }>;
}
```

## CliWarningV1

```ts
interface CliWarningV1 {
  code: string;
  severity: "high" | "medium" | "low" | "info";
  message: string;
  file?: string;
  path?: string;
  hint?: string;
}
```
