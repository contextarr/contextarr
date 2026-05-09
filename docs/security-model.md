# Contextarr Security Model

Status note: This document defines security requirements and boundaries. Check [implementation-status.md](implementation-status.md) before treating scanner gates, quarantine, registry signing, approved-only export/MCP behavior, or CLI modes as shipped.

## Summary

Contextarr is local-first, source-backed, human-reviewed, and data-only. Pack content must be inspectable before it is trusted, exported, indexed, rendered, or exposed through MCP.

Security is a gate, not a marketing claim. Validation, scanner findings, signatures, quarantine, and review reduce risk; they do not guarantee perfect protection from prompt injection, malicious content, or user error.

## Good-to-Great Security Posture

The Good-to-Great layers do not weaken the no-execution boundary:

- Context Quality Benchmark work must be local and deterministic by default. It must not hide external AI calls, telemetry, or model leaderboard behavior.
- Pack Authoring SDK work must generate data-only, human-readable, public-safe starter content and must not create executable pack artifacts.
- Trust and Provenance work must make artifacts more inspectable. Hashes, lockfiles, Context BOM files, signatures, and revocation state must not auto-activate imported content.
- Agent Interface Contract work must keep CLI, exports, local API, static output, and optional MCP redaction-aware, bounded, and non-executing.
- Official Starter Ecosystem work must stay official, curated, fake or public-safe, and separate from marketplace or public registry behavior.

Any G-phase implementation must be explicitly scoped. The G0 planning pass is documentation only, and later trust or starter labels must never become an activation bypass.

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
- Agent Kit runner.
- CLI agent runner.
- CLI workflow automation engine.
- CLI execution of pack instructions.
- Scripts inside packs.
- Agent action runner.
- Direct Gmail connector.
- Direct bank or brokerage connector.
- Managed AI dependency.
- Telemetry.
- Passive always-on capture.
- Real private data in the repository.
- Claims of perfect prompt-injection detection.
- Direct cloud connectors before local importers prove value.
- Hidden external benchmark calls.
- Model leaderboard or vendor ranking service.
- Auto-activation from trust, provenance, starter, registry, or benchmark artifacts.

## Pack Safety Rules

Every activated pack must pass validation. Current validator gates include:

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

When declared in `rules/validation.yaml`, the validator also enforces the core policy checks `approved_content_only`, `public_safe_only`, `draft_records_require_review`, and `no_secret_tags`. Broader license, freshness, redaction, and export-readiness gates remain tracked in [implementation-status.md](implementation-status.md).

Validation and future scanner checks are activation gates, not guarantees. A clean validation report means the pack passed the current Contextarr policy checks. It does not mean the pack is perfectly safe.

## Data-Only Pack Principle

Packs are data: metadata, prompts, records, source maps, collector definitions, validation rules, redaction rules, and export templates.

Packs must not run code in v0 or v1.

No executable artifacts are allowed. Packs, future Skills, future Agent Kits, export profiles, rules, render output, and registry artifacts must remain data-only unless a future explicit security review changes the product boundary.

## Trust And Activation

Contextarr must not auto-trust imported, downloaded, generated, or registry-originated artifacts.

Required trust rules for current and future activation paths:

- Local validation before activation.
- Import quarantine before activation.
- Scanner gate when scanner exists.
- Human review before trust.
- Human review before default export or MCP exposure.
- Unknown license prevents verified status.
- Critical scanner or validation findings block activation.
- Signature mismatch blocks activation for future registry artifacts.
- Revoked status blocks activation for future registry artifacts.
- No AI auto-approval.

See `docs/import-quarantine.md` and `docs/registry-readiness.md` for the planning model.

Target requirement; not necessarily implemented in current code. Current import and quarantine status is tracked in `docs/implementation-status.md`.

## Local API Security

The local API binds to `127.0.0.1` by default. LAN mode must be explicit and warning-gated later.

Local loopback development can run without API auth while `CONTEXTARR_API_TOKEN` is empty or unset. Non-loopback binds such as `0.0.0.0` fail closed unless `CONTEXTARR_API_TOKEN` is set. When `CONTEXTARR_API_TOKEN` is set, all protected `/api/*` routes require either `Authorization: Bearer <token>` or `X-Contextarr-Token: <token>`. The health endpoint remains unauthenticated and reports only minimal status/auth metadata without a valid token; it must never return the configured token.

## CLI Security

The CLI is the primary deterministic automation interface for agents, scripts, CI, local tools, and power users. It calls shared core functions and must not shell out to MCP, the API, the Web UI, or another surface.

CLI security requirements for current and planned CLI surfaces:

- CLI agent mode defaults to redacted output.
- CLI does not execute pack content.
- CLI does not run shell commands from packs.
- CLI does not run Skills or Agent Kits.
- CLI mutation commands require an explicit mutating command and `--yes`.
- CLI import uses quarantine or generated draft state before activation.
- CLI query and export exclude unreviewed, draft, blocked, future revoked, and invalid content by default.
- CLI output is bounded in agent mode.
- CLI never hides network calls.
- Registry commands, when future implemented, must be explicit and quarantine-first.

See `docs/cli-security-model.md`, `docs/cli-agent-mode.md`, and `docs/cli-command-contract.md`.

Target requirement; not necessarily implemented in current code. Current CLI commands and flags are tracked in `docs/implementation-status.md`.

## Rendering Security

Markdown rendering is sanitized before HTML is displayed or written to static output. Rendered pack content must not include user JavaScript, event handler attributes, external scripts, iframe embeds, or `javascript:` links. Static HTML output is local generated documentation and must remain CSS-only.

## Read-Only MCP

The MCP server is local, stdio-only, and read-only. It must not:

- Mutate files.
- Run commands.
- Call network services.
- Access secrets.
- Return raw private source dumps unless explicitly configured.

`CONTEXTARR_MCP_ALLOW_PRIVATE=false` is the default. Secret record bodies are never returned through MCP. Private, internal, or sensitive record bodies are omitted unless private MCP access is explicitly enabled. MCP query logs store metadata only: tool name, ids, query hash and length, result count, timing, and sanitized flags. They must not store raw query text or returned context.

MCP must remain approved-content-only by default, redaction-aware, result-limited, and free of mutating tools. Approved-content-only behavior is a required completion gate; current MCP status is tracked in `docs/implementation-status.md`. See `docs/mcp-safety-model.md`.

MCP is optional. It is not the internal source of truth, and other surfaces must not wrap MCP for core behavior.

## Human Review

AI-drafted content, when supported later, must enter a review queue. It must not become approved pack content, be exported, or appear in MCP responses by default without human review.

Phase 6 review queue actions are SQLite-only local app state. Accept, Ignore, and Mark Reviewed do not mutate records, manifests, source maps, rules, or export profiles.

## Export Security

Phase 8 exports are generated from validated local pack files and data-only export profiles. Export generation must not mutate pack files, fetch source URLs, call AI APIs, upload data, execute pack content, or bypass redaction rules. CLI output belongs under ignored local artifact folders such as `generated-exports/`.

Exports follow least disclosure. Export profiles should include only the context required for the selected target, task, and privacy mode. Redaction warnings and blocked records must be visible before copy or download.

MCP export previews reuse the same export engine and do not write generated files.

Composer previews reuse the same export engine and redaction rules. They are read-only temporary artifacts: the API returns content, the browser may copy or download it locally, and Contextarr does not write composed pack files in Phase 11.

## Import Security

Phase 10 importers are local-only and produce draft packs under explicit ignored output folders. They must not fetch URLs, execute files, call AI APIs, upload data, or approve imported content.

Imported records default to `privacy: private`, `review_status: draft`, `source_status: imported`, and tags including `imported_draft` and `never_export`. Imported packs must be reviewed before use. Composer excludes `imported_draft` and `never_export` records by default.

Future local zip, registry, Skill, and Agent Kit imports must enter quarantine first. Quarantined items are not active, exportable, or MCP-visible by default.

## Skills and Agent Kits

Phase 12 defines future Skills and Agent Kits without implementation. A Skill is a non-executable instruction artifact. An Agent Kit is a pairing of Context Packs and Skills for a specific task. An Export Brief is generated output.

Contextarr prepares Agent Kits. It does not run them.

Future Skill and Agent Kit work must not add shell execution, browser automation, hidden network calls, API-calling Skills, runtime plugins, agent runners, marketplace behavior, telemetry, hosted cloud behavior, or unreviewed private data exposure.

## Telemetry

Telemetry is disabled and out of scope. Contextarr should not phone home by default.

## Cloud And Network

Contextarr must not make hidden cloud calls. Network access belongs to explicit user actions, documented setup, or future scoped features with visible configuration. There is no telemetry, hosted sync, hosted vault, managed AI dependency, or hidden registry access in the current product boundary.
