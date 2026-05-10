import { execFileSync } from "node:child_process";
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

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function listPackageFiles() {
  const workspaceRoots = ["apps", "packages", "tools"];
  const packageFiles = ["package.json"];

  for (const root of workspaceRoots) {
    const absoluteRoot = path.join(repoRoot, root);
    if (!fs.existsSync(absoluteRoot)) {
      continue;
    }

    for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const packagePath = path.join(root, entry.name, "package.json");
      if (fs.existsSync(path.join(repoRoot, packagePath))) {
        packageFiles.push(packagePath);
      }
    }
  }

  return packageFiles.sort();
}

function hasAlphaTag() {
  try {
    const output = execFileSync("git", ["tag", "--list", "v0.1.0-alpha.1"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    return output.trim() === "v0.1.0-alpha.1";
  } catch {
    fail("Unable to inspect local git tags for v0.1.0-alpha.1.");
    return false;
  }
}

const packageFiles = listPackageFiles();
const publishScriptPattern = /\b(npm|pnpm|yarn)\s+publish\b|changeset\s+publish|semantic-release|release-it/i;
const publishConfigPattern = /publishConfig/i;
const telemetryDependencyPattern = /posthog|segment|sentry|plausible|mixpanel|amplitude|datadog|newrelic/i;

for (const packageFile of packageFiles) {
  const packageJson = readJson(packageFile);
  if (packageJson.private !== true) {
    fail(`${packageFile} must remain private until package publishing is explicitly approved.`);
  }

  const scripts = packageJson.scripts ?? {};
  for (const [name, command] of Object.entries(scripts)) {
    if (publishScriptPattern.test(String(command))) {
      fail(`${packageFile} script ${name} must not publish packages during alpha preparation.`);
    }
  }

  if (publishConfigPattern.test(JSON.stringify(packageJson))) {
    fail(`${packageFile} must not define publishConfig during alpha preparation.`);
  }

  const dependencyBlocks = [
    packageJson.dependencies ?? {},
    packageJson.devDependencies ?? {},
    packageJson.peerDependencies ?? {},
    packageJson.optionalDependencies ?? {}
  ];
  for (const dependencies of dependencyBlocks) {
    for (const dependencyName of Object.keys(dependencies)) {
      if (telemetryDependencyPattern.test(dependencyName)) {
        fail(`${packageFile} must not add telemetry or analytics dependency ${dependencyName}.`);
      }
    }
  }
}

if (hasAlphaTag()) {
  fail("Local git tag v0.1.0-alpha.1 exists; tagging requires an explicit release approval step.");
}

const readme = read("README.md");
const knownLimitations = read("docs/known-limitations.md");
const releaseChecklist = read("docs/release-checklist.md");
const releaseProcess = read("docs/release-process.md");
const packageJson = readJson("package.json");
const combinedReleaseDocs = [readme, knownLimitations, releaseChecklist, releaseProcess, read("RELEASE_NOTES.md")].join("\n");

for (const requiredText of [
  "No tagged GitHub release",
  "No npm package is published",
  "No public support guarantee",
  "No public registry",
  "No public marketplace",
  "No telemetry",
  "No executable packs",
  "No executable Skills",
  "No Agent Kit runtime",
  "Contextarr prepares Agent Kits. It does not run them.",
  "Screenshot Requirements",
  "Do not commit generated screenshots unless they are intentionally reviewed and approved"
]) {
  if (!combinedReleaseDocs.includes(requiredText)) {
    fail(`Alpha limitation docs are missing required gate text: ${requiredText}`);
  }
}

const releaseScript = packageJson.scripts?.["release:verify"] ?? "";
if (!releaseScript.includes("pnpm limitations:verify")) {
  fail("release:verify must include pnpm limitations:verify.");
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr alpha limitations verified.");
}
