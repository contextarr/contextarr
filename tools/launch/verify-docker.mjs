import { spawnSync } from "node:child_process";
import http from "node:http";

const projectName = "contextarr-phase11-smoke";
const hostPort = process.env.CONTEXTARR_DOCKER_VERIFY_PORT ?? "33210";
const baseUrl = `http://127.0.0.1:${hostPort}`;
const composeEnv = {
  ...process.env,
  CONTEXTARR_DOCKER_PORT: hostPort,
};

function run(args) {
  const result = spawnSync("docker", ["compose", "-p", projectName, ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: composeEnv,
  });

  if (result.status !== 0) {
    throw new Error(`docker compose ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

async function getJson(path) {
  const { statusCode, body } = await request(path);
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`${path} returned HTTP ${statusCode}`);
  }
  return JSON.parse(body);
}

async function postJson(path, body) {
  const payload = JSON.stringify(body);
  const response = await request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload).toString() },
    body: payload,
  });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`${path} returned HTTP ${response.statusCode}: ${response.body}`);
  }
  return JSON.parse(response.body);
}

async function getText(path) {
  const { statusCode, body } = await request(path);
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`${path} returned HTTP ${statusCode}`);
  }
  return body;
}

function request(path, options = {}) {
  const url = new URL(path, baseUrl);
  const body = options.body ?? "";

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method ?? "GET",
        headers: options.headers,
        timeout: 5000,
      },
      (res) => {
        let responseBody = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode ?? 0, body: responseBody });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error(`${url.href} timed out`));
    });
    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
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
  run(["down"]);
  run(["build"]);
  run(["up", "-d"]);

  const health = await waitForHealth();
  if (
    health.status !== "ok" ||
    health.counts?.packs !== 5 ||
    health.counts?.records !== 25 ||
    health.counts?.skills !== 8 ||
    health.counts?.skillInstructions !== 24
  ) {
    throw new Error(`Unexpected Docker health response: ${JSON.stringify(health)}`);
  }

  const root = await getText("/");
  if (!root.includes("<div id=\"root\"></div>")) {
    throw new Error("Docker web root did not return the built Vite app shell.");
  }

  const exportPreview = await getJson("/api/packs/ai-workstation-pack/exports/ai-workstation-codex/preview");
  if (exportPreview.packId !== "ai-workstation-pack" || exportPreview.target !== "codex") {
    throw new Error(`Unexpected export preview response: ${JSON.stringify(exportPreview)}`);
  }

  const skills = await getJson("/api/skills");
  if (!skills.skills?.some((skill) => skill.id === "support-ticket-writing-skill")) {
    throw new Error(`Unexpected skills response: ${JSON.stringify(skills)}`);
  }

  const skillSearch = await getJson("/api/search?type=skill&q=support");
  if (!skillSearch.results?.some((result) => result.kind === "skill" && result.id === "support-ticket-writing-skill")) {
    throw new Error(`Unexpected skill search response: ${JSON.stringify(skillSearch)}`);
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
