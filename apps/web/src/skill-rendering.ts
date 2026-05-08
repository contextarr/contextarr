import { renderMarkdownToHtml } from "@contextarr/renderer/markdown";

export function renderSkillDocumentHtml(markdown: string): string {
  return renderMarkdownToHtml(markdown);
}
