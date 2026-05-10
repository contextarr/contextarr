import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const cacheRoot = path.join(repoRoot, ".contextarr-cache", "v1-core");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function assertInsideRepo(targetPath) {
  const resolved = path.resolve(targetPath);
  const relative = path.relative(repoRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to operate outside repo: ${resolved}`);
  }
  return resolved;
}

function removeIfExists(relativePath) {
  const resolved = assertInsideRepo(path.join(repoRoot, relativePath));
  if (fs.existsSync(resolved)) {
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}

function run(command, env = {}) {
  return execSync(command, {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: true
  });
}

function countFiles(directory, predicate) {
  if (!fs.existsSync(directory)) {
    return 0;
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && predicate(entry.name))
    .length;
}

function expectedDemoCounts() {
  const demoRoot = path.join(repoRoot, "demo-packs");
  const packDirs = fs
    .readdirSync(demoRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(demoRoot, entry.name))
    .filter((packDir) => fs.existsSync(path.join(packDir, "contextarr-pack.json")))
    .sort();

  let recordsIndexed = 0;
  let sourcesIndexed = 0;
  let exportProfilesIndexed = 0;
  let starterPacks = 0;

  for (const packDir of packDirs) {
    const manifest = JSON.parse(fs.readFileSync(path.join(packDir, "contextarr-pack.json"), "utf8"));
    if (manifest.starterPack === true) {
      starterPacks += 1;
    }

    recordsIndexed += countFiles(path.join(packDir, "records"), (name) => name.endsWith(".md"));
    exportProfilesIndexed += countFiles(path.join(packDir, "exports"), (name) => name.endsWith(".yaml") || name.endsWith(".yml"));

    const sourcesPath = path.join(packDir, "sources", "sources.yaml");
    if (fs.existsSync(sourcesPath)) {
      const sourcesYaml = fs.readFileSync(sourcesPath, "utf8");
      sourcesIndexed += sourcesYaml.match(/^\s*-\s+id:/gm)?.length ?? 0;
    }
  }

  if (starterPacks !== 12) {
    fail(`Expected 12 curated starter Context Packs, got ${starterPacks}.`);
  }

  return {
    packsIndexed: packDirs.length,
    recordsIndexed,
    sourcesIndexed,
    exportProfilesIndexed
  };
}

removeIfExists("imported-skills/phase26-smoke");
removeIfExists(".contextarr-cache/v1-core");
fs.mkdirSync(path.join(cacheRoot, "skills"), { recursive: true });
fs.mkdirSync(path.join(cacheRoot, "imported-skills"), { recursive: true });
fs.mkdirSync(path.join(cacheRoot, "demo-agent-kits"), { recursive: true });
fs.mkdirSync(path.join(cacheRoot, "agent-kits"), { recursive: true });
fs.mkdirSync(path.join(cacheRoot, "data"), { recursive: true });

const output = run("pnpm --filter @contextarr/server rescan", {
  CONTEXTARR_PACKS_DIR: "./demo-packs",
  CONTEXTARR_DATABASE_PATH: path.join(cacheRoot, "data", "contextarr.db"),
  CONTEXTARR_SKILLS_DIR: path.join(cacheRoot, "skills"),
  CONTEXTARR_IMPORTED_SKILLS_DIR: path.join(cacheRoot, "imported-skills"),
  CONTEXTARR_DEMO_AGENT_KITS_DIR: path.join(cacheRoot, "demo-agent-kits"),
  CONTEXTARR_AGENT_KITS_DIR: path.join(cacheRoot, "agent-kits")
});

const jsonStart = output.indexOf("{");
if (jsonStart === -1) {
  fail("Server rescan did not emit JSON.");
} else {
  const result = JSON.parse(output.slice(jsonStart));

  const expectedCounts = {
    ...expectedDemoCounts(),
    packsSkipped: 0,
    skillsIndexed: 0,
    skillsSkipped: 0,
    agentKitsIndexed: 0,
    agentKitsSkipped: 0,
    reviewItemsGenerated: 0
  };

  for (const [key, expected] of Object.entries(expectedCounts)) {
    if (result[key] !== expected) {
      fail(`Expected ${key}=${expected}, got ${result[key]}.`);
    }
  }

  const emptyArrays = ["skipped", "skippedSkills", "skippedAgentKits"];
  for (const key of emptyArrays) {
    if (!Array.isArray(result[key]) || result[key].length !== 0) {
      fail(`Expected ${key} to be empty.`);
    }
  }
}

if (!process.exitCode) {
  console.log("Contextarr v1 core verification passed.");
}
