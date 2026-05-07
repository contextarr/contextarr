import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Command, CommanderError } from "commander";
import {
  formatValidationResult,
  PackReadError,
  validatePack,
  type ValidationResult
} from "@contextarr/pack-validator";
import { renderPackToStaticHtml, renderPacksToStaticHtml, StaticRenderError } from "@contextarr/renderer/static";

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
    .command("validate")
    .argument("<path>", "pack directory to validate")
    .option("--format <format>", "output format: text or json", "text")
    .action((targetPath: string, options: { format: string }) => {
      const format = parseFormat(options.format);

      if (!format) {
        io.stderr.write(`Unsupported output format: ${options.format}\n`);
        exitCode = 2;
        return;
      }

      const resolvedTargetPath = path.resolve(process.env.INIT_CWD ?? process.cwd(), targetPath);

      if (!fs.existsSync(resolvedTargetPath) || !fs.statSync(resolvedTargetPath).isDirectory()) {
        io.stderr.write(`Pack path is not a readable directory: ${targetPath}\n`);
        exitCode = 2;
        return;
      }

      try {
        const targets = getValidationTargets(resolvedTargetPath);
        const results = targets.map((target) => validatePack(target));
        io.stdout.write(
          format === "json"
            ? `${JSON.stringify(formatValidationJson(resolvedTargetPath, results), null, 2)}\n`
            : formatValidationText(results)
        );
        exitCode = results.every((result) => result.valid) ? 0 : 1;
      } catch (error) {
        io.stderr.write(`${error instanceof PackReadError ? error.message : errorMessage(error)}\n`);
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

function resolveUserPath(value: string): string {
  return path.resolve(process.env.INIT_CWD ?? process.cwd(), value);
}

function getValidationTargets(targetPath: string): string[] {
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
    summary: {
      errors: results.reduce((count, result) => count + result.summary.errors, 0),
      warnings: results.reduce((count, result) => count + result.summary.warnings, 0),
      infos: results.reduce((count, result) => count + result.summary.infos, 0)
    }
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().then((code) => {
    process.exitCode = code;
  });
}
