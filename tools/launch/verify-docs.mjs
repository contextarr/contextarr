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
  const packageJson = JSON.parse(read("package.json"));
  const mcpPackageJson = JSON.parse(read("apps/mcp/package.json"));

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
  if (mcp.includes("pnpm exec contextarr-mcp")) {
    fail("MCP docs must not document pnpm exec contextarr-mcp.");
  }
  if (Object.prototype.hasOwnProperty.call(mcpPackageJson, "bin")) {
    fail("apps/mcp/package.json must not reintroduce a private package bin.");
  }

  if (!docker.includes("http://127.0.0.1:3210") || !docker.includes("CONTEXTARR_WEB_DIST_DIR")) {
    fail("Docker docs must include the local URL and web dist env var.");
  }

  if (!security.includes("No telemetry") || !security.includes("No marketplace") || !security.includes("No executable packs")) {
    fail("Launch security docs must keep v0 non-goals visible.");
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
