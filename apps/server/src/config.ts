import path from "node:path";
import type { ServerConfig } from "./types";

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const invocationRoot = env.INIT_CWD ?? process.cwd();
  const apiToken = env.CONTEXTARR_API_TOKEN?.trim();
  const host = env.CONTEXTARR_HOST ?? "127.0.0.1";

  if (!apiToken && !isLoopbackHost(host)) {
    throw new Error(
      `CONTEXTARR_API_TOKEN is required when CONTEXTARR_HOST is non-loopback (${host}). Use 127.0.0.1 for unauthenticated local development.`
    );
  }

  return {
    host,
    port: Number.parseInt(env.CONTEXTARR_PORT ?? "3210", 10),
    packsDir: resolveFrom(invocationRoot, env.CONTEXTARR_PACKS_DIR ?? "./demo-packs"),
    databasePath: resolveFrom(invocationRoot, env.CONTEXTARR_DATABASE_PATH ?? "./data/contextarr.db"),
    webDistDir: env.CONTEXTARR_WEB_DIST_DIR?.trim() ? resolveFrom(invocationRoot, env.CONTEXTARR_WEB_DIST_DIR) : undefined,
    apiToken: apiToken ? apiToken : undefined
  };
}

function resolveFrom(root: string, value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(root, value);
}

function isLoopbackHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}
