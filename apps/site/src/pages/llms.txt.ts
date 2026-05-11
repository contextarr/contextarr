import { links } from "../content/site";

const body = `# Contextarr

Contextarr is a local-first Context Pack system for preparing trusted AI context from local files.

It turns local Markdown records, source maps, validation rules, redaction rules, review metadata, and export profiles into validated Context Packs.

Core status:
- developer preview from main
- core Context Pack workflows are the current adoption target
- 15 public-safe demo Context Packs
- 12 curated starter Context Packs
- SQLite is a rebuildable derived index
- dashboard, Pack Health, exports, CLI, and read-only MCP exist
- Skills and Agent Kits are advanced-preview data objects; they are data-only
- Contextarr prepares Agent Kits; it does not run them

Boundaries:
- no hosted cloud
- no hosted vault
- no public registry
- no public marketplace
- no package publishing
- no remote install
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
