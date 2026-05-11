import { describe, expect, it } from "vitest";
import { brandRegistryItemSchema } from "./brandSchema";
import { brands } from "./brands";
import { validateRegisteredBrandLogos, validateSvgLogo } from "./logoSafety";

describe("brand registry validation", () => {
  it("keeps every starter brand schema-valid and complete", () => {
    for (const brand of brands) {
      expect(brandRegistryItemSchema.parse(brand)).toEqual(brand);
      expect(brand.usageNote).toBe("identifier_only");
      expect(brand.allowRecolor).toBe(false);
    }
  });

  it("passes logo asset safety checks for registered SVGs", () => {
    expect(validateRegisteredBrandLogos()).toEqual([]);
  });

  it("rejects script tags, foreignObject, external hrefs, remote images, and javascript URLs", () => {
    const issues = validateSvgLogo(
      "bad",
      "bad.svg",
      `<svg><script>alert(1)</script><foreignObject /><a href="javascript:alert(1)" /><image href="https://example.test/x.png" /></svg>`
    );

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "logo.script",
        "logo.foreign_object",
        "logo.javascript_href",
        "logo.external_href",
        "logo.remote_image"
      ])
    );
  });
});
