import { getAgentKitIndexDirs, loadConfig } from "./config";
import { openDatabase } from "./db";
import { rebuildIndex } from "./indexer";

const config = loadConfig();
const db = openDatabase(config.databasePath);

try {
  const result = rebuildIndex(db, config.packsDir, config.skillsDir, getAgentKitIndexDirs(config));
  console.log(JSON.stringify(result, null, 2));
} finally {
  db.close();
}
