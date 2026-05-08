import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const requiredFiles = [
  "docs/contextarr_prd_addition_skills_agent_kits.md",
  "docs/terminology.md",
  "docs/skills.md",
  "docs/agent-kits.md",
  "docs/non-executable-skills.md",
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
    fail(`Missing Phase 12 doc: ${file}`);
  }
}

if (!failed) {
  const readme = read("README.md");
  const terminology = read("docs/terminology.md");
  const skills = read("docs/skills.md");
  const agentKits = read("docs/agent-kits.md");
  const nonExecutableSkills = read("docs/non-executable-skills.md");
  const roadmap = read("docs/roadmap-phases.md");
  const combined = [readme, terminology, skills, agentKits, nonExecutableSkills, roadmap].join("\n");

  const requiredText = [
    "Phase 12",
    "Context Pack",
    "Skill",
    "Agent Kit",
    "Export Brief",
    "Contextarr prepares Agent Kits. It does not run them.",
    "non-executable",
    "No schema code is added in Phase 12",
    "Phase 13: Skill Schema and Validator",
    "Phase 25: Read-Only MCP for Skills and Agent Kits",
  ];

  for (const text of requiredText) {
    if (!combined.includes(text)) {
      fail(`Phase 12 docs are missing required text: ${text}`);
    }
  }

  const forbiddenRuntimeClaims = [
    "Contextarr runs Agent Kits",
    "Contextarr executes Skills",
    "Skill execution is implemented",
    "Agent Kit runtime is implemented",
  ];

  for (const text of forbiddenRuntimeClaims) {
    if (combined.includes(text)) {
      fail(`Phase 12 docs include forbidden runtime claim: ${text}`);
    }
  }
}

const schemaChanges = execFileSync("git", ["diff", "--name-only", "HEAD", "--", "packages/schema", "apps/server/src", "apps/web/src", "apps/mcp/src"], {
  cwd: repoRoot,
  encoding: "utf8",
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);

if (schemaChanges.length > 0) {
  fail(`Phase 12 must stay docs-only; runtime/schema files changed:\n${schemaChanges.join("\n")}`);
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr Phase 12 terminology docs verified.");
}
