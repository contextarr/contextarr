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
  brandId?: string | null;
  coverRecipe?: "brand_hex_v1" | "generated_v1" | string | null;
  logoVariant?: "auto" | "light" | "dark" | "mono" | string | null;
  starterPack?: boolean;
  starterCategory?: string | null;
  starterSortOrder?: number | null;
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
  brandId?: string | null;
  coverRecipe?: "brand_hex_v1" | "generated_v1" | string | null;
  logoVariant?: "auto" | "light" | "dark" | "mono" | string | null;
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

export type ExportBriefObjectType = "pack" | "skill" | "agent_kit" | "composed";
export type ExportBriefPrivacyMode = "redacted" | "public_safe";

export interface ExportBrief {
  id: string;
  objectType: ExportBriefObjectType;
  objectId: string;
  profileId: string;
  target: string;
  format: string;
  privacyMode: ExportBriefPrivacyMode;
  filename: string;
  mimeType: string;
  sha256: string;
  byteLength: number;
  estimatedTokens: number;
  includedCount: number;
  excludedCount: number;
  sourceCount: number;
  warningCount: number;
  warningCodes: string[];
  generatedAt: string;
  savedAt: string;
  contentSnapshot?: string;
  contentSnapshotTruncated: boolean;
}

export interface SaveExportBriefRequest {
  objectType: ExportBriefObjectType;
  objectId: string;
  privacyMode: ExportBriefPrivacyMode;
  artifact: ExportArtifact;
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

export interface ExposureIssue {
  code: string;
  severity: "blocker" | "warning";
  message: string;
}

export interface ExposureRecordReadiness {
  id: string;
  packId: string;
  title: string;
  type: string;
  privacy: string;
  reviewStatus: string;
  freshness: string;
  sourceStatus: string;
  tags: string[];
  exportEligible: boolean;
  mcpEligible: boolean;
  blockers: ExposureIssue[];
  warnings: ExposureIssue[];
}

export interface ExposureProfileReadiness {
  id: string;
  name: string;
  target: string;
  format: string;
  privacyMode: string | null;
  tokenBudget: number | null;
  status: string;
  exportEligible: boolean;
  blockers: ExposureIssue[];
  warnings: ExposureIssue[];
}

export interface PackExposureReadiness {
  packId: string;
  packName: string;
  policies: {
    export: {
      defaultPrivacyMode: "redacted";
      recordPolicy: string;
    };
    mcp: {
      transport: "stdio";
      defaultBodyPolicy: string;
      allowPrivateByDefault: false;
    };
  };
  validation: {
    valid: boolean;
    status: string;
    errors: number;
    warnings: number;
  };
  security: {
    status: string;
    recommendedAction: string;
    blocked: boolean;
  };
  summary: {
    recordCount: number;
    exportEligibleRecords: number;
    mcpEligibleRecords: number;
    blockedRecords: number;
    warningRecords: number;
    sourceBackedRecords: number;
    recordsMissingSourceCoverage: number;
    exportProfileCount: number;
    exportEligibleProfiles: number;
    blockedProfiles: number;
    warningProfiles: number;
  };
  exportProfiles: ExposureProfileReadiness[];
  records: ExposureRecordReadiness[];
  blockers: ExposureIssue[];
  warnings: ExposureIssue[];
}

export type PackReadinessStatus = "ready" | "review_needed" | "blocked";
export type PackReadinessDimensionId = "source" | "review" | "governance" | "redaction" | "export" | "mcp";

export interface PackReadinessIssue {
  code: string;
  severity: "blocker" | "warning";
  message: string;
  evidence: Record<string, unknown>;
}

export interface PackReadinessDimension {
  id: PackReadinessDimensionId;
  label: string;
  status: PackReadinessStatus;
  score: number;
  evidence: Record<string, unknown>;
}

export interface PackReadinessReport {
  schemaVersion: "contextarr.readiness-report.v1";
  packId: string;
  status: PackReadinessStatus;
  score: number;
  dimensions: Record<PackReadinessDimensionId, PackReadinessDimension>;
  issues: PackReadinessIssue[];
  generatedAt: string;
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

export type ReviewCandidateSourceKind = "draft_pack" | "composed_pack" | "imported_pack" | "restored_quarantine" | "unknown";
export type ReviewCandidateStatus = "ready_for_review" | "invalid" | "blocked" | "duplicate_active_id";
export type ReviewCandidateActivationMode = "move" | "copy";

export interface ReviewCandidateSummary {
  key: string;
  sourceKind: ReviewCandidateSourceKind;
  sourceLabel: string;
  pathLabel: string;
  packId: string | null;
  name: string;
  version: string | null;
  status: ReviewCandidateStatus;
  recommendedAction: string;
  activeConflict: boolean;
  validation: {
    status: string;
    errors: number;
    warnings: number;
    infos: number;
    issueCount: number;
  };
  security: {
    status: string;
    recommendedAction: string;
    blocking: boolean;
    summary: Record<string, number> | null;
    findingCount: number;
  };
  counts: {
    records: number;
    sources: number;
    exportProfiles: number;
  };
}

export interface ReviewCandidateDetail extends ReviewCandidateSummary {
  validationIssues: Array<{
    severity: string;
    code: string;
    message: string;
    file?: string;
    path?: string;
  }>;
  securityFindings: Array<{
    id: string;
    code: string;
    severity: string;
    category: string;
    file: string;
    line?: number;
    message: string;
    recommendedAction: string;
    blocking: boolean;
  }>;
  records: Array<{
    id: string;
    title: string;
    type: string;
    privacy: string;
    reviewStatus: string;
    sourceStatus: string;
    tags: string[];
    sources: string[];
    file: string;
  }>;
  sources: Array<{
    id: string;
    type: string;
    title: string;
    url?: string | null;
    path?: string | null;
    trust?: string | null;
    status?: string | null;
    licenseStatus?: string | null;
  }>;
  exportProfiles: Array<{
    id: string;
    name: string;
    target: string;
    format: string;
    privacyMode?: string | null;
  }>;
}

export interface ReviewCandidateActivationPlan {
  schemaVersion: "contextarr.review-candidate-activation-plan.v1";
  candidateKey: string;
  packId: string | null;
  name: string;
  status: "ready" | "blocked";
  canActivate: boolean;
  source: {
    kind: ReviewCandidateSourceKind;
    label: string;
    pathLabel: string;
  };
  target: {
    activePacksRootLabel: string;
    packId: string | null;
    pathLabel: string | null;
    activeConflict: boolean;
  };
  checks: Array<{
    id: string;
    label: string;
    status: "pass" | "warning" | "error";
    message: string;
  }>;
  blockers: Array<{
    code: string;
    message: string;
  }>;
  warnings: Array<{
    code: string;
    message: string;
  }>;
  nextSteps: string[];
  boundaries: string[];
}

export interface ReviewCandidateActivationDryRun {
  schemaVersion: "contextarr.review-candidate-activation-dry-run.v1";
  generatedAt: string;
  proofId: string;
  candidateKey: string;
  packId: string | null;
  name: string;
  status: "ready" | "blocked";
  canActivate: boolean;
  source: ReviewCandidateActivationPlan["source"];
  target: ReviewCandidateActivationPlan["target"];
  validation: ReviewCandidateSummary["validation"];
  security: ReviewCandidateSummary["security"];
  blockers: ReviewCandidateActivationPlan["blockers"];
  warnings: ReviewCandidateActivationPlan["warnings"];
  manualActions: string[];
  effects: {
    filesMoved: false;
    sqliteMutated: false;
    exportsGenerated: false;
    mcpExposed: false;
    networkAccessed: false;
  };
  boundaries: string[];
}

export interface ReviewCandidateActivationResult {
  schemaVersion: "contextarr.review-candidate-activation-result.v1";
  activatedAt: string;
  proofId: string;
  candidateKey: string;
  packId: string;
  name: string;
  mode: ReviewCandidateActivationMode;
  source: ReviewCandidateActivationPlan["source"];
  validation: ReviewCandidateSummary["validation"];
  security: ReviewCandidateSummary["security"];
  warnings: ReviewCandidateActivationPlan["warnings"];
  target: {
    activePacksRootLabel: string;
    packId: string;
    pathLabel: string;
    activeConflict: false;
  };
  effects: {
    filesMoved: boolean;
    filesCopied: boolean;
    sourceRemoved: boolean;
    exportsGenerated: false;
    mcpExposed: false;
    networkAccessed: false;
  };
  nextSteps: string[];
  boundaries: string[];
}

export interface ReviewCandidateActivationHistoryItem {
  schemaVersion: "contextarr.review-candidate-activation-history.v1";
  id: number;
  proofId: string;
  candidateKey: string;
  packId: string;
  name: string;
  status: "applied";
  mode: ReviewCandidateActivationMode;
  activatedAt: string;
  indexRefreshedAt: string | null;
  source: ReviewCandidateActivationPlan["source"];
  target: ReviewCandidateActivationResult["target"];
  validation: ReviewCandidateSummary["validation"];
  security: ReviewCandidateSummary["security"];
  warnings: ReviewCandidateActivationPlan["warnings"];
  effects: ReviewCandidateActivationResult["effects"];
  activation: ReviewCandidateActivationResult;
}

export interface ReviewCandidateActivationApplyRequest {
  proofId: string;
  mode?: ReviewCandidateActivationMode;
}

export interface ReviewCandidateActivationApplyResponse {
  ok: boolean;
  activation: ReviewCandidateActivationResult;
  history?: ReviewCandidateActivationHistoryItem;
  pack?: PackSummary | null;
  index: Record<string, unknown>;
}

export interface ReviewCandidatesResponse {
  candidates: ReviewCandidateSummary[];
  skippedRoots: Array<{
    sourceKind: ReviewCandidateSourceKind;
    rootLabel: string;
    reason: string;
    message: string;
  }>;
  counts: {
    total: number;
    readyForReview: number;
    invalid: number;
    blocked: number;
    duplicateActiveId: number;
    skippedRoots: number;
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
  | { name: "reviewQueue"; tab?: "items" | "drafts" }
  | { name: "composer"; mode?: ComposerMode }
  | { name: "exports" }
  | { name: "health" };
