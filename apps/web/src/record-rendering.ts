import { renderMarkdownToHtml } from "@contextarr/renderer/markdown";

export function renderRecordBodyHtml(markdown: string): string {
  return renderMarkdownToHtml(markdown);
}
