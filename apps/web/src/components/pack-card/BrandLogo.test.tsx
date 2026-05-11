// @vitest-environment happy-dom
import { brandsById } from "@contextarr/brand-registry";
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { BrandLogo, getBrandLogoSrc } from "./BrandLogo";

let root: Root | null = null;
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("BrandLogo", () => {
  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
      root = null;
    }
    document.body.innerHTML = "";
  });

  it("renders a local SVG asset without recoloring or distortion styles", () => {
    const brand = brandsById.get("openai");
    expect(brand).toBeTruthy();

    render(<BrandLogo brand={brand!} />);

    const image = document.querySelector("img");
    expect(image?.getAttribute("alt")).toBe("OpenAI logo");
    expect(image?.getAttribute("src")).toBe(getBrandLogoSrc(brand!));
    expect(image?.className).toContain("brand-logo");
    expect(image?.getAttribute("style") ?? "").not.toContain("filter");
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
