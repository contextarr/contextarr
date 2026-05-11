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

const decisionFiles = [
  "docs/decision-records/README.md",
  "docs/decision-records/0001-v1-backup-restore.md",
  "docs/decision-records/0002-v1-context-pack-collectors.md",
  "docs/decision-records/0003-v1-composer-save-as-pack.md"
];

for (const file of decisionFiles) {
  if (!fs.existsSync(path.join(repoRoot, file))) {
    fail(`Missing v1 decision record: ${file}`);
  }
}

if (!failed) {
  const combined = decisionFiles.map(read).join("\n");
  const packageJson = JSON.parse(read("package.json"));

  const requiredText = [
    "local only",
    "Restore validates every pack before activation",
    "review or quarantine",
    "Collectors are Context Pack authoring/update workflows",
    "not Skill expansion",
    "Save-as-pack writes draft Context Packs only",
    "ignored local output root",
    "does not mutate source packs",
    "No registry behavior",
    "No marketplace behavior",
    "No execution runtime"
  ];

  for (const text of requiredText) {
    if (!combined.includes(text)) {
      fail(`Decision records are missing required text: ${text}`);
    }
  }

  const workflowVerifyScript = packageJson.scripts?.["workflow-scope:verify"];
  const workflowCheckScript = packageJson.scripts?.["workflow-scope:check"];
  if (!workflowVerifyScript) {
    fail("Root package scripts must include workflow-scope:verify.");
  } else if (!workflowVerifyScript.includes("pnpm v1-core:verify") || !workflowVerifyScript.includes("pnpm workflow-scope:check")) {
    fail("workflow-scope:verify must run v1-core:verify and delegate leaf checks to workflow-scope:check.");
  }

  if (!workflowCheckScript) {
    fail("Root package scripts must include workflow-scope:check.");
  } else if (!workflowCheckScript.includes("verify-v1-decisions.mjs")) {
    fail("workflow-scope:check must run verify-v1-decisions.mjs.");
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr v1 workflow decisions verified.");
}
