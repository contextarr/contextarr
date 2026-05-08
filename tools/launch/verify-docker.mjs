import { spawnSync } from "node:child_process";

const projectName = "contextarr-phase11-smoke";
const baseUrl = "http://127.0.0.1:3210";

function run(args) {
  const result = spawnSync("docker", ["compose", "-p", projectName, ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(`docker compose ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }
  return response.json();
}

async function postJson(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function waitForHealth() {
  let lastError;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      return await getJson("/api/health");
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw lastError ?? new Error("Timed out waiting for Docker health endpoint.");
}

async function verify() {
  run(["build"]);
  run(["up", "-d"]);

  const health = await waitForHealth();
  if (health.status !== "ok" || health.counts?.packs !== 5 || health.counts?.records !== 25) {
    throw new Error(`Unexpected Docker health response: ${JSON.stringify(health)}`);
  }

  const root = await fetch(`${baseUrl}/`);
  if (!root.ok || !(await root.text()).includes("<div id=\"root\"></div>")) {
    throw new Error("Docker web root did not return the built Vite app shell.");
  }

  const exportPreview = await getJson("/api/packs/ai-workstation-pack/exports/ai-workstation-codex/preview");
  if (exportPreview.packId !== "ai-workstation-pack" || exportPreview.target !== "codex") {
    throw new Error(`Unexpected export preview response: ${JSON.stringify(exportPreview)}`);
  }

  const composed = await postJson("/api/compose/preview", {
    title: "Docker Smoke",
    target: "codex",
    format: "markdown",
    selections: [{ packId: "ai-workstation-pack", recordIds: ["ai-workstation.local-ai-stack"] }],
  });
  if (composed.packId !== "composed" || composed.includedRecords?.length !== 1) {
    throw new Error(`Unexpected compose preview response: ${JSON.stringify(composed)}`);
  }

  console.log("Contextarr Docker preview verified.");
}

try {
  await verify();
} finally {
  const down = spawnSync("docker", ["compose", "-p", projectName, "down"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (down.status !== 0) {
    process.exitCode = down.status ?? 1;
  }
}
