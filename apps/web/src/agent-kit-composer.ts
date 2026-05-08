import type {
  AgentKitExportFormat,
  AgentKitPrivacyMode,
  CreateAgentKitRequest,
  PackSummary,
  SkillSummary
} from "./types";

export const agentKitTargetOptions = [
  { value: "codex", label: "Codex" },
  { value: "claude", label: "Claude" },
  { value: "chatgpt", label: "ChatGPT" },
  { value: "claude_code", label: "Claude Code" },
  { value: "markdown", label: "Generic Markdown" },
  { value: "json_records", label: "JSON Records" }
] as const;

export const agentKitFormatOptions: Array<{ value: AgentKitExportFormat; label: string }> = [
  { value: "markdown", label: "Markdown" },
  { value: "json", label: "JSON" },
  { value: "text", label: "Plain Text" }
];

export const agentKitRedactionModeOptions: Array<{ value: AgentKitPrivacyMode; label: string }> = [
  { value: "redacted", label: "Redacted" },
  { value: "public_safe", label: "Public Safe" }
];

export const defaultAgentKitExcludeTags = ["secret", "never_export", "imported_draft"];

export interface AgentKitComposerDraft {
  name: string;
  goal: string;
  description: string;
  selectedPackIds: string[];
  selectedSkillIds: string[];
  target: string;
  format: AgentKitExportFormat;
  redactionMode: AgentKitPrivacyMode;
  tokenBudget?: number;
}

export interface AgentKitPackFilters {
  query: string;
  type: string;
  trustLevel: string;
  healthStatus: string;
}

export interface AgentKitSkillFilters extends AgentKitPackFilters {
  target: string;
}

export interface AgentKitComposerNotice {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  objectId?: string;
}

export interface AgentKitComposerValidation {
  isValid: boolean;
  errors: AgentKitComposerNotice[];
  warnings: AgentKitComposerNotice[];
}

export interface AgentKitPreviewMetadata {
  id: string;
  exportProfile: string;
  targetLabel: string;
  formatLabel: string;
  redactionLabel: string;
  contextPackCount: number;
  skillCount: number;
  selectedContextPackNames: string[];
  selectedSkillNames: string[];
  excludeTags: string[];
  tokenBudget?: number;
}

export function filterAgentKitPacks(packs: PackSummary[], filters: AgentKitPackFilters): PackSummary[] {
  const query = normalize(filters.query);

  return packs
    .filter((pack) => (filters.type === "all" ? true : pack.type === filters.type))
    .filter((pack) => (filters.trustLevel === "all" ? true : pack.trustLevel === filters.trustLevel))
    .filter((pack) => (filters.healthStatus === "all" ? true : pack.healthStatus === filters.healthStatus))
    .filter((pack) => {
      if (!query) {
        return true;
      }

      return normalize([pack.name, pack.description, pack.type, pack.trustLevel, pack.healthStatus].join(" ")).includes(query);
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function filterAgentKitSkills(skills: SkillSummary[], filters: AgentKitSkillFilters): SkillSummary[] {
  const query = normalize(filters.query);

  return skills
    .filter((skill) => (filters.type === "all" ? true : skill.type === filters.type))
    .filter((skill) => (filters.trustLevel === "all" ? true : skill.trustLevel === filters.trustLevel))
    .filter((skill) => (filters.healthStatus === "all" ? true : skill.healthStatus === filters.healthStatus))
    .filter((skill) => (filters.target === "all" ? true : skill.targets.includes(filters.target)))
    .filter((skill) => {
      if (!query) {
        return true;
      }

      return normalize(
        [skill.name, skill.description, skill.type, skill.trustLevel, skill.healthStatus, skill.targets.join(" ")].join(" ")
      ).includes(query);
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getAgentKitPackFilterOptions(packs: PackSummary[]): {
  types: string[];
  trustLevels: string[];
  healthStatuses: string[];
} {
  return {
    types: uniqueSorted(packs.map((pack) => pack.type)),
    trustLevels: uniqueSorted(packs.map((pack) => pack.trustLevel)),
    healthStatuses: uniqueSorted(packs.map((pack) => pack.healthStatus))
  };
}

export function getAgentKitSkillFilterOptions(skills: SkillSummary[]): {
  types: string[];
  trustLevels: string[];
  healthStatuses: string[];
  targets: string[];
} {
  return {
    types: uniqueSorted(skills.map((skill) => skill.type)),
    trustLevels: uniqueSorted(skills.map((skill) => skill.trustLevel)),
    healthStatuses: uniqueSorted(skills.map((skill) => skill.healthStatus)),
    targets: uniqueSorted(skills.flatMap((skill) => skill.targets))
  };
}

export function toggleSelectedId(selectedIds: string[], id: string): string[] {
  return selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id];
}

export function parseAgentKitTokenBudget(value: string): number | undefined {
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function validateAgentKitDraft(
  draft: AgentKitComposerDraft,
  packs: PackSummary[],
  skills: SkillSummary[]
): AgentKitComposerValidation {
  const errors: AgentKitComposerNotice[] = [];
  const warnings: AgentKitComposerNotice[] = [];
  const selectedPacks = selectedObjects(packs, draft.selectedPackIds);
  const selectedSkills = selectedObjects(skills, draft.selectedSkillIds);

  if (!draft.name.trim()) {
    errors.push({ severity: "error", code: "name_required", message: "Name is required." });
  } else if (!toAgentKitId(draft.name)) {
    errors.push({
      severity: "error",
      code: "name_slug_invalid",
      message: "Name must include at least one letter or number."
    });
  }

  if (!draft.goal.trim()) {
    errors.push({ severity: "error", code: "goal_required", message: "Goal is required." });
  }

  if (!draft.description.trim()) {
    errors.push({ severity: "error", code: "description_required", message: "Description is required." });
  }

  if (draft.selectedPackIds.length === 0) {
    errors.push({ severity: "error", code: "context_pack_required", message: "Select at least one context pack." });
  }

  if (draft.selectedSkillIds.length === 0) {
    errors.push({ severity: "error", code: "skill_required", message: "Select at least one skill." });
  }

  for (const packId of unknownIds(packs, draft.selectedPackIds)) {
    errors.push({ severity: "error", code: "unknown_context_pack", message: `Unknown context pack: ${packId}.`, objectId: packId });
  }

  for (const skillId of unknownIds(skills, draft.selectedSkillIds)) {
    errors.push({ severity: "error", code: "unknown_skill", message: `Unknown skill: ${skillId}.`, objectId: skillId });
  }

  if (!agentKitTargetOptions.some((option) => option.value === draft.target)) {
    errors.push({ severity: "error", code: "unsupported_target", message: `Unsupported target: ${draft.target}.` });
  }

  if (!agentKitFormatOptions.some((option) => option.value === draft.format)) {
    errors.push({ severity: "error", code: "unsupported_format", message: `Unsupported export format: ${draft.format}.` });
  }

  if (!agentKitRedactionModeOptions.some((option) => option.value === draft.redactionMode)) {
    errors.push({ severity: "error", code: "unsupported_redaction", message: `Unsupported redaction mode: ${draft.redactionMode}.` });
  }

  for (const pack of selectedPacks) {
    if (isBlockedTrust(pack.trustLevel)) {
      errors.push({
        severity: "error",
        code: "blocked_context_pack",
        message: `${pack.name} is blocked by trust level.`,
        objectId: pack.id
      });
    } else if (pack.validationErrors > 0 || pack.healthStatus !== "healthy") {
      warnings.push({
        severity: "warning",
        code: "context_pack_health",
        message: `${pack.name} has ${pack.healthStatus} health or validation issues.`,
        objectId: pack.id
      });
    }
  }

  for (const skill of selectedSkills) {
    if (isBlockedTrust(skill.trustLevel)) {
      errors.push({
        severity: "error",
        code: "blocked_skill",
        message: `${skill.name} is blocked by trust level.`,
        objectId: skill.id
      });
    } else if (skill.validationErrors > 0 || skill.healthStatus !== "healthy") {
      warnings.push({
        severity: "warning",
        code: "skill_health",
        message: `${skill.name} has ${skill.healthStatus} health or validation issues.`,
        objectId: skill.id
      });
    }

    if (skill.targets.length > 0 && !skill.targets.includes(draft.target)) {
      warnings.push({
        severity: "warning",
        code: "target_compatibility",
        message: `${skill.name} does not list ${getAgentKitTargetLabel(draft.target)} as a supported target.`,
        objectId: skill.id
      });
    }
  }

  if (draft.redactionMode === "public_safe" && selectedPacks.some((pack) => pack.visibility !== "public")) {
    warnings.push({
      severity: "warning",
      code: "public_safe_visibility",
      message: "Public-safe mode is selected while one or more context packs are not public."
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function isAgentKitSaveDisabled(
  draft: AgentKitComposerDraft,
  packs: PackSummary[],
  skills: SkillSummary[],
  saving = false
): boolean {
  return saving || !validateAgentKitDraft(draft, packs, skills).isValid;
}

export function buildAgentKitPreviewMetadata(
  draft: AgentKitComposerDraft,
  packs: PackSummary[],
  skills: SkillSummary[]
): AgentKitPreviewMetadata {
  const id = toAgentKitId(draft.name || draft.goal || "agent-kit");

  return {
    id: id || "invalid-agent-kit",
    exportProfile: `${id}-${draft.target}-${draft.format}`,
    targetLabel: getAgentKitTargetLabel(draft.target),
    formatLabel: getAgentKitFormatLabel(draft.format),
    redactionLabel: getAgentKitRedactionLabel(draft.redactionMode),
    contextPackCount: draft.selectedPackIds.length,
    skillCount: draft.selectedSkillIds.length,
    selectedContextPackNames: selectedObjects(packs, draft.selectedPackIds).map((pack) => pack.name),
    selectedSkillNames: selectedObjects(skills, draft.selectedSkillIds).map((skill) => skill.name),
    excludeTags: defaultAgentKitExcludeTags,
    tokenBudget: draft.tokenBudget
  };
}

export function buildAgentKitSaveRequest(
  draft: AgentKitComposerDraft,
  packs: PackSummary[],
  skills: SkillSummary[]
): CreateAgentKitRequest {
  const validation = validateAgentKitDraft(draft, packs, skills);
  if (!validation.isValid) {
    throw new Error(`Cannot build Agent Kit request: ${validation.errors.map((error) => error.message).join(" ")}`);
  }

  const metadata = buildAgentKitPreviewMetadata(draft, packs, skills);

  return {
    id: metadata.id,
    name: draft.name.trim(),
    goal: draft.goal.trim(),
    description: draft.description.trim(),
    contextPacks: [...draft.selectedPackIds],
    skills: [...draft.selectedSkillIds],
    target: draft.target,
    format: draft.format,
    privacyMode: draft.redactionMode,
    exportProfile: metadata.exportProfile,
    exportProfileName: `${draft.name.trim()} ${metadata.targetLabel} Export`,
    excludeTags: [...defaultAgentKitExcludeTags],
    tokenBudget: draft.tokenBudget,
    boundaries: {
      containsExecutableCode: false,
      requiresNetwork: false,
      cloudSync: false,
      telemetry: false,
      marketplacePublish: false,
      permissions: {
        readVault: false,
        writeDrafts: false,
        runCommands: false,
        networkAccess: false,
        browserAutomation: false,
        toolExecution: false
      }
    },
    compatibility: {
      contextarr: ">=0.3.0",
      supportedTargets: [draft.target],
      requiredContextPacks: [...draft.selectedPackIds],
      requiredSkills: [...draft.selectedSkillIds]
    }
  };
}

export function getAgentKitTargetLabel(value: string): string {
  return agentKitTargetOptions.find((option) => option.value === value)?.label ?? value;
}

export function getAgentKitFormatLabel(value: AgentKitExportFormat): string {
  return agentKitFormatOptions.find((option) => option.value === value)?.label ?? value;
}

export function getAgentKitRedactionLabel(value: AgentKitPrivacyMode): string {
  return agentKitRedactionModeOptions.find((option) => option.value === value)?.label ?? value;
}

function toAgentKitId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function selectedObjects<T extends { id: string }>(items: T[], selectedIds: string[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return selectedIds.map((id) => byId.get(id)).filter((item): item is T => Boolean(item));
}

function unknownIds<T extends { id: string }>(items: T[], selectedIds: string[]): string[] {
  const knownIds = new Set(items.map((item) => item.id));
  return selectedIds.filter((id) => !knownIds.has(id));
}

function isBlockedTrust(value: string): boolean {
  return ["blocked", "deprecated", "untrusted", "unsafe"].includes(normalize(value));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}
