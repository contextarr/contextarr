import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import { z } from "zod";
import { PackReadError, validatePack } from "@contextarr/pack-validator";
import {
  agentKitCompatibilityRulesSchema,
  agentKitExportProfileSchema,
  agentKitManifestSchema,
  agentKitTemplateSchema,
  contextPackManifestSchema,
  recordFrontmatterSchema,
  redactionRulesSchema,
  skillInstructionFrontmatterSchema,
  skillManifestSchema,
  validationRulesSchema,
  type AgentKitCompatibilityRules,
  type AgentKitExportProfile,
  type AgentKitManifest,
  type AgentKitTemplate,
  type ContextPackManifest,
  type RecordFrontmatter,
  type SkillInstructionFrontmatter,
  type SkillManifest
} from "@contextarr/schema";
import { SkillReadError, validateSkill } from "@contextarr/skill-validator";

export type AgentKitValidationSeverity = "error" | "warning" | "info";

export interface AgentKitValidationIssue {
  severity: AgentKitValidationSeverity;
  code: string;
  message: string;
  file?: string;
  path?: string;
}

export interface AgentKitValidationResult {
  agentKitPath: string;
  agentKitId?: string;
  valid: boolean;
  issues: AgentKitValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

export interface AgentKitTemplateValidationResult {
  templatePath: string;
  templateId?: string;
  valid: boolean;
  template?: AgentKitTemplate;
  issues: AgentKitValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

export interface ValidateAgentKitOptions {
  contextPacksDir?: string;
  skillsDir?: string;
  scanText?: boolean;
}

export interface ValidateAgentKitTemplateOptions {
  contextPacksDir?: string;
  skillsDir?: string;
  scanText?: boolean;
}

export class AgentKitReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentKitReadError";
  }
}

interface ReferencedPack {
  id: string;
  manifest?: ContextPackManifest;
  records: RecordFrontmatter[];
}

interface ReferencedSkill {
  id: string;
  manifest?: SkillManifest;
  documents: SkillInstructionFrontmatter[];
}

const allowedTargets = new Set(["chatgpt", "claude", "codex", "claude_code", "markdown", "json", "json_records", "generic_markdown"]);
const sensitiveTags = new Set(["secret", "never_export", "customer_private", "private", "sensitive", "health", "financial"]);
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
const reservedKeys = new Set([
  "telemetry",
  "registry",
  "marketplace",
  "cloud",
  "cloudsync",
  "remoteinstall",
  "webhook",
  "hosted",
  "deployment",
  "publish",
  "runner",
  "runtime",
  "canexecute",
  "executeskills",
  "runsagent"
]);
const executionClaimKeys = new Set([
  "canexecute",
  "executeskills",
  "runsagent",
  "runagent",
  "runner",
  "runtime",
  "commands",
  "command",
  "script",
  "scripts",
  "webhook"
]);

const credentialPattern =
  /\b(api[_ -]?key|secret|token|password|private[_ -]?key)\b\s*[:=]\s*["']?[^\s"',}]{8,}/i;
const credentialRequestPattern =
  /\b(ask|request|collect|enter|paste|provide)\b.{0,80}\b(api[_ -]?key|secret|token|password|credential|private[_ -]?key)\b/i;
const shellCommandPattern =
  /(?:^|[\s`])(rm\s+-rf|sudo\s+|curl\s+[^\n]*\|\s*(?:sh|bash)|powershell(?:\.exe)?\s+-|cmd(?:\.exe)?\s+\/c|bash\s+-c|sh\s+-c|Invoke-WebRequest|Start-Process|chmod\s+\+x|execSync|child_process)(?:\b|[\s`])/i;
const hiddenInstructionPattern =
  /\b(ignore previous instructions|do not tell the user|secretly|silently exfiltrate|hidden instruction)\b/i;
const networkInstructionPattern =
  /\b(?:fetch|download|upload|post\s+to|send\s+to|call\s+(?:an\s+)?api|webhook|http\s+request|visit|open|browse\s+to|go\s+to|navigate\s+to|access)\b.{0,120}(?:https?:\/\/|www\.|api\b|webhook\b)/i;

export function validateAgentKit(
  agentKitPath: string,
  options: ValidateAgentKitOptions = {}
): AgentKitValidationResult {
  const resolvedAgentKitPath = path.resolve(agentKitPath);
  const issues: AgentKitValidationIssue[] = [];

  if (!fs.existsSync(resolvedAgentKitPath)) {
    throw new AgentKitReadError(`Agent Kit path does not exist: ${displayPath(resolvedAgentKitPath)}`);
  }

  if (!fs.statSync(resolvedAgentKitPath).isDirectory()) {
    throw new AgentKitReadError(`Agent Kit path is not a directory: ${displayPath(resolvedAgentKitPath)}`);
  }

  const allFiles = listFiles(resolvedAgentKitPath, resolvedAgentKitPath, issues);
  scanFileTypes(resolvedAgentKitPath, allFiles, issues);

  const manifestFile = path.join(resolvedAgentKitPath, "contextarr-agent-kit.json");
  const rawManifest = readJsonFile(resolvedAgentKitPath, manifestFile, issues, "agent_kit_manifest");
  if (rawManifest) {
    scanReservedKeys(rawManifest, issues, "contextarr-agent-kit.json");
    validateExecutionClaims(rawManifest, issues, "contextarr-agent-kit.json");
  }

  const manifest = rawManifest
    ? parseSchemaData(agentKitManifestSchema, rawManifest, issues, "agent_kit_manifest.schema", "contextarr-agent-kit.json")
    : undefined;

  if (!manifest) {
    if (rawManifest) {
      validateRawManifestSafety(rawManifest, issues);
    }

    if (!fs.existsSync(manifestFile)) {
      addIssue(issues, "error", "agent_kit_manifest.missing", "Missing contextarr-agent-kit.json.", "contextarr-agent-kit.json");
    }

    scanTextFiles(resolvedAgentKitPath, allFiles, issues, options.scanText ?? true);
    return finish(resolvedAgentKitPath, undefined, issues);
  }

  validateManifestSafety(manifest, issues);
  validateUniqueReferences(manifest, issues);

  const packs = validateContextPackReferences(resolvedAgentKitPath, manifest, options, issues);
  const skills = validateSkillReferences(resolvedAgentKitPath, manifest, options, issues);
  const profiles = validateExportProfiles(resolvedAgentKitPath, manifest, issues);
  const compatibility = validateRules(resolvedAgentKitPath, manifest, profiles, issues);
  validateCompatibility(manifest, profiles, compatibility, packs, skills, issues);
  validateProfilePolicy(manifest, profiles, compatibility, packs, skills, issues);
  scanTextFiles(resolvedAgentKitPath, allFiles, issues, options.scanText ?? true);

  return finish(resolvedAgentKitPath, manifest.id, issues);
}

export function validateAgentKitTemplate(
  templatePath: string,
  options: ValidateAgentKitTemplateOptions = {}
): AgentKitTemplateValidationResult {
  const resolvedTemplatePath = path.resolve(templatePath);
  const issues: AgentKitValidationIssue[] = [];

  if (!fs.existsSync(resolvedTemplatePath)) {
    throw new AgentKitReadError(`Agent Kit template path does not exist: ${displayPath(resolvedTemplatePath)}`);
  }

  const stat = fs.statSync(resolvedTemplatePath);
  const templateRoot = stat.isDirectory() ? resolvedTemplatePath : path.dirname(resolvedTemplatePath);
  const templateFile = stat.isDirectory()
    ? path.join(resolvedTemplatePath, "contextarr-agent-kit-template.json")
    : resolvedTemplatePath;

  if (!stat.isDirectory() && path.basename(templateFile) !== "contextarr-agent-kit-template.json") {
    addIssue(
      issues,
      "error",
      "agent_kit_template.invalid_file",
      "Agent Kit templates must use contextarr-agent-kit-template.json.",
      path.basename(templateFile)
    );
  }

  const allFiles = stat.isDirectory() ? listFiles(templateRoot, templateRoot, issues) : [templateFile];
  scanFileTypes(templateRoot, allFiles, issues);

  const rawTemplate = readJsonFile(templateRoot, templateFile, issues, "agent_kit_template");
  if (rawTemplate) {
    scanReservedKeys(rawTemplate, issues, "contextarr-agent-kit-template.json");
    validateExecutionClaims(rawTemplate, issues, "contextarr-agent-kit-template.json");
  }

  const template = rawTemplate
    ? parseSchemaData(agentKitTemplateSchema, rawTemplate, issues, "agent_kit_template.schema", "contextarr-agent-kit-template.json")
    : undefined;

  if (!template) {
    if (!fs.existsSync(templateFile)) {
      addIssue(
        issues,
        "error",
        "agent_kit_template.missing",
        "Missing contextarr-agent-kit-template.json.",
        "contextarr-agent-kit-template.json"
      );
    }
    scanTextFiles(templateRoot, allFiles, issues, options.scanText ?? true);
    return finishTemplate(templateRoot, undefined, undefined, issues);
  }

  validateTemplateSafety(template, issues);
  validateTemplateReferences(templateRoot, template, options, issues);
  scanTextFiles(templateRoot, allFiles, issues, options.scanText ?? true);

  return finishTemplate(templateRoot, template.id, template, issues);
}

export function formatAgentKitValidationResult(result: AgentKitValidationResult): string {
  const lines: string[] = [];
  const status = result.valid ? "Agent Kit validation passed" : "Agent Kit validation failed";

  lines.push(`${status}: ${result.agentKitId ?? result.agentKitPath}`);
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

export function formatAgentKitTemplateValidationResult(result: AgentKitTemplateValidationResult): string {
  const lines: string[] = [];
  const status = result.valid ? "Agent Kit template validation passed" : "Agent Kit template validation failed";

  lines.push(`${status}: ${result.templateId ?? result.templatePath}`);
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

function validateTemplateSafety(template: AgentKitTemplate, issues: AgentKitValidationIssue[]): void {
  if (template.containsPersonalData !== false) {
    addIssue(
      issues,
      "error",
      "agent_kit_template.personal_data",
      "Agent Kit templates must not contain personal data.",
      "contextarr-agent-kit-template.json",
      "containsPersonalData"
    );
  }

  if (template.containsExecutableCode !== false || template.requiresNetwork !== false) {
    addIssue(
      issues,
      "error",
      "agent_kit_template.unsafe_capability",
      "Agent Kit templates must be non-executable and must not require network access.",
      "contextarr-agent-kit-template.json"
    );
  }

  const requiredExcludeTags = ["secret", "never_export", "imported_draft"];
  const missingExcludeTags = requiredExcludeTags.filter((tag) => !template.suggestedAgentKit.excludeTags.includes(tag));
  if (missingExcludeTags.length > 0) {
    addIssue(
      issues,
      "error",
      "agent_kit_template.exclude_tags_missing",
      `Agent Kit templates must exclude ${missingExcludeTags.join(", ")} by default.`,
      "contextarr-agent-kit-template.json",
      "suggestedAgentKit.excludeTags"
    );
  }
}

function validateTemplateReferences(
  templateRoot: string,
  template: AgentKitTemplate,
  options: ValidateAgentKitTemplateOptions,
  issues: AgentKitValidationIssue[]
): void {
  addDuplicateTemplateReferenceIssues(template.suggestedAgentKit.contextPacks, "contextPacks", issues);
  addDuplicateTemplateReferenceIssues(template.suggestedAgentKit.skills, "skills", issues);

  for (const packId of template.suggestedAgentKit.contextPacks) {
    const packPath = findReferencePath(templateRoot, packId, options.contextPacksDir, ["demo-packs"], "contextarr-pack.json");
    if (!packPath) {
      addIssue(
        issues,
        "error",
        "agent_kit_template.context_pack_missing",
        `Referenced Context Pack "${packId}" was not found.`,
        "contextarr-agent-kit-template.json",
        "suggestedAgentKit.contextPacks"
      );
      continue;
    }

    try {
      const result = validatePack(packPath, { scanText: false });
      if (!result.valid) {
        addIssue(
          issues,
          "error",
          "agent_kit_template.context_pack_invalid",
          `Referenced Context Pack "${packId}" has ${result.summary.errors} validation error(s).`,
          "contextarr-agent-kit-template.json",
          "suggestedAgentKit.contextPacks"
        );
      }
    } catch (error) {
      addIssue(
        issues,
        "error",
        "agent_kit_template.context_pack_read_failed",
        errorMessage(error),
        "contextarr-agent-kit-template.json",
        "suggestedAgentKit.contextPacks"
      );
    }
  }

  for (const skillId of template.suggestedAgentKit.skills) {
    const skillPath = findReferencePath(templateRoot, skillId, options.skillsDir, ["demo-skills"], "contextarr-skill.json");
    if (!skillPath) {
      addIssue(
        issues,
        "error",
        "agent_kit_template.skill_missing",
        `Referenced Skill "${skillId}" was not found.`,
        "contextarr-agent-kit-template.json",
        "suggestedAgentKit.skills"
      );
      continue;
    }

    try {
      const result = validateSkill(skillPath, { scanText: false });
      if (!result.valid) {
        addIssue(
          issues,
          "error",
          "agent_kit_template.skill_invalid",
          `Referenced Skill "${skillId}" has ${result.summary.errors} validation error(s).`,
          "contextarr-agent-kit-template.json",
          "suggestedAgentKit.skills"
        );
      }
    } catch (error) {
      addIssue(
        issues,
        "error",
        "agent_kit_template.skill_read_failed",
        errorMessage(error),
        "contextarr-agent-kit-template.json",
        "suggestedAgentKit.skills"
      );
    }
  }
}

function validateRawManifestSafety(rawManifest: unknown, issues: AgentKitValidationIssue[]): void {
  if (!rawManifest || typeof rawManifest !== "object" || Array.isArray(rawManifest)) {
    return;
  }

  const manifest = rawManifest as Record<string, unknown>;
  if (manifest.containsExecutableCode !== false) {
    addIssue(
      issues,
      "error",
      "agent_kit_manifest.executable_code",
      "containsExecutableCode must be false for Agent Kits.",
      "contextarr-agent-kit.json",
      "containsExecutableCode"
    );
  }

  if (manifest.requiresNetwork !== false) {
    addIssue(
      issues,
      "error",
      "agent_kit_manifest.requires_network",
      "requiresNetwork must be false for Agent Kits.",
      "contextarr-agent-kit.json",
      "requiresNetwork"
    );
  }

  const permissions = manifest.permissions;
  if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
    return;
  }

  for (const permission of ["writeDrafts", "runCommands", "networkAccess", "browserAutomation", "toolExecution"]) {
    if ((permissions as Record<string, unknown>)[permission] !== false) {
      addIssue(
        issues,
        "error",
        `agent_kit_manifest.${toSnakeCase(permission)}`,
        `permissions.${permission} must be false.`,
        "contextarr-agent-kit.json",
        `permissions.${permission}`
      );
    }
  }
}

function validateManifestSafety(manifest: AgentKitManifest, issues: AgentKitValidationIssue[]): void {
  if (manifest.containsExecutableCode !== false) {
    addIssue(
      issues,
      "error",
      "agent_kit_manifest.executable_code",
      "containsExecutableCode must be false for Agent Kits.",
      "contextarr-agent-kit.json",
      "containsExecutableCode"
    );
  }

  if (manifest.requiresNetwork !== false) {
    addIssue(
      issues,
      "error",
      "agent_kit_manifest.requires_network",
      "requiresNetwork must be false for Agent Kits.",
      "contextarr-agent-kit.json",
      "requiresNetwork"
    );
  }

  const permissionChecks = [
    ["writeDrafts", manifest.permissions.writeDrafts],
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
        `agent_kit_manifest.${toSnakeCase(permission)}`,
        `permissions.${permission} must be false.`,
        "contextarr-agent-kit.json",
        `permissions.${permission}`
      );
    }
  }

  if (!allowedTargets.has(manifest.target)) {
    addIssue(
      issues,
      "error",
      "agent_kit_manifest.unsupported_target",
      `Agent Kit target "${manifest.target}" is not supported.`,
      "contextarr-agent-kit.json",
      "target"
    );
  }
}

function validateUniqueReferences(manifest: AgentKitManifest, issues: AgentKitValidationIssue[]): void {
  addDuplicateReferenceIssues(manifest.contextPacks, "contextPacks", issues);
  addDuplicateReferenceIssues(manifest.skills, "skills", issues);
}

function validateContextPackReferences(
  agentKitPath: string,
  manifest: AgentKitManifest,
  options: ValidateAgentKitOptions,
  issues: AgentKitValidationIssue[]
): ReferencedPack[] {
  const packs: ReferencedPack[] = [];

  for (const packId of manifest.contextPacks) {
    const packPath = findReferencePath(agentKitPath, packId, options.contextPacksDir, ["demo-packs", "context-packs"], "contextarr-pack.json");
    if (!packPath) {
      addIssue(
        issues,
        "error",
        "agent_kit.context_pack_missing",
        `Referenced Context Pack "${packId}" was not found.`,
        "contextarr-agent-kit.json",
        "contextPacks"
      );
      continue;
    }

    try {
      const validation = validatePack(packPath);
      if (!validation.valid) {
        addIssue(
          issues,
          "error",
          "agent_kit.context_pack_invalid",
          `Referenced Context Pack "${packId}" is invalid: ${validation.summary.errors} error(s).`,
          "contextarr-agent-kit.json",
          "contextPacks"
        );
      }
    } catch (error) {
      addIssue(
        issues,
        "error",
        "agent_kit.context_pack_unreadable",
        error instanceof PackReadError ? error.message : errorMessage(error),
        "contextarr-agent-kit.json",
        "contextPacks"
      );
    }

    packs.push({
      id: packId,
      manifest: readContextPackManifest(packPath),
      records: readContextPackRecords(packPath)
    });

    const packManifest = packs[packs.length - 1]?.manifest;
    if (packManifest?.permissions.writeDrafts !== false) {
      addIssue(
        issues,
        "error",
        "agent_kit.context_pack_write_drafts",
        `Referenced Context Pack "${packId}" must not declare writeDrafts permission for Agent Kit activation.`,
        "contextarr-agent-kit.json",
        "contextPacks"
      );
    }
  }

  return packs;
}

function validateSkillReferences(
  agentKitPath: string,
  manifest: AgentKitManifest,
  options: ValidateAgentKitOptions,
  issues: AgentKitValidationIssue[]
): ReferencedSkill[] {
  const skills: ReferencedSkill[] = [];

  for (const skillId of manifest.skills) {
    const skillPath = findReferencePath(agentKitPath, skillId, options.skillsDir, ["demo-skills", "skills"], "contextarr-skill.json");
    if (!skillPath) {
      addIssue(
        issues,
        "error",
        "agent_kit.skill_missing",
        `Referenced Skill "${skillId}" was not found.`,
        "contextarr-agent-kit.json",
        "skills"
      );
      continue;
    }

    try {
      const validation = validateSkill(skillPath);
      if (!validation.valid) {
        addIssue(
          issues,
          "error",
          "agent_kit.skill_invalid",
          `Referenced Skill "${skillId}" is invalid: ${validation.summary.errors} error(s).`,
          "contextarr-agent-kit.json",
          "skills"
        );
      }
    } catch (error) {
      addIssue(
        issues,
        "error",
        "agent_kit.skill_unreadable",
        error instanceof SkillReadError ? error.message : errorMessage(error),
        "contextarr-agent-kit.json",
        "skills"
      );
    }

    const skillManifest = readSkillManifest(skillPath);
    if (skillManifest?.permissions.writeDrafts !== false) {
      addIssue(
        issues,
        "error",
        "agent_kit.skill_write_drafts",
        `Referenced Skill "${skillId}" must not declare writeDrafts permission for Agent Kit activation.`,
        "contextarr-agent-kit.json",
        "skills"
      );
    }

    if (skillManifest?.targets.length && !skillManifest.targets.includes(manifest.target)) {
      addIssue(
        issues,
        "warning",
        "agent_kit.skill_target_missing",
        `Skill "${skillId}" does not declare target "${manifest.target}".`,
        "contextarr-agent-kit.json",
        "target"
      );
    }

    skills.push({
      id: skillId,
      manifest: skillManifest,
      documents: readSkillDocuments(skillPath)
    });
  }

  return skills;
}

function validateExportProfiles(
  agentKitPath: string,
  manifest: AgentKitManifest,
  issues: AgentKitValidationIssue[]
): AgentKitExportProfile[] {
  const exportsDir = resolveManifestPath(agentKitPath, manifest.exportsPath, "exportsPath", issues);
  if (!exportsDir) {
    return [];
  }

  if (!fs.existsSync(exportsDir) || !fs.statSync(exportsDir).isDirectory()) {
    addIssue(
      issues,
      "error",
      "agent_kit_exports.missing_directory",
      `Export profiles folder does not exist: ${manifest.exportsPath}.`,
      manifest.exportsPath
    );
    return [];
  }

  const profiles: AgentKitExportProfile[] = [];
  const exportFiles = listFiles(agentKitPath, exportsDir, issues).filter(isYamlFile);
  if (exportFiles.length === 0) {
    addIssue(issues, "error", "agent_kit_exports.empty", "Export profiles folder must contain YAML profiles.", manifest.exportsPath);
  }

  for (const file of exportFiles) {
    const rawProfile = readYamlFile(agentKitPath, file, issues, "agent_kit_export_profile");
    if (rawProfile) {
      scanReservedKeys(rawProfile, issues, relativePath(agentKitPath, file));
      validateExecutionClaims(rawProfile, issues, relativePath(agentKitPath, file));
    }

    const profile = rawProfile
      ? parseSchemaData(agentKitExportProfileSchema, rawProfile, issues, "agent_kit_export_profile.schema", relativePath(agentKitPath, file))
      : undefined;

    if (!profile) {
      continue;
    }

    if (!allowedTargets.has(profile.target)) {
      addIssue(
        issues,
        "error",
        "agent_kit_export_profile.unsupported_target",
        `Export profile "${profile.id}" target "${profile.target}" is not supported.`,
        relativePath(agentKitPath, file),
        "target"
      );
    }

    if (profile.id === manifest.exportProfile && profile.target !== manifest.target) {
      addIssue(
        issues,
        "error",
        "agent_kit_export_profile.target_mismatch",
        `Selected export profile "${profile.id}" target "${profile.target}" does not match Agent Kit target "${manifest.target}".`,
        relativePath(agentKitPath, file),
        "target"
      );
    }

    for (const packId of profile.include?.context_packs ?? []) {
      if (!manifest.contextPacks.includes(packId)) {
        addIssue(
          issues,
          "error",
          "agent_kit_export_profile.context_pack_missing",
          `Export profile "${profile.id}" references Context Pack "${packId}" not declared by the Agent Kit.`,
          relativePath(agentKitPath, file),
          "include.context_packs"
        );
      }
    }

    for (const skillId of profile.include?.skills ?? []) {
      if (!manifest.skills.includes(skillId)) {
        addIssue(
          issues,
          "error",
          "agent_kit_export_profile.skill_missing",
          `Export profile "${profile.id}" references Skill "${skillId}" not declared by the Agent Kit.`,
          relativePath(agentKitPath, file),
          "include.skills"
        );
      }
    }

    profiles.push(profile);
  }

  if (!profiles.some((profile) => profile.id === manifest.exportProfile)) {
    addIssue(
      issues,
      "error",
      "agent_kit_export_profile.missing_selected",
      `Selected export profile "${manifest.exportProfile}" was not found.`,
      "contextarr-agent-kit.json",
      "exportProfile"
    );
  }

  return profiles;
}

function validateRules(
  agentKitPath: string,
  manifest: AgentKitManifest,
  profiles: AgentKitExportProfile[],
  issues: AgentKitValidationIssue[]
): AgentKitCompatibilityRules | undefined {
  const rulesDir = resolveManifestPath(agentKitPath, manifest.rulesPath, "rulesPath", issues);
  if (!rulesDir) {
    return undefined;
  }

  if (!fs.existsSync(rulesDir) || !fs.statSync(rulesDir).isDirectory()) {
    addIssue(
      issues,
      "error",
      "agent_kit_rules.missing_directory",
      `Rules folder does not exist: ${manifest.rulesPath}.`,
      manifest.rulesPath
    );
    return undefined;
  }

  const compatibilityFile = path.join(rulesDir, "compatibility.yaml");
  const rawCompatibility = readYamlFile(agentKitPath, compatibilityFile, issues, "agent_kit_rules.compatibility");
  if (!fs.existsSync(compatibilityFile)) {
    addIssue(
      issues,
      "error",
      "agent_kit_rules.compatibility_missing",
      "Agent Kit compatibility rules are required.",
      `${manifest.rulesPath}/compatibility.yaml`
    );
  }
  if (rawCompatibility) {
    scanReservedKeys(rawCompatibility, issues, relativePath(agentKitPath, compatibilityFile));
    validateExecutionClaims(rawCompatibility, issues, relativePath(agentKitPath, compatibilityFile));
  }
  const compatibility = rawCompatibility
    ? parseSchemaData(
        agentKitCompatibilityRulesSchema,
        rawCompatibility,
        issues,
        "agent_kit_rules.compatibility_schema",
        relativePath(agentKitPath, compatibilityFile)
      )
    : undefined;

  const validationFile = path.join(rulesDir, "validation.yaml");
  if (fs.existsSync(validationFile)) {
    readYamlSchemaFile(agentKitPath, validationFile, validationRulesSchema, issues, "agent_kit_rules.validation");
  }

  const needsRedaction = [manifest.privacyMode, ...profiles.map((profile) => profile.privacy_mode)].some(
    (privacyMode) => privacyMode === "redacted" || privacyMode === "public_safe"
  );
  const redactionFile = path.join(rulesDir, "redaction.yaml");
  if (needsRedaction && !fs.existsSync(redactionFile)) {
    addIssue(
      issues,
      "error",
      "agent_kit_rules.redaction_missing",
      "Redaction rules are required for redacted and public_safe Agent Kit profiles.",
      `${manifest.rulesPath}/redaction.yaml`
    );
  }
  if (fs.existsSync(redactionFile)) {
    readYamlSchemaFile(agentKitPath, redactionFile, redactionRulesSchema, issues, "agent_kit_rules.redaction");
  }

  return compatibility;
}

function validateCompatibility(
  manifest: AgentKitManifest,
  profiles: AgentKitExportProfile[],
  compatibility: AgentKitCompatibilityRules | undefined,
  packs: ReferencedPack[],
  skills: ReferencedSkill[],
  issues: AgentKitValidationIssue[]
): void {
  if (!compatibility) {
    return;
  }

  for (const target of getProfileTargets(manifest, profiles)) {
    if (compatibility.supported_targets.length > 0 && !compatibility.supported_targets.includes(target)) {
      addIssue(
        issues,
        "error",
        "agent_kit_compatibility.target_blocked",
        `Compatibility rules do not allow target "${target}".`,
        `${manifest.rulesPath}/compatibility.yaml`,
        "supported_targets"
      );
    }
  }

  for (const profile of getProfileSelections(manifest, profiles)) {
    for (const packId of compatibility.required_context_packs) {
      if (!profile.packIds.includes(packId)) {
        addIssue(
          issues,
          "error",
          "agent_kit_compatibility.context_pack_required",
          `Required Context Pack "${packId}" is not included by profile "${profile.id}".`,
          `${manifest.rulesPath}/compatibility.yaml`,
          "required_context_packs"
        );
      }
    }

    for (const skillId of compatibility.required_skills) {
      if (!profile.skillIds.includes(skillId)) {
        addIssue(
          issues,
          "error",
          "agent_kit_compatibility.skill_required",
          `Required Skill "${skillId}" is not included by profile "${profile.id}".`,
          `${manifest.rulesPath}/compatibility.yaml`,
          "required_skills"
        );
      }
    }
  }

  for (const pack of packs) {
    if (pack.manifest && compatibility.blocked_trust_levels.includes(pack.manifest.trustLevel)) {
      addIssue(
        issues,
        "error",
        "agent_kit_compatibility.context_pack_trust_blocked",
        `Context Pack "${pack.id}" uses blocked trust level "${pack.manifest.trustLevel}".`,
        `${manifest.rulesPath}/compatibility.yaml`,
        "blocked_trust_levels"
      );
    }
  }

  for (const skill of skills) {
    if (skill.manifest && compatibility.blocked_trust_levels.includes(skill.manifest.trustLevel)) {
      addIssue(
        issues,
        "error",
        "agent_kit_compatibility.skill_trust_blocked",
        `Skill "${skill.id}" uses blocked trust level "${skill.manifest.trustLevel}".`,
        `${manifest.rulesPath}/compatibility.yaml`,
        "blocked_trust_levels"
      );
    }
  }

  for (const pairing of compatibility.pairings) {
    for (const profile of getProfileSelections(manifest, profiles)) {
      const targetMatches = !pairing.target || pairing.target === profile.target;
      const packMatches = !pairing.context_pack || profile.packIds.includes(pairing.context_pack);
      const skillMatches = !pairing.skill || profile.skillIds.includes(pairing.skill);
      if (pairing.status === "blocked" && targetMatches && packMatches && skillMatches) {
        addIssue(
          issues,
          "error",
          "agent_kit_compatibility.pairing_blocked",
          `Compatibility rules block one of the selected Agent Kit pairings for profile "${profile.id}".`,
          `${manifest.rulesPath}/compatibility.yaml`,
          "pairings"
        );
      }
    }
  }
}

function validateProfilePolicy(
  manifest: AgentKitManifest,
  profiles: AgentKitExportProfile[],
  compatibility: AgentKitCompatibilityRules | undefined,
  packs: ReferencedPack[],
  skills: ReferencedSkill[],
  issues: AgentKitValidationIssue[]
): void {
  for (const profile of profiles) {
    const selectedPackIds = profile.include?.context_packs ?? manifest.contextPacks;
    const selectedSkillIds = profile.include?.skills ?? manifest.skills;
    const selectedRecords = packs.filter((pack) => selectedPackIds.includes(pack.id)).flatMap((pack) => pack.records);
    const selectedSkills = skills.filter((skill) => selectedSkillIds.includes(skill.id));
    const selectedDocuments = selectedSkills.flatMap((skill) => skill.documents);
    const privacyMode = profile.privacy_mode ?? manifest.privacyMode;
    const excludedTags = new Set(profile.exclude_tags);
    const sensitiveObjects = [...selectedRecords, ...selectedDocuments].filter(isSensitiveObject);

    for (const skill of selectedSkills) {
      if (skill.manifest?.targets.length && !skill.manifest.targets.includes(profile.target)) {
        addIssue(
          issues,
          "warning",
          "agent_kit.skill_target_missing",
          `Skill "${skill.id}" does not declare target "${profile.target}" used by profile "${profile.id}".`,
          "contextarr-agent-kit.json",
          "target"
        );
      }
    }

    if (privacyMode === "public_safe" && sensitiveObjects.length > 0) {
      addIssue(
        issues,
        "error",
        "agent_kit_policy.sensitive_public_safe",
        `Public-safe Agent Kit profile "${profile.id}" must not include private, sensitive, secret, or restricted-tag content.`,
        "contextarr-agent-kit.json",
        "privacyMode"
      );
    }

    if (privacyMode === "full" && sensitiveObjects.length > 0) {
      addIssue(
        issues,
        "warning",
        "agent_kit_policy.sensitive_without_redaction",
        `Selected content for profile "${profile.id}" includes sensitive/private material while the profile uses full privacy mode.`,
        "contextarr-agent-kit.json",
        "privacyMode"
      );
    }

    const hasSecretContent = sensitiveObjects.some(
      (item) => item.privacy === "secret" || item.tags.some((tag) => tag === "secret" || tag === "never_export")
    );
    if (privacyMode === "redacted" && hasSecretContent && (!excludedTags.has("secret") || !excludedTags.has("never_export"))) {
      addIssue(
        issues,
        "warning",
        "agent_kit_policy.secret_exclusion_incomplete",
        `Redacted Agent Kit profile "${profile.id}" should exclude both secret and never_export tags.`,
        "contextarr-agent-kit.json",
        "exportProfile"
      );
    }

    if (!compatibility?.allow_unreviewed_drafts) {
      const unreviewed = [...selectedRecords, ...selectedDocuments].filter((item) => item.review_status !== "approved");
      if (unreviewed.length > 0) {
        addIssue(
          issues,
          "warning",
          "agent_kit_policy.unreviewed_content",
          `Selected content for profile "${profile.id}" includes records or Skill documents that are not approved.`,
          "contextarr-agent-kit.json",
          "exportProfile"
        );
      }
    }
  }
}

function getProfileTargets(manifest: AgentKitManifest, profiles: AgentKitExportProfile[]): string[] {
  return Array.from(new Set([manifest.target, ...profiles.map((profile) => profile.target)]));
}

function getProfileSelections(
  manifest: AgentKitManifest,
  profiles: AgentKitExportProfile[]
): Array<{ id: string; target: string; packIds: string[]; skillIds: string[] }> {
  if (profiles.length === 0) {
    return [{ id: manifest.exportProfile, target: manifest.target, packIds: manifest.contextPacks, skillIds: manifest.skills }];
  }

  return profiles.map((profile) => ({
    id: profile.id,
    target: profile.target,
    packIds: profile.include?.context_packs ?? manifest.contextPacks,
    skillIds: profile.include?.skills ?? manifest.skills
  }));
}

function readContextPackManifest(packPath: string): ContextPackManifest | undefined {
  return readJsonSchemaWithoutIssues(path.join(packPath, "contextarr-pack.json"), contextPackManifestSchema);
}

function readContextPackRecords(packPath: string): RecordFrontmatter[] {
  const manifest = readContextPackManifest(packPath);
  if (!manifest) {
    return [];
  }

  const recordsDir = path.resolve(packPath, manifest.recordsPath);
  if (!fs.existsSync(recordsDir) || !fs.statSync(recordsDir).isDirectory()) {
    return [];
  }

  return listFilesWithoutIssues(recordsDir)
    .filter((file) => file.toLowerCase().endsWith(".md"))
    .flatMap((file) => {
      try {
        const parsed = matter(fs.readFileSync(file, "utf8"));
        const result = recordFrontmatterSchema.safeParse(parsed.data);
        return result.success ? [result.data] : [];
      } catch {
        return [];
      }
    });
}

function readSkillManifest(skillPath: string): SkillManifest | undefined {
  return readJsonSchemaWithoutIssues(path.join(skillPath, "contextarr-skill.json"), skillManifestSchema);
}

function readSkillDocuments(skillPath: string): SkillInstructionFrontmatter[] {
  const manifest = readSkillManifest(skillPath);
  if (!manifest) {
    return [];
  }

  return [manifest.instructionsPath, manifest.examplesPath].flatMap((manifestPath) => {
    const dir = path.resolve(skillPath, manifestPath);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      return [];
    }

    return listFilesWithoutIssues(dir)
      .filter((file) => file.toLowerCase().endsWith(".md"))
      .flatMap((file) => {
        try {
          const parsed = matter(fs.readFileSync(file, "utf8"));
          const result = skillInstructionFrontmatterSchema.safeParse(parsed.data);
          return result.success ? [result.data] : [];
        } catch {
          return [];
        }
      });
  });
}

function readJsonFile(
  agentKitPath: string,
  file: string,
  issues: AgentKitValidationIssue[],
  codePrefix: string
): unknown | undefined {
  if (!fs.existsSync(file)) {
    return undefined;
  }

  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    addIssue(issues, "error", `${codePrefix}.parse_failed`, errorMessage(error), relativePath(agentKitPath, file));
    return undefined;
  }
}

function readYamlFile(
  agentKitPath: string,
  file: string,
  issues: AgentKitValidationIssue[],
  codePrefix: string
): unknown | undefined {
  if (!fs.existsSync(file)) {
    return undefined;
  }

  try {
    return YAML.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    addIssue(issues, "error", `${codePrefix}.parse_failed`, errorMessage(error), relativePath(agentKitPath, file));
    return undefined;
  }
}

function readYamlSchemaFile<TSchema extends z.ZodTypeAny>(
  agentKitPath: string,
  file: string,
  schema: TSchema,
  issues: AgentKitValidationIssue[],
  codePrefix: string
): z.output<TSchema> | undefined {
  const data = readYamlFile(agentKitPath, file, issues, codePrefix);
  return data === undefined
    ? undefined
    : parseSchemaData(schema, data, issues, `${codePrefix}.schema`, relativePath(agentKitPath, file));
}

function readJsonSchemaWithoutIssues<TSchema extends z.ZodTypeAny>(file: string, schema: TSchema): z.output<TSchema> | undefined {
  if (!fs.existsSync(file)) {
    return undefined;
  }

  try {
    const parsed = schema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function parseSchemaData<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown,
  issues: AgentKitValidationIssue[],
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

function scanReservedKeys(data: unknown, issues: AgentKitValidationIssue[], file: string, fieldPath = ""): void {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return;
  }

  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.replace(/[_-]/g, "").toLowerCase();
    const nextPath = fieldPath ? `${fieldPath}.${key}` : key;

    if (reservedKeys.has(normalizedKey)) {
      addIssue(
        issues,
        "error",
        "agent_kit.reserved_capability",
        `Agent Kits must not declare reserved cloud, registry, telemetry, runtime, or hosted capability field "${key}".`,
        file,
        nextPath
      );
    }

    scanReservedKeys(value, issues, file, nextPath);
  }
}

function validateExecutionClaims(data: unknown, issues: AgentKitValidationIssue[], file: string, fieldPath = ""): void {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return;
  }

  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.replace(/[_-]/g, "").toLowerCase();
    const nextPath = fieldPath ? `${fieldPath}.${key}` : key;
    if (executionClaimKeys.has(normalizedKey) && value !== false && value !== null && value !== undefined) {
      addIssue(
        issues,
        "error",
        "agent_kit.execution_claimed",
        `Agent Kits must not claim executable, runtime, command, webhook, or agent-running behavior through "${key}".`,
        file,
        nextPath
      );
    }

    validateExecutionClaims(value, issues, file, nextPath);
  }
}

function scanFileTypes(agentKitPath: string, files: string[], issues: AgentKitValidationIssue[]): void {
  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    const relativeFile = relativePath(agentKitPath, file);

    if (executableExtensions.has(extension)) {
      addIssue(
        issues,
        "error",
        "agent_kit.executable_file",
        `Executable or binary payload file is not allowed: ${relativeFile}.`,
        relativeFile
      );
    }

    if (scriptExtensions.has(extension)) {
      addIssue(issues, "error", "agent_kit.script_file", `Script file is not allowed in Agent Kits: ${relativeFile}.`, relativeFile);
    }
  }
}

function scanTextFiles(
  agentKitPath: string,
  files: string[],
  issues: AgentKitValidationIssue[],
  enabled: boolean
): void {
  if (!enabled) {
    return;
  }

  for (const file of files.filter(isScannableTextFile)) {
    const relativeFile = relativePath(agentKitPath, file);
    let content = "";

    try {
      content = fs.readFileSync(file, "utf8");
    } catch (error) {
      addIssue(issues, "warning", "agent_kit_scan.read_failed", errorMessage(error), relativeFile);
      continue;
    }

    if (credentialPattern.test(content)) {
      addIssue(
        issues,
        "error",
        "agent_kit_scan.credential_pattern",
        "Obvious API key, token, password, or private key pattern found.",
        relativeFile
      );
    }

    if (credentialRequestPattern.test(content)) {
      addIssue(
        issues,
        "error",
        "agent_kit_scan.credential_request",
        "Agent Kits must not request API keys, passwords, tokens, or credentials.",
        relativeFile
      );
    }

    if (shellCommandPattern.test(content)) {
      addIssue(issues, "error", "agent_kit_scan.shell_command", "Obvious shell command pattern found.", relativeFile);
    }

    if (hiddenInstructionPattern.test(content)) {
      addIssue(issues, "error", "agent_kit_scan.hidden_instruction", "Hidden or deceptive instruction pattern found.", relativeFile);
    }

    if (networkInstructionPattern.test(content)) {
      addIssue(
        issues,
        "error",
        "agent_kit_scan.network_instruction",
        "Network-like instruction pattern found; Agent Kits must remain non-executable and must not require network actions.",
        relativeFile
      );
    }
  }
}

function findReferencePath(
  agentKitPath: string,
  id: string,
  explicitRoot: string | undefined,
  rootNames: string[],
  markerFile: string
): string | undefined {
  const candidates: string[] = [];
  if (explicitRoot) {
    candidates.push(path.resolve(explicitRoot, id));
  }

  let current = path.resolve(agentKitPath);
  while (true) {
    for (const rootName of rootNames) {
      candidates.push(path.join(current, rootName, id));
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return candidates.find((candidate) => {
    if (!fs.existsSync(candidate) || !fs.existsSync(path.join(candidate, markerFile))) {
      return false;
    }
    const stat = fs.lstatSync(candidate);
    return stat.isDirectory() && !stat.isSymbolicLink();
  });
}

function resolveManifestPath(
  agentKitPath: string,
  manifestPath: string,
  manifestField: string,
  issues: AgentKitValidationIssue[]
): string | undefined {
  const root = path.resolve(agentKitPath);
  const resolved = path.resolve(root, manifestPath);
  const relative = path.relative(root, resolved);

  if (path.isAbsolute(manifestPath) || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    addIssue(
      issues,
      "error",
      "agent_kit_manifest.path_outside_root",
      `Manifest path ${manifestField} must be relative and stay inside the Agent Kit folder.`,
      "contextarr-agent-kit.json",
      manifestField
    );
    return undefined;
  }

  if (fs.existsSync(resolved)) {
    const realRoot = fs.realpathSync(root);
    const realResolved = fs.realpathSync(resolved);
    const realRelative = path.relative(realRoot, realResolved);
    if (realRelative === ".." || realRelative.startsWith(`..${path.sep}`) || path.isAbsolute(realRelative)) {
      addIssue(
        issues,
        "error",
        "agent_kit_manifest.path_outside_root",
        `Manifest path ${manifestField} must not resolve outside the Agent Kit folder through symlinks or junctions.`,
        "contextarr-agent-kit.json",
        manifestField
      );
      return undefined;
    }
  }

  return resolved;
}

function listFiles(agentKitPath: string, root: string, issues: AgentKitValidationIssue[]): string[] {
  const files: string[] = [];

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      addIssue(issues, "error", "agent_kit_filesystem.read_failed", errorMessage(error), relativePath(agentKitPath, dir));
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) {
        addIssue(
          issues,
          "warning",
          "agent_kit_filesystem.symlink",
          "Symlinks are ignored during validation.",
          relativePath(agentKitPath, fullPath)
        );
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

function listFilesWithoutIssues(root: string): string[] {
  const files: string[] = [];

  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) {
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

function addDuplicateReferenceIssues(
  ids: string[],
  field: "contextPacks" | "skills",
  issues: AgentKitValidationIssue[]
): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      addIssue(
        issues,
        "error",
        `agent_kit_manifest.duplicate_${field}`,
        `Duplicate ${field} reference "${id}".`,
        "contextarr-agent-kit.json",
        field
      );
    }
    seen.add(id);
  }
}

function addDuplicateTemplateReferenceIssues(
  ids: string[],
  field: "contextPacks" | "skills",
  issues: AgentKitValidationIssue[]
): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      addIssue(
        issues,
        "error",
        `agent_kit_template.duplicate_${field}`,
        `Duplicate ${field} reference "${id}".`,
        "contextarr-agent-kit-template.json",
        `suggestedAgentKit.${field}`
      );
    }
    seen.add(id);
  }
}

function isSensitiveObject(item: RecordFrontmatter | SkillInstructionFrontmatter): boolean {
  return item.privacy !== "public_safe" || item.tags.some((tag) => sensitiveTags.has(tag));
}

function isYamlFile(file: string): boolean {
  return [".yaml", ".yml"].includes(path.extname(file).toLowerCase());
}

function isScannableTextFile(file: string): boolean {
  return [".json", ".md", ".yaml", ".yml", ".txt"].includes(path.extname(file).toLowerCase());
}

function finish(
  agentKitPath: string,
  agentKitId: string | undefined,
  issues: AgentKitValidationIssue[]
): AgentKitValidationResult {
  const summary = {
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    infos: issues.filter((issue) => issue.severity === "info").length
  };

  return {
    agentKitPath: displayPath(agentKitPath),
    agentKitId,
    valid: summary.errors === 0,
    issues,
    summary
  };
}

function finishTemplate(
  templatePath: string,
  templateId: string | undefined,
  template: AgentKitTemplate | undefined,
  issues: AgentKitValidationIssue[]
): AgentKitTemplateValidationResult {
  const summary = {
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    infos: issues.filter((issue) => issue.severity === "info").length
  };

  return {
    templatePath: displayPath(templatePath),
    templateId,
    template,
    valid: summary.errors === 0,
    issues,
    summary
  };
}

function addIssue(
  issues: AgentKitValidationIssue[],
  severity: AgentKitValidationSeverity,
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

function displayPath(value: string): string {
  const cwd = path.resolve(process.env.INIT_CWD ?? process.cwd());
  const relative = path.relative(cwd, path.resolve(value));
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return normalizePath(relative);
  }

  return path.basename(value);
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
