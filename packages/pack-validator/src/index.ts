import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import { z } from "zod";
import {
  contextPackManifestSchema,
  exportProfileSchema,
  freshnessRulesSchema,
  recordFrontmatterSchema,
  redactionRulesSchema,
  sourceMapSchema,
  validationRulesSchema,
  type ContextPackManifest,
  type ExportProfile,
  type RecordFrontmatter,
  type RedactionRules,
  type Source,
  type SourceMap,
  type ValidationRules
} from "@contextarr/schema";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  file?: string;
  path?: string;
}

export interface ValidationResult {
  packPath: string;
  packId: string | null;
  valid: boolean;
  validationStatus: "valid" | "valid_with_warnings" | "invalid";
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
    redactionHits: number;
    exportProfilesReady: number;
    exportProfilesWithWarnings: number;
    exportProfilesBlocked: number;
    staleSources: number;
    licenseWarnings: number;
    licenseMissing: number;
    licenseUnknown: number;
    licenseRisks: number;
    docsWarnings: number;
  };
  redactionHits: RedactionHit[];
  exportReadiness: ExportReadinessReport;
}

export interface ValidatePackOptions {
  scanText?: boolean;
  currentDate?: Date | string;
}

export type ExportProfileTarget =
  | "chatgpt"
  | "claude"
  | "codex"
  | "generic_markdown"
  | "json"
  | "agents_md"
  | "claude_md"
  | "llms_txt";

export type SourceLicenseStatus =
  | "known_permissive"
  | "known_copyleft"
  | "known_restricted"
  | "unknown"
  | "not_applicable";

export interface RedactionHit {
  code: "redaction.hit_warn";
  severity: "warning";
  file: string;
  pattern: string;
  action: "warn";
  matchCount: number;
  recordId?: string;
}

export interface ExportReadinessReport {
  status: "ready" | "ready_with_warnings" | "blocked";
  profiles: Array<{
    id: string;
    target: ExportProfileTarget | string;
    format: string;
    status: "ready" | "ready_with_warnings" | "blocked";
    blockingIssueCodes: string[];
    warningIssueCodes: string[];
  }>;
}

interface ExportReadinessProfileInput {
  id: string;
  target: string;
  format: string;
  file: string;
}

interface ValidatedRecord {
  metadata: RecordFrontmatter;
  file: string;
}

interface PackRules {
  validationRules?: ValidationRules;
  redactionRules?: RedactionRules;
}

export interface ValidationReportV1 {
  schemaVersion: "contextarr.validation-report.v1";
  packPath: string;
  packId: string | null;
  valid: boolean;
  validationStatus: "valid" | "valid_with_warnings" | "invalid";
  summary: ValidationResult["summary"];
  issues: ValidationIssue[];
  redactionHits: RedactionHit[];
  exportReadiness: ExportReadinessReport;
}

export class PackReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PackReadError";
  }
}

const executableExtensions = new Set([
  ".app",
  ".apk",
  ".bat",
  ".bash",
  ".bin",
  ".cmd",
  ".com",
  ".deb",
  ".dll",
  ".exe",
  ".fish",
  ".jar",
  ".msi",
  ".ps1",
  ".rpm",
  ".scr",
  ".sh",
  ".vbs",
  ".wsf",
  ".zsh"
]);

const scriptExtensions = new Set([
  ".cjs",
  ".js",
  ".jsx",
  ".mjs",
  ".php",
  ".pl",
  ".py",
  ".rb",
  ".ts",
  ".tsx"
]);

const credentialPattern =
  /\b(api[_-]?key|secret|token|password|private[_-]?key)\b\s*[:=]\s*["']?[^\s"',}]{8,}/i;

const shellCommandPattern =
  /(?:^|[\s`])(rm\s+-rf|sudo\s+|curl\s+[^\n]*\|\s*(?:sh|bash)|powershell(?:\.exe)?\s+-|cmd(?:\.exe)?\s+\/c|bash\s+-c|sh\s+-c|Invoke-WebRequest|Start-Process|chmod\s+\+x|execSync|child_process)(?:\b|[\s`])/i;

const sourceLicenseStatuses: SourceLicenseStatus[] = [
  "known_permissive",
  "known_copyleft",
  "known_restricted",
  "unknown",
  "not_applicable"
];

const permissiveLicensePattern = /\b(MIT|Apache-?2\.0|BSD-?2|BSD-?3|CC0|ISC|Unlicense|permissive)\b/i;
const copyleftLicensePattern = /\b(AGPL|GPL|LGPL|MPL|copyleft)\b/i;
const restrictedLicensePattern = /\b(proprietary|restricted|noncommercial|non-commercial|no[- ]?derivatives|commercial use restricted)\b/i;
const nonLicenseSourceTypes = new Set(["manual", "note", "synthetic", "internal", "private"]);
const exportTargetFormats: Record<string, string> = {
  chatgpt: "markdown",
  claude: "markdown",
  codex: "markdown",
  generic_markdown: "markdown",
  json: "json",
  agents_md: "markdown",
  claude_md: "markdown",
  llms_txt: "text"
};
const supportedValidationChecks = new Set([
  "no_executable_code",
  "no_shell_commands",
  "no_api_keys",
  "source_ids_exist",
  "last_reviewed_present",
  "export_profiles_valid",
  "preserve_composition_provenance",
  "approved_content_only",
  "public_safe_only",
  "draft_records_require_review",
  "no_secret_tags"
]);
const secretPolicyTags = new Set(["secret", "never_export", "private", "sensitive", "customer_private", "health", "financial"]);

export function validatePack(packPath: string, options: ValidatePackOptions = {}): ValidationResult {
  const resolvedPackPath = path.resolve(packPath);
  const issues: ValidationIssue[] = [];
  const redactionHits: RedactionHit[] = [];
  const currentDate = options.currentDate ? new Date(options.currentDate) : new Date();

  if (!fs.existsSync(resolvedPackPath)) {
    throw new PackReadError(`Pack path does not exist: ${resolvedPackPath}`);
  }

  if (!fs.statSync(resolvedPackPath).isDirectory()) {
    throw new PackReadError(`Pack path is not a directory: ${resolvedPackPath}`);
  }

  const allFiles = listFiles(resolvedPackPath, issues);
  scanFileTypes(resolvedPackPath, allFiles, issues);

  const manifestFile = path.join(resolvedPackPath, "contextarr-pack.json");
  const manifest = readJsonSchemaFile(
    resolvedPackPath,
    manifestFile,
    contextPackManifestSchema,
    issues,
    "manifest"
  );

  if (!manifest) {
    if (!fs.existsSync(manifestFile)) {
      addIssue(issues, "error", "manifest.missing", "Missing contextarr-pack.json.", "contextarr-pack.json");
    }

    scanTextFiles(resolvedPackPath, allFiles, issues, options.scanText ?? true);
    return finish(resolvedPackPath, null, issues, redactionHits, []);
  }

  validateDocs(resolvedPackPath, issues);
  validateManifestSafety(manifest, issues);
  const records = validateRecords(resolvedPackPath, manifest, issues);
  validateSourceMap(resolvedPackPath, manifest, records, issues, currentDate);
  const exportProfiles = validateExportProfiles(resolvedPackPath, manifest, issues);
  const rules = validateRules(resolvedPackPath, manifest, issues);
  validateRecordPolicyChecks(records, rules.validationRules, issues);
  scanTextFiles(resolvedPackPath, allFiles, issues, options.scanText ?? true);
  scanRedactionWarnHits(resolvedPackPath, allFiles, manifest.recordsPath, records, rules.redactionRules, redactionHits, issues);
  applyExportReadinessWarnings(exportProfiles, issues, redactionHits);

  return finish(resolvedPackPath, manifest.id, issues, redactionHits, exportProfiles);
}

export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];
  const status = result.valid ? "Validation passed" : "Validation failed";

  lines.push(`${status}: ${result.packPath}`);
  lines.push(
    `Summary: ${result.summary.errors} error(s), ${result.summary.warnings} warning(s), ${result.summary.infos} info(s)`
  );

  for (const issue of result.issues) {
    const location = issue.file ? ` ${issue.file}` : "";
    const fieldPath = issue.path ? ` (${issue.path})` : "";
    lines.push(`[${issue.severity.toUpperCase()}] ${issue.code}${location}${fieldPath}: ${issue.message}`);
  }

  return `${lines.join("\n")}\n`;
}

function validateManifestSafety(manifest: ContextPackManifest, issues: ValidationIssue[]): void {
  if (manifest.containsExecutableCode !== false) {
    addIssue(
      issues,
      "error",
      "manifest.executable_code",
      "containsExecutableCode must be false for v0 packs.",
      "contextarr-pack.json",
      "containsExecutableCode"
    );
  }

  if (manifest.requiresNetwork !== false) {
    addIssue(
      issues,
      "error",
      "manifest.requires_network",
      "requiresNetwork must be false for v0 activation.",
      "contextarr-pack.json",
      "requiresNetwork"
    );
  }

  if (manifest.permissions.runCommands !== false) {
    addIssue(
      issues,
      "error",
      "manifest.run_commands",
      "permissions.runCommands must be false.",
      "contextarr-pack.json",
      "permissions.runCommands"
    );
  }

  if (manifest.permissions.networkAccess !== false) {
    addIssue(
      issues,
      "error",
      "manifest.network_access",
      "permissions.networkAccess must be false.",
      "contextarr-pack.json",
      "permissions.networkAccess"
    );
  }
}

function validateDocs(packPath: string, issues: ValidationIssue[]): void {
  const readme = path.join(packPath, "README.md");
  if (!fs.existsSync(readme)) {
    addIssue(issues, "warning", "docs.readme_missing", "Pack root should include README.md.", "README.md");
    return;
  }

  const content = fs.readFileSync(readme, "utf8").trim();
  if (content.length < 40) {
    addIssue(issues, "warning", "docs.readme_minimal", "Pack README.md is too minimal to be useful.", "README.md");
  }
}

function validateRecords(
  packPath: string,
  manifest: ContextPackManifest,
  issues: ValidationIssue[]
): ValidatedRecord[] {
  const recordsDir = path.join(packPath, manifest.recordsPath);

  if (!fs.existsSync(recordsDir) || !fs.statSync(recordsDir).isDirectory()) {
    addIssue(
      issues,
      "error",
      "records.missing_directory",
      `Records folder does not exist: ${manifest.recordsPath}.`,
      manifest.recordsPath
    );
    return [];
  }

  const recordFiles = listFiles(recordsDir, issues).filter((file) => file.toLowerCase().endsWith(".md"));

  if (recordFiles.length === 0) {
    addIssue(issues, "warning", "records.empty", "Records folder contains no Markdown records.", manifest.recordsPath);
  }

  const records: ValidatedRecord[] = [];
  const seenIds = new Map<string, string>();

  for (const file of recordFiles) {
    const relativeFile = relativePath(packPath, file);
    let parsed: matter.GrayMatterFile<string>;

    try {
      parsed = matter(fs.readFileSync(file, "utf8"));
    } catch (error) {
      addIssue(issues, "error", "record.read_failed", errorMessage(error), relativeFile);
      continue;
    }

    const record = parseSchemaData(recordFrontmatterSchema, parsed.data, issues, "record.schema", relativeFile);

    if (!record) {
      continue;
    }

    if (record.pack !== manifest.id) {
      addIssue(
        issues,
        "error",
        "record.pack_mismatch",
        `Record pack "${record.pack}" does not match manifest id "${manifest.id}".`,
        relativeFile,
        "pack"
      );
    }

    const existingFile = seenIds.get(record.id);
    if (existingFile) {
      addIssue(
        issues,
        "error",
        "record.duplicate_id",
        `Record id "${record.id}" is already used by ${existingFile}.`,
        relativeFile,
        "id"
      );
    } else {
      seenIds.set(record.id, relativeFile);
    }

    records.push({ metadata: record, file: relativeFile });
  }

  return records;
}

function validateRecordPolicyChecks(
  records: ValidatedRecord[],
  validationRules: ValidationRules | undefined,
  issues: ValidationIssue[]
): void {
  const checks = new Set(validationRules?.checks ?? []);
  if (checks.size === 0) {
    return;
  }

  for (const check of checks) {
    if (!supportedValidationChecks.has(check)) {
      addIssue(
        issues,
        "error",
        "rules.validation.unknown_check",
        `Validation check "${check}" is not recognized by this validator.`,
        "rules/validation.yaml",
        "checks"
      );
    }
  }

  for (const { metadata: record, file } of records) {
    if (checks.has("approved_content_only") && record.review_status !== "approved") {
      addIssue(
        issues,
        "error",
        "record_policy.approved_content_only",
        `Record "${record.id}" has review_status "${record.review_status}" but approved_content_only requires approved records.`,
        file,
        "review_status"
      );
    }

    if (checks.has("public_safe_only") && record.privacy !== "public_safe") {
      addIssue(
        issues,
        "error",
        "record_policy.public_safe_only",
        `Record "${record.id}" has privacy "${record.privacy}" but public_safe_only requires public_safe records.`,
        file,
        "privacy"
      );
    }

    if (checks.has("draft_records_require_review") && record.source_status === "draft" && record.review_status === "approved") {
      addIssue(
        issues,
        "error",
        "record_policy.draft_records_require_review",
        `Draft record "${record.id}" is marked approved; draft records require human review.`,
        file,
        "review_status"
      );
    }

    if (checks.has("no_secret_tags")) {
      const reportedTags = new Set<string>();
      for (const tag of record.tags) {
        const normalizedTag = tag.trim().toLowerCase();
        if (!secretPolicyTags.has(normalizedTag) || reportedTags.has(normalizedTag)) {
          continue;
        }
        reportedTags.add(normalizedTag);
        addIssue(
          issues,
          "error",
          "record_policy.no_secret_tags",
          `Record "${record.id}" uses prohibited tag "${tag}" under no_secret_tags.`,
          file,
          "tags"
        );
      }
    }
  }
}

function validateSourceMetadata(
  packPath: string,
  manifest: ContextPackManifest,
  source: Source,
  issues: ValidationIssue[],
  currentDate: Date,
  sourcesFile: string
): void {
  const sourceFile = manifest.sourcesPath;
  const licenseStatus = normalizeSourceLicenseStatus(source);

  if (!source.license && !source.license_status && licenseStatus !== "not_applicable") {
    addIssue(
      issues,
      "warning",
      "source.license_missing",
      `Source "${source.id}" is missing license metadata.`,
      sourceFile,
      `sources.${source.id}.license`
    );
  } else if (licenseStatus === "unknown") {
    addIssue(
      issues,
      "warning",
      "source.license_unknown",
      `Source "${source.id}" has unknown license status.`,
      sourceFile,
      `sources.${source.id}.license_status`
    );
  }

  if (licenseStatus === "known_copyleft" || licenseStatus === "known_restricted") {
    addIssue(
      issues,
      "warning",
      "source.license_risk",
      `Source "${source.id}" has ${licenseStatus.replace("known_", "")} license status.`,
      sourceFile,
      `sources.${source.id}.license_status`
    );
  }

  if (isSourceStale(source, currentDate)) {
    addIssue(
      issues,
      "warning",
      "source.stale",
      `Source "${source.id}" is stale or needs review.`,
      sourceFile,
      `sources.${source.id}.status`
    );
  }

  if (source.content_hash && source.content_hash_algorithm !== "sha256") {
    addIssue(
      issues,
      "error",
      "source.hash_algorithm",
      `Source "${source.id}" content_hash requires content_hash_algorithm: sha256.`,
      sourceFile,
      `sources.${source.id}.content_hash_algorithm`
    );
  }

  if (source.path && isAbsoluteSourcePath(source.path)) {
    addIssue(
      issues,
      "error",
      "source.path_absolute",
      `Source "${source.id}" path must be a relative pack-local file path. Use source.url for remote references.`,
      sourceFile,
      `sources.${source.id}.path`
    );
  } else if (source.path) {
    const resolvedSourcePath = path.resolve(packPath, source.path);
    if (!isInsidePath(packPath, resolvedSourcePath)) {
      addIssue(
        issues,
        "error",
        "source.path_outside_pack",
        `Source "${source.id}" path must resolve inside the pack root.`,
        sourceFile,
        `sources.${source.id}.path`
      );
    } else if (!fs.existsSync(resolvedSourcePath) || !fs.statSync(resolvedSourcePath).isFile()) {
      addIssue(
        issues,
        "error",
        "source.path_missing",
        `Source "${source.id}" path does not resolve to a committed pack-local file.`,
        sourceFile,
        `sources.${source.id}.path`
      );
    } else {
      const realPackPath = fs.realpathSync.native(packPath);
      const realSourcePath = fs.realpathSync.native(resolvedSourcePath);
      if (!isInsidePath(realPackPath, realSourcePath)) {
        addIssue(
          issues,
          "error",
          "source.path_outside_pack",
          `Source "${source.id}" path must resolve inside the pack root.`,
          sourceFile,
          `sources.${source.id}.path`
        );
      }
    }
  }
}

export function normalizeSourceLicenseStatus(source: Pick<Source, "type" | "license" | "license_status">): SourceLicenseStatus {
  if (source.license_status && sourceLicenseStatuses.includes(source.license_status)) {
    if (source.license_status !== "unknown") {
      return source.license_status;
    }
  }

  const license = source.license?.trim();
  if (!license) {
    return nonLicenseSourceTypes.has(source.type.toLowerCase()) ? "not_applicable" : "unknown";
  }

  if (/^(n\/a|not applicable|not_applicable|internal synthetic|synthetic demo)$/i.test(license)) {
    return "not_applicable";
  }
  if (copyleftLicensePattern.test(license)) {
    return "known_copyleft";
  }
  if (restrictedLicensePattern.test(license)) {
    return "known_restricted";
  }
  if (permissiveLicensePattern.test(license)) {
    return "known_permissive";
  }

  return source.license_status ?? "unknown";
}

function isSourceStale(source: Source, currentDate: Date): boolean {
  if (source.status === "stale" || Boolean(source.stale_reason)) {
    return true;
  }

  if (!source.stale_after_days) {
    return false;
  }

  const basis = source.last_checked_at ?? source.retrieved_at;
  if (!basis) {
    return false;
  }

  const basisDate = new Date(basis);
  if (Number.isNaN(basisDate.getTime()) || Number.isNaN(currentDate.getTime())) {
    return false;
  }

  const ageDays = Math.floor((currentDate.getTime() - basisDate.getTime()) / 86_400_000);
  return ageDays > source.stale_after_days;
}

function validateSourceMap(
  packPath: string,
  manifest: ContextPackManifest,
  records: ValidatedRecord[],
  issues: ValidationIssue[],
  currentDate: Date
): SourceMap | undefined {
  const sourcesFile = path.join(packPath, manifest.sourcesPath);
  const sourceMap = readYamlSchemaFile(packPath, sourcesFile, sourceMapSchema, issues, "sources");

  if (!sourceMap) {
    if (!fs.existsSync(sourcesFile)) {
      addIssue(issues, "error", "sources.missing", "Source map is required.", manifest.sourcesPath);
    }
    return undefined;
  }

  const sourceIds = new Set(sourceMap.sources.map((source) => source.id));

  for (const source of sourceMap.sources) {
    validateSourceMetadata(packPath, manifest, source, issues, currentDate, sourcesFile);
  }

  for (const { metadata: record } of records) {
    for (const sourceId of record.sources) {
      if (!sourceIds.has(sourceId)) {
        addIssue(
          issues,
          "error",
          "record.source_missing",
          `Record "${record.id}" references missing source "${sourceId}".`,
          manifest.recordsPath,
          "sources"
        );
      }
    }
  }

  return sourceMap;
}

function validateExportProfiles(packPath: string, manifest: ContextPackManifest, issues: ValidationIssue[]): ExportReadinessProfileInput[] {
  const exportsDir = path.join(packPath, manifest.exportsPath);

  if (!fs.existsSync(exportsDir) || !fs.statSync(exportsDir).isDirectory()) {
    addIssue(
      issues,
      "warning",
      "exports.missing_directory",
      `Export profiles folder does not exist: ${manifest.exportsPath}.`,
      manifest.exportsPath
    );
    return [];
  }

  const exportFiles = listFiles(exportsDir, issues).filter(isYamlFile);

  if (exportFiles.length === 0) {
    addIssue(issues, "warning", "exports.empty", "Export profiles folder contains no YAML profiles.", manifest.exportsPath);
  }

  const profiles: ExportReadinessProfileInput[] = [];
  for (const file of exportFiles) {
    const relativeFile = relativePath(packPath, file);
    const profile = readYamlSchemaFile(packPath, file, exportProfileSchema, issues, "export_profile");
    if (!profile) {
      profiles.push({
        id: path.basename(file, path.extname(file)),
        target: "unknown",
        format: "unknown",
        file: relativeFile
      });
      continue;
    }
    validateExportProfileMapping(packPath, file, profile, issues);
    profiles.push({
      id: profile.id,
      target: profile.target,
      format: profile.format,
      file: relativeFile
    });
  }
  return profiles;
}

function validateExportProfileMapping(packPath: string, file: string, profile: ExportProfile, issues: ValidationIssue[]): void {
  const expectedFormat = exportTargetFormats[profile.target];
  if (expectedFormat && profile.format !== expectedFormat) {
    addIssue(
      issues,
      "error",
      "export_profile.schema",
      `Export profile target "${profile.target}" must use format "${expectedFormat}".`,
      relativePath(packPath, file),
      `${profile.id}.format`
    );
  }
}

function validateRules(packPath: string, manifest: ContextPackManifest, issues: ValidationIssue[]): PackRules {
  const rulesDir = path.join(packPath, manifest.rulesPath);

  if (!fs.existsSync(rulesDir) || !fs.statSync(rulesDir).isDirectory()) {
    addIssue(
      issues,
      "warning",
      "rules.missing_directory",
      `Rules folder does not exist: ${manifest.rulesPath}.`,
      manifest.rulesPath
    );
    return {};
  }

  const rules = [
    ["validation.yaml", validationRulesSchema, "rules.validation"],
    ["redaction.yaml", redactionRulesSchema, "rules.redaction"],
    ["freshness.yaml", freshnessRulesSchema, "rules.freshness"]
  ] as const;

  let validationRules: ValidationRules | undefined;
  let redactionRules: RedactionRules | undefined;
  for (const [fileName, schema, code] of rules) {
    const file = path.join(rulesDir, fileName);
    if (fs.existsSync(file)) {
      const parsed = readYamlSchemaFile(packPath, file, schema, issues, code);
      if (fileName === "validation.yaml") {
        validationRules = parsed as ValidationRules | undefined;
      } else if (fileName === "redaction.yaml") {
        redactionRules = parsed as RedactionRules | undefined;
      }
    }
  }

  return { validationRules, redactionRules };
}

function scanRedactionWarnHits(
  packPath: string,
  files: string[],
  recordsPath: string,
  records: ValidatedRecord[],
  rules: RedactionRules | undefined,
  redactionHits: RedactionHit[],
  issues: ValidationIssue[]
): void {
  const warnPatterns = (rules?.patterns ?? []).filter((pattern) => pattern.action === "warn");
  if (warnPatterns.length === 0) {
    return;
  }

  const recordIds = new Set(records.map((record) => record.metadata.id));
  const normalizedRecordsPath = normalizePath(recordsPath).replace(/\/?$/, "/");

  for (const file of files.filter(isScannableTextFile)) {
    const relativeFile = relativePath(packPath, file);
    if (relativeFile.startsWith("rules/")) {
      continue;
    }
    let content = "";

    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    for (const pattern of warnPatterns) {
      let regex: RegExp;
      try {
        const flags = pattern.flags?.includes("g") ? pattern.flags : `${pattern.flags ?? ""}g`;
        regex = new RegExp(pattern.regex, flags);
      } catch (error) {
        addIssue(issues, "warning", "redaction.pattern_invalid", errorMessage(error), "rules/redaction.yaml", pattern.name);
        continue;
      }

      const matches = content.match(regex);
      const matchCount = matches?.length ?? 0;
      if (matchCount === 0) {
        continue;
      }

      const frontmatterId = relativeFile.startsWith(normalizedRecordsPath)
        ? String((matter(content).data as { id?: unknown }).id ?? "")
        : "";
      const recordId = recordIds.has(frontmatterId) ? frontmatterId : undefined;
      redactionHits.push({
        code: "redaction.hit_warn",
        severity: "warning",
        file: relativeFile,
        pattern: pattern.name,
        action: "warn",
        matchCount,
        recordId
      });
      addIssue(
        issues,
        "warning",
        "redaction.hit_warn",
        `Redaction warn pattern "${pattern.name}" matched ${matchCount} time(s).`,
        relativeFile
      );
    }
  }
}

function applyExportReadinessWarnings(
  profiles: ExportReadinessProfileInput[],
  issues: ValidationIssue[],
  redactionHits: RedactionHit[]
): void {
  if (profiles.length === 0) {
    return;
  }

  const hasSourceWarnings = issues.some(
    (issue) => issue.code === "source.stale" || issue.code.startsWith("source.license_")
  );

  if (!hasSourceWarnings && redactionHits.length === 0) {
    return;
  }

  for (const profile of profiles) {
    addIssue(
      issues,
      "warning",
      "export_profile.readiness_warning",
      `Export profile "${profile.id}" is ready with warnings from source or redaction metadata.`,
      "exports",
      profile.id
    );
  }
}

function readJsonSchemaFile<TSchema extends z.ZodTypeAny>(
  packPath: string,
  file: string,
  schema: TSchema,
  issues: ValidationIssue[],
  codePrefix: string
): z.output<TSchema> | undefined {
  if (!fs.existsSync(file)) {
    return undefined;
  }

  try {
    return parseSchemaData(schema, JSON.parse(fs.readFileSync(file, "utf8")), issues, `${codePrefix}.schema`, relativePath(packPath, file));
  } catch (error) {
    addIssue(issues, "error", `${codePrefix}.parse_failed`, errorMessage(error), relativePath(packPath, file));
    return undefined;
  }
}

function readYamlSchemaFile<TSchema extends z.ZodTypeAny>(
  packPath: string,
  file: string,
  schema: TSchema,
  issues: ValidationIssue[],
  codePrefix: string
): z.output<TSchema> | undefined {
  if (!fs.existsSync(file)) {
    return undefined;
  }

  try {
    return parseSchemaData(schema, YAML.parse(fs.readFileSync(file, "utf8")), issues, `${codePrefix}.schema`, relativePath(packPath, file));
  } catch (error) {
    addIssue(issues, "error", `${codePrefix}.parse_failed`, errorMessage(error), relativePath(packPath, file));
    return undefined;
  }
}

function parseSchemaData<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown,
  issues: ValidationIssue[],
  code: string,
  file: string
): z.output<TSchema> | undefined {
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    return parsed.data;
  }

  for (const issue of parsed.error.issues) {
    addIssue(issues, "error", code, issue.message, file, issue.path.join("."));
  }

  return undefined;
}

function scanFileTypes(packPath: string, files: string[], issues: ValidationIssue[]): void {
  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    const relativeFile = relativePath(packPath, file);

    if (executableExtensions.has(extension)) {
      addIssue(issues, "error", "pack.executable_file", `Executable or binary payload file is not allowed: ${relativeFile}.`, relativeFile);
    }

    if (scriptExtensions.has(extension)) {
      addIssue(issues, "error", "pack.script_file", `Script file is not allowed in v0 packs: ${relativeFile}.`, relativeFile);
    }
  }
}

function scanTextFiles(packPath: string, files: string[], issues: ValidationIssue[], enabled: boolean): void {
  if (!enabled) {
    return;
  }

  for (const file of files.filter(isScannableTextFile)) {
    const relativeFile = relativePath(packPath, file);
    let content = "";

    try {
      content = fs.readFileSync(file, "utf8");
    } catch (error) {
      addIssue(issues, "warning", "scan.read_failed", errorMessage(error), relativeFile);
      continue;
    }

    if (credentialPattern.test(content)) {
      addIssue(
        issues,
        "error",
        "scan.credential_pattern",
        "Obvious API key, token, password, or private key pattern found.",
        relativeFile
      );
    }

    if (shellCommandPattern.test(content)) {
      addIssue(issues, "error", "scan.shell_command", "Obvious shell command pattern found.", relativeFile);
    }
  }
}

function listFiles(root: string, issues: ValidationIssue[]): string[] {
  const files: string[] = [];

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      addIssue(issues, "error", "filesystem.read_failed", errorMessage(error), dir);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) {
        addIssue(issues, "warning", "filesystem.symlink", "Symlinks are ignored during validation.", fullPath);
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  walk(root);
  return files;
}

function isYamlFile(file: string): boolean {
  return [".yaml", ".yml"].includes(path.extname(file).toLowerCase());
}

function isScannableTextFile(file: string): boolean {
  return [".json", ".md", ".yaml", ".yml", ".txt"].includes(path.extname(file).toLowerCase());
}

function finish(
  packPath: string,
  packId: string | null,
  issues: ValidationIssue[],
  redactionHits: RedactionHit[],
  profiles: ExportReadinessProfileInput[]
): ValidationResult {
  sortIssues(issues);
  redactionHits.sort((a, b) =>
    `${a.file}\u0000${a.pattern}\u0000${a.recordId ?? ""}`.localeCompare(`${b.file}\u0000${b.pattern}\u0000${b.recordId ?? ""}`)
  );

  const readiness = buildExportReadiness(issues, profiles);
  const summary = {
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    infos: issues.filter((issue) => issue.severity === "info").length,
    redactionHits: redactionHits.length,
    exportProfilesReady: readiness.profiles.filter((profile) => profile.status === "ready").length,
    exportProfilesWithWarnings: readiness.profiles.filter((profile) => profile.status === "ready_with_warnings").length,
    exportProfilesBlocked: readiness.profiles.filter((profile) => profile.status === "blocked").length,
    staleSources: issues.filter((issue) => issue.code === "source.stale").length,
    licenseWarnings: issues.filter((issue) => issue.code.startsWith("source.license_")).length,
    licenseMissing: issues.filter((issue) => issue.code === "source.license_missing").length,
    licenseUnknown: issues.filter((issue) => issue.code === "source.license_unknown").length,
    licenseRisks: issues.filter((issue) => issue.code === "source.license_risk").length,
    docsWarnings: issues.filter((issue) => issue.code.startsWith("docs.")).length
  };
  const valid = summary.errors === 0;
  const validationStatus = !valid ? "invalid" : summary.warnings > 0 ? "valid_with_warnings" : "valid";

  return {
    packPath,
    packId,
    valid,
    validationStatus,
    issues,
    summary,
    redactionHits,
    exportReadiness: readiness
  };
}

export function toValidationReportV1(result: ValidationResult): ValidationReportV1 {
  return {
    schemaVersion: "contextarr.validation-report.v1",
    packPath: result.packPath,
    packId: result.packId,
    valid: result.valid,
    validationStatus: result.validationStatus,
    summary: result.summary,
    issues: result.issues,
    redactionHits: result.redactionHits,
    exportReadiness: result.exportReadiness
  };
}

function buildExportReadiness(issues: ValidationIssue[], profiles: ExportReadinessProfileInput[]): ExportReadinessReport {
  const exportSchemaErrors = issues.filter((issue) => issue.severity === "error" && issue.code.startsWith("export_profile."));
  const exportWarnings = issues.filter((issue) => issue.severity === "warning" && issue.code === "export_profile.readiness_warning");
  const profilesReport = profiles
    .map((profile) => {
      const blockingIssueCodes = exportSchemaErrors
        .filter((issue) => issue.file === profile.file || issue.path === profile.id || issue.path?.startsWith(`${profile.id}.`))
        .map((issue) => issue.code);
      const warningIssueCodes = exportWarnings
        .filter((issue) => issue.file === profile.file || issue.path === profile.id || issue.path?.startsWith(`${profile.id}.`))
        .map((issue) => issue.code);
      const status: "ready" | "ready_with_warnings" | "blocked" =
        blockingIssueCodes.length > 0 ? "blocked" : warningIssueCodes.length > 0 ? "ready_with_warnings" : "ready";

      return {
        id: profile.id,
        target: profile.target,
        format: profile.format,
        status,
        blockingIssueCodes,
        warningIssueCodes
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    status: profilesReport.some((profile) => profile.status === "blocked")
      ? "blocked"
      : profilesReport.some((profile) => profile.status === "ready_with_warnings")
        ? "ready_with_warnings"
        : "ready",
    profiles: profilesReport
  };
}

function sortIssues(issues: ValidationIssue[]): void {
  const rank: Record<ValidationSeverity, number> = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) =>
    rank[a.severity] - rank[b.severity] ||
    a.code.localeCompare(b.code) ||
    (a.file ?? "").localeCompare(b.file ?? "") ||
    (a.path ?? "").localeCompare(b.path ?? "") ||
    a.message.localeCompare(b.message)
  );
}

function addIssue(
  issues: ValidationIssue[],
  severity: ValidationSeverity,
  code: string,
  message: string,
  file?: string,
  fieldPath?: string
): void {
  issues.push({
    severity,
    code,
    message,
    file: file ? normalizePath(file) : undefined,
    path: fieldPath
  });
}

function relativePath(root: string, file: string): string {
  return normalizePath(path.relative(root, file));
}

function isInsidePath(root: string, file: string): boolean {
  const relative = path.relative(root, file);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isAbsoluteSourcePath(value: string): boolean {
  return path.isAbsolute(value) || path.win32.isAbsolute(value) || path.posix.isAbsolute(value);
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
