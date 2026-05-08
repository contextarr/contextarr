import { describe, expect, it } from "vitest";
import { renderSkillDocumentHtml } from "./skill-rendering";

describe("Skill rendering", () => {
  it("sanitizes rendered Skill instructions", () => {
    const html = renderSkillDocumentHtml("# Skill\n\n<script>alert('x')</script>\n\n[bad](javascript:alert('x'))");

    expect(html).toContain("<h1>Skill</h1>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
  });
});
