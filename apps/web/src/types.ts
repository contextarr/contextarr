export interface HealthResponse {
  status: string;
  authRequired: boolean;
  localImportsEnabled?: boolean;
  lastIndexedAt: string | null;
  counts: {
    packs: number;
    records: number;
    sources: number;
    exportProfiles: number;
    skills: number;
    skillInstructions: number;
    skillExamples: number;
    skillSources: number;
    skillExportProfiles: number;
    agentKits?: number;
    agentKitContextPackRefs?: number;
    agentKitSkillRefs?: number;
    agentKitExportProfiles?: number;
    reviewItems: number;
    openReviewItems: number;
  };
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
  validationStatus?: string;
  exportReadiness?: string;
  validationErrors: number;
  validationWarnings: number;
  redactionWarningCount?: number;
  staleSourceCount?: number;
  licenseWarningCount?: number;
  licenseMissingCount?: number;
  licenseUnknownCount?: number;
  licenseRiskCount?: number;
  recordCount: number;
  sourceCount: number;
  exportProfileCount: number;
  accentColor?: string | null;
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
  accentColor?: string | null;
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
  accentColor?: string | null;
  coverImage: string | null;
  reviewQueueCount: number;
  lastReviewedAt: string | null;
  updatedAt: string;
  target: string;
  privacyMode: string;
}

export interface AgentKitTemplateSummary {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  trustLevel: string;
  accentColor?: string | null;
  suggestedAgentKit: {
    id: string;
    name: string;
    goal: string;
    description: string;
    contextPacks: string[];
    skills: string[];
    target: string;
    format: AgentKitExportFormat;
    privacyMode: AgentKitPrivacyMode;
    excludeTags: string[];
    tokenBudget?: number | null;
  };
  safetyNotes?: string[];
  validation: {
    errors: number;
    warnings: number;
  };
}

export interface AgentKitTemplateCreateRequest {
  id?: string;
  name?: string;
  goal?: string;
  description?: string;
  contextPacks?: string[];
  skills?: string[];
  target?: string;
  format?: AgentKitExportFormat;
  privacyMode?: AgentKitPrivacyMode;
  tokenBudget?: number;
}

export interface AgentKitContextPackSummary {
  id: string;
  name: string;
  description: string;
  type: string;
  visibility: string;
  trustLevel: string;
  healthScore: number;
  healthStatus: string;
  recordCount: number;
  sourceCount: number;
  exportProfileCount: number;
  accentColor?: string | null;
  coverImage: string | null;
  sortOrder?: number;
}

export interface AgentKitSkillSummary {
  id: string;
  name: string;
  description: string;
  type: string;
  visibility: string;
  trustLevel: string;
  healthScore: number;
  healthStatus: string;
  instructionCount: number;
  exampleCount: number;
  sourceCount: number;
  exportProfileCount: number;
  targets: string[];
  sortOrder?: number;
}

export interface SourceSummary {
  id: string;
  type: string;
  title: string;
  url?: string | null;
  path?: string | null;
  retrievedAt?: string | null;
  license?: string | null;
  licenseStatus?: string | null;
  licenseUrl?: string | null;
  licenseNotes?: string | null;
  contentHashAlgorithm?: string | null;
  contentHash?: string | null;
  hashCalculatedAt?: string | null;
  lastCheckedAt?: string | null;
  staleAfterDays?: number | null;
  staleReason?: string | null;
  trust?: string | null;
  status?: string | null;
}

export interface ExportProfileSummary {
  id: string;
  name: string;
  target: string;
  format: string;
  privacyMode?: string | null;
  tokenBudget?: number | null;
}

export type AgentKitExportFormat = "markdown" | "json" | "text";
export type AgentKitPrivacyMode = "redacted" | "public_safe";

export interface AgentKitDetail extends AgentKitSummary {
  author: string;
  license: string;
  createdAt: string;
  tokenBudget?: number | null;
  manifest: Record<string, unknown>;
  counts: {
    contextPacks: number;
    skills: number;
    exportProfiles: number;
  };
  validation: {
    status?: string;
    errors: number;
    warnings: number;
    redactionWarningCount?: number;
    staleSourceCount?: number;
    licenseWarningCount?: number;
    licenseMissingCount?: number;
    licenseUnknownCount?: number;
    licenseRiskCount?: number;
  };
  exportReadiness?: {
    status: string;
    profilesReady: number;
    profilesWithWarnings: number;
    profilesBlocked: number;
    profiles: Array<ExportProfileSummary & {
      status: string;
      warningIssueCodes: string[];
      blockingIssueCodes: string[];
    }>;
  };
  health: {
    score: number;
    status: string;
  };
  contextPacks: AgentKitContextPackSummary[];
  skills: AgentKitSkillSummary[];
  exportProfiles: ExportProfileSummary[];
}

export interface AgentKitExportPreview {
  agentKitId: string;
  packId?: string;
  packName?: string;
  profileId: string;
  profileName?: string;
  target: string;
  format: string;
  privacyMode?: string | null;
  tokenBudget?: number | null;
  filename: string;
  mimeType?: string;
  content: string;
  contentStatus: string;
  includedRecords?: ExportRecordSummary[];
  excludedRecords?: ExcludedExportRecord[];
  sources?: ExportSourceSummary[];
  includedContextPacks: AgentKitContextPackSummary[];
  includedSkills: AgentKitSkillSummary[];
  warnings: ExportWarning[];
  generatedAt?: string;
  byteLength?: number;
  estimatedTokens?: number;
}

export interface CreateAgentKitRequest {
  id?: string;
  name: string;
  goal: string;
  description: string;
  contextPacks: string[];
  skills: string[];
  target: string;
  format: AgentKitExportFormat;
  privacyMode: AgentKitPrivacyMode;
  exportProfile: string;
  exportProfileName: string;
  excludeTags: string[];
  tokenBudget?: number;
  boundaries: {
    containsExecutableCode: false;
    requiresNetwork: false;
    cloudSync: false;
    telemetry: false;
    marketplacePublish: false;
    permissions: {
      readVault: false;
      writeDrafts: false;
      runCommands: false;
      networkAccess: false;
      browserAutomation: false;
      toolExecution: false;
    };
  };
  compatibility: {
    contextarr: string;
    supportedTargets: string[];
    requiredContextPacks: string[];
    requiredSkills: string[];
  };
}

export interface SaveAgentKitResponse {
  id?: string;
  agentKit?: AgentKitSummary;
  message?: string;
  detailUrl?: string;
  libraryUrl?: string;
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

export interface ExportWarning {
  code: string;
  message: string;
  recordId?: string;
  pattern?: string;
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

export interface ComposeSelection {
  packId: string;
  recordIds: string[];
}

export interface ComposePreviewRequest {
  title?: string;
  target: "chatgpt" | "claude" | "codex" | "markdown" | "json_records";
  format: "markdown" | "json";
  privacyMode?: "redacted" | "public_safe";
  selections: ComposeSelection[];
  excludeTags?: string[];
  tokenBudget?: number;
}

export interface ComposeSavePackRequest extends ComposePreviewRequest {
  packId?: string;
  name?: string;
  description?: string;
}

export interface ComposeSavePackResponse {
  ok: boolean;
  id: string;
  name: string;
  counts: {
    records: number;
    sources: number;
  };
  validation: {
    valid: boolean;
    errors: number;
    warnings: number;
    infos?: number;
  };
  draft: {
    status: string;
    indexed: boolean;
  };
}

export interface PackDetail extends PackSummary {
  author: string;
  license: string;
  createdAt: string;
  packPath: string;
  manifest: Record<string, unknown>;
  counts: {
    records: number;
    sources: number;
    exportProfiles: number;
  };
  validation: {
    errors: number;
    warnings: number;
  };
  health?: {
    score: number;
    status: string;
    validationErrors: number;
    validationWarnings: number;
    recordCount: number;
    sourceCount: number;
    exportProfileCount: number;
    updatedAt: string;
  } | null;
  sources: SourceSummary[];
  exportProfiles: ExportProfileSummary[];
}

export interface SkillDocument {
  id: string;
  skillId: string;
  title: string;
  type: string;
  confidence: string;
  sourceStatus: string;
  freshness: string;
  privacy: string;
  lastReviewed?: string | null;
  reviewStatus: string;
  tags: string[];
  sources: string[];
  body: string;
  metadata: Record<string, unknown>;
}

export interface SkillDetail extends SkillSummary {
  author: string;
  license: string;
  createdAt: string;
  manifest: Record<string, unknown>;
  counts: {
    instructions: number;
    examples: number;
    sources: number;
    exportProfiles: number;
  };
  validation: {
    errors: number;
    warnings: number;
  };
  health: {
    score: number;
    status: string;
  };
  sources: SourceSummary[];
  exportProfiles: ExportProfileSummary[];
}

export type SkillImportKind = "auto" | "folder" | "markdown" | "prompt-template" | "claude-skill" | "chatgpt-prompts";

export interface SkillImportRequest {
  inputPath: string;
  kind: SkillImportKind;
  skillId?: string;
  name?: string;
  maxDocs?: number;
  overwrite?: boolean;
}

export interface SkillImportWarning {
  code: string;
  message: string;
  file?: string;
}

export interface SkillImportPreview {
  ok: boolean;
  kind: string;
  skillId: string;
  skillName: string;
  counts: {
    documents: number;
    sources: number;
    warnings: number;
  };
  documents: Array<{
    id: string;
    title: string;
    type: string;
    tags: string[];
    sourceId: string;
  }>;
  warnings: SkillImportWarning[];
}

export interface SkillImportResult {
  ok: boolean;
  skillId: string;
  skillName: string;
  counts: {
    documents: number;
    sources: number;
    warnings: number;
  };
  warnings: SkillImportWarning[];
  validation: {
    valid: boolean;
    errors: number;
    warnings: number;
    infos: number;
  };
  skill?: SkillDetail | SkillSummary | null;
}

export type ContextPackCollectorId = "blank-pack-starter" | "markdown-folder" | "project-notes" | "support-kb-starter";

export interface ContextPackCollectorDefinition {
  id: ContextPackCollectorId;
  name: string;
  description: string;
  inputMode: "none" | "local_path";
  defaultPackId: string;
  defaultName: string;
  defaultMaxRecords: number;
}

export interface ContextPackCollectorRequest {
  inputPath?: string;
  packId?: string;
  name?: string;
  description?: string;
  maxRecords?: number;
  overwrite?: boolean;
}

export interface ContextPackCollectorWarning {
  code: string;
  message: string;
  file?: string;
}

export interface ContextPackCollectorPreview {
  ok: boolean;
  collectorId: ContextPackCollectorId;
  packId: string;
  packName: string;
  records: Array<{
    id: string;
    title: string;
    type: string;
    tags: string[];
    sourceId: string;
  }>;
  sourceCount: number;
  warnings: ContextPackCollectorWarning[];
}

export interface ContextPackCollectorResult {
  ok: boolean;
  collectorId: ContextPackCollectorId;
  packId: string;
  packName: string;
  counts: {
    records: number;
    sources: number;
    warnings: number;
  };
  warnings: ContextPackCollectorWarning[];
  validation: {
    valid: boolean;
    errors: number;
    warnings: number;
    infos: number;
  };
  draft: {
    status: string;
    indexed: boolean;
  };
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

export interface ReviewItemsResponse {
  items: ReviewItem[];
  counts: {
    total: number;
    open: number;
    filtered: number;
  };
}

export interface HealthCheck {
  id: string;
  label: string;
  status: "pass" | "warning" | "error";
  count: number;
}

export interface PackHealthResponse {
  packId: string;
  score: number;
  status: string;
  reviewQueueCount: number;
  checks: HealthCheck[];
  items: ReviewItem[];
}

export interface SkillHealthResponse {
  skillId: string;
  score: number;
  status: string;
  reviewQueueCount: number;
  checks: HealthCheck[];
  items: ReviewItem[];
}

export interface AgentKitHealthResponse {
  agentKitId: string;
  score: number;
  status: string;
  reviewQueueCount: number;
  checks: HealthCheck[];
  items: ReviewItem[];
}

export interface RecordSummary {
  id: string;
  packId: string;
  title: string;
  type: string;
  confidence: string;
  sourceStatus: string;
  freshness: string;
  privacy: string;
  lastReviewed?: string | null;
  reviewStatus: string;
  tags: string[];
  sources: string[];
  filePath: string;
}

export interface RecordDetail extends RecordSummary {
  body: string;
  resolvedSources: SourceSummary[];
  metadata: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  kind: "pack" | "record" | "skill" | "skill_instruction" | "skill_example" | "agent-kit";
  title: string;
  snippet?: string;
  packId?: string;
  skillId?: string;
}

export interface SearchResponse {
  query: string;
  type?: string;
  results: SearchResult[];
}

export type SortKey = "name" | "health" | "lastReviewed" | "records";
export type LibraryViewMode = "cover" | "compact" | "table";
export type ComposerMode = "agent-kit" | "record-export";

export type Route =
  | { name: "library" }
  | { name: "pack"; packId: string }
  | { name: "record"; recordId: string }
  | { name: "skills" }
  | { name: "skill"; skillId: string }
  | { name: "agentKits" }
  | { name: "agentKit"; agentKitId: string }
  | { name: "collectors" }
  | { name: "reviewQueue" }
  | { name: "composer"; mode?: ComposerMode }
  | { name: "exports" }
  | { name: "health" };
