import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import {
  contextPackManifestSchema,
  exportProfileSchema,
  recordFrontmatterSchema,
  redactionRulesSchema,
  skillExportProfileSchema,
  skillInstructionFrontmatterSchema,
  skillManifestSchema,
  skillSafetyRulesSchema,
  sourceMapSchema,
  type ContextPackManifest,
  type ExportProfile,
  type RecordFrontmatter,
  type RedactionRules,
  type SkillExportProfile,
  type SkillInstructionFrontmatter,
  type SkillManifest,
  type SkillSafetyRules,
  type Source
} from "@contextarr/schema";
import { validatePack } from "@contextarr/pack-validator";
import { validateSkill } from "@contextarr/skill-validator";

export type ExportWarningCode =
  | "redaction.pattern_invalid"
  | "redaction.warn"
  | "skill_document.excluded"
  | "skill_safety.pattern_matched"
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

export interface SkillExportProfileListing {
  skillId: string;
  profile: SkillExportProfile;
}

export interface BuildPackExportOptions {
  packPath: string;
  profileId: string;
  generatedAt?: string;
}

export interface ComposeSelection {
  packPath: string;
  recordIds: string[];
}

export interface BuildComposedExportOptions {
  title?: string;
  target: string;
  format: "markdown" | "json";
  privacyMode?: "redacted" | "public_safe";
  selections: ComposeSelection[];
  excludeTags?: string[];
  tokenBudget?: number;
  generatedAt?: string;
}

export interface BuildPackExportsOptions {
  packPath: string;
  profileIds?: string[];
  generatedAt?: string;
}

export interface BuildSkillExportOptions {
  skillPath: string;
  profileId: string;
  generatedAt?: string;
}

export interface BuildSkillExportsOptions {
  skillPath: string;
  profileIds?: string[];
  generatedAt?: string;
}

export interface ListPackExportProfilesOptions {
  packPath: string;
}

export interface ListSkillExportProfilesOptions {
  skillPath: string;
}

interface LoadedRecord {
  file: string;
  metadata: RecordFrontmatter;
  body: string;
}

interface LoadedSkillDocument {
  kind: "instruction" | "example";
  file: string;
  metadata: SkillInstructionFrontmatter;
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

interface LoadedSkillForExport {
  skillPath: string;
  manifest: SkillManifest;
  instructions: LoadedSkillDocument[];
  examples: LoadedSkillDocument[];
  sources: Source[];
  exportProfiles: SkillExportProfile[];
  safetyRules: SkillSafetyRules;
}

interface PreparedRecord {
  record: LoadedRecord;
  body: string;
}

interface PreparedComposedRecord extends PreparedRecord {
  pack: LoadedPackForExport;
}

interface PreparedSkillDocument {
  document: LoadedSkillDocument;
  body: string;
}

const supportedTargets = new Set([
  "chatgpt",
  "claude",
  "claude_code",
  "codex",
  "markdown",
  "generic_markdown",
  "json",
  "json_records"
]);
const defaultComposedExcludeTags = ["secret", "never_export", "imported_draft"];
const defaultSkillRedactionTags = ["secret", "never_export", "imported_draft", "ai_draft"];

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

export function listSkillExportProfiles(options: ListSkillExportProfilesOptions): SkillExportProfileListing[] {
  const skill = loadSkillForExport(options.skillPath);
  return skill.exportProfiles.map((profile) => ({
    skillId: skill.manifest.id,
    profile
  }));
}

export function buildPackExports(options: BuildPackExportsOptions): ExportArtifact[] {
  const pack = loadPackForExport(options.packPath);
  const profileIds = options.profileIds ?? pack.exportProfiles.map((profile) => profile.id);

  return profileIds.map((profileId) => buildExportFromLoadedPack(pack, profileId, options.generatedAt));
}

export function buildSkillExports(options: BuildSkillExportsOptions): ExportArtifact[] {
  const skill = loadSkillForExport(options.skillPath);
  const profileIds = options.profileIds ?? skill.exportProfiles.map((profile) => profile.id);

  return profileIds.map((profileId) => buildExportFromLoadedSkill(skill, profileId, options.generatedAt));
}

export function buildPackExport(options: BuildPackExportOptions): ExportArtifact {
  const pack = loadPackForExport(options.packPath);
  return buildExportFromLoadedPack(pack, options.profileId, options.generatedAt);
}

export function buildSkillExport(options: BuildSkillExportOptions): ExportArtifact {
  const skill = loadSkillForExport(options.skillPath);
  return buildExportFromLoadedSkill(skill, options.profileId, options.generatedAt);
}

export function buildComposedExport(options: BuildComposedExportOptions): ExportArtifact {
  if (!supportedTargets.has(options.target)) {
    throw new ExportError("unsupported_target", `Export target is not supported for composed exports: ${options.target}`);
  }

  if (!["markdown", "json"].includes(options.format)) {
    throw new ExportError("unsupported_format", `Composed export format is not supported: ${options.format}`);
  }

  if (options.selections.length === 0 || options.selections.every((selection) => selection.recordIds.length === 0)) {
    throw new ExportError("selection_empty", "Composed export requires at least one selected record.");
  }

  const packs = options.selections.map((selection) => ({
    selection,
    pack: loadPackForExport(selection.packPath)
  }));
  const warnings: ExportWarning[] = [];
  const privacyMode = options.privacyMode ?? "redacted";
  const excludeTags = options.excludeTags ?? defaultComposedExcludeTags;
  const { included, excluded } = selectComposedRecords(packs, privacyMode, excludeTags, warnings);
  const title = options.title?.trim() || "Composed Context Export";
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const sources = summarizeComposedSources(included);
  const content =
    options.format === "json"
      ? renderComposedJsonExport(title, options, included, excluded, sources, warnings, privacyMode, generatedAt)
      : renderComposedMarkdownExport(title, options, included, excluded, sources, warnings, privacyMode, generatedAt);
  const estimatedTokens = estimateTokens(content);

  if (options.tokenBudget && estimatedTokens > options.tokenBudget) {
    warnings.push({
      code: "token_budget.exceeded",
      message: `Estimated export size (${estimatedTokens} tokens) exceeds profile budget (${options.tokenBudget}).`
    });
  }

  return {
    packId: "composed",
    packName: title,
    profileId: "composed-preview",
    profileName: title,
    target: options.target,
    format: options.format,
    filename: `${slugifyFilePart(title)}-${targetFilePart(options.target)}.${options.format === "json" ? "json" : "md"}`,
    mimeType: mimeTypeForFormat(options.format),
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

function buildExportFromLoadedSkill(skill: LoadedSkillForExport, profileId: string, generatedAt = new Date().toISOString()): ExportArtifact {
  const profile = skill.exportProfiles.find((candidate) => candidate.id === profileId);
  if (!profile) {
    throw new ExportError("profile_not_found", `Skill export profile not found: ${profileId}`);
  }

  if (!supportedTargets.has(profile.target)) {
    throw new ExportError("unsupported_target", `Skill export target is not supported in Phase 18: ${profile.target}`);
  }

  const warnings: ExportWarning[] = [];
  const { included, excluded } = selectSkillDocuments(skill, profile, warnings);
  const sources = summarizeSkillSources(skill.sources, included.flatMap(({ document }) => document.metadata.sources));
  const content =
    profile.format === "json"
      ? renderSkillJsonExport(skill, profile, included, excluded, sources, warnings, generatedAt)
      : renderSkillMarkdownExport(skill, profile, included, excluded, sources, warnings, generatedAt);
  const estimatedTokens = estimateTokens(content);

  if (profile.token_budget && estimatedTokens > profile.token_budget) {
    warnings.push({
      code: "token_budget.exceeded",
      message: `Estimated export size (${estimatedTokens} tokens) exceeds profile budget (${profile.token_budget}).`
    });
  }

  return {
    packId: skill.manifest.id,
    packName: skill.manifest.name,
    profileId: profile.id,
    profileName: profile.name,
    target: profile.target,
    format: profile.format,
    filename: filenameForProfile(profile),
    mimeType: mimeTypeForFormat(profile.format),
    content,
    includedRecords: included.map(({ document }) => summarizeSkillDocument(document)),
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

function selectSkillDocuments(
  skill: LoadedSkillForExport,
  profile: SkillExportProfile,
  warnings: ExportWarning[]
): { included: PreparedSkillDocument[]; excluded: ExcludedExportRecord[] } {
  const instructionById = new Map(skill.instructions.map((document) => [document.metadata.id, document]));
  const exampleById = new Map(skill.examples.map((document) => [document.metadata.id, document]));
  const requestedInstructionIds = profile.include?.instructions ?? skill.instructions.map((document) => document.metadata.id);
  const requestedExampleIds = profile.include?.examples ?? skill.examples.map((document) => document.metadata.id);
  const missingInstructionIds = requestedInstructionIds.filter((id) => !instructionById.has(id));
  const missingExampleIds = requestedExampleIds.filter((id) => !exampleById.has(id));

  if (missingInstructionIds.length > 0 || missingExampleIds.length > 0) {
    throw new ExportError(
      "document_not_found",
      `Skill export profile references missing document(s): ${[...missingInstructionIds, ...missingExampleIds].join(", ")}`
    );
  }

  const included: PreparedSkillDocument[] = [];
  const excluded: ExcludedExportRecord[] = [];
  const seen = new Set<string>();
  const sectionOrder = skillExportSections(profile);

  for (const section of sectionOrder) {
    if (section === "instructions") {
      addSkillDocuments(requestedInstructionIds.map((id) => instructionById.get(id)!), skill, profile, warnings, included, excluded, seen);
    }

    if (section === "examples") {
      addSkillDocuments(requestedExampleIds.map((id) => exampleById.get(id)!), skill, profile, warnings, included, excluded, seen);
    }
  }

  return { included, excluded };
}

function addSkillDocuments(
  documents: LoadedSkillDocument[],
  skill: LoadedSkillForExport,
  profile: SkillExportProfile,
  warnings: ExportWarning[],
  included: PreparedSkillDocument[],
  excluded: ExcludedExportRecord[],
  seen: Set<string>
): void {
  for (const document of documents) {
    if (seen.has(document.metadata.id)) {
      continue;
    }
    seen.add(document.metadata.id);

    const reason = skillDocumentExclusionReason(document.metadata, profile);
    if (reason) {
      maybeWarnForSkillDocumentExclusion(document.metadata, warnings);
      excluded.push(summarizeExcludedSkillDocument(excluded.length + 1, reason));
      continue;
    }

    included.push({
      document,
      body: applySkillSafetyRedaction(document.body, skill.safetyRules, document.metadata.id, warnings)
    });
  }
}

function skillExportSections(profile: SkillExportProfile): string[] {
  return profile.sections.length > 0 ? profile.sections : ["instructions", "examples", "safety"];
}

function skillProfileIncludesSection(profile: SkillExportProfile, section: string): boolean {
  return skillExportSections(profile).includes(section);
}

function maybeWarnForSkillDocumentExclusion(metadata: SkillInstructionFrontmatter, warnings: ExportWarning[]): void {
  if (metadata.review_status === "approved") {
    return;
  }

  warnings.push({
    code: "skill_document.excluded",
    message: "A Skill document was excluded because it is not approved.",
    recordId: "excluded-skill-document"
  });
}

function selectComposedRecords(
  packs: Array<{ selection: ComposeSelection; pack: LoadedPackForExport }>,
  privacyMode: "redacted" | "public_safe",
  excludeTags: string[],
  warnings: ExportWarning[]
): { included: PreparedComposedRecord[]; excluded: ExcludedExportRecord[] } {
  const included: PreparedComposedRecord[] = [];
  const excluded: ExcludedExportRecord[] = [];

  for (const { selection, pack } of packs) {
    const byId = new Map(pack.records.map((record) => [record.metadata.id, record]));
    const missingIds = selection.recordIds.filter((id) => !byId.has(id));
    if (missingIds.length > 0) {
      throw new ExportError("record_not_found", `Composed export references missing record(s): ${missingIds.join(", ")}`);
    }

    for (const recordId of selection.recordIds) {
      const record = byId.get(recordId)!;
      const reason = composedExclusionReason(record.metadata, privacyMode, excludeTags, pack.redactionRules);

      if (reason) {
        excluded.push({ ...summarizeRecord(record), reason });
        continue;
      }

      included.push({
        pack,
        record,
        body: applyRedaction(record.body, pack.redactionRules, record.metadata.id, warnings)
      });
    }
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

function skillDocumentExclusionReason(
  metadata: SkillInstructionFrontmatter,
  profile: SkillExportProfile
): string | undefined {
  const blockedTags = new Set([...profile.exclude_tags, ...defaultSkillRedactionTags]);
  const blockedTag = metadata.tags.find((tag) => blockedTags.has(tag));
  if (blockedTag) {
    return `Excluded by Skill export tag: ${blockedTag}`;
  }

  if (metadata.review_status !== "approved") {
    return `Excluded because review status is ${metadata.review_status}`;
  }

  if (profile.privacy_mode === "public_safe" && metadata.privacy !== "public_safe") {
    return `Excluded by public-safe privacy mode: ${metadata.privacy}`;
  }

  if ((profile.privacy_mode ?? "redacted") === "redacted") {
    if (["secret", "sensitive", "private"].includes(metadata.privacy)) {
      return `Excluded by redacted privacy mode: ${metadata.privacy}`;
    }
  }

  if (metadata.privacy === "secret") {
    return "Excluded by Skill export safety: secret";
  }

  return undefined;
}

function composedExclusionReason(
  metadata: RecordFrontmatter,
  privacyMode: "redacted" | "public_safe",
  excludeTags: string[],
  rules: RedactionRules
): string | undefined {
  const blockedTags = new Set([...excludeTags, ...rules.redact_tags]);
  const blockedTag = metadata.tags.find((tag) => blockedTags.has(tag));
  if (blockedTag) {
    return `Excluded by composed export tag: ${blockedTag}`;
  }

  if (privacyMode === "public_safe" && metadata.privacy !== "public_safe") {
    return `Excluded by public-safe privacy mode: ${metadata.privacy}`;
  }

  if (privacyMode === "redacted" && metadata.privacy === "secret") {
    return "Excluded by redacted privacy mode: secret";
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

function applySkillSafetyRedaction(
  body: string,
  rules: SkillSafetyRules,
  documentId: string,
  warnings: ExportWarning[]
): string {
  let redacted = body;

  for (const pattern of rules.patterns) {
    const regex = compileSkillSafetyPattern(pattern, warnings);
    if (!regex) {
      continue;
    }

    regex.lastIndex = 0;
    if (!regex.test(redacted)) {
      continue;
    }

    warnings.push({
      code: "skill_safety.pattern_matched",
      message: `Skill safety pattern matched in document ${documentId}: ${pattern.name}.`,
      recordId: documentId,
      pattern: pattern.name
    });

    if (pattern.action === "block" || pattern.action === "review") {
      redacted = redacted.replace(regex, "[redacted]");
    }
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

function compileSkillSafetyPattern(
  pattern: SkillSafetyRules["patterns"][number],
  warnings: ExportWarning[]
): RegExp | undefined {
  let source = pattern.regex;
  let flags = "";

  if (source.startsWith("(?i)")) {
    source = source.slice(4);
    flags = "i";
  }

  flags = Array.from(new Set(`${flags}g`.split(""))).join("");

  try {
    return new RegExp(source, flags);
  } catch {
    warnings.push({
      code: "redaction.pattern_invalid",
      message: `Skill safety pattern is not valid JavaScript RegExp and was skipped: ${pattern.name}.`,
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

function renderSkillMarkdownExport(
  skill: LoadedSkillForExport,
  profile: SkillExportProfile,
  included: PreparedSkillDocument[],
  excluded: ExcludedExportRecord[],
  sources: ExportSourceSummary[],
  warnings: ExportWarning[],
  generatedAt: string
): string {
  const lines = [
    `# ${targetLabel(profile.target)} Skill Export: ${skill.manifest.name}`,
    "",
    `Generated: ${generatedAt}`,
    `Profile: ${profile.name} (${profile.id})`,
    `Privacy mode: ${profile.privacy_mode ?? "redacted"}`,
    `Format: ${profile.format}`,
    "",
    "## Skill Summary",
    "",
    skill.manifest.description,
    "",
    `Type: ${skill.manifest.type}`,
    `Targets: ${skill.manifest.targets.join(", ") || "none"}`,
    `Inputs: ${skill.manifest.inputs.join(", ") || "none"}`,
    `Outputs: ${skill.manifest.outputs.join(", ") || "none"}`,
    "",
    "## Included Skill Documents",
    ""
  ];

  for (const { document, body } of included) {
    lines.push(
      `### ${document.metadata.title}`,
      "",
      `Document ID: ${document.metadata.id}`,
      `Kind: ${document.kind}`,
      `Type: ${document.metadata.type}`,
      `Privacy: ${document.metadata.privacy}`,
      `Review status: ${document.metadata.review_status}`,
      `Tags: ${document.metadata.tags.join(", ") || "none"}`,
      `Sources: ${document.metadata.sources.join(", ") || "none"}`,
      "",
      body,
      ""
    );
  }

  if (skillProfileIncludesSection(profile, "safety")) {
    lines.push("## Safety Rules", "");
    lines.push(
      `Executable files blocked: ${String(skill.safetyRules.disallowed.executable_files)}`,
      `Shell commands blocked: ${String(skill.safetyRules.disallowed.shell_commands)}`,
      `Network calls blocked: ${String(skill.safetyRules.disallowed.network_calls)}`,
      `Credential requests blocked: ${String(skill.safetyRules.disallowed.credential_requests)}`,
      `Browser automation blocked: ${String(skill.safetyRules.disallowed.browser_automation)}`,
      `Hidden prompts blocked: ${String(skill.safetyRules.disallowed.hidden_prompts)}`,
      `Tool execution blocked: ${String(skill.safetyRules.disallowed.tool_execution)}`,
      ""
    );

    if (skill.safetyRules.patterns.length > 0) {
      for (const pattern of skill.safetyRules.patterns) {
        lines.push(`- ${pattern.name}: ${pattern.severity} / ${pattern.action}`);
      }
      lines.push("");
    }
  }

  if (excluded.length > 0) {
    lines.push("## Excluded Skill Documents", "");
    for (const document of excluded) {
      lines.push(`- ${document.id}: ${document.reason}`);
    }
    lines.push("");
  }

  lines.push("## Sources", "");
  if (sources.length === 0) {
    lines.push("No source references were included.", "");
  } else {
    for (const source of sources) {
      lines.push(`- ${source.id}: ${source.title} (${source.type}${source.trust ? `, ${source.trust}` : ""})`);
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

function renderSkillJsonExport(
  skill: LoadedSkillForExport,
  profile: SkillExportProfile,
  included: PreparedSkillDocument[],
  excluded: ExcludedExportRecord[],
  sources: ExportSourceSummary[],
  warnings: ExportWarning[],
  generatedAt: string
): string {
  return `${JSON.stringify(
    {
      contextarrExportVersion: "0.1",
      exportKind: "skill",
      generatedAt,
      skill: {
        id: skill.manifest.id,
        name: skill.manifest.name,
        version: skill.manifest.version,
        description: skill.manifest.description,
        type: skill.manifest.type,
        targets: skill.manifest.targets,
        inputs: skill.manifest.inputs,
        outputs: skill.manifest.outputs
      },
      profile: {
        id: profile.id,
        name: profile.name,
        target: profile.target,
        format: profile.format,
        privacyMode: profile.privacy_mode ?? "redacted"
      },
      documents: included.map(({ document, body }) => ({
        kind: document.kind,
        metadata: document.metadata,
        body
      })),
      excludedRecords: excluded,
      sources,
      safety: {
        disallowed: skill.safetyRules.disallowed,
        patterns: skill.safetyRules.patterns.map((pattern) => ({
          name: pattern.name,
          severity: pattern.severity,
          action: pattern.action
        }))
      },
      warnings
    },
    null,
    2
  )}\n`;
}

function renderComposedMarkdownExport(
  title: string,
  options: BuildComposedExportOptions,
  included: PreparedComposedRecord[],
  excluded: ExcludedExportRecord[],
  sources: ExportSourceSummary[],
  warnings: ExportWarning[],
  privacyMode: string,
  generatedAt: string
): string {
  const lines = [
    `# ${targetLabel(options.target)} Context Export: ${title}`,
    "",
    `Generated: ${generatedAt}`,
    `Privacy mode: ${privacyMode}`,
    `Records included: ${included.length}`,
    "",
    "## Included Records",
    ""
  ];

  for (const { pack, record, body } of included) {
    lines.push(
      `### ${record.metadata.title}`,
      "",
      `- Pack: ${pack.manifest.name} (${pack.manifest.id})`,
      `- Record ID: ${record.metadata.id}`,
      `- Type: ${record.metadata.type}`,
      `- Privacy: ${record.metadata.privacy}`,
      `- Tags: ${record.metadata.tags.join(", ") || "none"}`,
      `- Sources: ${record.metadata.sources.join(", ") || "none"}`,
      "",
      body,
      ""
    );
  }

  if (sources.length > 0) {
    lines.push("## Source Summaries", "");
    for (const source of sources) {
      lines.push(`- ${source.id}: ${source.title} (${source.type}${source.trust ? `, ${source.trust}` : ""})`);
    }
    lines.push("");
  }

  if (excluded.length > 0) {
    lines.push("## Excluded Records", "");
    for (const record of excluded) {
      lines.push(`- ${record.id}: ${record.reason}`);
    }
    lines.push("");
  }

  if (warnings.length > 0) {
    lines.push("## Export Warnings", "");
    for (const warning of warnings) {
      lines.push(`- ${warning.message}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function renderComposedJsonExport(
  title: string,
  options: BuildComposedExportOptions,
  included: PreparedComposedRecord[],
  excluded: ExcludedExportRecord[],
  sources: ExportSourceSummary[],
  warnings: ExportWarning[],
  privacyMode: string,
  generatedAt: string
): string {
  return `${JSON.stringify(
    {
      contextarrExportVersion: "0.1",
      exportKind: "composed",
      title,
      target: options.target,
      format: options.format,
      privacyMode,
      generatedAt,
      records: included.map(({ pack, record, body }) => ({
        packId: pack.manifest.id,
        packName: pack.manifest.name,
        id: record.metadata.id,
        title: record.metadata.title,
        type: record.metadata.type,
        privacy: record.metadata.privacy,
        tags: record.metadata.tags,
        sources: record.metadata.sources,
        body
      })),
      sources,
      excludedRecords: excluded,
      warnings
    },
    null,
    2
  )}\n`;
}

function summarizeComposedSources(included: PreparedComposedRecord[]): ExportSourceSummary[] {
  const byKey = new Map<string, ExportSourceSummary>();

  for (const { pack, record } of included) {
    for (const source of summarizeSources(pack.sources, record.metadata.sources)) {
      byKey.set(`${pack.manifest.id}:${source.id}`, source);
    }
  }

  return Array.from(byKey.values()).sort((left, right) => left.id.localeCompare(right.id));
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

function summarizeSkillSources(sources: Source[], sourceIds: string[]): ExportSourceSummary[] {
  const wanted = new Set(sourceIds);
  return sources
    .filter((source) => wanted.has(source.id))
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((source) => ({
      id: source.id,
      title: source.title,
      type: source.type,
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

function summarizeSkillDocument(document: LoadedSkillDocument): ExportRecordSummary {
  return {
    id: document.metadata.id,
    title: document.metadata.title,
    type: document.metadata.type,
    privacy: document.metadata.privacy,
    tags: document.metadata.tags,
    sources: document.metadata.sources
  };
}

function summarizeExcludedSkillDocument(index: number, reason: string): ExcludedExportRecord {
  return {
    id: `excluded-skill-document-${index}`,
    title: "Excluded Skill Document",
    type: "skill_document",
    privacy: "redacted",
    tags: [],
    sources: [],
    reason: safeSkillExclusionReason(reason)
  };
}

function safeSkillExclusionReason(reason: string): string {
  if (reason.includes("review status")) {
    return "Excluded because the Skill document is not approved.";
  }

  if (reason.includes("privacy mode") || reason.includes("secret") || reason.includes("tag")) {
    return "Excluded by Skill export safety policy.";
  }

  return "Excluded by Skill export policy.";
}

function filenameForProfile(profile: ExportProfile | SkillExportProfile): string {
  const extension = profile.format === "json" ? "json" : profile.format === "text" ? "txt" : "md";
  return `${profile.id}.${extension}`;
}

function slugifyFilePart(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "composed-context"
  );
}

function targetFilePart(target: string): string {
  return target.replace(/[^a-z0-9_]+/gi, "-").toLowerCase();
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

  throw new ExportError("unsupported_format", `Export format is not supported: ${format}`);
}

function targetLabel(target: string): string {
  const labels: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    claude_code: "Claude Code",
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

function loadSkillForExport(skillPath: string): LoadedSkillForExport {
  const resolvedSkillPath = path.resolve(skillPath);
  const validation = validateSkill(resolvedSkillPath);
  if (!validation.valid) {
    throw new ExportError("validation_failed", "Validation failed for export Skill.");
  }

  const manifest = skillManifestSchema.parse(
    JSON.parse(fs.readFileSync(path.join(resolvedSkillPath, "contextarr-skill.json"), "utf8"))
  );
  const sourcesPath = resolveManifestPath(resolvedSkillPath, manifest.sourcesPath);
  const sources = sourcesPath && fs.existsSync(sourcesPath)
    ? sourceMapSchema.parse(YAML.parse(fs.readFileSync(sourcesPath, "utf8"))).sources
    : [];
  const rulesDir = resolveManifestPath(resolvedSkillPath, manifest.rulesPath);
  const safetyRulesPath = rulesDir ? path.join(rulesDir, "safety.yaml") : undefined;
  const safetyRules = safetyRulesPath && fs.existsSync(safetyRulesPath)
    ? skillSafetyRulesSchema.parse(YAML.parse(fs.readFileSync(safetyRulesPath, "utf8")))
    : skillSafetyRulesSchema.parse({});

  return {
    skillPath: resolvedSkillPath,
    manifest,
    instructions: readSkillDocuments(resolvedSkillPath, manifest, manifest.instructionsPath, "instruction"),
    examples: readSkillDocuments(resolvedSkillPath, manifest, manifest.examplesPath, "example"),
    sources,
    exportProfiles: readSkillExportProfiles(resolvedSkillPath, manifest),
    safetyRules
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

function readSkillDocuments(
  skillPath: string,
  manifest: SkillManifest,
  documentPath: string,
  kind: "instruction" | "example"
): LoadedSkillDocument[] {
  const documentsDir = resolveManifestPath(skillPath, documentPath);
  if (!documentsDir || !fs.existsSync(documentsDir)) {
    return [];
  }

  return listFiles(documentsDir)
    .filter((file) => file.toLowerCase().endsWith(".md"))
    .map((file) => {
      const parsed = matter(fs.readFileSync(file, "utf8"));
      return {
        kind,
        file: normalizePath(path.relative(skillPath, file)),
        metadata: skillInstructionFrontmatterSchema.parse(parsed.data),
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

function readSkillExportProfiles(skillPath: string, manifest: SkillManifest): SkillExportProfile[] {
  const exportsDir = resolveManifestPath(skillPath, manifest.exportsPath);
  if (!exportsDir || !fs.existsSync(exportsDir)) {
    return [];
  }

  return listFiles(exportsDir)
    .filter((file) => [".yaml", ".yml"].includes(path.extname(file).toLowerCase()))
    .map((file) => skillExportProfileSchema.parse(YAML.parse(fs.readFileSync(file, "utf8"))))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function resolveManifestPath(rootPath: string, manifestPath: string): string | undefined {
  const root = path.resolve(rootPath);
  const resolved = path.resolve(root, manifestPath);
  const relative = path.relative(root, resolved);

  if (path.isAbsolute(manifestPath) || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return undefined;
  }

  return resolved;
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
