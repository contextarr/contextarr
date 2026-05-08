import { createApp } from "./api";
import { getAgentKitIndexDirs, loadConfig } from "./config";
import { openDatabase } from "./db";
import { rebuildIndex } from "./indexer";

const config = loadConfig();
const db = openDatabase(config.databasePath);
rebuildIndex(db, config.packsDir, config.skillsDir, getAgentKitIndexDirs(config));

const app = createApp({ config, db });

try {
  await app.listen({
    host: config.host,
    port: config.port
  });
  app.log.info(`Contextarr API listening on http://${config.host}:${config.port}`);
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
