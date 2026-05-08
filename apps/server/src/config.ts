import path from "node:path";
import fs from "node:fs";
import type { ServerConfig } from "./types";

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const invocationRoot = env.INIT_CWD ?? process.cwd();
  const apiToken = env.CONTEXTARR_API_TOKEN?.trim();

  const config: ServerConfig = {
    host: env.CONTEXTARR_HOST ?? "127.0.0.1",
    port: Number.parseInt(env.CONTEXTARR_PORT ?? "3210", 10),
    packsDir: resolveFrom(invocationRoot, env.CONTEXTARR_PACKS_DIR ?? "./demo-packs"),
    skillsDir: resolveFrom(invocationRoot, env.CONTEXTARR_SKILLS_DIR ?? "./demo-skills"),
    importedSkillsDir: resolveFrom(invocationRoot, env.CONTEXTARR_IMPORTED_SKILLS_DIR ?? "./imported-skills"),
    agentKitsDir: resolveFrom(invocationRoot, env.CONTEXTARR_AGENT_KITS_DIR ?? "./agent-kits"),
    demoAgentKitsDir: resolveFrom(invocationRoot, env.CONTEXTARR_DEMO_AGENT_KITS_DIR ?? "./demo-agent-kits"),
    databasePath: resolveFrom(invocationRoot, env.CONTEXTARR_DATABASE_PATH ?? "./data/contextarr.db"),
    webDistDir: env.CONTEXTARR_WEB_DIST_DIR?.trim() ? resolveFrom(invocationRoot, env.CONTEXTARR_WEB_DIST_DIR) : undefined,
    apiToken: apiToken ? apiToken : undefined,
    localImportsEnabled: parseBoolean(env.CONTEXTARR_ENABLE_LOCAL_IMPORTS)
  };

  assertSkillDirectorySeparation(config);
  assertAgentKitDirectorySeparation(config);
  return config;
}

export function getSkillIndexDirs(config: Pick<ServerConfig, "skillsDir" | "importedSkillsDir">): string[] {
  assertSkillDirectorySeparation(config);

  const dirs = [config.skillsDir];
  if (fs.existsSync(config.importedSkillsDir) && fs.statSync(config.importedSkillsDir).isDirectory()) {
    dirs.push(config.importedSkillsDir);
  }

  return uniqueExistingAwareDirs(dirs);
}

export function getAgentKitIndexDirs(config: Pick<ServerConfig, "agentKitsDir" | "demoAgentKitsDir">): string[] {
  assertAgentKitDirectorySeparation(config);

  const dirs = config.demoAgentKitsDir ? [config.demoAgentKitsDir] : [];
  if (fs.existsSync(config.agentKitsDir) && fs.statSync(config.agentKitsDir).isDirectory()) {
    dirs.push(config.agentKitsDir);
  }

  return uniqueExistingAwareDirs(dirs);
}

export function assertSkillDirectorySeparation(config: Pick<ServerConfig, "skillsDir" | "importedSkillsDir">): void {
  const indexed = path.resolve(config.skillsDir);
  const imported = path.resolve(config.importedSkillsDir);
  if (pathsOverlap(indexed, imported)) {
    throw new Error("CONTEXTARR_IMPORTED_SKILLS_DIR must not overlap CONTEXTARR_SKILLS_DIR.");
  }
}

export function assertImportedSkillsDirectory(config: Pick<ServerConfig, "importedSkillsDir">): void {
  const resolved = path.resolve(config.importedSkillsDir);
  const parent = path.dirname(resolved);
  if (!fs.existsSync(parent) || !fs.statSync(parent).isDirectory()) {
    fs.mkdirSync(parent, { recursive: true });
  }
}

function uniqueExistingAwareDirs(dirs: string[]): string[] {
  const seen = new Set<string>();
  return dirs.filter((dir) => {
    const resolved = normalizeExistingPathForCompare(dir);
    if (seen.has(resolved)) {
      return false;
    }
    seen.add(resolved);
    return true;
  });
}

export function assertAgentKitDirectorySeparation(config: Pick<ServerConfig, "agentKitsDir" | "demoAgentKitsDir">): void {
  if (!config.demoAgentKitsDir) {
    return;
  }

  const writable = path.resolve(config.agentKitsDir);
  const demo = path.resolve(config.demoAgentKitsDir);
  if (pathsOverlap(writable, demo)) {
    throw new Error("CONTEXTARR_AGENT_KITS_DIR must not overlap CONTEXTARR_DEMO_AGENT_KITS_DIR.");
  }
}

function resolveFrom(root: string, value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(root, value);
}

function parseBoolean(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

function pathsOverlap(left: string, right: string): boolean {
  const normalizedLeft = normalizeExistingPathForCompare(left);
  const normalizedRight = normalizeExistingPathForCompare(right);

  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.startsWith(`${normalizedRight}${path.sep}`) ||
    normalizedRight.startsWith(`${normalizedLeft}${path.sep}`)
  );
}

function normalizePathForCompare(value: string): string {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function normalizeExistingPathForCompare(value: string): string {
  const resolved = path.resolve(value);
  const missingSegments: string[] = [];
  let existingCandidate = resolved;

  while (!fs.existsSync(existingCandidate)) {
    const parent = path.dirname(existingCandidate);
    if (parent === existingCandidate) {
      return normalizePathForCompare(resolved);
    }
    missingSegments.unshift(path.basename(existingCandidate));
    existingCandidate = parent;
  }

  const realExistingPath = fs.realpathSync.native(existingCandidate);
  return normalizePathForCompare(path.join(realExistingPath, ...missingSegments));
}
