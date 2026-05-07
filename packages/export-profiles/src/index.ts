import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import {
  contextPackManifestSchema,
  exportProfileSchema,
  recordFrontmatterSchema,
  redactionRulesSchema,
  sourceMapSchema,
  type ContextPackManifest,
  type ExportProfile,
  type RecordFrontmatter,
  type RedactionRules,
  type Source
} from "@contextarr/schema";
import { validatePack } from "@contextarr/pack-validator";

export type ExportWarningCode =
  | "redaction.pattern_invalid"
  | "redaction.warn"
  | "token_budget.exceeded";

export interface ExportWarning {
  code: ExportWarningCode;
  message: string;
  recordId?: string;
  pattern?: string;
}

export interface ExportRecordSummary {
  id: string;
  title: string;
  type: string;
  privacy: string;
  tags: string[];
  sources: string[];
}

export interface ExcludedExportRecord extends ExportRecordSummary {
  reason: string;
}

export interface ExportSourceSummary {
  id: string;
  title: string;
  type: string;
  url?: string;
  path?: string;
  trust?: string;
  status?: string;
}

export interface ExportArtifact {
  packId: string;
  packName: string;
  profileId: string;
  profileName: string;
  target: string;
  format: string;
  filename: string;
  mimeType: string;
  content: string;
  includedRecords: ExportRecordSummary[];
  excludedRecords: ExcludedExportRecord[];
  sources: ExportSourceSummary[];
  warnings: ExportWarning[];
  generatedAt: string;
  byteLength: number;
  estimatedTokens: number;
}

export interface ExportProfileListing {
  packId: string;
  profile: ExportProfile;
}

export interface BuildPackExportOptions {
  packPath: string;
  profileId: string;
  generatedAt?: string;
}

export interface BuildPackExportsOptions {
  packPath: string;
  profileIds?: string[];
  generatedAt?: string;
}

export interface ListPackExportProfilesOptions {
  packPath: string;
}

interface LoadedRecord {
  file: string;
  metadata: RecordFrontmatter;
  body: string;
}

interface LoadedPackForExport {
  packPath: string;
  manifest: ContextPackManifest;
  records: LoadedRecord[];
  sources: Source[];
  exportProfiles: ExportProfile[];
  redactionRules: RedactionRules;
}

interface PreparedRecord {
  record: LoadedRecord;
  body: string;
}

const supportedTargets = new Set(["chatgpt", "claude", "codex", "markdown", "generic_markdown", "json", "json_records"]);

export class ExportError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ExportError";
  }
}

export function listPackExportProfiles(options: ListPackExportProfilesOptions): ExportProfileListing[] {
  const pack = loadPackForExport(options.packPath);
  return pack.exportProfiles.map((profile) => ({
    packId: pack.manifest.id,
    profile
  }));
}

export function buildPackExports(options: BuildPackExportsOptions): ExportArtifact[] {
  const pack = loadPackForExport(options.packPath);
  const profileIds = options.profileIds ?? pack.exportProfiles.map((profile) => profile.id);

  return profileIds.map((profileId) => buildExportFromLoadedPack(pack, profileId, options.generatedAt));
}

export function buildPackExport(options: BuildPackExportOptions): ExportArtifact {
  const pack = loadPackForExport(options.packPath);
  return buildExportFromLoadedPack(pack, options.profileId, options.generatedAt);
}

function buildExportFromLoadedPack(pack: LoadedPackForExport, profileId: string, generatedAt = new Date().toISOString()): ExportArtifact {
  const profile = pack.exportProfiles.find((candidate) => candidate.id === profileId);
  if (!profile) {
    throw new ExportError("profile_not_found", `Export profile not found: ${profileId}`);
  }

  if (!supportedTargets.has(profile.target)) {
    throw new ExportError("unsupported_target", `Export target is not supported in Phase 7: ${profile.target}`);
  }

  const warnings: ExportWarning[] = [];
  const { included, excluded } = selectRecords(pack, profile, warnings);
  const sources = summarizeSources(pack.sources, included.flatMap(({ record }) => record.metadata.sources));
  const content =
    profile.format === "json"
      ? renderJsonExport(pack, profile, included, excluded, sources, warnings, generatedAt)
      : renderMarkdownExport(pack, profile, included, excluded, sources, warnings, generatedAt);
  const estimatedTokens = estimateTokens(content);

  if (profile.token_budget && estimatedTokens > profile.token_budget) {
    warnings.push({
      code: "token_budget.exceeded",
      message: `Estimated export size (${estimatedTokens} tokens) exceeds profile budget (${profile.token_budget}).`
    });
  }

  return {
    packId: pack.manifest.id,
    packName: pack.manifest.name,
    profileId: profile.id,
    profileName: profile.name,
    target: profile.target,
    format: profile.format,
    filename: filenameForProfile(profile),
    mimeType: mimeTypeForFormat(profile.format),
    content,
    includedRecords: included.map(({ record }) => summarizeRecord(record)),
    excludedRecords: excluded,
    sources,
    warnings,
    generatedAt,
    byteLength: Buffer.byteLength(content, "utf8"),
    estimatedTokens
  };
}

function selectRecords(
  pack: LoadedPackForExport,
  profile: ExportProfile,
  warnings: ExportWarning[]
): { included: PreparedRecord[]; excluded: ExcludedExportRecord[] } {
  const byId = new Map(pack.records.map((record) => [record.metadata.id, record]));
  const requestedIds = profile.include?.records ?? pack.records.map((record) => record.metadata.id);
  const missingIds = requestedIds.filter((id) => !byId.has(id));

  if (missingIds.length > 0) {
    throw new ExportError("record_not_found", `Export profile references missing record(s): ${missingIds.join(", ")}`);
  }

  const included: PreparedRecord[] = [];
  const excluded: ExcludedExportRecord[] = [];

  for (const recordId of requestedIds) {
    const record = byId.get(recordId)!;
    const reason = exclusionReason(record.metadata, profile, pack.redactionRules);

    if (reason) {
      excluded.push({ ...summarizeRecord(record), reason });
      continue;
    }

    included.push({
      record,
      body: applyRedaction(record.body, pack.redactionRules, record.metadata.id, warnings)
    });
  }

  return { included, excluded };
}

function exclusionReason(metadata: RecordFrontmatter, profile: ExportProfile, rules: RedactionRules): string | undefined {
  const profileExcludedTag = metadata.tags.find((tag) => profile.exclude_tags.includes(tag));
  if (profileExcludedTag) {
    return `Excluded by profile tag: ${profileExcludedTag}`;
  }

  if (profile.privacy_mode === "public_safe" && metadata.privacy !== "public_safe") {
    return `Excluded by public-safe privacy mode: ${metadata.privacy}`;
  }

  if (profile.privacy_mode === "redacted") {
    if (metadata.privacy === "secret") {
      return "Excluded by redacted privacy mode: secret";
    }

    const redactionTag = metadata.tags.find((tag) => rules.redact_tags.includes(tag));
    if (redactionTag) {
      return `Excluded by redaction tag: ${redactionTag}`;
    }
  }

  return undefined;
}

function applyRedaction(body: string, rules: RedactionRules, recordId: string, warnings: ExportWarning[]): string {
  let redacted = body;

  for (const pattern of rules.patterns) {
    const regex = compileRedactionPattern(pattern, warnings);
    if (!regex) {
      continue;
    }

    if (pattern.action === "warn") {
      regex.lastIndex = 0;
      if (regex.test(redacted)) {
        warnings.push({
          code: "redaction.warn",
          message: `Redaction warning pattern matched in record ${recordId}: ${pattern.name}.`,
          recordId,
          pattern: pattern.name
        });
      }
      continue;
    }

    redacted = redacted.replace(regex, pattern.action === "mask" ? "[masked]" : "[redacted]");
  }

  return redacted;
}

function compileRedactionPattern(pattern: RedactionRules["patterns"][number], warnings: ExportWarning[]): RegExp | undefined {
  let source = pattern.regex;
  let flags = pattern.flags ?? "";

  if (source.startsWith("(?i)")) {
    source = source.slice(4);
    flags = `${flags}i`;
  }

  flags = Array.from(new Set(`${flags}g`.split(""))).join("");

  try {
    return new RegExp(source, flags);
  } catch {
    warnings.push({
      code: "redaction.pattern_invalid",
      message: `Redaction pattern is not valid JavaScript RegExp and was skipped: ${pattern.name}.`,
      pattern: pattern.name
    });
    return undefined;
  }
}

function renderMarkdownExport(
  pack: LoadedPackForExport,
  profile: ExportProfile,
  included: PreparedRecord[],
  excluded: ExcludedExportRecord[],
  sources: ExportSourceSummary[],
  warnings: ExportWarning[],
  generatedAt: string
): string {
  const lines = [
    `# ${targetLabel(profile.target)} Context Export: ${pack.manifest.name}`,
    "",
    `Generated: ${generatedAt}`,
    `Profile: ${profile.name} (${profile.id})`,
    `Privacy mode: ${profile.privacy_mode ?? "redacted"}`,
    `Format: ${profile.format}`,
    "",
    "## Pack Summary",
    "",
    pack.manifest.description,
    "",
    "## Included Records",
    ""
  ];

  for (const { record, body } of included) {
    lines.push(
      `### ${record.metadata.title}`,
      "",
      `Record ID: ${record.metadata.id}`,
      `Type: ${record.metadata.type}`,
      `Privacy: ${record.metadata.privacy}`,
      `Tags: ${record.metadata.tags.join(", ") || "none"}`,
      `Sources: ${record.metadata.sources.join(", ") || "none"}`,
      "",
      body,
      ""
    );
  }

  if (excluded.length > 0) {
    lines.push("## Excluded Records", "");
    for (const record of excluded) {
      lines.push(`- ${record.id}: ${record.reason}`);
    }
    lines.push("");
  }

  lines.push("## Sources", "");
  if (sources.length === 0) {
    lines.push("No source references were included.", "");
  } else {
    for (const source of sources) {
      lines.push(`- ${source.id}: ${source.title} (${source.type})`);
    }
    lines.push("");
  }

  if (warnings.length > 0) {
    lines.push("## Export Warnings", "");
    for (const warning of warnings) {
      lines.push(`- ${warning.code}: ${warning.message}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

function renderJsonExport(
  pack: LoadedPackForExport,
  profile: ExportProfile,
  included: PreparedRecord[],
  excluded: ExcludedExportRecord[],
  sources: ExportSourceSummary[],
  warnings: ExportWarning[],
  generatedAt: string
): string {
  return `${JSON.stringify(
    {
      contextarrExportVersion: "0.1",
      generatedAt,
      pack: {
        id: pack.manifest.id,
        name: pack.manifest.name,
        version: pack.manifest.version,
        description: pack.manifest.description
      },
      profile: {
        id: profile.id,
        name: profile.name,
        target: profile.target,
        format: profile.format,
        privacyMode: profile.privacy_mode ?? "redacted"
      },
      records: included.map(({ record, body }) => ({
        metadata: record.metadata,
        body
      })),
      excludedRecords: excluded,
      sources,
      warnings
    },
    null,
    2
  )}\n`;
}

function summarizeSources(sources: Source[], sourceIds: string[]): ExportSourceSummary[] {
  const wanted = new Set(sourceIds);
  return sources
    .filter((source) => wanted.has(source.id))
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((source) => ({
      id: source.id,
      title: source.title,
      type: source.type,
      url: source.url,
      path: source.path,
      trust: source.trust,
      status: source.status
    }));
}

function summarizeRecord(record: LoadedRecord): ExportRecordSummary {
  return {
    id: record.metadata.id,
    title: record.metadata.title,
    type: record.metadata.type,
    privacy: record.metadata.privacy,
    tags: record.metadata.tags,
    sources: record.metadata.sources
  };
}

function filenameForProfile(profile: ExportProfile): string {
  const extension = profile.format === "json" ? "json" : profile.format === "text" ? "txt" : "md";
  return `${profile.id}.${extension}`;
}

function mimeTypeForFormat(format: ExportProfile["format"]): string {
  if (format === "json") {
    return "application/json";
  }

  if (format === "text") {
    return "text/plain";
  }

  if (format === "markdown") {
    return "text/markdown";
  }

  throw new ExportError("unsupported_format", `Export format is not supported in Phase 7: ${format}`);
}

function targetLabel(target: string): string {
  const labels: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    codex: "Codex",
    markdown: "Generic Markdown",
    generic_markdown: "Generic Markdown",
    json: "JSON Records",
    json_records: "JSON Records"
  };
  return labels[target] ?? target;
}

function estimateTokens(content: string): number {
  return Math.max(1, Math.ceil(content.length / 4));
}

function loadPackForExport(packPath: string): LoadedPackForExport {
  const resolvedPackPath = path.resolve(packPath);
  const validation = validatePack(resolvedPackPath);
  if (!validation.valid) {
    throw new ExportError("validation_failed", `Validation failed for export pack: ${resolvedPackPath}`);
  }

  const manifest = contextPackManifestSchema.parse(
    JSON.parse(fs.readFileSync(path.join(resolvedPackPath, "contextarr-pack.json"), "utf8"))
  );
  const sources = sourceMapSchema.parse(YAML.parse(fs.readFileSync(path.join(resolvedPackPath, manifest.sourcesPath), "utf8"))).sources;
  const redactionRulesPath = path.join(resolvedPackPath, manifest.rulesPath, "redaction.yaml");
  const redactionRules = fs.existsSync(redactionRulesPath)
    ? redactionRulesSchema.parse(YAML.parse(fs.readFileSync(redactionRulesPath, "utf8")))
    : redactionRulesSchema.parse({});

  return {
    packPath: resolvedPackPath,
    manifest,
    records: readRecords(resolvedPackPath, manifest),
    sources,
    exportProfiles: readExportProfiles(resolvedPackPath, manifest),
    redactionRules
  };
}

function readRecords(packPath: string, manifest: ContextPackManifest): LoadedRecord[] {
  const recordsDir = path.join(packPath, manifest.recordsPath);
  return listFiles(recordsDir)
    .filter((file) => file.toLowerCase().endsWith(".md"))
    .map((file) => {
      const parsed = matter(fs.readFileSync(file, "utf8"));
      return {
        file: normalizePath(path.relative(packPath, file)),
        metadata: recordFrontmatterSchema.parse(parsed.data),
        body: parsed.content.trim()
      };
    });
}

function readExportProfiles(packPath: string, manifest: ContextPackManifest): ExportProfile[] {
  return listFiles(path.join(packPath, manifest.exportsPath))
    .filter((file) => [".yaml", ".yml"].includes(path.extname(file).toLowerCase()))
    .map((file) => exportProfileSchema.parse(YAML.parse(fs.readFileSync(file, "utf8"))))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function listFiles(root: string): string[] {
  const files: string[] = [];

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}
