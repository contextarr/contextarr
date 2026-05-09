import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Command, CommanderError } from "commander";
import {
  buildPackExport,
  buildPackExports,
  ExportError,
  listPackExportProfiles,
  trustedExposureExclusionReason,
  type ExportArtifact
} from "@contextarr/export-profiles";
import {
  BenchmarkError,
  runBenchmarkGate,
  runBenchmark,
  writeBenchmarkGateReports,
  writeBenchmarkReport,
  type BenchmarkGateResult,
  type BenchmarkReport,
  type WriteBenchmarkGateReportsResult,
  type WriteBenchmarkReportResult
} from "../../../packages/context-quality/src/index";
import {
  importToDraftPack,
  ImporterError,
  previewImport,
  type DraftImportResult,
  type DraftPackPreview,
  type ImporterKind
} from "@contextarr/importers";
import {
  formatValidationResult,
  PackReadError,
  validatePack,
  type ValidationIssue,
  type ValidationResult
} from "@contextarr/pack-validator";
import {
  renderPackToStaticHtml,
  renderPacksToStaticHtml,
  StaticRenderError,
  type StaticRenderResult
} from "@contextarr/renderer/static";
import {
  getIndexStats,
  getPack,
  getPackHealth,
  getPackPath,
  getPackRecords,
  getPacks,
  getRecord,
  getReviewItems,
  openDatabase,
  rebuildIndex,
  searchIndex,
  type ContextarrDatabase,
  type PackHealthDetail,
  type PackSummary,
  type RebuildIndexResult,
  type ReviewItem,
  type ReviewItemFilters,
  type ReviewItemSeverity,
  type ReviewItemStatus,
  type ReviewItemType
} from "@contextarr/server";
import {
  CliExitCode,
  type CliErrorV1,
  type CliOutputMode,
  type CliResultV1,
  type CliStatus,
  type CliWarningV1
} from "./result-types";

export type {
  CliErrorV1,
  CliExitCode,
  CliOutputMode,
  CliResultV1,
  CliStatus,
  CliWarningV1
} from "./result-types";

export type OutputFormat = "text" | "json";

export interface CliIo {
  stdout: Pick<NodeJS.WriteStream, "write">;
  stderr: Pick<NodeJS.WriteStream, "write">;
}

interface CommonOutputOptions {
  format?: string;
  json?: boolean;
  text?: boolean;
  agent?: boolean;
  quiet?: boolean;
  verbose?: boolean;
}

interface WriteOptions extends CommonOutputOptions {
  out?: string;
  output?: string;
  dryRun?: boolean;
  yes?: boolean;
}

interface BenchmarkOptions extends CommonOutputOptions {
  fixtures?: string;
  packs?: string;
  outputs?: string;
  sampleOnly?: boolean;
}

interface IndexedReadOptions extends CommonOutputOptions {
  packs?: string;
}

interface ListOptions extends IndexedReadOptions {
  pack?: string;
}

interface HealthOptions extends IndexedReadOptions {
  all?: boolean;
}

interface ReviewListOptions extends IndexedReadOptions {
  status?: string;
  severity?: string;
  type?: string;
  pack?: string;
}

interface QueryOptions extends IndexedReadOptions {
  all?: boolean;
  limit?: string;
}

interface BriefOptions extends IndexedReadOptions {
  for?: string;
  task?: string;
  markdown?: boolean;
  limit?: string;
}

interface ResolvedOutput {
  format: OutputFormat;
  envelope: boolean;
  agent: boolean;
  redacted: boolean;
}

interface PackDetail {
  id: string;
  name: string;
  description: string;
  packPath: string;
  counts: {
    records: number;
    sources: number;
    exportProfiles: number;
  };
  validation: {
    errors: number;
    warnings: number;
  };
  exportProfiles: Array<{
    id: string;
    name: string;
    target: string;
    format: string;
    privacyMode?: string | null;
    tokenBudget?: number | null;
  }>;
  sources: Array<{
    id: string;
    type: string;
    title: string;
    status?: string | null;
  }>;
}

interface RecordSummary {
  id: string;
  packId: string;
  title: string;
  type: string;
  privacy: string;
  reviewStatus: string;
  sourceStatus: string;
  tags: string[];
  sources: string[];
  filePath: string;
}

interface RecordDetail extends RecordSummary {
  body: string;
}

interface ValidateData {
  targetPath: string;
  valid: boolean;
  packs: Array<{
    packPath: string;
    valid: boolean;
    issues: CliErrorV1[];
    summary: ValidationResult["summary"];
  }>;
  summary: {
    packs: number;
    validPacks: number;
    invalidPacks: number;
    errors: number;
    warnings: number;
    infos: number;
  };
}

const defaultIo: CliIo = {
  stdout: process.stdout,
  stderr: process.stderr
};

const cliResultSchemaVersion = "contextarr.cli-result.v1";
const contextarrVersion = "0.0.0";

export async function runCli(args = process.argv.slice(2), io: CliIo = defaultIo): Promise<number> {
  let exitCode: CliExitCode = CliExitCode.Success;

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
    .command("import")
    .argument("<path>", "local folder, Markdown folder, Obsidian vault, ChatGPT export, or Claude export to import")
    .option("--kind <kind>", "import kind: auto, folder, markdown, obsidian, chatgpt, or claude", "auto")
    .option("--out <path>", "output directory for generated draft packs", "imported-packs")
    .option("--output <path>", "alias for --out")
    .option("--pack-id <id>", "draft pack id")
    .option("--name <name>", "draft pack display name")
    .option("--format <format>", "legacy output format: text or json", "text")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .option("--dry-run", "preview the import without writing files", false)
    .option("--yes", "confirm non-interactive writes in agent mode", false)
    .option("--quarantine", "future quarantine mode; supported for dry-run planning only", false)
    .option("--max-records <n>", "maximum records to import", "50")
    .option("--overwrite", "overwrite an existing generated draft pack", false)
    .action(
      (
        targetPath: string,
        options: WriteOptions & {
          kind: string;
          packId?: string;
          name?: string;
          maxRecords: string;
          overwrite?: boolean;
          quarantine?: boolean;
        }
      ) => {
        const output = resolveOutputOptions(options);
        if (!output.ok) {
          writeCliError(io, "import", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
          exitCode = CliExitCode.InvalidArguments;
          return;
        }

        const kind = parseImportKind(options.kind);
        const maxRecords = parsePositiveInteger(options.maxRecords);
        const outputDir = resolveOutputPath(options);

        if (!kind) {
          writeCliError(io, "import", output.value, invalidArgument(`Unsupported import kind: ${options.kind}`, "import.kind"));
          exitCode = CliExitCode.InvalidArguments;
          return;
        }

        if (!maxRecords) {
          writeCliError(io, "import", output.value, invalidArgument("--max-records must be a positive integer.", "import.max_records"));
          exitCode = CliExitCode.InvalidArguments;
          return;
        }

        if (!options.dryRun && options.quarantine) {
          writeCliError(
            io,
            "import",
            output.value,
            {
              code: "import.quarantine_unavailable",
              severity: "high",
              message: "Quarantine activation is not implemented for the current import command. Use --dry-run to inspect quarantine intent.",
              hint: "Run with --quarantine --dry-run, or omit --quarantine to write a generated draft pack."
            },
            CliExitCode.QuarantineRequired
          );
          exitCode = CliExitCode.QuarantineRequired;
          return;
        }

        if (!allowAgentMutation(io, "import", output.value, Boolean(options.dryRun), Boolean(options.yes))) {
          exitCode = CliExitCode.SecurityPolicyBlocked;
          return;
        }

        try {
          if (options.dryRun) {
            const preview = previewImport({
              inputPath: resolveUserPath(targetPath),
              kind,
              packId: options.packId,
              name: options.name,
              maxRecords
            });
            const data = formatImportDryRunJson(preview, resolveUserPath(outputDir), Boolean(options.quarantine));
            writeCommandOutput(io, "import", output.value, "success", true, data, formatImportDryRunText(data));
            exitCode = CliExitCode.Success;
            return;
          }

          const result = importToDraftPack({
            inputPath: resolveUserPath(targetPath),
            kind,
            outputDir: resolveUserPath(outputDir),
            packId: options.packId,
            name: options.name,
            maxRecords,
            overwrite: Boolean(options.overwrite)
          });
          const valid = result.validation.valid;
          const data = formatImportJson(result);
          writeCommandOutput(
            io,
            "import",
            output.value,
            valid ? "success" : "failed",
            valid,
            data,
            output.value.format === "json" && !output.value.envelope
              ? `${JSON.stringify(data, null, 2)}\n`
              : formatImportText(result)
          );
          exitCode = valid ? CliExitCode.Success : CliExitCode.ValidationFailed;
        } catch (error) {
          const code = exitCodeForImporterError(error);
          writeCliError(io, "import", output.value, errorToCliError(error, "import.failed"), code);
          exitCode = code;
        }
      }
    );

  program
    .command("validate")
    .argument("<path>", "pack directory to validate")
    .option("--format <format>", "legacy output format: text or json", "text")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .action((targetPath: string, options: CommonOutputOptions) => {
      const output = resolveOutputOptions(options);
      if (!output.ok) {
        writeCliError(io, "validate", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      const resolvedTargetPath = resolveUserPath(targetPath);

      if (!fs.existsSync(resolvedTargetPath) || !fs.statSync(resolvedTargetPath).isDirectory()) {
        writeCliError(
          io,
          "validate",
          output.value,
          {
            code: "path.not_found",
            severity: "high",
            message: `Pack path is not a readable directory: ${targetPath}`,
            file: targetPath
          },
          CliExitCode.NotFound
        );
        exitCode = CliExitCode.NotFound;
        return;
      }

      try {
        const targets = getValidationTargets(resolvedTargetPath);
        const results = targets.map((target) => validatePack(target));
        const data = formatValidationData(resolvedTargetPath, results);
        const valid = data.valid;

        if (output.value.envelope) {
          writeCommandOutput(
            io,
            "validate",
            output.value,
            validationStatus(data),
            valid,
            data,
            formatValidationText(results),
            validationWarnings(results),
            validationErrors(results)
          );
        } else {
          io.stdout.write(
            output.value.format === "json"
              ? `${JSON.stringify(formatValidationJson(resolvedTargetPath, results), null, 2)}\n`
              : formatValidationText(results)
          );
        }

        exitCode = valid ? CliExitCode.Success : CliExitCode.ValidationFailed;
      } catch (error) {
        const code = error instanceof PackReadError ? CliExitCode.NotFound : CliExitCode.GeneralError;
        writeCliError(io, "validate", output.value, errorToCliError(error, "validate.failed"), code);
        exitCode = code;
      }
    });

  program
    .command("render")
    .argument("<path>", "pack directory or directory of pack directories to render")
    .option("--out <path>", "output directory for static HTML")
    .option("--output <path>", "alias for --out")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .option("--dry-run", "preview render inputs without writing files", false)
    .option("--yes", "confirm non-interactive writes in agent mode", false)
    .action((targetPath: string, options: WriteOptions) => {
      const output = resolveOutputOptions(options);
      if (!output.ok) {
        writeCliError(io, "render", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      const outputPath = resolveOutputPath(options);
      if (!outputPath) {
        writeCliError(io, "render", output.value, invalidArgument("Missing required option: --out <path>.", "render.out"));
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      const resolvedTargetPath = resolveUserPath(targetPath);
      const resolvedOutputPath = resolveUserPath(outputPath);

      if (!fs.existsSync(resolvedTargetPath) || !fs.statSync(resolvedTargetPath).isDirectory()) {
        writeCliError(
          io,
          "render",
          output.value,
          {
            code: "path.not_found",
            severity: "high",
            message: `Render path is not a readable directory: ${targetPath}`,
            file: targetPath
          },
          CliExitCode.NotFound
        );
        exitCode = CliExitCode.NotFound;
        return;
      }

      if (!allowAgentMutation(io, "render", output.value, Boolean(options.dryRun), Boolean(options.yes))) {
        exitCode = CliExitCode.SecurityPolicyBlocked;
        return;
      }

      try {
        if (options.dryRun) {
          const data = buildRenderDryRunData(resolvedTargetPath, resolvedOutputPath);
          const valid = data.validation.valid;
          writeCommandOutput(
            io,
            "render",
            output.value,
            valid ? "success" : "failed",
            valid,
            data,
            valid
              ? `Would render ${data.packsRendered} pack(s), ${data.recordsRendered} record(s): ${resolvedOutputPath}\n`
              : formatValidationText(data.validation.results),
            validationWarnings(data.validation.results),
            validationErrors(data.validation.results)
          );
          exitCode = valid ? CliExitCode.Success : CliExitCode.ValidationFailed;
          return;
        }

        const result = fs.existsSync(path.join(resolvedTargetPath, "contextarr-pack.json"))
          ? renderPackToStaticHtml({ packPath: resolvedTargetPath, outputDir: resolvedOutputPath })
          : renderPacksToStaticHtml({ packsDir: resolvedTargetPath, outputDir: resolvedOutputPath });

        const data = formatRenderJson(result, false);
        writeCommandOutput(
          io,
          "render",
          output.value,
          "success",
          true,
          data,
          `Rendered ${result.packsRendered} pack(s), ${result.recordsRendered} record(s): ${result.entryFile}\n`
        );
        exitCode = CliExitCode.Success;
      } catch (error) {
        const code = error instanceof StaticRenderError ? CliExitCode.ValidationFailed : CliExitCode.GeneralError;
        writeCliError(io, "render", output.value, errorToCliError(error, "render.failed"), code);
        exitCode = code;
      }
    });

  program
    .command("export")
    .argument("<path>", "pack directory or directory of pack directories to export")
    .option("--profile <profileId>", "export profile id to generate")
    .option("--target <target>", "alias for the existing profile matching this target")
    .option("--all", "export all profiles")
    .option("--out <path>", "output directory for generated exports")
    .option("--output <path>", "alias for --out")
    .option("--privacy <privacy>", "current CLI export supports redacted profile output", "redacted")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .option("--dry-run", "preview export artifacts without writing files", false)
    .option("--yes", "confirm non-interactive writes in agent mode", false)
    .action(
      (
        targetPath: string,
        options: WriteOptions & { profile?: string; target?: string; all?: boolean; privacy: string }
      ) => {
        const output = resolveOutputOptions(options);
        if (!output.ok) {
          writeCliError(io, "export", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
          exitCode = CliExitCode.InvalidArguments;
          return;
        }

        const outputPath = resolveOutputPath(options);
        if (!outputPath) {
          writeCliError(io, "export", output.value, invalidArgument("Missing required option: --out <path>.", "export.out"));
          exitCode = CliExitCode.InvalidArguments;
          return;
        }

        const exportModeCount = [options.all, options.profile, options.target].filter(Boolean).length;
        if (exportModeCount !== 1) {
          writeCliError(
            io,
            "export",
            output.value,
            invalidArgument("Choose exactly one export mode: --profile <profile-id>, --target <target>, or --all.", "export.mode")
          );
          exitCode = CliExitCode.InvalidArguments;
          return;
        }

        if (!["redacted", "full", "public_safe"].includes(options.privacy)) {
          writeCliError(io, "export", output.value, invalidArgument(`Unsupported privacy mode: ${options.privacy}`, "export.privacy"));
          exitCode = CliExitCode.InvalidArguments;
          return;
        }

        if (options.privacy !== "redacted") {
          writeCliError(
            io,
            "export",
            output.value,
            {
              code: "export.privacy_unsupported",
              severity: "high",
              message: "The current profile-based export command only supports the existing redacted profile output.",
              hint: "Use --privacy redacted or add a future scoped privacy override implementation."
            },
            CliExitCode.UnsupportedTarget
          );
          exitCode = CliExitCode.UnsupportedTarget;
          return;
        }

        const resolvedTargetPath = resolveUserPath(targetPath);
        const resolvedOutputPath = resolveUserPath(outputPath);

        if (!fs.existsSync(resolvedTargetPath) || !fs.statSync(resolvedTargetPath).isDirectory()) {
          writeCliError(
            io,
            "export",
            output.value,
            {
              code: "path.not_found",
              severity: "high",
              message: `Export path is not a readable directory: ${targetPath}`,
              file: targetPath
            },
            CliExitCode.NotFound
          );
          exitCode = CliExitCode.NotFound;
          return;
        }

        if (!allowAgentMutation(io, "export", output.value, Boolean(options.dryRun), Boolean(options.yes))) {
          exitCode = CliExitCode.SecurityPolicyBlocked;
          return;
        }

        try {
          const packPaths = getPackTargets(resolvedTargetPath);
          const artifacts = packPaths.flatMap((packPath) =>
            options.all
              ? buildPackExports({ packPath })
              : [buildPackExport({ packPath, profileId: options.profile ?? profileIdForExportTarget(packPath, options.target!) })]
          );
          const writtenFiles = options.dryRun ? [] : writeExportArtifacts(resolvedOutputPath, artifacts);
          const data = formatExportJson(resolvedTargetPath, resolvedOutputPath, artifacts, writtenFiles, Boolean(options.dryRun));

          writeCommandOutput(
            io,
            "export",
            output.value,
            "success",
            true,
            data,
            options.dryRun
              ? `Would export ${artifacts.length} file(s): ${resolvedOutputPath}\n`
              : `Exported ${writtenFiles.length} file(s): ${resolvedOutputPath}\n`,
            exportWarnings(artifacts)
          );
          exitCode = CliExitCode.Success;
        } catch (error) {
          const code = exitCodeForExportError(error);
          writeCliError(io, "export", output.value, errorToCliError(error, "export.failed"), code);
          exitCode = code;
        }
      }
    );

  program
    .command("inspect")
    .argument("<pack>", "pack id or pack directory to inspect")
    .option("--packs <path>", "pack root directory to scan")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .action((packRef: string, options: IndexedReadOptions) => {
      const output = resolveOutputOptions(options);
      if (!output.ok) {
        writeCliError(io, "inspect", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      try {
        const data = withIndexedPacks(resolvePacksRoot(options, packRef), (db, rebuild) => {
          const packId = resolvePackId(db, packRef);
          const pack = getPack(db, packId) as PackDetail | undefined;
          if (!pack) {
            throw new CliNotFoundError(`Pack not found: ${packRef}`);
          }

          return {
            pack,
            health: getPackHealth(db, packId),
            records: (getPackRecords(db, packId) as RecordSummary[]).map(redactUntrustedRecordSummary),
            index: formatRebuildSummary(rebuild)
          };
        });
        writeCommandOutput(io, "inspect", output.value, "success", true, data, formatInspectText(data));
        exitCode = CliExitCode.Success;
      } catch (error) {
        const code = error instanceof CliNotFoundError ? CliExitCode.NotFound : CliExitCode.GeneralError;
        writeCliError(io, "inspect", output.value, errorToCliError(error, "inspect.failed"), code);
        exitCode = code;
      }
    });

  program
    .command("list")
    .argument("<kind>", "packs, records, sources, or exports")
    .option("--pack <packId>", "limit records, sources, or exports to a pack")
    .option("--packs <path>", "pack root directory to scan")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .action((kind: string, options: ListOptions) => {
      const output = resolveOutputOptions(options);
      if (!output.ok) {
        writeCliError(io, "list", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      try {
        const normalizedKind = parseListKind(kind);
        if (!normalizedKind) {
          writeCliError(io, "list", output.value, invalidArgument(`Unsupported list kind: ${kind}`, "list.kind"), CliExitCode.InvalidArguments);
          exitCode = CliExitCode.InvalidArguments;
          return;
        }

        const data = withIndexedPacks(resolvePacksRoot(options), (db, rebuild) => {
          const packs = getPacks(db);
          return {
            kind: normalizedKind,
            packsDir: resolvePacksRoot(options),
            index: formatRebuildSummary(rebuild),
            items: listIndexedItems(db, normalizedKind, options.pack, packs)
          };
        });

        writeCommandOutput(io, "list", output.value, "success", true, data, formatListText(data));
        exitCode = CliExitCode.Success;
      } catch (error) {
        const code = error instanceof CliNotFoundError ? CliExitCode.NotFound : CliExitCode.GeneralError;
        writeCliError(io, "list", output.value, errorToCliError(error, "list.failed"), code);
        exitCode = code;
      }
    });

  program
    .command("rescan")
    .option("--packs <path>", "pack root directory to scan")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .action((options: IndexedReadOptions) => {
      const output = resolveOutputOptions(options);
      if (!output.ok) {
        writeCliError(io, "rescan", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      try {
        const data = withIndexedPacks(resolvePacksRoot(options), (db, rebuild) => ({
          packsDir: resolvePacksRoot(options),
          rebuild,
          stats: getIndexStats(db)
        }));
        writeCommandOutput(io, "rescan", output.value, "success", true, data, formatRescanText(data));
        exitCode = CliExitCode.Success;
      } catch (error) {
        writeCliError(io, "rescan", output.value, errorToCliError(error, "rescan.failed"), CliExitCode.GeneralError);
        exitCode = CliExitCode.GeneralError;
      }
    });

  program
    .command("health")
    .argument("[pack]", "pack id or pack directory to inspect")
    .option("--all", "show health for all packs", false)
    .option("--packs <path>", "pack root directory to scan")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .action((packRef: string | undefined, options: HealthOptions) => {
      const output = resolveOutputOptions(options);
      if (!output.ok) {
        writeCliError(io, "health", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      try {
        const data = withIndexedPacks(resolvePacksRoot(options, packRef), (db) => {
          if (options.all || !packRef) {
            const packs = getPacks(db);
            return {
              all: true as const,
              packs: packs.map((pack) => requiredHealth(db, pack.id))
            };
          }

          const packId = resolvePackId(db, packRef);
          return {
            all: false as const,
            pack: requiredHealth(db, packId)
          };
        });
        writeCommandOutput(io, "health", output.value, "success", true, data, formatHealthText(data));
        exitCode = CliExitCode.Success;
      } catch (error) {
        const code = error instanceof CliNotFoundError ? CliExitCode.NotFound : CliExitCode.GeneralError;
        writeCliError(io, "health", output.value, errorToCliError(error, "health.failed"), code);
        exitCode = code;
      }
    });

  const review = program.command("review").description("Read-only review queue inspection");

  review
    .command("list")
    .option("--status <status>", "filter by status: open, ignored, accepted, reviewed, or resolved")
    .option("--severity <severity>", "filter by severity: error, warning, info, or critical")
    .option("--type <type>", "filter by review item type")
    .option("--pack <packId>", "filter by pack id")
    .option("--packs <path>", "pack root directory to scan")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .action((options: ReviewListOptions) => {
      const output = resolveOutputOptions(options);
      if (!output.ok) {
        writeCliError(io, "review list", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      try {
        const filters = parseReviewFilters(options);
        const data = withIndexedPacks(resolvePacksRoot(options), (db) => {
          const items = getReviewItems(db, filters);
          const allItems = getReviewItems(db);
          return {
            filters,
            items,
            counts: {
              total: allItems.length,
              open: allItems.filter((item) => item.status === "open").length,
              filtered: items.length
            }
          };
        });
        writeCommandOutput(io, "review list", output.value, "success", true, data, formatReviewListText(data));
        exitCode = CliExitCode.Success;
      } catch (error) {
        const code = error instanceof CliInvalidArgumentError ? CliExitCode.InvalidArguments : CliExitCode.GeneralError;
        writeCliError(io, "review list", output.value, errorToCliError(error, "review.list_failed"), code);
        exitCode = code;
      }
    });

  review
    .command("show")
    .argument("<reviewItemId>", "review item id")
    .option("--packs <path>", "pack root directory to scan")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .action((reviewItemId: string, options: IndexedReadOptions) => {
      const output = resolveOutputOptions(options);
      if (!output.ok) {
        writeCliError(io, "review show", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      try {
        const data = withIndexedPacks(resolvePacksRoot(options), (db) => {
          const item = getReviewItems(db).find((candidate) => candidate.id === reviewItemId);
          if (!item) {
            throw new CliNotFoundError(`Review item not found: ${reviewItemId}`);
          }

          return { item };
        });
        writeCommandOutput(io, "review show", output.value, "success", true, data, formatReviewShowText(data));
        exitCode = CliExitCode.Success;
      } catch (error) {
        const code = error instanceof CliNotFoundError ? CliExitCode.NotFound : CliExitCode.GeneralError;
        writeCliError(io, "review show", output.value, errorToCliError(error, "review.show_failed"), code);
        exitCode = code;
      }
    });

  program
    .command("query")
    .argument("[packOrQuery]", "pack id when --all is not used, or query when --all is used")
    .argument("[query]", "query text when a pack id is provided")
    .option("--all", "search across all packs", false)
    .option("--limit <n>", "maximum result count", "8")
    .option("--packs <path>", "pack root directory to scan")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .action((packOrQuery: string | undefined, queryArg: string | undefined, options: QueryOptions) => {
      const output = resolveOutputOptions(options);
      if (!output.ok) {
        writeCliError(io, "query", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      try {
        const limit = parsePositiveInteger(options.limit ?? "8");
        if (!limit) {
          throw new CliInvalidArgumentError("--limit must be a positive integer.");
        }

        const request = resolveQueryRequest(Boolean(options.all), packOrQuery, queryArg);
        const data = withIndexedPacks(resolvePacksRoot(options), (db) => buildQueryData(db, request, limit));
        writeCommandOutput(io, "query", output.value, "success", true, data, formatQueryText(data));
        exitCode = CliExitCode.Success;
      } catch (error) {
        const code =
          error instanceof CliInvalidArgumentError
            ? CliExitCode.InvalidArguments
            : error instanceof CliNotFoundError
              ? CliExitCode.NotFound
              : CliExitCode.GeneralError;
        writeCliError(io, "query", output.value, errorToCliError(error, "query.failed"), code);
        exitCode = code;
      }
    });

  program
    .command("brief")
    .argument("<pack>", "pack id or pack directory to brief")
    .option("--for <target>", "brief target, such as codex, claude-code, chatgpt, or markdown", "codex")
    .option("--task <task>", "task the brief should support")
    .option("--markdown", "emit Markdown in text mode", false)
    .option("--limit <n>", "maximum trusted record count", "8")
    .option("--packs <path>", "pack root directory to scan")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .action((packRef: string, options: BriefOptions) => {
      const output = resolveOutputOptions(options);
      if (!output.ok) {
        writeCliError(io, "brief", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      try {
        const limit = parsePositiveInteger(options.limit ?? "8");
        if (!limit) {
          throw new CliInvalidArgumentError("--limit must be a positive integer.");
        }

        const data = withIndexedPacks(resolvePacksRoot(options, packRef), (db) => buildBriefData(db, packRef, options, limit));
        const text = options.markdown ? formatBriefMarkdown(data) : formatBriefText(data);
        writeCommandOutput(io, "brief", output.value, "success", true, data, text);
        exitCode = CliExitCode.Success;
      } catch (error) {
        const code =
          error instanceof CliInvalidArgumentError
            ? CliExitCode.InvalidArguments
            : error instanceof CliNotFoundError
              ? CliExitCode.NotFound
              : CliExitCode.GeneralError;
        writeCliError(io, "brief", output.value, errorToCliError(error, "brief.failed"), code);
        exitCode = code;
      }
    });

  const benchmark = program.command("benchmark").description("Context Quality Benchmark tooling");

  benchmark
    .command("run")
    .argument("<task-id>", "benchmark task id to score")
    .option("--fixtures <path>", "benchmark fixtures directory", "demo-evals")
    .option("--packs <path>", "demo packs directory for Contextarr export inputs", "demo-packs")
    .option("--outputs <path>", "optional local condition outputs directory")
    .option("--sample-only", "score only local fixture and local export content", true)
    .option("--format <format>", "legacy output format: text or json", "text")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .action((taskId: string, options: BenchmarkOptions) => {
      const output = resolveOutputOptions(options);
      if (!output.ok) {
        writeCliError(io, "benchmark run", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      try {
        const report = runBenchmark({
          benchmarkDir: resolveUserPath(options.fixtures ?? "demo-evals"),
          packsDir: resolveUserPath(options.packs ?? "demo-packs"),
          conditionOutputsDir: options.outputs ? resolveUserPath(options.outputs) : undefined,
          taskId
        });

        writeCommandOutput(
          io,
          "benchmark run",
          output.value,
          "success",
          true,
          report,
          formatBenchmarkText(report)
        );
        exitCode = CliExitCode.Success;
      } catch (error) {
        const code = exitCodeForBenchmarkError(error);
        writeCliError(io, "benchmark run", output.value, errorToCliError(error, "benchmark.run_failed"), code);
        exitCode = code;
      }
    });

  benchmark
    .command("report")
    .argument("<task-id>", "benchmark task id to score and write")
    .option("--fixtures <path>", "benchmark fixtures directory", "demo-evals")
    .option("--packs <path>", "demo packs directory for Contextarr export inputs", "demo-packs")
    .option("--outputs <path>", "optional local condition outputs directory")
    .option("--out <path>", "output directory for benchmark reports")
    .option("--output <path>", "alias for --out")
    .option("--sample-only", "score only local fixture and local export content", true)
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .option("--yes", "confirm non-interactive writes in agent mode", false)
    .action((taskId: string, options: BenchmarkOptions & WriteOptions) => {
      const output = resolveOutputOptions(options);
      if (!output.ok) {
        writeCliError(io, "benchmark report", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      const outputPath = resolveOutputPath(options);
      if (!outputPath) {
        writeCliError(
          io,
          "benchmark report",
          output.value,
          invalidArgument("Missing required option: --out <path>.", "benchmark.report.out")
        );
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      if (!allowAgentMutation(io, "benchmark report", output.value, false, Boolean(options.yes))) {
        exitCode = CliExitCode.SecurityPolicyBlocked;
        return;
      }

      try {
        const result = writeBenchmarkReport({
          benchmarkDir: resolveUserPath(options.fixtures ?? "demo-evals"),
          packsDir: resolveUserPath(options.packs ?? "demo-packs"),
          conditionOutputsDir: options.outputs ? resolveUserPath(options.outputs) : undefined,
          taskId,
          outDir: resolveUserPath(outputPath)
        });

        const data = formatBenchmarkReportJson(result);
        writeCommandOutput(
          io,
          "benchmark report",
          output.value,
          "success",
          true,
          data,
          `Wrote benchmark report: ${result.jsonPath}\nWrote benchmark report: ${result.markdownPath}\n`
        );
        exitCode = CliExitCode.Success;
      } catch (error) {
        const code = exitCodeForBenchmarkError(error);
        writeCliError(io, "benchmark report", output.value, errorToCliError(error, "benchmark.report_failed"), code);
        exitCode = code;
      }
    });

  benchmark
    .command("gate")
    .argument("[task-id]", "benchmark task id to gate, or omit with --all")
    .option("--all", "gate every accepted demo benchmark task", false)
    .option("--fixtures <path>", "benchmark fixtures directory", "demo-evals")
    .option("--packs <path>", "demo packs directory for Contextarr export inputs", "demo-packs")
    .option("--outputs <path>", "optional local condition outputs directory")
    .option("--out <path>", "optional output directory for gate and task reports")
    .option("--output <path>", "alias for --out")
    .option("--sample-only", "gate only local fixture and local export content", true)
    .option("--min-export-score <score>", "minimum passing Contextarr export score", "80")
    .option("--json", "output stable CLI JSON envelope")
    .option("--text", "output human-readable text")
    .option("--agent", "strict non-interactive agent mode")
    .option("--quiet", "suppress non-essential diagnostics")
    .option("--verbose", "include extra diagnostics on stderr")
    .option("--yes", "confirm report writes in agent mode", false)
    .action((taskId: string | undefined, options: BenchmarkOptions & WriteOptions & { all?: boolean; minExportScore: string }) => {
      const output = resolveOutputOptions(options);
      if (!output.ok) {
        writeCliError(io, "benchmark gate", fallbackOutput(options), output.error, CliExitCode.InvalidArguments);
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      if (taskId && options.all) {
        writeCliError(
          io,
          "benchmark gate",
          output.value,
          invalidArgument("Use either <task-id> or --all, not both.", "benchmark.gate.scope"),
          CliExitCode.InvalidArguments
        );
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      if (!taskId && !options.all) {
        writeCliError(
          io,
          "benchmark gate",
          output.value,
          invalidArgument("Provide a benchmark <task-id> or pass --all.", "benchmark.gate.scope"),
          CliExitCode.InvalidArguments
        );
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      const minimumContextarrExportScore = parseScoreThreshold(options.minExportScore);
      if (minimumContextarrExportScore === undefined) {
        writeCliError(
          io,
          "benchmark gate",
          output.value,
          invalidArgument("--min-export-score must be an integer from 0 to 100.", "benchmark.gate.min_export_score"),
          CliExitCode.InvalidArguments
        );
        exitCode = CliExitCode.InvalidArguments;
        return;
      }

      const outputPath = resolveOutputPath(options);
      if (outputPath && !allowAgentMutation(io, "benchmark gate", output.value, false, Boolean(options.yes))) {
        exitCode = CliExitCode.SecurityPolicyBlocked;
        return;
      }

      try {
        const gateOptions = {
          benchmarkDir: resolveUserPath(options.fixtures ?? "demo-evals"),
          packsDir: resolveUserPath(options.packs ?? "demo-packs"),
          conditionOutputsDir: options.outputs ? resolveUserPath(options.outputs) : undefined,
          taskIds: taskId ? [taskId] : undefined,
          minimumContextarrExportScore
        };
        const result = outputPath
          ? writeBenchmarkGateReports({
              ...gateOptions,
              outDir: resolveUserPath(outputPath)
            })
          : runBenchmarkGate(gateOptions);
        const gate = "gate" in result ? result.gate : result;
        const errors = gate.passed
          ? []
          : [
              {
                code: "benchmark.gate_failed",
                severity: "high" as const,
                message: `Benchmark gate failed for ${gate.summary.failed} of ${gate.summary.tasks} task(s).`,
                hint: "Inspect failed task checks in the gate output before using this as a release/demo gate."
              }
            ];

        writeCommandOutput(
          io,
          "benchmark gate",
          output.value,
          gate.passed ? "success" : "blocked",
          gate.passed,
          outputPath ? formatBenchmarkGateReportJson(result as WriteBenchmarkGateReportsResult) : gate,
          formatBenchmarkGateText(gate, outputPath ? (result as WriteBenchmarkGateReportsResult) : undefined),
          [],
          errors
        );
        exitCode = gate.passed ? CliExitCode.Success : CliExitCode.RedactionOrExportBlocked;
      } catch (error) {
        const code = exitCodeForBenchmarkError(error);
        writeCliError(io, "benchmark gate", output.value, errorToCliError(error, "benchmark.gate_failed"), code);
        exitCode = code;
      }
    });

  try {
    await program.parseAsync(args, { from: "user" });
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.exitCode === CliExitCode.Success || error.code === "commander.helpDisplayed") {
        return CliExitCode.Success;
      }

      const output = fallbackOutputFromArgs(args);
      writeCliError(io, commandNameFromArgs(args), output, invalidArgument(error.message, "cli.arguments"), CliExitCode.InvalidArguments);
      return CliExitCode.InvalidArguments;
    }

    const output = fallbackOutputFromArgs(args);
    writeCliError(io, commandNameFromArgs(args), output, errorToCliError(error, "cli.failed"), CliExitCode.GeneralError);
    return CliExitCode.GeneralError;
  }

  return exitCode;
}

function resolveOutputOptions(options: CommonOutputOptions): { ok: true; value: ResolvedOutput } | { ok: false; error: CliErrorV1 } {
  const requestedFormat = options.format ?? "text";
  const parsedFormat = parseFormat(requestedFormat);

  if (!parsedFormat) {
    return { ok: false, error: invalidArgument(`Unsupported output format: ${requestedFormat}`, "cli.output_format") };
  }

  if (options.json && options.text) {
    return { ok: false, error: invalidArgument("Choose only one output mode: --json or --text.", "cli.output_mode") };
  }

  if (options.text && requestedFormat === "json") {
    return { ok: false, error: invalidArgument("Choose only one output mode: --format json or --text.", "cli.output_mode") };
  }

  const envelope = Boolean(options.json || options.agent);
  const format: OutputFormat = envelope || options.json ? "json" : options.text ? "text" : parsedFormat;

  return {
    ok: true,
    value: {
      format,
      envelope,
      agent: Boolean(options.agent),
      redacted: Boolean(options.agent)
    }
  };
}

function fallbackOutput(options: CommonOutputOptions): ResolvedOutput {
  return {
    format: options.json || options.agent || options.format === "json" ? "json" : "text",
    envelope: Boolean(options.json || options.agent),
    agent: Boolean(options.agent),
    redacted: Boolean(options.agent)
  };
}

function fallbackOutputFromArgs(args: string[]): ResolvedOutput {
  const envelope = args.includes("--json") || args.includes("--agent");
  return {
    format: envelope || args.includes("--format") && args.includes("json") ? "json" : "text",
    envelope,
    agent: args.includes("--agent"),
    redacted: args.includes("--agent")
  };
}

function parseFormat(value: string): OutputFormat | undefined {
  return value === "text" || value === "json" ? value : undefined;
}

function parseImportKind(value: string): ImporterKind | undefined {
  return ["auto", "folder", "markdown", "obsidian", "chatgpt", "claude"].includes(value)
    ? (value as ImporterKind)
    : undefined;
}

function parsePositiveInteger(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseScoreThreshold(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 100 ? parsed : undefined;
}

type ListKind = "packs" | "records" | "sources" | "exports";

class CliNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliNotFoundError";
  }
}

class CliInvalidArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliInvalidArgumentError";
  }
}

function withIndexedPacks<T>(packsDir: string, callback: (db: ContextarrDatabase, rebuild: RebuildIndexResult) => T): T {
  const db = openDatabase(":memory:");

  try {
    const rebuild = rebuildIndex(db, packsDir);
    return callback(db, rebuild);
  } finally {
    db.close();
  }
}

function resolvePacksRoot(options: { packs?: string }, packRef?: string): string {
  if (options.packs) {
    return resolveUserPath(options.packs);
  }

  if (packRef) {
    const candidate = resolveUserPath(packRef);
    if (fs.existsSync(path.join(candidate, "contextarr-pack.json"))) {
      return path.dirname(candidate);
    }
  }

  return resolveUserPath(process.env.CONTEXTARR_PACKS_DIR ?? "demo-packs");
}

function resolvePackId(db: ContextarrDatabase, packRef: string): string {
  const candidate = resolveUserPath(packRef);
  const packId = fs.existsSync(path.join(candidate, "contextarr-pack.json")) ? readPackId(candidate) : packRef;

  if (!getPack(db, packId)) {
    throw new CliNotFoundError(`Pack not found: ${packRef}`);
  }

  return packId;
}

function requiredHealth(db: ContextarrDatabase, packId: string): PackHealthDetail {
  const health = getPackHealth(db, packId);
  if (!health) {
    throw new CliNotFoundError(`Pack health not found: ${packId}`);
  }

  return health;
}

function parseListKind(value: string): ListKind | undefined {
  return ["packs", "records", "sources", "exports"].includes(value) ? (value as ListKind) : undefined;
}

function listIndexedItems(
  db: ContextarrDatabase,
  kind: ListKind,
  packRef: string | undefined,
  packs: PackSummary[]
): unknown[] {
  if (kind === "packs") {
    return packs;
  }

  const packIds = packRef ? [resolvePackId(db, packRef)] : packs.map((pack) => pack.id);

  if (kind === "records") {
    return packIds.flatMap((packId) =>
      (getPackRecords(db, packId) as RecordSummary[]).map(redactUntrustedRecordSummary)
    );
  }

  if (kind === "sources") {
    return packIds.flatMap((packId) => {
      const pack = getPack(db, packId) as PackDetail | undefined;
      return (pack?.sources ?? []).map((source) => ({ ...source, packId }));
    });
  }

  return packIds.flatMap((packId) => {
    const pack = getPack(db, packId) as PackDetail | undefined;
    return (pack?.exportProfiles ?? []).map((profile) => ({ ...profile, packId }));
  });
}

function redactUntrustedRecordSummary(record: RecordSummary): RecordSummary {
  const reason = trustedExposureExclusionReason(record);
  if (!reason) {
    return record;
  }

  return {
    ...record,
    title: "[redacted]",
    tags: [],
    sources: []
  };
}

function parseReviewFilters(options: ReviewListOptions): ReviewItemFilters {
  const filters: ReviewItemFilters = {};

  if (options.status) {
    const status = parseReviewStatus(options.status);
    if (!status) {
      throw new CliInvalidArgumentError(`Unsupported review status: ${options.status}`);
    }
    filters.status = status;
  }

  if (options.severity) {
    const severity = parseReviewSeverity(options.severity);
    if (!severity) {
      throw new CliInvalidArgumentError(`Unsupported review severity: ${options.severity}`);
    }
    filters.severity = severity;
  }

  if (options.type) {
    const type = parseReviewType(options.type);
    if (!type) {
      throw new CliInvalidArgumentError(`Unsupported review type: ${options.type}`);
    }
    filters.type = type;
  }

  if (options.pack) {
    filters.packId = options.pack;
  }

  return filters;
}

function parseReviewStatus(value: string): ReviewItemStatus | undefined {
  return ["open", "ignored", "accepted", "reviewed", "resolved"].includes(value)
    ? (value as ReviewItemStatus)
    : undefined;
}

function parseReviewSeverity(value: string): ReviewItemSeverity | undefined {
  if (value === "critical") {
    return "error";
  }

  return ["error", "warning", "info"].includes(value) ? (value as ReviewItemSeverity) : undefined;
}

function parseReviewType(value: string): ReviewItemType | undefined {
  return ["validation", "freshness", "export_safety", "review_status", "trust", "source_coverage"].includes(value)
    ? (value as ReviewItemType)
    : undefined;
}

function resolveQueryRequest(
  all: boolean,
  packOrQuery: string | undefined,
  queryArg: string | undefined
): { all: true; query: string } | { all: false; packRef: string; query: string } {
  if (all) {
    const query = queryArg ?? packOrQuery;
    if (!query) {
      throw new CliInvalidArgumentError("Missing query text.");
    }
    return { all: true, query };
  }

  if (!packOrQuery || !queryArg) {
    throw new CliInvalidArgumentError("Usage: contextarr query <pack-id> \"query\" or contextarr query --all \"query\".");
  }

  return { all: false, packRef: packOrQuery, query: queryArg };
}

function buildQueryData(
  db: ContextarrDatabase,
  request: { all: true; query: string } | { all: false; packRef: string; query: string },
  limit: number
): {
  query: string;
  all: boolean;
  packId?: string;
  results: unknown[];
  omittedUntrusted: number;
} {
  if (!request.all) {
    const packId = resolvePackId(db, request.packRef);
    const matches = getPackRecords(db, packId, { q: request.query }) as RecordSummary[];
    const trusted = filterTrustedRecordSummaries(matches);
    return {
      query: request.query,
      all: false,
      packId,
      results: trusted.records.slice(0, limit),
      omittedUntrusted: trusted.omitted
    };
  }

  let omittedUntrusted = 0;
  const results = searchIndex(db, request.query).filter((result) => {
    if (!isRecordSearchResult(result)) {
      return true;
    }

    const record = getRecord(db, result.id) as RecordDetail | undefined;
    if (!record || trustedExposureExclusionReason(record)) {
      omittedUntrusted += 1;
      return false;
    }

    return true;
  });

  return {
    query: request.query,
    all: true,
    results: results.slice(0, limit),
    omittedUntrusted
  };
}

function filterTrustedRecordSummaries(records: RecordSummary[]): { records: RecordSummary[]; omitted: number } {
  const trusted: RecordSummary[] = [];
  let omitted = 0;

  for (const record of records) {
    if (trustedExposureExclusionReason(record)) {
      omitted += 1;
      continue;
    }

    trusted.push(record);
  }

  return { records: trusted, omitted };
}

function buildBriefData(
  db: ContextarrDatabase,
  packRef: string,
  options: BriefOptions,
  limit: number
): {
  target: string;
  task: string | null;
  pack: PackDetail;
  records: Array<RecordSummary & { excerpt: string }>;
  omittedUntrusted: number;
} {
  const packId = resolvePackId(db, packRef);
  const pack = getPack(db, packId) as PackDetail | undefined;
  if (!pack) {
    throw new CliNotFoundError(`Pack not found: ${packRef}`);
  }

  const summaries = getPackRecords(db, packId) as RecordSummary[];
  const trusted = filterTrustedRecordSummaries(summaries);
  const records = trusted.records.slice(0, limit).map((summary) => {
    const detail = getRecord(db, summary.id) as RecordDetail | undefined;
    return {
      ...summary,
      excerpt: truncateInlineText(detail?.body ?? "", 900)
    };
  });

  return {
    target: options.for ?? "codex",
    task: options.task ?? null,
    pack,
    records,
    omittedUntrusted: trusted.omitted
  };
}

function isRecordSearchResult(value: unknown): value is { id: string; kind: "record" } {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { kind?: unknown }).kind === "record" &&
    typeof (value as { id?: unknown }).id === "string"
  );
}

function formatRebuildSummary(rebuild: RebuildIndexResult): {
  indexedAt: string;
  packsIndexed: number;
  packsSkipped: number;
  recordsIndexed: number;
  sourcesIndexed: number;
  exportProfilesIndexed: number;
  reviewItemsGenerated: number;
} {
  return {
    indexedAt: rebuild.indexedAt,
    packsIndexed: rebuild.packsIndexed,
    packsSkipped: rebuild.packsSkipped,
    recordsIndexed: rebuild.recordsIndexed,
    sourcesIndexed: rebuild.sourcesIndexed,
    exportProfilesIndexed: rebuild.exportProfilesIndexed,
    reviewItemsGenerated: rebuild.reviewItemsGenerated
  };
}

function resolveUserPath(value: string): string {
  return path.resolve(process.env.INIT_CWD ?? process.cwd(), value);
}

function resolveOutputPath(options: WriteOptions): string {
  return options.out ?? options.output ?? "";
}

function allowAgentMutation(
  io: CliIo,
  command: string,
  output: ResolvedOutput,
  dryRun: boolean,
  confirmed: boolean
): boolean {
  if (!output.agent || dryRun || confirmed) {
    return true;
  }

  writeCliError(
    io,
    command,
    output,
    {
      code: "mutation.confirmation_required",
      severity: "high",
      message: `contextarr ${command} would write files and requires --yes in --agent mode.`,
      hint: "Add --dry-run to inspect the planned operation without writing, or add --yes to confirm the write."
    },
    CliExitCode.SecurityPolicyBlocked
  );
  return false;
}

function getValidationTargets(targetPath: string): string[] {
  return getPackTargets(targetPath);
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

function writeExportArtifacts(outputPath: string, artifacts: ExportArtifact[]): string[] {
  const writtenFiles: string[] = [];

  for (const artifact of artifacts) {
    const packOutputDir = path.join(outputPath, artifact.packId);
    fs.mkdirSync(packOutputDir, { recursive: true });
    const filePath = path.join(packOutputDir, artifact.filename);
    fs.writeFileSync(filePath, artifact.content, "utf8");
    writtenFiles.push(filePath);
  }

  return writtenFiles;
}

function profileIdForExportTarget(packPath: string, target: string): string {
  const requestedTarget = target.trim();
  const matches = listPackExportProfiles({ packPath }).filter(({ profile }) => profile.target === requestedTarget);

  if (matches.length === 0) {
    throw new ExportError(
      "target_profile_not_found",
      `No existing export profile matches target "${requestedTarget}" in pack ${readPackId(packPath)}. Use --profile <profile-id> for an explicit profile, or choose a target already declared by the pack.`
    );
  }

  if (matches.length > 1) {
    const profileIds = matches.map(({ profile }) => profile.id).sort((left, right) => left.localeCompare(right));
    throw new ExportError(
      "target_profile_ambiguous",
      `Multiple export profiles target "${requestedTarget}" in pack ${readPackId(packPath)}: ${profileIds.join(", ")}. Use --profile <profile-id>.`
    );
  }

  return matches[0].profile.id;
}

function formatInspectText(data: {
  pack: PackDetail;
  health: PackHealthDetail | undefined;
  records: RecordSummary[];
  index: ReturnType<typeof formatRebuildSummary>;
}): string {
  const lines = [
    `Pack: ${data.pack.name} (${data.pack.id})`,
    `Path: ${data.pack.packPath}`,
    `Records: ${data.pack.counts.records}`,
    `Sources: ${data.pack.counts.sources}`,
    `Exports: ${data.pack.counts.exportProfiles}`,
    `Health: ${data.health?.status ?? "unknown"} (${data.health?.score ?? "n/a"})`,
    `Review items: ${data.health?.reviewQueueCount ?? data.pack.validation.errors + data.pack.validation.warnings}`,
    `Indexed records: ${data.index.recordsIndexed}`
  ];

  return `${lines.join("\n")}\n`;
}

function formatListText(data: { kind: ListKind; items: unknown[] }): string {
  const lines = [`${data.kind}: ${data.items.length}`];

  for (const item of data.items) {
    if (isPackSummary(item)) {
      lines.push(`${item.id}\t${item.name}\t${item.healthStatus}\t${item.recordCount} record(s)`);
    } else if (isRecordSummary(item)) {
      lines.push(`${item.id}\t${item.title}\t${item.reviewStatus}\t${item.privacy}`);
    } else if (isExportProfileSummary(item)) {
      lines.push(`${item.packId}\t${item.id}\t${item.target}\t${item.format}`);
    } else if (isSourceSummary(item)) {
      lines.push(`${item.packId}\t${item.id}\t${item.type}\t${item.title}`);
    } else {
      lines.push(JSON.stringify(item));
    }
  }

  return `${lines.join("\n")}\n`;
}

function formatRescanText(data: { packsDir: string; rebuild: RebuildIndexResult }): string {
  return [
    `Scanned: ${data.packsDir}`,
    `Packs indexed: ${data.rebuild.packsIndexed}`,
    `Packs skipped: ${data.rebuild.packsSkipped}`,
    `Records indexed: ${data.rebuild.recordsIndexed}`,
    `Review items generated: ${data.rebuild.reviewItemsGenerated}`
  ].join("\n") + "\n";
}

function formatHealthText(data: { all: true; packs: PackHealthDetail[] } | { all: false; pack: PackHealthDetail }): string {
  const health = data.all ? data.packs : [data.pack];
  const lines = [`Health: ${health.length} pack(s)`];

  for (const pack of health) {
    lines.push(`${pack.packId}\t${pack.status}\t${pack.score}\t${pack.reviewQueueCount} review item(s)`);
    for (const check of pack.checks) {
      lines.push(`  ${check.id}: ${check.status} (${check.count})`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function formatReviewListText(data: { items: ReviewItem[]; counts: { total: number; open: number; filtered: number } }): string {
  const lines = [`Review items: ${data.counts.filtered}/${data.counts.total} (open ${data.counts.open})`];

  for (const item of data.items) {
    lines.push(`${item.id}\t${item.severity}\t${item.status}\t${item.packId}\t${item.message}`);
  }

  return `${lines.join("\n")}\n`;
}

function formatReviewShowText(data: { item: ReviewItem }): string {
  const item = data.item;
  return [
    `Review item: ${item.id}`,
    `Pack: ${item.packId}`,
    `Record: ${item.recordId ?? "n/a"}`,
    `Type: ${item.type}`,
    `Severity: ${item.severity}`,
    `Status: ${item.status}`,
    `Message: ${item.message}`,
    `Suggested action: ${item.suggestedAction}`
  ].join("\n") + "\n";
}

function formatQueryText(data: { query: string; all: boolean; packId?: string; results: unknown[]; omittedUntrusted: number }): string {
  const lines = [
    `Query: ${data.query}`,
    `Scope: ${data.all ? "all packs" : data.packId}`,
    `Results: ${data.results.length}`,
    `Omitted untrusted records: ${data.omittedUntrusted}`
  ];

  for (const result of data.results) {
    if (isRecordSummary(result)) {
      lines.push(`${result.id}\t${result.title}\t${result.type}`);
    } else if (isRecordSearchResult(result)) {
      const snippetValue = (result as { snippet?: unknown }).snippet;
      const snippet = typeof snippetValue === "string" ? `\t${snippetValue}` : "";
      lines.push(`${result.id}\trecord${snippet}`);
    } else if (isPackSearchResult(result)) {
      lines.push(`${result.id}\tpack\t${result.title}`);
    } else {
      lines.push(JSON.stringify(result));
    }
  }

  return `${lines.join("\n")}\n`;
}

function formatBriefText(data: ReturnType<typeof buildBriefData>): string {
  return formatBriefMarkdown(data);
}

function formatBriefMarkdown(data: ReturnType<typeof buildBriefData>): string {
  const lines = [
    `# ${data.pack.name} Brief`,
    "",
    `Target: ${data.target}`,
    data.task ? `Task: ${data.task}` : "Task: not specified",
    `Pack: ${data.pack.id}`,
    `Trusted records included: ${data.records.length}`,
    `Omitted untrusted records: ${data.omittedUntrusted}`,
    "",
    "## Records"
  ];

  for (const record of data.records) {
    lines.push("", `### ${record.title}`, "", `- ID: ${record.id}`, `- Type: ${record.type}`, `- Tags: ${record.tags.join(", ") || "none"}`, "", record.excerpt || "_No body excerpt._");
  }

  return `${lines.join("\n")}\n`;
}

function truncateInlineText(value: string, maxChars: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, maxChars).trimEnd()}...`;
}

function isPackSummary(value: unknown): value is PackSummary {
  return typeof value === "object" && value !== null && typeof (value as { recordCount?: unknown }).recordCount === "number";
}

function isRecordSummary(value: unknown): value is RecordSummary {
  return typeof value === "object" && value !== null && typeof (value as { reviewStatus?: unknown }).reviewStatus === "string";
}

function isExportProfileSummary(value: unknown): value is { packId: string; id: string; target: string; format: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { target?: unknown }).target === "string" &&
    typeof (value as { format?: unknown }).format === "string" &&
    typeof (value as { packId?: unknown }).packId === "string"
  );
}

function isSourceSummary(value: unknown): value is { packId: string; id: string; type: string; title: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { title?: unknown }).title === "string" &&
    typeof (value as { type?: unknown }).type === "string" &&
    typeof (value as { packId?: unknown }).packId === "string"
  );
}

function isPackSearchResult(value: unknown): value is { id: string; kind: "pack"; title: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { kind?: unknown }).kind === "pack" &&
    typeof (value as { id?: unknown }).id === "string" &&
    typeof (value as { title?: unknown }).title === "string"
  );
}

function writeCommandOutput<TData>(
  io: CliIo,
  command: string,
  output: ResolvedOutput,
  status: CliStatus,
  ok: boolean,
  data: TData,
  textOutput: string,
  warnings: CliWarningV1[] = [],
  errors: CliErrorV1[] = []
): void {
  if (output.envelope) {
    writeEnvelope(io, makeResult(command, output, status, ok, data, warnings, errors));
    return;
  }

  io.stdout.write(textOutput);
}

function writeCliError(
  io: CliIo,
  command: string,
  output: ResolvedOutput,
  error: CliErrorV1,
  exitCode: CliExitCode = CliExitCode.GeneralError
): void {
  if (output.envelope) {
    writeEnvelope(io, makeResult(command, output, statusForExitCode(exitCode), false, {}, [], [error]));
    return;
  }

  io.stderr.write(`${error.message}\n`);
}

function writeEnvelope<TData>(io: CliIo, result: CliResultV1<TData>): void {
  io.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function makeResult<TData>(
  command: string,
  output: ResolvedOutput,
  status: CliStatus,
  ok: boolean,
  data: TData,
  warnings: CliWarningV1[],
  errors: CliErrorV1[]
): CliResultV1<TData> {
  return {
    schemaVersion: cliResultSchemaVersion,
    command,
    status,
    ok,
    data,
    warnings,
    errors,
    meta: {
      contextarrVersion,
      workingDirectory: process.env.INIT_CWD ?? process.cwd(),
      redacted: output.redacted || output.agent
    }
  };
}

function statusForExitCode(exitCode: CliExitCode): CliStatus {
  switch (exitCode) {
    case CliExitCode.Success:
      return "success";
    case CliExitCode.SecurityPolicyBlocked:
    case CliExitCode.ReviewStatusBlocked:
    case CliExitCode.RedactionOrExportBlocked:
    case CliExitCode.QuarantineRequired:
      return "blocked";
    default:
      return "failed";
  }
}

function commandNameFromArgs(args: string[]): string {
  return args.find((arg) => !arg.startsWith("-")) ?? "contextarr";
}

function invalidArgument(message: string, code: string): CliErrorV1 {
  return {
    code,
    severity: "medium",
    message
  };
}

function errorToCliError(error: unknown, fallbackCode: string): CliErrorV1 {
  return {
    code: error instanceof ImporterError || error instanceof ExportError || error instanceof BenchmarkError ? error.code : fallbackCode,
    severity: "high",
    message: errorMessage(error)
  };
}

function exitCodeForImporterError(error: unknown): CliExitCode {
  if (!(error instanceof ImporterError)) {
    return CliExitCode.GeneralError;
  }

  if (error.code === "input.not_found") {
    return CliExitCode.NotFound;
  }

  if (error.code.startsWith("input.")) {
    return CliExitCode.InvalidArguments;
  }

  return CliExitCode.GeneralError;
}

function exitCodeForExportError(error: unknown): CliExitCode {
  if (!(error instanceof ExportError)) {
    return CliExitCode.GeneralError;
  }

  if (error.code === "profile_not_found" || error.code === "record_not_found") {
    return CliExitCode.NotFound;
  }

  if (error.code === "unsupported_target" || error.code === "unsupported_format") {
    return CliExitCode.UnsupportedTarget;
  }

  if (error.code === "target_profile_not_found" || error.code === "target_profile_ambiguous") {
    return CliExitCode.UnsupportedTarget;
  }

  if (error.code === "validation_failed") {
    return CliExitCode.ValidationFailed;
  }

  return CliExitCode.GeneralError;
}

function exitCodeForBenchmarkError(error: unknown): CliExitCode {
  if (!(error instanceof BenchmarkError)) {
    return CliExitCode.GeneralError;
  }

  if (error.code === "benchmark.file_not_found" || error.code === "benchmark.task_not_found" || error.code === "benchmark.pack_not_found") {
    return CliExitCode.NotFound;
  }

  if (error.code === "benchmark.safety_boundary") {
    return CliExitCode.SecurityPolicyBlocked;
  }

  if (
    error.code === "benchmark.invalid_shape" ||
    error.code === "benchmark.schema_version" ||
    error.code === "benchmark.task_schema_version" ||
    error.code === "benchmark.expected_facts_schema_version" ||
    error.code === "benchmark.scoring_rubric_schema_version" ||
    error.code === "benchmark.task_mismatch" ||
    error.code === "benchmark.task_type_mismatch" ||
    error.code === "benchmark.pack_mismatch" ||
    error.code === "benchmark.condition_mismatch" ||
    error.code === "benchmark.condition_file_missing"
  ) {
    return CliExitCode.ValidationFailed;
  }

  return CliExitCode.GeneralError;
}

function formatValidationText(results: ValidationResult[]): string {
  return results.map((result) => formatValidationResult(result)).join(results.length > 1 ? "\n" : "");
}

function formatValidationJson(targetPath: string, results: ValidationResult[]): ValidationResult | {
  packPath: string;
  valid: boolean;
  results: ValidationResult[];
  summary: { errors: number; warnings: number; infos: number };
} {
  if (results.length === 1) {
    return results[0];
  }

  return {
    packPath: targetPath,
    valid: results.every((result) => result.valid),
    results,
    summary: validationSummary(results)
  };
}

function formatValidationData(targetPath: string, results: ValidationResult[]): ValidateData {
  const summary = validationSummary(results);

  return {
    targetPath,
    valid: results.every((result) => result.valid),
    packs: results.map((result) => ({
      packPath: result.packPath,
      valid: result.valid,
      issues: result.issues.map(validationIssueToCliError),
      summary: result.summary
    })),
    summary: {
      packs: results.length,
      validPacks: results.filter((result) => result.valid).length,
      invalidPacks: results.filter((result) => !result.valid).length,
      ...summary
    }
  };
}

function validationSummary(results: ValidationResult[]): { errors: number; warnings: number; infos: number } {
  return {
    errors: results.reduce((count, result) => count + result.summary.errors, 0),
    warnings: results.reduce((count, result) => count + result.summary.warnings, 0),
    infos: results.reduce((count, result) => count + result.summary.infos, 0)
  };
}

function validationStatus(data: ValidateData): CliStatus {
  if (!data.valid) {
    return "failed";
  }

  return data.summary.warnings > 0 || data.summary.infos > 0 ? "warning" : "success";
}

function validationErrors(results: ValidationResult[]): CliErrorV1[] {
  return results.flatMap((result) =>
    result.issues.filter((issue) => issue.severity === "error").map(validationIssueToCliError)
  );
}

function validationWarnings(results: ValidationResult[]): CliWarningV1[] {
  return results.flatMap((result) =>
    result.issues
      .filter((issue) => issue.severity !== "error")
      .map((issue) => ({
        code: issue.code,
        severity: issue.severity === "warning" ? "medium" : "info",
        message: issue.message,
        file: issue.file,
        path: issue.path
      }))
  );
}

function validationIssueToCliError(issue: ValidationIssue): CliErrorV1 {
  return {
    code: issue.code,
    severity: issue.severity === "error" ? "high" : issue.severity === "warning" ? "medium" : "info",
    message: issue.message,
    file: issue.file,
    path: issue.path
  };
}

function buildRenderDryRunData(targetPath: string, outputPath: string): {
  targetPath: string;
  outputPath: string;
  dryRun: true;
  packsRendered: number;
  recordsRendered: number;
  packIds: string[];
  validation: {
    valid: boolean;
    results: ValidationResult[];
    summary: { errors: number; warnings: number; infos: number };
  };
} {
  const targets = getPackTargets(targetPath);
  const results = targets.map((target) => validatePack(target));
  const valid = results.every((result) => result.valid);
  const packIds = valid ? targets.map(readPackId).sort((left, right) => left.localeCompare(right)) : [];

  return {
    targetPath,
    outputPath,
    dryRun: true,
    packsRendered: valid ? targets.length : 0,
    recordsRendered: valid ? targets.reduce((count, packPath) => count + countPackRecords(packPath), 0) : 0,
    packIds,
    validation: {
      valid,
      results,
      summary: validationSummary(results)
    }
  };
}

function formatRenderJson(result: StaticRenderResult, dryRun: boolean): {
  outputDir: string;
  entryFile: string;
  packsRendered: number;
  recordsRendered: number;
  packIds: string[];
  dryRun: boolean;
} {
  return {
    outputDir: result.outputDir,
    entryFile: result.entryFile,
    packsRendered: result.packsRendered,
    recordsRendered: result.recordsRendered,
    packIds: result.packIds,
    dryRun
  };
}

function formatExportJson(
  targetPath: string,
  outputPath: string,
  artifacts: ExportArtifact[],
  writtenFiles: string[],
  dryRun: boolean
): {
  targetPath: string;
  outputPath: string;
  dryRun: boolean;
  files: Array<{
    packId: string;
    profileId: string;
    target: string;
    format: string;
    filename: string;
    outputPath: string;
    bytes: number;
    estimatedTokens: number;
    includedRecords: number;
    excludedRecords: number;
    warnings: number;
  }>;
  writtenFiles: string[];
  counts: { files: number; packs: number; warnings: number };
} {
  return {
    targetPath,
    outputPath,
    dryRun,
    files: artifacts.map((artifact) => ({
      packId: artifact.packId,
      profileId: artifact.profileId,
      target: artifact.target,
      format: artifact.format,
      filename: artifact.filename,
      outputPath: path.join(outputPath, artifact.packId, artifact.filename),
      bytes: artifact.byteLength,
      estimatedTokens: artifact.estimatedTokens,
      includedRecords: artifact.includedRecords.length,
      excludedRecords: artifact.excludedRecords.length,
      warnings: artifact.warnings.length
    })),
    writtenFiles,
    counts: {
      files: artifacts.length,
      packs: new Set(artifacts.map((artifact) => artifact.packId)).size,
      warnings: artifacts.reduce((count, artifact) => count + artifact.warnings.length, 0)
    }
  };
}

function exportWarnings(artifacts: ExportArtifact[]): CliWarningV1[] {
  return artifacts.flatMap((artifact) =>
    artifact.warnings.map((warning) => ({
      code: warning.code,
      severity: "medium",
      message: warning.message,
      path: artifact.filename
    }))
  );
}

function formatBenchmarkText(report: BenchmarkReport): string {
  const lines = [
    `Benchmark: ${report.taskName} (${report.taskId})`,
    `Winner: ${report.winner ?? "none"}`,
    report.summary,
    ""
  ];

  for (const condition of report.conditions) {
    lines.push(
      `${condition.id}: ${condition.score}/${condition.maxScore} ${condition.passed ? "passed" : "failed"}`,
      `  matched: ${condition.matchedFacts.length > 0 ? condition.matchedFacts.join(", ") : "none"}`,
      `  missing: ${condition.missingFacts.length > 0 ? condition.missingFacts.join(", ") : "none"}`
    );
  }

  return `${lines.join("\n")}\n`;
}

function formatBenchmarkReportJson(result: WriteBenchmarkReportResult): {
  report: BenchmarkReport;
  files: { json: string; markdown: string };
} {
  return {
    report: result.report,
    files: {
      json: result.jsonPath,
      markdown: result.markdownPath
    }
  };
}

function formatBenchmarkGateText(gate: BenchmarkGateResult, written?: WriteBenchmarkGateReportsResult): string {
  const lines = [
    `Benchmark gate: ${gate.passed ? "passed" : "failed"}`,
    `Tasks: ${gate.summary.passed}/${gate.summary.tasks} passed`,
    `Minimum Contextarr export score: ${gate.minimumContextarrExportScore}`,
    `Contextarr export minimum observed score: ${gate.summary.contextarrExportMinimumObservedScore ?? "none"}`,
    `Failures: ${gate.summary.failures}`,
    ""
  ];

  for (const task of gate.tasks) {
    const failedChecks = task.checks.filter((check) => !check.passed);
    lines.push(
      `${task.taskId}: ${task.passed ? "passed" : "failed"} contextarr_export=${task.contextarrExportScore ?? "missing"}`,
      `  baselines: ${formatBenchmarkBaselineScores(task.baselineScores)}`,
      `  missing: ${task.missingFacts.length > 0 ? task.missingFacts.join(", ") : "none"}`,
      `  failures: ${task.failures.length > 0 ? task.failures.join(", ") : "none"}`
    );

    for (const check of failedChecks) {
      lines.push(`  failed check: ${check.id} - ${check.message}`);
    }
  }

  if (written) {
    lines.push("", `Wrote benchmark gate: ${written.gateJsonPath}`, `Wrote benchmark gate: ${written.gateMarkdownPath}`);
    for (const file of written.reportFiles) {
      lines.push(`Wrote benchmark report: ${file.jsonPath}`, `Wrote benchmark report: ${file.markdownPath}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function formatBenchmarkGateReportJson(result: WriteBenchmarkGateReportsResult): {
  gate: BenchmarkGateResult;
  files: {
    gateJson: string;
    gateMarkdown: string;
    reports: Array<{ taskId: string; json: string; markdown: string }>;
  };
} {
  return {
    gate: result.gate,
    files: {
      gateJson: result.gateJsonPath,
      gateMarkdown: result.gateMarkdownPath,
      reports: result.reportFiles.map((file) => ({
        taskId: file.taskId,
        json: file.jsonPath,
        markdown: file.markdownPath
      }))
    }
  };
}

function formatBenchmarkBaselineScores(scores: Partial<Record<string, number>>): string {
  const entries = Object.entries(scores)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([condition, score]) => `${condition}=${score}`);
  return entries.length > 0 ? entries.join(", ") : "none";
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
  dryRun: false;
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
    dryRun: false,
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

function formatImportDryRunJson(
  preview: DraftPackPreview,
  outputRoot: string,
  quarantineRequested: boolean
): {
  inputPath: string;
  detectedKind: string;
  packId: string;
  packName: string;
  packPath: string;
  dryRun: true;
  quarantineRequired: boolean;
  wouldWrite: Array<{ path: string; kind: string }>;
  records: { detected: number; wouldImport: number; skipped: number };
  warnings: DraftPackPreview["warnings"];
  blockers: CliErrorV1[];
} {
  const packPath = path.join(outputRoot, preview.packId);

  return {
    inputPath: preview.inputPath,
    detectedKind: preview.kind,
    packId: preview.packId,
    packName: preview.packName,
    packPath,
    dryRun: true,
    quarantineRequired: quarantineRequested,
    wouldWrite: [
      { path: path.join(packPath, "contextarr-pack.json"), kind: "manifest" },
      { path: path.join(packPath, "README.md"), kind: "asset" },
      { path: path.join(packPath, "CHANGELOG.md"), kind: "asset" },
      { path: path.join(packPath, "LICENSE"), kind: "asset" },
      ...preview.records.map((record) => ({
        path: path.join(packPath, "records", `${record.id.slice(preview.packId.length + 1)}.md`),
        kind: "record"
      })),
      { path: path.join(packPath, "sources", "sources.yaml"), kind: "source" },
      { path: path.join(packPath, "rules", "validation.yaml"), kind: "rule" },
      { path: path.join(packPath, "rules", "redaction.yaml"), kind: "rule" },
      { path: path.join(packPath, "rules", "freshness.yaml"), kind: "rule" }
    ],
    records: {
      detected: preview.records.length,
      wouldImport: preview.records.length,
      skipped: 0
    },
    warnings: preview.warnings,
    blockers: []
  };
}

function formatImportDryRunText(data: ReturnType<typeof formatImportDryRunJson>): string {
  return [
    `Would import ${data.records.wouldImport} record(s) from ${data.detectedKind}: ${data.packPath}`,
    `Pack: ${data.packName} (${data.packId})`,
    `Would write: ${data.wouldWrite.length} file(s)`,
    `Quarantine required: ${data.quarantineRequired ? "yes" : "no"}`,
    `Warnings: ${data.warnings.length}`
  ].join("\n") + "\n";
}

function readPackId(packPath: string): string {
  const manifest = JSON.parse(fs.readFileSync(path.join(packPath, "contextarr-pack.json"), "utf8")) as { id?: string };
  return manifest.id ?? path.basename(packPath);
}

function countPackRecords(packPath: string): number {
  const manifest = JSON.parse(fs.readFileSync(path.join(packPath, "contextarr-pack.json"), "utf8")) as { recordsPath?: string };
  const recordsPath = path.join(packPath, manifest.recordsPath ?? "records");
  if (!fs.existsSync(recordsPath)) {
    return 0;
  }

  return listFiles(recordsPath).filter((file) => file.toLowerCase().endsWith(".md")).length;
}

function listFiles(root: string): string[] {
  const files: string[] = [];

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().then((code) => {
    process.exitCode = code;
  });
}
