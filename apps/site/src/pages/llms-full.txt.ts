import { futureDirectionLines, links } from "../content/site";
import {
  advancedPreview,
  coreWorkingNow,
  exactSecurityBoundaryBullets,
  notIncludedYet
} from "../content/status";

function list(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

const body = `# Contextarr

## Product summary

Contextarr is a local-first Context Pack system for preparing trusted AI context from local files. Validated context files in, AI-ready exports out, human-readable dashboard, and read-only local MCP.

It turns local Markdown records, source maps, validation rules, redaction rules, review metadata, and export profiles into validated Context Packs.

Contextarr is not a chatbot, hosted memory vault, vector database, graph database, public marketplace, managed RAG app, or agent runner.

Contextarr prepares context. It does not run agents.

## Public website routes

- /how-it-works: Assemble, Review, Route.
- /use-cases: Coding agents, homelabs, Markdown, internal KBs, consultants, and local AI users.
- /run-locally: Docker preview, CLI checks, rendered HTML, exports, and read-only MCP.
- /demo-packs: Current public-safe demo Context Packs.
- /pack-format: Context Pack anatomy and boundaries.
- /docs: Website index to GitHub documentation.
- /faq: Naming, privacy, Context Packs, exports, MCP, and roadmap questions.

## Core object definitions

Context Pack:
A structured, versioned, source-backed bundle of reusable context for humans and AI tools.

SQLite index:
A rebuildable derived local index. Local pack files remain the source of truth.

Exports:
Explicit generated artifacts for AI tools and humans. Exports apply privacy modes, exclude tags, and redaction rules.

MCP:
A local stdio read-only interface for pack summaries, record lookups, search, profiles, and export previews.

## Current status

Developer preview from main. Core Context Pack workflows are the current adoption target. Skills and Agent Kits are advanced-preview, non-executing surfaces. Native Skills are data-only; future imported external Skill artifacts may be preserved unmodified and unexecuted.

The repo currently includes 15 public-safe demo Context Packs, including 12 curated starter Context Packs.

## Core working now

${list(coreWorkingNow)}

## Advanced preview

${list(advancedPreview)}

Contextarr prepares Agent Kits. It does not run them.

## Not included

${list(notIncludedYet)}

## Security boundaries

${list(exactSecurityBoundaryBullets)}
- no telemetry
- no hosted cloud vault
- no public marketplace
- no public registry
- no package publishing
- no remote install
- AI-drafted content requires human review

## Skills and Agent Kits note

${futureDirectionLines.join("\n")}

These objects are non-executing and frozen behind the v1 bridge gate until Context Pack core readiness is accepted or superseded by a decision record.

## Repository

${links.github}

## Website

https://contextarr.com

## Contact

Security reports: ${links.securityEmail}
Project feedback: ${links.issues}
`;

export function GET() {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
