// @vitest-environment happy-dom
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { PackCard } from "./PackCard";
import type { PackSummary } from "../../types";

let root: Root | null = null;
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("PackCard", () => {
  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
      root = null;
    }
    document.body.innerHTML = "";
  });

  it("renders cover, health, trust, type, reviewed date, and quick actions", () => {
    render(<PackCard pack={pack()} />);

    expect(document.body.textContent).toContain("OpenAI Prompt Engineering Pack");
    expect(document.body.textContent).toContain("Ai Prompting");
    expect(document.body.textContent).toContain("95%");
    expect(document.body.textContent).toContain("Curated");
    expect(document.body.textContent).toContain("May 13, 2025");
    expect(document.querySelector("summary")?.getAttribute("aria-label")).toContain("quick actions");
  });

  it("does not display Official on third-party branded cards", () => {
    render(<PackCard pack={pack({ trustLevel: "official" })} />);

    expect(document.body.textContent).toContain("Curated");
    expect(document.body.textContent).not.toContain("Official");
  });
});

function render(element: ReactNode): void {
  const container = document.createElement("div");
  document.body.append(container);
  act(() => {
    root = createRoot(container);
    root.render(element);
  });
}

function pack(overrides: Partial<PackSummary> = {}): PackSummary {
  return {
    id: "openai-prompt-engineering-pack",
    name: "OpenAI Prompt Engineering Pack",
    version: "1.0.0",
    description: "Demo pack",
    type: "ai_prompting",
    visibility: "local",
    trustLevel: "curated",
    healthScore: 95,
    healthStatus: "healthy",
    validationErrors: 0,
    validationWarnings: 0,
    recordCount: 1,
    sourceCount: 1,
    exportProfileCount: 1,
    accentColor: "#10A37F",
    coverImage: null,
    brandId: "openai",
    coverRecipe: "brand_hex_v1",
    logoVariant: "auto",
    reviewQueueCount: 0,
    lastReviewedAt: "2025-05-13T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z",
    ...overrides
  };
}
