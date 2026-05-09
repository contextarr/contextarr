# Marketplace Non-Goals

Status: Phase 28 research document.

Contextarr is not a marketplace. This document keeps that boundary visible before any private sharing or registry research continues.

## Product Boundary

Contextarr is a local-first Context Pack system for building, validating, reviewing, rendering, composing, exporting, and exposing source-backed AI context through local files, a rebuildable SQLite index, a dashboard, CLI workflows, and read-only MCP.

It prepares context. It does not run agents, execute Skills, host public content, or operate a marketplace.

## Explicit Non-Goals

Do not build these as part of the current roadmap:

- Public marketplace.
- Public registry.
- Hosted package index.
- Anonymous uploads.
- Public discovery pages.
- Ratings or reviews.
- Paid listings.
- Sponsored packs.
- Auto-install from remote sources.
- Auto-update from remote sources.
- Marketplace moderation tooling.
- Public trust badges.
- Remote dependency resolution.

## Why Marketplace Is Blocked

Marketplace behavior introduces risk before the core product is mature:

- Third-party content trust.
- Abuse and moderation.
- Copyright and license review.
- Credential leakage.
- Prompt-injection and social-engineering risks.
- Support burden for broken shared objects.
- Pressure to treat validation as automatic trust.
- Drift away from the local-first product.

Contextarr should prove local pack creation, validation, review, export, and read-only MCP value before any public sharing lane is reconsidered.

## Skills and Agent Kits

Completed Skills and Agent Kit work remains in the repository. The draft v1.0 bridge PRD does not require rollback.

However, further Skills and Agent Kit expansion is frozen until Context Pack core v1.0 readiness is explicitly accepted or superseded by a decision record.

This means no new public Skill or Agent Kit ecosystem work, marketplace work, remote sharing work, execution runtime, or automatic installation path should be added now.

## Private Registry Distinction

A private team registry is not the same as a marketplace.

A private registry, if ever approved, would be:

- Disabled by default.
- Local or private.
- API-token protected.
- No anonymous uploads.
- No public discovery.
- Validation-before-quarantine.
- Manual-review-before-activation.

Even that private registry prototype remains blocked until the v1.0 core-stabilization gate is resolved.

## Public Sharing Rule

If a future roadmap proposes public sharing, it must start as a new PRD or decision record. It must not quietly enter through registry implementation, demo content, template work, MCP tools, importer flows, or export profiles.

