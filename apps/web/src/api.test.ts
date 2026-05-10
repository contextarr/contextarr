import { describe, expect, it } from "vitest";
import { ApiError, createApiClient, toApiUrl } from "./api";

describe("Contextarr API client", () => {
  it("builds API URLs with optional base URLs", () => {
    expect(toApiUrl("", "/api/packs")).toBe("/api/packs");
    expect(toApiUrl("http://127.0.0.1:3210/", "/api/packs")).toBe("http://127.0.0.1:3210/api/packs");
  });

  it("sends bearer auth when configured", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const client = createApiClient({
      baseUrl: "http://api.local/",
      token: "test-token",
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init });
        return jsonResponse({ packs: [] });
      }
    });

    await client.getPacks();

    expect(requests[0]).toMatchObject({
      url: "http://api.local/api/packs",
      init: {
        headers: {
          Authorization: "Bearer test-token"
        }
      }
    });
  });

  it("omits auth headers when no token is configured", async () => {
    const requests: Array<{ init?: RequestInit }> = [];
    const client = createApiClient({
      fetchImpl: async (_url, init) => {
        requests.push({ init });
        return jsonResponse({ status: "ok" });
      }
    });

    await client.getHealth();

    expect(requests[0].init?.headers).toEqual({});
  });

  it("reads pack detail, pack records, and record detail", async () => {
    const requests: string[] = [];
    const client = createApiClient({
      fetchImpl: async (url) => {
        requests.push(String(url));
        if (String(url).includes("/records/record-1")) {
          return jsonResponse({ id: "record-1", body: "# Record" });
        }
        if (String(url).includes("/records")) {
          return jsonResponse({ records: [{ id: "record-1" }] });
        }
        return jsonResponse({ id: "pack-1" });
      }
    });

    await expect(client.getPack("pack-1")).resolves.toMatchObject({ id: "pack-1" });
    await expect(client.getPackRecords("pack-1")).resolves.toEqual([{ id: "record-1" }]);
    await expect(client.getRecord("record-1")).resolves.toMatchObject({ body: "# Record" });
    expect(requests).toEqual(["/api/packs/pack-1", "/api/packs/pack-1/records", "/api/records/record-1"]);
  });

  it("reads Skill library, detail, documents, and exports", async () => {
    const requests: string[] = [];
    const client = createApiClient({
      fetchImpl: async (url) => {
        requests.push(String(url));
        if (String(url).endsWith("/instructions")) {
          return jsonResponse({ instructions: [{ id: "skill.instruction" }] });
        }
        if (String(url).endsWith("/examples")) {
          return jsonResponse({ examples: [{ id: "skill.example" }] });
        }
        if (String(url).endsWith("/exports")) {
          return jsonResponse({ exportProfiles: [{ id: "skill-codex" }] });
        }
        if (String(url).endsWith("/health")) {
          return jsonResponse({ skillId: "skill-1", score: 100, checks: [], items: [] });
        }
        if (String(url).includes("/api/skills/skill-1")) {
          return jsonResponse({ id: "skill-1", name: "Skill One" });
        }
        return jsonResponse({ skills: [{ id: "skill-1" }] });
      }
    });

    await expect(client.getSkills()).resolves.toEqual([{ id: "skill-1" }]);
    await expect(client.getSkill("skill-1")).resolves.toMatchObject({ name: "Skill One" });
    await expect(client.getSkillInstructions("skill-1")).resolves.toEqual([{ id: "skill.instruction" }]);
    await expect(client.getSkillExamples("skill-1")).resolves.toEqual([{ id: "skill.example" }]);
    await expect(client.getSkillExports("skill-1")).resolves.toEqual([{ id: "skill-codex" }]);
    await expect(client.getSkillHealth("skill-1")).resolves.toMatchObject({ skillId: "skill-1" });
    expect(requests).toEqual([
      "/api/skills",
      "/api/skills/skill-1",
      "/api/skills/skill-1/instructions",
      "/api/skills/skill-1/examples",
      "/api/skills/skill-1/exports",
      "/api/skills/skill-1/health"
    ]);
  });

  it("posts local Skill import preview and write requests", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const client = createApiClient({
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init });
        if (String(url).endsWith("/preview")) {
          return jsonResponse({ ok: true, skillId: "imported-skill", counts: { documents: 2, sources: 2, warnings: 0 } });
        }
        return jsonResponse({ ok: true, skillId: "imported-skill", validation: { valid: true, errors: 0 } });
      }
    });

    await expect(
      client.previewSkillImport({
        inputPath: "D:/local/fake-prompts",
        kind: "markdown",
        skillId: "imported-skill",
        maxDocs: 10
      })
    ).resolves.toMatchObject({ skillId: "imported-skill" });
    await expect(
      client.importSkill({
        inputPath: "D:/local/fake-prompts",
        kind: "markdown",
        skillId: "imported-skill",
        overwrite: true
      })
    ).resolves.toMatchObject({ validation: { valid: true, errors: 0 } });

    expect(requests.map((request) => request.url)).toEqual(["/api/import-skills/preview", "/api/import-skills"]);
    expect(requests[0].init).toMatchObject({ method: "POST", headers: { "Content-Type": "application/json" } });
    expect(JSON.parse(String(requests[1].init?.body))).toMatchObject({
      inputPath: "D:/local/fake-prompts",
      kind: "markdown",
      skillId: "imported-skill",
      overwrite: true
    });
  });

  it("reads and runs Context Pack collector requests", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const client = createApiClient({
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init });
        if (String(url).endsWith("/preview")) {
          return jsonResponse({ ok: true, collectorId: "markdown-folder", packId: "draft-pack", records: [], sourceCount: 0 });
        }
        if (String(url).endsWith("/run")) {
          return jsonResponse({
            ok: true,
            collectorId: "markdown-folder",
            packId: "draft-pack",
            counts: { records: 1, sources: 1, warnings: 0 },
            validation: { valid: true, errors: 0, warnings: 0, infos: 0 },
            draft: { status: "review_required", indexed: false }
          });
        }
        return jsonResponse({ collectors: [{ id: "markdown-folder", name: "Markdown Folder", inputMode: "local_path" }] });
      }
    });

    await expect(client.getContextPackCollectors()).resolves.toEqual([
      expect.objectContaining({ id: "markdown-folder" })
    ]);
    await expect(
      client.previewContextPackCollector("markdown-folder", {
        inputPath: "D:/local/notes",
        packId: "draft-pack",
        maxRecords: 10
      })
    ).resolves.toMatchObject({ packId: "draft-pack" });
    await expect(
      client.runContextPackCollector("markdown-folder", {
        inputPath: "D:/local/notes",
        packId: "draft-pack",
        overwrite: true
      })
    ).resolves.toMatchObject({ draft: { indexed: false } });

    expect(requests.map((request) => request.url)).toEqual([
      "/api/context-pack-collectors",
      "/api/context-pack-collectors/markdown-folder/preview",
      "/api/context-pack-collectors/markdown-folder/run"
    ]);
    expect(requests[2].init).toMatchObject({ method: "POST", headers: { "Content-Type": "application/json" } });
    expect(JSON.parse(String(requests[2].init?.body))).toMatchObject({
      inputPath: "D:/local/notes",
      packId: "draft-pack",
      overwrite: true
    });
  });

  it("reads Agent Kit library, detail, relationships, health, preview, and posts save requests", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const client = createApiClient({
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init });
        if (String(url).endsWith("/context-packs")) {
          return jsonResponse({ contextPacks: [{ id: "pack-1" }] });
        }
        if (String(url).endsWith("/skills")) {
          return jsonResponse({ skills: [{ id: "skill-1" }] });
        }
        if (String(url).endsWith("/health")) {
          return jsonResponse({ agentKitId: "kit-1", score: 100, checks: [], items: [] });
        }
        if (String(url).endsWith("/exports/profile-1/preview")) {
          return jsonResponse({
            agentKitId: "kit-1",
            profileId: "profile-1",
            target: "codex",
            format: "markdown",
            filename: "profile-1.md",
            mimeType: "text/markdown",
            content: "# Agent Kit Export",
            contentStatus: "ready",
            includedContextPacks: [],
            includedSkills: [],
            warnings: []
          });
        }
        if (String(url).includes("/api/agent-kits/kit-1")) {
          return jsonResponse({ id: "kit-1", name: "Kit One" });
        }
        if (init?.method === "POST") {
          return jsonResponse({ id: "kit-1", message: "saved" });
        }
        return jsonResponse({ agentKits: [{ id: "kit-1" }] });
      }
    });

    await expect(client.getAgentKits()).resolves.toEqual([{ id: "kit-1" }]);
    await expect(client.getAgentKit("kit-1")).resolves.toMatchObject({ name: "Kit One" });
    await expect(client.getAgentKitContextPacks("kit-1")).resolves.toEqual([{ id: "pack-1" }]);
    await expect(client.getAgentKitSkills("kit-1")).resolves.toEqual([{ id: "skill-1" }]);
    await expect(client.getAgentKitHealth("kit-1")).resolves.toMatchObject({ agentKitId: "kit-1" });
    await expect(client.getAgentKitExportPreview("kit-1", "profile-1")).resolves.toMatchObject({
      contentStatus: "ready",
      content: "# Agent Kit Export"
    });
    await expect(
      client.saveAgentKit({
        id: "kit-1",
        name: "Kit One",
        goal: "Prepare a brief.",
        description: "Local-only kit.",
        contextPacks: ["pack-1"],
        skills: ["skill-1"],
        target: "codex",
        format: "markdown",
        privacyMode: "redacted",
        exportProfile: "kit-1-codex-markdown",
        exportProfileName: "Kit One Codex Export",
        excludeTags: ["secret"],
        boundaries: {
          containsExecutableCode: false,
          requiresNetwork: false,
          cloudSync: false,
          telemetry: false,
          marketplacePublish: false,
          permissions: {
            readVault: false,
            writeDrafts: false,
            runCommands: false,
            networkAccess: false,
            browserAutomation: false,
            toolExecution: false
          }
        },
        compatibility: {
          contextarr: ">=0.3.0",
          supportedTargets: ["codex"],
          requiredContextPacks: ["pack-1"],
          requiredSkills: ["skill-1"]
        }
      })
    ).resolves.toMatchObject({ id: "kit-1" });

    expect(requests.map((request) => request.url)).toEqual([
      "/api/agent-kits",
      "/api/agent-kits/kit-1",
      "/api/agent-kits/kit-1/context-packs",
      "/api/agent-kits/kit-1/skills",
      "/api/agent-kits/kit-1/health",
      "/api/agent-kits/kit-1/exports/profile-1/preview",
      "/api/agent-kits"
    ]);
    expect(requests[6].init).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const body = JSON.parse(String(requests[6].init?.body));
    expect(body).toMatchObject({
      name: "Kit One",
      contextPacks: ["pack-1"],
      skills: ["skill-1"],
      target: "codex"
    });
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain(":\\\\");
    expect(serialized).not.toContain("../");
    expect(serialized).not.toContain("..\\\\");
  });

  it("reads Agent Kit templates and posts template create requests", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const client = createApiClient({
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init });
        if (String(url).endsWith("/create")) {
          return jsonResponse({ id: "kit-from-template", message: "saved" });
        }
        if (String(url).endsWith("/coding-task-kit-template")) {
          return jsonResponse({ id: "coding-task-kit-template", name: "Coding Task Kit Template" });
        }
        return jsonResponse({ templates: [{ id: "coding-task-kit-template" }] });
      }
    });

    await expect(client.getAgentKitTemplates()).resolves.toEqual([{ id: "coding-task-kit-template" }]);
    await expect(client.getAgentKitTemplate("coding-task-kit-template")).resolves.toMatchObject({
      name: "Coding Task Kit Template"
    });
    await expect(
      client.createAgentKitFromTemplate("coding-task-kit-template", {
        id: "kit-from-template",
        name: "Kit From Template",
        contextPacks: ["pack-1"],
        skills: ["skill-1"],
        target: "codex",
        format: "markdown",
        privacyMode: "redacted"
      })
    ).resolves.toMatchObject({ id: "kit-from-template" });

    expect(requests.map((request) => request.url)).toEqual([
      "/api/agent-kit-templates",
      "/api/agent-kit-templates/coding-task-kit-template",
      "/api/agent-kit-templates/coding-task-kit-template/create"
    ]);
    expect(requests[2].init).toMatchObject({ method: "POST", headers: { "Content-Type": "application/json" } });
    expect(JSON.parse(String(requests[2].init?.body))).toMatchObject({
      id: "kit-from-template",
      contextPacks: ["pack-1"],
      skills: ["skill-1"]
    });
  });

  it("reads pack health and review item routes", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const client = createApiClient({
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init });
        if (String(url).includes("/status")) {
          return jsonResponse({ item: { id: "item-1", status: "reviewed" } });
        }
        if (String(url).includes("/review-items")) {
          return jsonResponse({ items: [{ id: "item-1" }], counts: { total: 1, open: 1, filtered: 1 } });
        }
        return jsonResponse({ packId: "pack-1", score: 100, checks: [], items: [] });
      }
    });

    await expect(client.getPackHealth("pack-1")).resolves.toMatchObject({ packId: "pack-1" });
    await expect(client.getReviewItems({ status: "open", objectType: "skill", objectId: "skill-1" })).resolves.toMatchObject({
      counts: { open: 1 }
    });
    await expect(client.updateReviewItemStatus("item-1", "reviewed")).resolves.toMatchObject({ status: "reviewed" });
    expect(requests.map((request) => request.url)).toEqual([
      "/api/packs/pack-1/health",
      "/api/review-items?status=open&objectType=skill&objectId=skill-1",
      "/api/review-items/item-1/status"
    ]);
    expect(requests[2].init).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
  });

  it("reads review candidate routes", async () => {
    const requests: string[] = [];
    const client = createApiClient({
      fetchImpl: async (url) => {
        requests.push(String(url));
        if (String(url).includes("/candidate-key")) {
          return jsonResponse({ candidate: { key: "candidate-key", name: "Draft Candidate", records: [] } });
        }
        return jsonResponse({
          candidates: [{ key: "candidate-key", name: "Draft Candidate" }],
          skippedRoots: [],
          counts: { total: 1, readyForReview: 1, invalid: 0, blocked: 0, duplicateActiveId: 0, skippedRoots: 0, filtered: 1 }
        });
      }
    });

    await expect(client.getReviewCandidates({ status: "ready_for_review", q: "draft" })).resolves.toMatchObject({
      counts: { readyForReview: 1 }
    });
    await expect(client.getReviewCandidate("candidate-key")).resolves.toMatchObject({ key: "candidate-key" });
    expect(requests).toEqual([
      "/api/review-candidates?status=ready_for_review&q=draft",
      "/api/review-candidates/candidate-key"
    ]);
  });

  it("reads export preview routes", async () => {
    const requests: string[] = [];
    const client = createApiClient({
      fetchImpl: async (url) => {
        requests.push(String(url));
        return jsonResponse({ packId: "pack-1", profileId: "profile-1", content: "# Export" });
      }
    });

    await expect(client.getExportPreview("pack-1", "profile-1")).resolves.toMatchObject({
      profileId: "profile-1",
      content: "# Export"
    });
    await expect(client.getSkillExportPreview("skill-1", "skill-profile-1")).resolves.toMatchObject({
      content: "# Export"
    });
    expect(requests).toEqual([
      "/api/packs/pack-1/exports/profile-1/preview",
      "/api/skills/skill-1/exports/skill-profile-1/preview"
    ]);
  });

  it("posts compose preview requests", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const client = createApiClient({
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init });
        return jsonResponse({ packId: "composed", profileId: "composed-preview", content: "# Composed" });
      }
    });

    await expect(
      client.composePreview({
        title: "Handoff",
        target: "codex",
        format: "markdown",
        privacyMode: "redacted",
        selections: [{ packId: "pack-1", recordIds: ["record-1"] }]
      })
    ).resolves.toMatchObject({ packId: "composed" });

    expect(requests[0].url).toBe("/api/compose/preview");
    expect(requests[0].init).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    expect(JSON.parse(String(requests[0].init?.body))).toMatchObject({ title: "Handoff", target: "codex" });
  });

  it("posts composed pack save requests", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const client = createApiClient({
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init });
        return jsonResponse({ ok: true, id: "handoff-draft", name: "Handoff Draft", counts: { records: 1, sources: 1 } });
      }
    });

    await expect(
      client.saveComposedPack({
        packId: "handoff-draft",
        name: "Handoff Draft",
        title: "Handoff",
        target: "codex",
        format: "markdown",
        privacyMode: "redacted",
        selections: [{ packId: "pack-1", recordIds: ["record-1"] }]
      })
    ).resolves.toMatchObject({ id: "handoff-draft" });

    expect(requests[0].url).toBe("/api/compose/save-pack");
    expect(requests[0].init).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    expect(JSON.parse(String(requests[0].init?.body))).toMatchObject({ name: "Handoff Draft", target: "codex" });
  });

  it("throws ApiError for failed responses", async () => {
    const client = createApiClient({
      fetchImpl: async () => jsonResponse({ message: "API token required." }, 401)
    });

    await expect(client.getPacks()).rejects.toEqual(new ApiError("API token required.", 401));
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}
