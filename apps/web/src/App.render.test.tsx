// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HealthResponse, PackSummary, SkillDetail, SkillDocument, SkillSummary } from "./types";

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
      getSkills: vi.fn(),
      search: vi.fn(),
      getSkill: vi.fn(),
      getSkillInstructions: vi.fn(),
      getSkillExamples: vi.fn(),
      getSkillExports: vi.fn()
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

describe("App Skill UI routes", () => {
  beforeEach(() => {
    window.location.hash = "";
    mocks.apiClient.getHealth.mockResolvedValue(healthFixture());
    mocks.apiClient.getPacks.mockResolvedValue([packFixture()]);
    mocks.apiClient.getSkills.mockResolvedValue([skillFixture()]);
    mocks.apiClient.search.mockResolvedValue({ query: "", results: [] });
    mocks.apiClient.getSkill.mockResolvedValue(skillDetailFixture());
    mocks.apiClient.getSkillInstructions.mockResolvedValue([skillDocumentFixture("support-ticket-writing-skill.response-style")]);
    mocks.apiClient.getSkillExamples.mockResolvedValue([
      skillDocumentFixture("support-ticket-writing-skill.ticket-example", "Ticket Example", "example")
    ]);
    mocks.apiClient.getSkillExports.mockResolvedValue([]);
  });

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
      root = null;
    }
    document.body.innerHTML = "";
    window.location.hash = "";
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

  it("keeps Skill detail available when instruction/example documents fail", async () => {
    mocks.apiClient.getSkillInstructions.mockRejectedValue(new Error("Instructions endpoint unavailable"));
    mocks.apiClient.getSkillExamples.mockRejectedValue(new Error("Examples endpoint unavailable"));

    mountApp("#/skills/support-ticket-writing-skill");

    await waitForText("Support Ticket Writing Skill");
    expect(document.body.textContent).not.toContain("Skill unavailable");
    clickButton("Instructions");
    await waitForText("Instructions unavailable");
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

function healthFixture(): HealthResponse {
  return {
    status: "ok",
    authRequired: false,
    lastIndexedAt: "2026-05-07T00:00:00.000Z",
    counts: {
      packs: 1,
      records: 5,
      sources: 5,
      exportProfiles: 5,
      skills: 1,
      skillInstructions: 3,
      skillExamples: 2,
      skillSources: 3,
      skillExportProfiles: 4,
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
    validationErrors: 0,
    validationWarnings: 0,
    recordCount: 5,
    sourceCount: 5,
    exportProfileCount: 5,
    accentColor: "#38bdf8",
    coverImage: null,
    reviewQueueCount: 0,
    lastReviewedAt: "2026-05-07T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z"
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
    exportProfileCount: 4,
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
      exportProfiles: 4
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
