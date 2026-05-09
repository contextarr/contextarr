import { links } from "../content/site";

const body = `# Contextarr

Contextarr is a self-hosted context automation system and pack manager for AI assistants and agents.

It turns local files, records, source maps, validation rules, redaction rules, and export profiles into validated Context Packs.

Core principles:
- local files are source of truth
- SQLite is a rebuildable derived index
- Context Packs are data-only
- no executable packs
- no scripts
- no shell commands
- no hidden network calls
- human review before trusted context
- redaction-aware exports
- read-only local MCP

Repository:
${links.github}

Website:
https://contextarr.com
`;

export function GET() {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
