import { describe, expect, it } from "vitest";
import { renderMarkdownToHtml } from "./markdown";

describe("renderMarkdownToHtml", () => {
  it("renders common Markdown structures", () => {
    const html = renderMarkdownToHtml(`
# Title

- one
- two

| A | B |
|---|---|
| C | D |

> note

\`\`\`ts
const value = 1;
\`\`\`
`);

    expect(html).toContain("<h1");
    expect(html).toContain("<ul>");
    expect(html).toContain("<table>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<code");
  });

  it("strips unsafe HTML and link protocols", () => {
    const html = renderMarkdownToHtml(`
<script>alert("x")</script>
<iframe src="https://example.com"></iframe>
<img src=x onerror="alert(1)">
[bad](javascript:alert(1))
`);
    const safeLink = renderMarkdownToHtml("[good](https://example.com)");

    expect(html).not.toContain("<script");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
    expect(safeLink).toContain("https://example.com");
  });
});
