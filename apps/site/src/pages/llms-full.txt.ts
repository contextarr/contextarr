import { futureDirectionLines, links } from "../content/site";
import {
  exactSecurityBoundaryBullets,
  implementedFeatures,
  notIncludedYet
} from "../content/status";

function list(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

const body = `# Contextarr

## Product summary

Contextarr is a self-hosted context automation system and pack manager for AI assistants and agents.

It turns local files, records, source maps, validation rules, redaction rules, and export profiles into validated Context Packs.

The first product shape is:

Local sources in.
Validated Context Packs out.
Human-readable dashboard.
Profile-driven AI exports.
Read-only local MCP.

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

Phase 12: Skills and Agent Kits terminology planning.

The original PRD through Phase 11 is implemented locally. Phase 12 is documentation and terminology only. It does not add schema code, app functionality, runtime behavior, or execution capability.

Contextarr is early-stage software and is not production ready.

## Implemented features

${list(implementedFeatures)}

## Not included yet

${list(notIncludedYet)}

## Security boundaries

${list(exactSecurityBoundaryBullets)}
- no telemetry
- no hosted cloud vault
- no public marketplace
- no agent runner
- AI-drafted content requires human review

## Future Skills and Agent Kits note

${futureDirectionLines.join("\n")}

This is planned after the core Context Pack system is stable. Contextarr will prepare Agent Kits, not run them.

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
