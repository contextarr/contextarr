import { links } from "../content/site";

const body = `# Contextarr

Contextarr is a local-first Context Pack system for AI assistants and agents.

It turns local Markdown records, source maps, validation rules, redaction rules, review metadata, and export profiles into validated Context Packs.

Core status:
- developer preview from main
- core Context Pack workflows are being stabilized
- 15 public-safe demo Context Packs
- 12 curated starter Context Packs
- SQLite is a rebuildable derived index
- dashboard, Pack Health, exports, CLI, and read-only MCP exist
- Skills and Agent Kits are advanced-preview data objects
- Contextarr prepares Agent Kits; it does not run them

Boundaries:
- no hosted cloud
- no public registry
- no public marketplace
- no executable packs
- no executable Skills
- no Agent Kit runtime
- no telemetry
- human review before trusted context

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
