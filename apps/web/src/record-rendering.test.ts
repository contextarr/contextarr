import { describe, expect, it } from "vitest";
import { renderRecordBodyHtml } from "./record-rendering";

describe("record body rendering", () => {
  it("uses sanitized Markdown rendering", () => {
    const html = renderRecordBodyHtml("# Record\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))");

    expect(html).toContain("<h1");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
  });
});
