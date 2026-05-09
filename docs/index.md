# Contextarr Docs

This is the main documentation entry point for Contextarr.

Contextarr is local-first context infrastructure for AI tools and agent workflows. Files are the source of truth. SQLite, rendered output, exports, API responses, CLI output, and MCP responses are derived artifacts.

For current versus planned behavior, start with [Implementation Status](implementation-status.md).

## Planning Hierarchy

Use these docs in this order when deciding what is current, next, or out of scope:

| Source | Authority |
|---|---|
| [Implementation Status](implementation-status.md) | Shipped-versus-planned truth. If this conflicts with roadmap language, this wins. |
| [Roadmap Phases](roadmap-phases.md) | Build order and phase numbering. |
| [Roadmap](roadmap.md) | Near-term direction and deferred work. |
| [Product Defense Roadmap](product-defense-roadmap.md) | Criticism, proof, trust, export-quality, and adoption countermeasures. |
| [Implementation Priorities](implementation-priorities.md) | Compact build-priority overlay. |
| [Good-to-Great PRD Addition](contextarr_prd_addition_good_to_great_layers.md) | Overlay for quality, authoring, provenance, agent-interface, and starter layers. It does not replace core Context Pack phases. |
| [Phase-by-Phase PRD](contextarr_phase_by_phase_prd_to_v1.md) | Historical/core implementation plan. Verify against current status before using as a shipped-behavior source. |

## Getting Started

| Doc | Use it for |
|---|---|
| [Quickstart](quickstart.md) | Running the local dev stack and Docker preview. |
| [Configuration](configuration.md) | Runtime requirements, environment variables, ports, Docker status, and common commands. |
| [Repository Publication Checklist](repo-publication-checklist.md) | Public repo readiness, manual GitHub settings, release prep, and cleanup tasks. |
| [Release Checklist](release-checklist.md) | Public preview release checks. |
| [v0.1.0-alpha.1 Release Draft](release-draft-v0.1.0-alpha.1.md) | Draft notes for the first alpha release. |
| [Changelog](../CHANGELOG.md) | Unreleased public repo changes and future release notes. |
| [Support](../SUPPORT.md) | Realistic support expectations for early alpha. |
| [Contributing](../CONTRIBUTING.md) | Contribution flow and scope boundaries. |

## Product And Scope

| Doc | Use it for |
|---|---|
| [Implementation Status](implementation-status.md) | Source of truth for shipped versus planned behavior. |
| [Terminology](terminology.md) | Context Pack, Skill, Agent Kit, and Export Brief language. |
| [Architecture](architecture.md) | System shape, surfaces, data flow, and source of truth rules. |
| [Non-goals](non-goals.md) | Boundaries and rejected surfaces. |
| [Roadmap](roadmap.md) | Current preview, near-term work, and deferred work. |
| [Roadmap Phases](roadmap-phases.md) | Phase map and Good-to-Great overlay. |
| [Product Defense Roadmap](product-defense-roadmap.md) | Criticism-nullification and proof-path planning. |
| [Implementation Priorities](implementation-priorities.md) | Build-priority overlay for current stabilization work. |
| [PRD](prd.md) | Original product requirements and build plan. |

## Context Packs

| Doc | Use it for |
|---|---|
| [Pack Format](pack-format.md) | Manifest, records, sources, export profiles, and rules. |
| [Pack Authoring](pack-authoring.md) | How to write public-safe packs. |
| [Demo Packs](../demo-packs/README.md) | Included fake, public-safe pack examples. |
| [Demo Eval Fixtures](../demo-evals/README.md) | Public-safe benchmark fixtures consumed by the G3 local deterministic harness. |
| [Pack Health Scorecard](pack-health-scorecard.md) | Target health vocabulary and readiness model. |
| [Review Queue Principles](review-queue-principles.md) | Review workflow expectations. |
| [Importers](importers.md) | Current local importers. |
| [Import Quarantine](import-quarantine.md) | Planned quarantine model. |

## Interfaces

| Doc | Use it for |
|---|---|
| [CLI Command Contract](cli-command-contract.md) | Stable CLI output and command contract planning. |
| [CLI Agent Mode](cli-agent-mode.md) | Agent-safe CLI behavior. |
| [CLI JSON Schemas](cli-json-schemas.md) | JSON envelope planning. |
| [CLI vs MCP](cli-vs-mcp.md) | Why CLI is primary and MCP is optional. |
| [API](api.md) | Current local API status and routes. |
| [MCP](mcp.md) | Current read-only stdio MCP server. |
| [MCP Safety Model](mcp-safety-model.md) | MCP trust and privacy boundaries. |
| [Export Profiles](export-profiles.md) | Profile-driven export behavior. |
| [Export Quality Bar](export-quality-bar.md) | Export readiness requirements and planned gates. |

## Security

| Doc | Use it for |
|---|---|
| [Security Notes](security.md) | Short launch security summary. |
| [Security Model](security-model.md) | Full product security boundaries and requirements. |
| [Threat Model](threat-model.md) | Protected assets, trust boundaries, threats, and mitigations. |
| [Registry Readiness](registry-readiness.md) | Future registry trust requirements. |
| [Trust and Provenance](trust-and-provenance.md) | Future provenance layer planning. |

## Future Planning

| Doc | Use it for |
|---|---|
| [Context Quality](context-quality.md) | Context quality layer planning. |
| [Context Quality Benchmark](context-quality-benchmark.md) | G1 benchmark design, G2 fixture status, G3 diagnostic review, and G4 local gate behavior. |
| [Authoring SDK](authoring-sdk.md) | Future authoring SDK planning. |
| [Agent Interface Contract](agent-interface-contract.md) | Future agent-facing contract. |
| [Official Starter Ecosystem](official-starter-ecosystem.md) | Future curated starter assets. |
| [Skills](skills.md) | Future non-executable Skills. |
| [Agent Kits](agent-kits.md) | Future Agent Kit terminology. |
| [Non-Executable Skills](non-executable-skills.md) | Skill safety boundary. |

## Assets

| Doc | Use it for |
|---|---|
| [Brand Kit](brand.md) | Brand asset notes. |
| [Screenshot Notes](assets/screenshots/README.md) | Future screenshot expectations. |
| [Social Preview SVG](assets/social-preview.svg) | Local social card candidate for manual GitHub settings. |
