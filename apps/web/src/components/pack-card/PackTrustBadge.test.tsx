// @vitest-environment happy-dom
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { PackTrustBadge } from "./PackTrustBadge";
import { normalizePackTrustLevel, packTrustLabels } from "./packCardTokens";

let root: Root | null = null;
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("PackTrustBadge", () => {
  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
      root = null;
    }
    document.body.innerHTML = "";
  });

  it("normalizes supported display labels", () => {
    expect(packTrustLabels[normalizePackTrustLevel("curated")]).toBe("Curated");
    expect(packTrustLabels[normalizePackTrustLevel("verified")]).toBe("Verified");
    expect(packTrustLabels[normalizePackTrustLevel("community")]).toBe("Community");
    expect(packTrustLabels[normalizePackTrustLevel("local")]).toBe("Local");
    expect(packTrustLabels[normalizePackTrustLevel("imported")]).toBe("Imported");
    expect(packTrustLabels[normalizePackTrustLevel("unreviewed")]).toBe("Unreviewed");
    expect(packTrustLabels[normalizePackTrustLevel("blocked")]).toBe("Blocked");
  });

  it("maps official to Curated for third-party branded cards", () => {
    render(<PackTrustBadge trustLevel="official" hasThirdPartyBrand />);

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
