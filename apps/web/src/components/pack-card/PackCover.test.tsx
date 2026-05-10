// @vitest-environment happy-dom
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { PackCover } from "./PackCover";
import type { PackSummary } from "../../types";

let root: Root | null = null;
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("PackCover", () => {
  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
      root = null;
    }
    document.body.innerHTML = "";
  });

  it("renders a resolved brand logo centered inside the Contextarr hex frame", () => {
    render(<PackCover pack={pack({ brandId: "openai", name: "OpenAI Prompt Engineering Pack" })} />);

    expect(document.querySelector(".contextarr-hex-frame")).toBeTruthy();
    expect(document.querySelector("img")?.getAttribute("alt")).toBe("OpenAI logo");
  });

  it("renders a deterministic fallback card when the brand is missing", () => {
    render(<PackCover pack={pack({ name: "Generic Local Pack", brandId: "missing-brand" })} />);

    expect(document.querySelector(".contextarr-hex-frame")).toBeTruthy();
    expect(document.querySelector("img")).toBeNull();
    expect(document.querySelector(".brand-pack-cover")?.getAttribute("aria-label")).toBe("Generic Local Pack generated cover");
  });

  it("uses the same brand source for mini table icons", () => {
    render(<PackCover pack={pack({ brandId: "github", name: "GitHub Workflow Pack" })} variant="mini" />);

    expect(document.querySelector(".brand-logo-mini")).toBeTruthy();
    expect(document.querySelector("img")?.getAttribute("alt")).toBe("GitHub logo");
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
    id: "pack",
    name: "Pack",
    version: "1.0.0",
    description: "Demo pack",
    type: "demo",
    visibility: "local",
    trustLevel: "curated",
    healthScore: 95,
    healthStatus: "healthy",
    validationErrors: 0,
    validationWarnings: 0,
    recordCount: 1,
    sourceCount: 1,
    exportProfileCount: 1,
    accentColor: "#2563EB",
    coverImage: null,
    reviewQueueCount: 0,
    lastReviewedAt: "2026-05-07T00:00:00.000Z",
    updatedAt: "2026-05-07T00:00:00.000Z",
    ...overrides
  };
}
