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
  "docs/install.md",
  "docs/upgrade.md",
  "docs/release-process.md",
  "docs/pack-migrations.md",
  "docs/troubleshooting.md",
  "docs/faq.md",
  "docs/known-issues.md",
  "RELEASE_NOTES.md"
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(repoRoot, file))) {
    fail(`Missing release hardening doc: ${file}`);
  }
}

if (!failed) {
  const readme = read("README.md");
  const roadmap = read("docs/roadmap.md");
  const releaseProcess = read("docs/release-process.md");
  const knownIssues = read("docs/known-issues.md");
  const packageJson = JSON.parse(read("package.json"));
  const combined = [readme, roadmap, releaseProcess, knownIssues, read("docs/faq.md"), read("RELEASE_NOTES.md")].join("\n");

  const requiredReadmeLinks = [
    "docs/install.md",
    "docs/upgrade.md",
    "docs/release-process.md",
    "docs/pack-migrations.md",
    "docs/troubleshooting.md",
    "docs/faq.md",
    "docs/known-issues.md",
    "RELEASE_NOTES.md"
  ];
  for (const link of requiredReadmeLinks) {
    if (!readme.includes(link)) {
      fail(`README is missing release hardening link: ${link}`);
    }
  }

  const requiredScripts = ["demo:verify", "ui:verify", "release:verify"];
  for (const script of requiredScripts) {
    if (!packageJson.scripts?.[script]) {
      fail(`Root package scripts must include ${script}.`);
    }
  }

  const releaseScript = packageJson.scripts?.["release:verify"] ?? "";
  for (const required of [
    "pnpm v1-core:verify",
    "pnpm compatibility:verify",
    "pnpm security:verify",
    "pnpm workflow-scope:verify",
    "pnpm docker:verify",
    "pnpm demo:verify",
    "pnpm ui:verify",
    "verify-release-docs.mjs"
  ]) {
    if (!releaseScript.includes(required)) {
      fail(`release:verify is missing required check: ${required}`);
    }
  }

  const requiredText = [
    "No GitHub release",
    "No package publishing",
    "No public marketplace",
    "No signing implementation",
    "SQLite is a derived",
    "Context Pack core v1.0 readiness",
    "frozen behind the v1 bridge PRD gate"
  ];
  for (const text of requiredText) {
    if (!combined.includes(text)) {
      fail(`Release docs are missing required text: ${text}`);
    }
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr v1 release hardening docs verified.");
}
