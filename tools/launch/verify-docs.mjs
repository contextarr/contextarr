import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const requiredFiles = [
  "README.md",
  "docs/quickstart.md",
  "docs/docker.md",
  "docs/security.md",
  "docs/api.md",
  "docs/collectors.md",
  "docs/composed-packs.md",
  "docs/pack-authoring.md",
  "docs/export-profiles.md",
  "docs/mcp.md",
  "docs/roadmap.md",
  "docs/demo-script.md",
  "docs/release-checklist.md",
  "docs/screenshots/README.md",
  "Dockerfile",
  "docker-compose.yml",
  ".dockerignore",
];

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(repoRoot, file))) {
    fail(`Missing launch file: ${file}`);
  }
}

if (!failed) {
  const readme = read("README.md");
  const mcp = read("docs/mcp.md");
  const docker = read("docs/docker.md");
  const security = read("docs/security.md");
  const securityModel = read("docs/security-model.md");
  const architecture = read("docs/architecture.md");
  const agentKits = read("docs/agent-kits.md");
  const roadmap = read("docs/roadmap.md");
  const apiDocs = read("docs/api.md");
  const collectorsDocs = read("docs/collectors.md");
  const composedPacksDocs = read("docs/composed-packs.md");
  const configReference = read("docs/config-reference.md");
  const serverReadme = read("apps/server/README.md");
  const envExample = read(".env.example");
  const releaseChecklist = read("docs/release-checklist.md");
  const packageJson = JSON.parse(read("package.json"));
  const mcpPackageJson = JSON.parse(read("apps/mcp/package.json"));
  const combinedDocs = [readme, mcp, docker].join("\n");

  const requiredReadmeText = [
    "Phase 11",
    "pnpm phase11:verify",
    "docker compose up",
    "docs/quickstart.md",
    "docs/docker.md",
    "docs/security.md",
    "docs/pack-authoring.md",
    "docs/export-profiles.md",
    "docs/release-checklist.md",
  ];
  for (const text of requiredReadmeText) {
    if (!readme.includes(text)) {
      fail(`README is missing launch text: ${text}`);
    }
  }

  if (!mcp.includes("pnpm contextarr-mcp")) {
    fail("MCP docs must document pnpm contextarr-mcp.");
  }
  for (const forbidden of ["pnpm exec contextarr-mcp", "pnpm --filter @contextarr/mcp exec contextarr-mcp"]) {
    if (combinedDocs.includes(forbidden)) {
      fail(`Docs must not document the unsupported MCP command: ${forbidden}`);
    }
  }
  if (Object.prototype.hasOwnProperty.call(mcpPackageJson, "bin")) {
    fail("apps/mcp/package.json must not reintroduce a private package bin.");
  }

  if (
    !docker.includes("http://127.0.0.1:3210") ||
    !docker.includes("CONTEXTARR_WEB_DIST_DIR") ||
    !docker.includes("CONTEXTARR_DOCKER_PORT") ||
    !docker.includes("CONTEXTARR_SKILLS_DIR") ||
    !docker.includes("CONTEXTARR_DEMO_AGENT_KITS_DIR") ||
    !docker.includes("CONTEXTARR_AGENT_KITS_DIR")
  ) {
    fail("Docker docs must include the local URL, web dist env var, Skills dir, demo/saved Agent Kits dirs, and host port override.");
  }

  if (!security.includes("No telemetry") || !security.includes("No marketplace") || !security.includes("No executable packs")) {
    fail("Launch security docs must keep v0 non-goals visible.");
  }

  const requiredPhase15Text = [
    "Phase 15",
    "CONTEXTARR_SKILLS_DIR",
    "/api/skills",
    "/api/search?type=skill&q=",
  ];
  for (const text of requiredPhase15Text) {
    if (!readme.includes(text)) {
      fail(`README is missing Phase 15 text: ${text}`);
    }
  }
  if (!architecture.includes("/api/skills") || !architecture.includes("Skill-scoped search")) {
    fail("Architecture docs must describe Phase 15 Skill API and search.");
  }
  if (!security.includes("Skills") || !security.includes("non-executable")) {
    fail("Security docs must describe non-executable Skill boundaries.");
  }

  const requiredPhase21Text = [
    "Phase 21",
    "phase21:verify",
    "CONTEXTARR_AGENT_KITS_DIR",
    "/api/agent-kits",
    "/api/search?type=agent-kit&q=",
  ];
  for (const text of requiredPhase21Text) {
    if (!readme.includes(text)) {
      fail(`README is missing Phase 21 text: ${text}`);
    }
  }
  if (!architecture.includes("/api/agent-kits") || !architecture.includes("Agent Kit-scoped search")) {
    fail("Architecture docs must describe Phase 21 Agent Kit API and search.");
  }
  if (!packageJson.scripts["phase21:verify"]) {
    fail("Root package scripts must include phase21:verify.");
  }

  const requiredPhase22Text = [
    "Phase 22",
    "phase22:verify",
    "POST /api/agent-kits",
    "Agent Kit Composer",
    "CONTEXTARR_DEMO_AGENT_KITS_DIR",
  ];
  for (const text of requiredPhase22Text) {
    if (!readme.includes(text)) {
      fail(`README is missing Phase 22 text: ${text}`);
    }
  }
  if (!architecture.includes("POST /api/agent-kits") || !architecture.includes("validated local Agent Kit saves")) {
    fail("Architecture docs must describe Phase 22 Agent Kit saves.");
  }
  if (
    !agentKits.includes("Phase 22") ||
    !agentKits.includes("POST /api/agent-kits") ||
    !agentKits.includes("CONTEXTARR_AGENT_KITS_DIR")
  ) {
    fail("Agent Kits docs must describe Phase 22 Composer saves and the local Agent Kits directory.");
  }
  if (!roadmap.includes("Phase 22: Agent Kit Composer UI. Complete.")) {
    fail("Roadmap must mark Phase 22 complete.");
  }
  if (!securityModel.includes("validated local Agent Kit Composer save flow")) {
    fail("Security model must describe Phase 22 validated local Agent Kit saves.");
  }
  if (!packageJson.scripts["phase22:verify"]) {
    fail("Root package scripts must include phase22:verify.");
  }

  const requiredPhase23Text = [
    "Phase 23",
    "phase23:verify",
    "Agent Kit Library",
    "read-only Agent Kit",
    "Agent Kit health",
    "detail",
  ];
  for (const text of requiredPhase23Text) {
    if (!readme.includes(text)) {
      fail(`README is missing Phase 23 text: ${text}`);
    }
  }
  if (!architecture.includes("/api/agent-kits/:id/health") || !architecture.includes("Agent Kit health")) {
    fail("Architecture docs must describe Phase 23 Agent Kit health/detail support.");
  }
  if (!agentKits.includes("Phase 23") || !agentKits.includes("Agent Kit Library") || !agentKits.includes("health")) {
    fail("Agent Kits docs must describe Phase 23 read-only Library/detail/health scopes.");
  }
  if (!security.includes("Phase 23") || !security.includes("non-executable")) {
    fail("Security docs must include Phase 23 non-executable library/detail/health boundaries.");
  }
  if (!securityModel.includes("Phase 23") || !securityModel.includes("read-only") || !securityModel.includes("health")) {
    fail("Security model docs must include Phase 23 read-only health/detail boundaries.");
  }
  if (!packageJson.scripts["phase23:verify"]) {
    fail("Root package scripts must include phase23:verify.");
  }

  const exportProfiles = read("docs/export-profiles.md");
  const requiredPhase24Text = [
    "Phase 24",
    "phase24:verify",
    "Agent Kit Export Engine",
    "GET /api/agent-kits/:id/exports/:profileId/preview",
    "contextarr export demo-agent-kits",
  ];
  for (const text of requiredPhase24Text) {
    if (!readme.includes(text)) {
      fail(`README is missing Phase 24 text: ${text}`);
    }
  }
  if (!agentKits.includes("Phase 24") || !agentKits.includes("profile-driven export generation")) {
    fail("Agent Kits docs must describe Phase 24 profile-driven export generation.");
  }
  if (!exportProfiles.includes("Agent Kit exports") || !exportProfiles.includes("contextarr export demo-agent-kits")) {
    fail("Export profile docs must describe Agent Kit export CLI usage.");
  }
  if (!roadmap.includes("Phase 24: Agent Kit export engine. Complete.")) {
    fail("Roadmap must mark Phase 24 complete.");
  }
  if (!securityModel.includes("Phase 24") || !securityModel.includes("never_export")) {
    fail("Security model docs must include Phase 24 Agent Kit export boundaries.");
  }
  if (!packageJson.scripts["phase24:verify"]) {
    fail("Root package scripts must include phase24:verify.");
  }

  const requiredPhase25Text = [
    "Phase 25",
    "phase25:verify",
    "list_packs",
    "get_pack_summary",
    "query_pack_context",
    "get_record",
    "list_export_profiles",
    "build_export_preview",
    "list_skills",
    "get_skill_summary",
    "get_skill",
    "list_agent_kits",
    "get_agent_kit_summary",
    "query_agent_kit_context",
    "build_agent_kit_export_preview",
  ];
  for (const text of requiredPhase25Text) {
    if (!readme.includes(text) && !mcp.includes(text)) {
      fail(`README or MCP docs are missing Phase 25 text: ${text}`);
    }
  }
  if (!roadmap.includes("Phase 25: Read-only MCP for Skills and Agent Kits. Complete.")) {
    fail("Roadmap must mark Phase 25 complete.");
  }
  if (!securityModel.includes("Phase 25") || !securityModel.includes("read-only stdio MCP")) {
    fail("Security model docs must include Phase 25 read-only MCP boundaries.");
  }
  if (!packageJson.scripts["phase25:verify"]) {
    fail("Root package scripts must include phase25:verify.");
  }
  if (!packageJson.scripts["phase25:verify"]?.includes("research-delta:verify")) {
    fail("phase25:verify must include research-delta:verify.");
  }
  const importers = read("docs/importers.md");
  const requiredPhase26Text = [
    "Phase 26",
    "phase26:verify",
    "contextarr import-skill",
    "CONTEXTARR_ENABLE_LOCAL_IMPORTS",
    "CONTEXTARR_IMPORTED_SKILLS_DIR",
    "POST /api/import-skills/preview",
    "POST /api/import-skills",
    "imported-skills/",
  ];
  for (const text of requiredPhase26Text) {
    if (!readme.includes(text) && !importers.includes(text) && !securityModel.includes(text) && !architecture.includes(text)) {
      fail(`README or docs are missing Phase 26 text: ${text}`);
    }
  }
  if (!roadmap.includes("Phase 26: Local Skill importers. Complete.")) {
    fail("Roadmap must mark Phase 26 complete.");
  }
  if (!securityModel.includes("Phase 26") || !securityModel.includes("imported-skills")) {
    fail("Security model docs must include Phase 26 Skill importer boundaries.");
  }
  if (!packageJson.scripts["phase26:verify"]) {
    fail("Root package scripts must include phase26:verify.");
  }

  const requiredPhase27Text = [
    "Phase 27",
    "phase27:verify",
    "CONTEXTARR_AGENT_KIT_TEMPLATES_DIR",
    "agent-kit-templates/",
    "GET /api/agent-kit-templates",
    "POST /api/agent-kit-templates/:id/create",
  ];
  for (const text of requiredPhase27Text) {
    if (!readme.includes(text) && !agentKits.includes(text) && !architecture.includes(text) && !securityModel.includes(text)) {
      fail(`README or docs are missing Phase 27 text: ${text}`);
    }
  }
  if (!roadmap.includes("Phase 27: Agent Kit templates. Complete.")) {
    fail("Roadmap must mark Phase 27 complete.");
  }
  if (!agentKits.includes("Phase 27") || !agentKits.includes("Templates")) {
    fail("Agent Kits docs must describe Phase 27 templates.");
  }
  if (!packageJson.scripts["phase27:verify"]) {
    fail("Root package scripts must include phase27:verify.");
  }

  const requiredCollectorsText = [
    "Context Pack Collectors",
    "Blank Pack Starter",
    "Markdown Folder",
    "Project Notes",
    "Support KB Starter",
    "CONTEXTARR_DRAFT_PACKS_DIR",
    "/api/context-pack-collectors",
    "/api/context-pack-collectors/:id/preview",
    "/api/context-pack-collectors/:id/run",
    "draft-packs/",
    "not activate",
    "do not index",
    "must not expose submitted local input paths",
  ];
  for (const text of requiredCollectorsText) {
    if (
      !readme.includes(text) &&
      !apiDocs.includes(text) &&
      !collectorsDocs.includes(text) &&
      !architecture.includes(text) &&
      !releaseChecklist.includes(text)
    ) {
      fail(`README or docs are missing Context Pack collector text: ${text}`);
    }
  }
  if (!releaseChecklist.includes("Open Collectors") || !releaseChecklist.includes("active Pack Library")) {
    fail("Release checklist must include a manual Context Pack collector smoke.");
  }
  if (!releaseChecklist.includes("local Skill import lane") || !releaseChecklist.includes("imported-skills/")) {
    fail("Release checklist must include a manual local Skill import coexistence smoke.");
  }
  if (!packageJson.scripts["collectors:verify"]) {
    fail("Root package scripts must include collectors:verify.");
  }

  const requiredComposerSaveText = [
    "CONTEXTARR_COMPOSED_PACKS_DIR",
    "/api/compose/save-pack",
    "composed-packs/",
    "private",
    "unreviewed",
    "review_status: draft",
    "never_export",
    "does not index",
    "no local filesystem path"
  ];
  for (const text of requiredComposerSaveText) {
    if (
      !readme.includes(text) &&
      !apiDocs.includes(text) &&
      !composedPacksDocs.includes(text) &&
      !architecture.includes(text) &&
      !releaseChecklist.includes(text)
    ) {
      fail(`README or docs are missing Composer save text: ${text}`);
    }
  }
  if (!packageJson.scripts["composer:verify"]) {
    fail("Root package scripts must include composer:verify.");
  }
  if (!envExample.includes("CONTEXTARR_COMPOSED_PACKS_DIR=./composed-packs")) {
    fail(".env.example must include CONTEXTARR_COMPOSED_PACKS_DIR.");
  }
  if (!configReference.includes("CONTEXTARR_COMPOSED_PACKS_DIR") || !configReference.includes("./composed-packs")) {
    fail("Config reference must document CONTEXTARR_COMPOSED_PACKS_DIR.");
  }
  if (!serverReadme.includes("POST /api/compose/save-pack") || !serverReadme.includes("does not index drafts automatically")) {
    fail("Server README must document Composer save-as-draft-pack behavior.");
  }

  if (!packageJson.scripts["phase11:verify"] || !packageJson.scripts["docker:verify"] || !packageJson.scripts["docs:verify"]) {
    fail("Root package scripts must include docs:verify, docker:verify, and phase11:verify.");
  }
}

const trackedScreenshots = execFileSync("git", ["ls-files", "--", "docs/screenshots"], {
  cwd: repoRoot,
  encoding: "utf8",
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => file !== "docs/screenshots/README.md");

if (trackedScreenshots.length > 0) {
  fail(`Only docs/screenshots/README.md may be tracked in Phase 11:\n${trackedScreenshots.join("\n")}`);
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr launch docs verified.");
}
