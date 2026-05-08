import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import { strFromU8, unzipSync } from "fflate";
import { validatePack, type ValidationResult } from "@contextarr/pack-validator";
import { validateSkill, type SkillValidationResult } from "@contextarr/skill-validator";
import type {
  ContextPackManifest,
  RecordFrontmatter,
  SkillInstructionFrontmatter,
  SkillManifest,
  Source
} from "@contextarr/schema";

export type ImporterKind = "auto" | "folder" | "markdown" | "obsidian" | "chatgpt" | "claude";
export type ResolvedImporterKind = Exclude<ImporterKind, "auto">;
export type SkillImporterKind = "auto" | "folder" | "markdown" | "prompt-template" | "claude-skill" | "chatgpt-prompts";
export type ResolvedSkillImporterKind = Exclude<SkillImporterKind, "auto">;

export interface ImportWarning {
  code: string;
  message: string;
  file?: string;
}

export interface ImportedRecord {
  id: string;
  title: string;
  type: string;
  tags: string[];
  body: string;
  sourceId: string;
  sourcePath: string;
  metadata: Record<string, unknown>;
}

export interface ImportedSource {
  id: string;
  type: string;
  title: string;
  path: string;
  status: "current" | "unknown";
}

export interface ImportedSkillDocument {
  id: string;
  title: string;
  type: string;
  tags: string[];
  body: string;
  sourceId: string;
  sourcePath: string;
  metadata: Record<string, unknown>;
}

export interface PreviewImportOptions {
  inputPath: string;
  kind?: ImporterKind;
  packId?: string;
  name?: string;
  maxRecords?: number;
}

export interface ImportToDraftPackOptions extends PreviewImportOptions {
  outputDir: string;
  overwrite?: boolean;
  generatedAt?: string;
}

export interface PreviewSkillImportOptions {
  inputPath: string;
  kind?: SkillImporterKind;
  skillId?: string;
  name?: string;
  maxDocs?: number;
}

export interface ImportToDraftSkillOptions extends PreviewSkillImportOptions {
  outputDir: string;
  overwrite?: boolean;
  generatedAt?: string;
}

export interface DraftPackPreview {
  inputPath: string;
  kind: ResolvedImporterKind;
  packId: string;
  packName: string;
  records: ImportedRecord[];
  sources: ImportedSource[];
  warnings: ImportWarning[];
}

export interface DraftImportResult {
  inputPath: string;
  kind: ResolvedImporterKind;
  packId: string;
  packName: string;
  packPath: string;
  recordCount: number;
  sourceCount: number;
  warnings: ImportWarning[];
  validation: ValidationResult;
}

export interface DraftSkillPreview {
  inputPath: string;
  kind: ResolvedSkillImporterKind;
  skillId: string;
  skillName: string;
  documents: ImportedSkillDocument[];
  sources: ImportedSource[];
  warnings: ImportWarning[];
}

export interface DraftSkillImportResult {
  inputPath: string;
  kind: ResolvedSkillImporterKind;
  skillId: string;
  skillName: string;
  skillPath: string;
  documentCount: number;
  sourceCount: number;
  warnings: ImportWarning[];
  validation: SkillValidationResult;
}

interface VirtualFile {
  relativePath: string;
  bytes: Uint8Array;
}

interface InputFiles {
  inputPath: string;
  inputName: string;
  files: VirtualFile[];
  isZip: boolean;
}

interface ImportContext {
  inputPath: string;
  inputName: string;
  packId: string;
  warnings: ImportWarning[];
  maxRecords: number;
  ids: Set<string>;
}

interface SkillImportContext {
  inputPath: string;
  inputName: string;
  skillId: string;
  warnings: ImportWarning[];
  maxDocs: number;
  ids: Set<string>;
}

interface BuildRecordOptions {
  packId: string;
  title: string;
  type: string;
  tags: string[];
  body: string;
  sourcePath: string;
  sourceType: string;
  sourceTitle?: string;
  metadata?: Record<string, unknown>;
}

interface BuildSkillDocumentOptions {
  skillId: string;
  title: string;
  type: string;
  tags: string[];
  body: string;
  sourcePath: string;
  sourceType: string;
  sourceTitle?: string;
  metadata?: Record<string, unknown>;
}

export class ImporterError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ImporterError";
  }
}

const defaultMaxRecords = 50;
const defaultMaxDocs = 50;
const maxFileBytes = 512 * 1024;
const textExtensions = new Set([".csv", ".json", ".log", ".md", ".txt", ".yaml", ".yml"]);
const markdownExtensions = new Set([".md", ".markdown"]);
const skillTextExtensions = new Set([".md", ".markdown", ".txt", ".prompt", ".template", ".json"]);
const promptTemplateExtensions = new Set([".md", ".markdown", ".txt", ".prompt", ".template"]);
const blockedSkillFileExtensions = new Set([
  ".app",
  ".apk",
  ".bat",
  ".bash",
  ".bin",
  ".cmd",
  ".com",
  ".cjs",
  ".dll",
  ".exe",
  ".fish",
  ".jar",
  ".js",
  ".jsx",
  ".mjs",
  ".msi",
  ".php",
  ".pl",
  ".ps1",
  ".py",
  ".rb",
  ".scr",
  ".sh",
  ".ts",
  ".tsx",
  ".vbs",
  ".wsf",
  ".zsh"
]);
const skippedDirectoryNames = new Set([
  ".git",
  ".hg",
  ".vscode",
  "build",
  "dist",
  "node_modules",
  "out"
]);
const skippedFileExtensions = new Set([
  ".7z",
  ".avif",
  ".bmp",
  ".exe",
  ".gif",
  ".heic",
  ".ico",
  ".jpeg",
  ".jpg",
  ".pdf",
  ".png",
  ".rar",
  ".webp"
]);

const shellCommandPattern =
  /(?:^|[\s`])(rm\s+-rf|sudo\s+|curl\s+[^\n]*\|\s*(?:sh|bash)|powershell(?:\.exe)?\s+-|cmd(?:\.exe)?\s+\/c|bash\s+-c|sh\s+-c|Invoke-WebRequest|Start-Process|chmod\s+\+x|execSync|child_process)(?:\b|[\s`])/i;
const credentialPattern =
  /\b(api[_ -]?key|secret|token|password|private[_ -]?key)\b\s*[:=]\s*["']?[^\s"',}]{8,}/i;

export function detectImportKind(inputPath: string): ResolvedImporterKind {
  const warnings: ImportWarning[] = [];
  const input = readInputFiles(inputPath, warnings);
  return detectKindFromInput(input, warnings);
}

export function previewImport(options: PreviewImportOptions): DraftPackPreview {
  const warnings: ImportWarning[] = [];
  const input = readInputFiles(options.inputPath, warnings);
  const kind = options.kind && options.kind !== "auto" ? options.kind : detectKindFromInput(input, warnings);
  const packId = normalizeId(options.packId ?? `${kind}-${stripKnownExtension(input.inputName)}`);
  const packName = options.name?.trim() || titleCase(`${kind} ${stripKnownExtension(input.inputName)}`);
  const context: ImportContext = {
    inputPath: input.inputPath,
    inputName: input.inputName,
    packId,
    warnings,
    maxRecords: options.maxRecords ?? defaultMaxRecords,
    ids: new Set<string>()
  };
  const records =
    kind === "folder"
      ? importFolder(input, context)
      : kind === "markdown"
        ? importMarkdown(input, context, false)
        : kind === "obsidian"
          ? importMarkdown(input, context, true)
          : kind === "chatgpt"
            ? importChatGpt(input, context)
            : importClaude(input, context);

  if (records.length === 0) {
    throw new ImporterError("import.no_records", `No importable records found in ${options.inputPath}.`);
  }

  return {
    inputPath: input.inputPath,
    kind,
    packId,
    packName,
    records,
    sources: records.map((record) => ({
      id: record.sourceId,
      type: String(record.metadata.sourceType ?? "imported_file"),
      title: String(record.metadata.sourceTitle ?? record.title),
      path: record.sourcePath,
      status: "unknown"
    })),
    warnings
  };
}

export function importToDraftPack(options: ImportToDraftPackOptions): DraftImportResult {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const preview = previewImport(options);
  const outputRoot = path.resolve(options.outputDir);
  const packPath = path.join(outputRoot, preview.packId);

  assertInside(outputRoot, packPath);

  if (fs.existsSync(packPath)) {
    if (!options.overwrite) {
      throw new ImporterError("output.exists", `Draft pack already exists: ${packPath}`);
    }

    fs.rmSync(packPath, { recursive: true, force: true });
  }

  writeDraftPack(packPath, preview, generatedAt);
  const validation = validatePack(packPath);

  return {
    inputPath: preview.inputPath,
    kind: preview.kind,
    packId: preview.packId,
    packName: preview.packName,
    packPath,
    recordCount: preview.records.length,
    sourceCount: preview.sources.length,
    warnings: preview.warnings,
    validation
  };
}

export function detectSkillImportKind(inputPath: string): ResolvedSkillImporterKind {
  const warnings: ImportWarning[] = [];
  const input = readInputFiles(inputPath, warnings);
  return detectSkillKindFromInput(input, warnings);
}

export function previewSkillImport(options: PreviewSkillImportOptions): DraftSkillPreview {
  const warnings: ImportWarning[] = [];
  const input = readInputFiles(options.inputPath, warnings);
  const kind = options.kind && options.kind !== "auto" ? options.kind : detectSkillKindFromInput(input, warnings);
  const skillId = normalizeId(options.skillId ?? `${kind}-${stripKnownExtension(input.inputName)}`);
  const skillName = options.name?.trim() || titleCase(`${kind} ${stripKnownExtension(input.inputName)} skill`);
  const context: SkillImportContext = {
    inputPath: input.inputPath,
    inputName: input.inputName,
    skillId,
    warnings,
    maxDocs: options.maxDocs ?? defaultMaxDocs,
    ids: new Set<string>()
  };
  const documents =
    kind === "folder"
      ? importSkillFolder(input, context)
      : kind === "markdown"
        ? importSkillMarkdown(input, context)
        : kind === "prompt-template"
          ? importPromptTemplates(input, context)
          : kind === "claude-skill"
            ? importClaudeSkill(input, context)
            : importChatGptPrompts(input, context);

  if (documents.length === 0) {
    throw new ImporterError("skill_import.no_documents", `No importable Skill documents found in ${options.inputPath}.`);
  }

  return {
    inputPath: input.inputPath,
    kind,
    skillId,
    skillName,
    documents,
    sources: documents.map((document) => ({
      id: document.sourceId,
      type: String(document.metadata.sourceType ?? "imported_skill_file"),
      title: String(document.metadata.sourceTitle ?? document.title),
      path: document.sourcePath,
      status: "unknown"
    })),
    warnings
  };
}

export function importSkillToDraft(options: ImportToDraftSkillOptions): DraftSkillImportResult {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const preview = previewSkillImport(options);
  const outputRoot = path.resolve(options.outputDir);
  const skillPath = path.join(outputRoot, preview.skillId);

  assertInside(outputRoot, skillPath);

  if (fs.existsSync(skillPath)) {
    if (!options.overwrite) {
      throw new ImporterError("output.exists", `Draft Skill already exists: ${skillPath}`);
    }

    fs.rmSync(skillPath, { recursive: true, force: true });
  }

  writeDraftSkill(skillPath, preview, generatedAt);
  const validation = validateSkill(skillPath);

  return {
    inputPath: preview.inputPath,
    kind: preview.kind,
    skillId: preview.skillId,
    skillName: preview.skillName,
    skillPath,
    documentCount: preview.documents.length,
    sourceCount: preview.sources.length,
    warnings: preview.warnings,
    validation
  };
}

function importFolder(input: InputFiles, context: ImportContext): ImportedRecord[] {
  const records: ImportedRecord[] = [];

  for (const file of input.files) {
    if (records.length >= context.maxRecords) {
      addWarning(context.warnings, "import.max_records", `Max records limit reached at ${context.maxRecords}.`);
      break;
    }

    if (hasPathPart(file.relativePath, ".obsidian") || hasPathPart(file.relativePath, ".trash")) {
      addWarning(context.warnings, "filesystem.directory_skipped", "System directory file skipped during folder import.", file.relativePath);
      continue;
    }

    if (shouldSkipFile(file.relativePath, context.warnings)) {
      continue;
    }

    const text = decodeTextFile(file, context.warnings);
    if (text === undefined) {
      continue;
    }

    const extension = path.extname(file.relativePath).toLowerCase().replace(".", "") || "text";
    const isMarkdown = markdownExtensions.has(path.extname(file.relativePath).toLowerCase());
    records.push(
      buildImportedRecord(context, {
        packId: context.packId,
        title: titleFromPath(file.relativePath),
        type: isMarkdown ? "imported_note" : "imported_file",
        tags: ["folder_import"],
        body: isMarkdown ? text.trim() : `# ${titleFromPath(file.relativePath)}\n\n\`\`\`${extension}\n${text.trim()}\n\`\`\``,
        sourcePath: file.relativePath,
        sourceType: "local_file"
      })
    );
  }

  return records;
}

function importMarkdown(input: InputFiles, context: ImportContext, obsidian: boolean): ImportedRecord[] {
  const records: ImportedRecord[] = [];

  for (const file of input.files) {
    if (records.length >= context.maxRecords) {
      addWarning(context.warnings, "import.max_records", `Max records limit reached at ${context.maxRecords}.`);
      break;
    }

    if (obsidian && shouldSkipObsidianFile(file.relativePath, context.warnings)) {
      continue;
    }

    if (!markdownExtensions.has(path.extname(file.relativePath).toLowerCase())) {
      addWarning(context.warnings, "import.unsupported_file", "Only Markdown files are imported for this kind.", file.relativePath);
      continue;
    }

    const text = decodeTextFile(file, context.warnings);
    if (text === undefined) {
      continue;
    }

    const parsed = matter(text);
    const tags = uniqueTags([
      ...(obsidian ? extractInlineTags(parsed.content) : []),
      ...extractFrontmatterTags(parsed.data),
      obsidian ? "obsidian_import" : "markdown_import"
    ]);

    records.push(
      buildImportedRecord(context, {
        packId: context.packId,
        title: getTitle(parsed.data, parsed.content, file.relativePath),
        type: obsidian ? "imported_obsidian_note" : "imported_note",
        tags,
        body: parsed.content.trim(),
        sourcePath: file.relativePath,
        sourceType: obsidian ? "obsidian_note" : "markdown_file",
        metadata: {
          frontmatter: parsed.data
        }
      })
    );
  }

  return records;
}

function importChatGpt(input: InputFiles, context: ImportContext): ImportedRecord[] {
  const conversationsFile = input.files.find((file) => path.basename(file.relativePath).toLowerCase() === "conversations.json");
  if (!conversationsFile) {
    throw new ImporterError("chatgpt.missing_conversations", "ChatGPT import requires a conversations.json file.");
  }

  const conversations = parseJsonFile(conversationsFile, "chatgpt.conversations_parse_failed");
  if (!Array.isArray(conversations)) {
    throw new ImporterError("chatgpt.invalid_shape", "ChatGPT conversations.json must contain an array.");
  }

  return conversationsToRecords(
    conversations,
    context,
    "chatgpt_conversation",
    "chatgpt_export",
    (conversation) => readChatGptMessages(conversation),
    (conversation, index) => stringField(conversation, "title") || `ChatGPT Conversation ${index + 1}`
  );
}

function importClaude(input: InputFiles, context: ImportContext): ImportedRecord[] {
  const jsonFiles = input.files.filter((file) => path.extname(file.relativePath).toLowerCase() === ".json");
  if (jsonFiles.length === 0) {
    throw new ImporterError("claude.missing_json", "Claude import requires at least one JSON file.");
  }

  const conversations: unknown[] = [];

  for (const file of jsonFiles) {
    const parsed = parseJsonFile(file, "claude.parse_failed");
    if (Array.isArray(parsed)) {
      conversations.push(...parsed);
    } else if (typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { conversations?: unknown[] }).conversations)) {
      conversations.push(...((parsed as { conversations: unknown[] }).conversations));
    } else {
      conversations.push(parsed);
    }
  }

  return conversationsToRecords(
    conversations,
    context,
    "claude_conversation",
    "claude_export",
    (conversation) => readClaudeMessages(conversation),
    (conversation, index) => stringField(conversation, "name") || stringField(conversation, "title") || `Claude Conversation ${index + 1}`
  );
}

function conversationsToRecords(
  conversations: unknown[],
  context: ImportContext,
  recordType: string,
  sourceType: string,
  readMessages: (conversation: unknown) => Array<{ role: string; text: string }>,
  readTitle: (conversation: Record<string, unknown>, index: number) => string
): ImportedRecord[] {
  const records: ImportedRecord[] = [];

  for (let index = 0; index < conversations.length; index += 1) {
    if (records.length >= context.maxRecords) {
      addWarning(context.warnings, "import.max_records", `Max records limit reached at ${context.maxRecords}.`);
      break;
    }

    const conversation = conversations[index];
    if (typeof conversation !== "object" || conversation === null) {
      addWarning(context.warnings, "conversation.invalid", "Conversation item is not an object.");
      continue;
    }

    const title = readTitle(conversation as Record<string, unknown>, index);
    const messages = readMessages(conversation);
    if (messages.length === 0) {
      addWarning(context.warnings, "conversation.empty", "Conversation has no importable messages.", title);
      continue;
    }

    const conversationId =
      stringField(conversation, "id") ||
      stringField(conversation, "uuid") ||
      stringField(conversation, "conversation_id") ||
      normalizeId(title);
    const body = [`# ${title}`, "", ...messages.flatMap((message) => [`## ${titleCase(message.role)}`, "", message.text.trim(), ""])]
      .join("\n")
      .trim();

    records.push(
      buildImportedRecord(context, {
        packId: context.packId,
        title,
        type: recordType,
        tags: [sourceType],
        body,
        sourcePath: `${sourceType}:${conversationId}`,
        sourceType,
        metadata: {
          conversationId
        }
      })
    );
  }

  if (records.length === 0) {
    throw new ImporterError(`${sourceType}.no_records`, "No conversations with importable messages were found.");
  }

  return records;
}

function importSkillFolder(input: InputFiles, context: SkillImportContext): ImportedSkillDocument[] {
  const documents: ImportedSkillDocument[] = [];

  for (const file of input.files) {
    if (documents.length >= context.maxDocs) {
      addWarning(context.warnings, "skill_import.max_docs", `Max Skill documents limit reached at ${context.maxDocs}.`);
      break;
    }

    if (shouldSkipSkillFile(file, context.warnings, skillTextExtensions)) {
      continue;
    }

    const text = decodeSafeSkillTextFile(file, context.warnings);
    if (text === undefined) {
      continue;
    }

    const extension = path.extname(file.relativePath).toLowerCase().replace(".", "") || "text";
    const isMarkdown = markdownExtensions.has(path.extname(file.relativePath).toLowerCase());
    documents.push(
      buildImportedSkillDocument(context, {
        skillId: context.skillId,
        title: titleFromPath(file.relativePath),
        type: isMarkdown ? "imported_skill_instruction" : "imported_skill_file",
        tags: ["folder_skill_import"],
        body: isMarkdown ? text.trim() : `# ${titleFromPath(file.relativePath)}\n\n\`\`\`${extension}\n${text.trim()}\n\`\`\``,
        sourcePath: file.relativePath,
        sourceType: "local_skill_file"
      })
    );
  }

  return documents;
}

function importSkillMarkdown(input: InputFiles, context: SkillImportContext): ImportedSkillDocument[] {
  const documents: ImportedSkillDocument[] = [];

  for (const file of input.files) {
    if (documents.length >= context.maxDocs) {
      addWarning(context.warnings, "skill_import.max_docs", `Max Skill documents limit reached at ${context.maxDocs}.`);
      break;
    }

    if (shouldSkipSkillFile(file, context.warnings, markdownExtensions)) {
      continue;
    }

    const text = decodeSafeSkillTextFile(file, context.warnings);
    if (text === undefined) {
      continue;
    }

    const parsed = matter(text);
    documents.push(
      buildImportedSkillDocument(context, {
        skillId: context.skillId,
        title: getTitle(parsed.data, parsed.content, file.relativePath),
        type: "imported_skill_instruction",
        tags: uniqueTags([...extractFrontmatterTags(parsed.data), ...extractInlineTags(parsed.content), "markdown_skill_import"]),
        body: parsed.content.trim(),
        sourcePath: file.relativePath,
        sourceType: "markdown_skill_file",
        metadata: {
          frontmatter: parsed.data
        }
      })
    );
  }

  return documents;
}

function importPromptTemplates(input: InputFiles, context: SkillImportContext): ImportedSkillDocument[] {
  const documents: ImportedSkillDocument[] = [];

  for (const file of input.files) {
    if (documents.length >= context.maxDocs) {
      addWarning(context.warnings, "skill_import.max_docs", `Max Skill documents limit reached at ${context.maxDocs}.`);
      break;
    }

    if (shouldSkipSkillFile(file, context.warnings, promptTemplateExtensions)) {
      continue;
    }

    const text = decodeSafeSkillTextFile(file, context.warnings);
    if (text === undefined) {
      continue;
    }

    const parsed = markdownExtensions.has(path.extname(file.relativePath).toLowerCase()) ? matter(text) : undefined;
    const body = parsed ? parsed.content.trim() : text.trim();
    documents.push(
      buildImportedSkillDocument(context, {
        skillId: context.skillId,
        title: parsed ? getTitle(parsed.data, parsed.content, file.relativePath) : titleFromPath(file.relativePath),
        type: "imported_prompt_template",
        tags: uniqueTags([...(parsed ? extractFrontmatterTags(parsed.data) : []), "prompt_template_import"]),
        body: body.startsWith("#") ? body : `# ${titleFromPath(file.relativePath)}\n\n${body}`,
        sourcePath: file.relativePath,
        sourceType: "prompt_template",
        metadata: parsed ? { frontmatter: parsed.data } : undefined
      })
    );
  }

  return documents;
}

function importClaudeSkill(input: InputFiles, context: SkillImportContext): ImportedSkillDocument[] {
  const orderedFiles = [...input.files].sort((left, right) => {
    const leftSkill = path.basename(left.relativePath).toLowerCase() === "skill.md" ? 0 : 1;
    const rightSkill = path.basename(right.relativePath).toLowerCase() === "skill.md" ? 0 : 1;
    return leftSkill - rightSkill || left.relativePath.localeCompare(right.relativePath);
  });
  const documents: ImportedSkillDocument[] = [];

  for (const file of orderedFiles) {
    if (documents.length >= context.maxDocs) {
      addWarning(context.warnings, "skill_import.max_docs", `Max Skill documents limit reached at ${context.maxDocs}.`);
      break;
    }

    if (shouldSkipSkillFile(file, context.warnings, new Set([".md", ".markdown", ".txt"]))) {
      continue;
    }

    const text = decodeSafeSkillTextFile(file, context.warnings);
    if (text === undefined) {
      continue;
    }

    const parsed = markdownExtensions.has(path.extname(file.relativePath).toLowerCase()) ? matter(text) : undefined;
    const body = parsed ? parsed.content.trim() : text.trim();
    documents.push(
      buildImportedSkillDocument(context, {
        skillId: context.skillId,
        title: path.basename(file.relativePath).toLowerCase() === "skill.md"
          ? "Claude Skill Instructions"
          : parsed
            ? getTitle(parsed.data, parsed.content, file.relativePath)
            : titleFromPath(file.relativePath),
        type: "imported_claude_skill_instruction",
        tags: uniqueTags([...(parsed ? extractFrontmatterTags(parsed.data) : []), "claude_skill_import"]),
        body: body.startsWith("#") ? body : `# ${titleFromPath(file.relativePath)}\n\n${body}`,
        sourcePath: file.relativePath,
        sourceType: "claude_skill"
      })
    );
  }

  return documents;
}

function importChatGptPrompts(input: InputFiles, context: SkillImportContext): ImportedSkillDocument[] {
  const documents: ImportedSkillDocument[] = [];
  const jsonFiles = input.files.filter((file) => path.extname(file.relativePath).toLowerCase() === ".json");

  if (jsonFiles.length === 0) {
    throw new ImporterError("chatgpt_prompts.missing_json", "ChatGPT prompt import requires at least one JSON file.");
  }

  for (const file of jsonFiles) {
    if (documents.length >= context.maxDocs) {
      addWarning(context.warnings, "skill_import.max_docs", `Max Skill documents limit reached at ${context.maxDocs}.`);
      break;
    }

    if (shouldSkipSkillFile(file, context.warnings, new Set([".json"]))) {
      continue;
    }

    const parsed = parseJsonFile(file, "chatgpt_prompts.parse_failed");
    const prompts = collectPromptItems(parsed, file.relativePath);
    if (prompts.length === 0) {
      addWarning(context.warnings, "chatgpt_prompts.empty", "No prompt templates were found in JSON file.", file.relativePath);
      continue;
    }

    for (let index = 0; index < prompts.length; index += 1) {
      if (documents.length >= context.maxDocs) {
        addWarning(context.warnings, "skill_import.max_docs", `Max Skill documents limit reached at ${context.maxDocs}.`);
        break;
      }

      const prompt = prompts[index];
      if (isBlockedSkillText(prompt.body)) {
        addWarning(
          context.warnings,
          "skill_import.blocked_content",
          "Prompt contains shell command or credential-like content and was skipped.",
          `${file.relativePath}#${index + 1}`
        );
        continue;
      }

      documents.push(
        buildImportedSkillDocument(context, {
          skillId: context.skillId,
          title: prompt.title,
          type: "imported_chatgpt_prompt",
          tags: uniqueTags(["chatgpt_prompt_import", ...prompt.tags]),
          body: prompt.body.startsWith("#") ? prompt.body : `# ${prompt.title}\n\n${prompt.body}`,
          sourcePath: `${file.relativePath}#${index + 1}`,
          sourceType: "chatgpt_prompt_export",
          metadata: {
            promptIndex: index
          }
        })
      );
    }
  }

  if (documents.length === 0) {
    throw new ImporterError("chatgpt_prompts.no_prompts", "No safe ChatGPT prompt templates were found.");
  }

  return documents;
}

function readChatGptMessages(conversation: unknown): Array<{ role: string; text: string }> {
  if (typeof conversation !== "object" || conversation === null) {
    return [];
  }

  const mapping = (conversation as { mapping?: unknown }).mapping;
  if (typeof mapping === "object" && mapping !== null) {
    return Object.values(mapping as Record<string, unknown>)
      .map((node) => {
        const message = typeof node === "object" && node !== null ? (node as { message?: unknown }).message : undefined;
        return readChatGptMessage(message);
      })
      .filter((message): message is { role: string; text: string } => Boolean(message?.text.trim()));
  }

  return readGenericMessages((conversation as { messages?: unknown }).messages);
}

function readChatGptMessage(message: unknown): { role: string; text: string } | undefined {
  if (typeof message !== "object" || message === null) {
    return undefined;
  }

  const role = stringField((message as { author?: unknown }).author, "role") || "unknown";
  const content = (message as { content?: unknown }).content;
  const parts = typeof content === "object" && content !== null ? (content as { parts?: unknown }).parts : undefined;
  const text = Array.isArray(parts) ? parts.map(stringifyContent).filter(Boolean).join("\n\n") : stringifyContent(content);
  return text ? { role, text } : undefined;
}

function readClaudeMessages(conversation: unknown): Array<{ role: string; text: string }> {
  if (typeof conversation !== "object" || conversation === null) {
    return [];
  }

  const value = conversation as { chat_messages?: unknown; messages?: unknown };
  return readGenericMessages(value.chat_messages ?? value.messages);
}

function readGenericMessages(messages: unknown): Array<{ role: string; text: string }> {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .map((message) => {
      if (typeof message !== "object" || message === null) {
        return undefined;
      }

      const role =
        stringField(message, "role") ||
        stringField(message, "sender") ||
        stringField(message, "author") ||
        stringField(message, "speaker") ||
        "unknown";
      const text =
        stringField(message, "text") ||
        stringField(message, "content") ||
        stringifyContent((message as { content?: unknown }).content);
      return text ? { role, text } : undefined;
    })
    .filter((message): message is { role: string; text: string } => Boolean(message?.text.trim()));
}

function buildImportedRecord(context: ImportContext, options: BuildRecordOptions): ImportedRecord {
  const baseId = `${options.packId}.${normalizeId(options.sourcePath || options.title)}`;
  const recordId = uniqueId(baseId, context);
  const sourceId = uniqueId(`${options.packId}.source.${normalizeId(options.sourcePath || options.title)}`, context);

  return {
    id: recordId,
    title: options.title,
    type: options.type,
    tags: uniqueTags(["imported_draft", "never_export", ...options.tags]),
    body: options.body || `# ${options.title}`,
    sourceId,
    sourcePath: options.sourcePath,
    metadata: {
      ...(options.metadata ?? {}),
      sourceType: options.sourceType,
      sourceTitle: options.sourceTitle ?? options.title
    }
  };
}

function buildImportedSkillDocument(context: SkillImportContext, options: BuildSkillDocumentOptions): ImportedSkillDocument {
  const baseId = `${options.skillId}.${normalizeId(options.sourcePath || options.title)}`;
  const documentId = makeUniqueId(baseId, context.ids);
  const sourceId = makeUniqueId(`${options.skillId}.source.${normalizeId(options.sourcePath || options.title)}`, context.ids);

  return {
    id: documentId,
    title: options.title,
    type: options.type,
    tags: uniqueTags(["imported_draft", "never_export", ...options.tags]),
    body: options.body || `# ${options.title}`,
    sourceId,
    sourcePath: options.sourcePath,
    metadata: {
      ...(options.metadata ?? {}),
      sourceType: options.sourceType,
      sourceTitle: options.sourceTitle ?? options.title
    }
  };
}

function writeDraftPack(packPath: string, preview: DraftPackPreview, generatedAt: string): void {
  fs.mkdirSync(path.join(packPath, "records"), { recursive: true });
  fs.mkdirSync(path.join(packPath, "sources"), { recursive: true });
  fs.mkdirSync(path.join(packPath, "exports"), { recursive: true });
  fs.mkdirSync(path.join(packPath, "rules"), { recursive: true });

  const manifest: ContextPackManifest = {
    id: preview.packId,
    name: preview.packName,
    version: "0.0.0-draft",
    description: `Imported draft pack generated from ${preview.kind} input.`,
    type: "imported_draft",
    visibility: "private",
    trustLevel: "unreviewed",
    author: "Contextarr Importer",
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
  fs.writeFileSync(path.join(packPath, "README.md"), `# ${preview.packName}\n\nImported draft pack. Records require human review before use.\n`, "utf8");
  fs.writeFileSync(path.join(packPath, "CHANGELOG.md"), `# Changelog\n\n## ${generatedAt.slice(0, 10)}\n\n- Created draft pack from ${preview.kind} import.\n`, "utf8");
  fs.writeFileSync(
    path.join(packPath, "LICENSE"),
    "Imported draft content remains owned by the original source owner. Review before reuse.\n",
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
      source_status: "imported",
      freshness: "unknown",
      privacy: "private",
      sources: [record.sourceId],
      review_status: "draft"
    };
    const fileName = `${record.id.slice(preview.packId.length + 1)}.md`;
    fs.writeFileSync(path.join(packPath, "records", safeFileName(fileName)), writeMarkdownRecord(frontmatter, record.body), "utf8");
  }

  const sources = preview.sources.map(
    (source): Source => ({
      id: source.id,
      type: source.type,
      title: source.title,
      path: source.path,
      status: source.status,
      trust: "unreviewed"
    })
  );
  fs.writeFileSync(path.join(packPath, "sources", "sources.yaml"), YAML.stringify({ sources }), "utf8");
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
        imported_draft: 365,
        imported_file: 365,
        imported_note: 365,
        imported_obsidian_note: 365,
        chatgpt_conversation: 365,
        claude_conversation: 365
      }
    }),
    "utf8"
  );
}

function writeDraftSkill(skillPath: string, preview: DraftSkillPreview, generatedAt: string): void {
  fs.mkdirSync(path.join(skillPath, "instructions"), { recursive: true });
  fs.mkdirSync(path.join(skillPath, "examples"), { recursive: true });
  fs.mkdirSync(path.join(skillPath, "exports"), { recursive: true });
  fs.mkdirSync(path.join(skillPath, "sources"), { recursive: true });
  fs.mkdirSync(path.join(skillPath, "rules"), { recursive: true });

  const manifest: SkillManifest = {
    id: preview.skillId,
    name: preview.skillName,
    version: "0.0.0-draft",
    description: `Imported draft Skill generated from ${preview.kind} input.`,
    type: "imported_skill",
    visibility: "private",
    trustLevel: "unreviewed",
    author: "Contextarr Importer",
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
      networkAccess: false,
      browserAutomation: false,
      toolExecution: false
    },
    instructionsPath: "instructions",
    examplesPath: "examples",
    sourcesPath: "sources/sources.yaml",
    exportsPath: "exports",
    rulesPath: "rules",
    targets: ["chatgpt", "claude", "codex", "generic_markdown"],
    inputs: ["local_import"],
    outputs: ["draft_instruction"],
    assets: {
      accentColor: "#22D3E8"
    },
    compatibility: {
      contextarr: ">=0.2.0"
    }
  };

  fs.writeFileSync(path.join(skillPath, "contextarr-skill.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(skillPath, "README.md"), `# ${preview.skillName}\n\nImported draft Skill. Review and approve every document before use.\n`, "utf8");
  fs.writeFileSync(path.join(skillPath, "CHANGELOG.md"), `# Changelog\n\n## ${generatedAt.slice(0, 10)}\n\n- Created draft Skill from ${preview.kind} import.\n`, "utf8");
  fs.writeFileSync(
    path.join(skillPath, "LICENSE"),
    "Imported draft content remains owned by the original source owner. Review before reuse.\n",
    "utf8"
  );

  for (const document of preview.documents) {
    const frontmatter: SkillInstructionFrontmatter = {
      id: document.id,
      title: document.title,
      type: document.type,
      skill: preview.skillId,
      tags: document.tags,
      confidence: "unknown",
      source_status: "imported",
      freshness: "unknown",
      privacy: "private",
      sources: [document.sourceId],
      review_status: "draft"
    };
    const fileName = `${document.id.slice(preview.skillId.length + 1)}.md`;
    fs.writeFileSync(
      path.join(skillPath, "instructions", safeFileName(fileName)),
      writeMarkdownSkillDocument(frontmatter, document.body),
      "utf8"
    );
  }

  const sources = preview.sources.map(
    (source): Source => ({
      id: source.id,
      type: source.type,
      title: source.title,
      path: source.path,
      status: source.status,
      trust: "unreviewed"
    })
  );
  fs.writeFileSync(path.join(skillPath, "sources", "sources.yaml"), YAML.stringify({ sources }), "utf8");
  fs.writeFileSync(
    path.join(skillPath, "rules", "validation.yaml"),
    YAML.stringify({
      required_fields: {
        record: ["id", "title", "type", "skill", "tags", "privacy", "sources", "review_status"]
      },
      checks: ["draft_skill_documents_require_review", "no_executable_content"]
    }),
    "utf8"
  );
  fs.writeFileSync(
    path.join(skillPath, "rules", "safety.yaml"),
    YAML.stringify({
      disallowed: {
        executable_files: true,
        shell_commands: true,
        network_calls: true,
        credential_requests: true,
        browser_automation: true,
        hidden_prompts: true,
        tool_execution: true
      },
      patterns: [
        {
          name: "credential_request",
          regex: "(api key|password|token|secret)",
          severity: "high",
          action: "review"
        },
        {
          name: "shell_command",
          regex: "(sudo|powershell|cmd.exe|bash -c|rm -rf)",
          severity: "high",
          action: "review"
        }
      ]
    }),
    "utf8"
  );
  fs.writeFileSync(
    path.join(skillPath, "rules", "freshness.yaml"),
    YAML.stringify({
      stale_after_days: {
        imported_skill_instruction: 90,
        imported_skill_file: 90,
        imported_prompt_template: 90,
        imported_claude_skill_instruction: 90,
        imported_chatgpt_prompt: 90
      }
    }),
    "utf8"
  );
}

function readInputFiles(inputPath: string, warnings: ImportWarning[]): InputFiles {
  const resolvedInputPath = path.resolve(inputPath);
  if (!fs.existsSync(resolvedInputPath)) {
    throw new ImporterError("input.not_found", `Input path does not exist: ${inputPath}`);
  }

  const stat = fs.statSync(resolvedInputPath);
  if (stat.isFile() && path.extname(resolvedInputPath).toLowerCase() === ".zip") {
    const entries = unzipSync(new Uint8Array(fs.readFileSync(resolvedInputPath)));
    return {
      inputPath: resolvedInputPath,
      inputName: path.basename(resolvedInputPath, ".zip"),
      isZip: true,
      files: Object.entries(entries)
        .filter(([name]) => !name.endsWith("/"))
        .map(([name, bytes]) => ({ relativePath: normalizePath(name), bytes }))
    };
  }

  if (stat.isFile()) {
    return {
      inputPath: resolvedInputPath,
      inputName: path.basename(resolvedInputPath),
      isZip: false,
      files: [{ relativePath: path.basename(resolvedInputPath), bytes: new Uint8Array(fs.readFileSync(resolvedInputPath)) }]
    };
  }

  if (!stat.isDirectory()) {
    throw new ImporterError("input.unsupported", `Input path is not a readable file or directory: ${inputPath}`);
  }

  return {
    inputPath: resolvedInputPath,
    inputName: path.basename(resolvedInputPath),
    isZip: false,
    files: listInputFiles(resolvedInputPath, resolvedInputPath, warnings)
  };
}

function listInputFiles(root: string, dir: string, warnings: ImportWarning[]): VirtualFile[] {
  const files: VirtualFile[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = normalizePath(path.relative(root, fullPath));

    if (entry.isSymbolicLink()) {
      addWarning(warnings, "filesystem.symlink_skipped", "Symlink skipped during import.", relativePath);
      continue;
    }

    if (entry.isDirectory()) {
      if (skippedDirectoryNames.has(entry.name.toLowerCase())) {
        addWarning(warnings, "filesystem.directory_skipped", "Directory skipped during import.", relativePath);
        continue;
      }

      files.push(...listInputFiles(root, fullPath, warnings));
      continue;
    }

    if (entry.isFile()) {
      files.push({ relativePath, bytes: new Uint8Array(fs.readFileSync(fullPath)) });
    }
  }

  return files;
}

function detectKindFromInput(input: InputFiles, warnings: ImportWarning[]): ResolvedImporterKind {
  const lowerName = input.inputName.toLowerCase();
  const fileNames = input.files.map((file) => file.relativePath.toLowerCase());

  if (lowerName.includes("claude") || input.files.some((file) => looksLikeClaudeJson(file, warnings))) {
    return "claude";
  }

  if (fileNames.some((file) => path.basename(file) === "conversations.json")) {
    return "chatgpt";
  }

  if (fileNames.some((file) => file.startsWith(".obsidian/") || file.includes("/.obsidian/"))) {
    return "obsidian";
  }

  if (input.files.length > 0 && input.files.every((file) => markdownExtensions.has(path.extname(file.relativePath).toLowerCase()))) {
    return "markdown";
  }

  return "folder";
}

function detectSkillKindFromInput(input: InputFiles, warnings: ImportWarning[]): ResolvedSkillImporterKind {
  const lowerName = input.inputName.toLowerCase();
  const fileNames = input.files.map((file) => file.relativePath.toLowerCase());

  if (lowerName.includes("claude-skill") || fileNames.some((file) => path.basename(file) === "skill.md")) {
    return "claude-skill";
  }

  if (
    lowerName.includes("chatgpt") ||
    input.files.some((file) => path.extname(file.relativePath).toLowerCase() === ".json" && looksLikePromptJson(file, warnings))
  ) {
    return "chatgpt-prompts";
  }

  if (
    input.files.some((file) => [".prompt", ".template"].includes(path.extname(file.relativePath).toLowerCase())) ||
    lowerName.includes("prompt")
  ) {
    return "prompt-template";
  }

  if (input.files.length > 0 && input.files.every((file) => markdownExtensions.has(path.extname(file.relativePath).toLowerCase()))) {
    return "markdown";
  }

  return "folder";
}

function looksLikePromptJson(file: VirtualFile, warnings: ImportWarning[]): boolean {
  try {
    return collectPromptItems(JSON.parse(strFromU8(file.bytes)), file.relativePath).length > 0;
  } catch {
    addWarning(warnings, "detect.json_parse_failed", "JSON file could not be parsed during Skill import auto detection.", file.relativePath);
    return false;
  }
}

function looksLikeClaudeJson(file: VirtualFile, warnings: ImportWarning[]): boolean {
  if (path.extname(file.relativePath).toLowerCase() !== ".json") {
    return false;
  }

  try {
    const parsed = JSON.parse(strFromU8(file.bytes));
    const candidate = Array.isArray(parsed) ? parsed[0] : parsed;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as { conversations?: unknown }).conversations)
    ) {
      const first = (parsed as { conversations: unknown[] }).conversations[0];
      return typeof first === "object" && first !== null && ("chat_messages" in first || "uuid" in first);
    }

    return (
      typeof candidate === "object" &&
      candidate !== null &&
      ("chat_messages" in candidate || (Array.isArray((candidate as { messages?: unknown }).messages) && "uuid" in candidate))
    );
  } catch {
    addWarning(warnings, "detect.json_parse_failed", "JSON file could not be parsed during auto detection.", file.relativePath);
    return false;
  }
}

function shouldSkipSkillFile(file: VirtualFile, warnings: ImportWarning[], allowedExtensions: Set<string>): boolean {
  const extension = path.extname(file.relativePath).toLowerCase();

  if (isUnsafeRelativePath(file.relativePath)) {
    addWarning(warnings, "skill_import.unsafe_path", "Unsafe file path skipped during Skill import.", file.relativePath);
    return true;
  }

  if (blockedSkillFileExtensions.has(extension)) {
    addWarning(warnings, "skill_import.executable_file", "Executable or script-like file skipped during Skill import.", file.relativePath);
    return true;
  }

  if (!allowedExtensions.has(extension)) {
    addWarning(warnings, "skill_import.unsupported_file", "Unsupported file skipped during Skill import.", file.relativePath);
    return true;
  }

  return false;
}

function shouldSkipFile(relativePath: string, warnings: ImportWarning[]): boolean {
  const extension = path.extname(relativePath).toLowerCase();
  if (skippedFileExtensions.has(extension) || !textExtensions.has(extension)) {
    addWarning(warnings, "import.unsupported_file", "Unsupported or binary-looking file skipped.", relativePath);
    return true;
  }

  return false;
}

function decodeSafeSkillTextFile(file: VirtualFile, warnings: ImportWarning[]): string | undefined {
  const text = decodeTextFile(file, warnings);
  if (text === undefined) {
    return undefined;
  }

  if (isBlockedSkillText(text)) {
    addWarning(
      warnings,
      "skill_import.blocked_content",
      "File contains shell command or credential-like content and was skipped.",
      file.relativePath
    );
    return undefined;
  }

  return text;
}

function isBlockedSkillText(text: string): boolean {
  return shellCommandPattern.test(text) || credentialPattern.test(text);
}

function isUnsafeRelativePath(relativePath: string): boolean {
  const normalized = normalizePath(relativePath);
  if (!normalized || normalized.startsWith("/") || /^[A-Za-z]:\//.test(normalized)) {
    return true;
  }

  return normalized.split("/").some((part) => !part || part === "." || part === ".." || /[\x00-\x1f<>:"|?*]/.test(part));
}

function shouldSkipObsidianFile(relativePath: string, warnings: ImportWarning[]): boolean {
  const parts = relativePath.split("/");
  if (parts.some((part) => [".obsidian", ".trash"].includes(part.toLowerCase()))) {
    addWarning(warnings, "obsidian.system_file_skipped", "Obsidian system file skipped.", relativePath);
    return true;
  }

  if (!markdownExtensions.has(path.extname(relativePath).toLowerCase())) {
    addWarning(warnings, "obsidian.attachment_skipped", "Obsidian attachment skipped.", relativePath);
    return true;
  }

  return false;
}

function hasPathPart(relativePath: string, part: string): boolean {
  return relativePath.split("/").some((value) => value.toLowerCase() === part.toLowerCase());
}

function decodeTextFile(file: VirtualFile, warnings: ImportWarning[]): string | undefined {
  if (file.bytes.byteLength > maxFileBytes) {
    addWarning(warnings, "import.file_too_large", `File exceeds ${maxFileBytes} bytes and was skipped.`, file.relativePath);
    return undefined;
  }

  if (looksBinary(file.bytes)) {
    addWarning(warnings, "import.binary_skipped", "Binary-looking file skipped.", file.relativePath);
    return undefined;
  }

  return strFromU8(file.bytes);
}

function parseJsonFile(file: VirtualFile, errorCode: string): unknown {
  try {
    return JSON.parse(strFromU8(file.bytes));
  } catch (error) {
    throw new ImporterError(errorCode, `Failed to parse ${file.relativePath}: ${errorMessage(error)}`);
  }
}

function collectPromptItems(value: unknown, fallbackSource: string): Array<{ title: string; body: string; tags: string[] }> {
  const rawItems = collectPromptItemValues(value);
  if (rawItems.length === 0) {
    const singleItem = normalizePromptItem(value, fallbackSource, 0);
    return singleItem ? [singleItem] : [];
  }

  return rawItems
    .map((item, index) => normalizePromptItem(item, fallbackSource, index))
    .filter((item): item is { title: string; body: string; tags: string[] } => Boolean(item));
}

function collectPromptItemValues(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "object" || value === null) {
    return [];
  }

  const record = value as { prompts?: unknown; items?: unknown; data?: unknown };
  if (Array.isArray(record.prompts)) {
    return record.prompts;
  }
  if (Array.isArray(record.items)) {
    return record.items;
  }
  if (Array.isArray(record.data)) {
    return record.data;
  }

  return [];
}

function normalizePromptItem(
  item: unknown,
  fallbackSource: string,
  index: number
): { title: string; body: string; tags: string[] } | undefined {
  if (typeof item === "string") {
    const body = item.trim();
    return body ? { title: `${titleFromPath(fallbackSource)} Prompt ${index + 1}`, body, tags: [] } : undefined;
  }

  if (typeof item !== "object" || item === null) {
    return undefined;
  }

  const record = item as Record<string, unknown>;
  const title =
    stringField(record, "title") ||
    stringField(record, "name") ||
    stringField(record, "label") ||
    `${titleFromPath(fallbackSource)} Prompt ${index + 1}`;
  const body =
    stringField(record, "prompt") ||
    stringField(record, "content") ||
    stringField(record, "text") ||
    stringField(record, "instructions") ||
    stringifyContent(record.messages);

  if (!body.trim()) {
    return undefined;
  }

  return {
    title,
    body: body.trim(),
    tags: extractFrontmatterTags(record)
  };
}

function writeMarkdownRecord(frontmatter: RecordFrontmatter, body: string): string {
  return `---\n${YAML.stringify(frontmatter)}---\n\n${body.trim()}\n`;
}

function writeMarkdownSkillDocument(frontmatter: SkillInstructionFrontmatter, body: string): string {
  return `---\n${YAML.stringify(frontmatter)}---\n\n${body.trim()}\n`;
}

function extractFrontmatterTags(data: Record<string, unknown>): string[] {
  const tags = data.tags ?? data.tag;
  if (Array.isArray(tags)) {
    return tags.map(String);
  }

  if (typeof tags === "string") {
    return tags.split(/[,\s]+/);
  }

  return [];
}

function extractInlineTags(markdown: string): string[] {
  return Array.from(markdown.matchAll(/(?:^|\s)#([A-Za-z0-9][A-Za-z0-9_/-]*)/g)).map((match) => match[1].replace(/\//g, "_"));
}

function getTitle(data: Record<string, unknown>, markdown: string, relativePath: string): string {
  if (typeof data.title === "string" && data.title.trim()) {
    return data.title.trim();
  }

  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || titleFromPath(relativePath);
}

function titleFromPath(relativePath: string): string {
  return titleCase(stripKnownExtension(path.basename(relativePath)));
}

function stripKnownExtension(value: string): string {
  return value.replace(/\.(zip|md|markdown|json|txt|yaml|yml|csv|log|prompt|template)$/i, "");
}

function normalizeId(value: string): string {
  const id = value
    .replace(/\\/g, "/")
    .replace(/\.[A-Za-z0-9]+$/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._/-]+/g, "-")
    .replace(/[/-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return id || "imported";
}

function uniqueId(baseId: string, context: ImportContext): string {
  return makeUniqueId(baseId, context.ids);
}

function makeUniqueId(baseId: string, existing: Set<string>): string {
  let candidate = baseId;
  let suffix = 2;
  while (existing.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }

  existing.add(candidate);
  return candidate;
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

function titleCase(value: string): string {
  return value
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function stringField(value: unknown, field: string): string | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const fieldValue = (value as Record<string, unknown>)[field];
  return typeof fieldValue === "string" && fieldValue.trim() ? fieldValue.trim() : undefined;
}

function stringifyContent(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(stringifyContent).filter(Boolean).join("\n\n");
  }

  if (typeof value === "object" && value !== null) {
    if (typeof (value as { text?: unknown }).text === "string") {
      return (value as { text: string }).text;
    }

    if (typeof (value as { content?: unknown }).content !== "undefined") {
      return stringifyContent((value as { content: unknown }).content);
    }
  }

  return "";
}

function looksBinary(bytes: Uint8Array): boolean {
  const sampleLength = Math.min(bytes.length, 2048);
  for (let index = 0; index < sampleLength; index += 1) {
    if (bytes[index] === 0) {
      return true;
    }
  }

  return false;
}

function assertInside(root: string, target: string): void {
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ImporterError("output.invalid_path", "Output path escaped the requested output directory.");
  }
}

function addWarning(warnings: ImportWarning[], code: string, message: string, file?: string): void {
  warnings.push({ code, message, file: file ? normalizePath(file) : undefined });
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
