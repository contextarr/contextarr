import path from "node:path";
import type { ContextarrDatabase } from "./db";
import { clearDerivedIndex } from "./db";
import {
  buildHealthChecks,
  calculateHealthScore,
  createReviewItemId,
  generatePackReviewItems,
  generateSkippedPackReviewItems,
  generateSkillReviewItems,
  generateSkippedSkillReviewItems,
  type ReviewItemCandidate
} from "./health";
import { loadAgentKits } from "./agent-kit-loader";
import { loadPacks } from "./pack-loader";
import { loadSkills } from "./skill-loader";
import type {
  AgentKitSummary,
  LoadedAgentKit,
  LoadedPack,
  LoadedSkill,
  LoadedSkillDocument,
  PackHealthDetail,
  PackSummary,
  RebuildIndexResult,
  ReviewItem,
  ReviewItemFilters,
  ReviewObjectType,
  ReviewItemStatus,
  SkippedAgentKit,
  SkillHealthDetail,
  SkillSummary
} from "./types";

export const reviewItemStatuses: ReviewItemStatus[] = ["open", "ignored", "accepted", "reviewed", "resolved"];

export function rebuildIndex(
  db: ContextarrDatabase,
  packsDir: string,
  skillsDir?: string,
  agentKitsDir?: string
): RebuildIndexResult {
  const indexedAt = new Date().toISOString();
  const loaded = loadPacks(packsDir);
  const loadedSkills = skillsDir ? loadSkills(skillsDir) : { skills: [], skipped: [] };
  const loadedAgentKits = agentKitsDir
    ? filterAgentKitsWithAvailableReferences(
        loadAgentKits(agentKitsDir, { contextPacksDir: packsDir, skillsDir }),
        new Set(loaded.packs.map((pack) => pack.manifest.id)),
        new Set(loadedSkills.skills.map((skill) => skill.manifest.id))
      )
    : { agentKits: [], skipped: [] };
  const reviewCandidates = [
    ...loaded.packs.flatMap((pack) => generatePackReviewItems(pack, new Date(indexedAt))),
    ...loaded.skipped.flatMap((skipped) => generateSkippedPackReviewItems(skipped)),
    ...loadedSkills.skills.flatMap((skill) => generateSkillReviewItems(skill, new Date(indexedAt))),
    ...loadedSkills.skipped.flatMap((skipped) => generateSkippedSkillReviewItems(skipped))
  ];

  const transaction = db.transaction(() => {
    const reviewItems = syncReviewItems(db, reviewCandidates, indexedAt);
    const reviewItemsByObject = groupReviewItemsByObject(reviewItems);

    clearDerivedIndex(db);

    for (const pack of loaded.packs) {
      const packReviewItems = reviewItemsByObject.get(reviewObjectKey("pack", pack.manifest.id)) ?? [];
      const health = calculateHealthScore(packReviewItems);
      insertPack(db, pack, indexedAt, health);
      insertRecords(db, pack);
      insertSources(db, pack);
      insertExportProfiles(db, pack);
      insertPackHealth(db, pack, indexedAt, health);
    }

    for (const skill of loadedSkills.skills) {
      const skillReviewItems = reviewItemsByObject.get(reviewObjectKey("skill", skill.manifest.id)) ?? [];
      const health = calculateHealthScore(skillReviewItems);
      insertSkill(db, skill, indexedAt, health);
      insertSkillDocuments(db, "skill_instructions", skill, skill.instructions);
      insertSkillDocuments(db, "skill_examples", skill, skill.examples);
      insertSkillSources(db, skill);
      insertSkillExportProfiles(db, skill);
    }

    for (const agentKit of loadedAgentKits.agentKits) {
      const health = calculateHealthScore([]);
      insertAgentKit(db, agentKit, indexedAt, health);
      insertAgentKitRelationships(db, agentKit);
      insertAgentKitExportProfiles(db, agentKit);
    }

    db.prepare(
      `INSERT INTO events (type, message, created_at, metadata_json)
       VALUES (?, ?, ?, ?)`
    ).run(
      "index.rebuilt",
      "Rebuilt local pack index from configured packs directory.",
      indexedAt,
      JSON.stringify({
        packsDir,
        skillsDir,
        agentKitsDir,
        packsIndexed: loaded.packs.length,
        packsSkipped: loaded.skipped.length,
        skillsIndexed: loadedSkills.skills.length,
        skillsSkipped: loadedSkills.skipped.length,
        agentKitsIndexed: loadedAgentKits.agentKits.length,
        agentKitsSkipped: loadedAgentKits.skipped.length
      })
    );
  });

  transaction();

  return {
    indexedAt,
    packsIndexed: loaded.packs.length,
    packsSkipped: loaded.skipped.length,
    recordsIndexed: loaded.packs.reduce((count, pack) => count + pack.records.length, 0),
    sourcesIndexed: loaded.packs.reduce((count, pack) => count + pack.sources.length, 0),
    exportProfilesIndexed: loaded.packs.reduce((count, pack) => count + pack.exportProfiles.length, 0),
    skillsIndexed: loadedSkills.skills.length,
    skillsSkipped: loadedSkills.skipped.length,
    skillInstructionsIndexed: loadedSkills.skills.reduce((count, skill) => count + skill.instructions.length, 0),
    skillExamplesIndexed: loadedSkills.skills.reduce((count, skill) => count + skill.examples.length, 0),
    skillSourcesIndexed: loadedSkills.skills.reduce((count, skill) => count + skill.sources.length, 0),
    skillExportProfilesIndexed: loadedSkills.skills.reduce((count, skill) => count + skill.exportProfiles.length, 0),
    agentKitsIndexed: loadedAgentKits.agentKits.length,
    agentKitsSkipped: loadedAgentKits.skipped.length,
    agentKitContextPackRefsIndexed: loadedAgentKits.agentKits.reduce(
      (count, agentKit) => count + agentKit.manifest.contextPacks.length,
      0
    ),
    agentKitSkillRefsIndexed: loadedAgentKits.agentKits.reduce(
      (count, agentKit) => count + agentKit.manifest.skills.length,
      0
    ),
    agentKitExportProfilesIndexed: loadedAgentKits.agentKits.reduce(
      (count, agentKit) => count + agentKit.exportProfiles.length,
      0
    ),
    reviewItemsGenerated: reviewCandidates.length,
    skipped: loaded.skipped,
    skippedSkills: loadedSkills.skipped,
    skippedAgentKits: loadedAgentKits.skipped
  };
}

export function getIndexStats(db: ContextarrDatabase): {
  packs: number;
  records: number;
  sources: number;
  exportProfiles: number;
  skills: number;
  skillInstructions: number;
  skillExamples: number;
  skillSources: number;
  skillExportProfiles: number;
  agentKits: number;
  agentKitContextPackRefs: number;
  agentKitSkillRefs: number;
  agentKitExportProfiles: number;
  reviewItems: number;
  openReviewItems: number;
  lastIndexedAt: string | null;
} {
  return {
    packs: getCount(db, "packs"),
    records: getCount(db, "records"),
    sources: getCount(db, "sources"),
    exportProfiles: getCount(db, "export_profiles"),
    skills: getCount(db, "skills"),
    skillInstructions: getCount(db, "skill_instructions"),
    skillExamples: getCount(db, "skill_examples"),
    skillSources: getCount(db, "skill_sources"),
    skillExportProfiles: getCount(db, "skill_export_profiles"),
    agentKits: getCount(db, "agent_kits"),
    agentKitContextPackRefs: getCount(db, "agent_kit_context_packs"),
    agentKitSkillRefs: getCount(db, "agent_kit_skills"),
    agentKitExportProfiles: getCount(db, "agent_kit_export_profiles"),
    reviewItems: getCount(db, "review_items"),
    openReviewItems: getReviewItems(db, { status: "open" }).length,
    lastIndexedAt:
      db
        .prepare("SELECT created_at FROM events WHERE type = ? ORDER BY id DESC LIMIT 1")
        .pluck()
        .get("index.rebuilt") as string | undefined ?? null
  };
}

function filterAgentKitsWithAvailableReferences(
  result: { agentKits: LoadedAgentKit[]; skipped: SkippedAgentKit[] },
  availablePackIds: Set<string>,
  availableSkillIds: Set<string>
): { agentKits: LoadedAgentKit[]; skipped: SkippedAgentKit[] } {
  const agentKits: LoadedAgentKit[] = [];
  const skipped: SkippedAgentKit[] = [...result.skipped];

  for (const agentKit of result.agentKits) {
    const missingPackIds = agentKit.manifest.contextPacks.filter((packId) => !availablePackIds.has(packId));
    const missingSkillIds = agentKit.manifest.skills.filter((skillId) => !availableSkillIds.has(skillId));

    if (missingPackIds.length === 0 && missingSkillIds.length === 0) {
      agentKits.push(agentKit);
      continue;
    }

    skipped.push({
      agentKitPath: agentKit.agentKitPath,
      agentKitId: agentKit.manifest.id,
      issues: [
        ...missingPackIds.map((packId) => ({
          severity: "error" as const,
          code: "agent_kit_reference.unindexed_context_pack",
          message: `Agent Kit references a Context Pack that is not loaded in the current index: ${packId}`,
          path: "contextPacks"
        })),
        ...missingSkillIds.map((skillId) => ({
          severity: "error" as const,
          code: "agent_kit_reference.unindexed_skill",
          message: `Agent Kit references a Skill that is not loaded in the current index: ${skillId}`,
          path: "skills"
        }))
      ]
    });
  }

  return { agentKits, skipped };
}

export function getPacks(db: ContextarrDatabase): PackSummary[] {
  return db
    .prepare(
      `SELECT
        id, name, version, description, type, visibility, trust_level AS trustLevel,
        health_score AS healthScore, health_status AS healthStatus,
        validation_errors AS validationErrors, validation_warnings AS validationWarnings,
        record_count AS recordCount, source_count AS sourceCount,
        export_profile_count AS exportProfileCount, accent_color AS accentColor,
        cover_image AS coverImage, review_queue_count AS reviewQueueCount,
        last_reviewed_at AS lastReviewedAt, updated_at AS updatedAt
      FROM packs
      ORDER BY name`
    )
    .all() as PackSummary[];
}

export function getPack(db: ContextarrDatabase, packId: string): unknown | undefined {
  const pack = db.prepare("SELECT * FROM packs WHERE id = ?").get(packId) as Row | undefined;
  if (!pack) {
    return undefined;
  }

  const sources = db
    .prepare("SELECT id, type, title, url, path, retrieved_at AS retrievedAt, license, trust, status FROM sources WHERE pack_id = ? ORDER BY id")
    .all(packId);
  const exportProfiles = db
    .prepare("SELECT id, name, target, format, privacy_mode AS privacyMode, token_budget AS tokenBudget FROM export_profiles WHERE pack_id = ? ORDER BY id")
    .all(packId);
  const health = db.prepare("SELECT score, status, validation_errors AS validationErrors, validation_warnings AS validationWarnings, record_count AS recordCount, source_count AS sourceCount, export_profile_count AS exportProfileCount, updated_at AS updatedAt FROM pack_health WHERE pack_id = ?").get(packId);

  return {
    id: pack.id,
    name: pack.name,
    version: pack.version,
    description: pack.description,
    type: pack.type,
    visibility: pack.visibility,
    trustLevel: pack.trust_level,
    author: pack.author,
    license: pack.license,
    createdAt: pack.created_at,
    updatedAt: pack.updated_at,
    lastReviewedAt: pack.last_reviewed_at,
    accentColor: pack.accent_color,
    coverImage: pack.cover_image,
    reviewQueueCount: pack.review_queue_count,
    packPath: pack.pack_path,
    manifest: JSON.parse(String(pack.manifest_json)),
    counts: {
      records: pack.record_count,
      sources: pack.source_count,
      exportProfiles: pack.export_profile_count
    },
    validation: {
      errors: pack.validation_errors,
      warnings: pack.validation_warnings
    },
    health,
    sources,
    exportProfiles
  };
}

export function getPackPath(db: ContextarrDatabase, packId: string): string | undefined {
  return db.prepare("SELECT pack_path FROM packs WHERE id = ?").pluck().get(packId) as string | undefined;
}

export function getSkillPath(db: ContextarrDatabase, skillId: string): string | undefined {
  return db.prepare("SELECT skill_path FROM skills WHERE id = ?").pluck().get(skillId) as string | undefined;
}

export function getSkills(db: ContextarrDatabase): SkillSummary[] {
  return db
    .prepare(
      `SELECT
        id, name, version, description, type, visibility, trust_level AS trustLevel,
        health_score AS healthScore, health_status AS healthStatus,
        validation_errors AS validationErrors, validation_warnings AS validationWarnings,
        instruction_count AS instructionCount, example_count AS exampleCount,
        source_count AS sourceCount, export_profile_count AS exportProfileCount,
        accent_color AS accentColor, cover_image AS coverImage,
        review_queue_count AS reviewQueueCount, last_reviewed_at AS lastReviewedAt,
        updated_at AS updatedAt, targets_json AS targetsJson, inputs_json AS inputsJson,
        outputs_json AS outputsJson
      FROM skills
      ORDER BY name`
    )
    .all()
    .map((skill) => normalizeSkillSummary(skill as Row));
}

export function getSkill(db: ContextarrDatabase, skillId: string): unknown | undefined {
  const skill = db.prepare("SELECT * FROM skills WHERE id = ?").get(skillId) as Row | undefined;
  if (!skill) {
    return undefined;
  }

  const sources = getSkillSources(db, skillId);
  const exportProfiles = getSkillExportProfiles(db, skillId);

  return {
    id: skill.id,
    name: skill.name,
    version: skill.version,
    description: skill.description,
    type: skill.type,
    visibility: skill.visibility,
    trustLevel: skill.trust_level,
    author: skill.author,
    license: skill.license,
    createdAt: skill.created_at,
    updatedAt: skill.updated_at,
    lastReviewedAt: skill.last_reviewed_at,
    accentColor: skill.accent_color,
    coverImage: null,
    reviewQueueCount: skill.review_queue_count,
    healthScore: skill.health_score,
    healthStatus: skill.health_status,
    validationErrors: skill.validation_errors,
    validationWarnings: skill.validation_warnings,
    instructionCount: skill.instruction_count,
    exampleCount: skill.example_count,
    sourceCount: skill.source_count,
    exportProfileCount: skill.export_profile_count,
    manifest: sanitizeSkillManifestForApi(JSON.parse(String(skill.manifest_json)) as Record<string, unknown>),
    targets: JSON.parse(String(skill.targets_json)),
    inputs: JSON.parse(String(skill.inputs_json)),
    outputs: JSON.parse(String(skill.outputs_json)),
    counts: {
      instructions: skill.instruction_count,
      examples: skill.example_count,
      sources: skill.source_count,
      exportProfiles: skill.export_profile_count
    },
    validation: {
      errors: skill.validation_errors,
      warnings: skill.validation_warnings
    },
    health: {
      score: skill.health_score,
      status: skill.health_status
    },
    sources,
    exportProfiles
  };
}

export function getSkillInstructions(
  db: ContextarrDatabase,
  skillId: string,
  filters: { q?: string; tag?: string; type?: string } = {}
): unknown[] {
  return getSkillDocuments(db, "skill_instructions", skillId, filters);
}

export function getSkillExamples(
  db: ContextarrDatabase,
  skillId: string,
  filters: { q?: string; tag?: string; type?: string } = {}
): unknown[] {
  return getSkillDocuments(db, "skill_examples", skillId, filters);
}

export function getSkillExportProfiles(db: ContextarrDatabase, skillId: string): unknown[] {
  return db
    .prepare(
      `SELECT id, name, target, format, privacy_mode AS privacyMode, token_budget AS tokenBudget
       FROM skill_export_profiles
       WHERE skill_id = ?
       ORDER BY id`
    )
    .all(skillId);
}

export function getSkillSources(db: ContextarrDatabase, skillId: string): unknown[] {
  return db
    .prepare(
      `SELECT id, type, title, url, retrieved_at AS retrievedAt, license, trust, status
       FROM skill_sources
       WHERE skill_id = ?
       ORDER BY id`
    )
    .all(skillId);
}

export function getAgentKits(db: ContextarrDatabase): AgentKitSummary[] {
  return db
    .prepare(
      `SELECT
        id, name, version, description, type, visibility, trust_level AS trustLevel,
        health_score AS healthScore, health_status AS healthStatus,
        validation_errors AS validationErrors, validation_warnings AS validationWarnings,
        context_pack_count AS contextPackCount, skill_count AS skillCount,
        export_profile_count AS exportProfileCount, accent_color AS accentColor,
        cover_image AS coverImage, review_queue_count AS reviewQueueCount,
        last_reviewed_at AS lastReviewedAt, updated_at AS updatedAt,
        target, privacy_mode AS privacyMode
      FROM agent_kits
      ORDER BY name`
    )
    .all()
    .map((agentKit) => normalizeAgentKitSummary(agentKit as Row));
}

export function getAgentKit(db: ContextarrDatabase, agentKitId: string): unknown | undefined {
  const agentKit = db.prepare("SELECT * FROM agent_kits WHERE id = ?").get(agentKitId) as Row | undefined;
  if (!agentKit) {
    return undefined;
  }

  const contextPacks = getAgentKitContextPacks(db, agentKitId);
  const skills = getAgentKitSkills(db, agentKitId);
  const exportProfiles = getAgentKitExportProfiles(db, agentKitId);

  return {
    id: agentKit.id,
    name: agentKit.name,
    version: agentKit.version,
    description: agentKit.description,
    type: agentKit.type,
    visibility: agentKit.visibility,
    trustLevel: agentKit.trust_level,
    author: agentKit.author,
    license: agentKit.license,
    createdAt: agentKit.created_at,
    updatedAt: agentKit.updated_at,
    lastReviewedAt: agentKit.last_reviewed_at,
    accentColor: agentKit.accent_color,
    coverImage: safePublicAssetRef(typeof agentKit.cover_image === "string" ? agentKit.cover_image : undefined),
    reviewQueueCount: agentKit.review_queue_count,
    healthScore: agentKit.health_score,
    healthStatus: agentKit.health_status,
    validationErrors: agentKit.validation_errors,
    validationWarnings: agentKit.validation_warnings,
    contextPackCount: agentKit.context_pack_count,
    skillCount: agentKit.skill_count,
    exportProfileCount: agentKit.export_profile_count,
    target: agentKit.target,
    privacyMode: agentKit.privacy_mode,
    tokenBudget: agentKit.token_budget,
    manifest: sanitizeAgentKitManifestForApi(JSON.parse(String(agentKit.manifest_json)) as Record<string, unknown>),
    counts: {
      contextPacks: agentKit.context_pack_count,
      skills: agentKit.skill_count,
      exportProfiles: agentKit.export_profile_count
    },
    validation: {
      errors: agentKit.validation_errors,
      warnings: agentKit.validation_warnings
    },
    health: {
      score: agentKit.health_score,
      status: agentKit.health_status
    },
    contextPacks,
    skills,
    exportProfiles
  };
}

export function getAgentKitPath(db: ContextarrDatabase, agentKitId: string): string | undefined {
  return db.prepare("SELECT agent_kit_path FROM agent_kits WHERE id = ?").pluck().get(agentKitId) as string | undefined;
}

export function getAgentKitContextPacks(db: ContextarrDatabase, agentKitId: string): unknown[] {
  return db
    .prepare(
      `SELECT
        packs.id, packs.name, packs.description, packs.type, packs.visibility,
        packs.trust_level AS trustLevel, packs.health_score AS healthScore,
        packs.health_status AS healthStatus, packs.record_count AS recordCount,
        packs.source_count AS sourceCount, packs.export_profile_count AS exportProfileCount,
        packs.accent_color AS accentColor, packs.cover_image AS coverImage,
        agent_kit_context_packs.sort_order AS sortOrder
       FROM agent_kit_context_packs
       JOIN packs ON packs.id = agent_kit_context_packs.pack_id
       WHERE agent_kit_context_packs.agent_kit_id = ?
       ORDER BY agent_kit_context_packs.sort_order`
    )
    .all(agentKitId)
    .map((pack) => normalizeAgentKitContextPackSummary(pack as Row));
}

export function getAgentKitSkills(db: ContextarrDatabase, agentKitId: string): unknown[] {
  return db
    .prepare(
      `SELECT
        skills.id, skills.name, skills.description, skills.type, skills.visibility,
        skills.trust_level AS trustLevel, skills.health_score AS healthScore,
        skills.health_status AS healthStatus, skills.instruction_count AS instructionCount,
        skills.example_count AS exampleCount, skills.source_count AS sourceCount,
        skills.export_profile_count AS exportProfileCount, skills.targets_json AS targetsJson,
        agent_kit_skills.sort_order AS sortOrder
       FROM agent_kit_skills
       JOIN skills ON skills.id = agent_kit_skills.skill_id
       WHERE agent_kit_skills.agent_kit_id = ?
       ORDER BY agent_kit_skills.sort_order`
    )
    .all(agentKitId)
    .map((skill) => {
      const { targetsJson, ...rest } = skill as Row;
      return {
        ...rest,
        targets: JSON.parse(String(targetsJson))
      };
    });
}

export function getAgentKitExportProfiles(db: ContextarrDatabase, agentKitId: string): unknown[] {
  return db
    .prepare(
      `SELECT id, name, target, format, privacy_mode AS privacyMode, token_budget AS tokenBudget
       FROM agent_kit_export_profiles
       WHERE agent_kit_id = ?
       ORDER BY id`
    )
    .all(agentKitId);
}

export function getAgentKitExportProfilePreview(
  db: ContextarrDatabase,
  agentKitId: string,
  profileId: string
): unknown | undefined {
  const agentKit = db.prepare("SELECT * FROM agent_kits WHERE id = ?").get(agentKitId) as Row | undefined;
  if (!agentKit) {
    return undefined;
  }

  const profile = db
    .prepare("SELECT * FROM agent_kit_export_profiles WHERE agent_kit_id = ? AND id = ?")
    .get(agentKitId, profileId) as Row | undefined;
  if (!profile) {
    return undefined;
  }

  const manifest = JSON.parse(String(agentKit.manifest_json)) as Record<string, unknown>;
  const profileJson = JSON.parse(String(profile.profile_json)) as Record<string, unknown>;
  const include = isRecord(profileJson.include) ? profileJson.include : {};
  const selectedPackIds = arrayOfStrings(include.context_packs) ?? arrayOfStrings(manifest.contextPacks) ?? [];
  const selectedSkillIds = arrayOfStrings(include.skills) ?? arrayOfStrings(manifest.skills) ?? [];

  return {
    agentKitId,
    profileId,
    target: profile.target,
    format: profile.format,
    privacyMode: profile.privacy_mode,
    tokenBudget: profile.token_budget,
    filename: `${profileId}.${profile.format === "json" ? "json" : profile.format === "text" ? "txt" : "md"}`,
    content: null,
    contentStatus: "scheduled_for_phase_24",
    includedContextPacks: orderByIds(getAgentKitContextPacks(db, agentKitId), selectedPackIds),
    includedSkills: orderByIds(getAgentKitSkills(db, agentKitId), selectedSkillIds),
    warnings: [
      {
        code: "agent_kit_export_engine_later",
        message: "Agent Kit export content generation is scheduled for Phase 24."
      }
    ]
  };
}

export function getReviewItems(db: ContextarrDatabase, filters: ReviewItemFilters = {}): ReviewItem[] {
  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.status) {
    where.push("status = ?");
    values.push(filters.status);
  }

  if (filters.severity) {
    where.push("severity = ?");
    values.push(filters.severity);
  }

  if (filters.type) {
    where.push("type = ?");
    values.push(filters.type);
  }

  if (filters.objectType) {
    where.push("object_type = ?");
    values.push(filters.objectType);
  }

  if (filters.objectId) {
    where.push("object_id = ?");
    values.push(filters.objectId);
  }

  if (filters.packId) {
    where.push("object_type = 'pack' AND object_id = ?");
    values.push(filters.packId);
  }

  if (filters.skillId) {
    where.push("object_type = 'skill' AND object_id = ?");
    values.push(filters.skillId);
  }

  const sql = `
    SELECT *
    FROM review_items
    ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY
      CASE severity WHEN 'error' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
      last_seen_at DESC,
      object_type,
      object_id,
      type,
      id
  `;

  return db
    .prepare(sql)
    .all(...values)
    .map((row) => normalizeReviewItem(row as Row));
}

export function getPackHealth(db: ContextarrDatabase, packId: string): PackHealthDetail | undefined {
  const health = db
    .prepare("SELECT pack_id AS packId, score, status FROM pack_health WHERE pack_id = ?")
    .get(packId) as Row | undefined;
  if (!health) {
    return undefined;
  }

  const items = getReviewItems(db, { packId }).filter((item) => item.status !== "resolved");
  const score = calculateHealthScore(items);

  return {
    packId,
    score: Number(health.score),
    status: String(health.status),
    reviewQueueCount: score.reviewQueueCount,
    checks: buildHealthChecks(items),
    items
  };
}

export function getSkillHealth(db: ContextarrDatabase, skillId: string): SkillHealthDetail | undefined {
  const skill = db
    .prepare("SELECT id AS skillId, health_score AS score, health_status AS status FROM skills WHERE id = ?")
    .get(skillId) as Row | undefined;
  if (!skill) {
    return undefined;
  }

  const items = getReviewItems(db, { skillId }).filter((item) => item.status !== "resolved");
  const score = calculateHealthScore(items);

  return {
    skillId,
    score: Number(skill.score),
    status: String(skill.status),
    reviewQueueCount: score.reviewQueueCount,
    checks: buildHealthChecks(items),
    items
  };
}

export function updateReviewItemStatus(
  db: ContextarrDatabase,
  itemId: string,
  status: ReviewItemStatus,
  updatedAt = new Date().toISOString()
): ReviewItem | undefined {
  const existing = db.prepare("SELECT * FROM review_items WHERE id = ?").get(itemId) as Row | undefined;
  if (!existing) {
    return undefined;
  }

  db.prepare("UPDATE review_items SET status = ?, updated_at = ? WHERE id = ?").run(status, updatedAt, itemId);
  const updated = normalizeReviewItem(db.prepare("SELECT * FROM review_items WHERE id = ?").get(itemId) as Row);
  refreshObjectHealthFromReviewItems(db, updated.objectType, updated.objectId, updatedAt);
  return updated;
}

export function getPackRecords(
  db: ContextarrDatabase,
  packId: string,
  filters: { q?: string; tag?: string; type?: string } = {}
): unknown[] {
  const where = ["pack_id = ?"];
  const values: unknown[] = [packId];

  if (filters.type) {
    where.push("type = ?");
    values.push(filters.type);
  }

  if (filters.tag) {
    where.push("tags_text LIKE ?");
    values.push(`%${filters.tag}%`);
  }

  if (filters.q) {
    where.push("(title LIKE ? OR body LIKE ? OR tags_text LIKE ?)");
    values.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
  }

  return db
    .prepare(
      `SELECT
        id, pack_id AS packId, title, type, confidence, source_status AS sourceStatus,
        freshness, privacy, last_reviewed AS lastReviewed, review_status AS reviewStatus,
        tags_json AS tagsJson, sources_json AS sourcesJson, file_path AS filePath
      FROM records
      WHERE ${where.join(" AND ")}
      ORDER BY title`
    )
    .all(...values)
    .map((record) => normalizeRecordSummary(record as Row));
}

export function getRecord(db: ContextarrDatabase, recordId: string): unknown | undefined {
  const record = db.prepare("SELECT * FROM records WHERE id = ?").get(recordId) as Row | undefined;
  if (!record) {
    return undefined;
  }

  const sourceIds = JSON.parse(String(record.sources_json)) as string[];
  const sources =
    sourceIds.length === 0
      ? []
      : db
          .prepare(
            `SELECT id, type, title, url, path, retrieved_at AS retrievedAt, license, trust, status
             FROM sources
             WHERE pack_id = ? AND id IN (${sourceIds.map(() => "?").join(",")})
             ORDER BY id`
          )
          .all(record.pack_id, ...sourceIds);

  return {
    id: record.id,
    packId: record.pack_id,
    title: record.title,
    type: record.type,
    tags: JSON.parse(String(record.tags_json)),
    confidence: record.confidence,
    sourceStatus: record.source_status,
    freshness: record.freshness,
    privacy: record.privacy,
    lastReviewed: record.last_reviewed,
    reviewStatus: record.review_status,
    sources: sourceIds,
    resolvedSources: sources,
    body: record.body,
    filePath: record.file_path,
    metadata: JSON.parse(String(record.metadata_json))
  };
}

export function searchIndex(
  db: ContextarrDatabase,
  query: string,
  type: "all" | "pack" | "record" | "skill" | "agent-kit" = "all"
): unknown[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const likeQuery = `%${trimmed}%`;
  const ftsQuery = toFtsQuery(trimmed);
  const packMatches =
    type === "all" || type === "pack"
      ? db
          .prepare(
            `SELECT id, 'pack' AS kind, name AS title, description AS snippet
             FROM packs
             WHERE name LIKE ? OR description LIKE ? OR type LIKE ?
             ORDER BY name
             LIMIT 20`
          )
          .all(likeQuery, likeQuery, likeQuery)
      : [];

  const recordMatches = type === "all" || type === "record" ? searchRecords(db, trimmed, ftsQuery) : [];
  const skillMatches = type === "all" || type === "skill" ? searchSkills(db, trimmed, ftsQuery) : [];
  const agentKitMatches = type === "all" || type === "agent-kit" ? searchAgentKits(db, trimmed, ftsQuery) : [];

  return [...packMatches, ...recordMatches, ...skillMatches, ...agentKitMatches];
}

function insertPack(
  db: ContextarrDatabase,
  pack: LoadedPack,
  indexedAt: string,
  health: { score: number; status: string; reviewQueueCount: number }
): void {
  db.prepare(
    `INSERT INTO packs (
      id, name, version, description, type, visibility, trust_level, author, license,
      created_at, updated_at, last_reviewed_at, contains_personal_data,
      contains_executable_code, requires_network, accent_color, cover_image, pack_path,
      manifest_json, validation_errors, validation_warnings, health_score,
      health_status, record_count, source_count, export_profile_count,
      review_queue_count, indexed_at
    ) VALUES (
      @id, @name, @version, @description, @type, @visibility, @trustLevel, @author, @license,
      @createdAt, @updatedAt, @lastReviewedAt, @containsPersonalData,
      @containsExecutableCode, @requiresNetwork, @accentColor, @coverImage, @packPath,
      @manifestJson, @validationErrors, @validationWarnings, @healthScore,
      @healthStatus, @recordCount, @sourceCount, @exportProfileCount,
      @reviewQueueCount, @indexedAt
    )`
  ).run({
    id: pack.manifest.id,
    name: pack.manifest.name,
    version: pack.manifest.version,
    description: pack.manifest.description,
    type: pack.manifest.type,
    visibility: pack.manifest.visibility,
    trustLevel: pack.manifest.trustLevel,
    author: pack.manifest.author,
    license: pack.manifest.license,
    createdAt: pack.manifest.createdAt,
    updatedAt: pack.manifest.updatedAt,
    lastReviewedAt: pack.manifest.lastReviewedAt,
    containsPersonalData: pack.manifest.containsPersonalData ? 1 : 0,
    containsExecutableCode: pack.manifest.containsExecutableCode ? 1 : 0,
    requiresNetwork: pack.manifest.requiresNetwork ? 1 : 0,
    accentColor: pack.manifest.assets.accentColor ?? null,
    coverImage: pack.manifest.assets.coverImage ?? null,
    packPath: path.resolve(pack.packPath),
    manifestJson: JSON.stringify(pack.manifest),
    validationErrors: pack.validation.summary.errors,
    validationWarnings: pack.validation.summary.warnings,
    healthScore: health.score,
    healthStatus: health.status,
    recordCount: pack.records.length,
    sourceCount: pack.sources.length,
    exportProfileCount: pack.exportProfiles.length,
    reviewQueueCount: health.reviewQueueCount,
    indexedAt
  });
}

function insertSkill(
  db: ContextarrDatabase,
  skill: LoadedSkill,
  indexedAt: string,
  health: { score: number; status: string; reviewQueueCount: number }
): void {
  db.prepare(
    `INSERT INTO skills (
      id, name, version, description, type, visibility, trust_level, author, license,
      created_at, updated_at, last_reviewed_at, contains_personal_data,
      contains_executable_code, requires_network, accent_color, cover_image, skill_path,
      manifest_json, validation_errors, validation_warnings, health_score,
      health_status, instruction_count, example_count, source_count, export_profile_count,
      review_queue_count, targets_json, inputs_json, outputs_json, indexed_at
    ) VALUES (
      @id, @name, @version, @description, @type, @visibility, @trustLevel, @author, @license,
      @createdAt, @updatedAt, @lastReviewedAt, @containsPersonalData,
      @containsExecutableCode, @requiresNetwork, @accentColor, @coverImage, @skillPath,
      @manifestJson, @validationErrors, @validationWarnings, @healthScore,
      @healthStatus, @instructionCount, @exampleCount, @sourceCount, @exportProfileCount,
      @reviewQueueCount, @targetsJson, @inputsJson, @outputsJson, @indexedAt
    )`
  ).run({
    id: skill.manifest.id,
    name: skill.manifest.name,
    version: skill.manifest.version,
    description: skill.manifest.description,
    type: skill.manifest.type,
    visibility: skill.manifest.visibility,
    trustLevel: skill.manifest.trustLevel,
    author: skill.manifest.author,
    license: skill.manifest.license,
    createdAt: skill.manifest.createdAt,
    updatedAt: skill.manifest.updatedAt,
    lastReviewedAt: skill.manifest.lastReviewedAt,
    containsPersonalData: skill.manifest.containsPersonalData ? 1 : 0,
    containsExecutableCode: skill.manifest.containsExecutableCode ? 1 : 0,
    requiresNetwork: skill.manifest.requiresNetwork ? 1 : 0,
    accentColor: skill.manifest.assets.accentColor ?? null,
    coverImage: null,
    skillPath: path.resolve(skill.skillPath),
    manifestJson: JSON.stringify(skill.manifest),
    validationErrors: skill.validation.summary.errors,
    validationWarnings: skill.validation.summary.warnings,
    healthScore: health.score,
    healthStatus: health.status,
    instructionCount: skill.instructions.length,
    exampleCount: skill.examples.length,
    sourceCount: skill.sources.length,
    exportProfileCount: skill.exportProfiles.length,
    reviewQueueCount: health.reviewQueueCount,
    targetsJson: JSON.stringify(skill.manifest.targets),
    inputsJson: JSON.stringify(skill.manifest.inputs),
    outputsJson: JSON.stringify(skill.manifest.outputs),
    indexedAt
  });
}

function insertAgentKit(
  db: ContextarrDatabase,
  agentKit: LoadedAgentKit,
  indexedAt: string,
  health: { score: number; status: string; reviewQueueCount: number }
): void {
  db.prepare(
    `INSERT INTO agent_kits (
      id, name, version, description, type, visibility, trust_level, author, license,
      created_at, updated_at, last_reviewed_at, contains_personal_data,
      contains_executable_code, requires_network, accent_color, cover_image, agent_kit_path,
      manifest_json, validation_errors, validation_warnings, health_score,
      health_status, context_pack_count, skill_count, export_profile_count,
      review_queue_count, target, privacy_mode, token_budget, indexed_at
    ) VALUES (
      @id, @name, @version, @description, @type, @visibility, @trustLevel, @author, @license,
      @createdAt, @updatedAt, @lastReviewedAt, @containsPersonalData,
      @containsExecutableCode, @requiresNetwork, @accentColor, @coverImage, @agentKitPath,
      @manifestJson, @validationErrors, @validationWarnings, @healthScore,
      @healthStatus, @contextPackCount, @skillCount, @exportProfileCount,
      @reviewQueueCount, @target, @privacyMode, @tokenBudget, @indexedAt
    )`
  ).run({
    id: agentKit.manifest.id,
    name: agentKit.manifest.name,
    version: agentKit.manifest.version,
    description: agentKit.manifest.description,
    type: agentKit.manifest.type,
    visibility: agentKit.manifest.visibility,
    trustLevel: agentKit.manifest.trustLevel,
    author: agentKit.manifest.author,
    license: agentKit.manifest.license,
    createdAt: agentKit.manifest.createdAt,
    updatedAt: agentKit.manifest.updatedAt,
    lastReviewedAt: agentKit.manifest.lastReviewedAt,
    containsPersonalData: agentKit.manifest.containsPersonalData ? 1 : 0,
    containsExecutableCode: agentKit.manifest.containsExecutableCode ? 1 : 0,
    requiresNetwork: agentKit.manifest.requiresNetwork ? 1 : 0,
    accentColor: agentKit.manifest.assets.accentColor ?? null,
    coverImage: safePublicAssetRef(agentKit.manifest.assets.coverImage),
    agentKitPath: path.resolve(agentKit.agentKitPath),
    manifestJson: JSON.stringify(agentKit.manifest),
    validationErrors: agentKit.validation.summary.errors,
    validationWarnings: agentKit.validation.summary.warnings,
    healthScore: health.score,
    healthStatus: health.status,
    contextPackCount: agentKit.manifest.contextPacks.length,
    skillCount: agentKit.manifest.skills.length,
    exportProfileCount: agentKit.exportProfiles.length,
    reviewQueueCount: health.reviewQueueCount,
    target: agentKit.manifest.target,
    privacyMode: agentKit.manifest.privacyMode,
    tokenBudget: agentKit.manifest.tokenBudget ?? null,
    indexedAt
  });

  db.prepare(
    `INSERT INTO agent_kits_fts (agent_kit_id, title, body, tags)
     VALUES (?, ?, ?, ?)`
  ).run(
    agentKit.manifest.id,
    agentKit.manifest.name,
    [
      agentKit.manifest.description,
      agentKit.manifest.type,
      agentKit.manifest.target,
      agentKit.manifest.contextPacks.join(" "),
      agentKit.manifest.skills.join(" "),
      agentKit.exportProfiles.map((profile) => `${profile.id} ${profile.name} ${profile.target}`).join(" ")
    ].join("\n"),
    [agentKit.manifest.type, agentKit.manifest.target, agentKit.manifest.privacyMode].join(" ")
  );
}

function insertAgentKitRelationships(db: ContextarrDatabase, agentKit: LoadedAgentKit): void {
  const insertContextPack = db.prepare(
    `INSERT INTO agent_kit_context_packs (agent_kit_id, pack_id, sort_order)
     VALUES (?, ?, ?)`
  );
  const insertSkill = db.prepare(
    `INSERT INTO agent_kit_skills (agent_kit_id, skill_id, sort_order)
     VALUES (?, ?, ?)`
  );

  agentKit.manifest.contextPacks.forEach((packId, index) => {
    insertContextPack.run(agentKit.manifest.id, packId, index);
  });

  agentKit.manifest.skills.forEach((skillId, index) => {
    insertSkill.run(agentKit.manifest.id, skillId, index);
  });
}

function insertAgentKitExportProfiles(db: ContextarrDatabase, agentKit: LoadedAgentKit): void {
  const insert = db.prepare(
    `INSERT INTO agent_kit_export_profiles (
      id, agent_kit_id, name, target, format, privacy_mode, token_budget, profile_json
    ) VALUES (
      @id, @agentKitId, @name, @target, @format, @privacyMode, @tokenBudget, @profileJson
    )`
  );

  for (const profile of agentKit.exportProfiles) {
    insert.run({
      id: profile.id,
      agentKitId: agentKit.manifest.id,
      name: profile.name,
      target: profile.target,
      format: profile.format,
      privacyMode: profile.privacy_mode ?? null,
      tokenBudget: profile.token_budget ?? null,
      profileJson: JSON.stringify(profile)
    });
  }
}

function insertRecords(db: ContextarrDatabase, pack: LoadedPack): void {
  const insertRecord = db.prepare(
    `INSERT INTO records (
      id, pack_id, title, type, tags_json, tags_text, confidence, source_status,
      freshness, privacy, last_reviewed, review_status, sources_json, body,
      file_path, metadata_json
    ) VALUES (
      @id, @packId, @title, @type, @tagsJson, @tagsText, @confidence, @sourceStatus,
      @freshness, @privacy, @lastReviewed, @reviewStatus, @sourcesJson, @body,
      @filePath, @metadataJson
    )`
  );
  const insertFts = db.prepare(
    `INSERT INTO records_fts (record_id, pack_id, title, body, tags)
     VALUES (?, ?, ?, ?, ?)`
  );

  for (const record of pack.records) {
    insertRecord.run({
      id: record.metadata.id,
      packId: pack.manifest.id,
      title: record.metadata.title,
      type: record.metadata.type,
      tagsJson: JSON.stringify(record.metadata.tags),
      tagsText: record.metadata.tags.join(" "),
      confidence: record.metadata.confidence,
      sourceStatus: record.metadata.source_status,
      freshness: record.metadata.freshness,
      privacy: record.metadata.privacy,
      lastReviewed: record.metadata.last_reviewed ?? null,
      reviewStatus: record.metadata.review_status,
      sourcesJson: JSON.stringify(record.metadata.sources),
      body: record.body,
      filePath: record.file,
      metadataJson: JSON.stringify(record.metadata)
    });
    insertFts.run(
      record.metadata.id,
      pack.manifest.id,
      record.metadata.title,
      record.body,
      record.metadata.tags.join(" ")
    );
  }
}

function insertSources(db: ContextarrDatabase, pack: LoadedPack): void {
  const insert = db.prepare(
    `INSERT INTO sources (
      id, pack_id, type, title, url, path, retrieved_at, license, trust, status, source_json
    ) VALUES (
      @id, @packId, @type, @title, @url, @path, @retrievedAt, @license, @trust, @status, @sourceJson
    )`
  );

  for (const source of pack.sources) {
    insert.run({
      id: source.id,
      packId: pack.manifest.id,
      type: source.type,
      title: source.title,
      url: source.url ?? null,
      path: source.path ?? null,
      retrievedAt: source.retrieved_at ?? null,
      license: source.license ?? null,
      trust: source.trust ?? null,
      status: source.status ?? null,
      sourceJson: JSON.stringify(source)
    });
  }
}

function insertExportProfiles(db: ContextarrDatabase, pack: LoadedPack): void {
  const insert = db.prepare(
    `INSERT INTO export_profiles (
      id, pack_id, name, target, format, privacy_mode, token_budget, profile_json
    ) VALUES (
      @id, @packId, @name, @target, @format, @privacyMode, @tokenBudget, @profileJson
    )`
  );

  for (const profile of pack.exportProfiles) {
    insert.run({
      id: profile.id,
      packId: pack.manifest.id,
      name: profile.name,
      target: profile.target,
      format: profile.format,
      privacyMode: profile.privacy_mode ?? null,
      tokenBudget: profile.token_budget ?? null,
      profileJson: JSON.stringify(profile)
    });
  }
}

function insertSkillDocuments(
  db: ContextarrDatabase,
  table: "skill_instructions" | "skill_examples",
  skill: LoadedSkill,
  documents: LoadedSkillDocument[]
): void {
  const insertDocument = db.prepare(
    `INSERT INTO ${table} (
      id, skill_id, title, type, tags_json, tags_text, confidence, source_status,
      freshness, privacy, last_reviewed, review_status, sources_json, body,
      file_path, metadata_json
    ) VALUES (
      @id, @skillId, @title, @type, @tagsJson, @tagsText, @confidence, @sourceStatus,
      @freshness, @privacy, @lastReviewed, @reviewStatus, @sourcesJson, @body,
      @filePath, @metadataJson
    )`
  );
  const insertFts = db.prepare(
    `INSERT INTO skills_fts (item_id, skill_id, kind, title, body, tags)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const kind = table === "skill_instructions" ? "skill_instruction" : "skill_example";

  for (const document of documents) {
    insertDocument.run({
      id: document.metadata.id,
      skillId: skill.manifest.id,
      title: document.metadata.title,
      type: document.metadata.type,
      tagsJson: JSON.stringify(document.metadata.tags),
      tagsText: document.metadata.tags.join(" "),
      confidence: document.metadata.confidence,
      sourceStatus: document.metadata.source_status,
      freshness: document.metadata.freshness,
      privacy: document.metadata.privacy,
      lastReviewed: document.metadata.last_reviewed ?? null,
      reviewStatus: document.metadata.review_status,
      sourcesJson: JSON.stringify(document.metadata.sources),
      body: document.body,
      filePath: document.file,
      metadataJson: JSON.stringify(document.metadata)
    });
    insertFts.run(
      document.metadata.id,
      skill.manifest.id,
      kind,
      document.metadata.title,
      document.body,
      document.metadata.tags.join(" ")
    );
  }
}

function insertSkillSources(db: ContextarrDatabase, skill: LoadedSkill): void {
  const insert = db.prepare(
    `INSERT INTO skill_sources (
      id, skill_id, type, title, url, path, retrieved_at, license, trust, status, source_json
    ) VALUES (
      @id, @skillId, @type, @title, @url, @path, @retrievedAt, @license, @trust, @status, @sourceJson
    )`
  );

  for (const source of skill.sources) {
    insert.run({
      id: source.id,
      skillId: skill.manifest.id,
      type: source.type,
      title: source.title,
      url: source.url ?? null,
      path: source.path ?? null,
      retrievedAt: source.retrieved_at ?? null,
      license: source.license ?? null,
      trust: source.trust ?? null,
      status: source.status ?? null,
      sourceJson: JSON.stringify(source)
    });
  }
}

function insertSkillExportProfiles(db: ContextarrDatabase, skill: LoadedSkill): void {
  const insert = db.prepare(
    `INSERT INTO skill_export_profiles (
      id, skill_id, name, target, format, privacy_mode, token_budget, profile_json
    ) VALUES (
      @id, @skillId, @name, @target, @format, @privacyMode, @tokenBudget, @profileJson
    )`
  );

  for (const profile of skill.exportProfiles) {
    insert.run({
      id: profile.id,
      skillId: skill.manifest.id,
      name: profile.name,
      target: profile.target,
      format: profile.format,
      privacyMode: profile.privacy_mode ?? null,
      tokenBudget: profile.token_budget ?? null,
      profileJson: JSON.stringify(profile)
    });
  }
}

function insertPackHealth(
  db: ContextarrDatabase,
  pack: LoadedPack,
  indexedAt: string,
  health: { score: number; status: string }
): void {
  db.prepare(
    `INSERT INTO pack_health (
      pack_id, score, status, validation_errors, validation_warnings,
      record_count, source_count, export_profile_count, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    pack.manifest.id,
    health.score,
    health.status,
    pack.validation.summary.errors,
    pack.validation.summary.warnings,
    pack.records.length,
    pack.sources.length,
    pack.exportProfiles.length,
    indexedAt
  );
}

function getCount(db: ContextarrDatabase, table: string): number {
  return db.prepare(`SELECT COUNT(*) FROM ${table}`).pluck().get() as number;
}

function syncReviewItems(
  db: ContextarrDatabase,
  candidates: ReviewItemCandidate[],
  indexedAt: string
): ReviewItem[] {
  const fingerprints = candidates.map((candidate) => candidate.fingerprint);
  const upsert = db.prepare(
    `INSERT INTO review_items (
      id, fingerprint, object_type, object_id, type, severity, pack_id, skill_id, record_id, source_id,
      message, suggested_action, status, first_seen_at, last_seen_at,
      updated_at, metadata_json
    ) VALUES (
      @id, @fingerprint, @objectType, @objectId, @type, @severity, @packId, @skillId, @recordId, @sourceId,
      @message, @suggestedAction, 'open', @indexedAt, @indexedAt,
      @indexedAt, @metadataJson
    )
    ON CONFLICT(fingerprint) DO UPDATE SET
      object_type = excluded.object_type,
      object_id = excluded.object_id,
      type = excluded.type,
      severity = excluded.severity,
      pack_id = excluded.pack_id,
      skill_id = excluded.skill_id,
      record_id = excluded.record_id,
      source_id = excluded.source_id,
      message = excluded.message,
      suggested_action = excluded.suggested_action,
      status = CASE
        WHEN review_items.status = 'resolved' THEN 'open'
        ELSE review_items.status
      END,
      last_seen_at = excluded.last_seen_at,
      updated_at = excluded.updated_at,
      metadata_json = excluded.metadata_json`
  );

  for (const candidate of candidates) {
    upsert.run({
      id: createReviewItemId(candidate.fingerprint),
      fingerprint: candidate.fingerprint,
      objectType: candidate.objectType,
      objectId: candidate.objectId,
      type: candidate.type,
      severity: candidate.severity,
      packId: candidate.packId,
      skillId: candidate.skillId,
      recordId: candidate.recordId,
      sourceId: candidate.sourceId,
      message: candidate.message,
      suggestedAction: candidate.suggestedAction,
      indexedAt,
      metadataJson: JSON.stringify(candidate.metadata)
    });
  }

  if (fingerprints.length === 0) {
    db.prepare("UPDATE review_items SET status = 'resolved', updated_at = ? WHERE status <> 'resolved'").run(indexedAt);
  } else {
    db.prepare(
      `UPDATE review_items
       SET status = 'resolved', updated_at = ?
       WHERE status <> 'resolved' AND fingerprint NOT IN (${fingerprints.map(() => "?").join(",")})`
    ).run(indexedAt, ...fingerprints);
  }

  return db
    .prepare("SELECT * FROM review_items WHERE last_seen_at = ?")
    .all(indexedAt)
    .map((row) => normalizeReviewItem(row as Row));
}

function refreshObjectHealthFromReviewItems(
  db: ContextarrDatabase,
  objectType: ReviewObjectType,
  objectId: string,
  updatedAt: string
): void {
  if (objectType === "skill") {
    refreshSkillHealthFromReviewItems(db, objectId, updatedAt);
    return;
  }

  refreshPackHealthFromReviewItems(db, objectId, updatedAt);
}

function refreshPackHealthFromReviewItems(db: ContextarrDatabase, packId: string, updatedAt: string): void {
  const pack = db.prepare("SELECT id FROM packs WHERE id = ?").get(packId);
  if (!pack) {
    return;
  }

  const items = getReviewItems(db, { packId }).filter((item) => item.status !== "resolved");
  const health = calculateHealthScore(items);

  db.prepare("UPDATE packs SET health_score = ?, health_status = ?, review_queue_count = ? WHERE id = ?").run(
    health.score,
    health.status,
    health.reviewQueueCount,
    packId
  );
  db.prepare("UPDATE pack_health SET score = ?, status = ?, updated_at = ? WHERE pack_id = ?").run(
    health.score,
    health.status,
    updatedAt,
    packId
  );
}

function refreshSkillHealthFromReviewItems(db: ContextarrDatabase, skillId: string, _updatedAt: string): void {
  const skill = db.prepare("SELECT id FROM skills WHERE id = ?").get(skillId);
  if (!skill) {
    return;
  }

  const items = getReviewItems(db, { skillId }).filter((item) => item.status !== "resolved");
  const health = calculateHealthScore(items);

  db.prepare("UPDATE skills SET health_score = ?, health_status = ?, review_queue_count = ? WHERE id = ?").run(
    health.score,
    health.status,
    health.reviewQueueCount,
    skillId
  );
}

function groupReviewItemsByObject(items: ReviewItem[]): Map<string, ReviewItem[]> {
  const grouped = new Map<string, ReviewItem[]>();

  for (const item of items.filter((candidate) => candidate.status !== "resolved")) {
    const key = reviewObjectKey(item.objectType, item.objectId);
    const existing = grouped.get(key) ?? [];
    existing.push(item);
    grouped.set(key, existing);
  }

  return grouped;
}

function reviewObjectKey(objectType: ReviewObjectType, objectId: string): string {
  return `${objectType}:${objectId}`;
}

function getSkillDocuments(
  db: ContextarrDatabase,
  table: "skill_instructions" | "skill_examples",
  skillId: string,
  filters: { q?: string; tag?: string; type?: string } = {}
): unknown[] {
  const where = ["skill_id = ?"];
  const values: unknown[] = [skillId];

  if (filters.type) {
    where.push("type = ?");
    values.push(filters.type);
  }

  if (filters.tag) {
    where.push("tags_text LIKE ?");
    values.push(`%${filters.tag}%`);
  }

  if (filters.q) {
    where.push("(title LIKE ? OR body LIKE ? OR tags_text LIKE ?)");
    values.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
  }

  return db
    .prepare(
      `SELECT
        id, skill_id AS skillId, title, type, confidence, source_status AS sourceStatus,
        freshness, privacy, last_reviewed AS lastReviewed, review_status AS reviewStatus,
        tags_json AS tagsJson, sources_json AS sourcesJson,
        body, metadata_json AS metadataJson
      FROM ${table}
      WHERE ${where.join(" AND ")}
      ORDER BY title`
    )
    .all(...values)
    .map((document) => normalizeSkillDocument(document as Row));
}

function normalizeSkillSummary(skill: Row): SkillSummary {
  return {
    id: String(skill.id),
    name: String(skill.name),
    version: String(skill.version),
    description: String(skill.description),
    type: String(skill.type),
    visibility: String(skill.visibility),
    trustLevel: String(skill.trustLevel),
    healthScore: Number(skill.healthScore),
    healthStatus: String(skill.healthStatus),
    validationErrors: Number(skill.validationErrors),
    validationWarnings: Number(skill.validationWarnings),
    instructionCount: Number(skill.instructionCount),
    exampleCount: Number(skill.exampleCount),
    sourceCount: Number(skill.sourceCount),
    exportProfileCount: Number(skill.exportProfileCount),
    accentColor: skill.accentColor ? String(skill.accentColor) : undefined,
    coverImage: null,
    reviewQueueCount: Number(skill.reviewQueueCount),
    lastReviewedAt: skill.lastReviewedAt ? String(skill.lastReviewedAt) : null,
    updatedAt: String(skill.updatedAt),
    targets: JSON.parse(String(skill.targetsJson)),
    inputs: JSON.parse(String(skill.inputsJson)),
    outputs: JSON.parse(String(skill.outputsJson))
  };
}

function normalizeAgentKitSummary(agentKit: Row): AgentKitSummary {
  return {
    id: String(agentKit.id),
    name: String(agentKit.name),
    version: String(agentKit.version),
    description: String(agentKit.description),
    type: String(agentKit.type),
    visibility: String(agentKit.visibility),
    trustLevel: String(agentKit.trustLevel),
    healthScore: Number(agentKit.healthScore),
    healthStatus: String(agentKit.healthStatus),
    validationErrors: Number(agentKit.validationErrors),
    validationWarnings: Number(agentKit.validationWarnings),
    contextPackCount: Number(agentKit.contextPackCount),
    skillCount: Number(agentKit.skillCount),
    exportProfileCount: Number(agentKit.exportProfileCount),
    accentColor: agentKit.accentColor ? String(agentKit.accentColor) : undefined,
    coverImage: safePublicAssetRef(typeof agentKit.coverImage === "string" ? agentKit.coverImage : undefined),
    reviewQueueCount: Number(agentKit.reviewQueueCount),
    lastReviewedAt: agentKit.lastReviewedAt ? String(agentKit.lastReviewedAt) : null,
    updatedAt: String(agentKit.updatedAt),
    target: String(agentKit.target),
    privacyMode: String(agentKit.privacyMode)
  };
}

function normalizeAgentKitContextPackSummary(pack: Row): unknown {
  return {
    ...pack,
    coverImage: safePublicAssetRef(typeof pack.coverImage === "string" ? pack.coverImage : undefined)
  };
}

function normalizeRecordSummary(record: Row): unknown {
  return {
    id: record.id,
    packId: record.packId,
    title: record.title,
    type: record.type,
    confidence: record.confidence,
    sourceStatus: record.sourceStatus,
    freshness: record.freshness,
    privacy: record.privacy,
    lastReviewed: record.lastReviewed,
    reviewStatus: record.reviewStatus,
    tags: JSON.parse(String(record.tagsJson)),
    sources: JSON.parse(String(record.sourcesJson)),
    filePath: record.filePath
  };
}

function normalizeSkillDocument(document: Row): unknown {
  return {
    id: document.id,
    skillId: document.skillId,
    title: document.title,
    type: document.type,
    confidence: document.confidence,
    sourceStatus: document.sourceStatus,
    freshness: document.freshness,
    privacy: document.privacy,
    lastReviewed: document.lastReviewed,
    reviewStatus: document.reviewStatus,
    tags: JSON.parse(String(document.tagsJson)),
    sources: JSON.parse(String(document.sourcesJson)),
    body: document.body,
    metadata: {}
  };
}

function sanitizeSkillManifestForApi(manifest: Record<string, unknown>): Record<string, unknown> {
  const permissions = isRecord(manifest.permissions) ? manifest.permissions : {};
  const assets = isRecord(manifest.assets) ? manifest.assets : {};
  const compatibility = isRecord(manifest.compatibility) ? manifest.compatibility : {};

  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    type: manifest.type,
    visibility: manifest.visibility,
    trustLevel: manifest.trustLevel,
    author: manifest.author,
    license: manifest.license,
    createdAt: manifest.createdAt,
    updatedAt: manifest.updatedAt,
    lastReviewedAt: manifest.lastReviewedAt,
    containsPersonalData: manifest.containsPersonalData,
    containsExecutableCode: manifest.containsExecutableCode,
    requiresNetwork: manifest.requiresNetwork,
    permissions: {
      readVault: permissions.readVault,
      writeDrafts: permissions.writeDrafts,
      runCommands: permissions.runCommands,
      networkAccess: permissions.networkAccess,
      browserAutomation: permissions.browserAutomation,
      toolExecution: permissions.toolExecution
    },
    targets: manifest.targets,
    inputs: manifest.inputs,
    outputs: manifest.outputs,
    assets: assets.accentColor ? { accentColor: assets.accentColor } : {},
    compatibility: {
      contextarr: compatibility.contextarr
    }
  };
}

function sanitizeAgentKitManifestForApi(manifest: Record<string, unknown>): Record<string, unknown> {
  const permissions = isRecord(manifest.permissions) ? manifest.permissions : {};
  const assets = isRecord(manifest.assets) ? manifest.assets : {};
  const compatibility = isRecord(manifest.compatibility) ? manifest.compatibility : {};
  const sanitizedAssets: Record<string, unknown> = {};
  if (typeof assets.accentColor === "string") {
    sanitizedAssets.accentColor = assets.accentColor;
  }
  const coverImage = safePublicAssetRef(typeof assets.coverImage === "string" ? assets.coverImage : undefined);
  if (coverImage) {
    sanitizedAssets.coverImage = coverImage;
  }

  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    type: manifest.type,
    visibility: manifest.visibility,
    trustLevel: manifest.trustLevel,
    author: manifest.author,
    license: manifest.license,
    createdAt: manifest.createdAt,
    updatedAt: manifest.updatedAt,
    lastReviewedAt: manifest.lastReviewedAt,
    containsPersonalData: manifest.containsPersonalData,
    containsExecutableCode: manifest.containsExecutableCode,
    requiresNetwork: manifest.requiresNetwork,
    permissions: {
      readVault: permissions.readVault,
      writeDrafts: permissions.writeDrafts,
      runCommands: permissions.runCommands,
      networkAccess: permissions.networkAccess,
      browserAutomation: permissions.browserAutomation,
      toolExecution: permissions.toolExecution
    },
    contextPacks: manifest.contextPacks,
    skills: manifest.skills,
    target: manifest.target,
    exportProfile: manifest.exportProfile,
    privacyMode: manifest.privacyMode,
    tokenBudget: manifest.tokenBudget,
    assets: sanitizedAssets,
    compatibility: {
      contextarr: compatibility.contextarr
    }
  };
}

function safePublicAssetRef(value: string | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().replace(/\\/g, "/");
  if (
    /^file:/i.test(normalized) ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.startsWith("/") ||
    normalized.startsWith("//") ||
    normalized.startsWith("../") ||
    normalized === ".."
  ) {
    return null;
  }

  return normalized;
}

function arrayOfStrings(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return undefined;
  }

  return value;
}

function orderByIds(items: unknown[], ids: string[]): unknown[] {
  const byId = new Map(items.map((item) => [String((item as Row).id), item]));
  const ordered: unknown[] = [];
  for (const id of ids) {
    const item = byId.get(id);
    if (item) {
      ordered.push(item);
    }
  }

  return ordered;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeReviewItem(row: Row): ReviewItem {
  const objectType = row.object_type === "skill" ? "skill" : "pack";
  const objectId = row.object_id ? String(row.object_id) : String(row.pack_id);

  return {
    id: String(row.id),
    fingerprint: String(row.fingerprint),
    objectType,
    objectId,
    type: row.type as ReviewItem["type"],
    severity: row.severity as ReviewItem["severity"],
    packId: String(row.pack_id),
    skillId: objectType === "skill" ? String(row.skill_id ?? objectId) : null,
    recordId: row.record_id ? String(row.record_id) : null,
    sourceId: row.source_id ? String(row.source_id) : null,
    message: String(row.message),
    suggestedAction: String(row.suggested_action),
    status: row.status as ReviewItem["status"],
    firstSeenAt: String(row.first_seen_at),
    lastSeenAt: String(row.last_seen_at),
    updatedAt: String(row.updated_at),
    metadata: JSON.parse(String(row.metadata_json))
  };
}

function toFtsQuery(query: string): string {
  return (query.match(/[A-Za-z0-9_]+/g) ?? [])
    .map((part) => `${part}*`)
    .join(" OR ");
}

function searchRecords(db: ContextarrDatabase, query: string, ftsQuery: string): unknown[] {
  if (!ftsQuery) {
    return searchRecordsLike(db, query);
  }

  try {
    return db
      .prepare(
        `SELECT records.id, 'record' AS kind, records.title, records.pack_id AS packId,
          snippet(records_fts, 3, '[', ']', '...', 12) AS snippet
         FROM records_fts
         JOIN records ON records.id = records_fts.record_id
         WHERE records_fts MATCH ?
         ORDER BY rank
         LIMIT 30`
      )
      .all(ftsQuery);
  } catch {
    return searchRecordsLike(db, query);
  }
}

function searchRecordsLike(db: ContextarrDatabase, query: string): unknown[] {
  const likeQuery = `%${query}%`;

  return db
    .prepare(
      `SELECT id, 'record' AS kind, title, pack_id AS packId, substr(body, 1, 240) AS snippet
       FROM records
       WHERE title LIKE ? OR body LIKE ? OR tags_text LIKE ?
       ORDER BY title
       LIMIT 30`
    )
    .all(likeQuery, likeQuery, likeQuery);
}

function searchSkills(db: ContextarrDatabase, query: string, ftsQuery: string): unknown[] {
  const likeQuery = `%${query}%`;
  const skillMatches = db
    .prepare(
      `SELECT id, 'skill' AS kind, name AS title, description AS snippet
       FROM skills
       WHERE name LIKE ? OR description LIKE ? OR type LIKE ?
       ORDER BY name
       LIMIT 20`
    )
    .all(likeQuery, likeQuery, likeQuery);

  const documentMatches = ftsQuery ? searchSkillDocumentsFts(db, query, ftsQuery) : searchSkillDocumentsLike(db, query);
  return [...skillMatches, ...documentMatches];
}

function searchSkillDocumentsFts(db: ContextarrDatabase, query: string, ftsQuery: string): unknown[] {
  try {
    return db
      .prepare(
        `SELECT item_id AS id, kind, title, skill_id AS skillId,
          snippet(skills_fts, 4, '[', ']', '...', 12) AS snippet
         FROM skills_fts
         WHERE skills_fts MATCH ?
         ORDER BY rank
         LIMIT 30`
      )
      .all(ftsQuery);
  } catch {
    return searchSkillDocumentsLike(db, query);
  }
}

function searchSkillDocumentsLike(db: ContextarrDatabase, query: string): unknown[] {
  const likeQuery = `%${query}%`;

  return db
    .prepare(
      `SELECT id, 'skill_instruction' AS kind, title, skill_id AS skillId, substr(body, 1, 240) AS snippet
       FROM skill_instructions
       WHERE title LIKE ? OR body LIKE ? OR tags_text LIKE ?
       UNION ALL
       SELECT id, 'skill_example' AS kind, title, skill_id AS skillId, substr(body, 1, 240) AS snippet
       FROM skill_examples
       WHERE title LIKE ? OR body LIKE ? OR tags_text LIKE ?
       ORDER BY title
       LIMIT 30`
    )
    .all(likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery);
}

function searchAgentKits(db: ContextarrDatabase, query: string, ftsQuery: string): unknown[] {
  if (!ftsQuery) {
    return searchAgentKitsLike(db, query);
  }

  try {
    return db
      .prepare(
        `SELECT agent_kits.id, 'agent-kit' AS kind, agent_kits.name AS title,
          agent_kits.target AS target, agent_kits.privacy_mode AS privacyMode,
          snippet(agent_kits_fts, 2, '[', ']', '...', 12) AS snippet
         FROM agent_kits_fts
         JOIN agent_kits ON agent_kits.id = agent_kits_fts.agent_kit_id
         WHERE agent_kits_fts MATCH ?
         ORDER BY rank
         LIMIT 30`
      )
      .all(ftsQuery);
  } catch {
    return searchAgentKitsLike(db, query);
  }
}

function searchAgentKitsLike(db: ContextarrDatabase, query: string): unknown[] {
  const likeQuery = `%${query}%`;

  return db
    .prepare(
      `SELECT DISTINCT
        agent_kits.id, 'agent-kit' AS kind, agent_kits.name AS title,
        agent_kits.target AS target, agent_kits.privacy_mode AS privacyMode,
        agent_kits.description AS snippet
       FROM agent_kits
       LEFT JOIN agent_kit_context_packs ON agent_kit_context_packs.agent_kit_id = agent_kits.id
       LEFT JOIN agent_kit_skills ON agent_kit_skills.agent_kit_id = agent_kits.id
       LEFT JOIN agent_kit_export_profiles ON agent_kit_export_profiles.agent_kit_id = agent_kits.id
       WHERE agent_kits.name LIKE ?
          OR agent_kits.description LIKE ?
          OR agent_kits.type LIKE ?
          OR agent_kits.target LIKE ?
          OR agent_kits.privacy_mode LIKE ?
          OR agent_kit_context_packs.pack_id LIKE ?
          OR agent_kit_skills.skill_id LIKE ?
          OR agent_kit_export_profiles.target LIKE ?
          OR agent_kit_export_profiles.name LIKE ?
       ORDER BY agent_kits.name
       LIMIT 30`
    )
    .all(likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery);
}

type Row = Record<string, unknown>;
