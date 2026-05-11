import fs from "node:fs";
import path from "node:path";
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

const requiredFiles = [
  "docs/security-review-v1.md",
  "docs/abuse-cases.md",
  "docs/master-plan.md",
  "docs/product-strategy.md",
  "docs/private-context.md",
  "docs/external-skills.md",
  "docs/local-event-hooks.md",
  "packages/pack-validator/src/security-fixtures.test.ts"
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(repoRoot, file))) {
    fail(`Missing security gate file: ${file}`);
  }
}

if (!failed) {
  const review = read("docs/security-review-v1.md");
  const abuse = read("docs/abuse-cases.md");
  const masterPlan = read("docs/master-plan.md");
  const productStrategy = read("docs/product-strategy.md");
  const privateContext = read("docs/private-context.md");
  const externalSkills = read("docs/external-skills.md");
  const localEventHooks = read("docs/local-event-hooks.md");
  const packageJson = JSON.parse(read("package.json"));
  const combined = `${review}\n${abuse}`;
  const boundaryDocs = `${masterPlan}\n${productStrategy}\n${privateContext}\n${externalSkills}\n${localEventHooks}`;

  const requiredText = [
    "pnpm security:verify",
    "scan.shell_command",
    "scan.credential_pattern",
    "pack.executable_file",
    "pack.script_file",
    "manifest.run_commands",
    "manifest.network_access",
    "never_export",
    "MCP remains stdio-only",
    "Backup/restore bypass",
    "No public marketplace behavior exists",
    "No signing implementation exists",
    "No new Phase 29 registry behavior exists"
  ];

  for (const text of requiredText) {
    if (!combined.includes(text)) {
      fail(`Security docs are missing required text: ${text}`);
    }
  }

  const requiredBoundaryText = [
    "No hidden network calls",
    "No product telemetry",
    "No hosted vault",
    "Contextarr never executes them",
    "not a separate personal memory vault",
    "private, sensitive, secret, and never_export records are excluded from default export and MCP",
    "There is no `approved_for_execution` state in Contextarr",
    "Script-bearing imported Skills remain untrusted",
    "No hooks, webhooks, remote delivery, or event-triggered actions are implemented",
    "Current code implements no Local Event Hook API endpoints",
    "Context Packs, Skills, Agent Kits, and registry artifacts must not define hooks"
  ];

  for (const text of requiredBoundaryText) {
    if (!boundaryDocs.includes(text)) {
      fail(`Boundary docs are missing required security text: ${text}`);
    }
  }

  const forbiddenText = [
    "CONTEXTARR_REGISTRY_ENABLED=true by default",
    "public marketplace is enabled",
    "Contextarr executes Skills",
    "Contextarr executes Agent Kits"
  ];

  for (const text of forbiddenText) {
    if (combined.includes(text)) {
      fail(`Security docs include forbidden behavior: ${text}`);
    }
  }

  const securityVerifyScript = packageJson.scripts?.["security:verify"];
  const securityCheckScript = packageJson.scripts?.["security:check"];
  if (!securityVerifyScript) {
    fail("Root package scripts must include security:verify.");
  } else if (!securityVerifyScript.includes("pnpm v1-core:verify") || !securityVerifyScript.includes("pnpm security:check")) {
    fail("security:verify must run v1-core:verify and delegate leaf security checks to security:check.");
  }

  if (!securityCheckScript) {
    fail("Root package scripts must include security:check.");
  } else {
    for (const required of [
      "packages/pack-validator/src/security-fixtures.test.ts",
      "apps/server/src/api.test.ts",
      "apps/mcp/src/tools.test.ts",
      "apps/mcp/src/protocol.test.ts",
      "tools/launch/verify-security.mjs"
    ]) {
      if (!securityCheckScript.includes(required)) {
        fail(`security:check is missing required check: ${required}`);
      }
    }
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr v1 security gate verified.");
}
