import fs from "node:fs";
import path from "node:path";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import staticPlugin from "@fastify/static";
import YAML from "yaml";
import {
  CollectorError,
  isContextPackCollectorId,
  listContextPackCollectors,
  previewContextPackCollector,
  runContextPackCollector,
  type ContextPackCollectorId
} from "@contextarr/collectors";
import {
  buildAgentKitExport,
  buildComposedExport,
  buildPackExport,
  buildSkillExport,
  ExportError,
  type BuildComposedExportOptions
} from "@contextarr/export-profiles";
import { importSkillToDraft, previewSkillImport, ImporterError, type SkillImporterKind } from "@contextarr/importers";
import { redactionRulesSchema, type AgentKitTemplate, type RedactionRules } from "@contextarr/schema";
import {
  assertAgentKitDirectorySeparation,
  assertComposedPackDirectorySeparation,
  assertComposedPacksDirectory,
  assertDraftPacksDirectory,
  assertImportedSkillsDirectory,
  getAgentKitIndexDirs,
  getSkillIndexDirs
} from "./config";
import { getAgentKitTemplate, loadAgentKitTemplates, type LoadedAgentKitTemplate } from "./agent-kit-template-loader";
import type { ContextarrDatabase } from "./db";
import {
  AgentKitWriteError,
  createAgentKitDraft,
  normalizeAgentKitId,
  type CreateAgentKitDraftRequest
} from "./agent-kit-writer";
import {
  ComposedPackWriteError,
  createComposedPackDraft,
  normalizeComposedPackId,
  normalizeComposedPackIdCandidate,
  type ComposeDraftRecord
} from "./composed-pack-writer";
import {
  activateContextPackDraft,
  DraftPackError,
  getContextPackDraft,
  getDraftPackRoots,
  listContextPackDrafts
} from "./draft-packs";
import {
  getAgentKit,
  getAgentKitContextPacks,
  getAgentKitExportProfilePreview,
  getAgentKitExportProfiles,
  getAgentKitHealth,
  getAgentKitPath,
  getAgentKitSkills,
  getAgentKits,
  getIndexStats,
  getPack,
  getPackHealth,
  getPackPath,
  getPackRecords,
  getPacks,
  getRecord,
  getReviewItems,
  getSkill,
  getSkillExamples,
  getSkillExportProfiles,
  getSkillHealth,
  getSkillInstructions,
  getSkillPath,
  getSkills,
  rebuildIndex,
  reviewItemStatuses,
  searchIndex,
  updateReviewItemStatus
} from "./indexer";
import type {
  ReviewItemFilters,
  ReviewItemSeverity,
  ReviewItemStatus,
  ReviewItemType,
  ReviewObjectType,
  RebuildIndexResult,
  ServerConfig
} from "./types";

export interface CreateAppOptions {
  config: ServerConfig;
  db: ContextarrDatabase;
}

export function createApp({ config, db }: CreateAppOptions): FastifyInstance {
  const app = Fastify({
    logger: false
  });

  app.addHook("onRequest", async (request, reply) => {
    if (!config.apiToken || !isApiRequest(request) || isHealthRequest(request)) {
      return;
    }

    if (getRequestToken(request) === config.apiToken) {
      return;
    }

    return reply.code(401).send({ error: "unauthorized", message: "API token required." });
  });

  app.get("/api/health", async () => {
    const stats = getIndexStats(db);

    return {
      status: "ok",
      authRequired: Boolean(config.apiToken),
      localImportsEnabled: config.localImportsEnabled,
      lastIndexedAt: stats.lastIndexedAt,
      counts: {
        packs: stats.packs,
        records: stats.records,
        sources: stats.sources,
        exportProfiles: stats.exportProfiles,
        skills: stats.skills,
        skillInstructions: stats.skillInstructions,
        skillExamples: stats.skillExamples,
        skillSources: stats.skillSources,
        skillExportProfiles: stats.skillExportProfiles,
        agentKits: stats.agentKits,
        agentKitContextPackRefs: stats.agentKitContextPackRefs,
        agentKitSkillRefs: stats.agentKitSkillRefs,
        agentKitExportProfiles: stats.agentKitExportProfiles,
        reviewItems: stats.reviewItems,
        openReviewItems: stats.openReviewItems
      }
    };
  });

  app.get("/api/context-pack-collectors", async () => {
    return {
      collectors: listContextPackCollectors()
    };
  });

  app.post<{ Params: { id: string }; Body: ContextPackCollectorBody }>(
    "/api/context-pack-collectors/:id/preview",
    async (request, reply) => {
      const collectorId = parseContextPackCollectorId(request.params.id);
      if (!collectorId) {
        return reply.code(404).send({ error: "not_found", message: `Context Pack collector not found: ${request.params.id}` });
      }

      const parsed = parseContextPackCollectorBody(request.body ?? {}, false);
      if (!parsed.ok) {
        return reply.code(400).send({ error: "invalid_collector_request", message: parsed.message });
      }

      try {
        return {
          ok: true,
          ...previewContextPackCollector({
            collectorId,
            ...parsed.value
          })
        };
      } catch (error) {
        if (error instanceof CollectorError) {
          return reply
            .code(statusForCollectorError(error))
            .send({ error: error.code, message: messageForCollectorError(error) });
        }

        throw error;
      }
    }
  );

  app.post<{ Params: { id: string }; Body: ContextPackCollectorBody }>(
    "/api/context-pack-collectors/:id/run",
    async (request, reply) => {
      const collectorId = parseContextPackCollectorId(request.params.id);
      if (!collectorId) {
        return reply.code(404).send({ error: "not_found", message: `Context Pack collector not found: ${request.params.id}` });
      }

      const parsed = parseContextPackCollectorBody(request.body ?? {}, true);
      if (!parsed.ok) {
        return reply.code(400).send({ error: "invalid_collector_request", message: parsed.message });
      }

      try {
        const candidate = previewContextPackCollector({
          collectorId,
          ...parsed.value
        });
        if (getPack(db, candidate.packId)) {
          return reply
            .code(409)
            .send({ error: "output.pack_id_conflict", message: "Pack ID is already indexed as an active Context Pack." });
        }

        assertDraftPacksDirectory(config);
        const result = runContextPackCollector({
          collectorId,
          outputDir: config.draftPacksDir,
          ...parsed.value,
          overwrite: parsed.overwrite
        });

        return reply.code(201).send({
          ok: true,
          collectorId: result.collectorId,
          packId: result.packId,
          packName: result.packName,
          counts: {
            records: result.recordCount,
            sources: result.sourceCount,
            warnings: result.warnings.length
          },
          warnings: result.warnings,
          validation: {
            valid: result.validation.valid,
            errors: result.validation.summary.errors,
            warnings: result.validation.summary.warnings,
            infos: result.validation.summary.infos
          },
          draft: {
            status: "review_required",
            indexed: false
          }
        });
      } catch (error) {
        if (error instanceof CollectorError) {
          return reply
            .code(statusForCollectorError(error))
            .send({ error: error.code, message: messageForCollectorError(error) });
        }

        throw error;
      }
    }
  );

  app.get("/api/context-pack-drafts", async () => {
    try {
      return {
        roots: getDraftPackRoots(config).map((root) => ({
          sourceType: root.sourceType,
          label: root.label
        })),
        drafts: listContextPackDrafts(config)
      };
    } catch (error) {
      if (error instanceof DraftPackError) {
        return {
          roots: [],
          drafts: [],
          warning: {
            error: error.code,
            message: error.message
          }
        };
      }

      throw error;
    }
  });

  app.get<{ Params: { id: string } }>("/api/context-pack-drafts/:id", async (request, reply) => {
    try {
      const draft = getContextPackDraft(config, request.params.id);
      if (!draft) {
        return reply.code(404).send({ error: "not_found", message: `Context Pack draft not found: ${request.params.id}` });
      }

      return draft;
    } catch (error) {
      if (error instanceof DraftPackError) {
        return reply.code(error.statusCode).send({ error: error.code, message: error.message, ...error.details });
      }

      throw error;
    }
  });

  app.post<{ Params: { id: string } }>("/api/context-pack-drafts/:id/validate", async (request, reply) => {
    try {
      const draft = getContextPackDraft(config, request.params.id);
      if (!draft) {
        return reply.code(404).send({ error: "not_found", message: `Context Pack draft not found: ${request.params.id}` });
      }

      return {
        ok: true,
        draft
      };
    } catch (error) {
      if (error instanceof DraftPackError) {
        return reply.code(error.statusCode).send({ error: error.code, message: error.message, ...error.details });
      }

      throw error;
    }
  });

  app.post<{ Params: { id: string }; Body: DraftActivationBody }>(
    "/api/context-pack-drafts/:id/activate",
    async (request, reply) => {
      const parsed = parseDraftActivationBody(request.body ?? {});
      if (!parsed.ok) {
        return reply.code(400).send({ error: "invalid_draft_activation_request", message: parsed.message });
      }

      try {
        const result = activateContextPackDraft(config, request.params.id, parsed.value);
        return reply.code(201).send(result);
      } catch (error) {
        if (error instanceof DraftPackError) {
          return reply.code(error.statusCode).send({ error: error.code, message: error.message, ...error.details });
        }

        throw error;
      }
    }
  );

  app.get("/api/agent-kits", async () => {
    return {
      agentKits: getAgentKits(db)
    };
  });

  app.get("/api/agent-kit-templates", async () => {
    const loaded = loadAgentKitTemplates({
      templatesDir: config.agentKitTemplatesDir,
      contextPacksDir: config.packsDir,
      skillsDir: config.skillsDir
    });

    return {
      templates: loaded.templates.map((template) => summarizeAgentKitTemplate(template)),
      skipped: loaded.skipped.map((skipped) => ({
        templateId: skipped.templateId,
        issueCount: skipped.issues.length,
        errors: skipped.issues.filter((issue) => issue.severity === "error").length,
        warnings: skipped.issues.filter((issue) => issue.severity === "warning").length
      }))
    };
  });

  app.get<{ Params: { id: string } }>("/api/agent-kit-templates/:id", async (request, reply) => {
    const loaded = loadAgentKitTemplates({
      templatesDir: config.agentKitTemplatesDir,
      contextPacksDir: config.packsDir,
      skillsDir: config.skillsDir
    });
    const template = getAgentKitTemplate(loaded.templates, request.params.id);
    if (!template) {
      return reply.code(404).send({ error: "not_found", message: `Agent Kit template not found: ${request.params.id}` });
    }

    return summarizeAgentKitTemplate(template, true);
  });

  app.post<{ Params: { id: string }; Body: AgentKitTemplateCreateBody }>(
    "/api/agent-kit-templates/:id/create",
    async (request, reply) => {
      const loaded = loadAgentKitTemplates({
        templatesDir: config.agentKitTemplatesDir,
        contextPacksDir: config.packsDir,
        skillsDir: config.skillsDir
      });
      const template = getAgentKitTemplate(loaded.templates, request.params.id);
      if (!template) {
        return reply.code(404).send({ error: "not_found", message: `Agent Kit template not found: ${request.params.id}` });
      }

      const parsed = parseAgentKitTemplateCreateBody(request.body ?? {});
      if (!parsed.ok) {
        return reply.code(400).send({ error: "invalid_agent_kit_template_request", message: parsed.message });
      }

      const createRequest = buildAgentKitTemplateCreateRequest(template.template, parsed.value);
      const resolvedId = normalizeAgentKitId(createRequest.id ?? createRequest.name);
      if (!resolvedId) {
        return reply.code(400).send({ error: "invalid_agent_kit_id", message: "Agent Kit name or ID must include letters or numbers." });
      }

      if (getAgentKit(db, resolvedId)) {
        return reply.code(409).send({ error: "agent_kit_exists", message: `Agent Kit already exists: ${resolvedId}`, id: resolvedId });
      }

      const missingContextPackIds = createRequest.contextPacks.filter((packId) => !getPack(db, packId));
      const missingSkillIds = createRequest.skills.filter((skillId) => !getSkill(db, skillId));
      if (missingContextPackIds.length > 0 || missingSkillIds.length > 0) {
        return reply.code(404).send({
          error: "missing_references",
          message: "Agent Kit template references must already exist in the local index.",
          missingContextPackIds,
          missingSkillIds
        });
      }

      try {
        assertAgentKitDirectorySeparation(config);
        const saved = createAgentKitDraft({
          agentKitsDir: config.agentKitsDir,
          contextPacksDir: config.packsDir,
          skillsDir: config.skillsDir,
          request: createRequest
        });
        const result = rebuildIndex(db, config.packsDir, getSkillIndexDirs(config), getAgentKitIndexDirs(config));
        const agentKit = getAgentKit(db, saved.id);

        return reply.code(201).send({
          ok: true,
          template: summarizeAgentKitTemplate(template),
          id: saved.id,
          agentKit,
          validation: {
            errors: saved.validation.summary.errors,
            warnings: saved.validation.summary.warnings
          },
          index: sanitizeRebuildResultForApi(result)
        });
      } catch (error) {
        if (error instanceof AgentKitWriteError) {
          return reply.code(error.statusCode).send({
            error: error.code,
            message: error.message,
            validation: error.validation
              ? {
                  errors: error.validation.summary.errors,
                  warnings: error.validation.summary.warnings
                }
              : undefined,
            ...error.details
          });
        }

        throw error;
      }
    }
  );

  app.post<{ Body: SaveAgentKitBody }>("/api/agent-kits", async (request, reply) => {
    const parsed = parseSaveAgentKitBody(request.body ?? {});
    if (!parsed.ok) {
      return reply.code(400).send({ error: "invalid_agent_kit_request", message: parsed.message });
    }

    const resolvedId = normalizeAgentKitId(parsed.value.id ?? parsed.value.name);
    if (!resolvedId) {
      return reply.code(400).send({ error: "invalid_agent_kit_id", message: "Agent Kit name or ID must include letters or numbers." });
    }

    if (getAgentKit(db, resolvedId)) {
      return reply.code(409).send({ error: "agent_kit_exists", message: `Agent Kit already exists: ${resolvedId}`, id: resolvedId });
    }

    const missingContextPackIds: string[] = [];
    for (const packId of parsed.value.contextPacks) {
      if (!getPack(db, packId)) {
        missingContextPackIds.push(packId);
      }
    }

    const missingSkillIds: string[] = [];
    for (const skillId of parsed.value.skills) {
      if (!getSkill(db, skillId)) {
        missingSkillIds.push(skillId);
      }
    }

    if (missingContextPackIds.length > 0 || missingSkillIds.length > 0) {
      return reply.code(404).send({
        error: "missing_references",
        message: "Agent Kit references must already exist in the local index.",
        missingContextPackIds,
        missingSkillIds
      });
    }

    try {
      assertAgentKitDirectorySeparation(config);
      const saved = createAgentKitDraft({
        agentKitsDir: config.agentKitsDir,
        contextPacksDir: config.packsDir,
        skillsDir: config.skillsDir,
        request: parsed.value
      });
      const result = rebuildIndex(db, config.packsDir, getSkillIndexDirs(config), getAgentKitIndexDirs(config));
      const agentKit = getAgentKit(db, saved.id);

      return reply.code(201).send({
        ok: true,
        id: saved.id,
        agentKit,
        validation: {
          errors: saved.validation.summary.errors,
          warnings: saved.validation.summary.warnings
        },
        index: sanitizeRebuildResultForApi(result)
      });
    } catch (error) {
      if (error instanceof AgentKitWriteError) {
        return reply.code(error.statusCode).send({
          error: error.code,
          message: error.message,
          validation: error.validation
            ? {
                errors: error.validation.summary.errors,
                warnings: error.validation.summary.warnings
              }
            : undefined,
          ...error.details
        });
      }

      throw error;
    }
  });

  app.get<{ Params: { id: string } }>("/api/agent-kits/:id", async (request, reply) => {
    const agentKit = getAgentKit(db, request.params.id);
    if (!agentKit) {
      return reply.code(404).send({ error: "not_found", message: `Agent Kit not found: ${request.params.id}` });
    }

    return agentKit;
  });

  app.get<{ Params: { id: string } }>("/api/agent-kits/:id/context-packs", async (request, reply) => {
    if (!getAgentKit(db, request.params.id)) {
      return reply.code(404).send({ error: "not_found", message: `Agent Kit not found: ${request.params.id}` });
    }

    return {
      contextPacks: getAgentKitContextPacks(db, request.params.id)
    };
  });

  app.get<{ Params: { id: string } }>("/api/agent-kits/:id/skills", async (request, reply) => {
    if (!getAgentKit(db, request.params.id)) {
      return reply.code(404).send({ error: "not_found", message: `Agent Kit not found: ${request.params.id}` });
    }

    return {
      skills: getAgentKitSkills(db, request.params.id)
    };
  });

  app.get<{ Params: { id: string } }>("/api/agent-kits/:id/exports", async (request, reply) => {
    if (!getAgentKit(db, request.params.id)) {
      return reply.code(404).send({ error: "not_found", message: `Agent Kit not found: ${request.params.id}` });
    }

    return {
      exportProfiles: getAgentKitExportProfiles(db, request.params.id)
    };
  });

  app.get<{ Params: { id: string } }>("/api/agent-kits/:id/health", async (request, reply) => {
    const health = getAgentKitHealth(db, request.params.id);
    if (!health) {
      return reply.code(404).send({ error: "not_found", message: `Agent Kit not found: ${request.params.id}` });
    }

    return health;
  });

  app.get<{ Params: { id: string; profileId: string } }>(
    "/api/agent-kits/:id/exports/:profileId/preview",
    async (request, reply) => {
      const agentKitPath = getAgentKitPath(db, request.params.id);
      if (!agentKitPath) {
        return reply.code(404).send({ error: "not_found", message: `Agent Kit not found: ${request.params.id}` });
      }

      const metadata = getAgentKitExportProfilePreview(db, request.params.id, request.params.profileId);
      if (!metadata) {
        return reply.code(404).send({
          error: "not_found",
          message: `Agent Kit export profile not found: ${request.params.id}/${request.params.profileId}`
        });
      }

      try {
        const artifact = buildAgentKitExport({
          agentKitPath,
          profileId: request.params.profileId,
          contextPacksDir: config.packsDir,
          skillsDir: config.skillsDir
        });

        return {
          ...metadata,
          ...artifact,
          agentKitId: artifact.packId,
          contentStatus: "ready",
          includedContextPacks: (metadata as { includedContextPacks?: unknown[] }).includedContextPacks ?? [],
          includedSkills: (metadata as { includedSkills?: unknown[] }).includedSkills ?? []
        };
      } catch (error) {
        if (error instanceof ExportError && error.code === "profile_not_found") {
          return reply.code(404).send({ error: "not_found", message: error.message });
        }

        if (error instanceof ExportError) {
          return reply.code(400).send({ error: error.code, message: error.message });
        }

        throw error;
      }
    }
  );

  app.post<{ Body: SkillImportBody }>("/api/import-skills/preview", async (request, reply) => {
    const gate = assertLocalSkillImportsEnabled(config);
    if (!gate.ok) {
      return reply.code(403).send({ error: "local_imports_disabled", message: gate.message });
    }

    const parsed = parseSkillImportBody(request.body ?? {}, false);
    if (!parsed.ok) {
      return reply.code(400).send({ error: "invalid_skill_import_request", message: parsed.message });
    }

    try {
      const preview = previewSkillImport(parsed.value);
      return {
        ok: true,
        kind: preview.kind,
        skillId: preview.skillId,
        skillName: preview.skillName,
        counts: {
          documents: preview.documents.length,
          sources: preview.sources.length,
          warnings: preview.warnings.length
        },
        documents: preview.documents.map((document) => ({
          id: document.id,
          title: document.title,
          type: document.type,
          tags: document.tags,
          sourceId: document.sourceId
        })),
        warnings: preview.warnings
      };
    } catch (error) {
      if (error instanceof ImporterError) {
        return reply
          .code(statusForImporterError(error))
          .send({ error: error.code, message: messageForImporterError(error) });
      }

      throw error;
    }
  });

  app.post<{ Body: SkillImportBody }>("/api/import-skills", async (request, reply) => {
    const gate = assertLocalSkillImportsEnabled(config);
    if (!gate.ok) {
      return reply.code(403).send({ error: "local_imports_disabled", message: gate.message });
    }

    const parsed = parseSkillImportBody(request.body ?? {}, true);
    if (!parsed.ok) {
      return reply.code(400).send({ error: "invalid_skill_import_request", message: parsed.message });
    }

    try {
      assertImportedSkillsDirectory(config);
      const candidate = previewSkillImport(parsed.value);
      assertSkillIdAvailableForImport(db, config, candidate.skillId, Boolean(parsed.overwrite));
      const result = importSkillToDraft({
        ...parsed.value,
        skillId: candidate.skillId,
        outputDir: config.importedSkillsDir,
        overwrite: parsed.overwrite
      });
      const index = rebuildIndex(db, config.packsDir, getSkillIndexDirs(config), getAgentKitIndexDirs(config));
      const indexedSkillPath = getSkillPath(db, result.skillId);
      if (!indexedSkillPath || !isPathInsideOrSame(config.importedSkillsDir, indexedSkillPath)) {
        removeDraftSkillQuietly(result.skillPath);
        throw new ImporterError(
          "skill_import.index_failed",
          "Imported Skill could not be indexed from the configured imported Skills directory."
        );
      }
      const skill = getSkill(db, result.skillId);

      return reply.code(201).send({
        ok: true,
        skillId: result.skillId,
        skillName: result.skillName,
        counts: {
          documents: result.documentCount,
          sources: result.sourceCount,
          warnings: result.warnings.length
        },
        warnings: result.warnings,
        validation: {
          valid: result.validation.valid,
          errors: result.validation.summary.errors,
          warnings: result.validation.summary.warnings,
          infos: result.validation.summary.infos
        },
        skill,
        index: sanitizeRebuildResultForApi(index)
      });
    } catch (error) {
      if (error instanceof ImporterError) {
        return reply
          .code(statusForImporterError(error))
          .send({ error: error.code, message: messageForImporterError(error) });
      }

      throw error;
    }
  });

  app.get("/api/skills", async () => {
    return {
      skills: getSkills(db)
    };
  });

  app.get<{ Params: { id: string } }>("/api/skills/:id", async (request, reply) => {
    const skill = getSkill(db, request.params.id);
    if (!skill) {
      return reply.code(404).send({ error: "not_found", message: `Skill not found: ${request.params.id}` });
    }

    return skill;
  });

  app.get<{
    Params: { id: string };
    Querystring: { q?: string; tag?: string; type?: string };
  }>("/api/skills/:id/instructions", async (request, reply) => {
    if (!getSkill(db, request.params.id)) {
      return reply.code(404).send({ error: "not_found", message: `Skill not found: ${request.params.id}` });
    }

    return {
      instructions: getSkillInstructions(db, request.params.id, request.query)
    };
  });

  app.get<{
    Params: { id: string };
    Querystring: { q?: string; tag?: string; type?: string };
  }>("/api/skills/:id/examples", async (request, reply) => {
    if (!getSkill(db, request.params.id)) {
      return reply.code(404).send({ error: "not_found", message: `Skill not found: ${request.params.id}` });
    }

    return {
      examples: getSkillExamples(db, request.params.id, request.query)
    };
  });

  app.get<{ Params: { id: string } }>("/api/skills/:id/exports", async (request, reply) => {
    if (!getSkill(db, request.params.id)) {
      return reply.code(404).send({ error: "not_found", message: `Skill not found: ${request.params.id}` });
    }

    return {
      exportProfiles: getSkillExportProfiles(db, request.params.id)
    };
  });

  app.get<{ Params: { id: string } }>("/api/skills/:id/health", async (request, reply) => {
    const health = getSkillHealth(db, request.params.id);
    if (!health) {
      return reply.code(404).send({ error: "not_found", message: `Skill not found: ${request.params.id}` });
    }

    return health;
  });

  app.get<{ Params: { id: string; profileId: string } }>("/api/skills/:id/exports/:profileId/preview", async (request, reply) => {
    const skillPath = getSkillPath(db, request.params.id);
    if (!skillPath) {
      return reply.code(404).send({ error: "not_found", message: `Skill not found: ${request.params.id}` });
    }

    try {
      return buildSkillExport({
        skillPath,
        profileId: request.params.profileId
      });
    } catch (error) {
      if (error instanceof ExportError && error.code === "profile_not_found") {
        return reply.code(404).send({ error: "not_found", message: error.message });
      }

      if (error instanceof ExportError) {
        return reply.code(400).send({ error: error.code, message: error.message });
      }

      throw error;
    }
  });

  app.get("/api/packs", async () => {
    return {
      packs: getPacks(db)
    };
  });

  app.get<{ Params: { id: string } }>("/api/packs/:id", async (request, reply) => {
    const pack = getPack(db, request.params.id);
    if (!pack) {
      return reply.code(404).send({ error: "not_found", message: `Pack not found: ${request.params.id}` });
    }

    return pack;
  });

  app.get<{ Params: { id: string } }>("/api/packs/:id/health", async (request, reply) => {
    const health = getPackHealth(db, request.params.id);
    if (!health) {
      return reply.code(404).send({ error: "not_found", message: `Pack not found: ${request.params.id}` });
    }

    return health;
  });

  app.get<{ Params: { id: string; profileId: string } }>("/api/packs/:id/exports/:profileId/preview", async (request, reply) => {
    const packPath = getPackPath(db, request.params.id);
    if (!packPath) {
      return reply.code(404).send({ error: "not_found", message: `Pack not found: ${request.params.id}` });
    }

    try {
      return buildPackExport({
        packPath,
        profileId: request.params.profileId
      });
    } catch (error) {
      if (error instanceof ExportError && error.code === "profile_not_found") {
        return reply.code(404).send({ error: "not_found", message: error.message });
      }

      if (error instanceof ExportError) {
        return reply.code(400).send({ error: error.code, message: error.message });
      }

      throw error;
    }
  });

  app.post<{ Body: ComposePreviewBody }>("/api/compose/preview", async (request, reply) => {
    const parsed = parseComposePreviewBody(request.body ?? {});
    if (!parsed.ok) {
      return reply.code(400).send({ error: "invalid_compose_request", message: parsed.message });
    }

    const selections: BuildComposedExportOptions["selections"] = [];
    for (const selection of parsed.value.selections) {
      const packPath = getPackPath(db, selection.packId);
      if (!packPath) {
        return reply.code(404).send({ error: "not_found", message: `Pack not found: ${selection.packId}` });
      }

      selections.push({ packPath, recordIds: selection.recordIds });
    }

    try {
      return buildComposedExport({
        ...parsed.value,
        selections
      });
    } catch (error) {
      if (error instanceof ExportError && error.code === "record_not_found") {
        return reply.code(404).send({ error: "not_found", message: error.message });
      }

      if (error instanceof ExportError) {
        return reply.code(400).send({ error: error.code, message: error.message });
      }

      throw error;
    }
  });

  app.post<{ Body: ComposeSavePackBody }>("/api/compose/save-pack", async (request, reply) => {
    const parsed = parseComposeSavePackBody(request.body ?? {});
    if (!parsed.ok) {
      return reply.code(400).send({ error: "invalid_compose_save_request", message: parsed.message });
    }

    const resolvedId =
      parsed.value.packId !== undefined
        ? normalizeExplicitComposedPackId(parsed.value.packId)
        : normalizeComposedPackId(`${parsed.value.name ?? parsed.value.title ?? "composed-context"}-draft`);
    if (!resolvedId) {
      return reply.code(400).send({ error: "invalid_pack_id", message: "Composed pack name or ID must include letters or numbers." });
    }

    if (getPack(db, resolvedId)) {
      return reply.code(409).send({ error: "pack_exists", message: `Pack already exists: ${resolvedId}`, id: resolvedId });
    }

    const selectedRecords: ComposeDraftRecord[] = [];
    const rejectedRecords: Array<{ id: string; reason: string }> = [];
    const seenRecordKeys = new Set<string>();
    const redactionRulesByPack = new Map<string, RedactionRules>();

    for (const selection of parsed.value.selections) {
      const packPath = getPackPath(db, selection.packId);
      if (!packPath) {
        return reply.code(404).send({ error: "not_found", message: `Pack not found: ${selection.packId}` });
      }
      const redactionRules = readPackRedactionRules(packPath);
      redactionRulesByPack.set(selection.packId, redactionRules);

      for (const recordId of selection.recordIds) {
        const recordKey = `${selection.packId}:${recordId}`;
        if (seenRecordKeys.has(recordKey)) {
          return reply.code(400).send({
            error: "duplicate_record_selection",
            message: `Record selected more than once: ${recordId}`
          });
        }
        seenRecordKeys.add(recordKey);

        const record = normalizeRecordForComposeSave(getRecord(db, recordId));
        if (!record || record.packId !== selection.packId) {
          return reply.code(404).send({ error: "not_found", message: `Record not found: ${recordId}` });
        }

        const reason = reasonRecordCannotBeSaved(record, parsed.value.excludeTags, redactionRules);
        if (reason) {
          rejectedRecords.push({ id: record.id, reason });
        } else {
          selectedRecords.push({
            ...record,
            title: applyContextPackRedaction(record.title, redactionRules),
            body: applyContextPackRedaction(record.body, redactionRules)
          });
        }
      }
    }

    if (rejectedRecords.length > 0) {
      return reply.code(400).send({
        error: "selection_not_saveable",
        message: "Composed draft packs can only be created from approved records that pass privacy and default exclusion rules.",
        rejectedRecords
      });
    }

    try {
      assertComposedPackDirectorySeparation(config);
      assertComposedPacksDirectory(config);
      const saved = createComposedPackDraft({
        composedPacksDir: config.composedPacksDir,
        packId: resolvedId,
        name: parsed.value.name ?? parsed.value.title ?? "Composed Context Draft",
        description: parsed.value.description,
        target: parsed.value.target,
        format: parsed.value.format,
        privacyMode: parsed.value.privacyMode,
        excludeTags: parsed.value.excludeTags,
        redactionRules: mergeRedactionRules(Array.from(redactionRulesByPack.values())),
        records: selectedRecords
      });

      return reply.code(201).send({
        ok: true,
        id: saved.id,
        name: saved.name,
        counts: {
          records: saved.recordCount,
          sources: saved.sourceCount
        },
        validation: {
          valid: saved.validation.valid,
          errors: saved.validation.summary.errors,
          warnings: saved.validation.summary.warnings,
          infos: saved.validation.summary.infos
        },
        draft: {
          status: "review_required",
          indexed: false
        }
      });
    } catch (error) {
      if (error instanceof ComposedPackWriteError) {
        return reply.code(error.statusCode).send({
          error: error.code,
          message: error.message,
          validation: error.validation
            ? {
                errors: error.validation.summary.errors,
                warnings: error.validation.summary.warnings
              }
            : undefined
        });
      }

      throw error;
    }
  });

  app.get<{
    Params: { id: string };
    Querystring: { q?: string; tag?: string; type?: string };
  }>("/api/packs/:id/records", async (request, reply) => {
    if (!getPack(db, request.params.id)) {
      return reply.code(404).send({ error: "not_found", message: `Pack not found: ${request.params.id}` });
    }

    return {
      records: getPackRecords(db, request.params.id, request.query)
    };
  });

  app.get<{ Params: { id: string } }>("/api/records/:id", async (request, reply) => {
    const record = getRecord(db, request.params.id);
    if (!record) {
      return reply.code(404).send({ error: "not_found", message: `Record not found: ${request.params.id}` });
    }

    return record;
  });

  app.get<{ Querystring: { q?: string; type?: "all" | "pack" | "record" | "skill" | "agent-kit" } }>("/api/search", async (request, reply) => {
    const type = request.query.type ?? "all";
    if (!["all", "pack", "record", "skill", "agent-kit"].includes(type)) {
      return reply.code(400).send({ error: "invalid_search_type", message: "Search type is invalid." });
    }

    return {
      query: request.query.q ?? "",
      type,
      results: searchIndex(db, request.query.q ?? "", type)
    };
  });

  app.get<{
    Querystring: {
      status?: ReviewItemStatus;
      severity?: ReviewItemSeverity;
      type?: ReviewItemType;
      objectType?: ReviewObjectType;
      objectId?: string;
      packId?: string;
      skillId?: string;
      agentKitId?: string;
    };
  }>("/api/review-items", async (request) => {
    const filters: ReviewItemFilters = {
      status: request.query.status,
      severity: request.query.severity,
      type: request.query.type,
      objectType: request.query.objectType,
      objectId: request.query.objectId,
      packId: request.query.packId,
      skillId: request.query.skillId,
      agentKitId: request.query.agentKitId
    };
    const items = getReviewItems(db, filters);
    const allItems = getReviewItems(db);

    return {
      items,
      counts: {
        total: allItems.length,
        open: allItems.filter((item) => item.status === "open").length,
        filtered: items.length
      }
    };
  });

  app.post<{
    Params: { id: string };
    Body: { status?: string };
  }>("/api/review-items/:id/status", async (request, reply) => {
    const status = request.body?.status;
    if (!isReviewItemStatus(status)) {
      return reply.code(400).send({ error: "invalid_status", message: "Review item status is invalid." });
    }

    const item = updateReviewItemStatus(db, request.params.id, status);
    if (!item) {
      return reply.code(404).send({ error: "not_found", message: `Review item not found: ${request.params.id}` });
    }

    return { item };
  });

  app.post("/api/rescan", async () => {
    const result = rebuildIndex(db, config.packsDir, getSkillIndexDirs(config), getAgentKitIndexDirs(config));

    return {
      ok: true,
      ...sanitizeRebuildResultForApi(result)
    };
  });

  registerStaticWeb(app, config);

  return app;
}

function assertSkillIdAvailableForImport(
  db: ContextarrDatabase,
  config: Pick<ServerConfig, "importedSkillsDir">,
  skillId: string,
  overwrite: boolean
): void {
  const existingSkillPath = getSkillPath(db, skillId);
  if (!existingSkillPath) {
    return;
  }

  if (!isPathInsideOrSame(config.importedSkillsDir, existingSkillPath)) {
    throw new ImporterError("output.skill_id_conflict", `Skill ID is already indexed outside imported Skills: ${skillId}`);
  }

  if (!overwrite) {
    throw new ImporterError("output.exists", `Draft Skill already exists: ${skillId}`);
  }
}

function statusForImporterError(error: ImporterError): 400 | 409 | 422 {
  if (error.code.startsWith("input.")) {
    return 400;
  }
  if (error.code === "output.exists" || error.code === "output.skill_id_conflict") {
    return 409;
  }
  return 422;
}

function statusForCollectorError(error: CollectorError): 400 | 409 | 422 {
  if (error.code.startsWith("input.") || error.code === "collector.input_required") {
    return 400;
  }
  if (error.code === "output.exists" || error.code === "output.pack_id_conflict") {
    return 409;
  }
  return 422;
}

function messageForImporterError(error: ImporterError): string {
  if (error.code === "output.exists") {
    return "Draft Skill already exists for that Skill ID.";
  }
  if (error.code === "output.skill_id_conflict") {
    return "Skill ID is already indexed outside imported Skills.";
  }
  return error.message;
}

function messageForCollectorError(error: CollectorError): string {
  if (error.code.startsWith("input.")) {
    return "Collector input path is not available or cannot be read.";
  }
  if (error.code === "import.no_records") {
    return "Collector input did not contain importable Context Pack records.";
  }
  if (error.code === "output.invalid_path") {
    return "Collector output path is outside the configured draft Context Pack directory.";
  }
  if (error.code === "collector.failed") {
    return "Collector could not read or process the requested local input.";
  }
  if (error.code === "output.exists") {
    return "Draft Context Pack already exists for that Pack ID.";
  }
  if (error.code === "output.pack_id_conflict") {
    return "Pack ID is already indexed as an active Context Pack.";
  }
  return error.message;
}

function isPathInsideOrSame(root: string, target: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function removeDraftSkillQuietly(skillPath: string): void {
  try {
    fs.rmSync(skillPath, { recursive: true, force: true });
  } catch {
    // Best-effort rollback for derived draft output; callers receive a controlled import error.
  }
}

function registerStaticWeb(app: FastifyInstance, config: ServerConfig): void {
  if (!config.webDistDir) {
    return;
  }

  if (!fs.existsSync(config.webDistDir)) {
    throw new Error(`Configured web dist directory does not exist: ${config.webDistDir}`);
  }

  app.register(staticPlugin, {
    root: config.webDistDir,
    prefix: "/"
  });

  app.setNotFoundHandler((request, reply) => {
    const pathName = request.url.split("?")[0] ?? "";
    if (request.method === "GET" && !pathName.startsWith("/api/")) {
      return reply.sendFile("index.html");
    }

    return reply.code(404).send({ error: "not_found", message: "Route not found." });
  });
}

function isApiRequest(request: FastifyRequest): boolean {
  return request.url.startsWith("/api/");
}

function isHealthRequest(request: FastifyRequest): boolean {
  return request.method === "GET" && request.url.split("?")[0] === "/api/health";
}

function getRequestToken(request: FastifyRequest): string | undefined {
  const authorization = getHeaderValue(request.headers.authorization);
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearerToken) {
    return bearerToken;
  }

  return getHeaderValue(request.headers["x-contextarr-token"])?.trim() || undefined;
}

function getHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isReviewItemStatus(value: unknown): value is ReviewItemStatus {
  return typeof value === "string" && reviewItemStatuses.includes(value as ReviewItemStatus);
}

function sanitizeRebuildResultForApi(result: RebuildIndexResult): Omit<RebuildIndexResult, "skipped" | "skippedSkills" | "skippedAgentKits"> & {
  skipped: Array<{ packId?: string; issues: RebuildIndexResult["skipped"][number]["issues"] }>;
  skippedSkills: Array<{ skillId?: string; issues: RebuildIndexResult["skippedSkills"][number]["issues"] }>;
  skippedAgentKits: Array<{ agentKitId?: string; issues: RebuildIndexResult["skippedAgentKits"][number]["issues"] }>;
} {
  return {
    ...result,
    skipped: result.skipped.map((skipped) => ({
      packId: skipped.packId,
      issues: skipped.issues.map((issue) => sanitizeSkippedIssue(issue, skipped.packPath))
    })),
    skippedSkills: result.skippedSkills.map((skipped) => ({
      skillId: skipped.skillId,
      issues: skipped.issues.map((issue) => sanitizeSkippedIssue(issue, skipped.skillPath))
    })),
    skippedAgentKits: result.skippedAgentKits.map((skipped) => ({
      agentKitId: skipped.agentKitId,
      issues: skipped.issues.map((issue) => sanitizeSkippedIssue(issue, skipped.agentKitPath))
    }))
  };
}

function sanitizeSkippedIssue<TIssue extends { message: string; file?: string; path?: string }>(
  issue: TIssue,
  rootPath: string
): TIssue {
  return {
    ...issue,
    message: sanitizeLocalPathText(issue.message, rootPath),
    file: sanitizeIssueFile(issue.file, rootPath),
    path: sanitizeIssuePath(issue.path)
  };
}

function sanitizeIssueFile(value: string | undefined, rootPath: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const localPath = value.replace(/\//g, "\\");
  if (isAbsoluteLikePath(localPath)) {
    const relative = pathRelative(rootPath, localPath);
    if (relative) {
      return relative;
    }

    return localPath.split(/[\\/]/).filter(Boolean).at(-1);
  }

  const normalized = normalizeSlashes(value);
  if (normalized.startsWith("../") || normalized === "..") {
    return normalized.split("/").filter(Boolean).at(-1);
  }

  return normalized;
}

function sanitizeIssuePath(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.replace(/[^\w.[\]-]/g, "_").slice(0, 160);
}

function sanitizeLocalPathText(value: string, rootPath: string): string {
  const normalizedRoot = normalizeSlashes(pathResolve(rootPath));
  const normalizedMessage = normalizeSlashes(value).replaceAll(normalizedRoot, "[local path]");

  return normalizedMessage
    .replace(/\b[A-Za-z]:\/[^\s"'`<>|]+/g, "[local path]")
    .replace(/(?<!:)\/\/[^/\s"'`<>|]+\/[^\s"'`<>|]+(?:\/[^\s"'`<>|]+)*/g, "[local path]")
    .replace(/\\\\[^\s"'`<>|]+/g, "[local path]");
}

function pathResolve(value: string): string {
  return value.replace(/\//g, "\\");
}

function pathRelative(rootPath: string, value: string): string | undefined {
  const root = pathResolve(rootPath);
  const rootWithSeparator = root.endsWith("\\") ? root : `${root}\\`;

  if (!value.toLowerCase().startsWith(rootWithSeparator.toLowerCase())) {
    return undefined;
  }

  return normalizeSlashes(value.slice(rootWithSeparator.length));
}

function isAbsoluteLikePath(value: string): boolean {
  return /^[A-Za-z]:\\/.test(value) || value.startsWith("\\\\");
}

function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, "/");
}

interface ComposePreviewBody {
  title?: unknown;
  target?: unknown;
  format?: unknown;
  privacyMode?: unknown;
  selections?: unknown;
  excludeTags?: unknown;
  tokenBudget?: unknown;
}

interface ComposeSavePackBody extends ComposePreviewBody {
  packId?: unknown;
  name?: unknown;
  description?: unknown;
}

interface SkillImportBody {
  inputPath?: unknown;
  kind?: unknown;
  skillId?: unknown;
  name?: unknown;
  maxDocs?: unknown;
  overwrite?: unknown;
}

interface ContextPackCollectorBody {
  inputPath?: unknown;
  packId?: unknown;
  name?: unknown;
  description?: unknown;
  maxRecords?: unknown;
  overwrite?: unknown;
}

interface DraftActivationBody {
  expectedHash?: unknown;
}

interface SaveAgentKitBody {
  id?: unknown;
  name?: unknown;
  goal?: unknown;
  description?: unknown;
  type?: unknown;
  version?: unknown;
  author?: unknown;
  license?: unknown;
  contextPackIds?: unknown;
  contextPacks?: unknown;
  skillIds?: unknown;
  skills?: unknown;
  target?: unknown;
  format?: unknown;
  privacyMode?: unknown;
  exportProfile?: unknown;
  exportProfileName?: unknown;
  excludeTags?: unknown;
  tokenBudget?: unknown;
  accentColor?: unknown;
}

interface AgentKitTemplateCreateBody {
  id?: unknown;
  name?: unknown;
  goal?: unknown;
  description?: unknown;
  contextPacks?: unknown;
  skills?: unknown;
  target?: unknown;
  format?: unknown;
  privacyMode?: unknown;
  tokenBudget?: unknown;
}

interface ParsedAgentKitTemplateCreateBody {
  id?: string;
  name?: string;
  goal?: string;
  description?: string;
  contextPacks?: string[];
  skills?: string[];
  target?: CreateAgentKitDraftRequest["target"];
  format?: CreateAgentKitDraftRequest["format"];
  privacyMode?: CreateAgentKitDraftRequest["privacyMode"];
  tokenBudget?: number;
}

function assertLocalSkillImportsEnabled(config: ServerConfig): { ok: true } | { ok: false; message: string } {
  if (config.localImportsEnabled) {
    return { ok: true };
  }

  return {
    ok: false,
    message: "Local Skill imports are disabled. Set CONTEXTARR_ENABLE_LOCAL_IMPORTS=true to enable this local-only workflow."
  };
}

function parseContextPackCollectorId(value: string): ContextPackCollectorId | undefined {
  return isContextPackCollectorId(value) ? value : undefined;
}

function parseContextPackCollectorBody(
  body: ContextPackCollectorBody,
  includeOverwrite: boolean
):
  | {
      ok: true;
      value: {
        inputPath?: string;
        packId?: string;
        name?: string;
        description?: string;
        maxRecords?: number;
      };
      overwrite?: boolean;
    }
  | { ok: false; message: string } {
  if (!isRecord(body)) {
    return { ok: false, message: "Context Pack collector request body must be an object." };
  }

  const allowedKeys = new Set(["inputPath", "packId", "name", "description", "maxRecords", "overwrite"]);
  const unknownKey = Object.keys(body).find((key) => !allowedKeys.has(key));
  if (unknownKey) {
    return { ok: false, message: `Context Pack collector field is not allowed: ${unknownKey}.` };
  }

  for (const key of ["inputPath", "packId", "name", "description"] as const) {
    if (body[key] !== undefined && (typeof body[key] !== "string" || !body[key].trim())) {
      return { ok: false, message: `Context Pack collector ${key} is invalid.` };
    }
  }

  let maxRecords: number | undefined;
  if (body.maxRecords !== undefined) {
    if (!Number.isInteger(body.maxRecords) || Number(body.maxRecords) <= 0) {
      return { ok: false, message: "Context Pack collector maxRecords must be a positive integer." };
    }
    maxRecords = Number(body.maxRecords);
  }

  if (includeOverwrite && body.overwrite !== undefined && typeof body.overwrite !== "boolean") {
    return { ok: false, message: "Context Pack collector overwrite must be boolean." };
  }

  return {
    ok: true,
    value: {
      inputPath: trimOptional(body.inputPath),
      packId: trimOptional(body.packId),
      name: trimOptional(body.name),
      description: trimOptional(body.description),
      maxRecords
    },
    overwrite: includeOverwrite ? Boolean(body.overwrite) : false
  };
}

function parseDraftActivationBody(
  body: DraftActivationBody
): { ok: true; value: { expectedHash?: string } } | { ok: false; message: string } {
  if (!isRecord(body)) {
    return { ok: false, message: "Draft activation request body must be an object." };
  }

  const allowedKeys = new Set(["expectedHash"]);
  const unknownKey = Object.keys(body).find((key) => !allowedKeys.has(key));
  if (unknownKey) {
    return { ok: false, message: `Draft activation field is not allowed: ${unknownKey}.` };
  }

  if (body.expectedHash !== undefined && (typeof body.expectedHash !== "string" || !/^[a-f0-9]{64}$/i.test(body.expectedHash))) {
    return { ok: false, message: "Draft activation expectedHash must be a SHA-256 hex string." };
  }

  return {
    ok: true,
    value: {
      expectedHash: trimOptional(body.expectedHash)
    }
  };
}

function parseSkillImportBody(
  body: SkillImportBody,
  includeOverwrite: boolean
):
  | {
      ok: true;
      value: {
        inputPath: string;
        kind: SkillImporterKind;
        skillId?: string;
        name?: string;
        maxDocs?: number;
      };
      overwrite?: boolean;
    }
  | { ok: false; message: string } {
  if (!isRecord(body)) {
    return { ok: false, message: "Skill import request body is required." };
  }

  if (typeof body.inputPath !== "string" || !body.inputPath.trim()) {
    return { ok: false, message: "Skill import inputPath is required." };
  }

  const kind = typeof body.kind === "string" && isSkillImporterKind(body.kind) ? body.kind : undefined;
  if (body.kind !== undefined && !kind) {
    return { ok: false, message: "Skill import kind is invalid." };
  }

  if (body.skillId !== undefined && (typeof body.skillId !== "string" || !body.skillId.trim())) {
    return { ok: false, message: "Skill import skillId is invalid." };
  }

  if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim())) {
    return { ok: false, message: "Skill import name is invalid." };
  }

  let maxDocs: number | undefined;
  if (body.maxDocs !== undefined) {
    if (!Number.isInteger(body.maxDocs) || Number(body.maxDocs) <= 0) {
      return { ok: false, message: "Skill import maxDocs must be a positive integer." };
    }
    maxDocs = Number(body.maxDocs);
  }

  if (includeOverwrite && body.overwrite !== undefined && typeof body.overwrite !== "boolean") {
    return { ok: false, message: "Skill import overwrite must be boolean." };
  }

  return {
    ok: true,
    value: {
      inputPath: body.inputPath.trim(),
      kind: kind ?? "auto",
      skillId: trimOptional(body.skillId),
      name: trimOptional(body.name),
      maxDocs
    },
    overwrite: includeOverwrite ? Boolean(body.overwrite) : false
  };
}

function isSkillImporterKind(value: string): value is SkillImporterKind {
  return ["auto", "folder", "markdown", "prompt-template", "claude-skill", "chatgpt-prompts"].includes(value);
}

function parseSaveAgentKitBody(
  body: SaveAgentKitBody
): { ok: true; value: CreateAgentKitDraftRequest } | { ok: false; message: string } {
  if (!isRecord(body)) {
    return { ok: false, message: "Agent Kit request body is required." };
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    return { ok: false, message: "Agent Kit name is required." };
  }

  const contextPackIds = parseIdArray(body.contextPackIds ?? body.contextPacks);
  if (!contextPackIds || contextPackIds.length === 0) {
    return { ok: false, message: "Agent Kit requires at least one Context Pack." };
  }

  const skillIds = parseIdArray(body.skillIds ?? body.skills);
  if (!skillIds || skillIds.length === 0) {
    return { ok: false, message: "Agent Kit requires at least one Skill." };
  }

  const optionalStringFields = [
    body.id,
    body.goal,
    body.description,
    body.type,
    body.version,
    body.author,
    body.license,
    body.target,
    body.exportProfile,
    body.exportProfileName,
    body.accentColor
  ];
  if (optionalStringFields.some((value) => value !== undefined && typeof value !== "string")) {
    return { ok: false, message: "Agent Kit string fields are invalid." };
  }

  const target = typeof body.target === "string" && body.target.trim() ? body.target.trim() : "codex";
  if (!["chatgpt", "claude", "codex", "claude_code", "markdown", "json_records"].includes(target)) {
    return { ok: false, message: "Agent Kit target is invalid." };
  }

  if (body.format !== undefined && body.format !== "markdown" && body.format !== "json" && body.format !== "text") {
    return { ok: false, message: "Agent Kit format is invalid." };
  }

  if (body.privacyMode !== undefined && body.privacyMode !== "redacted" && body.privacyMode !== "public_safe") {
    return { ok: false, message: "Agent Kit privacy mode is invalid." };
  }

  let excludeTags: string[] | undefined;
  if (body.excludeTags !== undefined) {
    excludeTags = parseIdArray(body.excludeTags);
    if (!excludeTags) {
      return { ok: false, message: "Agent Kit exclude tags are invalid." };
    }
  }

  if (body.tokenBudget !== undefined && (!Number.isInteger(body.tokenBudget) || Number(body.tokenBudget) <= 0)) {
    return { ok: false, message: "Agent Kit token budget must be a positive integer." };
  }

  return {
    ok: true,
    value: {
      id: trimOptional(body.id),
      name: body.name.trim(),
      goal: trimOptional(body.goal),
      description: trimOptional(body.description),
      contextPacks: contextPackIds,
      skills: skillIds,
      target: target as CreateAgentKitDraftRequest["target"],
      format: (body.format ?? "markdown") as CreateAgentKitDraftRequest["format"],
      privacyMode: (body.privacyMode ?? "redacted") as CreateAgentKitDraftRequest["privacyMode"],
      exportProfile: trimOptional(body.exportProfile),
      exportProfileName: trimOptional(body.exportProfileName),
      excludeTags,
      tokenBudget: body.tokenBudget === undefined ? undefined : Number(body.tokenBudget)
    }
  };
}

function parseAgentKitTemplateCreateBody(
  body: AgentKitTemplateCreateBody
): { ok: true; value: ParsedAgentKitTemplateCreateBody } | { ok: false; message: string } {
  if (!isRecord(body)) {
    return { ok: false, message: "Agent Kit template create body must be an object." };
  }

  const allowedKeys = new Set([
    "id",
    "name",
    "goal",
    "description",
    "contextPacks",
    "skills",
    "target",
    "format",
    "privacyMode",
    "tokenBudget"
  ]);
  const unknownKey = Object.keys(body).find((key) => !allowedKeys.has(key));
  if (unknownKey) {
    return { ok: false, message: `Agent Kit template create field is not allowed: ${unknownKey}.` };
  }

  for (const key of ["id", "name", "goal", "description", "target", "format", "privacyMode"] as const) {
    if (body[key] !== undefined && (typeof body[key] !== "string" || !body[key].trim())) {
      return { ok: false, message: `Agent Kit template create ${key} is invalid.` };
    }
  }

  let contextPacks: string[] | undefined;
  if (body.contextPacks !== undefined) {
    contextPacks = parseIdArray(body.contextPacks);
    if (!contextPacks || contextPacks.length === 0) {
      return { ok: false, message: "Agent Kit template create contextPacks are invalid." };
    }
  }

  let skills: string[] | undefined;
  if (body.skills !== undefined) {
    skills = parseIdArray(body.skills);
    if (!skills || skills.length === 0) {
      return { ok: false, message: "Agent Kit template create skills are invalid." };
    }
  }

  const target = trimOptional(body.target);
  if (target && !["chatgpt", "claude", "codex", "claude_code", "markdown", "json_records"].includes(target)) {
    return { ok: false, message: "Agent Kit template create target is invalid." };
  }

  const format = trimOptional(body.format);
  if (format && format !== "markdown" && format !== "json" && format !== "text") {
    return { ok: false, message: "Agent Kit template create format is invalid." };
  }

  const privacyMode = trimOptional(body.privacyMode);
  if (privacyMode && privacyMode !== "redacted" && privacyMode !== "public_safe") {
    return { ok: false, message: "Agent Kit template create privacyMode is invalid." };
  }

  if (body.tokenBudget !== undefined && (!Number.isInteger(body.tokenBudget) || Number(body.tokenBudget) <= 0)) {
    return { ok: false, message: "Agent Kit template create tokenBudget must be a positive integer." };
  }

  return {
    ok: true,
    value: {
      id: trimOptional(body.id),
      name: trimOptional(body.name),
      goal: trimOptional(body.goal),
      description: trimOptional(body.description),
      contextPacks,
      skills,
      target: target as CreateAgentKitDraftRequest["target"] | undefined,
      format: format as CreateAgentKitDraftRequest["format"] | undefined,
      privacyMode: privacyMode as CreateAgentKitDraftRequest["privacyMode"] | undefined,
      tokenBudget: body.tokenBudget === undefined ? undefined : Number(body.tokenBudget)
    }
  };
}

function buildAgentKitTemplateCreateRequest(
  template: AgentKitTemplate,
  overrides: ParsedAgentKitTemplateCreateBody
): CreateAgentKitDraftRequest {
  const suggested = template.suggestedAgentKit;

  return {
    id: overrides.id ?? suggested.id,
    name: overrides.name ?? suggested.name,
    goal: overrides.goal ?? suggested.goal,
    description: overrides.description ?? suggested.description,
    contextPacks: overrides.contextPacks ?? suggested.contextPacks,
    skills: overrides.skills ?? suggested.skills,
    target: overrides.target ?? suggested.target,
    format: overrides.format ?? suggested.format,
    privacyMode: overrides.privacyMode ?? suggested.privacyMode,
    exportProfile: `${normalizeAgentKitId(overrides.id ?? suggested.id)}-${overrides.target ?? suggested.target}`,
    exportProfileName: `${overrides.name ?? suggested.name} ${formatTemplateTargetLabel(overrides.target ?? suggested.target)} Export`,
    excludeTags: [...suggested.excludeTags],
    tokenBudget: overrides.tokenBudget ?? suggested.tokenBudget,
    trustLevel: "unreviewed",
    lastReviewedAt: null,
    author: "Contextarr Template"
  };
}

function summarizeAgentKitTemplate(template: LoadedAgentKitTemplate, includeDetail = false): Record<string, unknown> {
  const suggested = template.template.suggestedAgentKit;

  return {
    id: template.template.id,
    name: template.template.name,
    version: template.template.version,
    description: template.template.description,
    category: template.template.category,
    trustLevel: template.template.trustLevel,
    accentColor: template.template.assets.accentColor ?? null,
    suggestedAgentKit: {
      id: suggested.id,
      name: suggested.name,
      goal: suggested.goal,
      description: suggested.description,
      contextPacks: suggested.contextPacks,
      skills: suggested.skills,
      target: suggested.target,
      format: suggested.format,
      privacyMode: suggested.privacyMode,
      excludeTags: suggested.excludeTags,
      tokenBudget: suggested.tokenBudget ?? null
    },
    safetyNotes: includeDetail ? template.template.safetyNotes : undefined,
    validation: {
      errors: template.validation.summary.errors,
      warnings: template.validation.summary.warnings
    }
  };
}

function formatTemplateTargetLabel(value: string): string {
  switch (value) {
    case "chatgpt":
      return "ChatGPT";
    case "claude":
      return "Claude";
    case "claude_code":
      return "Claude Code";
    case "json_records":
      return "JSON Records";
    case "markdown":
      return "Markdown";
    case "codex":
      return "Codex";
    default:
      return value;
  }
}

function parseIdArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    return undefined;
  }

  return value.map((item) => item.trim());
}

function trimOptional(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

interface ParsedComposePreviewBody {
  title?: string;
  target: string;
  format: "markdown" | "json";
  privacyMode?: "redacted" | "public_safe";
  selections: Array<{ packId: string; recordIds: string[] }>;
  excludeTags?: string[];
  tokenBudget?: number;
}

function parseComposePreviewBody(body: ComposePreviewBody): { ok: true; value: ParsedComposePreviewBody } | { ok: false; message: string } {
  const allowedTargets = new Set(["chatgpt", "claude", "codex", "markdown", "json_records"]);
  if (typeof body?.target !== "string" || !allowedTargets.has(body.target)) {
    return { ok: false, message: "Composer target is invalid." };
  }

  if (body.format !== "markdown" && body.format !== "json") {
    return { ok: false, message: "Composer format is invalid." };
  }

  if (body.privacyMode !== undefined && body.privacyMode !== "redacted" && body.privacyMode !== "public_safe") {
    return { ok: false, message: "Composer privacy mode is invalid." };
  }

  if (!Array.isArray(body.selections)) {
    return { ok: false, message: "Composer selections are required." };
  }

  const selections: Array<{ packId: string; recordIds: string[] }> = [];
  for (const selection of body.selections) {
    if (!isRecord(selection)) {
      return { ok: false, message: "Composer selection is invalid." };
    }

    const packId = selection.packId;
    const recordIds = selection.recordIds;
    if (typeof packId !== "string" || !packId.trim() || !Array.isArray(recordIds)) {
      return { ok: false, message: "Composer selection is invalid." };
    }

    const validRecordIds = recordIds.filter((recordId): recordId is string => typeof recordId === "string" && Boolean(recordId.trim()));
    if (validRecordIds.length !== recordIds.length) {
      return { ok: false, message: "Composer record IDs are invalid." };
    }

    selections.push({ packId: packId.trim(), recordIds: validRecordIds });
  }

  if (selections.length === 0 || selections.every((selection) => selection.recordIds.length === 0)) {
    return { ok: false, message: "Composer requires at least one selected record." };
  }

  let excludeTags: string[] | undefined;
  if (body.excludeTags !== undefined) {
    if (!Array.isArray(body.excludeTags) || body.excludeTags.some((tag) => typeof tag !== "string" || !tag.trim())) {
      return { ok: false, message: "Composer exclude tags are invalid." };
    }
    excludeTags = body.excludeTags.map((tag) => tag.trim());
  }

  let tokenBudget: number | undefined;
  if (body.tokenBudget !== undefined) {
    if (!Number.isInteger(body.tokenBudget) || Number(body.tokenBudget) <= 0) {
      return { ok: false, message: "Composer token budget must be a positive integer." };
    }
    tokenBudget = Number(body.tokenBudget);
  }

  return {
    ok: true,
    value: {
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : undefined,
      target: body.target,
      format: body.format,
      privacyMode: body.privacyMode,
      selections,
      excludeTags,
      tokenBudget
    }
  };
}

interface ParsedComposeSavePackBody extends ParsedComposePreviewBody {
  packId?: string;
  name?: string;
  description?: string;
  privacyMode: "redacted" | "public_safe";
  excludeTags: string[];
}

function parseComposeSavePackBody(body: ComposeSavePackBody): { ok: true; value: ParsedComposeSavePackBody } | { ok: false; message: string } {
  const parsed = parseComposePreviewBody(body);
  if (!parsed.ok) {
    return parsed;
  }

  if (body.packId !== undefined && (typeof body.packId !== "string" || !body.packId.trim())) {
    return { ok: false, message: "Composed pack ID is invalid." };
  }

  if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim())) {
    return { ok: false, message: "Composed pack name is invalid." };
  }

  if (body.description !== undefined && (typeof body.description !== "string" || !body.description.trim())) {
    return { ok: false, message: "Composed pack description is invalid." };
  }

  return {
    ok: true,
    value: {
      ...parsed.value,
      packId: typeof body.packId === "string" && body.packId.trim() ? body.packId.trim() : undefined,
      name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined,
      description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : undefined,
      privacyMode: parsed.value.privacyMode ?? "redacted",
      excludeTags: mergeComposeSaveExcludeTags(parsed.value.excludeTags)
    }
  };
}

function mergeComposeSaveExcludeTags(tags: string[] | undefined): string[] {
  return Array.from(new Set(["secret", "never_export", "imported_draft", ...(tags ?? [])]));
}

function normalizeExplicitComposedPackId(value: string): string | undefined {
  if (/[\\/]/.test(value) || value.includes("..")) {
    return undefined;
  }

  return normalizeComposedPackIdCandidate(value);
}

function normalizeRecordForComposeSave(value: unknown): ComposeDraftRecord | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const metadata = isRecord(value.metadata) ? value.metadata : {};
  const confidence = normalizeRecordConfidence(value.confidence);
  const freshness = normalizeRecordFreshness(value.freshness);
  const privacy = normalizeRecordPrivacy(value.privacy);
  const reviewStatus = normalizeRecordReviewStatus(value.reviewStatus);
  if (
    typeof value.id !== "string" ||
    typeof value.packId !== "string" ||
    typeof value.title !== "string" ||
    typeof value.type !== "string" ||
    !Array.isArray(value.tags) ||
    !Array.isArray(value.sources) ||
    !Array.isArray(value.resolvedSources) ||
    typeof value.body !== "string" ||
    !confidence ||
    !freshness ||
    !privacy ||
    !reviewStatus
  ) {
    return undefined;
  }

  return {
    id: value.id,
    packId: value.packId,
    title: value.title,
    type: value.type,
    tags: value.tags.filter((tag): tag is string => typeof tag === "string"),
    confidence,
    sourceStatus: typeof value.sourceStatus === "string" ? value.sourceStatus : String(metadata.source_status ?? "draft"),
    freshness,
    privacy,
    reviewStatus,
    sources: value.sources.filter((source): source is string => typeof source === "string"),
    resolvedSources: value.resolvedSources.filter(isRecord).map((source) => ({
      id: typeof source.id === "string" ? source.id : "",
      type: typeof source.type === "string" ? source.type : "unknown",
      title: typeof source.title === "string" ? source.title : "Source",
      url: typeof source.url === "string" ? source.url : null,
      path: typeof source.path === "string" ? source.path : null,
      retrievedAt: typeof source.retrievedAt === "string" ? source.retrievedAt : null,
      license: typeof source.license === "string" ? source.license : null,
      licenseStatus: typeof source.licenseStatus === "string" ? source.licenseStatus : null,
      contentHash: typeof source.contentHash === "string" ? source.contentHash : null,
      staleReason: typeof source.staleReason === "string" ? source.staleReason : null,
      trust: typeof source.trust === "string" ? source.trust : null,
      status: typeof source.status === "string" ? source.status : null
    })),
    body: value.body
  };
}

function reasonRecordCannotBeSaved(
  record: ComposeDraftRecord,
  excludeTags: string[],
  redactionRules: RedactionRules
): string | undefined {
  if (record.reviewStatus !== "approved") {
    return `Review status is ${record.reviewStatus}`;
  }

  if (record.privacy === "secret") {
    return "Secret records cannot be saved into composed draft packs.";
  }

  if (record.privacy !== "public_safe") {
    return `Composer save-as-draft requires public_safe source records; ${record.privacy} records can be previewed but not persisted.`;
  }

  const blockedTags = new Set([...excludeTags, ...redactionRules.redact_tags]);
  const blockedTag = record.tags.find((tag) => blockedTags.has(tag));
  if (blockedTag) {
    return `Excluded by tag: ${blockedTag}`;
  }

  return undefined;
}

function readPackRedactionRules(packPath: string): RedactionRules {
  const rulesPath = path.join(packPath, "rules", "redaction.yaml");
  if (!fs.existsSync(rulesPath)) {
    return redactionRulesSchema.parse({});
  }

  return redactionRulesSchema.parse(YAML.parse(fs.readFileSync(rulesPath, "utf8")));
}

function mergeRedactionRules(rules: RedactionRules[]): RedactionRules {
  const tags = new Set<string>(["secret", "never_export", "imported_draft"]);
  const patterns = new Map<string, RedactionRules["patterns"][number]>();

  for (const ruleSet of rules) {
    for (const tag of ruleSet.redact_tags) {
      tags.add(tag);
    }
    for (const pattern of ruleSet.patterns) {
      const key = `${pattern.name}:${pattern.regex}:${pattern.flags ?? ""}:${pattern.action}`;
      patterns.set(key, pattern);
    }
  }

  return {
    redact_tags: Array.from(tags).sort(),
    patterns: Array.from(patterns.values()).sort((left, right) =>
      `${left.name}:${left.action}:${left.regex}`.localeCompare(`${right.name}:${right.action}:${right.regex}`)
    )
  };
}

function applyContextPackRedaction(body: string, rules: RedactionRules): string {
  let redacted = body;

  for (const pattern of rules.patterns) {
    const regex = compileContextPackRedactionPattern(pattern);
    if (!regex || pattern.action === "warn") {
      continue;
    }

    redacted = redacted.replace(regex, pattern.action === "mask" ? "[masked]" : "[redacted]");
  }

  return redacted;
}

function compileContextPackRedactionPattern(pattern: RedactionRules["patterns"][number]): RegExp | undefined {
  try {
    const inlineInsensitive = pattern.regex.startsWith("(?i)");
    const regexSource = inlineInsensitive ? pattern.regex.slice(4) : pattern.regex;
    const flags = new Set(`${pattern.flags ?? ""}${inlineInsensitive ? "i" : ""}g`.split(""));
    return new RegExp(regexSource, Array.from(flags).join(""));
  } catch {
    return undefined;
  }
}

function normalizeRecordConfidence(value: unknown): ComposeDraftRecord["confidence"] | undefined {
  return value === "low" || value === "medium" || value === "high" || value === "unknown" ? value : undefined;
}

function normalizeRecordFreshness(value: unknown): ComposeDraftRecord["freshness"] | undefined {
  return value === "current" || value === "stale" || value === "unknown" ? value : undefined;
}

function normalizeRecordPrivacy(value: unknown): ComposeDraftRecord["privacy"] | undefined {
  return value === "public_safe" || value === "internal" || value === "private" || value === "sensitive" || value === "secret"
    ? value
    : undefined;
}

function normalizeRecordReviewStatus(value: unknown): ComposeDraftRecord["reviewStatus"] | undefined {
  return value === "approved" || value === "needs_review" || value === "draft" || value === "rejected" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
