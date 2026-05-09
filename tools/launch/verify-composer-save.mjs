import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp, getAgentKitIndexDirs, getSkillIndexDirs, openDatabase, rebuildIndex } from "@contextarr/server";
import { validatePack } from "@contextarr/pack-validator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const smokeRoot = path.join(repoRoot, ".contextarr-cache", "composer-save-smoke");
const composedPacksDir = path.join(smokeRoot, "composed-packs");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const demoSkillsDir = path.join(repoRoot, "demo-skills");
const demoAgentKitsDir = path.join(repoRoot, "demo-agent-kits");

function fail(message) {
  console.error(message);
  process.exit(1);
}

fs.rmSync(smokeRoot, { recursive: true, force: true });
fs.mkdirSync(composedPacksDir, { recursive: true });

const db = openDatabase(":memory:");
const config = {
  host: "127.0.0.1",
  port: 0,
  packsDir: demoPacksDir,
  draftPacksDir: path.join(smokeRoot, "draft-packs"),
  composedPacksDir,
  skillsDir: demoSkillsDir,
  importedSkillsDir: path.join(smokeRoot, "imported-skills"),
  agentKitsDir: path.join(smokeRoot, "agent-kits"),
  demoAgentKitsDir,
  agentKitTemplatesDir: path.join(repoRoot, "agent-kit-templates"),
  databasePath: ":memory:",
  localImportsEnabled: false
};

rebuildIndex(db, config.packsDir, getSkillIndexDirs(config), getAgentKitIndexDirs(config));
const app = createApp({ config, db });

const response = await app.inject({
  method: "POST",
  url: "/api/compose/save-pack",
  payload: {
    packId: "composer-save-smoke",
    name: "Composer Save Smoke",
    title: "Composer Save Smoke",
    target: "codex",
    format: "markdown",
    privacyMode: "redacted",
    selections: [
      {
        packId: "ai-workstation-pack",
        recordIds: ["ai-workstation.local-ai-stack"]
      }
    ]
  }
});

if (response.statusCode !== 201) {
  fail(`Composer save smoke failed with ${response.statusCode}: ${response.body}`);
}

const packPath = path.join(composedPacksDir, "composer-save-smoke");
if (!fs.existsSync(path.join(packPath, "contextarr-pack.json"))) {
  fail("Composer save smoke did not write the draft pack manifest.");
}

const validation = validatePack(packPath);
if (!validation.valid) {
  fail("Composer save smoke draft pack did not validate.");
}

const manifest = JSON.parse(fs.readFileSync(path.join(packPath, "contextarr-pack.json"), "utf8"));
if (manifest.visibility !== "private" || manifest.trustLevel !== "unreviewed") {
  fail("Composer save smoke draft is not private/unreviewed.");
}

const records = fs.readdirSync(path.join(packPath, "records")).map((file) => fs.readFileSync(path.join(packPath, "records", file), "utf8"));
if (!records.join("\n").includes("review_status: draft") || !records.join("\n").includes("never_export")) {
  fail("Composer save smoke records are missing draft export-safety metadata.");
}

const rescan = await app.inject({ method: "POST", url: "/api/rescan" });
if (rescan.statusCode !== 200) {
  fail(`Composer save smoke rescan failed with ${rescan.statusCode}: ${rescan.body}`);
}

const packs = await app.inject({ method: "GET", url: "/api/packs" });
if (JSON.stringify(packs.json()).includes("composer-save-smoke")) {
  fail("Composer save smoke draft pack was indexed as an active pack.");
}

await app.close();
db.close();

console.log("Composer save-as-draft-pack smoke verified.");
