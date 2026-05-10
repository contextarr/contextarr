import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Command, CommanderError } from "commander";
import {
  AgentKitReadError,
  formatAgentKitValidationResult,
  validateAgentKit,
  type AgentKitValidationResult
} from "@contextarr/agent-kit-validator";
import {
  BackupError,
  createContextPackBackup,
  restoreContextPackBackup,
  type BackupResult,
  type RestoreResult
} from "@contextarr/backups";
import {
  buildAgentKitExport,
  buildAgentKitExports,
  buildPackExport,
  buildPackExports,
  buildSkillExport,
  buildSkillExports,
  ExportError,
  type ExportArtifact
} from "@contextarr/export-profiles";
import {
  importSkillToDraft,
  importToDraftPack,
  ImporterError,
  type DraftImportResult,
  type DraftSkillImportResult,
  type ImporterKind,
  type SkillImporterKind
} from "@contextarr/importers";
import {
  formatValidationResult,
  PackReadError,
  toValidationReportV1,
  validatePack,
  type ValidationResult
} from "@contextarr/pack-validator";
import { renderPackToStaticHtml, renderPacksToStaticHtml, StaticRenderError } from "@contextarr/renderer/static";
import { formatSecurityScannerReport, scanArtifact, SecurityScannerError, type SecurityScannerReportV1 } from "@contextarr/security-scanner";
import {
  getAgentKit,
  getAgentKitContextPacks,
  getAgentKitHealth,
  getAgentKitIndexDirs,
  getAgentKitSkills,
  getAgentKits,
  getIndexStats,
  getPack,
  getPackHealth,
  getPackRecords,
  getPacks,
  getRecord,
  getReviewItems,
  getSkill,
  getSkillExamples,
  getSkillHealth,
  getSkillInstructions,
  getSkillIndexDirs,
  getSkills,
  loadConfig,
  openDatabase,
  rebuildIndex,
  searchIndex,
  type AgentKitHealthDetail,
  type AgentKitSummary,
  type ContextarrDatabase,
  type PackHealthDetail,
  type PackSummary,
  type RebuildIndexResult,
  type ReviewItem,
  type ReviewItemFilters,
  type ServerConfig,
  type SkillHealthDetail,
  type SkillSummary
} from "@contextarr/server";
import {
  formatSkillValidationResult,
  SkillReadError,
  validateSkill,
  type SkillValidationResult
} from "@contextarr/skill-validator";

export type OutputFormat = "text" | "json";

export interface CliIo {
  stdout: Pick<NodeJS.WriteStream, "write">;
  stderr: Pick<NodeJS.WriteStream, "write">;
}

const defaultIo: CliIo = {
  stdout: process.stdout,
  stderr: process.stderr
};

export async function runCli(args = process.argv.slice(2), io: CliIo = defaultIo): Promise<number> {
  let exitCode = 0;

  const program = new Command();
  program
    .name("contextarr")
    .description("Contextarr local context pack tooling")
    .exitOverride()
    .configureOutput({
      writeOut: (value) => io.stdout.write(value),
      writeErr: (value) => io.stderr.write(value)
    });

  program
    .command("rescan")
    .description("rebuild the derived local Contextarr index from configured folders")
    .option("--format <format>", "output format: text or json", "text")
    .option("--json", "emit deterministic JSON output", false)
    .action((options: { format: string; json?: boolean }) => {
      const format = options.json ? "json" : parseFormat(options.format);

      if (!format) {
        io.stderr.write(`Unsupported output format: ${options.format}\n`);
        exitCode = 2;
        return;
      }

      try {
        const result = withConfiguredIndex((db, config) =>
          rebuildIndex(db, config.packsDir, getSkillIndexDirs(config), getAgentKitIndexDirs(config))
        );

        io.stdout.write(format === "json" ? `${JSON.stringify(formatRescanJson(result), null, 2)}\n` : formatRescanText(result));
        exitCode = 0;
      } catch (error) {
        io.stderr.write(`${errorMessage(error)}\n`);
        exitCode = 2;
      }
    });

  program
    .command("list")
    .description("list indexed Contextarr objects from the local derived index")
    .argument("[kind]", "object kind: all, packs, skills, or agent-kits", "all")
    .option("--format <format>", "output format: text or json", "text")
    .option("--json", "emit deterministic JSON output", false)
    .action((kindValue: string, options: { format: string; json?: boolean }) => {
      const format = options.json ? "json" : parseFormat(options.format);
      const kind = parseListKind(kindValue);

      if (!format) {
        io.stderr.write(`Unsupported output format: ${options.format}\n`);
        exitCode = 2;
        return;
      }

      if (!kind) {
        io.stderr.write(`Unsupported list kind: ${kindValue}\n`);
        exitCode = 2;
        return;
      }

      try {
        const result = withConfiguredIndex((db) => ({
          kind,
          stats: getIndexStats(db),
          packs: kind === "all" || kind === "packs" ? getPacks(db) : [],
          skills: kind === "all" || kind === "skills" ? getSkills(db) : [],
          agentKits: kind === "all" || kind === "agent-kits" ? getAgentKits(db) : []
        }));

        io.stdout.write(format === "json" ? `${JSON.stringify(formatListJson(result), null, 2)}\n` : formatListText(result));
        exitCode = 0;
      } catch (error) {
        io.stderr.write(`${errorMessage(error)}\n`);
        exitCode = 2;
      }
    });

  program
    .command("inspect")
    .description("inspect one indexed Contextarr object from the local derived index")
    .argument("<id>", "pack, record, Skill, or Agent Kit id")
    .option("--kind <kind>", "object kind: auto, pack, record, skill, or agent-kit", "auto")
    .option("--format <format>", "output format: text or json", "text")
    .option("--json", "emit deterministic JSON output", false)
    .action((id: string, options: { kind: string; format: string; json?: boolean }) => {
      const format = options.json ? "json" : parseFormat(options.format);
      const kind = parseInspectKind(options.kind);

      if (!format) {
        io.stderr.write(`Unsupported output format: ${options.format}\n`);
        exitCode = 2;
        return;
      }

      if (!kind) {
        io.stderr.write(`Unsupported inspect kind: ${options.kind}\n`);
        exitCode = 2;
        return;
      }

      try {
        const result = withConfiguredIndex((db) => findIndexedObject(db, id, kind));
        if (!result) {
          io.stderr.write(`Indexed Contextarr object not found: ${id}\n`);
          exitCode = 1;
          return;
        }

        io.stdout.write(format === "json" ? `${JSON.stringify(formatInspectJson(result), null, 2)}\n` : formatInspectText(result));
        exitCode = 0;
      } catch (error) {
        io.stderr.write(`${errorMessage(error)}\n`);
        exitCode = 2;
      }
    });

  program
    .command("health")
    .description("summarize local Contextarr index health or inspect one object's health")
    .argument("[id]", "pack, Skill, or Agent Kit id")
    .option("--kind <kind>", "health target kind: auto, summary, pack, skill, or agent-kit", "auto")
    .option("--format <format>", "output format: text or json", "text")
    .option("--json", "emit deterministic JSON output", false)
    .action((id: string | undefined, options: { kind: string; format: string; json?: boolean }) => {
      const format = options.json ? "json" : parseFormat(options.format);
      const kind = parseHealthKind(options.kind);

      if (!format) {
        io.stderr.write(`Unsupported output format: ${options.format}\n`);
        exitCode = 2;
        return;
      }

      if (!kind) {
        io.stderr.write(`Unsupported health kind: ${options.kind}\n`);
        exitCode = 2;
        return;
      }

      if (id && kind === "summary") {
        io.stderr.write("Health summary does not accept an object id.\n");
        exitCode = 2;
        return;
      }

      if (!id && kind !== "summary" && kind !== "auto") {
        io.stderr.write(`Health kind requires an object id: ${kind}\n`);
        exitCode = 2;
        return;
      }

      try {
        const result = withConfiguredIndex((db) => (id ? findHealthDetail(db, id, kind) : buildHealthSummary(db)));
        if (!result) {
          io.stderr.write(`Indexed Contextarr health target not found: ${id}\n`);
          exitCode = 1;
          return;
        }

        io.stdout.write(format === "json" ? `${JSON.stringify(formatHealthJson(result), null, 2)}\n` : formatHealthText(result));
        exitCode = 0;
      } catch (error) {
        io.stderr.write(`${errorMessage(error)}\n`);
        exitCode = 2;
      }
    });

  program
    .command("review")
    .description("list local Contextarr review items from the derived index")
    .option("--status <status>", "review item status: open, ignored, accepted, reviewed, resolved, or all", "open")
    .option("--severity <severity>", "review item severity: error, warning, info, or all")
    .option("--type <type>", "review item type or all")
    .option("--object-type <type>", "object type: pack, skill, agent-kit, agent_kit, or all")
    .option("--object-id <id>", "object id filter")
    .option("--pack-id <id>", "pack id filter")
    .option("--skill-id <id>", "Skill id filter")
    .option("--agent-kit-id <id>", "Agent Kit id filter")
    .option("--limit <count>", "maximum items to return", "50")
    .option("--format <format>", "output format: text or json", "text")
    .option("--json", "emit deterministic JSON output", false)
    .action(
      (options: {
        status: string;
        severity?: string;
        type?: string;
        objectType?: string;
        objectId?: string;
        packId?: string;
        skillId?: string;
        agentKitId?: string;
        limit: string;
        format: string;
        json?: boolean;
      }) => {
        const format = options.json ? "json" : parseFormat(options.format);
        const filters = parseReviewFilters(options);
        const limit = parsePositiveInteger(options.limit);

        if (!format) {
          io.stderr.write(`Unsupported output format: ${options.format}\n`);
          exitCode = 2;
          return;
        }

        if (!filters) {
          io.stderr.write("Unsupported review filter value.\n");
          exitCode = 2;
          return;
        }

        if (!limit) {
          io.stderr.write(`Review limit must be a positive integer: ${options.limit}\n`);
          exitCode = 2;
          return;
        }

        try {
          const result = withConfiguredIndex((db) => {
            const items = getReviewItems(db, filters);
            return { filters, limit, total: items.length, items: items.slice(0, limit) };
          });

          io.stdout.write(format === "json" ? `${JSON.stringify(formatReviewJson(result), null, 2)}\n` : formatReviewText(result));
          exitCode = 0;
        } catch (error) {
          io.stderr.write(`${errorMessage(error)}\n`);
          exitCode = 2;
        }
      }
    );

  program
    .command("brief")
    .description("build a compact read-only brief from the local derived index")
    .argument("[id]", "pack, Skill, or Agent Kit id")
    .option("--kind <kind>", "brief target kind: auto, summary, pack, skill, or agent-kit", "auto")
    .option("--limit <count>", "maximum child items per brief section", "5")
    .option("--format <format>", "output format: text or json", "text")
    .option("--json", "emit deterministic JSON output", false)
    .action((id: string | undefined, options: { kind: string; limit: string; format: string; json?: boolean }) => {
      const format = options.json ? "json" : parseFormat(options.format);
      const kind = parseBriefKind(options.kind);
      const limit = parsePositiveInteger(options.limit);

      if (!format) {
        io.stderr.write(`Unsupported output format: ${options.format}\n`);
        exitCode = 2;
        return;
      }

      if (!kind) {
        io.stderr.write(`Unsupported brief kind: ${options.kind}\n`);
        exitCode = 2;
        return;
      }

      if (!limit) {
        io.stderr.write(`Brief limit must be a positive integer: ${options.limit}\n`);
        exitCode = 2;
        return;
      }

      if (id && kind === "summary") {
        io.stderr.write("Brief summary does not accept an object id.\n");
        exitCode = 2;
        return;
      }

      if (!id && kind !== "summary" && kind !== "auto") {
        io.stderr.write(`Brief kind requires an object id: ${kind}\n`);
        exitCode = 2;
        return;
      }

      try {
        const result = withConfiguredIndex((db) => (id ? findBriefDetail(db, id, kind, limit) : buildBriefSummary(db, limit)));
        if (!result) {
          io.stderr.write(`Indexed Contextarr brief target not found: ${id}\n`);
          exitCode = 1;
          return;
        }

        io.stdout.write(format === "json" ? `${JSON.stringify(formatBriefJson(result), null, 2)}\n` : formatBriefText(result));
        exitCode = 0;
      } catch (error) {
        io.stderr.write(`${errorMessage(error)}\n`);
        exitCode = 2;
      }
    });

  program
    .command("query")
    .description("search the local derived Contextarr index without requiring MCP or the API server")
    .argument("<query...>", "search query")
    .option("--type <type>", "search type: all, pack, record, skill, or agent-kit", "all")
    .option("--limit <count>", "maximum results to return", "10")
    .option("--format <format>", "output format: text or json", "text")
    .option("--json", "emit deterministic JSON output", false)
    .action((queryParts: string[], options: { type: string; limit: string; format: string; json?: boolean }) => {
      const format = options.json ? "json" : parseFormat(options.format);
      const type = parseQueryKind(options.type);
      const limit = parsePositiveInteger(options.limit);
      const query = queryParts.join(" ").trim();

      if (!format) {
        io.stderr.write(`Unsupported output format: ${options.format}\n`);
        exitCode = 2;
        return;
      }

      if (!type) {
        io.stderr.write(`Unsupported query type: ${options.type}\n`);
        exitCode = 2;
        return;
      }

      if (!limit) {
        io.stderr.write(`Query limit must be a positive integer: ${options.limit}\n`);
        exitCode = 2;
        return;
      }

      try {
        const result = withConfiguredIndex((db) => {
          const results = searchIndex(db, query, type);
          return { query, type, limit, total: results.length, results: results.slice(0, limit) };
        });

        io.stdout.write(format === "json" ? `${JSON.stringify(formatQueryJson(result), null, 2)}\n` : formatQueryText(result));
        exitCode = 0;
      } catch (error) {
        io.stderr.write(`${errorMessage(error)}\n`);
        exitCode = 2;
      }
    });

  program
    .command("backup")
    .argument("<path>", "Context Pack directory or directory of child Context Packs to back up")
    .requiredOption("--out <path>", "output directory for local backup artifacts")
    .option("--backup-id <id>", "deterministic backup id")
    .option("--format <format>", "output format: text or json", "text")
    .action((targetPath: string, options: { out: string; backupId?: string; format: string }) => {
      const format = parseFormat(options.format);

      if (!format) {
        io.stderr.write(`Unsupported output format: ${options.format}\n`);
        exitCode = 2;
        return;
      }

      try {
        const result = createContextPackBackup({
          packsDir: resolveUserPath(targetPath),
          outputDir: resolveUserPath(options.out),
          backupId: options.backupId
        });

        io.stdout.write(format === "json" ? `${JSON.stringify(formatBackupJson(result), null, 2)}\n` : formatBackupText(result));
        exitCode = 0;
      } catch (error) {
        io.stderr.write(`${error instanceof BackupError ? error.message : errorMessage(error)}\n`);
        exitCode = error instanceof BackupError && isBackupUsageError(error.code) ? 2 : 1;
      }
    });

  program
    .command("restore")
    .argument("<path>", "Contextarr local backup directory to restore")
    .requiredOption("--out <path>", "output directory for quarantined restored packs")
    .option("--format <format>", "output format: text or json", "text")
    .action((targetPath: string, options: { out: string; format: string }) => {
      const format = parseFormat(options.format);

      if (!format) {
        io.stderr.write(`Unsupported output format: ${options.format}\n`);
        exitCode = 2;
        return;
      }

      try {
        const result = restoreContextPackBackup({
          backupPath: resolveUserPath(targetPath),
          outputDir: resolveUserPath(options.out)
        });

        io.stdout.write(format === "json" ? `${JSON.stringify(formatRestoreJson(result), null, 2)}\n` : formatRestoreText(result));
        exitCode = result.validationErrors > 0 || result.scannerBlocked > 0 ? 1 : 0;
      } catch (error) {
        io.stderr.write(`${error instanceof BackupError ? error.message : errorMessage(error)}\n`);
        exitCode = error instanceof BackupError && isRestoreUsageError(error.code) ? 2 : 1;
      }
    });

  program
    .command("import")
    .argument("<path>", "local folder, Markdown folder, Obsidian vault, ChatGPT export, or Claude export to import")
    .option("--kind <kind>", "import kind: auto, folder, markdown, obsidian, chatgpt, or claude", "auto")
    .option("--out <path>", "output directory for generated draft packs", "imported-packs")
    .option("--pack-id <id>", "draft pack id")
    .option("--name <name>", "draft pack display name")
    .option("--format <format>", "output format: text or json", "text")
    .option("--max-records <n>", "maximum records to import", "50")
    .option("--overwrite", "overwrite an existing generated draft pack", false)
    .action(
      (
        targetPath: string,
        options: {
          kind: string;
          out: string;
          packId?: string;
          name?: string;
          format: string;
          maxRecords: string;
          overwrite?: boolean;
        }
      ) => {
        const format = parseFormat(options.format);
        const kind = parseImportKind(options.kind);
        const maxRecords = parsePositiveInteger(options.maxRecords);

        if (!format) {
          io.stderr.write(`Unsupported output format: ${options.format}\n`);
          exitCode = 2;
          return;
        }

        if (!kind) {
          io.stderr.write(`Unsupported import kind: ${options.kind}\n`);
          exitCode = 2;
          return;
        }

        if (!maxRecords) {
          io.stderr.write(`--max-records must be a positive integer.\n`);
          exitCode = 2;
          return;
        }

        try {
          const result = importToDraftPack({
            inputPath: resolveUserPath(targetPath),
            kind,
            outputDir: resolveUserPath(options.out),
            packId: options.packId,
            name: options.name,
            maxRecords,
            overwrite: Boolean(options.overwrite)
          });

          io.stdout.write(format === "json" ? `${JSON.stringify(formatImportJson(result), null, 2)}\n` : formatImportText(result));
          exitCode = result.validation.valid ? 0 : 1;
        } catch (error) {
          io.stderr.write(`${error instanceof ImporterError ? error.message : errorMessage(error)}\n`);
          exitCode = error instanceof ImporterError && error.code.startsWith("input.") ? 2 : 1;
        }
      }
    );

  program
    .command("import-skill")
    .argument("<path>", "local folder, Markdown folder, prompt templates, Claude Skill, or ChatGPT prompt export to import")
    .option("--kind <kind>", "import kind: auto, folder, markdown, prompt-template, claude-skill, or chatgpt-prompts", "auto")
    .option("--out <path>", "output directory for generated draft Skills", "imported-skills")
    .option("--skill-id <id>", "draft Skill id")
    .option("--name <name>", "draft Skill display name")
    .option("--format <format>", "output format: text or json", "text")
    .option("--max-docs <n>", "maximum Skill documents to import", "50")
    .option("--overwrite", "overwrite an existing generated draft Skill", false)
    .action(
      (
        targetPath: string,
        options: {
          kind: string;
          out: string;
          skillId?: string;
          name?: string;
          format: string;
          maxDocs: string;
          overwrite?: boolean;
        }
      ) => {
        const format = parseFormat(options.format);
        const kind = parseSkillImportKind(options.kind);
        const maxDocs = parsePositiveInteger(options.maxDocs);

        if (!format) {
          io.stderr.write(`Unsupported output format: ${options.format}\n`);
          exitCode = 2;
          return;
        }

        if (!kind) {
          io.stderr.write(`Unsupported Skill import kind: ${options.kind}\n`);
          exitCode = 2;
          return;
        }

        if (!maxDocs) {
          io.stderr.write(`--max-docs must be a positive integer.\n`);
          exitCode = 2;
          return;
        }

        try {
          const result = importSkillToDraft({
            inputPath: resolveUserPath(targetPath),
            kind,
            outputDir: resolveUserPath(options.out),
            skillId: options.skillId,
            name: options.name,
            maxDocs,
            overwrite: Boolean(options.overwrite)
          });

          io.stdout.write(
            format === "json" ? `${JSON.stringify(formatSkillImportJson(result), null, 2)}\n` : formatSkillImportText(result)
          );
          exitCode = result.validation.valid ? 0 : 1;
        } catch (error) {
          io.stderr.write(`${error instanceof ImporterError ? error.message : errorMessage(error)}\n`);
          exitCode = error instanceof ImporterError && error.code.startsWith("input.") ? 2 : 1;
        }
      }
    );

  program
    .command("scan")
    .argument("<path>", "local Contextarr artifact file or directory to scan")
    .option("--format <format>", "output format: text or json", "text")
    .action((targetPath: string, options: { format: string }) => {
      const format = parseFormat(options.format);

      if (!format) {
        io.stderr.write(`Unsupported output format: ${options.format}\n`);
        exitCode = 2;
        return;
      }

      try {
        const report = scanArtifact({ path: resolveUserPath(targetPath) });
        io.stdout.write(format === "json" ? `${JSON.stringify(report, null, 2)}\n` : formatSecurityScannerReport(report));
        exitCode = isBlockingScanReport(report) ? 1 : 0;
      } catch (error) {
        io.stderr.write(`${error instanceof SecurityScannerError ? error.message : errorMessage(error)}\n`);
        exitCode = error instanceof SecurityScannerError && isScannerUsageError(error.code) ? 2 : 1;
      }
    });

  program
    .command("validate")
    .argument("<path>", "pack, Skill, Agent Kit, or directory of child objects to validate")
    .option("--format <format>", "output format: text or json", "text")
    .option("--json", "emit deterministic JSON validation report", false)
    .action((targetPath: string, options: { format: string; json?: boolean }) => {
      const format = options.json ? "json" : parseFormat(options.format);

      if (!format) {
        io.stderr.write(`Unsupported output format: ${options.format}\n`);
        exitCode = 2;
        return;
      }

      const resolvedTargetPath = path.resolve(process.env.INIT_CWD ?? process.cwd(), targetPath);

      if (!fs.existsSync(resolvedTargetPath) || !fs.statSync(resolvedTargetPath).isDirectory()) {
        io.stderr.write(`Validation path is not a readable directory: ${targetPath}\n`);
        exitCode = 2;
        return;
      }

      try {
        const targets = getValidationTargets(resolvedTargetPath);
        const results = targets.map((target) =>
          target.kind === "skill"
            ? validateSkill(target.path)
            : target.kind === "agent-kit"
              ? validateAgentKit(target.path)
              : validatePack(target.path)
        );
        const validationJson = formatValidationJson(resolvedTargetPath, results);
        if (format === "json") {
          io.stdout.write(`${JSON.stringify(validationJson, null, 2)}\n`);
        } else {
          io.stdout.write(formatValidationTextFromFormatted(validationJson));
        }
        exitCode = isFormattedValidationJsonValid(validationJson) ? 0 : 1;
      } catch (error) {
        io.stderr.write(
          `${error instanceof PackReadError || error instanceof SkillReadError || error instanceof AgentKitReadError ? error.message : errorMessage(error)}\n`
        );
        exitCode = 2;
      }
    });

  program
    .command("validate-skill")
    .argument("<path>", "Skill directory or directory of child Skills to validate")
    .option("--format <format>", "output format: text or json", "text")
    .action((targetPath: string, options: { format: string }) => {
      const format = parseFormat(options.format);

      if (!format) {
        io.stderr.write(`Unsupported output format: ${options.format}\n`);
        exitCode = 2;
        return;
      }

      const resolvedTargetPath = resolveUserPath(targetPath);

      if (!fs.existsSync(resolvedTargetPath) || !fs.statSync(resolvedTargetPath).isDirectory()) {
        io.stderr.write(`Skill path is not a readable directory: ${targetPath}\n`);
        exitCode = 2;
        return;
      }

      try {
        const results = getSkillTargets(resolvedTargetPath).map((target) => validateSkill(target));
        io.stdout.write(
          format === "json"
            ? `${JSON.stringify(formatValidationJson(resolvedTargetPath, results), null, 2)}\n`
            : formatValidationText(results)
        );
        exitCode = results.every((result) => result.valid) ? 0 : 1;
      } catch (error) {
        io.stderr.write(`${error instanceof SkillReadError ? error.message : errorMessage(error)}\n`);
        exitCode = 2;
      }
    });

  program
    .command("validate-agent-kit")
    .argument("<path>", "Agent Kit directory or directory of child Agent Kits to validate")
    .option("--format <format>", "output format: text or json", "text")
    .action((targetPath: string, options: { format: string }) => {
      const format = parseFormat(options.format);

      if (!format) {
        io.stderr.write(`Unsupported output format: ${options.format}\n`);
        exitCode = 2;
        return;
      }

      const resolvedTargetPath = resolveUserPath(targetPath);

      if (!fs.existsSync(resolvedTargetPath) || !fs.statSync(resolvedTargetPath).isDirectory()) {
        io.stderr.write(`Agent Kit path is not a readable directory: ${targetPath}\n`);
        exitCode = 2;
        return;
      }

      try {
        const results = getAgentKitTargets(resolvedTargetPath).map((target) => validateAgentKit(target));
        io.stdout.write(
          format === "json"
            ? `${JSON.stringify(formatValidationJson(resolvedTargetPath, results), null, 2)}\n`
            : formatValidationText(results)
        );
        exitCode = results.every((result) => result.valid) ? 0 : 1;
      } catch (error) {
        io.stderr.write(`${error instanceof AgentKitReadError ? error.message : errorMessage(error)}\n`);
        exitCode = 2;
      }
    });

  program
    .command("render")
    .argument("<path>", "pack directory or directory of pack directories to render")
    .requiredOption("--out <path>", "output directory for static HTML")
    .action((targetPath: string, options: { out: string }) => {
      const resolvedTargetPath = resolveUserPath(targetPath);
      const resolvedOutputPath = resolveUserPath(options.out);

      if (!fs.existsSync(resolvedTargetPath) || !fs.statSync(resolvedTargetPath).isDirectory()) {
        io.stderr.write(`Render path is not a readable directory: ${targetPath}\n`);
        exitCode = 2;
        return;
      }

      try {
        const result = fs.existsSync(path.join(resolvedTargetPath, "contextarr-pack.json"))
          ? renderPackToStaticHtml({ packPath: resolvedTargetPath, outputDir: resolvedOutputPath })
          : renderPacksToStaticHtml({ packsDir: resolvedTargetPath, outputDir: resolvedOutputPath });

        io.stdout.write(
          `Rendered ${result.packsRendered} pack(s), ${result.recordsRendered} record(s): ${result.entryFile}\n`
        );
        exitCode = 0;
      } catch (error) {
        io.stderr.write(`${error instanceof StaticRenderError ? error.message : errorMessage(error)}\n`);
        exitCode = error instanceof StaticRenderError ? 1 : 2;
      }
    });

  program
    .command("export")
    .argument("<path>", "pack, Skill, Agent Kit, or directory of child objects to export")
    .option("--profile <profileId>", "export profile id to generate")
    .option("--all", "export all profiles")
    .requiredOption("--out <path>", "output directory for generated exports")
    .option("--context-packs-dir <path>", "Context Pack directory for Agent Kit exports", "demo-packs")
    .option("--skills-dir <path>", "Skill directory for Agent Kit exports", "demo-skills")
    .action((targetPath: string, options: { profile?: string; all?: boolean; out: string; contextPacksDir: string; skillsDir: string }) => {
      const resolvedTargetPath = resolveUserPath(targetPath);
      const resolvedOutputPath = resolveUserPath(options.out);
      const resolvedContextPacksDir = resolveUserPath(options.contextPacksDir);
      const resolvedSkillsDir = resolveUserPath(options.skillsDir);

      if (!fs.existsSync(resolvedTargetPath) || !fs.statSync(resolvedTargetPath).isDirectory()) {
        io.stderr.write(`Export path is not a readable directory: ${targetPath}\n`);
        exitCode = 2;
        return;
      }

      if ((options.all && options.profile) || (!options.all && !options.profile)) {
        io.stderr.write("Choose exactly one export mode: --profile <profile-id> or --all.\n");
        exitCode = 2;
        return;
      }

      try {
        const targets = getExportTargets(resolvedTargetPath);
        const artifacts = targets.flatMap((target) =>
          target.kind === "skill"
            ? options.all
              ? buildSkillExports({ skillPath: target.path })
              : [buildSkillExport({ skillPath: target.path, profileId: options.profile! })]
            : target.kind === "agent-kit"
              ? options.all
                ? buildAgentKitExports({
                    agentKitPath: target.path,
                    contextPacksDir: resolvedContextPacksDir,
                    skillsDir: resolvedSkillsDir
                  })
                : [
                    buildAgentKitExport({
                      agentKitPath: target.path,
                      profileId: options.profile!,
                      contextPacksDir: resolvedContextPacksDir,
                      skillsDir: resolvedSkillsDir
                    })
                  ]
              : options.all
              ? buildPackExports({ packPath: target.path })
              : [buildPackExport({ packPath: target.path, profileId: options.profile! })]
        );
        const writtenFiles = writeExportArtifacts(resolvedOutputPath, artifacts);

        io.stdout.write(`Exported ${writtenFiles.length} file(s): ${resolvedOutputPath}\n`);
        exitCode = 0;
      } catch (error) {
        io.stderr.write(`${error instanceof ExportError ? error.message : errorMessage(error)}\n`);
        exitCode = error instanceof ExportError ? 1 : 2;
      }
    });

  try {
    await program.parseAsync(args, { from: "user" });
  } catch (error) {
    if (error instanceof CommanderError) {
      return 2;
    }

    io.stderr.write(`${errorMessage(error)}\n`);
    return 2;
  }

  return exitCode;
}

function parseFormat(value: string): OutputFormat | undefined {
  return value === "text" || value === "json" ? value : undefined;
}

function parseImportKind(value: string): ImporterKind | undefined {
  return ["auto", "folder", "markdown", "obsidian", "chatgpt", "claude"].includes(value)
    ? (value as ImporterKind)
    : undefined;
}

function parseSkillImportKind(value: string): SkillImporterKind | undefined {
  return ["auto", "folder", "markdown", "prompt-template", "claude-skill", "chatgpt-prompts"].includes(value)
    ? (value as SkillImporterKind)
    : undefined;
}

function parsePositiveInteger(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function isBackupUsageError(code: string): boolean {
  return code === "backup.input_unreadable" || code === "backup.no_packs" || code === "path.unsafe" || code === "path.escape";
}

function isRestoreUsageError(code: string): boolean {
  return code === "restore.input_unreadable" || code === "restore.manifest_missing" || code === "path.unsafe" || code === "path.escape";
}

function isScannerUsageError(code: string): boolean {
  return code === "scan.input_missing" || code === "scan.input_unsupported" || code === "scan.path_escape";
}

function isBlockingScanReport(report: SecurityScannerReportV1): boolean {
  return report.status === "blocked" || report.status === "critical_findings" || report.status === "scanning_failed";
}

function resolveUserPath(value: string): string {
  return path.resolve(process.env.INIT_CWD ?? process.cwd(), value);
}

type ListKind = "all" | "packs" | "skills" | "agent-kits";
type InspectKind = "auto" | "pack" | "record" | "skill" | "agent-kit";
type HealthKind = "auto" | "summary" | "pack" | "skill" | "agent-kit";
type BriefKind = "auto" | "summary" | "pack" | "skill" | "agent-kit";
type QueryKind = "all" | "pack" | "record" | "skill" | "agent-kit";
type IndexStats = ReturnType<typeof getIndexStats>;
type ListResult = {
  kind: ListKind;
  stats: IndexStats;
  packs: PackSummary[];
  skills: SkillSummary[];
  agentKits: AgentKitSummary[];
};
type IndexedObjectKind = Exclude<InspectKind, "auto">;
type IndexedObject = { kind: IndexedObjectKind; id: string; object: unknown };
type HealthObjectKind = Exclude<HealthKind, "auto" | "summary">;
type HealthDetail = PackHealthDetail | SkillHealthDetail | AgentKitHealthDetail;
type HealthObjectResult = { kind: HealthObjectKind; id: string; health: HealthDetail };
type HealthSummaryResult = {
  kind: "summary";
  status: "healthy" | "review_required";
  stats: IndexStats;
  counts: {
    packs: number;
    skills: number;
    agentKits: number;
  };
  reviewItems: {
    total: number;
    open: number;
  };
  unhealthy: {
    packs: Array<Pick<PackSummary, "id" | "name" | "healthStatus" | "reviewQueueCount">>;
    skills: Array<Pick<SkillSummary, "id" | "name" | "healthStatus" | "reviewQueueCount">>;
    agentKits: Array<Pick<AgentKitSummary, "id" | "name" | "healthStatus" | "reviewQueueCount">>;
  };
};
type HealthResult = HealthSummaryResult | HealthObjectResult;
type BriefObjectKind = Exclude<BriefKind, "auto" | "summary">;
type BriefSummaryObject = {
  id: string;
  name: string;
  description: string;
  healthStatus: string;
  reviewQueueCount: number;
};
type BriefContentItem = {
  id: string;
  title: string;
  kind?: string;
  snippet?: string;
  packId?: string;
  skillId?: string;
  target?: string;
  privacyMode?: string;
};
type BriefSummaryResult = {
  kind: "summary";
  limit: number;
  status: "healthy" | "review_required";
  stats: IndexStats;
  reviewItems: {
    total: number;
    open: number;
  };
  packs: BriefSummaryObject[];
  skills: BriefSummaryObject[];
  agentKits: BriefSummaryObject[];
};
type BriefObjectResult = {
  kind: BriefObjectKind;
  id: string;
  limit: number;
  summary: Record<string, unknown>;
  health: Record<string, unknown>;
  sections: Array<{
    id: string;
    label: string;
    items: BriefContentItem[];
  }>;
};
type BriefResult = BriefSummaryResult | BriefObjectResult;
type QueryResult = {
  query: string;
  type: QueryKind;
  limit: number;
  total: number;
  results: unknown[];
};
type ReviewQueryResult = {
  filters: ReviewItemFilters;
  limit: number;
  total: number;
  items: ReviewItem[];
};
type ReviewCommandOptions = {
  status: string;
  severity?: string;
  type?: string;
  objectType?: string;
  objectId?: string;
  packId?: string;
  skillId?: string;
  agentKitId?: string;
};

const reviewStatuses: ReviewItem["status"][] = ["open", "ignored", "accepted", "reviewed", "resolved"];
const reviewSeverities: ReviewItem["severity"][] = ["error", "warning", "info"];
const reviewTypes: ReviewItem["type"][] = [
  "validation",
  "freshness",
  "export_safety",
  "export_readiness",
  "example_coverage",
  "safety_rules",
  "target_compatibility",
  "disallowed_pattern",
  "ai_draft",
  "review_status",
  "trust",
  "source_coverage"
];
const reviewObjectTypes: ReviewItem["objectType"][] = ["pack", "skill", "agent_kit"];

function parseListKind(value: string): ListKind | undefined {
  switch (value) {
    case "all":
      return "all";
    case "pack":
    case "packs":
      return "packs";
    case "skill":
    case "skills":
      return "skills";
    case "agent-kit":
    case "agent-kits":
      return "agent-kits";
    default:
      return undefined;
  }
}

function parseInspectKind(value: string): InspectKind | undefined {
  return ["auto", "pack", "record", "skill", "agent-kit"].includes(value) ? (value as InspectKind) : undefined;
}

function parseHealthKind(value: string): HealthKind | undefined {
  return ["auto", "summary", "pack", "skill", "agent-kit"].includes(value) ? (value as HealthKind) : undefined;
}

function parseBriefKind(value: string): BriefKind | undefined {
  return ["auto", "summary", "pack", "skill", "agent-kit"].includes(value) ? (value as BriefKind) : undefined;
}

function parseQueryKind(value: string): QueryKind | undefined {
  switch (value) {
    case "all":
      return "all";
    case "pack":
    case "packs":
      return "pack";
    case "record":
    case "records":
      return "record";
    case "skill":
    case "skills":
      return "skill";
    case "agent-kit":
    case "agent-kits":
      return "agent-kit";
    default:
      return undefined;
  }
}

function parseReviewFilters(options: ReviewCommandOptions): ReviewItemFilters | undefined {
  const status = parseReviewStatus(options.status);
  const severity = parseOptionalReviewSeverity(options.severity);
  const type = parseOptionalReviewType(options.type);
  const objectType = parseOptionalReviewObjectType(options.objectType);

  if (!status || !severity || !type || !objectType) {
    return undefined;
  }

  const filters: ReviewItemFilters = {};
  if (status !== "all") {
    filters.status = status;
  }
  if (severity !== "all") {
    filters.severity = severity;
  }
  if (type !== "all") {
    filters.type = type;
  }
  if (objectType !== "all") {
    filters.objectType = objectType;
  }
  if (options.objectId) {
    filters.objectId = options.objectId;
  }
  if (options.packId) {
    filters.packId = options.packId;
  }
  if (options.skillId) {
    filters.skillId = options.skillId;
  }
  if (options.agentKitId) {
    filters.agentKitId = options.agentKitId;
  }

  return filters;
}

function parseReviewStatus(value: string): ReviewItem["status"] | "all" | undefined {
  if (value === "all") {
    return "all";
  }
  return reviewStatuses.includes(value as ReviewItem["status"]) ? (value as ReviewItem["status"]) : undefined;
}

function parseOptionalReviewSeverity(value?: string): ReviewItem["severity"] | "all" | undefined {
  if (!value || value === "all") {
    return "all";
  }
  return reviewSeverities.includes(value as ReviewItem["severity"]) ? (value as ReviewItem["severity"]) : undefined;
}

function parseOptionalReviewType(value?: string): ReviewItem["type"] | "all" | undefined {
  if (!value || value === "all") {
    return "all";
  }
  return reviewTypes.includes(value as ReviewItem["type"]) ? (value as ReviewItem["type"]) : undefined;
}

function parseOptionalReviewObjectType(value?: string): ReviewItem["objectType"] | "all" | undefined {
  if (!value || value === "all") {
    return "all";
  }

  const normalized = value === "agent-kit" ? "agent_kit" : value;
  return reviewObjectTypes.includes(normalized as ReviewItem["objectType"]) ? (normalized as ReviewItem["objectType"]) : undefined;
}

function loadCliConfig(): ServerConfig {
  return loadConfig({
    ...process.env,
    CONTEXTARR_HOST: "127.0.0.1"
  });
}

function withConfiguredIndex<T>(callback: (db: ContextarrDatabase, config: ServerConfig) => T): T {
  const config = loadCliConfig();
  const db = openDatabase(config.databasePath);
  try {
    return callback(db, config);
  } finally {
    db.close();
  }
}

function findIndexedObject(db: ContextarrDatabase, id: string, kind: InspectKind): IndexedObject | undefined {
  const candidates: IndexedObjectKind[] =
    kind === "auto" ? ["pack", "skill", "agent-kit", "record"] : [kind];

  for (const candidate of candidates) {
    const object =
      candidate === "pack"
        ? getPack(db, id)
        : candidate === "skill"
          ? getSkill(db, id)
          : candidate === "agent-kit"
            ? getAgentKit(db, id)
            : getRecord(db, id);
    if (object) {
      return { kind: candidate, id, object };
    }
  }

  return undefined;
}

function findHealthDetail(db: ContextarrDatabase, id: string, kind: HealthKind): HealthObjectResult | undefined {
  if (kind === "summary") {
    return undefined;
  }

  const candidates: HealthObjectKind[] = kind === "auto" ? ["pack", "skill", "agent-kit"] : [kind];

  for (const candidate of candidates) {
    const health =
      candidate === "pack"
        ? getPackHealth(db, id)
        : candidate === "skill"
          ? getSkillHealth(db, id)
          : getAgentKitHealth(db, id);

    if (health) {
      return { kind: candidate, id, health };
    }
  }

  return undefined;
}

function buildHealthSummary(db: ContextarrDatabase): HealthSummaryResult {
  const stats = getIndexStats(db);
  const packs = getPacks(db);
  const skills = getSkills(db);
  const agentKits = getAgentKits(db);
  const unhealthy = {
    packs: packs.filter(hasHealthAttention).map(formatHealthSummaryObject),
    skills: skills.filter(hasHealthAttention).map(formatHealthSummaryObject),
    agentKits: agentKits.filter(hasHealthAttention).map(formatHealthSummaryObject)
  };
  const unhealthyCount = unhealthy.packs.length + unhealthy.skills.length + unhealthy.agentKits.length;

  return {
    kind: "summary",
    status: unhealthyCount === 0 && stats.openReviewItems === 0 ? "healthy" : "review_required",
    stats,
    counts: {
      packs: packs.length,
      skills: skills.length,
      agentKits: agentKits.length
    },
    reviewItems: {
      total: stats.reviewItems,
      open: stats.openReviewItems
    },
    unhealthy
  };
}

function hasHealthAttention(object: { healthStatus: string; reviewQueueCount: number }): boolean {
  return object.healthStatus !== "healthy" || object.reviewQueueCount > 0;
}

function formatHealthSummaryObject<T extends { id: string; name: string; healthStatus: string; reviewQueueCount: number }>(
  object: T
): Pick<T, "id" | "name" | "healthStatus" | "reviewQueueCount"> {
  return {
    id: object.id,
    name: object.name,
    healthStatus: object.healthStatus,
    reviewQueueCount: object.reviewQueueCount
  };
}

function buildBriefSummary(db: ContextarrDatabase, limit: number): BriefSummaryResult {
  const health = buildHealthSummary(db);
  return {
    kind: "summary",
    limit,
    status: health.status,
    stats: health.stats,
    reviewItems: health.reviewItems,
    packs: getPacks(db).slice(0, limit).map(formatPackBriefSummary),
    skills: getSkills(db).slice(0, limit).map(formatSkillBriefSummary),
    agentKits: getAgentKits(db).slice(0, limit).map(formatAgentKitBriefSummary)
  };
}

function findBriefDetail(db: ContextarrDatabase, id: string, kind: BriefKind, limit: number): BriefObjectResult | undefined {
  if (kind === "summary") {
    return undefined;
  }

  const candidates: BriefObjectKind[] = kind === "auto" ? ["pack", "skill", "agent-kit"] : [kind];

  for (const candidate of candidates) {
    if (candidate === "pack") {
      const pack = getPack(db, id);
      const health = getPackHealth(db, id);
      if (pack && health) {
        return {
          kind: candidate,
          id,
          limit,
          summary: formatObjectBriefSummary(pack),
          health: formatHealthDetailForCli(health),
          sections: [
            {
              id: "records",
              label: "Records",
              items: getPackRecords(db, id).slice(0, limit).map(formatBriefContentItem)
            }
          ]
        };
      }
    } else if (candidate === "skill") {
      const skill = getSkill(db, id);
      const health = getSkillHealth(db, id);
      if (skill && health) {
        return {
          kind: candidate,
          id,
          limit,
          summary: formatObjectBriefSummary(skill),
          health: formatHealthDetailForCli(health),
          sections: [
            {
              id: "instructions",
              label: "Instructions",
              items: getSkillInstructions(db, id).slice(0, limit).map(formatBriefContentItem)
            },
            {
              id: "examples",
              label: "Examples",
              items: getSkillExamples(db, id).slice(0, limit).map(formatBriefContentItem)
            }
          ]
        };
      }
    } else {
      const agentKit = getAgentKit(db, id);
      const health = getAgentKitHealth(db, id);
      if (agentKit && health) {
        return {
          kind: candidate,
          id,
          limit,
          summary: formatObjectBriefSummary(agentKit),
          health: formatHealthDetailForCli(health),
          sections: [
            {
              id: "contextPacks",
              label: "Context Packs",
              items: getAgentKitContextPacks(db, id).slice(0, limit).map(formatBriefContentItem)
            },
            {
              id: "skills",
              label: "Skills",
              items: getAgentKitSkills(db, id).slice(0, limit).map(formatBriefContentItem)
            }
          ]
        };
      }
    }
  }

  return undefined;
}

function formatPackBriefSummary(pack: PackSummary): BriefSummaryObject {
  return {
    id: pack.id,
    name: pack.name,
    description: pack.description,
    healthStatus: pack.healthStatus,
    reviewQueueCount: pack.reviewQueueCount
  };
}

function formatSkillBriefSummary(skill: SkillSummary): BriefSummaryObject {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    healthStatus: skill.healthStatus,
    reviewQueueCount: skill.reviewQueueCount
  };
}

function formatAgentKitBriefSummary(agentKit: AgentKitSummary): BriefSummaryObject {
  return {
    id: agentKit.id,
    name: agentKit.name,
    description: agentKit.description,
    healthStatus: agentKit.healthStatus,
    reviewQueueCount: agentKit.reviewQueueCount
  };
}

function formatRescanJson(result: RebuildIndexResult): RebuildIndexResult & { schemaVersion: string } {
  return {
    schemaVersion: "contextarr.cli.rescan.v1",
    ...result,
    skipped: result.skipped.map((skipped) => ({
      ...skipped,
      packPath: displayPath(skipped.packPath)
    })),
    skippedSkills: result.skippedSkills.map((skipped) => ({
      ...skipped,
      skillPath: displayPath(skipped.skillPath)
    })),
    skippedAgentKits: result.skippedAgentKits.map((skipped) => ({
      ...skipped,
      agentKitPath: displayPath(skipped.agentKitPath)
    }))
  };
}

function formatRescanText(result: RebuildIndexResult): string {
  const lines = [
    `Rebuilt Contextarr index at ${result.indexedAt}`,
    `Packs: ${result.packsIndexed} indexed, ${result.packsSkipped} skipped, ${result.recordsIndexed} records`,
    `Skills: ${result.skillsIndexed} indexed, ${result.skillsSkipped} skipped, ${result.skillInstructionsIndexed} instructions, ${result.skillExamplesIndexed} examples`,
    `Agent Kits: ${result.agentKitsIndexed} indexed, ${result.agentKitsSkipped} skipped`,
    `Review items: ${result.reviewItemsGenerated}`
  ];

  const skipped = [
    ...result.skipped.map((item) => `pack ${item.packId ?? displayPath(item.packPath)}`),
    ...result.skippedSkills.map((item) => `skill ${item.skillId ?? displayPath(item.skillPath)}`),
    ...result.skippedAgentKits.map((item) => `agent-kit ${item.agentKitId ?? displayPath(item.agentKitPath)}`)
  ];
  if (skipped.length > 0) {
    lines.push(`Skipped: ${skipped.join(", ")}`);
  }

  return `${lines.join("\n")}\n`;
}

function formatListJson(result: ListResult): ListResult & { schemaVersion: string } {
  return {
    schemaVersion: "contextarr.cli.list.v1",
    ...result
  };
}

function formatListText(result: ListResult): string {
  const lines = [
    `Contextarr index: ${result.stats.packs} pack(s), ${result.stats.skills} skill(s), ${result.stats.agentKits} agent kit(s)`,
    `Records: ${result.stats.records}; review items: ${result.stats.reviewItems} (${result.stats.openReviewItems} open)`,
    `Last indexed: ${result.stats.lastIndexedAt ?? "never"}`
  ];

  if (result.packs.length > 0) {
    lines.push("", "Packs:");
    lines.push(...result.packs.map((pack) => formatPackListLine(pack)));
  }

  if (result.skills.length > 0) {
    lines.push("", "Skills:");
    lines.push(...result.skills.map((skill) => formatSkillListLine(skill)));
  }

  if (result.agentKits.length > 0) {
    lines.push("", "Agent Kits:");
    lines.push(...result.agentKits.map((agentKit) => formatAgentKitListLine(agentKit)));
  }

  return `${lines.join("\n")}\n`;
}

function formatPackListLine(pack: PackSummary): string {
  return `- ${pack.id}: ${pack.name} [${pack.healthStatus}; records=${pack.recordCount}; review=${pack.reviewQueueCount}]`;
}

function formatSkillListLine(skill: SkillSummary): string {
  return `- ${skill.id}: ${skill.name} [${skill.healthStatus}; instructions=${skill.instructionCount}; review=${skill.reviewQueueCount}]`;
}

function formatAgentKitListLine(agentKit: AgentKitSummary): string {
  return `- ${agentKit.id}: ${agentKit.name} [${agentKit.healthStatus}; packs=${agentKit.contextPackCount}; skills=${agentKit.skillCount}; review=${agentKit.reviewQueueCount}]`;
}

function formatInspectJson(result: IndexedObject): { schemaVersion: string; kind: IndexedObjectKind; id: string; object: unknown } {
  return {
    schemaVersion: "contextarr.cli.inspect.v1",
    ...result
  };
}

function formatInspectText(result: IndexedObject): string {
  const object = isRecordObject(result.object) ? result.object : {};
  const title = stringValue(object.name) ?? stringValue(object.title) ?? result.id;
  const lines = [`${inspectKindLabel(result.kind)}: ${title}`, `ID: ${result.id}`];

  appendTextField(lines, "Health", object.healthStatus);
  appendTextField(lines, "Visibility", object.visibility);
  appendTextField(lines, "Trust", object.trustLevel);
  appendTextField(lines, "Review status", object.reviewStatus);
  appendTextField(lines, "Privacy", object.privacy);
  appendTextField(lines, "Updated", object.updatedAt);

  if (isRecordObject(object.counts)) {
    const countParts = Object.entries(object.counts)
      .filter(([, value]) => typeof value === "number")
      .map(([key, value]) => `${key}=${value}`);
    if (countParts.length > 0) {
      lines.push(`Counts: ${countParts.join(", ")}`);
    }
  }

  if (typeof object.reviewQueueCount === "number") {
    lines.push(`Review queue: ${object.reviewQueueCount}`);
  }

  if (result.kind === "record" && typeof object.body === "string") {
    lines.push("", object.body.trim());
  }

  return `${lines.join("\n")}\n`;
}

function formatHealthJson(result: HealthResult): unknown {
  if (result.kind === "summary") {
    return {
      schemaVersion: "contextarr.cli.health.v1",
      ...result
    };
  }

  return {
    schemaVersion: "contextarr.cli.health.v1",
    kind: result.kind,
    id: result.id,
    health: formatHealthDetailForCli(result.health)
  };
}

function formatHealthDetailForCli(health: HealthDetail): Record<string, unknown> {
  return {
    ...health,
    items: health.items.map(formatReviewItemForCli)
  };
}

function formatHealthText(result: HealthResult): string {
  if (result.kind === "summary") {
    const unhealthyCount = result.unhealthy.packs.length + result.unhealthy.skills.length + result.unhealthy.agentKits.length;
    const lines = [
      `Contextarr health: ${result.status === "healthy" ? "healthy" : "review required"}`,
      `Objects: ${result.counts.packs} pack(s), ${result.counts.skills} skill(s), ${result.counts.agentKits} agent kit(s)`,
      `Review items: ${result.reviewItems.total} total, ${result.reviewItems.open} open`,
      `Objects needing attention: ${unhealthyCount}`,
      `Last indexed: ${result.stats.lastIndexedAt ?? "never"}`
    ];

    appendHealthSummarySection(lines, "Packs", result.unhealthy.packs);
    appendHealthSummarySection(lines, "Skills", result.unhealthy.skills);
    appendHealthSummarySection(lines, "Agent Kits", result.unhealthy.agentKits);

    return `${lines.join("\n")}\n`;
  }

  const lines = [
    `${healthKindLabel(result.kind)} health: ${result.id}`,
    `Score: ${result.health.score}`,
    `Status: ${result.health.status}`,
    `Review queue: ${result.health.reviewQueueCount}`
  ];

  if (result.health.checks.length > 0) {
    lines.push("", "Checks:");
    lines.push(...result.health.checks.map((check) => `- ${check.id}: ${check.status} (${check.count})`));
  }

  if (result.health.items.length > 0) {
    lines.push("", "Review items:");
    lines.push(...result.health.items.map((item) => formatReviewItemLine(item)));
  }

  return `${lines.join("\n")}\n`;
}

function appendHealthSummarySection(
  lines: string[],
  label: string,
  objects: Array<{ id: string; name: string; healthStatus: string; reviewQueueCount: number }>
): void {
  if (objects.length === 0) {
    return;
  }

  lines.push("", `${label} needing attention:`);
  lines.push(...objects.map((object) => `- ${object.id}: ${object.name} [${object.healthStatus}; review=${object.reviewQueueCount}]`));
}

function formatBriefJson(result: BriefResult): unknown {
  return {
    schemaVersion: "contextarr.cli.brief.v1",
    ...result
  };
}

function formatBriefText(result: BriefResult): string {
  if (result.kind === "summary") {
    const lines = [
      "Contextarr brief",
      `Status: ${result.status === "healthy" ? "healthy" : "review required"}`,
      `Index: ${result.stats.packs} pack(s), ${result.stats.records} record(s), ${result.stats.skills} skill(s), ${result.stats.agentKits} agent kit(s)`,
      `Review items: ${result.reviewItems.total} total, ${result.reviewItems.open} open`,
      `Last indexed: ${result.stats.lastIndexedAt ?? "never"}`,
      `Limit: ${result.limit}`
    ];

    appendBriefSummarySection(lines, "Packs", result.packs);
    appendBriefSummarySection(lines, "Skills", result.skills);
    appendBriefSummarySection(lines, "Agent Kits", result.agentKits);

    return `${lines.join("\n")}\n`;
  }

  const lines = [
    `${healthKindLabel(result.kind)} brief: ${stringValue(result.summary.name) ?? result.id}`,
    `ID: ${result.id}`,
    `Health: ${stringValue(result.summary.healthStatus) ?? stringValue(result.health.status) ?? "unknown"}`,
    `Review queue: ${numberValue(result.summary.reviewQueueCount) ?? numberValue(result.health.reviewQueueCount) ?? 0}`,
    `Visibility: ${stringValue(result.summary.visibility) ?? "unknown"}`,
    `Trust: ${stringValue(result.summary.trustLevel) ?? "unknown"}`,
    `Updated: ${stringValue(result.summary.updatedAt) ?? "unknown"}`,
    `Limit: ${result.limit}`
  ];

  const description = stringValue(result.summary.description);
  if (description) {
    lines.push("", description);
  }

  for (const section of result.sections) {
    if (section.items.length === 0) {
      continue;
    }
    lines.push("", `${section.label}:`);
    lines.push(...section.items.map(formatBriefContentLine));
  }

  return `${lines.join("\n")}\n`;
}

function appendBriefSummarySection(lines: string[], label: string, objects: BriefSummaryObject[]): void {
  if (objects.length === 0) {
    return;
  }

  lines.push("", `${label}:`);
  lines.push(...objects.map((object) => `- ${object.id}: ${object.name} [${object.healthStatus}; review=${object.reviewQueueCount}]`));
}

function formatObjectBriefSummary(value: unknown): Record<string, unknown> {
  const object = isRecordObject(value) ? value : {};
  const counts = isRecordObject(object.counts) ? object.counts : undefined;

  return {
    id: object.id,
    name: object.name,
    description: object.description,
    type: object.type,
    visibility: object.visibility,
    trustLevel: object.trustLevel,
    healthStatus: object.healthStatus ?? (isRecordObject(object.health) ? object.health.status : undefined),
    healthScore: object.healthScore ?? (isRecordObject(object.health) ? object.health.score : undefined),
    reviewQueueCount: object.reviewQueueCount,
    updatedAt: object.updatedAt,
    lastReviewedAt: object.lastReviewedAt,
    counts
  };
}

function formatBriefContentItem(value: unknown): BriefContentItem {
  const object = isRecordObject(value) ? value : {};
  const id = stringValue(object.id) ?? "unknown";
  const title = stringValue(object.title) ?? stringValue(object.name) ?? id;
  const body = stringValue(object.body);
  const description = stringValue(object.description);
  const snippet = stringValue(object.snippet) ?? (body ? truncateText(body, 180) : description ? truncateText(description, 180) : undefined);

  return {
    id,
    title,
    kind: stringValue(object.kind) ?? stringValue(object.type),
    snippet,
    packId: stringValue(object.packId),
    skillId: stringValue(object.skillId),
    target: stringValue(object.target),
    privacyMode: stringValue(object.privacyMode)
  };
}

function formatBriefContentLine(item: BriefContentItem): string {
  const parts = [item.kind, item.packId ? `pack=${item.packId}` : undefined, item.skillId ? `skill=${item.skillId}` : undefined].filter(Boolean);
  const suffix = parts.length > 0 ? ` [${parts.join("; ")}]` : "";
  return `- ${item.id}: ${item.title}${suffix}`;
}

function formatQueryJson(result: QueryResult): unknown {
  return {
    schemaVersion: "contextarr.cli.query.v1",
    query: result.query,
    type: result.type,
    limit: result.limit,
    total: result.total,
    returned: result.results.length,
    results: result.results.map(formatQueryResultForCli)
  };
}

function formatQueryText(result: QueryResult): string {
  const lines = [
    `Query: ${result.query}`,
    `Type: ${result.type}`,
    `Results: ${result.results.length} returned (${result.total} matching)`,
    `Limit: ${result.limit}`
  ];

  if (result.results.length === 0) {
    lines.push("No indexed context matched the query.");
  } else {
    lines.push("", "Results:");
    lines.push(...result.results.map((item) => formatQueryResultLine(formatQueryResultForCli(item))));
  }

  return `${lines.join("\n")}\n`;
}

function formatQueryResultForCli(value: unknown): BriefContentItem {
  return formatBriefContentItem(value);
}

function formatQueryResultLine(item: BriefContentItem): string {
  const parts = [item.kind, item.packId ? `pack=${item.packId}` : undefined, item.skillId ? `skill=${item.skillId}` : undefined].filter(Boolean);
  const suffix = parts.length > 0 ? ` [${parts.join("; ")}]` : "";
  const snippet = item.snippet ? ` - ${collapseWhitespace(item.snippet)}` : "";
  return `- ${item.id}: ${item.title}${suffix}${snippet}`;
}

function formatReviewJson(result: ReviewQueryResult): unknown {
  return {
    schemaVersion: "contextarr.cli.review.v1",
    filters: result.filters,
    limit: result.limit,
    total: result.total,
    returned: result.items.length,
    items: result.items.map(formatReviewItemForCli)
  };
}

function formatReviewText(result: ReviewQueryResult): string {
  const lines = [
    `Review items: ${result.items.length} returned (${result.total} matching)`,
    `Filters: ${formatReviewFiltersText(result.filters)}`,
    `Limit: ${result.limit}`
  ];

  if (result.items.length === 0) {
    lines.push("No review items match the filters.");
  } else {
    lines.push("", "Items:");
    lines.push(...result.items.map((item) => formatReviewItemLine(item)));
  }

  return `${lines.join("\n")}\n`;
}

function formatReviewFiltersText(filters: ReviewItemFilters): string {
  const entries = [
    ["status", filters.status],
    ["severity", filters.severity],
    ["type", filters.type],
    ["objectType", filters.objectType ? reviewObjectTypeLabel(filters.objectType) : undefined],
    ["objectId", filters.objectId],
    ["packId", filters.packId],
    ["skillId", filters.skillId],
    ["agentKitId", filters.agentKitId]
  ].filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0);

  return entries.length > 0 ? entries.map(([key, value]) => `${key}=${value}`).join(", ") : "all";
}

function formatReviewItemForCli(item: ReviewItem): Omit<ReviewItem, "fingerprint" | "metadata"> {
  return {
    id: item.id,
    objectType: item.objectType,
    objectId: item.objectId,
    type: item.type,
    severity: item.severity,
    packId: item.packId,
    skillId: item.skillId,
    agentKitId: item.agentKitId,
    recordId: item.recordId,
    sourceId: item.sourceId,
    message: item.message,
    suggestedAction: item.suggestedAction,
    status: item.status,
    firstSeenAt: item.firstSeenAt,
    lastSeenAt: item.lastSeenAt,
    updatedAt: item.updatedAt
  };
}

function formatReviewItemLine(item: ReviewItem): string {
  return `- [${item.severity}/${item.status}] ${reviewObjectTypeLabel(item.objectType)}/${item.objectId} ${item.type}: ${item.message}`;
}

function inspectKindLabel(kind: IndexedObjectKind): string {
  switch (kind) {
    case "pack":
      return "Context Pack";
    case "skill":
      return "Skill";
    case "agent-kit":
      return "Agent Kit";
    case "record":
      return "Record";
  }
}

function healthKindLabel(kind: HealthObjectKind): string {
  switch (kind) {
    case "pack":
      return "Context Pack";
    case "skill":
      return "Skill";
    case "agent-kit":
      return "Agent Kit";
  }
}

function reviewObjectTypeLabel(value: ReviewItem["objectType"]): string {
  return value === "agent_kit" ? "agent-kit" : value;
}

function appendTextField(lines: string[], label: string, value: unknown): void {
  if (typeof value === "string" && value.trim()) {
    lines.push(`${label}: ${value}`);
  }
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function truncateText(value: string, maxLength: number): string {
  const collapsed = collapseWhitespace(value);
  return collapsed.length > maxLength ? `${collapsed.slice(0, Math.max(0, maxLength - 3))}...` : collapsed;
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

type ValidationTarget = { kind: "pack" | "skill" | "agent-kit"; path: string };
type ExportTarget = ValidationTarget;
type AnyValidationResult = ValidationResult | SkillValidationResult | AgentKitValidationResult;

function getValidationTargets(targetPath: string): ValidationTarget[] {
  if (fs.existsSync(path.join(targetPath, "contextarr-pack.json"))) {
    return [{ kind: "pack", path: targetPath }];
  }

  if (fs.existsSync(path.join(targetPath, "contextarr-skill.json"))) {
    return [{ kind: "skill", path: targetPath }];
  }

  if (fs.existsSync(path.join(targetPath, "contextarr-agent-kit.json"))) {
    return [{ kind: "agent-kit", path: targetPath }];
  }

  const childTargets = fs
    .readdirSync(targetPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry): ValidationTarget[] => {
      const candidate = path.join(targetPath, entry.name);
      if (fs.existsSync(path.join(candidate, "contextarr-pack.json"))) {
        return [{ kind: "pack", path: candidate }];
      }
      if (fs.existsSync(path.join(candidate, "contextarr-skill.json"))) {
        return [{ kind: "skill", path: candidate }];
      }
      if (fs.existsSync(path.join(candidate, "contextarr-agent-kit.json"))) {
        return [{ kind: "agent-kit", path: candidate }];
      }
      return [];
    })
    .sort((left, right) => left.path.localeCompare(right.path));

  return childTargets.length > 0 ? childTargets : [{ kind: "pack", path: targetPath }];
}

function getPackTargets(targetPath: string): string[] {
  if (fs.existsSync(path.join(targetPath, "contextarr-pack.json"))) {
    return [targetPath];
  }

  const childPacks = fs
    .readdirSync(targetPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(targetPath, entry.name))
    .filter((candidate) => fs.existsSync(path.join(candidate, "contextarr-pack.json")))
    .sort((left, right) => left.localeCompare(right));

  return childPacks.length > 0 ? childPacks : [targetPath];
}

function getSkillTargets(targetPath: string): string[] {
  if (fs.existsSync(path.join(targetPath, "contextarr-skill.json"))) {
    return [targetPath];
  }

  const childSkills = fs
    .readdirSync(targetPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(targetPath, entry.name))
    .filter((candidate) => fs.existsSync(path.join(candidate, "contextarr-skill.json")))
    .sort((left, right) => left.localeCompare(right));

  return childSkills.length > 0 ? childSkills : [targetPath];
}

function getAgentKitTargets(targetPath: string): string[] {
  if (fs.existsSync(path.join(targetPath, "contextarr-agent-kit.json"))) {
    return [targetPath];
  }

  const childAgentKits = fs
    .readdirSync(targetPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(targetPath, entry.name))
    .filter((candidate) => fs.existsSync(path.join(candidate, "contextarr-agent-kit.json")))
    .sort((left, right) => left.localeCompare(right));

  return childAgentKits.length > 0 ? childAgentKits : [targetPath];
}

function getExportTargets(targetPath: string): ExportTarget[] {
  const targets = getValidationTargets(targetPath);
  if (targets.length === 0) {
    return [{ kind: "pack", path: targetPath }];
  }

  return targets;
}

function writeExportArtifacts(outputPath: string, artifacts: ExportArtifact[]): string[] {
  const writtenFiles: string[] = [];
  const outputRoot = path.resolve(outputPath);

  for (const artifact of artifacts) {
    const ownerDirName = safePathPart(artifact.packId, "artifact owner");
    const fileName = safeFileName(artifact.filename);
    const packOutputDir = path.resolve(outputRoot, ownerDirName);
    assertInsidePath(outputRoot, packOutputDir);
    fs.mkdirSync(packOutputDir, { recursive: true });
    const filePath = path.resolve(packOutputDir, fileName);
    assertInsidePath(outputRoot, filePath);
    fs.writeFileSync(filePath, artifact.content, "utf8");
    writtenFiles.push(filePath);
  }

  return writtenFiles;
}

function safePathPart(value: string, label: string): string {
  if (!/^[a-zA-Z0-9._-]+$/.test(value) || value.includes("..")) {
    throw new ExportError("output_path_unsafe", `Export ${label} is not safe for local output: ${value}`);
  }

  return value;
}

function safeFileName(value: string): string {
  if (value !== path.basename(value) || /[\x00-\x1f\x7f]/.test(value)) {
    throw new ExportError("output_filename_unsafe", `Export filename is not safe for local output: ${value}`);
  }

  return safePathPart(value, "filename");
}

function assertInsidePath(root: string, candidate: string): void {
  const relative = path.relative(root, candidate);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return;
  }

  throw new ExportError("output_path_escape", "Export output path must stay inside the requested output directory.");
}

function formatValidationText(results: AnyValidationResult[]): string {
  return results
    .map((result) =>
      "agentKitPath" in result
        ? formatAgentKitValidationResult(result)
        : "skillPath" in result
          ? formatSkillValidationResult(result)
          : formatValidationResult(result)
    )
    .join(results.length > 1 ? "\n" : "");
}

function formatValidationTextFromFormatted(result: FormattedValidationJson): string {
  if ("results" in result) {
    return result.results.map((child) => formatValidationTextFromFormatted(child as FormattedValidationJson)).join("\n");
  }

  if ("agentKitPath" in result) {
    return formatAgentKitValidationResult(result);
  }

  if ("skillPath" in result) {
    return formatSkillValidationResult(result);
  }

  return formatPackValidationText(result as FormattedPackValidationJson);
}

function formatPackValidationText(result: FormattedPackValidationJson): string {
  const lines = [formatValidationResult(result)];

  if (result.securityGate.status === "blocked") {
    lines.push(`Security gate blocked: ${result.securityScan.status}`);
  } else if (result.securityGate.status === "review") {
    lines.push(`Security gate review required: ${result.securityScan.recommendedAction}`);
  }

  return lines.join("\n");
}

type FormattedPackValidationJson = ReturnType<typeof toValidationReportV1> & {
  securityScan: SecurityScanJson;
  securityGate: {
    status: "passed" | "review" | "blocked";
    blocking: boolean;
    recommendedAction: "activate" | "quarantine" | "review" | "block";
    message?: string;
  };
};

type SecurityScanJson =
  | Pick<
      SecurityScannerReportV1,
      "schemaVersion" | "artifactId" | "artifactType" | "artifactVersion" | "scannerVersion" | "status" | "summary" | "findings" | "limitations" | "recommendedAction"
    >
  | { status: "scanning_failed"; recommendedAction: "block"; message: string };

type FormattedValidationJson = AnyValidationResult | FormattedPackValidationJson | {
  targetPath: string;
  packPath?: string;
  skillPath?: string;
  agentKitPath?: string;
  valid: boolean;
  results: unknown[];
  summary: { errors: number; warnings: number; infos: number };
};

function formatValidationJson(targetPath: string, results: AnyValidationResult[]): FormattedValidationJson {
  if (results.length === 1) {
    return "packPath" in results[0] ? formatPackValidationJson(results[0]) : results[0];
  }

  const displayTargetPath = displayPath(targetPath);
  const formattedResults = results.map((result) => ("packPath" in result ? formatPackValidationJson(result) : result));
  const aggregate = {
    targetPath: displayTargetPath,
    valid: formattedResults.every((result) => result.valid),
    results: formattedResults,
    summary: {
      errors: results.reduce((count, result) => count + result.summary.errors, 0),
      warnings: results.reduce((count, result) => count + result.summary.warnings, 0),
      infos: results.reduce((count, result) => count + result.summary.infos, 0)
    }
  };

  if (results.every((result) => "packPath" in result)) {
    return { packPath: displayTargetPath, ...aggregate };
  }

  if (results.every((result) => "skillPath" in result)) {
    return { skillPath: displayTargetPath, ...aggregate };
  }

  if (results.every((result) => "agentKitPath" in result)) {
    return { agentKitPath: displayTargetPath, ...aggregate };
  }

  return aggregate;
}

function formatPackValidationJson(result: ValidationResult): FormattedPackValidationJson {
  const report = toValidationReportV1(result);
  try {
    const securityScan = formatSecurityScanJson(scanArtifact({ path: result.packPath, sourceTrust: scanSourceTrustForPack(result.packPath) }));
    const securityGate = formatSecurityGate(securityScan);
    const activationReady = report.valid && securityGate.status === "passed";
    return {
      ...report,
      valid: activationReady,
      validationStatus: validationStatusForSecurityGate(report.validationStatus, securityGate),
      securityScan,
      securityGate
    };
  } catch (error) {
    const securityScan = {
      status: "scanning_failed" as const,
      recommendedAction: "block" as const,
      message: errorMessage(error)
    };
    return {
      ...report,
      valid: false,
      validationStatus: "invalid",
      securityScan,
      securityGate: formatSecurityGate(securityScan)
    };
  }
}

function validationStatusForSecurityGate(
  validationStatus: ReturnType<typeof toValidationReportV1>["validationStatus"],
  securityGate: FormattedPackValidationJson["securityGate"]
): ReturnType<typeof toValidationReportV1>["validationStatus"] {
  if (securityGate.status === "blocked") {
    return "invalid";
  }

  if (securityGate.status === "review" && validationStatus === "valid") {
    return "valid_with_warnings";
  }

  return validationStatus;
}

function formatSecurityScanJson(report: SecurityScannerReportV1): Pick<
  SecurityScannerReportV1,
  "schemaVersion" | "artifactId" | "artifactType" | "artifactVersion" | "scannerVersion" | "status" | "summary" | "findings" | "limitations" | "recommendedAction"
> {
  return {
    schemaVersion: report.schemaVersion,
    artifactId: report.artifactId,
    artifactType: report.artifactType,
    artifactVersion: report.artifactVersion,
    scannerVersion: report.scannerVersion,
    status: report.status,
    summary: report.summary,
    findings: report.findings,
    limitations: report.limitations,
    recommendedAction: report.recommendedAction
  };
}

function formatSecurityGate(report: SecurityScanJson): FormattedPackValidationJson["securityGate"] {
  if (report.status === "blocked" || report.status === "critical_findings" || report.status === "scanning_failed") {
    return {
      status: "blocked",
      blocking: true,
      recommendedAction: "block",
      message: "Security scanner findings block this Context Pack until reviewed and remediated."
    };
  }

  if (report.status === "policy_warning" || report.recommendedAction === "review" || report.recommendedAction === "quarantine") {
    return {
      status: "review",
      blocking: false,
      recommendedAction: report.recommendedAction,
      message:
        report.recommendedAction === "quarantine"
          ? "Imported or restored Context Packs require manual review before activation, export, or MCP exposure."
          : "Security scanner warnings require human review before activation, export, or MCP exposure."
    };
  }

  return {
    status: "passed",
    blocking: false,
    recommendedAction: report.recommendedAction
  };
}

function isFormattedValidationJsonValid(result: FormattedValidationJson): boolean {
  if ("results" in result) {
    return result.results.every((child) => isFormattedValidationJsonValid(child as FormattedValidationJson));
  }

  return result.valid;
}

function scanSourceTrustForPack(packPath: string): "local" | "imported" {
  let current = path.resolve(packPath);

  while (true) {
    if (fs.existsSync(path.join(current, "restore-report.json"))) {
      return "imported";
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return "local";
    }
    current = parent;
  }
}

function formatImportText(result: DraftImportResult): string {
  const lines = [
    `Imported ${result.recordCount} record(s) from ${result.kind}: ${result.packPath}`,
    `Pack: ${result.packName} (${result.packId})`,
    `Sources: ${result.sourceCount}`,
    `Warnings: ${result.warnings.length}`,
    `Validation: ${result.validation.summary.errors} error(s), ${result.validation.summary.warnings} warning(s), ${result.validation.summary.infos} info(s)`
  ];

  for (const warning of result.warnings) {
    const location = warning.file ? ` ${warning.file}` : "";
    lines.push(`[WARNING] ${warning.code}${location}: ${warning.message}`);
  }

  return `${lines.join("\n")}\n`;
}

function formatImportJson(result: DraftImportResult): {
  inputPath: string;
  kind: string;
  packId: string;
  packName: string;
  packPath: string;
  counts: { records: number; sources: number; warnings: number };
  warnings: DraftImportResult["warnings"];
  validation: ValidationResult["summary"] & { valid: boolean };
} {
  return {
    inputPath: result.inputPath,
    kind: result.kind,
    packId: result.packId,
    packName: result.packName,
    packPath: result.packPath,
    counts: {
      records: result.recordCount,
      sources: result.sourceCount,
      warnings: result.warnings.length
    },
    warnings: result.warnings,
    validation: {
      valid: result.validation.valid,
      ...result.validation.summary
    }
  };
}

function formatSkillImportText(result: DraftSkillImportResult): string {
  const lines = [
    `Imported ${result.documentCount} Skill document(s) from ${result.kind}: ${result.skillPath}`,
    `Skill: ${result.skillName} (${result.skillId})`,
    `Sources: ${result.sourceCount}`,
    `Warnings: ${result.warnings.length}`,
    `Validation: ${result.validation.summary.errors} error(s), ${result.validation.summary.warnings} warning(s), ${result.validation.summary.infos} info(s)`
  ];

  for (const warning of result.warnings) {
    const location = warning.file ? ` ${warning.file}` : "";
    lines.push(`[WARNING] ${warning.code}${location}: ${warning.message}`);
  }

  return `${lines.join("\n")}\n`;
}

function formatSkillImportJson(result: DraftSkillImportResult): {
  inputPath: string;
  kind: string;
  skillId: string;
  skillName: string;
  skillPath: string;
  counts: { documents: number; sources: number; warnings: number };
  warnings: DraftSkillImportResult["warnings"];
  validation: SkillValidationResult["summary"] & { valid: boolean };
} {
  return {
    inputPath: result.inputPath,
    kind: result.kind,
    skillId: result.skillId,
    skillName: result.skillName,
    skillPath: result.skillPath,
    counts: {
      documents: result.documentCount,
      sources: result.sourceCount,
      warnings: result.warnings.length
    },
    warnings: result.warnings,
    validation: {
      valid: result.validation.valid,
      ...result.validation.summary
    }
  };
}

function formatBackupText(result: BackupResult): string {
  return [
    `Created Context Pack backup: ${result.backupPath}`,
    `Backup: ${result.backupId}`,
    `Packs: ${result.packCount}`,
    `Files: ${result.fileCount}`,
    `Bytes: ${result.byteLength}`,
    `Validation: ${result.validationErrors} error(s), ${result.validationWarnings} warning(s)`,
    `Manifest: ${result.manifestPath}`,
    `Manifest checksum: ${result.manifestSha256}`
  ].join("\n") + "\n";
}

function formatBackupJson(result: BackupResult): BackupResult {
  return result;
}

function formatRestoreText(result: RestoreResult): string {
  return [
    `Restored Context Pack backup to quarantine: ${result.outputPath}`,
    `Backup: ${result.backupId}`,
    `Status: ${result.status}`,
    `Packs: ${result.packCount}`,
    `Validation: ${result.validationErrors} error(s), ${result.validationWarnings} warning(s)`,
    `Scanner blocked: ${result.scannerBlocked}`,
    `Restore report: ${result.reportPath}`,
    "Activation: manual review required; no packs were activated automatically."
  ].join("\n") + "\n";
}

function formatRestoreJson(result: RestoreResult): RestoreResult {
  return result;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function displayPath(value: string): string {
  const cwd = path.resolve(process.env.INIT_CWD ?? process.cwd());
  const relative = path.relative(cwd, path.resolve(value));
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return relative.replace(/\\/g, "/");
  }

  return path.basename(value);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().then((code) => {
    process.exitCode = code;
  });
}
