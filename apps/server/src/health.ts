import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { ExportProfile } from "@contextarr/schema";
import type {
  HealthCheck,
  LoadedAgentKit,
  LoadedPack,
  LoadedRecord,
  LoadedSkill,
  LoadedSkillDocument,
  ReviewObjectType,
  ReviewItem,
  ReviewItemSeverity,
  ReviewItemStatus,
  ReviewItemType,
  SkippedAgentKit,
  SkippedPack,
  SkippedSkill
} from "./types";

export interface ReviewItemCandidate {
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
  metadata: Record<string, unknown>;
}

export interface HealthScore {
  score: number;
  status: "healthy" | "degraded" | "needs_review";
  reviewQueueCount: number;
}

export interface AgentKitReferenceStatus {
  kind: "context_pack" | "skill";
  id: string;
  found: boolean;
  trustLevel?: string;
  healthScore?: number;
  healthStatus?: string;
  activeIssueCount?: number;
  activeErrorCount?: number;
  activeWarningCount?: number;
  reviewQueueCount?: number;
  openErrorCount?: number;
  openWarningCount?: number;
}

interface ReviewValidationIssue {
  severity: ReviewItemSeverity;
  code: string;
  message: string;
  file?: string;
  path?: string;
}

const healthCheckLabels: Record<ReviewItemType, string> = {
  validation: "Validation",
  freshness: "Freshness",
  export_safety: "Export Safety",
  export_readiness: "Export Readiness",
  example_coverage: "Example Coverage",
  safety_rules: "Safety Rules",
  target_compatibility: "Target Compatibility",
  disallowed_pattern: "Disallowed Pattern Scan",
  ai_draft: "AI Draft Review",
  review_status: "Review Status",
  trust: "Trust",
  source_coverage: "Source Coverage"
};

const defaultRedactTags = new Set(["secret", "never_export", "sensitive", "private"]);
const sensitivePrivacyValues = new Set(["private", "sensitive", "secret"]);
const supportedSkillTargets = new Set(["chatgpt", "claude", "codex", "claude_code", "markdown", "generic_markdown", "json"]);
const deprecatedSkillTargets = new Set(["legacy_prompt", "plain_prompt"]);
const agentKitStaleAfterDays = 180;

export function createReviewItemId(fingerprint: string): string {
  return `ri_${crypto.createHash("sha256").update(fingerprint).digest("hex").slice(0, 24)}`;
}

export function generatePackReviewItems(pack: LoadedPack, now = new Date()): ReviewItemCandidate[] {
  const items: ReviewItemCandidate[] = [];
  const freshnessRules = readFreshnessRules(pack);
  const redactionTags = readRedactionTags(pack);

  for (const issue of pack.validation.issues) {
    items.push(validationIssueToCandidate("pack", pack.manifest.id, issue, pack.packPath));
  }

  if (pack.manifest.trustLevel === "deprecated" || pack.manifest.trustLevel === "blocked") {
    const severity = pack.manifest.trustLevel === "blocked" ? "error" : "warning";
    items.push(
      candidate({
        type: "trust",
        severity,
        packId: pack.manifest.id,
        message: `Pack trust level is ${pack.manifest.trustLevel}.`,
        suggestedAction: "Review the pack trust level before relying on it.",
        parts: [pack.manifest.id, pack.manifest.trustLevel],
        metadata: { trustLevel: pack.manifest.trustLevel }
      })
    );
  }

  for (const record of pack.records) {
    items.push(...reviewRecordFreshness(pack, record, freshnessRules, now));
    items.push(...reviewRecordStatus(pack, record));
    items.push(...reviewSourceCoverage(pack, record));
  }

  items.push(...reviewExportSafety(pack, redactionTags));

  return items;
}

export function generateSkippedPackReviewItems(skipped: SkippedPack): ReviewItemCandidate[] {
  const packId = skipped.packId ?? path.basename(skipped.packPath);

  return skipped.issues.map((issue) => validationIssueToCandidate("pack", packId, issue, skipped.packPath));
}

export function generateSkillReviewItems(skill: LoadedSkill, now = new Date()): ReviewItemCandidate[] {
  const items: ReviewItemCandidate[] = [];
  const freshnessRules = readFreshnessRulesFile(skill.skillPath, skill.manifest.rulesPath, 180);
  const redactionTags = new Set(defaultRedactTags);

  for (const issue of skill.validation.issues) {
    items.push(validationIssueToCandidate("skill", skill.manifest.id, issue, skill.skillPath));
  }

  if (skill.manifest.trustLevel === "deprecated" || skill.manifest.trustLevel === "blocked") {
    const severity = skill.manifest.trustLevel === "blocked" ? "error" : "warning";
    items.push(
      candidate({
        objectType: "skill",
        type: "trust",
        severity,
        packId: skill.manifest.id,
        message: `Skill trust level is ${skill.manifest.trustLevel}.`,
        suggestedAction: "Review the Skill trust level before relying on it.",
        parts: [skill.manifest.id, skill.manifest.trustLevel],
        metadata: { trustLevel: skill.manifest.trustLevel }
      })
    );
  }

  for (const document of [...skill.instructions, ...skill.examples]) {
    items.push(...reviewSkillDocumentFreshness(skill, document, freshnessRules, now));
    items.push(...reviewSkillDocumentStatus(skill, document));
    items.push(...reviewSkillSourceCoverage(skill, document));
  }

  items.push(...reviewSkillExampleCoverage(skill));
  items.push(...reviewSkillTargetCompatibility(skill));
  items.push(...reviewSkillExportReadiness(skill));
  items.push(...reviewSkillAiDrafts(skill));
  items.push(...reviewSkillExportSafety(skill, redactionTags));

  return items;
}

export function generateSkippedSkillReviewItems(skipped: SkippedSkill): ReviewItemCandidate[] {
  const skillId = skipped.skillId ?? path.basename(skipped.skillPath);

  return skipped.issues.map((issue) => validationIssueToCandidate("skill", skillId, issue, skipped.skillPath));
}

export function generateAgentKitReviewItems(
  agentKit: LoadedAgentKit,
  now = new Date(),
  references: AgentKitReferenceStatus[] = []
): ReviewItemCandidate[] {
  const items: ReviewItemCandidate[] = [];

  for (const issue of agentKit.validation.issues) {
    items.push(validationIssueToCandidate("agent_kit", agentKit.manifest.id, issue, agentKit.agentKitPath));
  }

  items.push(...reviewAgentKitFreshness(agentKit, now));
  items.push(...reviewAgentKitTrust(agentKit));
  items.push(...reviewAgentKitExportReadiness(agentKit));
  items.push(...reviewAgentKitSafety(agentKit));
  items.push(...reviewAgentKitReferences(agentKit, references));

  return items;
}

export function generateSkippedAgentKitReviewItems(skipped: SkippedAgentKit): ReviewItemCandidate[] {
  const agentKitId = skipped.agentKitId ?? path.basename(skipped.agentKitPath);

  return skipped.issues.map((issue) =>
    validationIssueToCandidate("agent_kit", agentKitId, issue, skipped.agentKitPath)
  );
}

export function calculateHealthScore(items: Array<Pick<ReviewItem, "severity" | "status">>): HealthScore {
  const active = items.filter((item) => item.status !== "ignored" && item.status !== "resolved");
  const errors = active.filter((item) => item.severity === "error").length;
  const warnings = active.filter((item) => item.severity === "warning").length;
  const infos = active.filter((item) => item.severity === "info").length;
  const score = Math.max(0, 100 - errors * 25 - warnings * 10 - infos * 2);

  return {
    score,
    status: score >= 90 ? "healthy" : score >= 70 ? "degraded" : "needs_review",
    reviewQueueCount: items.filter((item) => item.status === "open").length
  };
}

export function buildHealthChecks(items: Array<Pick<ReviewItem, "type" | "severity" | "status">>): HealthCheck[] {
  const active = items.filter((item) => item.status !== "ignored" && item.status !== "resolved");

  return (Object.keys(healthCheckLabels) as ReviewItemType[]).map((type) => {
    const typedItems = active.filter((item) => item.type === type);
    const hasError = typedItems.some((item) => item.severity === "error");
    const hasWarning = typedItems.some((item) => item.severity === "warning");

    return {
      id: type,
      label: healthCheckLabels[type],
      status: hasError ? "error" : hasWarning ? "warning" : "pass",
      count: typedItems.length
    };
  });
}

function validationIssueToCandidate(
  objectType: ReviewObjectType,
  objectId: string,
  issue: ReviewValidationIssue,
  rootPath?: string
): ReviewItemCandidate {
  const safeFile = sanitizeIssueFile(issue.file, rootPath);
  const safePath = sanitizeIssuePath(issue.path);
  const safeMessage = sanitizeIssueMessage(issue.message, rootPath);
  const reviewType = reviewTypeForValidationIssue(issue.code);
  const subject = objectType === "agent_kit" ? "Agent Kit" : objectType === "skill" ? "Skill" : "pack";

  return candidate({
    objectType,
    type: reviewType,
    severity: issue.severity,
    packId: objectId,
    message: safeMessage,
    suggestedAction: `Fix the validation issue in the source ${subject} before activation.`,
    parts: [objectId, issue.code, safeFile ?? "", safePath ?? ""],
    metadata: { code: issue.code, file: safeFile, path: safePath }
  });
}

function reviewTypeForValidationIssue(code: string): ReviewItemType {
  if (code.startsWith("rules.safety_missing") || code.startsWith("rules.missing_directory")) {
    return "safety_rules";
  }

  if (
    code.startsWith("scan.") ||
    code.startsWith("rules.safety.") ||
    code === "agent_kit.execution_claimed" ||
    code === "agent_kit.reserved_capability" ||
    code === "skill.executable_file" ||
    code === "skill.script_file" ||
    code === "agent_kit.executable_file" ||
    code === "agent_kit.script_file" ||
    code.startsWith("agent_kit_scan.")
  ) {
    return "disallowed_pattern";
  }

  if (code.includes("source_missing") || code.startsWith("sources.")) {
    return "source_coverage";
  }

  if (code.startsWith("source.license_")) {
    return "source_coverage";
  }

  if (code === "source.stale") {
    return "freshness";
  }

  if (
    code === "agent_kit.context_pack_missing" ||
    code === "agent_kit.skill_missing" ||
    code === "agent_kit_reference.unindexed_context_pack" ||
    code === "agent_kit_reference.unindexed_skill"
  ) {
    return "source_coverage";
  }

  if (code.startsWith("examples.")) {
    return "example_coverage";
  }

  if (
    code.startsWith("exports.") ||
    code.startsWith("export_profile.") ||
    code.startsWith("skill_export_profile.") ||
    code.startsWith("agent_kit_exports.") ||
    code.startsWith("agent_kit_export_profile.")
  ) {
    return "export_readiness";
  }

  if (
    code.startsWith("agent_kit_policy.") ||
    code.startsWith("agent_kit_rules.redaction") ||
    code === "redaction.hit_warn" ||
    code === "agent_kit_manifest.executable_code" ||
    code === "agent_kit_manifest.requires_network" ||
    code === "agent_kit_manifest.read_vault" ||
    code === "agent_kit_manifest.write_drafts" ||
    code === "agent_kit_manifest.run_commands" ||
    code === "agent_kit_manifest.network_access" ||
    code === "agent_kit_manifest.browser_automation" ||
    code === "agent_kit_manifest.tool_execution"
  ) {
    return "safety_rules";
  }

  if (
    code === "agent_kit.skill_target_missing" ||
    code === "agent_kit_manifest.unsupported_target" ||
    code.startsWith("agent_kit_compatibility.")
  ) {
    return "target_compatibility";
  }

  return "validation";
}

function sanitizeIssueFile(value?: string, rootPath?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = normalizePath(value);
  const localPath = value.replace(/\//g, path.sep);
  if (path.isAbsolute(localPath)) {
    if (rootPath) {
      const relative = path.relative(path.resolve(rootPath), localPath);
      if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
        return normalizePath(relative);
      }
    }

    return path.basename(localPath);
  }

  if (normalized.startsWith("../") || normalized === "..") {
    return path.basename(normalized);
  }

  return normalized;
}

function sanitizeIssuePath(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.replace(/[^\w.[\]-]/g, "_").slice(0, 160);
}

function sanitizeIssueMessage(value: string, rootPath?: string): string {
  let message = normalizePath(value);

  if (rootPath) {
    const root = normalizePath(path.resolve(rootPath));
    message = message.replaceAll(root, "[local path]");
  }

  return message
    .replace(/\b[A-Za-z]:\/[^\s"'`<>|]+/g, "[local path]")
    .replace(/(?<!:)\/\/[^/\s"'`<>|]+\/[^\s"'`<>|]+(?:\/[^\s"'`<>|]+)*/g, "[local path]")
    .replace(/\\\\[^\s"'`<>|]+/g, "[local path]");
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function reviewRecordFreshness(
  pack: LoadedPack,
  record: LoadedRecord,
  rules: Record<string, number>,
  now: Date
): ReviewItemCandidate[] {
  const lastReviewed = record.metadata.last_reviewed;

  if (!lastReviewed) {
    return [
      candidate({
        objectType: "pack",
        type: "freshness",
        severity: "warning",
        packId: pack.manifest.id,
        recordId: record.metadata.id,
        message: `Record "${record.metadata.title}" is missing a last reviewed date.`,
        suggestedAction: "Review the record and add last_reviewed metadata.",
        parts: [pack.manifest.id, record.metadata.id, "missing-last-reviewed"]
      })
    ];
  }

  const staleAfterDays = rules[record.metadata.type] ?? rules.default ?? 90;
  const ageDays = daysBetween(lastReviewed, now);
  if (ageDays <= staleAfterDays) {
    return [];
  }

  return [
    candidate({
      objectType: "pack",
      type: "freshness",
      severity: "warning",
      packId: pack.manifest.id,
      recordId: record.metadata.id,
      message: `Record "${record.metadata.title}" was reviewed ${ageDays} days ago.`,
      suggestedAction: `Review this record because its freshness window is ${staleAfterDays} days.`,
      parts: [pack.manifest.id, record.metadata.id, "stale-review"],
      metadata: { ageDays, staleAfterDays, lastReviewed }
    })
  ];
}

function reviewRecordStatus(pack: LoadedPack, record: LoadedRecord): ReviewItemCandidate[] {
  if (record.metadata.review_status === "approved") {
    return [];
  }

  return [
    candidate({
      objectType: "pack",
      type: "review_status",
      severity: record.metadata.review_status === "rejected" ? "error" : "warning",
      packId: pack.manifest.id,
      recordId: record.metadata.id,
      message: `Record "${record.metadata.title}" is ${record.metadata.review_status}.`,
      suggestedAction: "Review and approve the record before it is used in trusted exports.",
      parts: [pack.manifest.id, record.metadata.id, record.metadata.review_status],
      metadata: { reviewStatus: record.metadata.review_status }
    })
  ];
}

function reviewSourceCoverage(pack: LoadedPack, record: LoadedRecord): ReviewItemCandidate[] {
  if (record.metadata.sources.length > 0 && record.metadata.source_status !== "unsourced") {
    return [];
  }

  return [
    candidate({
      objectType: "pack",
      type: "source_coverage",
      severity: "warning",
      packId: pack.manifest.id,
      recordId: record.metadata.id,
      message: `Record "${record.metadata.title}" has weak source coverage.`,
      suggestedAction: "Attach at least one source or mark the source status clearly before reuse.",
      parts: [pack.manifest.id, record.metadata.id, "weak-source-coverage"],
      metadata: { sourceStatus: record.metadata.source_status, sources: record.metadata.sources }
    })
  ];
}

function reviewExportSafety(pack: LoadedPack, redactionTags: Set<string>): ReviewItemCandidate[] {
  const recordsById = new Map(pack.records.map((record) => [record.metadata.id, record]));
  const items: ReviewItemCandidate[] = [];

  for (const profile of pack.exportProfiles) {
    for (const record of includedRecords(profile, pack.records, recordsById)) {
      const riskyValues = riskValuesForRecord(record, redactionTags);
      if (riskyValues.length === 0) {
        continue;
      }

      const exclusions = new Set(profile.exclude_tags ?? []);
      const hasMatchingExclusion = riskyValues.some((value) => exclusions.has(value));
      if (hasMatchingExclusion) {
        continue;
      }

      items.push(
        candidate({
          objectType: "pack",
          type: "export_safety",
          severity: record.metadata.privacy === "secret" ? "error" : "warning",
          packId: pack.manifest.id,
          recordId: record.metadata.id,
          message: `Export profile "${profile.name}" includes sensitive record "${record.metadata.title}".`,
          suggestedAction: "Add a matching exclusion tag or remove the record from this profile.",
          parts: [pack.manifest.id, profile.id, record.metadata.id, "sensitive-export"],
          metadata: { profileId: profile.id, riskyValues }
        })
      );
    }
  }

  return items;
}

function includedRecords(
  profile: ExportProfile,
  records: LoadedRecord[],
  recordsById: Map<string, LoadedRecord>
): LoadedRecord[] {
  const includeIds = profile.include?.records;
  if (!includeIds || includeIds.length === 0) {
    return records;
  }

  return includeIds.map((id) => recordsById.get(id)).filter((record): record is LoadedRecord => Boolean(record));
}

function riskValuesForRecord(record: LoadedRecord, redactionTags: Set<string>): string[] {
  const values = new Set<string>();

  if (sensitivePrivacyValues.has(record.metadata.privacy)) {
    values.add(record.metadata.privacy);
  }

  for (const tag of record.metadata.tags) {
    if (redactionTags.has(tag)) {
      values.add(tag);
    }
  }

  return [...values];
}

function reviewSkillDocumentFreshness(
  skill: LoadedSkill,
  document: LoadedSkillDocument,
  rules: Record<string, number>,
  now: Date
): ReviewItemCandidate[] {
  const lastReviewed = document.metadata.last_reviewed;

  if (!lastReviewed) {
    return [
      candidate({
        objectType: "skill",
        type: "freshness",
        severity: "warning",
        packId: skill.manifest.id,
        recordId: document.metadata.id,
        message: `Skill document "${document.metadata.title}" is missing a last reviewed date.`,
        suggestedAction: "Review the Skill document and add last_reviewed metadata.",
        parts: [skill.manifest.id, document.metadata.id, "missing-last-reviewed"]
      })
    ];
  }

  const staleAfterDays = rules[document.metadata.type] ?? rules.default ?? 180;
  const ageDays = daysBetween(lastReviewed, now);
  if (ageDays <= staleAfterDays) {
    return [];
  }

  return [
    candidate({
      objectType: "skill",
      type: "freshness",
      severity: "warning",
      packId: skill.manifest.id,
      recordId: document.metadata.id,
      message: `Skill document "${document.metadata.title}" was reviewed ${ageDays} days ago.`,
      suggestedAction: `Review this Skill document because its freshness window is ${staleAfterDays} days.`,
      parts: [skill.manifest.id, document.metadata.id, "stale-review"],
      metadata: { ageDays, staleAfterDays, lastReviewed }
    })
  ];
}

function reviewSkillDocumentStatus(skill: LoadedSkill, document: LoadedSkillDocument): ReviewItemCandidate[] {
  if (document.metadata.review_status === "approved") {
    return [];
  }

  return [
    candidate({
      objectType: "skill",
      type: "review_status",
      severity: document.metadata.review_status === "rejected" ? "error" : "warning",
      packId: skill.manifest.id,
      recordId: document.metadata.id,
      message: `Skill document "${document.metadata.title}" is ${document.metadata.review_status}.`,
      suggestedAction: "Review and approve the Skill document before it is used in trusted exports or Agent Kits.",
      parts: [skill.manifest.id, document.metadata.id, document.metadata.review_status],
      metadata: { reviewStatus: document.metadata.review_status }
    })
  ];
}

function reviewSkillSourceCoverage(skill: LoadedSkill, document: LoadedSkillDocument): ReviewItemCandidate[] {
  if (document.metadata.sources.length > 0 && document.metadata.source_status !== "unsourced") {
    return [];
  }

  return [
    candidate({
      objectType: "skill",
      type: "source_coverage",
      severity: "warning",
      packId: skill.manifest.id,
      recordId: document.metadata.id,
      message: `Skill document "${document.metadata.title}" has weak source coverage.`,
      suggestedAction: "Attach at least one source or mark the source status clearly before reuse.",
      parts: [skill.manifest.id, document.metadata.id, "weak-source-coverage"],
      metadata: { sourceStatus: document.metadata.source_status, sources: document.metadata.sources }
    })
  ];
}

function reviewSkillExportSafety(skill: LoadedSkill, redactionTags: Set<string>): ReviewItemCandidate[] {
  const documentsById = new Map(
    [...skill.instructions, ...skill.examples].map((document) => [document.metadata.id, document])
  );
  const items: ReviewItemCandidate[] = [];

  for (const profile of skill.exportProfiles) {
    for (const document of includedSkillDocuments(profile, skill, documentsById)) {
      const riskyValues = riskValuesForSkillDocument(document, redactionTags);
      if (riskyValues.length === 0) {
        continue;
      }

      const exclusions = new Set(profile.exclude_tags ?? []);
      const hasMatchingExclusion = riskyValues.some((value) => exclusions.has(value));
      if (hasMatchingExclusion) {
        continue;
      }

      items.push(
        candidate({
          objectType: "skill",
          type: "export_safety",
          severity: document.metadata.privacy === "secret" ? "error" : "warning",
          packId: skill.manifest.id,
          recordId: document.metadata.id,
          message: `Skill export profile "${profile.name}" includes sensitive document "${document.metadata.title}".`,
          suggestedAction: "Add a matching exclusion tag or remove the Skill document from this profile.",
          parts: [skill.manifest.id, profile.id, document.metadata.id, "sensitive-export"],
          metadata: { profileId: profile.id, riskyValues }
        })
      );
    }
  }

  return items;
}

function includedSkillDocuments(
  profile: LoadedSkill["exportProfiles"][number],
  skill: LoadedSkill,
  documentsById: Map<string, LoadedSkillDocument>
): LoadedSkillDocument[] {
  const includeInstructions = profile.include?.instructions;
  const includeExamples = profile.include?.examples;
  const includedIds = [...(includeInstructions ?? []), ...(includeExamples ?? [])];
  if (includedIds.length === 0) {
    return [...skill.instructions, ...skill.examples];
  }

  return includedIds.map((id) => documentsById.get(id)).filter((document): document is LoadedSkillDocument => Boolean(document));
}

function riskValuesForSkillDocument(document: LoadedSkillDocument, redactionTags: Set<string>): string[] {
  const values = new Set<string>();

  if (sensitivePrivacyValues.has(document.metadata.privacy)) {
    values.add(document.metadata.privacy);
  }

  for (const tag of document.metadata.tags) {
    if (redactionTags.has(tag)) {
      values.add(tag);
    }
  }

  return [...values];
}

function reviewSkillExampleCoverage(skill: LoadedSkill): ReviewItemCandidate[] {
  if (skill.examples.length > 0) {
    return [];
  }

  return [
    candidate({
      objectType: "skill",
      type: "example_coverage",
      severity: "warning",
      packId: skill.manifest.id,
      message: "Skill has no indexed examples.",
      suggestedAction: "Add at least one fake or public-safe example before recommending this Skill for reuse.",
      parts: [skill.manifest.id, "missing-examples"],
      metadata: { exampleCount: skill.examples.length }
    })
  ];
}

function reviewSkillTargetCompatibility(skill: LoadedSkill): ReviewItemCandidate[] {
  const items: ReviewItemCandidate[] = [];

  if (skill.manifest.targets.length === 0) {
    items.push(
      candidate({
        objectType: "skill",
        type: "target_compatibility",
        severity: "warning",
        packId: skill.manifest.id,
        message: "Skill does not declare compatible targets.",
        suggestedAction: "Declare at least one compatible target such as chatgpt, claude, codex, or markdown.",
        parts: [skill.manifest.id, "missing-targets"]
      })
    );
  }

  for (const target of skill.manifest.targets) {
    if (deprecatedSkillTargets.has(target)) {
      items.push(
        candidate({
          objectType: "skill",
          type: "target_compatibility",
          severity: "warning",
          packId: skill.manifest.id,
          message: `Skill target "${target}" is deprecated.`,
          suggestedAction: "Move this Skill to a supported target before relying on it in exports.",
          parts: [skill.manifest.id, target, "deprecated-target"],
          metadata: { target }
        })
      );
      continue;
    }

    if (!supportedSkillTargets.has(target)) {
      items.push(
        candidate({
          objectType: "skill",
          type: "target_compatibility",
          severity: "warning",
          packId: skill.manifest.id,
          message: `Skill target "${target}" is not yet supported by Contextarr exports.`,
          suggestedAction: "Use a supported target or keep this Skill in review until support is added.",
          parts: [skill.manifest.id, target, "unsupported-target"],
          metadata: { target }
        })
      );
    }
  }

  return items;
}

function reviewSkillExportReadiness(skill: LoadedSkill): ReviewItemCandidate[] {
  const items: ReviewItemCandidate[] = [];

  if (skill.exportProfiles.length === 0) {
    return [
      candidate({
        objectType: "skill",
        type: "export_readiness",
        severity: "warning",
        packId: skill.manifest.id,
        message: "Skill has no export profiles.",
        suggestedAction: "Add at least one export profile before using this Skill in copy/download flows.",
        parts: [skill.manifest.id, "missing-export-profiles"]
      })
    ];
  }

  const profileTargets = new Set(skill.exportProfiles.map((profile) => canonicalSkillTarget(profile.target)));
  for (const target of skill.manifest.targets.map(canonicalSkillTarget)) {
    if (!profileTargets.has(target)) {
      items.push(
        candidate({
          objectType: "skill",
          type: "export_readiness",
          severity: "warning",
          packId: skill.manifest.id,
          message: `Skill target "${target}" has no matching export profile.`,
          suggestedAction: "Add a matching export profile or remove the target from the Skill manifest.",
          parts: [skill.manifest.id, target, "missing-target-export"],
          metadata: { target }
        })
      );
    }
  }

  return items;
}

function reviewSkillAiDrafts(skill: LoadedSkill): ReviewItemCandidate[] {
  const draftTags = new Set(["ai_draft", "ai_generated", "machine_generated", "llm_draft"]);

  return [...skill.instructions, ...skill.examples]
    .filter(
      (document) =>
        document.metadata.review_status !== "approved" && document.metadata.tags.some((tag) => draftTags.has(tag))
    )
    .map((document) =>
      candidate({
        objectType: "skill",
        type: "ai_draft",
        severity: "warning",
        packId: skill.manifest.id,
        recordId: document.metadata.id,
        message: `Skill document "${document.metadata.title}" is tagged as an unreviewed AI draft.`,
        suggestedAction: "Review this document manually before allowing it into trusted Skill exports.",
        parts: [skill.manifest.id, document.metadata.id, "unreviewed-ai-draft"],
        metadata: { tags: document.metadata.tags, reviewStatus: document.metadata.review_status }
      })
    );
}

function reviewAgentKitFreshness(agentKit: LoadedAgentKit, now: Date): ReviewItemCandidate[] {
  const lastReviewedAt = agentKit.manifest.lastReviewedAt;

  if (!lastReviewedAt) {
    return [
      candidate({
        objectType: "agent_kit",
        type: "freshness",
        severity: "warning",
        packId: agentKit.manifest.id,
        message: `Agent Kit "${agentKit.manifest.name}" is missing a last reviewed timestamp.`,
        suggestedAction: "Review the Agent Kit and add lastReviewedAt metadata.",
        parts: [agentKit.manifest.id, "missing-last-reviewed"]
      })
    ];
  }

  const ageDays = daysBetween(lastReviewedAt, now);
  if (ageDays <= agentKitStaleAfterDays) {
    return [];
  }

  return [
    candidate({
      objectType: "agent_kit",
      type: "freshness",
      severity: "warning",
      packId: agentKit.manifest.id,
      message: `Agent Kit "${agentKit.manifest.name}" was reviewed ${ageDays} days ago.`,
      suggestedAction: `Review this Agent Kit because its freshness window is ${agentKitStaleAfterDays} days.`,
      parts: [agentKit.manifest.id, "stale-review"],
      metadata: { ageDays, staleAfterDays: agentKitStaleAfterDays, lastReviewedAt }
    })
  ];
}

function reviewAgentKitTrust(agentKit: LoadedAgentKit): ReviewItemCandidate[] {
  const items: ReviewItemCandidate[] = [];

  if (agentKit.manifest.visibility !== "local") {
    items.push(
      candidate({
        objectType: "agent_kit",
        type: "trust",
        severity: "warning",
        packId: agentKit.manifest.id,
        message: `Agent Kit visibility is ${agentKit.manifest.visibility}.`,
        suggestedAction: "Keep Agent Kits local until registry and trust workflows are implemented.",
        parts: [agentKit.manifest.id, "visibility", agentKit.manifest.visibility],
        metadata: { visibility: agentKit.manifest.visibility }
      })
    );
  }

  if (agentKit.manifest.trustLevel === "deprecated" || agentKit.manifest.trustLevel === "blocked") {
    const severity = agentKit.manifest.trustLevel === "blocked" ? "error" : "warning";
    items.push(
      candidate({
        objectType: "agent_kit",
        type: "trust",
        severity,
        packId: agentKit.manifest.id,
        message: `Agent Kit trust level is ${agentKit.manifest.trustLevel}.`,
        suggestedAction: "Review the Agent Kit trust level before recommending it for export.",
        parts: [agentKit.manifest.id, "trust", agentKit.manifest.trustLevel],
        metadata: { trustLevel: agentKit.manifest.trustLevel }
      })
    );
  }

  return items;
}

function reviewAgentKitExportReadiness(agentKit: LoadedAgentKit): ReviewItemCandidate[] {
  const items: ReviewItemCandidate[] = [];

  if (agentKit.exportProfiles.length === 0) {
    return [
      candidate({
        objectType: "agent_kit",
        type: "export_readiness",
        severity: "warning",
        packId: agentKit.manifest.id,
        message: "Agent Kit has no export profiles.",
        suggestedAction: "Add at least one export profile before showing this Agent Kit as export-ready.",
        parts: [agentKit.manifest.id, "missing-export-profiles"]
      })
    ];
  }

  if (!agentKit.exportProfiles.some((profile) => profile.id === agentKit.manifest.exportProfile)) {
    items.push(
      candidate({
        objectType: "agent_kit",
        type: "export_readiness",
        severity: "warning",
        packId: agentKit.manifest.id,
        message: `Agent Kit default export profile "${agentKit.manifest.exportProfile}" is missing.`,
        suggestedAction: "Add the default Agent Kit export profile or update the manifest exportProfile field.",
        parts: [agentKit.manifest.id, agentKit.manifest.exportProfile, "missing-default-export-profile"],
        metadata: { exportProfile: agentKit.manifest.exportProfile }
      })
    );
  }

  if (!agentKit.exportProfiles.some((profile) => profile.target === agentKit.manifest.target)) {
    items.push(
      candidate({
        objectType: "agent_kit",
        type: "target_compatibility",
        severity: "warning",
        packId: agentKit.manifest.id,
        message: `Agent Kit target "${agentKit.manifest.target}" has no matching export profile.`,
        suggestedAction: "Add a matching export profile or update the Agent Kit target.",
        parts: [agentKit.manifest.id, agentKit.manifest.target, "missing-target-export"],
        metadata: { target: agentKit.manifest.target }
      })
    );
  }

  return items;
}

function reviewAgentKitSafety(agentKit: LoadedAgentKit): ReviewItemCandidate[] {
  const manifest = agentKit.manifest as unknown as Record<string, unknown>;
  const items: ReviewItemCandidate[] = [];

  for (const field of ["containsExecutableCode", "requiresNetwork"]) {
    if (manifest[field] !== false) {
      items.push(
        candidate({
          objectType: "agent_kit",
          type: "safety_rules",
          severity: "error",
          packId: agentKit.manifest.id,
          message: `${field} must be false for Agent Kits.`,
          suggestedAction: "Remove executable or network capability claims from the Agent Kit manifest.",
          parts: [agentKit.manifest.id, field, String(manifest[field])],
          metadata: { field, value: manifest[field] }
        })
      );
    }
  }

  const permissions = isRecord(manifest.permissions) ? manifest.permissions : {};
  for (const permission of [
    "readVault",
    "writeDrafts",
    "runCommands",
    "networkAccess",
    "browserAutomation",
    "toolExecution"
  ]) {
    if (permissions[permission] !== false) {
      items.push(
        candidate({
          objectType: "agent_kit",
          type: "safety_rules",
          severity: "error",
          packId: agentKit.manifest.id,
          message: `permissions.${permission} must be false for Agent Kits.`,
          suggestedAction: "Keep Agent Kit permissions data-only and non-executable.",
          parts: [agentKit.manifest.id, "permissions", permission, String(permissions[permission])],
          metadata: { permission, value: permissions[permission] }
        })
      );
    }
  }

  if (agentKit.manifest.containsPersonalData && agentKit.manifest.privacyMode === "public_safe") {
    items.push(
      candidate({
        objectType: "agent_kit",
        type: "export_safety",
        severity: "error",
        packId: agentKit.manifest.id,
        message: "Agent Kit declares personal data while using public_safe privacy mode.",
        suggestedAction: "Switch to redacted mode or remove personal data before public-safe use.",
        parts: [agentKit.manifest.id, "personal-data-public-safe"],
        metadata: { containsPersonalData: true, privacyMode: agentKit.manifest.privacyMode }
      })
    );
  }

  if (agentKit.manifest.containsPersonalData && agentKit.manifest.privacyMode === "full") {
    items.push(
      candidate({
        objectType: "agent_kit",
        type: "export_safety",
        severity: "warning",
        packId: agentKit.manifest.id,
        message: "Agent Kit declares personal data while using full privacy mode.",
        suggestedAction: "Confirm this Agent Kit is only used locally or switch to redacted mode.",
        parts: [agentKit.manifest.id, "personal-data-full"],
        metadata: { containsPersonalData: true, privacyMode: agentKit.manifest.privacyMode }
      })
    );
  }

  return items;
}

function reviewAgentKitReferences(
  agentKit: LoadedAgentKit,
  references: AgentKitReferenceStatus[]
): ReviewItemCandidate[] {
  const items: ReviewItemCandidate[] = [];

  for (const reference of references) {
    const label = agentKitReferenceLabel(reference.kind);

    if (!reference.found) {
      items.push(
        candidate({
          objectType: "agent_kit",
          type: "source_coverage",
          severity: "error",
          packId: agentKit.manifest.id,
          message: `Agent Kit references missing ${label} "${reference.id}".`,
          suggestedAction: `Restore the referenced ${label} or remove it from the Agent Kit.`,
          parts: [agentKit.manifest.id, reference.kind, reference.id, "missing-reference"],
          metadata: { referenceKind: reference.kind, referenceId: reference.id }
        })
      );
      continue;
    }

    if (reference.trustLevel === "deprecated" || reference.trustLevel === "blocked") {
      const severity = reference.trustLevel === "blocked" ? "error" : "warning";
      items.push(
        candidate({
          objectType: "agent_kit",
          type: "trust",
          severity,
          packId: agentKit.manifest.id,
          message: `Agent Kit references ${label} "${reference.id}" with ${reference.trustLevel} trust.`,
          suggestedAction: `Replace or review the ${label} before using this Agent Kit.`,
          parts: [agentKit.manifest.id, reference.kind, reference.id, reference.trustLevel],
          metadata: { referenceKind: reference.kind, referenceId: reference.id, trustLevel: reference.trustLevel }
        })
      );
    }

    const activeIssueCount = reference.activeIssueCount ?? reference.reviewQueueCount ?? 0;
    if (activeIssueCount > 0) {
      const openCount = reference.reviewQueueCount ?? 0;
      const reviewItemPhrase =
        openCount > 0
          ? `${openCount} open review item(s)`
          : `${activeIssueCount} active accepted/reviewed review item(s)`;
      items.push(
        candidate({
          objectType: "agent_kit",
          type: "review_status",
          severity: (reference.activeErrorCount ?? reference.openErrorCount ?? 0) > 0 ? "error" : "warning",
          packId: agentKit.manifest.id,
          message: `Agent Kit references ${label} "${reference.id}" with ${reviewItemPhrase}.`,
          suggestedAction: `Resolve, ignore, or document the referenced ${label} review items before relying on this Agent Kit.`,
          parts: [agentKit.manifest.id, reference.kind, reference.id, "open-review-items"],
          metadata: {
            referenceKind: reference.kind,
            referenceId: reference.id,
            healthScore: reference.healthScore,
            healthStatus: reference.healthStatus,
            activeIssueCount,
            activeErrorCount: reference.activeErrorCount ?? 0,
            activeWarningCount: reference.activeWarningCount ?? 0,
            reviewQueueCount: reference.reviewQueueCount,
            openErrorCount: reference.openErrorCount ?? 0,
            openWarningCount: reference.openWarningCount ?? 0
          }
        })
      );
    }
  }

  return items;
}

function agentKitReferenceLabel(kind: AgentKitReferenceStatus["kind"]): string {
  return kind === "context_pack" ? "Context Pack" : "Skill";
}

function canonicalSkillTarget(target: string): string {
  return target === "generic_markdown" ? "markdown" : target;
}

function readFreshnessRules(pack: LoadedPack): Record<string, number> {
  return readFreshnessRulesFile(pack.packPath, pack.manifest.rulesPath);
}

function readFreshnessRulesFile(rootPath: string, rulesPath: string, defaultDays = 90): Record<string, number> {
  const file = path.join(rootPath, rulesPath, "freshness.yaml");
  if (!fs.existsSync(file)) {
    return { default: defaultDays };
  }

  try {
    const parsed = YAML.parse(fs.readFileSync(file, "utf8")) as { stale_after_days?: Record<string, number> };
    return parsed.stale_after_days ?? { default: defaultDays };
  } catch {
    return { default: defaultDays };
  }
}

function readRedactionTags(pack: LoadedPack): Set<string> {
  const tags = new Set(defaultRedactTags);
  const file = path.join(pack.packPath, pack.manifest.rulesPath, "redaction.yaml");
  if (!fs.existsSync(file)) {
    return tags;
  }

  try {
    const parsed = YAML.parse(fs.readFileSync(file, "utf8")) as { redact_tags?: string[] };
    for (const tag of parsed.redact_tags ?? []) {
      tags.add(tag);
    }
  } catch {
    return tags;
  }

  return tags;
}

function daysBetween(reviewedDate: string, now: Date): number {
  const reviewedAt = reviewedDateUtc(reviewedDate, now);
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.floor((nowUtc - reviewedAt) / 86_400_000));
}

function reviewedDateUtc(value: string, now: Date): number {
  const localDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (localDate) {
    return Date.UTC(Number(localDate[1]), Number(localDate[2]) - 1, Number(localDate[3]));
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  }

  return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

function candidate(options: {
  objectType?: ReviewObjectType;
  type: ReviewItemType;
  severity: ReviewItemSeverity;
  packId: string;
  recordId?: string;
  sourceId?: string;
  message: string;
  suggestedAction: string;
  parts: string[];
  metadata?: Record<string, unknown>;
}): ReviewItemCandidate {
  const objectType = options.objectType ?? "pack";
  const fingerprint = [objectType, ...options.parts].join("|");

  return {
    fingerprint,
    objectType,
    objectId: options.packId,
    type: options.type,
    severity: options.severity,
    packId: options.packId,
    skillId: objectType === "skill" ? options.packId : null,
    agentKitId: objectType === "agent_kit" ? options.packId : null,
    recordId: options.recordId ?? null,
    sourceId: options.sourceId ?? null,
    message: options.message,
    suggestedAction: options.suggestedAction,
    metadata: options.metadata ?? {}
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
