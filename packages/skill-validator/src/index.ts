import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import { z } from "zod";
import {
  freshnessRulesSchema,
  skillExportProfileSchema,
  skillInstructionFrontmatterSchema,
  skillManifestSchema,
  skillSafetyRulesSchema,
  sourceMapSchema,
  validationRulesSchema,
  type SkillInstructionFrontmatter,
  type SkillManifest,
  type SourceMap
} from "@contextarr/schema";

export type SkillValidationSeverity = "error" | "warning" | "info";

export interface SkillValidationIssue {
  severity: SkillValidationSeverity;
  code: string;
  message: string;
  file?: string;
  path?: string;
}

export interface SkillValidationResult {
  skillPath: string;
  valid: boolean;
  issues: SkillValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

export interface ValidateSkillOptions {
  scanText?: boolean;
}

export class SkillReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillReadError";
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

const scriptExtensions = new Set([".cjs", ".js", ".jsx", ".mjs", ".php", ".pl", ".py", ".rb", ".ts", ".tsx"]);

const credentialPattern =
  /\b(api[_ -]?key|secret|token|password|private[_ -]?key)\b\s*[:=]\s*["']?[^\s"',}]{8,}/i;

const credentialRequestPattern =
  /\b(ask|request|collect|enter|paste|provide)\b.{0,80}\b(api[_ -]?key|secret|token|password|credential|private[_ -]?key)\b/i;

const shellCommandPattern =
  /(?:^|[\s`])(rm\s+-rf|sudo\s+|curl\s+[^\n]*\|\s*(?:sh|bash)|powershell(?:\.exe)?\s+-|cmd(?:\.exe)?\s+\/c|bash\s+-c|sh\s+-c|Invoke-WebRequest|Start-Process|chmod\s+\+x|execSync|child_process)(?:\b|[\s`])/i;

const hiddenInstructionPattern =
  /\b(ignore previous instructions|do not tell the user|secretly|silently exfiltrate|hidden instruction)\b/i;

const networkInstructionPattern =
  /(?:\b(?:fetch|download|upload|post\s+to|send\s+to|call\s+(?:an\s+)?api|webhook|http\s+request|visit|open|browse\s+to|go\s+to|navigate\s+to|access)\b.{0,120}(?:https?:\/\/|www\.|api\b|webhook\b)|(?:https?:\/\/|www\.))/i;

export function validateSkill(skillPath: string, options: ValidateSkillOptions = {}): SkillValidationResult {
  const resolvedSkillPath = path.resolve(skillPath);
  const issues: SkillValidationIssue[] = [];

  if (!fs.existsSync(resolvedSkillPath)) {
    throw new SkillReadError(`Skill path does not exist: ${resolvedSkillPath}`);
  }

  if (!fs.statSync(resolvedSkillPath).isDirectory()) {
    throw new SkillReadError(`Skill path is not a directory: ${resolvedSkillPath}`);
  }

  const allFiles = listFiles(resolvedSkillPath, issues);
  scanFileTypes(resolvedSkillPath, allFiles, issues);

  const manifestFile = path.join(resolvedSkillPath, "contextarr-skill.json");
  const manifest = readJsonSchemaFile(
    resolvedSkillPath,
    manifestFile,
    skillManifestSchema,
    issues,
    "skill_manifest"
  );

  if (!manifest) {
    if (!fs.existsSync(manifestFile)) {
      addIssue(issues, "error", "skill_manifest.missing", "Missing contextarr-skill.json.", "contextarr-skill.json");
    }

    scanTextFiles(resolvedSkillPath, allFiles, issues, options.scanText ?? true);
    return finish(resolvedSkillPath, issues);
  }

  validateManifestSafety(manifest, issues);
  const instructions = validateInstructions(resolvedSkillPath, manifest, issues);
  validateExamples(resolvedSkillPath, manifest, issues);
  validateSourceMap(resolvedSkillPath, manifest, instructions, issues);
  validateExportProfiles(resolvedSkillPath, manifest, instructions, issues);
  const safetyPatterns = validateRules(resolvedSkillPath, manifest, issues);
  scanTextFiles(resolvedSkillPath, allFiles, issues, options.scanText ?? true, safetyPatterns);

  return finish(resolvedSkillPath, issues);
}

export function formatSkillValidationResult(result: SkillValidationResult): string {
  const lines: string[] = [];
  const status = result.valid ? "Skill validation passed" : "Skill validation failed";

  lines.push(`${status}: ${result.skillPath}`);
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

function validateManifestSafety(manifest: SkillManifest, issues: SkillValidationIssue[]): void {
  if (manifest.containsExecutableCode !== false) {
    addIssue(
      issues,
      "error",
      "skill_manifest.executable_code",
      "containsExecutableCode must be false for Contextarr Skills.",
      "contextarr-skill.json",
      "containsExecutableCode"
    );
  }

  if (manifest.requiresNetwork !== false) {
    addIssue(
      issues,
      "error",
      "skill_manifest.requires_network",
      "requiresNetwork must be false for Contextarr Skills.",
      "contextarr-skill.json",
      "requiresNetwork"
    );
  }

  const permissionChecks = [
    ["runCommands", manifest.permissions.runCommands],
    ["networkAccess", manifest.permissions.networkAccess],
    ["browserAutomation", manifest.permissions.browserAutomation],
    ["toolExecution", manifest.permissions.toolExecution]
  ] as const;

  for (const [permission, value] of permissionChecks) {
    if (value !== false) {
      addIssue(
        issues,
        "error",
        `skill_manifest.${toSnakeCase(permission)}`,
        `permissions.${permission} must be false.`,
        "contextarr-skill.json",
        `permissions.${permission}`
      );
    }
  }
}

function validateInstructions(
  skillPath: string,
  manifest: SkillManifest,
  issues: SkillValidationIssue[]
): SkillInstructionFrontmatter[] {
  const instructionsDir = path.join(skillPath, manifest.instructionsPath);

  if (!fs.existsSync(instructionsDir) || !fs.statSync(instructionsDir).isDirectory()) {
    addIssue(
      issues,
      "error",
      "instructions.missing_directory",
      `Instructions folder does not exist: ${manifest.instructionsPath}.`,
      manifest.instructionsPath
    );
    return [];
  }

  const instructionFiles = listFiles(instructionsDir, issues).filter((file) => file.toLowerCase().endsWith(".md"));
  if (instructionFiles.length === 0) {
    addIssue(
      issues,
      "error",
      "instructions.empty",
      "Instructions folder must contain at least one Markdown instruction.",
      manifest.instructionsPath
    );
  }

  const instructions: SkillInstructionFrontmatter[] = [];
  const seenIds = new Map<string, string>();

  for (const file of instructionFiles) {
    const relativeFile = relativePath(skillPath, file);
    let parsed: matter.GrayMatterFile<string>;

    try {
      parsed = matter(fs.readFileSync(file, "utf8"));
    } catch (error) {
      addIssue(issues, "error", "instruction.read_failed", errorMessage(error), relativeFile);
      continue;
    }

    const instruction = parseSchemaData(
      skillInstructionFrontmatterSchema,
      parsed.data,
      issues,
      "instruction.schema",
      relativeFile
    );

    if (!instruction) {
      continue;
    }

    if (instruction.skill !== manifest.id) {
      addIssue(
        issues,
        "error",
        "instruction.skill_mismatch",
        `Instruction skill "${instruction.skill}" does not match manifest id "${manifest.id}".`,
        relativeFile,
        "skill"
      );
    }

    const existingFile = seenIds.get(instruction.id);
    if (existingFile) {
      addIssue(
        issues,
        "error",
        "instruction.duplicate_id",
        `Instruction id "${instruction.id}" is already used by ${existingFile}.`,
        relativeFile,
        "id"
      );
    } else {
      seenIds.set(instruction.id, relativeFile);
    }

    instructions.push(instruction);
  }

  return instructions;
}

function validateExamples(skillPath: string, manifest: SkillManifest, issues: SkillValidationIssue[]): void {
  const examplesDir = path.join(skillPath, manifest.examplesPath);

  if (!fs.existsSync(examplesDir) || !fs.statSync(examplesDir).isDirectory()) {
    addIssue(
      issues,
      "warning",
      "examples.missing_directory",
      `Examples folder does not exist: ${manifest.examplesPath}.`,
      manifest.examplesPath
    );
    return;
  }

  const exampleFiles = listFiles(examplesDir, issues).filter((file) => file.toLowerCase().endsWith(".md"));
  if (exampleFiles.length === 0) {
    addIssue(issues, "warning", "examples.empty", "Examples folder contains no Markdown examples.", manifest.examplesPath);
  }
}

function validateSourceMap(
  skillPath: string,
  manifest: SkillManifest,
  instructions: SkillInstructionFrontmatter[],
  issues: SkillValidationIssue[]
): SourceMap | undefined {
  const sourcesFile = path.join(skillPath, manifest.sourcesPath);
  const sourceMap = readYamlSchemaFile(skillPath, sourcesFile, sourceMapSchema, issues, "sources");

  if (!sourceMap) {
    if (!fs.existsSync(sourcesFile)) {
      addIssue(issues, "error", "sources.missing", "Source map is required.", manifest.sourcesPath);
    }
    return undefined;
  }

  const sourceIds = new Set(sourceMap.sources.map((source) => source.id));
  for (const instruction of instructions) {
    for (const sourceId of instruction.sources) {
      if (!sourceIds.has(sourceId)) {
        addIssue(
          issues,
          "error",
          "instruction.source_missing",
          `Instruction "${instruction.id}" references missing source "${sourceId}".`,
          manifest.instructionsPath,
          "sources"
        );
      }
    }
  }

  return sourceMap;
}

function validateExportProfiles(
  skillPath: string,
  manifest: SkillManifest,
  instructions: SkillInstructionFrontmatter[],
  issues: SkillValidationIssue[]
): void {
  const exportsDir = path.join(skillPath, manifest.exportsPath);

  if (!fs.existsSync(exportsDir) || !fs.statSync(exportsDir).isDirectory()) {
    addIssue(
      issues,
      "warning",
      "exports.missing_directory",
      `Export profiles folder does not exist: ${manifest.exportsPath}.`,
      manifest.exportsPath
    );
    return;
  }

  const exportFiles = listFiles(exportsDir, issues).filter(isYamlFile);
  if (exportFiles.length === 0) {
    addIssue(issues, "warning", "exports.empty", "Export profiles folder contains no YAML profiles.", manifest.exportsPath);
  }

  const instructionIds = new Set(instructions.map((instruction) => instruction.id));
  for (const file of exportFiles) {
    const profile = readYamlSchemaFile(skillPath, file, skillExportProfileSchema, issues, "skill_export_profile");
    if (!profile?.include?.instructions) {
      continue;
    }

    for (const instructionId of profile.include.instructions) {
      if (!instructionIds.has(instructionId)) {
        addIssue(
          issues,
          "error",
          "skill_export_profile.instruction_missing",
          `Export profile "${profile.id}" references missing instruction "${instructionId}".`,
          relativePath(skillPath, file),
          "include.instructions"
        );
      }
    }
  }
}

interface CompiledSafetyPattern {
  name: string;
  regex: RegExp;
  action: "block" | "review" | "warn";
  severity: "critical" | "high" | "medium" | "low";
}

function validateRules(
  skillPath: string,
  manifest: SkillManifest,
  issues: SkillValidationIssue[]
): CompiledSafetyPattern[] {
  const rulesDir = path.join(skillPath, manifest.rulesPath);
  const compiledPatterns: CompiledSafetyPattern[] = [];

  if (!fs.existsSync(rulesDir) || !fs.statSync(rulesDir).isDirectory()) {
    addIssue(
      issues,
      "error",
      "rules.missing_directory",
      `Rules folder does not exist: ${manifest.rulesPath}.`,
      manifest.rulesPath
    );
    return compiledPatterns;
  }

  const safetyFile = path.join(rulesDir, "safety.yaml");
  if (!fs.existsSync(safetyFile)) {
    addIssue(issues, "error", "rules.safety_missing", "Skill safety rules are required.", `${manifest.rulesPath}/safety.yaml`);
  } else {
    const safetyRules = readYamlSchemaFile(skillPath, safetyFile, skillSafetyRulesSchema, issues, "rules.safety");
    if (safetyRules) {
      validateSafetyRuleLockdown(safetyRules.disallowed, relativePath(skillPath, safetyFile), issues);
      for (const pattern of safetyRules.patterns) {
        try {
          compiledPatterns.push({
            name: pattern.name,
            regex: new RegExp(pattern.regex),
            action: pattern.action,
            severity: pattern.severity
          });
        } catch (error) {
          addIssue(
            issues,
            "error",
            "rules.safety.invalid_regex",
            errorMessage(error),
            relativePath(skillPath, safetyFile),
            `patterns.${pattern.name}.regex`
          );
        }
      }
    }
  }

  const optionalRules = [
    ["validation.yaml", validationRulesSchema, "rules.validation"],
    ["freshness.yaml", freshnessRulesSchema, "rules.freshness"]
  ] as const;

  for (const [fileName, schema, code] of optionalRules) {
    const file = path.join(rulesDir, fileName);
    if (fs.existsSync(file)) {
      readYamlSchemaFile(skillPath, file, schema, issues, code);
    }
  }

  return compiledPatterns;
}

function readJsonSchemaFile<TSchema extends z.ZodTypeAny>(
  skillPath: string,
  file: string,
  schema: TSchema,
  issues: SkillValidationIssue[],
  codePrefix: string
): z.output<TSchema> | undefined {
  if (!fs.existsSync(file)) {
    return undefined;
  }

  try {
    return parseSchemaData(schema, JSON.parse(fs.readFileSync(file, "utf8")), issues, `${codePrefix}.schema`, relativePath(skillPath, file));
  } catch (error) {
    addIssue(issues, "error", `${codePrefix}.parse_failed`, errorMessage(error), relativePath(skillPath, file));
    return undefined;
  }
}

function readYamlSchemaFile<TSchema extends z.ZodTypeAny>(
  skillPath: string,
  file: string,
  schema: TSchema,
  issues: SkillValidationIssue[],
  codePrefix: string
): z.output<TSchema> | undefined {
  if (!fs.existsSync(file)) {
    return undefined;
  }

  try {
    return parseSchemaData(schema, YAML.parse(fs.readFileSync(file, "utf8")), issues, `${codePrefix}.schema`, relativePath(skillPath, file));
  } catch (error) {
    addIssue(issues, "error", `${codePrefix}.parse_failed`, errorMessage(error), relativePath(skillPath, file));
    return undefined;
  }
}

function parseSchemaData<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown,
  issues: SkillValidationIssue[],
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

function scanFileTypes(skillPath: string, files: string[], issues: SkillValidationIssue[]): void {
  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    const relativeFile = relativePath(skillPath, file);

    if (executableExtensions.has(extension)) {
      addIssue(issues, "error", "skill.executable_file", `Executable or binary payload file is not allowed: ${relativeFile}.`, relativeFile);
    }

    if (scriptExtensions.has(extension)) {
      addIssue(issues, "error", "skill.script_file", `Script file is not allowed in Contextarr Skills: ${relativeFile}.`, relativeFile);
    }
  }
}

function scanTextFiles(
  skillPath: string,
  files: string[],
  issues: SkillValidationIssue[],
  enabled: boolean,
  safetyPatterns: CompiledSafetyPattern[] = []
): void {
  if (!enabled) {
    return;
  }

  for (const file of files.filter(isScannableTextFile)) {
    const relativeFile = relativePath(skillPath, file);
    const isSkillContent = isSkillContentTextFile(relativeFile);
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

    if (!isRulesTextFile(relativeFile)) {
      if (credentialRequestPattern.test(content)) {
        addIssue(
          issues,
          "error",
          "scan.credential_request",
          "Skill content must not request API keys, passwords, tokens, or credentials.",
          relativeFile
        );
      }

      if (shellCommandPattern.test(content)) {
        addIssue(issues, "error", "scan.shell_command", "Obvious shell command pattern found.", relativeFile);
      }

      if (hiddenInstructionPattern.test(content)) {
        addIssue(issues, "error", "scan.hidden_instruction", "Hidden or deceptive instruction pattern found.", relativeFile);
      }

      if (networkInstructionPattern.test(content)) {
        addIssue(
          issues,
          "error",
          "scan.network_instruction",
          "Network-like instruction pattern found; Skills must remain non-executable and must not require network actions.",
          relativeFile
        );
      }
    }

    for (const pattern of safetyPatterns) {
      if (!isSkillContent) {
        continue;
      }

      if (!pattern.regex.test(content)) {
        continue;
      }

      addIssue(
        issues,
        pattern.action === "block" || pattern.severity === "critical" ? "error" : "warning",
        "rules.safety.pattern_match",
        `Skill safety pattern matched: ${pattern.name}.`,
        relativeFile
      );
    }
  }
}

function validateSafetyRuleLockdown(
  disallowed: Record<string, unknown>,
  file: string,
  issues: SkillValidationIssue[]
): void {
  const requiredTrueFlags = [
    "executable_files",
    "shell_commands",
    "network_calls",
    "credential_requests",
    "browser_automation",
    "hidden_prompts",
    "tool_execution"
  ];

  for (const flag of requiredTrueFlags) {
    if (disallowed[flag] !== true) {
      addIssue(
        issues,
        "error",
        "rules.safety.relaxed_disallowed",
        `Skill safety rule disallowed.${flag} must be true.`,
        file,
        `disallowed.${flag}`
      );
    }
  }
}

function listFiles(root: string, issues: SkillValidationIssue[]): string[] {
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

function isSkillContentTextFile(relativeFile: string): boolean {
  return (
    relativeFile.toLowerCase().endsWith(".md") &&
    (relativeFile.startsWith("instructions/") || relativeFile.startsWith("examples/"))
  );
}

function isRulesTextFile(relativeFile: string): boolean {
  return relativeFile.startsWith("rules/") && isYamlFile(relativeFile);
}

function finish(skillPath: string, issues: SkillValidationIssue[]): SkillValidationResult {
  const summary = {
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    infos: issues.filter((issue) => issue.severity === "info").length
  };

  return {
    skillPath,
    valid: summary.errors === 0,
    issues,
    summary
  };
}

function addIssue(
  issues: SkillValidationIssue[],
  severity: SkillValidationSeverity,
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

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (part) => `_${part.toLowerCase()}`);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
