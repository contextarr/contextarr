import path from "node:path";
import type { ServerConfig } from "./types";

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const invocationRoot = env.INIT_CWD ?? process.cwd();
  const apiToken = env.CONTEXTARR_API_TOKEN?.trim();

  return {
    host: env.CONTEXTARR_HOST ?? "127.0.0.1",
    port: Number.parseInt(env.CONTEXTARR_PORT ?? "3210", 10),
    packsDir: resolveFrom(invocationRoot, env.CONTEXTARR_PACKS_DIR ?? "./demo-packs"),
    databasePath: resolveFrom(invocationRoot, env.CONTEXTARR_DATABASE_PATH ?? "./data/contextarr.db"),
    apiToken: apiToken ? apiToken : undefined
  };
}

function resolveFrom(root: string, value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(root, value);
}
