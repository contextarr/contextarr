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
  "docs/implementation-status.md",
  "docs/known-limitations.md",
  "docs/known-issues.md",
  "docs/composed-packs.md",
  "docs/pack-authoring.md",
  "docs/export-profiles.md",
  "docs/mcp.md",
  "docs/roadmap.md",
  "docs/master-plan.md",
  "docs/product-strategy.md",
  "docs/private-context.md",
  "docs/external-skills.md",
  "docs/local-event-hooks.md",
  "docs/demo-script.md",
  "docs/release-checklist.md",
  "docs/screenshots/README.md",
  "Dockerfile",
  "docker-compose.yml",
  ".dockerignore",
  ".github/ISSUE_TEMPLATE/bug_report.md",
  ".github/ISSUE_TEMPLATE/documentation_correction.md",
  ".github/ISSUE_TEMPLATE/demo_pack_issue.md",
  ".github/ISSUE_TEMPLATE/export_target_request.md",
  ".github/ISSUE_TEMPLATE/pack_schema_proposal.md",
  ".github/ISSUE_TEMPLATE/security_concern.md",
  ".github/pull_request_template.md"
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
  const implementationStatus = read("docs/implementation-status.md");
  const knownLimitations = read("docs/known-limitations.md");
  const mcp = read("docs/mcp.md");
  const docker = read("docs/docker.md");
  const security = read("docs/security.md");
  const securityModel = read("docs/security-model.md");
  const architecture = read("docs/architecture.md");
  const agentKits = read("docs/agent-kits.md");
  const roadmap = read("docs/roadmap.md");
  const masterPlan = read("docs/master-plan.md");
  const productStrategy = read("docs/product-strategy.md");
  const privateContext = read("docs/private-context.md");
  const externalSkills = read("docs/external-skills.md");
  const localEventHooks = read("docs/local-event-hooks.md");
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
    "## What Contextarr Is",
    "## Core Working Now",
    "## Advanced Preview",
    "## Not Included",
    "## Quickstart",
    "## Verification",
    "## Security Boundaries",
    "## Current Limitations",
    "Contextarr prepares Agent Kits. It does not run them.",
    "Skills and Agent Kits are advanced-preview data objects",
    "12 curated starter Context Packs",
    "15 public-safe demo packs",
    "docs/implementation-status.md",
    "docs/known-limitations.md",
    "docs/quickstart.md",
    "docs/docker.md",
    "docs/security.md",
    "docs/pack-authoring.md",
    "docs/export-profiles.md",
    "docs/release-checklist.md"
  ];
  for (const text of requiredReadmeText) {
    if (!readme.includes(text)) {
      fail(`README is missing launch text: ${text}`);
    }
  }

  const forbiddenReadmeText = [
    "Current scope:",
    "Phase 12 terminology docs for Context Packs",
    "The original PRD through Phase 11 is implemented locally"
  ];
  for (const text of forbiddenReadmeText) {
    if (readme.includes(text)) {
      fail(`README still contains old phase-heavy positioning: ${text}`);
    }
  }

  const requiredStatusText = [
    "## Core Working Now",
    "## Advanced Preview, Data-Only, Frozen",
    "## Planned Or Guarded",
    "12 curated starter packs",
    "Contextarr prepares Agent Kits. It does not run them."
  ];
  for (const text of requiredStatusText) {
    if (!implementationStatus.includes(text)) {
      fail(`Implementation status is missing text: ${text}`);
    }
  }

  const requiredLimitationsText = [
    "No tagged GitHub release",
    "No npm package is published",
    "No public registry",
    "No public marketplace",
    "No Agent Kit runtime",
    "Screenshot Requirements"
  ];
  for (const text of requiredLimitationsText) {
    if (!knownLimitations.includes(text)) {
      fail(`Known limitations are missing text: ${text}`);
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

  if (!architecture.includes("/api/skills") || !architecture.includes("Skill-scoped search")) {
    fail("Architecture docs must describe Skill API and search.");
  }
  if (!security.includes("Skills") || !security.includes("non-executable")) {
    fail("Security docs must describe non-executable Skill boundaries.");
  }

  if (!architecture.includes("/api/agent-kits") || !architecture.includes("Agent Kit-scoped search")) {
    fail("Architecture docs must describe Agent Kit API and search.");
  }
  if (!agentKits.includes("POST /api/agent-kits") || !agentKits.includes("CONTEXTARR_AGENT_KITS_DIR")) {
    fail("Agent Kits docs must describe Composer saves and the local Agent Kits directory.");
  }
  if (!roadmap.includes("advanced-preview data-only surfaces")) {
    fail("Roadmap must describe Skills and Agent Kits as advanced-preview data-only surfaces.");
  }
  if (!securityModel.includes("Contextarr prepares Agent Kits. It does not run them.")) {
    fail("Security model must preserve the Agent Kit non-runtime boundary.");
  }
  for (const [label, content, required] of [
    [
      "master plan",
      masterPlan,
      ["Status: planning control document.", "No hidden network calls.", "No hosted vault.", "No product telemetry."]
    ],
    [
      "product strategy",
      productStrategy,
      ["Status: idea harvest and product direction note.", "Do not build now:", "Hosted core app."]
    ],
    [
      "private context",
      privateContext,
      ["Status: future product layer.", "not a separate personal memory vault", "Protected records should not appear through MCP"]
    ],
    [
      "external skills",
      externalSkills,
      ["Status: future import and packaging direction.", "Never execute them.", "There should be no `approved for execution` state"]
    ],
    [
      "local event hooks",
      localEventHooks,
      ["Status: future automation design.", "Webhooks are app settings, not pack content.", "Webhooks exposed through MCP."]
    ]
  ]) {
    for (const text of required) {
      if (!content.includes(text)) {
        fail(`Launch ${label} docs are missing required text: ${text}`);
      }
    }
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
    "must not expose submitted local input paths"
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
  if (!envExample.includes("CONTEXTARR_COMPOSED_PACKS_DIR=./composed-packs")) {
    fail(".env.example must include CONTEXTARR_COMPOSED_PACKS_DIR.");
  }
  if (!configReference.includes("CONTEXTARR_COMPOSED_PACKS_DIR") || !configReference.includes("./composed-packs")) {
    fail("Config reference must document CONTEXTARR_COMPOSED_PACKS_DIR.");
  }
  if (!serverReadme.includes("POST /api/compose/save-pack") || !serverReadme.includes("does not index drafts automatically")) {
    fail("Server README must document Composer save-as-draft-pack behavior.");
  }

  const requiredScripts = [
    "docs:verify",
    "docker:verify",
    "phase11:verify",
    "verify:core",
    "verify:security",
    "verify:release",
    "site:verify",
    "screenshots:verify",
    "release:verify"
  ];
  for (const script of requiredScripts) {
    if (!packageJson.scripts?.[script]) {
      fail(`Root package scripts must include ${script}.`);
    }
  }
}

const trackedScreenshots = execFileSync("git", ["ls-files", "--", "docs/screenshots"], {
  cwd: repoRoot,
  encoding: "utf8"
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .filter(
    (file) =>
      file !== "docs/screenshots/README.md" &&
      !file.startsWith("docs/screenshots/v0.1.0-alpha.1/")
  );

if (trackedScreenshots.length > 0) {
  fail(`Only reviewed alpha screenshots may be tracked under docs/screenshots:\n${trackedScreenshots.join("\n")}`);
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr launch docs verified.");
}
