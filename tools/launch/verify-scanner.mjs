import { spawnSync } from "node:child_process";

const credential = runScan("packages/security-scanner/test/fixtures/credential-pack");
if (credential.status !== 1) {
  fail(`Expected credential scan to exit 1, got ${credential.status}.`);
}
if (!credential.stdout.includes('"status": "blocked"')) {
  fail("Expected credential scan JSON to report blocked status.");
}
if (credential.stdout.includes("ctx_fake_example_key_1234567890")) {
  fail("Credential scan leaked the fake API key in stdout.");
}

const hidden = runScan("packages/security-scanner/test/fixtures/hidden-instruction-pack");
if (hidden.status !== 1 || !hidden.stdout.includes("scan.ignore_previous_instructions")) {
  fail("Expected hidden-instruction fixture to be blocked by the CLI scanner.");
}

console.log("Contextarr scanner verification passed.");

function runScan(target) {
  return spawnSync("pnpm", ["--filter", "@contextarr/cli", "contextarr", "scan", target, "--format", "json"], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32"
  });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
