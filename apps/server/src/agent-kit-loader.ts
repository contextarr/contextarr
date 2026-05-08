import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  agentKitExportProfileSchema,
  agentKitManifestSchema,
  type AgentKitManifest
} from "@contextarr/schema";
import { validateAgentKit } from "@contextarr/agent-kit-validator";
import type { LoadedAgentKit, LoadAgentKitsResult, SkippedAgentKit } from "./types";

export interface LoadAgentKitsOptions {
  contextPacksDir?: string;
  skillsDir?: string;
}

export function loadAgentKits(agentKitsDir: string, options: LoadAgentKitsOptions = {}): LoadAgentKitsResult {
  if (!fs.existsSync(agentKitsDir) || !fs.statSync(agentKitsDir).isDirectory()) {
    return {
      agentKits: [],
      skipped: [
        {
          agentKitPath: agentKitsDir,
          issues: [
            {
              severity: "error",
              code: "agent_kits_dir.missing",
              message: "Agent Kits directory does not exist."
            }
          ]
        }
      ]
    };
  }

  const agentKits: LoadedAgentKit[] = [];
  const skipped: SkippedAgentKit[] = [];
  const seenAgentKitIds = new Set<string>();

  for (const entry of fs.readdirSync(agentKitsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const agentKitPath = path.join(agentKitsDir, entry.name);
    const validation = validateAgentKit(agentKitPath, {
      contextPacksDir: options.contextPacksDir,
      skillsDir: options.skillsDir
    });
    const manifest = readManifest(agentKitPath);

    if (!validation.valid || !manifest) {
      skipped.push({
        agentKitPath,
        agentKitId: manifest?.id,
        issues: validation.issues
      });
      continue;
    }

    if (seenAgentKitIds.has(manifest.id)) {
      skipped.push({
        agentKitPath,
        agentKitId: manifest.id,
        issues: [
          {
            severity: "error",
            code: "agent_kit_manifest.duplicate_id",
            message: `Agent Kit ID is duplicated in this directory: ${manifest.id}`,
            path: "id"
          }
        ]
      });
      continue;
    }

    try {
      const exportProfiles = readExportProfiles(agentKitPath, manifest);
      const duplicateProfileIds = findDuplicates(exportProfiles.map((profile) => profile.id));
      if (duplicateProfileIds.length > 0) {
        skipped.push({
          agentKitPath,
          agentKitId: manifest.id,
          issues: duplicateProfileIds.map((profileId) => ({
            severity: "error" as const,
            code: "agent_kit_export_profile.duplicate_id",
            message: `Agent Kit export profile ID is duplicated in this kit: ${profileId}`,
            path: "exports"
          }))
        });
        continue;
      }

      seenAgentKitIds.add(manifest.id);
      agentKits.push({
        agentKitPath,
        manifest,
        validation,
        exportProfiles
      });
    } catch (error) {
      skipped.push({
        agentKitPath,
        agentKitId: manifest.id,
        issues: [
          {
            severity: "error",
            code: "agent_kit_loader.read_failed",
            message: stripLocalPaths(error instanceof Error ? error.message : String(error), agentKitPath)
          }
        ]
      });
    }
  }

  return { agentKits, skipped };
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates].sort();
}

function readManifest(agentKitPath: string): AgentKitManifest | undefined {
  const manifestPath = path.join(agentKitPath, "contextarr-agent-kit.json");

  if (!fs.existsSync(manifestPath)) {
    return undefined;
  }

  try {
    return agentKitManifestSchema.parse(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
  } catch {
    return undefined;
  }
}

function readExportProfiles(agentKitPath: string, manifest: AgentKitManifest) {
  const exportsDir = resolveManifestPath(agentKitPath, manifest.exportsPath);
  if (!exportsDir || !fs.existsSync(exportsDir) || !fs.statSync(exportsDir).isDirectory()) {
    return [];
  }

  return listFiles(exportsDir)
    .filter((file) => [".yaml", ".yml"].includes(path.extname(file).toLowerCase()))
    .map((file) => agentKitExportProfileSchema.parse(YAML.parse(fs.readFileSync(file, "utf8"))));
}

function listFiles(root: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    return files;
  }

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

function resolveManifestPath(agentKitPath: string, manifestPath: string): string | undefined {
  const root = path.resolve(agentKitPath);
  const resolved = path.resolve(root, manifestPath);
  const relative = path.relative(root, resolved);

  if (path.isAbsolute(manifestPath) || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return undefined;
  }

  return resolved;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function stripLocalPaths(message: string, rootPath: string): string {
  const normalizedRoot = normalizePath(path.resolve(rootPath));
  const normalizedMessage = normalizePath(message).replaceAll(normalizedRoot, "[local path]");

  return normalizedMessage
    .replace(/\b[A-Za-z]:\/[^\s"'`<>|]+/g, "[local path]")
    .replace(/(?<!:)\/\/[^/\s"'`<>|]+\/[^\s"'`<>|]+(?:\/[^\s"'`<>|]+)*/g, "[local path]")
    .replace(/\\\\[^\s"'`<>|]+/g, "[local path]");
}
