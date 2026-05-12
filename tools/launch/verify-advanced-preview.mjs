import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function requireText(relativePath, text) {
  const content = read(relativePath);
  if (!content.includes(text)) {
    fail(`${relativePath} is missing required advanced-preview text: ${text}`);
  }
}

function assertNoExecutableFiles(relativeRoot) {
  const root = path.join(repoRoot, relativeRoot);
  if (!fs.existsSync(root)) {
    fail(`Missing advanced-preview source root: ${relativeRoot}`);
    return;
  }

  const trackedFiles = execFileSync("git", ["ls-files", "--", relativeRoot], {
    cwd: repoRoot,
    encoding: "utf8"
  })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  const executableExtensions = new Set([".bat", ".cmd", ".cjs", ".exe", ".js", ".mjs", ".ps1", ".sh", ".ts"]);
  for (const file of trackedFiles) {
    const extension = path.extname(file).toLowerCase();
    if (executableExtensions.has(extension)) {
      fail(`Advanced-preview data roots must not contain executable source files: ${file}`);
    }
  }
}

const packageJson = JSON.parse(read("package.json"));
const scripts = packageJson.scripts ?? {};
const releaseVerify = scripts["release:verify"] ?? "";
const v1CoreVerify = scripts["v1-core:verify"] ?? "";
const v1CoreScript = read("tools/launch/verify-v1-core.mjs");

if (!scripts["advanced-preview:verify"]) {
  fail("Root package scripts must include advanced-preview:verify.");
}

if (!releaseVerify.includes("pnpm advanced-preview:verify")) {
  fail("release:verify must include advanced-preview:verify.");
}

for (const forbidden of ["skills:validate", "agent-kits:validate", "validate-skill", "validate-agent-kit"]) {
  if (v1CoreVerify.includes(forbidden)) {
    fail(`v1-core:verify must not directly run advanced-preview command: ${forbidden}`);
  }
}

for (const forbidden of ["./demo-skills", "./demo-agent-kits", "skillsIndexed: 8", "agentKitsIndexed: 8"]) {
  if (v1CoreScript.includes(forbidden)) {
    fail(`tools/launch/verify-v1-core.mjs must not require advanced-preview demo objects: ${forbidden}`);
  }
}

requireText("README.md", "## Advanced Preview");
requireText("README.md", "Skills and Agent Kits are advanced-preview, non-executing surfaces");
requireText("README.md", "Contextarr prepares Agent Kits. It does not run them.");
requireText("docs/implementation-status.md", "## Advanced Preview, Non-Executing, Frozen");
requireText("docs/implementation-status.md", "future imported external Skill artifacts may be preserved unmodified");
requireText("docs/roadmap.md", "non-executing advanced-preview surfaces");
requireText("docs/roadmap.md", "The v1 bridge plan freezes further Skills and Agent Kit expansion");
requireText("docs/security-model.md", "Contextarr prepares Agent Kits. It does not run them.");
requireText("docs/security-model.md", "Future Skill and Agent Kit work must not add shell execution");
requireText("docs/mcp.md", "does not mutate pack, Skill, or Agent Kit files");
requireText("docs/mcp.md", "execute Skills");
requireText("docs/mcp.md", "run Agent Kits");
requireText("docs/skills.md", "Contextarr Native Skills must remain data-only.");
requireText("docs/skills.md", "Contextarr must not execute Skills.");
requireText("docs/agent-kits.md", "Contextarr prepares Agent Kits. It does not run them.");
requireText("docs/agent-kits.md", "does not execute Skills, run Agent Kits");

assertNoExecutableFiles("demo-skills");
assertNoExecutableFiles("demo-agent-kits");
assertNoExecutableFiles("agent-kit-templates");

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr advanced-preview verification passed.");
}
