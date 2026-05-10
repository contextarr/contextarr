import { describe, expect, it } from "vitest";
import { validateRegisteredBrandLogos } from "../../../../../packages/brand-registry/src/logoSafety";

describe("web logo safety", () => {
  it("uses only local registered SVGs that pass safety checks", () => {
    expect(validateRegisteredBrandLogos()).toEqual([]);
  });
});
