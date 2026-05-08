import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { validateAgentKit, type AgentKitValidationResult } from "@contextarr/agent-kit-validator";
import type { AgentKitExportProfile, AgentKitManifest } from "@contextarr/schema";

export type AgentKitComposerTarget = "chatgpt" | "claude" | "codex" | "claude_code" | "markdown" | "json_records";
export type AgentKitComposerFormat = "markdown" | "json" | "text";
export type AgentKitComposerPrivacyMode = "redacted" | "public_safe";

export interface CreateAgentKitDraftRequest {
  id?: string;
  name: string;
  goal?: string;
  description?: string;
  contextPacks: string[];
  skills: string[];
  target: AgentKitComposerTarget;
  format: AgentKitComposerFormat;
  privacyMode?: AgentKitComposerPrivacyMode;
  exportProfile?: string;
  exportProfileName?: string;
  excludeTags?: string[];
  tokenBudget?: number;
}

export interface CreateAgentKitDraftOptions {
  agentKitsDir: string;
  contextPacksDir: string;
  skillsDir: string;
  request: CreateAgentKitDraftRequest;
}

export interface CreatedAgentKitDraft {
  id: string;
  agentKitPath: string;
  validation: AgentKitValidationResult;
}

interface NormalizedCreateAgentKitDraftRequest {
  id: string;
  name: string;
  goal: string;
  description: string;
  contextPacks: string[];
  skills: string[];
  target: AgentKitComposerTarget;
  format: AgentKitComposerFormat;
  privacyMode: AgentKitComposerPrivacyMode;
  exportProfile: string;
  exportProfileName: string;
  excludeTags: string[];
  tokenBudget?: number;
}

export class AgentKitWriteError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
    public readonly validation?: AgentKitValidationResult,
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "AgentKitWriteError";
  }
}

const defaultExcludeTags = ["secret", "never_export", "imported_draft"];
const allowedTargets = new Set(["chatgpt", "claude", "codex", "claude_code", "markdown", "json_records"]);
const allowedFormats = new Set(["markdown", "json", "text"]);

export function createAgentKitDraft(options: CreateAgentKitDraftOptions): CreatedAgentKitDraft {
  const request = normalizeCreateAgentKitRequest(options.request);
  const rootDir = path.resolve(options.agentKitsDir);
  const agentKitPath = resolveChildPath(rootDir, request.id);
  const tempPath = resolveChildPath(rootDir, `.${request.id}.tmp-${process.pid}-${Date.now()}`);

  if (fs.existsSync(agentKitPath)) {
    throw new AgentKitWriteError("agent_kit_exists", `Agent Kit already exists: ${request.id}`, 409, undefined, { id: request.id });
  }

  fs.mkdirSync(rootDir, { recursive: true });
  fs.rmSync(tempPath, { recursive: true, force: true });

  try {
    writeAgentKitFiles(tempPath, request);
    const validation = validateAgentKit(tempPath, {
      contextPacksDir: options.contextPacksDir,
      skillsDir: options.skillsDir
    });

    if (!validation.valid) {
      throw new AgentKitWriteError("agent_kit_validation_failed", "Generated Agent Kit did not pass validation.", 400, validation);
    }

    fs.renameSync(tempPath, agentKitPath);

    return {
      id: request.id,
      agentKitPath,
      validation
    };
  } catch (error) {
    fs.rmSync(tempPath, { recursive: true, force: true });
    if (error instanceof AgentKitWriteError) {
      throw error;
    }

    throw new AgentKitWriteError("agent_kit_write_failed", "Unable to save Agent Kit.", 500);
  }
}

export function normalizeAgentKitId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/[-_.]+$/g, "")
    .replace(/^[^a-z0-9]+/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 96);
}

function normalizeCreateAgentKitRequest(request: CreateAgentKitDraftRequest): NormalizedCreateAgentKitDraftRequest {
  const name = request.name.trim();
  if (!name) {
    throw new AgentKitWriteError("invalid_agent_kit_name", "Agent Kit name is required.");
  }

  const contextPacks = uniqueStrings(request.contextPacks);
  const skills = uniqueStrings(request.skills);
  if (contextPacks.length === 0 || skills.length === 0) {
    throw new AgentKitWriteError("invalid_agent_kit_selection", "Select at least one Context Pack and one Skill.");
  }

  if (!allowedTargets.has(request.target)) {
    throw new AgentKitWriteError("invalid_agent_kit_target", "Agent Kit target is not supported.");
  }

  if (!allowedFormats.has(request.format)) {
    throw new AgentKitWriteError("invalid_agent_kit_format", "Agent Kit format is not supported.");
  }

  const privacyMode = request.privacyMode ?? "redacted";
  if (!["redacted", "public_safe"].includes(privacyMode)) {
    throw new AgentKitWriteError("invalid_agent_kit_privacy", "Agent Kit privacy mode is not supported.");
  }

  if (request.id && /[\\/]|(?:^|[._-])\.\.(?:[._-]|$)/.test(request.id.trim())) {
    throw new AgentKitWriteError("invalid_agent_kit_id", "Agent Kit ID is invalid.");
  }

  const id = normalizeAgentKitId(request.id?.trim() || name);
  if (!id) {
    throw new AgentKitWriteError("invalid_agent_kit_id", "Agent Kit name or ID must include letters or numbers.");
  }

  const exportProfile = normalizeAgentKitId(request.exportProfile?.trim() || `${id}-${request.target}`);
  if (!exportProfile) {
    throw new AgentKitWriteError("invalid_agent_kit_export_profile", "Agent Kit export profile must include letters or numbers.");
  }

  const description = request.description?.trim() || `Local data-only Agent Kit for ${name}.`;
  const goal = request.goal?.trim() || description;

  return {
    id,
    name,
    goal,
    description,
    contextPacks,
    skills,
    target: request.target,
    format: request.format,
    privacyMode,
    exportProfile,
    exportProfileName: request.exportProfileName?.trim() || `${name} ${formatTargetLabel(request.target)} Export`,
    excludeTags: uniqueStrings(request.excludeTags?.length ? request.excludeTags : defaultExcludeTags),
    tokenBudget: Number.isFinite(request.tokenBudget) && request.tokenBudget && request.tokenBudget > 0 ? Math.trunc(request.tokenBudget) : undefined
  };
}

function writeAgentKitFiles(agentKitPath: string, request: NormalizedCreateAgentKitDraftRequest): void {
  const now = new Date().toISOString();
  const manifest: AgentKitManifest = {
    id: request.id,
    name: request.name,
    version: "0.1.0",
    description: request.description,
    type: "composed_agent_kit",
    visibility: "local",
    trustLevel: "local",
    author: "Contextarr Composer",
    license: "MIT",
    createdAt: now,
    updatedAt: now,
    lastReviewedAt: now,
    containsPersonalData: false,
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
    contextPacks: request.contextPacks,
    skills: request.skills,
    target: request.target,
    exportProfile: request.exportProfile,
    privacyMode: request.privacyMode,
    tokenBudget: request.tokenBudget,
    rulesPath: "rules",
    exportsPath: "exports",
    assets: {
      accentColor: "#38bdf8"
    },
    compatibility: {
      contextarr: ">=0.3.0"
    }
  };

  const profile: AgentKitExportProfile = {
    id: request.exportProfile,
    name: request.exportProfileName,
    target: request.target,
    format: request.format,
    privacy_mode: request.privacyMode,
    include: {
      context_packs: request.contextPacks,
      skills: request.skills
    },
    exclude_tags: request.excludeTags,
    token_budget: request.tokenBudget,
    sections: ["kit_summary", "task_goal", "included_skills", "relevant_context", "constraints", "redaction_notice"]
  };

  fs.mkdirSync(path.join(agentKitPath, "exports"), { recursive: true });
  fs.mkdirSync(path.join(agentKitPath, "rules"), { recursive: true });
  fs.writeFileSync(path.join(agentKitPath, "contextarr-agent-kit.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(agentKitPath, "README.md"), renderReadme(request), "utf8");
  fs.writeFileSync(path.join(agentKitPath, "CHANGELOG.md"), `# Changelog\n\n## 0.1.0\n\n- Created by Contextarr Composer.\n`, "utf8");
  fs.writeFileSync(path.join(agentKitPath, "LICENSE"), "MIT\n", "utf8");
  fs.writeFileSync(path.join(agentKitPath, "exports", `${request.target}.yaml`), YAML.stringify(profile), "utf8");
  fs.writeFileSync(path.join(agentKitPath, "rules", "validation.yaml"), YAML.stringify(createValidationRules()), "utf8");
  fs.writeFileSync(path.join(agentKitPath, "rules", "redaction.yaml"), YAML.stringify(createRedactionRules(request.excludeTags)), "utf8");
  fs.writeFileSync(path.join(agentKitPath, "rules", "compatibility.yaml"), YAML.stringify(createCompatibilityRules(request)), "utf8");
}

function renderReadme(request: NormalizedCreateAgentKitDraftRequest): string {
  return `# ${request.name}

${request.description}

## Task Goal

${request.goal}

## Included Context Packs

${request.contextPacks.map((id) => `- ${id}`).join("\n")}

## Included Skills

${request.skills.map((id) => `- ${id}`).join("\n")}

## Safety

This Agent Kit is data-only, local, non-executable, and generated for review before use.
`;
}

function createValidationRules(): Record<string, unknown> {
  return {
    required_fields: {
      record: ["id", "title"]
    },
    checks: ["references_exist", "selected_profile_exists", "redaction_rules_present", "no_execution_claims"]
  };
}

function createRedactionRules(excludeTags: string[]): Record<string, unknown> {
  return {
    redact_tags: excludeTags,
    patterns: [
      {
        name: "placeholder_private_marker",
        regex: "\\bPRIVATE_DEMO_MARKER\\b",
        action: "remove"
      }
    ]
  };
}

function createCompatibilityRules(request: NormalizedCreateAgentKitDraftRequest): Record<string, unknown> {
  return {
    supported_targets: [request.target],
    required_context_packs: request.contextPacks,
    required_skills: request.skills,
    allow_unreviewed_drafts: false,
    blocked_trust_levels: ["blocked", "deprecated"],
    pairings: request.contextPacks.flatMap((contextPack) =>
      request.skills.map((skill) => ({
        context_pack: contextPack,
        skill,
        target: request.target,
        status: "supported"
      }))
    )
  };
}

function resolveChildPath(rootDir: string, childName: string): string {
  const target = path.resolve(rootDir, childName);
  const relative = path.relative(rootDir, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new AgentKitWriteError("agent_kit_path_escape", "Agent Kit path must stay inside the configured directory.");
  }

  return target;
}

function uniqueStrings(values: string[] = []): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function formatTargetLabel(target: string): string {
  return target
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
