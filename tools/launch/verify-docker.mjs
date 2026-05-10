import { spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const projectName = "contextarr-phase11-smoke";
const hostPort = process.env.CONTEXTARR_DOCKER_VERIFY_PORT ?? "33210";
const baseUrl = `http://127.0.0.1:${hostPort}`;
const apiToken = process.env.CONTEXTARR_DOCKER_API_TOKEN ?? "contextarr-local-preview-token";
const smokeAgentKitId = `docker-smoke-agent-kit-${process.pid}-${Date.now()}`;
const smokeAgentKitsRoot = path.join(repoRoot, "agent-kits");
const smokeAgentKitPath = path.join(smokeAgentKitsRoot, smokeAgentKitId);
const composeEnv = {
  ...process.env,
  CONTEXTARR_DOCKER_PORT: hostPort,
  CONTEXTARR_DOCKER_API_TOKEN: apiToken,
};

function run(args) {
  const result = spawnSync("docker", ["compose", "-p", projectName, ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: composeEnv,
    cwd: repoRoot,
  });

  if (result.status !== 0) {
    throw new Error(`docker compose ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

function countFiles(directory, predicate) {
  if (!fs.existsSync(directory)) {
    return 0;
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && predicate(entry.name))
    .length;
}

function expectedDemoCounts() {
  const demoRoot = path.join(repoRoot, "demo-packs");
  const packDirs = fs
    .readdirSync(demoRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(demoRoot, entry.name))
    .filter((packDir) => fs.existsSync(path.join(packDir, "contextarr-pack.json")))
    .sort();

  let records = 0;
  let starterPacks = 0;

  for (const packDir of packDirs) {
    const manifest = JSON.parse(fs.readFileSync(path.join(packDir, "contextarr-pack.json"), "utf8"));
    if (manifest.starterPack === true) {
      starterPacks += 1;
    }
    records += countFiles(path.join(packDir, "records"), (name) => name.endsWith(".md"));
  }

  if (starterPacks !== 12) {
    throw new Error(`Expected 12 curated starter Context Packs, got ${starterPacks}.`);
  }

  return { packs: packDirs.length, records };
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
    timeoutMs: 60000,
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
  const timeoutMs = options.timeoutMs ?? 30000;

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method ?? "GET",
        headers: { Authorization: `Bearer ${apiToken}`, ...(options.headers ?? {}) },
        timeout: timeoutMs,
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
  if (fs.existsSync(smokeAgentKitPath)) {
    throw new Error(`Refusing to remove existing local Agent Kit smoke path: ${smokeAgentKitPath}`);
  }
  fs.mkdirSync(smokeAgentKitsRoot, { recursive: true });
  run(["build"]);
  run(["up", "-d"]);

  const expected = expectedDemoCounts();
  const health = await waitForHealth();
  if (
    health.status !== "ok" ||
    health.counts?.packs !== expected.packs ||
    health.counts?.records !== expected.records ||
    health.counts?.skills !== 8 ||
    health.counts?.skillInstructions !== 24 ||
    health.counts?.agentKits !== 8 ||
    health.counts?.agentKitContextPackRefs !== 15 ||
    health.counts?.agentKitSkillRefs !== 17
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

  const agentKits = await getJson("/api/agent-kits");
  if (!agentKits.agentKits?.some((agentKit) => agentKit.id === "support-ticket-writing-kit")) {
    throw new Error(`Unexpected Agent Kits response: ${JSON.stringify(agentKits)}`);
  }

  const agentKitDetail = await getJson("/api/agent-kits/support-ticket-writing-kit");
  if (
    agentKitDetail.id !== "support-ticket-writing-kit" ||
    agentKitDetail.contextPacks?.length !== 2 ||
    agentKitDetail.skills?.length !== 2
  ) {
    throw new Error(`Unexpected Agent Kit detail response: ${JSON.stringify(agentKitDetail)}`);
  }

  const agentKitSearch = await getJson("/api/search?type=agent-kit&q=ticket");
  if (!agentKitSearch.results?.some((result) => result.kind === "agent-kit" && result.id === "support-ticket-writing-kit")) {
    throw new Error(`Unexpected Agent Kit search response: ${JSON.stringify(agentKitSearch)}`);
  }

  const agentKitPreview = await getJson("/api/agent-kits/support-ticket-writing-kit/exports/support-ticket-writing-kit-codex/preview");
  if (
    agentKitPreview.agentKitId !== "support-ticket-writing-kit" ||
    agentKitPreview.contentStatus !== "ready" ||
    !agentKitPreview.content?.includes("Agent Kit Export: Support Ticket Writing Kit")
  ) {
    throw new Error(`Unexpected Agent Kit preview response: ${JSON.stringify(agentKitPreview)}`);
  }

  const savedAgentKit = await postJson("/api/agent-kits", {
    id: smokeAgentKitId,
    name: "Docker Smoke Agent Kit",
    goal: "Verify local Docker Agent Kit saves.",
    description: "Local public-preview smoke kit for the Docker acceptance gate.",
    contextPacks: ["ai-workstation-pack"],
    skills: ["support-ticket-writing-skill"],
    target: "codex",
    format: "markdown",
    privacyMode: "redacted",
  });
  if (savedAgentKit.id !== smokeAgentKitId || savedAgentKit.validation?.errors !== 0) {
    throw new Error(`Unexpected Agent Kit save response: ${JSON.stringify(savedAgentKit)}`);
  }

  if (!fs.existsSync(path.join(smokeAgentKitPath, "contextarr-agent-kit.json"))) {
    throw new Error("Docker Agent Kit save did not write to the local agent-kits mount.");
  }

  const savedAgentKitDetail = await getJson(`/api/agent-kits/${smokeAgentKitId}`);
  if (savedAgentKitDetail.id !== smokeAgentKitId || savedAgentKitDetail.contextPacks?.length !== 1 || savedAgentKitDetail.skills?.length !== 1) {
    throw new Error(`Unexpected saved Agent Kit detail response: ${JSON.stringify(savedAgentKitDetail)}`);
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
    cwd: repoRoot,
    env: composeEnv,
  });
  fs.rmSync(smokeAgentKitPath, { recursive: true, force: true });
  if (down.status !== 0) {
    process.exitCode = down.status ?? 1;
  }
}
