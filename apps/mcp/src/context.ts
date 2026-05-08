import { getAgentKitIndexDirs, openDatabase, rebuildIndex, type ContextarrDatabase } from "@contextarr/server";
import { loadMcpConfig, type ContextarrMcpConfig } from "./config";

export interface ContextarrMcpContext {
  config: ContextarrMcpConfig;
  db: ContextarrDatabase;
}

export function createMcpContext(config = loadMcpConfig()): ContextarrMcpContext {
  const db = openDatabase(config.databasePath);

  if (config.rescanOnStart) {
    rebuildIndex(db, config.packsDir, config.skillsDir, getAgentKitIndexDirs(config));
  }

  return { config, db };
}

export function closeMcpContext(context: ContextarrMcpContext): void {
  context.db.close();
}
