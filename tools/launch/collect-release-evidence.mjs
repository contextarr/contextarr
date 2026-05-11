import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const release = "v0.1.0-alpha.1";
const evidenceDocPath = "docs/audits/v0.1.0-alpha.1-release-candidate-evidence.md";
const manifestPath = "docs/screenshots/v0.1.0-alpha.1/manifest.json";
const screenshotDir = "docs/screenshots/v0.1.0-alpha.1";
const requiredScreenshots = [
  "pack-library-grid.png",
  "dense-table.png",
  "pack-detail.png",
  "record-source-detail.png",
  "pack-health.png",
  "export-preview.png",
  "cli-output.png",
  "security-boundary.png"
];

function usage() {
  return [
    "Usage: node tools/launch/collect-release-evidence.mjs [--out <path>]",
    "",
    "Prints a local-only Wave 1 release evidence packet for v0.1.0-alpha.1.",
    "Use --out to write the packet to a repo-local markdown file."
  ].join("\n");
}

function parseArgs(argv) {
  const args = { out: null, help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--out") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--out requires a file path.");
      }
      args.out = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    const stderr = result.stderr.trim();
    const stdout = result.stdout.trim();
    throw new Error(`${command} ${args.join(" ")} failed: ${stderr || stdout || `exit ${result.status}`}`);
  }

  return result.stdout.trim();
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function readPngSize(relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  const buffer = fs.readFileSync(filePath);
  const isPng = buffer.length >= 33 && buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";

  if (!isPng) {
    return { valid: false, width: 0, height: 0, byteLength: buffer.length };
  }

  return {
    valid: true,
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    byteLength: buffer.length
  };
}

function collectBulletsAfter(content, marker) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === marker);
  if (start === -1) {
    return [];
  }

  const bullets = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ") && bullets.length > 0) {
      break;
    }
    if (line.trim() === "" && bullets.length > 0) {
      break;
    }
    if (line.startsWith("- ")) {
      bullets.push(line.slice(2));
    }
  }
  return bullets;
}

function extractLine(content, pattern, fallback) {
  const match = content.match(pattern);
  return match?.[1]?.trim() ?? fallback;
}

function listMarkdown(items) {
  if (items.length === 0) {
    return "- Not found in the recorded evidence source.";
  }
  return items.map((item) => `- ${item}`).join("\n");
}

function gitSummary() {
  const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  const commit = run("git", ["rev-parse", "HEAD"]);
  const shortCommit = run("git", ["rev-parse", "--short", "HEAD"]);
  const subject = run("git", ["log", "-1", "--pretty=%s"]);
  const status = run("git", ["status", "--short"]);
  const statusLines = status ? status.split(/\r?\n/) : [];

  return {
    branch,
    commit,
    shortCommit,
    subject,
    statusLines,
    clean: statusLines.length === 0
  };
}

function screenshotSummary() {
  const manifest = readJson(manifestPath);
  const manifestFiles = new Set((manifest.screenshots ?? []).map((entry) => entry.file));
  const missingFiles = requiredScreenshots.filter((file) => {
    return !fs.existsSync(path.join(repoRoot, screenshotDir, file)) || !manifestFiles.has(file);
  });
  const incompleteEntries = (manifest.screenshots ?? []).filter((entry) => {
    return !entry.file || !entry.slot || !entry.source || entry.reviewed !== true;
  });
  const fileSummaries = requiredScreenshots.map((file) => {
    const relativePath = path.join(screenshotDir, file).replaceAll("\\", "/");
    const size = fs.existsSync(path.join(repoRoot, relativePath))
      ? readPngSize(relativePath)
      : { valid: false, width: 0, height: 0, byteLength: 0 };
    return { file, ...size };
  });

  return {
    manifest,
    missingFiles,
    incompleteEntries,
    fileSummaries
  };
}

function renderPacket() {
  const generatedAt = new Date().toISOString();
  const git = gitSummary();
  const evidenceDoc = read(evidenceDocPath);
  const screenshots = screenshotSummary();
  const recordedBranch = extractLine(evidenceDoc, /^Branch: `([^`]+)`/m, "not recorded");
  const dockerPort = extractLine(evidenceDoc, /Live Docker smoke passed on alternate port `([^`]+)`/m, "see recorded evidence source");
  const gateBullets = collectBulletsAfter(evidenceDoc, "Current proof recorded for this release-candidate package:");
  const dockerBullets = collectBulletsAfter(evidenceDoc, "Live Docker smoke observations:");
  const publicActionLine = gateBullets.find((bullet) => bullet.includes("No push")) ?? "No public action statement not found in recorded gate bullets.";
  const screenshotStatus =
    screenshots.manifest.release === release &&
    screenshots.manifest.reviewed === true &&
    screenshots.manifest.privateDataReviewed === true &&
    screenshots.missingFiles.length === 0 &&
    screenshots.incompleteEntries.length === 0
      ? "manifest reviewed, private-data reviewed, and complete"
      : "manifest needs review";

  const statusLines = git.clean
    ? "- Working tree: clean"
    : ["- Working tree: local changes present", ...git.statusLines.map((line) => `  - ${line}`)].join("\n");

  const screenshotLines = screenshots.fileSummaries
    .map((entry) => {
      if (!entry.valid) {
        return `- ${entry.file}: missing or invalid PNG`;
      }
      return `- ${entry.file}: ${entry.width}x${entry.height}, ${entry.byteLength} bytes`;
    })
    .join("\n");

  return `# ${release} Wave 1 Release Evidence Packet

Generated at: ${generatedAt}

Generated by: \`node tools/launch/collect-release-evidence.mjs\`

Scope: local evidence only. This packet does not run the release gate, start Docker, generate screenshots or video, push, tag, publish, deploy, create a GitHub release, update a registry or marketplace, or enable telemetry.

## Git Branch And Commit

- Current branch: \`${git.branch}\`
- Current commit: \`${git.commit}\`
- Short commit: \`${git.shortCommit}\`
- Commit subject: ${git.subject}
${statusLines}

## Release Gate Status Summary

- Gate command: \`pnpm release:verify\`
- Recorded evidence source: \`${evidenceDocPath}\`
- Recorded evidence branch: \`${recordedBranch}\`
- Current collector status: not run by this command.

${listMarkdown(gateBullets)}

## Docker Smoke Port And Results

- Smoke command: \`pnpm docker:verify\`
- Preferred local preview port: \`http://127.0.0.1:3210\`
- Recorded smoke port: \`${dockerPort}\`
- Current collector status: Docker was not started by this command.

${listMarkdown(dockerBullets)}

## Screenshot Manifest Status

- Manifest path: \`${manifestPath}\`
- Manifest release: \`${screenshots.manifest.release ?? "missing"}\`
- Reviewed: \`${screenshots.manifest.reviewed === true}\`
- Private-data reviewed: \`${screenshots.manifest.privateDataReviewed === true}\`
- Screenshot entries: \`${(screenshots.manifest.screenshots ?? []).length}\`
- Status: ${screenshotStatus}
- Verification command: \`pnpm screenshots:verify\`

${screenshotLines}

## No Public Action Statement

- ${publicActionLine}
- Running this collector is local-only and read-only except when \`--out\` writes the requested markdown packet.
- Public actions remain prohibited without explicit approval: push, tag, GitHub release, package publish, deployment, public registry, public marketplace, signing implementation, hosted service, telemetry, screenshots, or video.

## Recommended Verification For This Packet

\`\`\`bash
pnpm docs:verify
pnpm screenshots:verify
node tools/launch/verify-release-docs.mjs
git diff --check
\`\`\`
`;
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }

  const packet = renderPacket();
  if (args.out) {
    const outPath = path.resolve(repoRoot, args.out);
    if (!outPath.startsWith(repoRoot + path.sep)) {
      throw new Error("--out must stay inside the repository.");
    }
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, packet);
    console.log(`Wrote ${path.relative(repoRoot, outPath).replaceAll("\\", "/")}`);
  } else {
    console.log(packet);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
