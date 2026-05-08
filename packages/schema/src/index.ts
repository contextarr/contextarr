import { z } from "zod";

export const idSchema = z.string().min(1).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/);
const isoDateTimeSchema = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString() : value),
  z.string().datetime({ offset: true })
);
const localDateSchema = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
);

export const trustLevelSchema = z.enum([
  "official",
  "verified",
  "community",
  "local",
  "unreviewed",
  "deprecated",
  "blocked"
]);

export const contextPackManifestSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    version: z.string().min(1),
    description: z.string().min(1),
    type: z.string().min(1),
    visibility: z.enum(["local", "private", "public"]),
    trustLevel: trustLevelSchema,
    author: z.string().min(1),
    license: z.string().min(1),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    lastReviewedAt: isoDateTimeSchema.nullable(),
    containsPersonalData: z.boolean(),
    containsExecutableCode: z.boolean(),
    requiresNetwork: z.boolean(),
    permissions: z
      .object({
        readVault: z.boolean(),
        writeDrafts: z.boolean(),
        runCommands: z.boolean(),
        networkAccess: z.boolean()
      })
      .passthrough(),
    recordsPath: z.string().min(1),
    sourcesPath: z.string().min(1),
    exportsPath: z.string().min(1),
    rulesPath: z.string().min(1),
    assets: z
      .object({
        coverImage: z.string().min(1).optional(),
        accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
      })
      .passthrough(),
    compatibility: z
      .object({
        contextarr: z.string().min(1)
      })
      .passthrough()
  })
  .passthrough();

export const recordFrontmatterSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    type: z.string().min(1),
    pack: idSchema,
    tags: z.array(z.string().min(1)).default([]),
    confidence: z.enum(["low", "medium", "high", "unknown"]),
    source_status: z.enum(["source_backed", "manual", "draft", "unsourced", "imported"]),
    freshness: z.enum(["current", "stale", "unknown"]),
    privacy: z.enum(["public_safe", "internal", "private", "sensitive", "secret"]),
    last_reviewed: localDateSchema.optional(),
    sources: z.array(idSchema).default([]),
    review_status: z.enum(["approved", "needs_review", "draft", "rejected"])
  })
  .passthrough();

export const sourceSchema = z
  .object({
    id: idSchema,
    type: z.string().min(1),
    title: z.string().min(1),
    url: z.string().url().optional(),
    path: z.string().min(1).optional(),
    retrieved_at: isoDateTimeSchema.optional(),
    license: z.string().min(1).optional(),
    license_url: z.string().url().optional(),
    license_status: z
      .enum(["known_permissive", "known_copyleft", "known_restricted", "unknown", "not_applicable"])
      .optional(),
    license_notes: z.string().min(1).optional(),
    content_hash_algorithm: z.literal("sha256").optional(),
    content_hash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    hash_calculated_at: isoDateTimeSchema.optional(),
    last_checked_at: isoDateTimeSchema.optional(),
    stale_after_days: z.number().int().positive().optional(),
    stale_reason: z.string().min(1).optional(),
    trust: trustLevelSchema.or(z.string().min(1)).optional(),
    status: z.enum(["current", "stale", "missing", "unknown"]).or(z.string().min(1)).optional()
  })
  .passthrough();

export const sourceMapSchema = z
  .object({
    sources: z.array(sourceSchema)
  })
  .passthrough();

export const exportProfileSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    target: z.enum(["chatgpt", "claude", "codex", "generic_markdown", "json", "agents_md", "claude_md", "llms_txt"]),
    format: z.enum(["markdown", "json", "csv", "html", "text"]),
    privacy_mode: z.enum(["redacted", "full", "public_safe"]).optional(),
    include: z
      .object({
        records: z.array(idSchema).optional()
      })
      .passthrough()
      .optional(),
    exclude_tags: z.array(z.string().min(1)).default([]),
    token_budget: z.number().int().positive().optional(),
    sections: z.array(z.string().min(1)).default([])
  })
  .passthrough();

export const skillManifestSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    version: z.string().min(1),
    description: z.string().min(1),
    type: z.string().min(1),
    visibility: z.enum(["local", "private", "public"]),
    trustLevel: trustLevelSchema,
    author: z.string().min(1),
    license: z.string().min(1),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    lastReviewedAt: isoDateTimeSchema.nullable(),
    containsPersonalData: z.boolean(),
    containsExecutableCode: z.boolean(),
    requiresNetwork: z.boolean(),
    permissions: z
      .object({
        readVault: z.boolean().default(false),
        writeDrafts: z.boolean().default(false),
        runCommands: z.boolean(),
        networkAccess: z.boolean(),
        browserAutomation: z.boolean(),
        toolExecution: z.boolean()
      })
      .passthrough(),
    instructionsPath: z.string().min(1),
    examplesPath: z.string().min(1),
    sourcesPath: z.string().min(1),
    exportsPath: z.string().min(1),
    rulesPath: z.string().min(1),
    targets: z.array(z.string().min(1)).default([]),
    inputs: z.array(z.string().min(1)).default([]),
    outputs: z.array(z.string().min(1)).default([]),
    assets: z
      .object({
        coverImage: z.string().min(1).optional(),
        accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
      })
      .passthrough()
      .default({}),
    compatibility: z
      .object({
        contextarr: z.string().min(1)
      })
      .passthrough()
  })
  .passthrough();

export const skillInstructionFrontmatterSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    type: z.string().min(1),
    skill: idSchema,
    tags: z.array(z.string().min(1)).default([]),
    confidence: z.enum(["low", "medium", "high", "unknown"]),
    source_status: z.enum(["source_backed", "authored", "manual", "draft", "unsourced", "imported"]),
    freshness: z.enum(["current", "stale", "unknown"]),
    privacy: z.enum(["public_safe", "internal", "private", "sensitive", "secret"]),
    last_reviewed: localDateSchema.optional(),
    sources: z.array(idSchema).default([]),
    review_status: z.enum(["approved", "needs_review", "draft", "rejected"])
  })
  .passthrough();

export const skillExportProfileSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    target: z.string().min(1),
    format: z.enum(["markdown", "json", "text"]),
    privacy_mode: z.enum(["redacted", "full", "public_safe"]).optional(),
    include: z
      .object({
        instructions: z.array(idSchema).optional(),
        examples: z.array(idSchema).optional()
      })
      .passthrough()
      .optional(),
    exclude_tags: z.array(z.string().min(1)).default([]),
    token_budget: z.number().int().positive().optional(),
    sections: z.array(z.string().min(1)).default([])
  })
  .passthrough();

export const skillSafetyRulesSchema = z
  .object({
    disallowed: z
      .object({
        executable_files: z.boolean().default(true),
        shell_commands: z.boolean().default(true),
        network_calls: z.boolean().default(true),
        credential_requests: z.boolean().default(true),
        browser_automation: z.boolean().default(true),
        hidden_prompts: z.boolean().default(true),
        tool_execution: z.boolean().default(true)
      })
      .passthrough()
      .default({}),
    patterns: z
      .array(
        z
          .object({
            name: idSchema,
            regex: z.string().min(1),
            severity: z.enum(["critical", "high", "medium", "low"]),
            action: z.enum(["block", "review", "warn"])
          })
          .passthrough()
      )
      .default([])
  })
  .passthrough();

export const agentKitManifestSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    version: z.string().min(1),
    description: z.string().min(1),
    type: z.string().min(1),
    visibility: z.enum(["local", "private", "public"]),
    trustLevel: trustLevelSchema,
    author: z.string().min(1),
    license: z.string().min(1),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    lastReviewedAt: isoDateTimeSchema.nullable(),
    containsPersonalData: z.boolean(),
    containsExecutableCode: z.boolean(),
    requiresNetwork: z.boolean(),
    permissions: z
      .object({
        readVault: z.literal(false).default(false),
        writeDrafts: z.literal(false).default(false),
        runCommands: z.literal(false).default(false),
        networkAccess: z.literal(false).default(false),
        browserAutomation: z.literal(false).default(false),
        toolExecution: z.literal(false).default(false)
      })
      .strict()
      .default({}),
    contextPacks: z.array(idSchema).min(1),
    skills: z.array(idSchema).min(1),
    target: z.string().min(1),
    exportProfile: idSchema,
    privacyMode: z.enum(["redacted", "full", "public_safe"]).default("redacted"),
    tokenBudget: z.number().int().positive().optional(),
    rulesPath: z.string().min(1),
    exportsPath: z.string().min(1),
    examplesPath: z.string().min(1).optional(),
    assets: z
      .object({
        coverImage: z.string().min(1).optional(),
        accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
      })
      .strict()
      .default({}),
    compatibility: z
      .object({
        contextarr: z.string().min(1)
      })
      .strict()
  })
  .strict();

export const agentKitExportProfileSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    target: z.string().min(1),
    format: z.enum(["markdown", "json", "text"]),
    privacy_mode: z.enum(["redacted", "full", "public_safe"]).default("redacted"),
    include: z
      .object({
        context_packs: z.array(idSchema).optional(),
        skills: z.array(idSchema).optional()
      })
      .strict()
      .optional(),
    exclude_tags: z.array(z.string().min(1)).default([]),
    token_budget: z.number().int().positive().optional(),
    sections: z.array(z.string().min(1)).default([])
  })
  .strict();

export const agentKitCompatibilityRulesSchema = z
  .object({
    supported_targets: z.array(z.string().min(1)).default([]),
    required_context_packs: z.array(idSchema).default([]),
    required_skills: z.array(idSchema).default([]),
    allow_unreviewed_drafts: z.boolean().default(false),
    blocked_trust_levels: z.array(trustLevelSchema.or(z.string().min(1))).default([]),
    pairings: z
      .array(
        z
          .object({
            context_pack: idSchema.optional(),
            skill: idSchema.optional(),
            target: z.string().min(1).optional(),
            status: z.enum(["supported", "warning", "blocked"]).default("supported")
          })
          .strict()
      )
      .default([])
  })
  .strict();

export const validationRulesSchema = z
  .object({
    required_fields: z
      .object({
        record: z.array(z.string().min(1)).default([])
      })
      .passthrough()
      .optional(),
    checks: z.array(z.string().min(1)).default([])
  })
  .passthrough();

export const redactionRulesSchema = z
  .object({
    redact_tags: z.array(z.string().min(1)).default([]),
    patterns: z
      .array(
        z
          .object({
            name: idSchema,
            regex: z.string().min(1),
            flags: z.string().optional(),
            action: z.enum(["remove", "mask", "warn"])
          })
          .passthrough()
      )
      .default([])
  })
  .passthrough();

export const freshnessRulesSchema = z
  .object({
    stale_after_days: z.record(z.number().int().positive())
  })
  .passthrough();

export type ContextPackManifest = z.infer<typeof contextPackManifestSchema>;
export type RecordFrontmatter = z.infer<typeof recordFrontmatterSchema>;
export type SourceMap = z.infer<typeof sourceMapSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type ExportProfile = z.infer<typeof exportProfileSchema>;
export type ValidationRules = z.infer<typeof validationRulesSchema>;
export type RedactionRules = z.infer<typeof redactionRulesSchema>;
export type FreshnessRules = z.infer<typeof freshnessRulesSchema>;
export type SkillManifest = z.infer<typeof skillManifestSchema>;
export type SkillInstructionFrontmatter = z.infer<typeof skillInstructionFrontmatterSchema>;
export type SkillExportProfile = z.infer<typeof skillExportProfileSchema>;
export type SkillSafetyRules = z.infer<typeof skillSafetyRulesSchema>;
export type AgentKitManifest = z.infer<typeof agentKitManifestSchema>;
export type AgentKitExportProfile = z.infer<typeof agentKitExportProfileSchema>;
export type AgentKitCompatibilityRules = z.infer<typeof agentKitCompatibilityRulesSchema>;
