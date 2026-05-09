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
  const packageJson = JSON.parse(read("package.json"));
  const combined = `${review}\n${abuse}`;

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

  const securityScript = packageJson.scripts?.["security:verify"];
  if (!securityScript) {
    fail("Root package scripts must include security:verify.");
  } else {
    for (const required of [
      "pnpm v1-core:verify",
      "packages/pack-validator/src/security-fixtures.test.ts",
      "apps/server/src/api.test.ts",
      "apps/mcp/src/tools.test.ts",
      "tools/launch/verify-security.mjs"
    ]) {
      if (!securityScript.includes(required)) {
        fail(`security:verify is missing required check: ${required}`);
      }
    }
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr v1 security gate verified.");
}
