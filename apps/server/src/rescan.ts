import { getAgentKitIndexDirs, getSkillIndexDirs, loadConfig } from "./config";
import { openDatabase } from "./db";
import { rebuildIndex } from "./indexer";

const config = loadConfig();
const db = openDatabase(config.databasePath);

try {
  const result = rebuildIndex(db, config.packsDir, getSkillIndexDirs(config), getAgentKitIndexDirs(config));
  console.log(JSON.stringify(result, null, 2));
} finally {
  db.close();
}
