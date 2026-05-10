import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

function run(command, args) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function gitStatus() {
  return run("git", ["status", "--short"]);
}

const before = gitStatus();

for (let attempt = 1; attempt <= 2; attempt += 1) {
  const output = run(process.execPath, ["tools/launch/verify-v1-core.mjs"]);
  if (!output.includes("Contextarr v1 core verification passed.")) {
    console.error(`v1 core verifier did not pass on attempt ${attempt}.`);
    process.exit(1);
  }
}

const after = gitStatus();

if (before !== after) {
  console.error("v1 core verifier is not idempotent; git status changed after two runs.");
  console.error("Before:");
  console.error(before || "(clean)");
  console.error("After:");
  console.error(after || "(clean)");
  process.exit(1);
}

console.log("Contextarr v1 core verifier idempotence passed.");
