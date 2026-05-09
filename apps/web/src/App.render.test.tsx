// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AgentKitHealthResponse,
  AgentKitTemplateSummary,
  HealthResponse,
  PackSummary,
  ReviewItem,
  SkillDetail,
  SkillDocument,
  SkillHealthResponse,
  SkillSummary
} from "./types";

const mocks = vi.hoisted(() => {
  class MockApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }

  return {
    ApiError: MockApiError,
    apiClient: {
      getHealth: vi.fn(),
      getPacks: vi.fn(),
      getPack: vi.fn(),
      getPackRecords: vi.fn(),
      getRecord: vi.fn(),
      getSkills: vi.fn(),
      search: vi.fn(),
      getSkill: vi.fn(),
      getSkillInstructions: vi.fn(),
      getSkillExamples: vi.fn(),
      getSkillExports: vi.fn(),
      getSkillHealth: vi.fn(),
      previewSkillImport: vi.fn(),
      importSkill: vi.fn(),
      getContextPackCollectors: vi.fn(),
      previewContextPackCollector: vi.fn(),
      runContextPackCollector: vi.fn(),
      getAgentKits: vi.fn(),
      getAgentKit: vi.fn(),
      getAgentKitContextPacks: vi.fn(),
      getAgentKitSkills: vi.fn(),
      getAgentKitHealth: vi.fn(),
      getAgentKitExportPreview: vi.fn(),
      saveAgentKit: vi.fn(),
      getAgentKitTemplates: vi.fn(),
      getAgentKitTemplate: vi.fn(),
      createAgentKitFromTemplate: vi.fn(),
      getExportPreview: vi.fn(),
      getSkillExportPreview: vi.fn(),
      composePreview: vi.fn(),
      getReviewItems: vi.fn(),
      updateReviewItemStatus: vi.fn()
    }
  };
});

vi.mock("./api", () => ({
  ApiError: mocks.ApiError,
  apiClient: mocks.apiClient
}));

import { App } from "./App";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let downloadedFileName = "";

describe("App Skill UI routes", () => {
  beforeEach(() => {
    window.location.hash = "";
    downloadedFileName = "";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
    URL.createObjectURL = vi.fn(() => "blob:contextarr-export");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      throw new Error(`Unexpected console.error during render test: ${args.map(String).join(" ")}`);
    });
    vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
      throw new Error(`Unexpected console.warn during render test: ${args.map(String).join(" ")}`);
    });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string, options?: ElementCreationOptions) => {
      const element = originalCreateElement(tagName, options);
      if (tagName.toLowerCase() === "a") {
        vi.spyOn(element as HTMLAnchorElement, "click").mockImplementation(function click(this: HTMLAnchorElement) {
          downloadedFileName = this.download;
        });
      }
      return element;
    });
    mocks.apiClient.getHealth.mockResolvedValue(healthFixture());
    mocks.apiClient.getPacks.mockResolvedValue([packFixture()]);
    mocks.apiClient.getPack.mockResolvedValue(packDetailFixture());
    mocks.apiClient.getPackRecords.mockResolvedValue([]);
    mocks.apiClient.getRecord.mockResolvedValue({});
    mocks.apiClient.getSkills.mockResolvedValue([skillFixture()]);
    mocks.apiClient.search.mockResolvedValue({ query: "", results: [] });
    mocks.apiClient.getSkill.mockResolvedValue(skillDetailFixture());
    mocks.apiClient.getSkillInstructions.mockResolvedValue([skillDocumentFixture("support-ticket-writing-skill.response-style")]);
    mocks.apiClient.getSkillExamples.mockResolvedValue([
      skillDocumentFixture("support-ticket-writing-skill.ticket-example", "Ticket Example", "example")
    ]);
    mocks.apiClient.getSkillExports.mockResolvedValue([]);
    mocks.apiClient.getSkillHealth.mockResolvedValue(skillHealthFixture());
    mocks.apiClient.previewSkillImport.mockResolvedValue({
      ok: true,
      kind: "markdown",
      skillId: "imported-skill",
      skillName: "Imported Skill",
      counts: { documents: 2, sources: 2, warnings: 0 },
      documents: [
        {
          id: "imported-skill.response-style",
          title: "Response Style",
          type: "imported_skill_instruction",
          tags: ["imported_draft"],
          sourceId: "imported-skill.source.response-style"
        }
      ],
      warnings: []
    });
    mocks.apiClient.importSkill.mockResolvedValue({
      ok: true,
      skillId: "imported-skill",
      skillName: "Imported Skill",
      counts: { documents: 2, sources: 2, warnings: 0 },
      warnings: [],
      validation: { valid: true, errors: 0, warnings: 1, infos: 0 },
      skill: { ...skillFixture(), id: "imported-skill", name: "Imported Skill", trustLevel: "unreviewed" }
    });
    mocks.apiClient.getContextPackCollectors.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve([
                {
                  id: "blank-pack-starter",
                  name: "Blank Pack Starter",
                  description: "Create a private draft Context Pack with one overview record.",
                  inputMode: "none",
                  defaultPackId: "blank-pack-draft",
                  defaultName: "Blank Draft Pack",
                  defaultMaxRecords: 1
                },
                {
                  id: "markdown-folder",
                  name: "Markdown Folder",
                  description: "Convert a local Markdown folder into private draft Context Pack records.",
                  inputMode: "local_path",
                  defaultPackId: "markdown-folder-draft",
                  defaultName: "Markdown Folder Draft Pack",
                  defaultMaxRecords: 50
                }
              ]),
            0
          );
        })
    );
    mocks.apiClient.previewContextPackCollector.mockResolvedValue({
      ok: true,
      collectorId: "markdown-folder",
      packId: "draft-pack",
      packName: "Markdown Draft Pack",
      sourceCount: 1,
      records: [
        {
          id: "draft-pack.note-a",
          title: "Note A",
          type: "imported_note",
          tags: ["imported_draft", "never_export"],
          sourceId: "draft-pack.source.note-a"
        }
      ],
      warnings: []
    });
    mocks.apiClient.runContextPackCollector.mockResolvedValue({
      ok: true,
      collectorId: "markdown-folder",
      packId: "draft-pack",
      packName: "Markdown Draft Pack",
      counts: { records: 1, sources: 1, warnings: 0 },
      warnings: [],
      validation: { valid: true, errors: 0, warnings: 0, infos: 0 },
      draft: { status: "review_required", indexed: false }
    });
    mocks.apiClient.getAgentKits.mockResolvedValue([agentKitSummaryFixture()]);
    mocks.apiClient.getAgentKit.mockResolvedValue(agentKitDetailFixture());
    mocks.apiClient.getAgentKitContextPacks.mockResolvedValue([packFixture()]);
    mocks.apiClient.getAgentKitSkills.mockResolvedValue([skillFixture()]);
    mocks.apiClient.getAgentKitHealth.mockResolvedValue(agentKitHealthFixture());
    mocks.apiClient.getAgentKitExportPreview.mockResolvedValue(agentKitPreviewFixture());
    mocks.apiClient.getAgentKitTemplates.mockResolvedValue([agentKitTemplateFixture()]);
    mocks.apiClient.getAgentKitTemplate.mockResolvedValue(agentKitTemplateFixture());
    mocks.apiClient.createAgentKitFromTemplate.mockResolvedValue({
      id: "coding-task-kit-draft",
      message: "Agent Kit saved locally."
    });
    mocks.apiClient.saveAgentKit.mockResolvedValue({
      id: "implementation-support-kit",
      message: "Agent Kit saved locally."
    });
    mocks.apiClient.getSkillExportPreview.mockResolvedValue({
      packId: "support-ticket-writing-skill",
      packName: "Support Ticket Writing Skill",
      profileId: "support-ticket-writing-skill-codex",
      profileName: "Codex Skill Export",
      target: "codex",
      format: "markdown",
      filename: "support-ticket-writing-skill-codex.md",
      mimeType: "text/markdown",
      content: "# Skill Export Preview Body",
      includedRecords: [],
      excludedRecords: [],
      sources: [],
      warnings: [],
      generatedAt: "2026-05-07T00:00:00.000Z",
      byteLength: 27,
      estimatedTokens: 7
    });
    mocks.apiClient.getReviewItems.mockResolvedValue({ items: [], counts: { total: 0, open: 0, filtered: 0 } });
    mocks.apiClient.updateReviewItemStatus.mockResolvedValue({});
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
      root = null;
    }
    document.body.innerHTML = "";
    window.location.hash = "";
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("renders the Skill Library route from API data", async () => {
    mountApp("#/skills");

    await waitForText("Support Ticket Writing Skill");
    expect(document.body.textContent).toContain("Support Ticket Writing Skill");
    expect(document.body.textContent).toContain("3 instructions");
  });

  it("keeps the Pack Library usable when Skill loading fails", async () => {
    mocks.apiClient.getSkills.mockRejectedValue(new Error("Skill endpoint unavailable"));

    mountApp("#/library");

    await waitForText("AI Workstation Pack");
    expect(document.body.textContent).toContain("Pack Library");
    expect(document.body.textContent).not.toContain("Local API unavailable");
  });

  it("renders the Skill Library auth-required state when Skill loading is protected", async () => {
    mocks.apiClient.getSkills.mockRejectedValue(new mocks.ApiError(401, "API token required."));

    mountApp("#/skills");

    await waitForText("API token required");
    expect(document.body.textContent).toContain("The local API requires a token from environment configuration.");
  });

  it("renders Skill detail tabs and sanitized instruction content", async () => {
    mountApp("#/skills/support-ticket-writing-skill");

    await waitForText("Support Ticket Writing Skill");
    clickButton("Instructions");

    await waitForText("Response Style");
    expect(document.body.querySelector("script")).toBeNull();
    expect(document.body.innerHTML).not.toContain("alert(");
  });

  it("renders the non-instruction Skill detail tabs", async () => {
    mountApp("#/skills/support-ticket-writing-skill");

    await waitForText("Support Ticket Writing Skill");
    clickButton("Examples");
    await waitForText("Ticket Example");
    clickButton("Sources");
    await waitForText("Demo Skill Source");
    clickButton("Exports");
    await waitForText("Codex Skill Export");
    clickButton("Health");
    await waitForText("Skill Health");
  });

  it("previews Skill exports from the Skill detail exports tab", async () => {
    mountApp("#/skills/support-ticket-writing-skill");

    await waitForText("Support Ticket Writing Skill");
    clickButton("Exports");
    await waitForText("Codex Skill Export");
    clickButton("Preview");
    await waitForText("Skill Export Preview Body");

    expect(mocks.apiClient.getSkillExportPreview).toHaveBeenCalledWith(
      "support-ticket-writing-skill",
      "support-ticket-writing-skill-codex"
    );
  });

  it("copies and downloads Skill export previews", async () => {
    mountApp("#/skills/support-ticket-writing-skill");

    await waitForText("Support Ticket Writing Skill");
    clickButton("Exports");
    await waitForText("Codex Skill Export");
    clickButton("Preview");
    await waitForText("Skill Export Preview Body");
    clickButton("Copy");
    await flushPendingUpdates();
    clickButton("Download");

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("# Skill Export Preview Body");
    expect(downloadedFileName).toBe("support-ticket-writing-skill-codex.md");
  });

  it("keeps Skill detail available when instruction/example documents fail", async () => {
    mocks.apiClient.getSkillInstructions.mockRejectedValue(new Error("Instructions endpoint unavailable"));
    mocks.apiClient.getSkillExamples.mockRejectedValue(new Error("Examples endpoint unavailable"));

    mountApp("#/skills/support-ticket-writing-skill");

    await waitForText("Support Ticket Writing Skill");
    expect(document.body.textContent).not.toContain("Skill unavailable");
    clickButton("Instructions");
    await waitForText("Instructions unavailable");
  });

  it("renders Skill review items in the shared Review Queue", async () => {
    mocks.apiClient.getReviewItems.mockResolvedValue({
      items: [reviewItemFixture()],
      counts: { total: 1, open: 1, filtered: 1 }
    });

    mountApp("#/review-queue");

    await waitForText("Review Skill Document");
    expect(document.body.textContent).toContain("Support Ticket Writing Skill");
    expect(document.body.textContent).toContain("support-ticket-writing-skill.response-style");
  });

  it("requests Skill-scoped review items from the shared Review Queue filters", async () => {
    mocks.apiClient.getReviewItems.mockResolvedValue({
      items: [reviewItemFixture()],
      counts: { total: 1, open: 1, filtered: 1 }
    });

    mountApp("#/review-queue");

    await waitForText("Review Skill Document");
    selectOption("All objects", "skill");
    await flushPendingUpdates();
    selectOption("All skills", "support-ticket-writing-skill");
    await flushPendingUpdates();

    expect(mocks.apiClient.getReviewItems).toHaveBeenLastCalledWith(
      expect.objectContaining({ objectType: "skill", objectId: "support-ticket-writing-skill" })
    );
  });

  it("requests and updates Agent Kit-scoped review items from the shared Review Queue", async () => {
    const item = agentKitReviewItemFixture();
    mocks.apiClient.getReviewItems.mockResolvedValue({
      items: [item],
      counts: { total: 1, open: 1, filtered: 1 }
    });

    mountApp("#/review-queue");

    await waitForText("Review Agent Kit References");
    selectOption("All objects", "agent_kit");
    await flushPendingUpdates();
    selectOption("All Agent Kits", "implementation-support-kit");
    await flushPendingUpdates();

    expect(mocks.apiClient.getReviewItems).toHaveBeenLastCalledWith(
      expect.objectContaining({ objectType: "agent_kit", objectId: "implementation-support-kit" })
    );

    mocks.apiClient.getReviewItems.mockResolvedValueOnce({
      items: [{ ...item, status: "ignored" }],
      counts: { total: 1, open: 0, filtered: 0 }
    });
    clickButton("Ignore");
    await flushPendingUpdates();

    expect(mocks.apiClient.updateReviewItemStatus).toHaveBeenCalledWith("agent-kit-review-item", "ignored");
    expect(mocks.apiClient.getReviewItems).toHaveBeenLastCalledWith(
      expect.objectContaining({ objectType: "agent_kit", objectId: "implementation-support-kit", status: "open" })
    );
    await waitForText("No matching review items");
  });

  it("renders Skill rows on the Health page", async () => {
    mountApp("#/health");
    await flushPendingUpdates();

    await waitForText("System Health");
    expect(document.body.textContent).toContain("Skill Health");
    await waitForText("Support Ticket Writing Skill");
    expect(document.body.textContent).toContain("Support Ticket Writing Skill");
  });

  it("renders Skill Health tab score, status, and review cards", async () => {
    mocks.apiClient.getSkillHealth.mockResolvedValue({
      ...skillHealthFixture(),
      score: 75,
      status: "degraded",
      reviewQueueCount: 2,
      items: [reviewItemFixture()],
      checks: [
        { id: "safety_rules", label: "Safety Rules", status: "warning", count: 1 },
        { id: "validation", label: "Validation", status: "pass", count: 0 }
      ]
    });

    mountApp("#/skills/support-ticket-writing-skill");

    await waitForText("Support Ticket Writing Skill");
    clickButton("Health");

    await waitForText("75%");
    expect(document.body.textContent).toContain("Degraded");
    expect(document.body.textContent).toContain("2");
    expect(document.body.textContent).toContain("Safety Rules");
    expect(document.body.textContent).toContain("Review Skill Document");
  });

  it("renders the Agent Kit Composer and saves selected packs and skills", async () => {
    mocks.apiClient.getAgentKitTemplates.mockImplementation(() => new Promise(() => {}));
    mountApp("#/composer/agent-kit");

    await waitForText("Agent Kit Composer");
    await waitForText("Kit Setup");
    await flushPendingUpdates();
    const saveButton = getButton("Save Agent Kit");
    expect(saveButton.disabled).toBe(true);

    clickCheckbox("AI Workstation Pack");
    clickCheckbox("Support Ticket Writing Skill");
    await flushPendingUpdates();
    expect(getButton("Save Agent Kit").disabled).toBe(false);

    await clickButtonAndFlush("Save Agent Kit");
    await waitForText("Agent Kit saved locally.");
    await flushPendingUpdates();

    expect(mocks.apiClient.saveAgentKit).toHaveBeenCalledWith(
      expect.objectContaining({
        contextPacks: ["ai-workstation-pack"],
        skills: ["support-ticket-writing-skill"],
        target: "codex",
        format: "markdown",
        privacyMode: "redacted",
        boundaries: expect.objectContaining({
          containsExecutableCode: false,
          cloudSync: false,
          telemetry: false,
          marketplacePublish: false
        })
      })
    );
    const serialized = JSON.stringify(mocks.apiClient.saveAgentKit.mock.calls[0][0]);
    expect(serialized).not.toContain(":\\\\");
    expect(serialized).not.toContain("../");
    expect(serialized).not.toContain("..\\\\");
    const openLink = Array.from(document.querySelectorAll("a")).find((link) => link.textContent?.includes("Open implementation-support-kit"));
    expect(openLink?.getAttribute("href")).toBe("#/agent-kits/implementation-support-kit");
  });

  it("prefills the Agent Kit Composer from templates before save", async () => {
    mountApp("#/composer/agent-kit");

    await waitForText("Coding Task Kit Template");
    await flushPendingUpdates();
    selectOption("Start from scratch", "coding-task-kit-template");
    await flushPendingUpdates();

    expect(document.body.textContent).toContain("Template applied as an unreviewed local draft.");
    expect(getButton("Save Agent Kit").disabled).toBe(false);
    await clickButtonAndFlush("Save Agent Kit");
    await waitForText("Agent Kit saved locally.");
    await flushPendingUpdates();

    expect(mocks.apiClient.createAgentKitFromTemplate).toHaveBeenCalledWith(
      "coding-task-kit-template",
      expect.objectContaining({
        id: "coding-task-kit-draft",
        name: "Coding Task Kit Draft",
        goal: "Prepare a coding task brief.",
        contextPacks: ["ai-workstation-pack"],
        skills: ["support-ticket-writing-skill"],
        target: "codex",
        format: "markdown",
        privacyMode: "redacted"
      })
    );
  });

  it("renders the Agent Kit detail route", async () => {
    mountApp("#/agent-kits/implementation-support-kit");

    await waitForText("Implementation Support Kit");
    expect(mocks.apiClient.getAgentKit).toHaveBeenCalledWith("implementation-support-kit");
    expect(mocks.apiClient.getAgentKitHealth).toHaveBeenCalledWith("implementation-support-kit");
    expect(document.body.textContent).toContain("Kit Summary");
    expect(document.body.textContent).toContain("Context Packs");
    expect(document.body.textContent).toContain("Skills");
  });

  it("renders the Agent Kit library route", async () => {
    mountApp("#/agent-kits");

    await waitForText("Implementation Support Kit");
    expect(document.body.textContent).toContain("Implementation Support Kit");
    expect(document.body.textContent).toContain("1 packs");
    expect(document.body.textContent).toContain("1 skills");
  });

  it("renders Context Pack collectors and submits preview/create requests", async () => {
    mountApp("#/collectors");

    await waitForText("Context Pack Collectors");
    await waitForText("Blank Pack Starter");
    selectOption("Blank Pack Starter", "markdown-folder");
    await waitForText("Convert a local Markdown folder into private draft Context Pack records.");
    setInputValue("D:/local/project-notes", "D:/local/project-notes");
    setInputValue("optional-draft-pack-id", "draft-pack");
    await flushPendingUpdates();
    clickButton("Preview Draft Pack");
    await waitForMockResult(mocks.apiClient.previewContextPackCollector, 0);
    await waitForText("Markdown Draft Pack");
    clickButton("Create Draft Pack");
    await waitForMockResult(mocks.apiClient.runContextPackCollector, 0);
    await waitForText("Validation");

    expect(mocks.apiClient.previewContextPackCollector).toHaveBeenCalledWith(
      "markdown-folder",
      expect.objectContaining({
        inputPath: "D:/local/project-notes",
        packId: "draft-pack"
      })
    );
    expect(mocks.apiClient.runContextPackCollector).toHaveBeenCalledWith(
      "markdown-folder",
      expect.objectContaining({ overwrite: false })
    );
  });

  it("shows Context Pack collector API errors", async () => {
    mocks.apiClient.previewContextPackCollector.mockRejectedValueOnce(new Error("Preview collector failed safely."));

    mountApp("#/collectors");

    await waitForText("Blank Pack Starter");
    await flushPendingUpdates();
    clickButton("Preview Draft Pack");
    await waitForMockResult(mocks.apiClient.previewContextPackCollector, 0);
    await waitForText("Preview collector failed safely.");

    expect(mocks.apiClient.previewContextPackCollector).toHaveBeenCalled();
    expect(mocks.apiClient.runContextPackCollector).not.toHaveBeenCalled();
  });

  it("keeps the local Skill import lane available when enabled", async () => {
    mocks.apiClient.getHealth.mockResolvedValue({ ...healthFixture(), localImportsEnabled: true });

    mountApp("#/collectors");

    await waitForText("Import Source");
    setInputValue("D:/local/fake-prompts", "D:/local/fake-prompts");
    selectOption("Auto", "markdown");
    setInputValue("optional-draft-skill-id", "imported-skill");
    await flushPendingUpdates();
    clickButton("Preview");
    await waitForMockResult(mocks.apiClient.previewSkillImport, 0);
    await waitForText("Imported Skill");
    clickButton("Import Draft Skill");
    await waitForMockResult(mocks.apiClient.importSkill, 0);
    await waitForText("Validation");

    expect(mocks.apiClient.previewSkillImport).toHaveBeenCalledWith(
      expect.objectContaining({
        inputPath: "D:/local/fake-prompts",
        kind: "markdown",
        skillId: "imported-skill"
      })
    );
    expect(mocks.apiClient.importSkill).toHaveBeenCalledWith(expect.objectContaining({ overwrite: false }));
  });

  it("shows the local Skill import disabled state by default", async () => {
    mountApp("#/collectors");

    await waitForText("Local imports disabled");
    await flushPendingUpdates();
    expect(mocks.apiClient.previewSkillImport).not.toHaveBeenCalled();
  });

  it("shows local Skill import API errors", async () => {
    mocks.apiClient.getHealth.mockResolvedValue({ ...healthFixture(), localImportsEnabled: true });
    mocks.apiClient.previewSkillImport.mockRejectedValueOnce(new Error("Preview import failed safely."));

    mountApp("#/collectors");

    await waitForText("Import Source");
    setInputValue("D:/local/fake-prompts", "D:/local/fake-prompts");
    await flushPendingUpdates();
    clickButton("Preview");
    await waitForMockResult(mocks.apiClient.previewSkillImport, 0);
    await waitForText("Preview import failed safely.");

    expect(mocks.apiClient.previewSkillImport).toHaveBeenCalled();
    expect(mocks.apiClient.importSkill).not.toHaveBeenCalled();
  });

  it("renders Agent Kit health and export preview tabs", async () => {
    mountApp("#/agent-kits/implementation-support-kit");

    await waitForText("Implementation Support Kit");
    clickButton("Health");
    await waitForText("Open Items");
    expect(document.body.textContent).toContain("Validation");

    clickButton("Exports");
    await waitForText("Implementation Support Kit Codex Export");
    clickButton("Preview");
    await waitForText("Codex Agent Kit Export");
    expect(document.body.textContent).toContain("Copy");
    expect(document.body.textContent).toContain("Download");
    expect(mocks.apiClient.getAgentKitExportPreview).toHaveBeenCalledWith(
      "implementation-support-kit",
      "implementation-support-kit-codex"
    );
  });

  it("copies and downloads Agent Kit export previews", async () => {
    mountApp("#/agent-kits/implementation-support-kit");

    await waitForText("Implementation Support Kit");
    clickButton("Exports");
    await waitForText("Implementation Support Kit Codex Export");
    clickButton("Preview");
    await waitForText("Codex Agent Kit Export");
    clickButton("Copy");
    await flushPendingUpdates();
    clickButton("Download");

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("# Codex Agent Kit Export\n\nLocal generated preview.");
    expect(downloadedFileName).toBe("implementation-support-kit-codex.md");
  });

  it("renders the Agent Kit detail error state", async () => {
    mocks.apiClient.getAgentKit.mockRejectedValueOnce(new Error("Agent Kit endpoint unavailable"));

    mountApp("#/agent-kits/missing-kit");

    await waitForText("Agent Kit unavailable");
    expect(document.body.textContent).toContain("Agent Kit endpoint unavailable");
  });

  it("keeps the record export Composer available as its own mode", async () => {
    mocks.apiClient.getPackRecords.mockResolvedValue([
      {
        id: "ai-workstation-pack.local-ai-stack",
        packId: "ai-workstation-pack",
        title: "Local AI Stack",
        type: "runbook",
        confidence: "high",
        sourceStatus: "verified",
        freshness: "current",
        privacy: "public_safe",
        lastReviewed: "2026-05-07T00:00:00.000Z",
        reviewStatus: "approved",
        tags: ["local"],
        sources: [],
        filePath: "records/local-ai-stack.md"
      }
    ]);

    mountApp("#/composer/record-export");

    await waitForText("Build temporary, redacted context exports from selected local records.");
    await waitForText("Local AI Stack");
    expect(document.body.textContent).toContain("Save as pack later");
  });
});

function mountApp(hash: string): void {
  window.location.hash = hash;
  const container = document.createElement("div");
  document.body.append(container);
  act(() => {
    root = createRoot(container);
    root.render(<App />);
  });
}

async function waitForText(text: string): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (document.body.textContent?.includes(text)) {
      return;
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }

  throw new Error(`Timed out waiting for text: ${text}`);
}

function clickButton(label: string): void {
  const button = Array.from(document.querySelectorAll("button")).find(
    (item) => !item.disabled && item.textContent?.trim() === label
  );
  expect(button).toBeTruthy();
  act(() => {
    button?.click();
  });
}

async function clickButtonAndFlush(label: string): Promise<void> {
  const button = Array.from(document.querySelectorAll("button")).find(
    (item) => !item.disabled && item.textContent?.trim() === label
  );
  expect(button).toBeTruthy();
  await act(async () => {
    button?.click();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await Promise.resolve();
  });
}

async function waitForMockResult(mock: { mock: { results: Array<{ value: unknown }> } }, index: number): Promise<void> {
  await act(async () => {
    await Promise.resolve(mock.mock.results[index]?.value).catch(() => undefined);
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.resolve();
  });
}

function getButton(label: string): HTMLButtonElement {
  const button = Array.from(document.querySelectorAll("button")).find((item) => item.textContent?.trim() === label);
  expect(button).toBeTruthy();
  return button!;
}

function clickCheckbox(labelText: string): void {
  const label = Array.from(document.querySelectorAll("label")).find((item) => item.textContent?.includes(labelText));
  expect(label).toBeTruthy();
  const input = label!.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
  expect(input).toBeTruthy();
  act(() => {
    input!.click();
  });
}

function selectOption(currentLabel: string, value: string): void {
  const select = Array.from(document.querySelectorAll("select")).find((item) => {
    const selectedOption = item.options[item.selectedIndex];
    return selectedOption?.textContent?.trim() === currentLabel;
  });
  expect(select).toBeTruthy();
  act(() => {
    select!.value = value;
    select!.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function setInputValue(placeholder: string, value: string): void {
  const input = Array.from(document.querySelectorAll("input")).find((item) => item.placeholder === placeholder);
  expect(input).toBeTruthy();
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  act(() => {
    valueSetter?.call(input, value);
    input!.dispatchEvent(new Event("input", { bubbles: true }));
    input!.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function flushPendingUpdates(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function healthFixture(): HealthResponse {
  return {
    status: "ok",
    authRequired: false,
    lastIndexedAt: "2026-05-07T00:00:00.000Z",
    counts: {
      packs: 1,
      records: 5,
      sources: 5,
      exportProfiles: 8,
      skills: 1,
      skillInstructions: 3,
      skillExamples: 2,
      skillSources: 3,
      skillExportProfiles: 6,
      agentKits: 1,
      agentKitContextPackRefs: 1,
      agentKitSkillRefs: 1,
      agentKitExportProfiles: 1,
      reviewItems: 0,
      openReviewItems: 0
    }
  };
}

function packFixture(): PackSummary {
  return {
    id: "ai-workstation-pack",
    name: "AI Workstation Pack",
    version: "1.0.0",
    description: "Fake workstation context pack.",
    type: "workstation",
    visibility: "local",
    trustLevel: "local",
    healthScore: 100,
    healthStatus: "healthy",
    validationStatus: "valid",
    exportReadiness: "ready",
    validationErrors: 0,
    validationWarnings: 0,
    redactionWarningCount: 0,
    staleSourceCount: 0,
    licenseWarningCount: 0,
    licenseMissingCount: 0,
    licenseUnknownCount: 0,
    licenseRiskCount: 0,
    recordCount: 5,
    sourceCount: 5,
    exportProfileCount: 8,
    accentColor: "#38bdf8",
    coverImage: null,
    reviewQueueCount: 0,
    lastReviewedAt: "2026-05-07T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z"
  };
}

function packDetailFixture() {
  return {
    ...packFixture(),
    author: "Contextarr Demo",
    license: "MIT",
    createdAt: "2026-05-07T00:00:00.000Z",
    packPath: "demo-packs/ai-workstation-pack",
    manifest: {},
    counts: {
      records: 5,
      sources: 5,
      exportProfiles: 8
    },
    validation: {
      status: "valid",
      errors: 0,
      warnings: 0,
      redactionWarningCount: 0,
      staleSourceCount: 0,
      licenseWarningCount: 0,
      licenseMissingCount: 0,
      licenseUnknownCount: 0,
      licenseRiskCount: 0
    },
    exportReadiness: {
      status: "ready",
      profilesReady: 8,
      profilesWithWarnings: 0,
      profilesBlocked: 0,
      profiles: []
    },
    health: {
      score: 100,
      status: "healthy",
      validationErrors: 0,
      validationWarnings: 0,
      recordCount: 5,
      sourceCount: 5,
      exportProfileCount: 8,
      updatedAt: "2026-05-07T00:00:00.000Z"
    },
    sources: [],
    exportProfiles: []
  };
}

function skillFixture(): SkillSummary {
  return {
    id: "support-ticket-writing-skill",
    name: "Support Ticket Writing Skill",
    version: "1.0.0",
    description: "Write safe support responses.",
    type: "support_writing",
    visibility: "local",
    trustLevel: "local",
    healthScore: 100,
    healthStatus: "healthy",
    validationErrors: 0,
    validationWarnings: 0,
    instructionCount: 3,
    exampleCount: 2,
    sourceCount: 3,
    exportProfileCount: 6,
    accentColor: "#38bdf8",
    coverImage: null,
    reviewQueueCount: 0,
    lastReviewedAt: "2026-05-07T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z",
    targets: ["codex"],
    inputs: ["ticket_notes"],
    outputs: ["customer_response"]
  };
}

function skillDetailFixture(): SkillDetail {
  return {
    ...skillFixture(),
    author: "Contextarr Demo",
    license: "CC0-1.0",
    createdAt: "2026-05-07T00:00:00.000Z",
    manifest: {},
    counts: {
      instructions: 3,
      examples: 2,
      sources: 3,
      exportProfiles: 6
    },
    validation: {
      errors: 0,
      warnings: 0
    },
    health: {
      score: 100,
      status: "healthy"
    },
    sources: [
      {
        id: "support-ticket-writing-skill.demo-source",
        title: "Demo Skill Source",
        type: "document",
        url: null,
        path: null,
        retrievedAt: null,
        license: "CC0-1.0",
        trust: "local",
        status: "current"
      }
    ],
    exportProfiles: [
      {
        id: "support-ticket-writing-skill-codex",
        name: "Codex Skill Export",
        target: "codex",
        format: "markdown",
        privacyMode: "redacted",
        tokenBudget: 1200
      }
    ]
  };
}

function skillHealthFixture(): SkillHealthResponse {
  return {
    skillId: "support-ticket-writing-skill",
    score: 100,
    status: "healthy",
    reviewQueueCount: 0,
    checks: [
      {
        id: "validation",
        label: "Validation",
        status: "pass",
        count: 0
      }
    ],
    items: []
  };
}

function agentKitSummaryFixture() {
  const detail = agentKitDetailFixture();
  return {
    id: detail.id,
    name: detail.name,
    version: detail.version,
    description: detail.description,
    type: detail.type,
    visibility: detail.visibility,
    trustLevel: detail.trustLevel,
    healthScore: detail.healthScore,
    healthStatus: detail.healthStatus,
    validationErrors: detail.validationErrors,
    validationWarnings: detail.validationWarnings,
    contextPackCount: detail.contextPackCount,
    skillCount: detail.skillCount,
    exportProfileCount: detail.exportProfileCount,
    accentColor: detail.accentColor,
    coverImage: detail.coverImage,
    reviewQueueCount: detail.reviewQueueCount,
    lastReviewedAt: detail.lastReviewedAt,
    updatedAt: detail.updatedAt,
    target: detail.target,
    privacyMode: detail.privacyMode
  };
}

function agentKitTemplateFixture(): AgentKitTemplateSummary {
  return {
    id: "coding-task-kit-template",
    name: "Coding Task Kit Template",
    version: "1.0.0",
    description: "Public-safe template for coding tasks.",
    category: "coding",
    trustLevel: "official",
    accentColor: "#38bdf8",
    suggestedAgentKit: {
      id: "coding-task-kit-draft",
      name: "Coding Task Kit Draft",
      goal: "Prepare a coding task brief.",
      description: "Use local source context.",
      contextPacks: ["ai-workstation-pack"],
      skills: ["support-ticket-writing-skill"],
      target: "codex",
      format: "markdown",
      privacyMode: "redacted",
      excludeTags: ["secret", "never_export", "imported_draft"],
      tokenBudget: 12000
    },
    safetyNotes: ["Review the draft before export."],
    validation: {
      errors: 0,
      warnings: 0
    }
  };
}

function agentKitHealthFixture(): AgentKitHealthResponse {
  return {
    agentKitId: "implementation-support-kit",
    score: 100,
    status: "healthy",
    reviewQueueCount: 0,
    checks: [
      {
        id: "validation",
        label: "Validation",
        status: "pass",
        count: 0
      }
    ],
    items: []
  };
}

function agentKitDetailFixture() {
  return {
    id: "implementation-support-kit",
    name: "Implementation Support Kit",
    version: "1.0.0",
    description: "Compose context and skills.",
    type: "implementation_planning",
    visibility: "local",
    trustLevel: "local",
    healthScore: 100,
    healthStatus: "healthy",
    validationErrors: 0,
    validationWarnings: 0,
    contextPackCount: 1,
    skillCount: 1,
    exportProfileCount: 1,
    accentColor: "#22d3e8",
    coverImage: null,
    reviewQueueCount: 0,
    lastReviewedAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
    target: "codex",
    privacyMode: "redacted",
    author: "Contextarr Demo",
    license: "MIT",
    createdAt: "2026-05-08T00:00:00.000Z",
    manifest: {
      containsExecutableCode: false,
      requiresNetwork: false,
      exportProfile: "implementation-support-kit-codex",
      compatibility: {
        contextarr: ">=0.1.0"
      }
    },
    counts: {
      contextPacks: 1,
      skills: 1,
      exportProfiles: 1
    },
    validation: {
      errors: 0,
      warnings: 0
    },
    health: {
      score: 100,
      status: "healthy"
    },
    contextPacks: [packFixture()],
    skills: [skillFixture()],
    exportProfiles: [
      {
        id: "implementation-support-kit-codex",
        name: "Implementation Support Kit Codex Export",
        target: "codex",
        format: "markdown",
        privacyMode: "redacted",
        tokenBudget: 12000
      }
    ]
  };
}

function agentKitPreviewFixture() {
  return {
    agentKitId: "implementation-support-kit",
    profileId: "implementation-support-kit-codex",
    target: "codex",
    format: "markdown",
    privacyMode: "redacted",
    tokenBudget: 12000,
    filename: "implementation-support-kit-codex.md",
    mimeType: "text/markdown",
    content: "# Codex Agent Kit Export\n\nLocal generated preview.",
    contentStatus: "ready",
    includedRecords: [
      {
        id: "context-record",
        title: "Context Record",
        type: "note",
        privacy: "public_safe",
        tags: [],
        sources: []
      }
    ],
    excludedRecords: [],
    sources: [],
    includedContextPacks: [packFixture()],
    includedSkills: [skillFixture()],
    warnings: [],
    generatedAt: "2026-05-08T00:00:00.000Z",
    byteLength: 45,
    estimatedTokens: 12
  };
}

function reviewItemFixture(): ReviewItem {
  return {
    id: "skill-review-item",
    fingerprint: "skill|support-ticket-writing-skill|review_status",
    objectType: "skill",
    objectId: "support-ticket-writing-skill",
    type: "review_status",
    severity: "warning",
    packId: "support-ticket-writing-skill",
    skillId: "support-ticket-writing-skill",
    agentKitId: null,
    recordId: "support-ticket-writing-skill.response-style",
    sourceId: null,
    message: "Review Skill Document",
    suggestedAction: "Review and approve the Skill document.",
    status: "open",
    firstSeenAt: "2026-05-07T00:00:00.000Z",
    lastSeenAt: "2026-05-07T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z",
    metadata: {}
  };
}

function agentKitReviewItemFixture(): ReviewItem {
  return {
    id: "agent-kit-review-item",
    fingerprint: "agent_kit|implementation-support-kit|review_status",
    objectType: "agent_kit",
    objectId: "implementation-support-kit",
    type: "review_status",
    severity: "warning",
    packId: "implementation-support-kit",
    skillId: null,
    agentKitId: "implementation-support-kit",
    recordId: null,
    sourceId: null,
    message: "Review Agent Kit References",
    suggestedAction: "Review referenced packs and skills before relying on this Agent Kit.",
    status: "open",
    firstSeenAt: "2026-05-08T00:00:00.000Z",
    lastSeenAt: "2026-05-08T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
    metadata: {}
  };
}

function skillDocumentFixture(id: string, title = "Response Style", type = "instruction"): SkillDocument {
  return {
    id,
    skillId: "support-ticket-writing-skill",
    title,
    type,
    confidence: "high",
    sourceStatus: "verified",
    freshness: "current",
    privacy: "public_safe",
    lastReviewed: "2026-05-07T00:00:00.000Z",
    reviewStatus: "approved",
    tags: ["support"],
    sources: [],
    body: "## Response Style\n\nUse concise Markdown.\n\n<script>alert('bad')</script>",
    metadata: {}
  };
}
