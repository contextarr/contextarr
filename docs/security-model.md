# Contextarr Security Model

## Summary

Contextarr is local-first, source-backed, human-reviewed, and data-only. Pack content must be inspectable before it is trusted, exported, indexed, rendered, or exposed through MCP.

## Non-Goals

Contextarr v0 must not include:

- Hosted cloud.
- Public registry.
- Marketplace.
- Marketplace payments.
- Anonymous public uploads.
- Remote install with auto-activation.
- Executable packs.
- Executable Skills.
- Executable registry artifacts.
- Agent Kit runtime execution.
- Agent Kit runner.
- Scripts inside packs.
- Agent action runner.
- Direct Gmail connector.
- Direct bank or brokerage connector.
- Managed AI dependency.
- Telemetry.
- Passive always-on capture.
- Real private data in the repository.
- Claims of perfect prompt-injection detection.
- Registry items bypassing local validation.
- Encrypted artifacts bypassing scanner review.

## Pack Safety Rules

Every activated pack must pass validation. Required checks later include:

- Manifest exists.
- License field exists.
- Trust level exists.
- Source map exists.
- No executable files.
- No scripts.
- No shell commands.
- No hidden binary payloads.
- No remote script includes.
- No API key patterns.
- No credential patterns.
- No disallowed permissions.

## Data-Only Pack Principle

Packs are data: metadata, prompts, records, source maps, collector definitions, validation rules, redaction rules, and export templates.

Packs must not run code in v0 or v1.

## Local API Security

The local API binds to `127.0.0.1` by default. LAN mode must be explicit and warning-gated later.

Loopback local development can run without API auth while `CONTEXTARR_API_TOKEN` is empty or unset. Non-loopback binds require `CONTEXTARR_API_TOKEN` at startup. When `CONTEXTARR_API_TOKEN` is set, all protected `/api/*` routes require either `Authorization: Bearer <token>` or `X-Contextarr-Token: <token>`. The health endpoint remains unauthenticated and reports only path-redacted status, auth requirement, aggregate counts, and last indexed time; it must never return the configured token or local filesystem paths.

## Rendering Security

Markdown rendering is sanitized before HTML is displayed or written to static output. Rendered pack content must not include user JavaScript, event handler attributes, external scripts, iframe embeds, or `javascript:` links. Static HTML output is local generated documentation and must remain CSS-only.

## Read-Only MCP

The MCP server is local, stdio-only, and read-only. It must not:

- Mutate files.
- Run commands.
- Execute Skills or run Agent Kits.
- Call network services.
- Access secrets.
- Return raw private source dumps unless explicitly configured.

`CONTEXTARR_MCP_ALLOW_PRIVATE=false` is the default. Secret record and Skill document bodies are never returned through MCP. Private, internal, or sensitive record and Skill document bodies are omitted unless private MCP access is explicitly enabled. Phase 25 extends MCP to Skills and Agent Kits with the same read-only and redaction-aware rules. MCP query logs store metadata only: tool name, ids, query hash and length, result count, timing, and sanitized flags. They must not store raw query text or returned context.

## Human Review

AI-drafted content, when supported later, must enter a review queue. It must not become approved pack content, be exported, or appear in MCP responses by default without human review.

Phase 6 review queue actions are SQLite-only local app state. Accept, Ignore, and Mark Reviewed do not mutate records, manifests, source maps, rules, or export profiles.

## Export Security

Phase 7 exports are generated from validated local pack files and data-only export profiles. Export generation must not mutate pack files, fetch source URLs, call AI APIs, upload data, execute pack content, or bypass redaction rules. CLI output belongs under ignored local artifact folders such as `generated-exports/`.

MCP export previews reuse the same export engine and do not write generated files.

Composer previews reuse the same export engine and redaction rules. They are read-only temporary artifacts: the API returns content, the browser may copy or download it locally, and Contextarr does not write composed pack files in Phase 10.

## Import Security

Phase 9 importers are local-only and produce draft packs under explicit ignored output folders. Context Pack collectors produce draft packs under `draft-packs/` or the configured `CONTEXTARR_DRAFT_PACKS_DIR` and do not index or activate them automatically. Phase 26 Skill importers produce draft Skills under `imported-skills/` or the configured `CONTEXTARR_IMPORTED_SKILLS_DIR`. They must not fetch URLs, execute files, call AI APIs, upload data, or approve imported content.

Imported records default to `privacy: private`, `review_status: draft`, `source_status: imported`, and tags including `imported_draft` and `never_export`. Imported packs must be reviewed before use. Composer excludes `imported_draft` and `never_export` records by default.

## Skills and Agent Kits

Phase 22 implements non-executable Skill schemas, validation, fake demo Skills, read-only Skill API indexing, read-only Skill Library/detail UI screens, deterministic Skill health/review items, read-only Skill export previews, Agent Kit schemas/validation, fake demo Agent Kits, Agent Kit API indexing/search, and a validated local Agent Kit Composer save flow. Phase 23 adds read-only Agent Kit Library/detail/health views with local, derived status. Phase 24 adds read-only Agent Kit export previews with local path stripping and hard exclusion for secret or `never_export` content. Phase 25 exposes Skills and Agent Kits through read-only stdio MCP tools without execution or file mutation. Phase 26 imports local draft Skills only when explicitly enabled and keeps them private, unreviewed, and excluded from exports until reviewed. Phase 27 Agent Kit templates are public-safe data-only source files; generated template drafts are unreviewed local Agent Kits written only under `CONTEXTARR_AGENT_KITS_DIR`. A Skill is a non-executable instruction artifact. An Agent Kit is a pairing of Context Packs and Skills for a specific task. An Export Brief is generated output.

Skill health checks reuse the same local, deterministic review queue model as Context Packs. They do not fetch source URLs, probe local source paths, run commands, execute Skill content, or rewrite Skill files. Review item status changes are stored in SQLite only.

Contextarr prepares Agent Kits. It does not run them.

Phase 23 health/detail output remains read-only and local-only. It may surface relationship summaries, status states, and review flags, but it must not write to source files or trigger execution.

Phase 24 Agent Kit export output remains read-only and local-only. It may merge Context Pack records and Skill documents into generated previews, but it must not execute Skills, run Agent Kits, fetch URLs, call AI APIs, leak local source paths, or include secret or `never_export` content.

Skill and Agent Kit manifest paths must stay inside their source folders. Skill and Agent Kit API responses must not expose local filesystem paths. Skill instructions and examples rendered in the web app must pass through the shared sanitized Markdown renderer. Future Skill and Agent Kit work must not add shell execution, browser automation, hidden network calls, API-calling Skills, runtime plugins, agent runners, marketplace behavior, telemetry, hosted cloud behavior, or unreviewed private data exposure.

## Trusted Registry Foundation

Future registry behavior must preserve Contextarr's local-first, data-only, non-executing posture.

A scanner is a gate, not a guarantee. A registry pass means the artifact passed the current Contextarr policy checks. It does not mean perfect safety, and it does not remove the need for quarantine, local re-scan, validation, and human review.

Registry security requirements:

- No executable registry artifacts.
- No auto-trust from listing status.
- Every imported registry item enters quarantine first.
- Local re-scan is required before activation.
- Local validation is required before activation.
- Human review is required before export or MCP exposure by default.
- Signed artifacts are required for verified or official status.
- Signature mismatch blocks activation.
- Revoked artifacts are blocked from export and MCP by default.
- Encryption protects storage and transport but does not prove safety.
- Scanning must happen before encryption or inside a trusted private review pipeline.
- Encrypted artifacts must not bypass scanner review.
- Read-only MCP remains unchanged: no mutation, no execution, no hidden network calls, no shell commands.

Registry status language must use conservative terms such as `policy_clean`, `no known critical findings`, `verified`, `signed and verified`, `registry approved`, `blocked`, `quarantined`, and `revoked`.

The public marketplace remains out of scope until the registry trust model, scanner policy, signing, revocation, abuse reporting, and quarantine install process are mature.

## Telemetry

Telemetry is disabled and out of scope. Contextarr should not phone home by default.
