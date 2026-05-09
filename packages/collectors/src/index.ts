import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  importToDraftPack,
  previewImport,
  ImporterError,
  type DraftImportResult,
  type DraftPackPreview,
  type ImportWarning
} from "@contextarr/importers";
import { validatePack, type ValidationResult } from "@contextarr/pack-validator";
import type { ContextPackManifest, RecordFrontmatter, Source } from "@contextarr/schema";

export type ContextPackCollectorId =
  | "blank-pack-starter"
  | "markdown-folder"
  | "project-notes"
  | "support-kb-starter";

export interface ContextPackCollectorDefinition {
  id: ContextPackCollectorId;
  name: string;
  description: string;
  inputMode: "none" | "local_path";
  defaultPackId: string;
  defaultName: string;
  defaultMaxRecords: number;
}

export interface RunContextPackCollectorOptions {
  collectorId: ContextPackCollectorId;
  outputDir: string;
  inputPath?: string;
  packId?: string;
  name?: string;
  description?: string;
  maxRecords?: number;
  overwrite?: boolean;
  generatedAt?: string;
}

export interface PreviewContextPackCollectorOptions {
  collectorId: ContextPackCollectorId;
  inputPath?: string;
  packId?: string;
  name?: string;
  description?: string;
  maxRecords?: number;
}

export interface ContextPackCollectorRecordPreview {
  id: string;
  title: string;
  type: string;
  tags: string[];
  sourceId: string;
}

export interface ContextPackCollectorPreview {
  collectorId: ContextPackCollectorId;
  packId: string;
  packName: string;
  records: ContextPackCollectorRecordPreview[];
  sourceCount: number;
  warnings: ImportWarning[];
}

export interface ContextPackCollectorResult {
  collectorId: ContextPackCollectorId;
  packId: string;
  packName: string;
  packPath: string;
  recordCount: number;
  sourceCount: number;
  warnings: ImportWarning[];
  validation: ValidationResult;
}

interface StarterRecordTemplate {
  slug: string;
  title: string;
  type: string;
  body: string;
}

interface StarterPackPreview {
  packId: string;
  packName: string;
  description: string;
  records: Array<StarterRecordTemplate & { id: string; tags: string[]; sourceId: string }>;
  sources: Source[];
  warnings: ImportWarning[];
}

export class CollectorError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "CollectorError";
  }
}

const collectorDefinitions: ContextPackCollectorDefinition[] = [
  {
    id: "blank-pack-starter",
    name: "Blank Pack Starter",
    description: "Create a private draft Context Pack with one overview record.",
    inputMode: "none",
    defaultPackId: "blank-pack-draft",
    defaultName: "Blank Draft Pack",
    defaultMaxRecords: 1
  },
  {
    id: "markdown-folder",
    name: "Markdown Folder",
    description: "Convert a local Markdown folder into private draft Context Pack records.",
    inputMode: "local_path",
    defaultPackId: "markdown-folder-draft",
    defaultName: "Markdown Folder Draft Pack",
    defaultMaxRecords: 50
  },
  {
    id: "project-notes",
    name: "Project Notes",
    description: "Collect safe local text-like project notes into a private draft Context Pack.",
    inputMode: "local_path",
    defaultPackId: "project-notes-draft",
    defaultName: "Project Notes Draft Pack",
    defaultMaxRecords: 50
  },
  {
    id: "support-kb-starter",
    name: "Support KB Starter",
    description: "Create a private draft support knowledge base starter pack.",
    inputMode: "none",
    defaultPackId: "support-kb-draft",
    defaultName: "Support KB Draft Pack",
    defaultMaxRecords: 4
  }
];

const starterRecords: Record<"blank-pack-starter" | "support-kb-starter", StarterRecordTemplate[]> = {
  "blank-pack-starter": [
    {
      slug: "overview",
      title: "Overview",
      type: "collector_overview",
      body: "# Overview\n\nDraft the purpose, audience, source boundaries, and review checklist for this Context Pack."
    }
  ],
  "support-kb-starter": [
    {
      slug: "known-issues",
      title: "Known Issues",
      type: "support_kb_note",
      body: "# Known Issues\n\nDraft public-safe known issues, symptoms, workarounds, and source references."
    },
    {
      slug: "support-workflow",
      title: "Support Workflow",
      type: "support_kb_note",
      body: "# Support Workflow\n\nDraft the intake, triage, escalation, and handoff workflow for support use."
    },
    {
      slug: "faq-draft",
      title: "FAQ Draft",
      type: "support_kb_note",
      body: "# FAQ Draft\n\nDraft common questions, concise answers, and links back to approved sources."
    },
    {
      slug: "escalation-notes",
      title: "Escalation Notes",
      type: "support_kb_note",
      body: "# Escalation Notes\n\nDraft escalation criteria, owner notes, and follow-up requirements."
    }
  ]
};

export function listContextPackCollectors(): ContextPackCollectorDefinition[] {
  return collectorDefinitions.map((collector) => ({ ...collector }));
}

export function isContextPackCollectorId(value: string): value is ContextPackCollectorId {
  return collectorDefinitions.some((collector) => collector.id === value);
}

export function previewContextPackCollector(options: PreviewContextPackCollectorOptions): ContextPackCollectorPreview {
  const definition = getCollectorDefinition(options.collectorId);
  if (definition.inputMode === "local_path") {
    const preview = previewImportForCollector(definition, options);
    return {
      collectorId: definition.id,
      packId: preview.packId,
      packName: preview.packName,
      records: preview.records.map((record) => ({
        id: record.id,
        title: record.title,
        type: record.type,
        tags: record.tags,
        sourceId: record.sourceId
      })),
      sourceCount: preview.sources.length,
      warnings: preview.warnings
    };
  }

  const preview = buildStarterPreview(definition, options);
  return {
    collectorId: definition.id,
    packId: preview.packId,
    packName: preview.packName,
    records: preview.records.map((record) => ({
      id: record.id,
      title: record.title,
      type: record.type,
      tags: record.tags,
      sourceId: record.sourceId
    })),
    sourceCount: preview.sources.length,
    warnings: preview.warnings
  };
}

export function runContextPackCollector(options: RunContextPackCollectorOptions): ContextPackCollectorResult {
  const definition = getCollectorDefinition(options.collectorId);
  const outputRoot = path.resolve(options.outputDir);
  ensureOutputRoot(outputRoot);

  if (definition.inputMode === "local_path") {
    return importResultForCollector(definition, options, outputRoot);
  }

  const preview = buildStarterPreview(definition, options);
  const packPath = path.join(outputRoot, preview.packId);
  assertInside(outputRoot, packPath);

  if (fs.existsSync(packPath)) {
    if (!options.overwrite) {
      throw new CollectorError("output.exists", `Draft pack already exists: ${packPath}`);
    }
    fs.rmSync(packPath, { recursive: true, force: true });
  }

  writeStarterDraftPack(packPath, definition, preview, options.generatedAt ?? new Date().toISOString());
  const validation = validatePack(packPath);

  return {
    collectorId: definition.id,
    packId: preview.packId,
    packName: preview.packName,
    packPath,
    recordCount: preview.records.length,
    sourceCount: preview.sources.length,
    warnings: preview.warnings,
    validation
  };
}

export function normalizeContextPackCollectorPackId(value: string): string {
  const id = value
    .replace(/\\/g, "/")
    .replace(/\.[A-Za-z0-9]+$/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._/-]+/g, "-")
    .replace(/[/-]+/g, "-")
    .replace(/^\.+/g, "")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return id || "draft-context-pack";
}

function getCollectorDefinition(collectorId: ContextPackCollectorId): ContextPackCollectorDefinition {
  const definition = collectorDefinitions.find((collector) => collector.id === collectorId);
  if (!definition) {
    throw new CollectorError("collector.unknown", `Unknown Context Pack collector: ${collectorId}`);
  }

  return definition;
}

function previewImportForCollector(
  definition: ContextPackCollectorDefinition,
  options: PreviewContextPackCollectorOptions
): DraftPackPreview {
  if (!options.inputPath?.trim()) {
    throw new CollectorError("collector.input_required", `${definition.name} requires a local input path.`);
  }

  try {
    return previewImport({
      inputPath: options.inputPath,
      kind: definition.id === "markdown-folder" ? "markdown" : "folder",
      packId: normalizeOptionalPackId(options.packId),
      name: normalizeOptionalString(options.name),
      maxRecords: options.maxRecords ?? definition.defaultMaxRecords
    });
  } catch (error) {
    throw normalizeCollectorError(error);
  }
}

function importResultForCollector(
  definition: ContextPackCollectorDefinition,
  options: RunContextPackCollectorOptions,
  outputRoot: string
): ContextPackCollectorResult {
  if (!options.inputPath?.trim()) {
    throw new CollectorError("collector.input_required", `${definition.name} requires a local input path.`);
  }

  let result: DraftImportResult;
  try {
    result = importToDraftPack({
      inputPath: options.inputPath,
      kind: definition.id === "markdown-folder" ? "markdown" : "folder",
      outputDir: outputRoot,
      packId: normalizeOptionalPackId(options.packId),
      name: normalizeOptionalString(options.name),
      maxRecords: options.maxRecords ?? definition.defaultMaxRecords,
      overwrite: Boolean(options.overwrite),
      generatedAt: options.generatedAt
    });
  } catch (error) {
    throw normalizeCollectorError(error);
  }

  assertInside(outputRoot, result.packPath);
  return {
    collectorId: definition.id,
    packId: result.packId,
    packName: result.packName,
    packPath: result.packPath,
    recordCount: result.recordCount,
    sourceCount: result.sourceCount,
    warnings: result.warnings,
    validation: result.validation
  };
}

function buildStarterPreview(
  definition: ContextPackCollectorDefinition,
  options: PreviewContextPackCollectorOptions
): StarterPackPreview {
  if (definition.id !== "blank-pack-starter" && definition.id !== "support-kb-starter") {
    throw new CollectorError("collector.unsupported_starter", `${definition.name} is not a starter collector.`);
  }

  const packId = normalizeContextPackCollectorPackId(options.packId ?? definition.defaultPackId);
  const packName = normalizeOptionalString(options.name) ?? definition.defaultName;
  const description =
    normalizeOptionalString(options.description) ?? `Private draft Context Pack generated by the ${definition.name} collector.`;
  const records = starterRecords[definition.id].slice(0, options.maxRecords ?? definition.defaultMaxRecords).map((record) => ({
    ...record,
    id: `${packId}.${record.slug}`,
    tags: uniqueTags(["collector_draft", "imported_draft", "never_export", record.type]),
    sourceId: `${packId}.source.${record.slug}`
  }));
  const sources = records.map(
    (record): Source => ({
      id: record.sourceId,
      type: "synthetic",
      title: `${record.title} starter source`,
      path: `collector:${definition.id}/${record.slug}`,
      license: "N/A",
      license_status: "not_applicable",
      trust: "unreviewed",
      status: "current"
    })
  );

  return {
    packId,
    packName,
    description,
    records,
    sources,
    warnings: [
      {
        code: "collector.draft_requires_review",
        message: "Collector output is private, unreviewed, and excluded from exports until reviewed."
      }
    ]
  };
}

function writeStarterDraftPack(
  packPath: string,
  definition: ContextPackCollectorDefinition,
  preview: StarterPackPreview,
  generatedAt: string
): void {
  fs.mkdirSync(path.join(packPath, "records"), { recursive: true });
  fs.mkdirSync(path.join(packPath, "sources"), { recursive: true });
  fs.mkdirSync(path.join(packPath, "exports"), { recursive: true });
  fs.mkdirSync(path.join(packPath, "rules"), { recursive: true });

  const manifest: ContextPackManifest = {
    id: preview.packId,
    name: preview.packName,
    version: "0.0.0-draft",
    description: preview.description,
    type: "collector_draft",
    visibility: "private",
    trustLevel: "unreviewed",
    author: "Contextarr Collector",
    license: "UNLICENSED",
    createdAt: generatedAt,
    updatedAt: generatedAt,
    lastReviewedAt: null,
    containsPersonalData: true,
    containsExecutableCode: false,
    requiresNetwork: false,
    permissions: {
      readVault: false,
      writeDrafts: false,
      runCommands: false,
      networkAccess: false
    },
    recordsPath: "records",
    sourcesPath: "sources/sources.yaml",
    exportsPath: "exports",
    rulesPath: "rules",
    assets: {
      accentColor: "#38BDF8"
    },
    compatibility: {
      contextarr: ">=0.0.0"
    }
  };

  fs.writeFileSync(path.join(packPath, "contextarr-pack.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    path.join(packPath, "README.md"),
    `# ${preview.packName}\n\nPrivate draft Context Pack generated by ${definition.name}. Review and approve records before export or MCP exposure.\n`,
    "utf8"
  );
  fs.writeFileSync(path.join(packPath, "CHANGELOG.md"), `# Changelog\n\n## ${generatedAt.slice(0, 10)}\n\n- Created draft pack from ${definition.name}.\n`, "utf8");
  fs.writeFileSync(
    path.join(packPath, "LICENSE"),
    "Draft starter content is generated locally for review. Replace with the correct license before approval.\n",
    "utf8"
  );

  for (const record of preview.records) {
    const frontmatter: RecordFrontmatter = {
      id: record.id,
      title: record.title,
      type: record.type,
      pack: preview.packId,
      tags: record.tags,
      confidence: "unknown",
      source_status: "draft",
      freshness: "unknown",
      privacy: "private",
      sources: [record.sourceId],
      review_status: "draft"
    };
    fs.writeFileSync(path.join(packPath, "records", `${safeFileName(record.slug)}.md`), writeMarkdownRecord(frontmatter, record.body), "utf8");
  }

  fs.writeFileSync(path.join(packPath, "sources", "sources.yaml"), YAML.stringify({ sources: preview.sources }), "utf8");
  fs.writeFileSync(
    path.join(packPath, "rules", "validation.yaml"),
    YAML.stringify({
      required_fields: {
        record: ["id", "title", "type", "pack", "tags", "privacy", "sources", "review_status"]
      },
      checks: ["draft_records_require_review"]
    }),
    "utf8"
  );
  fs.writeFileSync(
    path.join(packPath, "rules", "redaction.yaml"),
    YAML.stringify({
      redact_tags: ["secret", "never_export"],
      patterns: []
    }),
    "utf8"
  );
  fs.writeFileSync(
    path.join(packPath, "rules", "freshness.yaml"),
    YAML.stringify({
      stale_after_days: {
        collector_draft: 365,
        collector_overview: 365,
        support_kb_note: 365
      }
    }),
    "utf8"
  );
}

function normalizeOptionalPackId(value: string | undefined): string | undefined {
  return value?.trim() ? normalizeContextPackCollectorPackId(value) : undefined;
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  return value?.trim() ? value.trim() : undefined;
}

function ensureOutputRoot(outputRoot: string): void {
  fs.mkdirSync(outputRoot, { recursive: true });
  if (!fs.statSync(outputRoot).isDirectory()) {
    throw new CollectorError("output.invalid_path", `Draft output root is not a directory: ${outputRoot}`);
  }
}

function normalizeCollectorError(error: unknown): CollectorError {
  if (error instanceof CollectorError) {
    return error;
  }

  if (error instanceof ImporterError) {
    return new CollectorError(error.code, error.message);
  }

  return new CollectorError("collector.failed", error instanceof Error ? error.message : String(error));
}

function writeMarkdownRecord(frontmatter: RecordFrontmatter, body: string): string {
  return `---\n${YAML.stringify(frontmatter)}---\n\n${body.trim()}\n`;
}

function safeFileName(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-");
}

function uniqueTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => normalizeTag(tag)).filter(Boolean))).sort();
}

function normalizeTag(tag: string): string {
  return tag
    .trim()
    .replace(/^#/, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function assertInside(root: string, target: string): void {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new CollectorError("output.invalid_path", "Collector output path escaped the configured draft pack directory.");
  }
}
