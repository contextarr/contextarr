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
  "docs/backups.md",
  "docs/restore.md",
  "docs/troubleshooting.md",
  "docs/faq.md",
  "docs/known-limitations.md",
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
  const releaseChecklist = read("docs/release-checklist.md");
  const knownLimitations = read("docs/known-limitations.md");
  const knownIssues = read("docs/known-issues.md");
  const packageJson = JSON.parse(read("package.json"));
  const combined = [
    readme,
    roadmap,
    releaseProcess,
    releaseChecklist,
    knownLimitations,
    knownIssues,
    read("docs/faq.md"),
    read("RELEASE_NOTES.md")
  ].join("\n");

  const requiredReadmeLinks = [
    "docs/install.md",
    "docs/upgrade.md",
    "docs/release-process.md",
    "docs/pack-migrations.md",
    "docs/backups.md",
    "docs/restore.md",
    "docs/troubleshooting.md",
    "docs/faq.md",
    "docs/known-limitations.md",
    "docs/known-issues.md",
    "RELEASE_NOTES.md"
  ];
  for (const link of requiredReadmeLinks) {
    if (!readme.includes(link)) {
      fail(`README is missing release hardening link: ${link}`);
    }
  }

  const requiredScripts = ["demo:verify", "ui:verify", "site:verify", "backup:verify", "release:verify"];
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
    "pnpm site:verify",
    "pnpm backup:verify",
    "verify-release-docs.mjs"
  ]) {
    if (!releaseScript.includes(required)) {
      fail(`release:verify is missing required check: ${required}`);
    }
  }

  const requiredText = [
    "v0.1.0-alpha.1",
    "No GitHub release",
    "No package publishing",
    "No public marketplace",
    "No public registry",
    "No signing implementation",
    "No support guarantee",
    "SQLite is a derived",
    "Context Pack core readiness",
    "advanced-preview",
    "frozen behind the v1 bridge gate",
    "Contextarr prepares Agent Kits. It does not run them."
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
  console.log("Contextarr alpha release hardening docs verified.");
}
