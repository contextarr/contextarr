import type {
  AgentKitExportProfile,
  AgentKitManifest,
  ContextPackManifest,
  ExportProfile,
  RecordFrontmatter,
  SkillExportProfile,
  SkillInstructionFrontmatter,
  SkillManifest,
  Source
} from "@contextarr/schema";
import type { ValidationIssue, ValidationResult } from "@contextarr/pack-validator";
import type { AgentKitValidationIssue, AgentKitValidationResult } from "@contextarr/agent-kit-validator";
import type { SkillValidationIssue, SkillValidationResult } from "@contextarr/skill-validator";

export interface ServerConfig {
  host: string;
  port: number;
  packsDir: string;
  draftPacksDir: string;
  skillsDir: string;
  importedSkillsDir: string;
  agentKitsDir: string;
  demoAgentKitsDir?: string;
  agentKitTemplatesDir: string;
  databasePath: string;
  webDistDir?: string;
  apiToken?: string;
  localImportsEnabled: boolean;
}

export interface LoadedRecord {
  file: string;
  metadata: RecordFrontmatter;
  body: string;
}

export interface LoadedPack {
  packPath: string;
  manifest: ContextPackManifest;
  validation: ValidationResult;
  records: LoadedRecord[];
  sources: Source[];
  exportProfiles: ExportProfile[];
}

export interface SkippedPack {
  packPath: string;
  packId?: string;
  issues: ValidationIssue[];
}

export interface LoadPacksResult {
  packs: LoadedPack[];
  skipped: SkippedPack[];
}

export interface LoadedSkillDocument {
  file: string;
  metadata: SkillInstructionFrontmatter;
  body: string;
}

export interface LoadedSkill {
  skillPath: string;
  manifest: SkillManifest;
  validation: SkillValidationResult;
  instructions: LoadedSkillDocument[];
  examples: LoadedSkillDocument[];
  sources: Source[];
  exportProfiles: SkillExportProfile[];
}

export interface SkippedSkill {
  skillPath: string;
  skillId?: string;
  issues: SkillValidationIssue[];
}

export interface LoadSkillsResult {
  skills: LoadedSkill[];
  skipped: SkippedSkill[];
}

export interface LoadedAgentKit {
  agentKitPath: string;
  manifest: AgentKitManifest;
  validation: AgentKitValidationResult;
  exportProfiles: AgentKitExportProfile[];
}

export interface SkippedAgentKit {
  agentKitPath: string;
  agentKitId?: string;
  issues: AgentKitValidationIssue[];
}

export interface LoadAgentKitsResult {
  agentKits: LoadedAgentKit[];
  skipped: SkippedAgentKit[];
}

export interface RebuildIndexResult {
  indexedAt: string;
  packsIndexed: number;
  packsSkipped: number;
  recordsIndexed: number;
  sourcesIndexed: number;
  exportProfilesIndexed: number;
  skillsIndexed: number;
  skillsSkipped: number;
  skillInstructionsIndexed: number;
  skillExamplesIndexed: number;
  skillSourcesIndexed: number;
  skillExportProfilesIndexed: number;
  agentKitsIndexed: number;
  agentKitsSkipped: number;
  agentKitContextPackRefsIndexed: number;
  agentKitSkillRefsIndexed: number;
  agentKitExportProfilesIndexed: number;
  reviewItemsGenerated: number;
  redactionWarningCount: number;
  staleSourceCount: number;
  licenseWarningCount: number;
  licenseMissingCount: number;
  licenseUnknownCount: number;
  licenseRiskCount: number;
  skipped: SkippedPack[];
  skippedSkills: SkippedSkill[];
  skippedAgentKits: SkippedAgentKit[];
}

export type ReviewItemSeverity = "error" | "warning" | "info";
export type ReviewItemStatus = "open" | "ignored" | "accepted" | "reviewed" | "resolved";
export type ReviewObjectType = "pack" | "skill" | "agent_kit";
export type ReviewItemType =
  | "validation"
  | "freshness"
  | "export_safety"
  | "export_readiness"
  | "example_coverage"
  | "safety_rules"
  | "target_compatibility"
  | "disallowed_pattern"
  | "ai_draft"
  | "review_status"
  | "trust"
  | "source_coverage";

export interface ReviewItem {
  id: string;
  fingerprint: string;
  objectType: ReviewObjectType;
  objectId: string;
  type: ReviewItemType;
  severity: ReviewItemSeverity;
  packId: string;
  skillId: string | null;
  agentKitId: string | null;
  recordId: string | null;
  sourceId: string | null;
  message: string;
  suggestedAction: string;
  status: ReviewItemStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface ReviewItemFilters {
  objectType?: ReviewObjectType;
  objectId?: string;
  status?: ReviewItemStatus;
  severity?: ReviewItemSeverity;
  type?: ReviewItemType;
  packId?: string;
  skillId?: string;
  agentKitId?: string;
}

export interface HealthCheck {
  id: ReviewItemType;
  label: string;
  status: "pass" | "warning" | "error";
  count: number;
}

export interface PackHealthDetail {
  packId: string;
  score: number;
  status: string;
  reviewQueueCount: number;
  checks: HealthCheck[];
  items: ReviewItem[];
}

export interface SkillHealthDetail {
  skillId: string;
  score: number;
  status: string;
  reviewQueueCount: number;
  checks: HealthCheck[];
  items: ReviewItem[];
}

export interface AgentKitHealthDetail {
  agentKitId: string;
  score: number;
  status: string;
  reviewQueueCount: number;
  checks: HealthCheck[];
  items: ReviewItem[];
}

export interface PackSummary {
  id: string;
  name: string;
  version: string;
  description: string;
  type: string;
  visibility: string;
  trustLevel: string;
  healthScore: number;
  healthStatus: string;
  validationStatus: string;
  exportReadiness: string;
  validationErrors: number;
  validationWarnings: number;
  redactionWarningCount: number;
  staleSourceCount: number;
  licenseWarningCount: number;
  licenseMissingCount: number;
  licenseUnknownCount: number;
  licenseRiskCount: number;
  recordCount: number;
  sourceCount: number;
  exportProfileCount: number;
  accentColor?: string;
  coverImage: string | null;
  reviewQueueCount: number;
  lastReviewedAt: string | null;
  updatedAt: string;
}

export interface SkillSummary {
  id: string;
  name: string;
  version: string;
  description: string;
  type: string;
  visibility: string;
  trustLevel: string;
  healthScore: number;
  healthStatus: string;
  validationErrors: number;
  validationWarnings: number;
  instructionCount: number;
  exampleCount: number;
  sourceCount: number;
  exportProfileCount: number;
  accentColor?: string;
  coverImage: string | null;
  reviewQueueCount: number;
  lastReviewedAt: string | null;
  updatedAt: string;
  targets: string[];
  inputs: string[];
  outputs: string[];
}

export interface AgentKitSummary {
  id: string;
  name: string;
  version: string;
  description: string;
  type: string;
  visibility: string;
  trustLevel: string;
  healthScore: number;
  healthStatus: string;
  validationErrors: number;
  validationWarnings: number;
  contextPackCount: number;
  skillCount: number;
  exportProfileCount: number;
  accentColor?: string;
  coverImage: string | null;
  reviewQueueCount: number;
  lastReviewedAt: string | null;
  updatedAt: string;
  target: string;
  privacyMode: string;
}
