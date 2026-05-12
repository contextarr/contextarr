import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { validatePack, type ValidationResult } from "@contextarr/pack-validator";
import type { ContextPackManifest, RecordFrontmatter, RedactionRules, Source } from "@contextarr/schema";

export interface ComposeDraftRecord {
  id: string;
  packId: string;
  title: string;
  type: string;
  tags: string[];
  confidence: "low" | "medium" | "high" | "unknown";
  sourceStatus: string;
  freshness: "current" | "stale" | "unknown";
  privacy: "public_safe" | "internal" | "private" | "sensitive" | "secret";
  reviewStatus: "approved" | "needs_review" | "draft" | "rejected";
  sources: string[];
  resolvedSources: ComposeDraftSource[];
  body: string;
}

export interface ComposeDraftSource {
  id: string;
  type: string;
  title: string;
  url?: string | null;
  path?: string | null;
  retrievedAt?: string | null;
  license?: string | null;
  licenseStatus?: string | null;
  contentHash?: string | null;
  staleReason?: string | null;
  trust?: string | null;
  status?: string | null;
}

export interface CreateComposedPackDraftOptions {
  composedPacksDir: string;
  packId?: string;
  name?: string;
  description?: string;
  target: string;
  format: string;
  privacyMode: "redacted" | "public_safe";
  excludeTags: string[];
  redactionRules?: RedactionRules;
  records: ComposeDraftRecord[];
  generatedAt?: string;
}

export interface ComposedPackDraftResult {
  id: string;
  name: string;
  packPath: string;
  recordCount: number;
  sourceCount: number;
  validation: ValidationResult;
}

export class ComposedPackWriteError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly validation?: ValidationResult
  ) {
    super(message);
    this.name = "ComposedPackWriteError";
  }
}

export function normalizeComposedPackId(value: string): string {
  return normalizeComposedPackIdCandidate(value) ?? "composed-context-draft";
}

export function normalizeComposedPackIdCandidate(value: string): string | undefined {
  const id = value
    .replace(/\\/g, "/")
    .replace(/\.[A-Za-z0-9]+$/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._/-]+/g, "-")
    .replace(/[/-]+/g, "-")
    .replace(/^\.+/g, "")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return id || undefined;
}

export function createComposedPackDraft(options: CreateComposedPackDraftOptions): ComposedPackDraftResult {
  const outputRoot = path.resolve(options.composedPacksDir);
  fs.mkdirSync(outputRoot, { recursive: true });
  if (!fs.statSync(outputRoot).isDirectory()) {
    throw new ComposedPackWriteError("output.invalid_path", "Composed pack output root is not a directory.", 400);
  }

  if (options.records.length === 0) {
    throw new ComposedPackWriteError("compose.empty_selection", "Composer requires at least one saveable approved record.", 400);
  }

  const nonPublicRecord = options.records.find((record) => record.privacy !== "public_safe");
  if (nonPublicRecord) {
    throw new ComposedPackWriteError(
      "compose.non_public_record",
      `Composed draft packs can only persist public-safe records: ${nonPublicRecord.id}.`,
      400
    );
  }

  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const packName = normalizeOptionalString(options.name) ?? "Composed Context Draft";
  const packId = normalizeComposedPackId(options.packId ?? `${packName}-draft`);
  const targetPath = path.join(outputRoot, packId);
  assertInside(outputRoot, targetPath);

  if (fs.existsSync(targetPath)) {
    throw new ComposedPackWriteError("output.exists", `Composed draft pack already exists: ${packId}`, 409);
  }

  const tempPath = fs.mkdtempSync(path.join(outputRoot, `.tmp-${packId}-`));
  try {
    writeComposedPack(tempPath, {
      ...options,
      packId,
      name: packName,
      description:
        normalizeOptionalString(options.description) ??
        "Private draft Context Pack composed from selected approved Contextarr records.",
      generatedAt
    });

    const validation = validatePack(tempPath);
    if (!validation.valid) {
      throw new ComposedPackWriteError("validation_failed", "Generated composed draft pack did not validate.", 400, validation);
    }

    fs.renameSync(tempPath, targetPath);

    return {
      id: packId,
      name: packName,
      packPath: targetPath,
      recordCount: options.records.length,
      sourceCount: options.records.length,
      validation
    };
  } catch (error) {
    fs.rmSync(tempPath, { recursive: true, force: true });
    throw error;
  }
}

function writeComposedPack(
  packPath: string,
  options: Required<Pick<CreateComposedPackDraftOptions, "packId" | "name" | "description" | "generatedAt">> &
    CreateComposedPackDraftOptions
): void {
  fs.mkdirSync(path.join(packPath, "records"), { recursive: true });
  fs.mkdirSync(path.join(packPath, "raw"), { recursive: true });
  fs.mkdirSync(path.join(packPath, "sources"), { recursive: true });
  fs.mkdirSync(path.join(packPath, "exports"), { recursive: true });
  fs.mkdirSync(path.join(packPath, "rules"), { recursive: true });

  const manifest: ContextPackManifest = {
    id: options.packId,
    name: options.name,
    version: "0.0.0-draft",
    description: options.description,
    type: "composed_draft",
    visibility: "private",
    trustLevel: "unreviewed",
    author: "Contextarr Composer",
    license: "UNLICENSED",
    createdAt: options.generatedAt,
    updatedAt: options.generatedAt,
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
      accentColor: "#22C55E"
    },
    compatibility: {
      contextarr: ">=0.0.0"
    },
    composer: {
      target: options.target,
      format: options.format,
      privacyMode: options.privacyMode,
      excludeTags: options.excludeTags,
      sourceRecordCount: options.records.length
    }
  };

  fs.writeFileSync(path.join(packPath, "contextarr-pack.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    path.join(packPath, "README.md"),
    `# ${options.name}\n\nPrivate draft Context Pack generated by the Contextarr Composer from selected approved public-safe records. Review and approve this derivative pack before export or MCP exposure.\n`,
    "utf8"
  );
  fs.writeFileSync(path.join(packPath, "CHANGELOG.md"), `# Changelog\n\n## ${options.generatedAt.slice(0, 10)}\n\n- Created private composed draft pack.\n`, "utf8");
  fs.writeFileSync(
    path.join(packPath, "LICENSE"),
    "Private draft content composed locally from existing Contextarr records. Review source licenses before approval or sharing.\n",
    "utf8"
  );

  const usedRecordSlugs = new Map<string, number>();
  const sources: Source[] = [];

  for (const [index, record] of options.records.entries()) {
    const slug = uniqueSlug(normalizeSlug(record.id), usedRecordSlugs);
    const composedRecordId = `${options.packId}.${slug}`;
    const sourceId = `${options.packId}.source.${slug}`;
    const rawPath = `raw/${safeFileName(slug)}-source.md`;
    sources.push(buildComposedSource(sourceId, record, index, rawPath));
    fs.writeFileSync(path.join(packPath, rawPath), buildComposedRawSourceNote(record, options.generatedAt), "utf8");

    const frontmatter: RecordFrontmatter = {
      id: composedRecordId,
      title: record.title,
      type: `composed_${normalizeSlug(record.type)}`,
      pack: options.packId,
      tags: uniqueTags([...record.tags, "composed_draft", "imported_draft", "never_export"]),
      confidence: record.confidence,
      source_status: "draft",
      freshness: record.freshness,
      privacy: "private",
      sources: [sourceId],
      review_status: "draft",
      provenance: {
        sourcePackId: record.packId,
        sourceRecordId: record.id,
        sourceRecordTitle: record.title,
        sourceRecordSources: record.sources,
        composedAt: options.generatedAt
      }
    };

    fs.writeFileSync(
      path.join(packPath, "records", `${safeFileName(slug)}.md`),
      writeMarkdownRecord(frontmatter, buildRecordBody(record)),
      "utf8"
    );
  }

  fs.writeFileSync(path.join(packPath, "sources", "sources.yaml"), YAML.stringify({ sources }), "utf8");
  fs.writeFileSync(
    path.join(packPath, "rules", "validation.yaml"),
    YAML.stringify({
      required_fields: {
        record: ["id", "title", "type", "pack", "tags", "privacy", "sources", "review_status"]
      },
      checks: ["draft_records_require_review", "preserve_composition_provenance"]
    }),
    "utf8"
  );
  fs.writeFileSync(
    path.join(packPath, "rules", "redaction.yaml"),
    YAML.stringify(
      options.redactionRules ?? {
        redact_tags: ["secret", "never_export", "imported_draft"],
        patterns: []
      }
    ),
    "utf8"
  );
  fs.writeFileSync(
    path.join(packPath, "rules", "freshness.yaml"),
    YAML.stringify({
      stale_after_days: {
        composed_draft: 365
      }
    }),
    "utf8"
  );
}

function buildComposedSource(sourceId: string, record: ComposeDraftRecord, index: number, rawPath: string): Source {
  const firstSource = record.resolvedSources[0];
  return {
    id: sourceId,
    type: "contextarr_record",
    title: `${record.title} source record`,
    path: rawPath,
    license: firstSource?.license ?? "UNLICENSED",
    license_status: normalizeLicenseStatus(firstSource?.licenseStatus),
    license_notes: `Derived from Contextarr record ${record.id} in pack ${record.packId}. Review original sources before approval.`,
    trust: "unreviewed",
    status: firstSource?.status === "stale" ? "stale" : "current",
    stale_reason: firstSource?.staleReason ?? undefined,
    original_pack_id: record.packId,
    original_record_id: record.id,
    original_source_ids: record.sources,
    sort_order: index
  };
}

function buildComposedRawSourceNote(record: ComposeDraftRecord, generatedAt: string): string {
  const originalSources = record.sources.length > 0 ? record.sources.map((source) => `- ${source}`).join("\n") : "- none declared";
  return [
    `# ${record.title} Composition Source Note`,
    "",
    "Pack-local provenance note generated by the Contextarr Composer.",
    "",
    "## Composition Metadata",
    "",
    `- Source pack: ${record.packId}`,
    `- Source record: ${record.id}`,
    `- Composed at: ${generatedAt}`,
    "- Review state: unreviewed draft",
    "",
    "## Original Source IDs",
    "",
    originalSources,
    "",
    "## Composed Content Snapshot",
    "",
    record.body.trim()
  ].join("\n");
}

function buildRecordBody(record: ComposeDraftRecord): string {
  const sourceIds = record.sources.length > 0 ? record.sources.map((source) => `\`${source}\``).join(", ") : "none";
  return `${record.body.trim()}\n\n## Composition Provenance\n\n- Source pack: \`${record.packId}\`\n- Source record: \`${record.id}\`\n- Source IDs: ${sourceIds}\n`;
}

function writeMarkdownRecord(frontmatter: RecordFrontmatter, body: string): string {
  return `---\n${YAML.stringify(frontmatter)}---\n\n${body.trim()}\n`;
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  return value?.trim() ? value.trim() : undefined;
}

function normalizeLicenseStatus(value: string | null | undefined): Source["license_status"] {
  if (
    value === "known_permissive" ||
    value === "known_copyleft" ||
    value === "known_restricted" ||
    value === "unknown" ||
    value === "not_applicable"
  ) {
    return value;
  }

  return "unknown";
}

function uniqueSlug(value: string, used: Map<string, number>): string {
  const current = used.get(value) ?? 0;
  used.set(value, current + 1);
  return current === 0 ? value : `${value}-${current + 1}`;
}

function normalizeSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^\.+/g, "")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "record"
  );
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
    throw new ComposedPackWriteError("output.invalid_path", "Composed pack output escaped the configured composed pack directory.", 400);
  }
}
