# Registry Trust Model

Status: planning and architecture addition. No public registry is implemented by this document.

Contextarr is evolving toward a trusted package manager for AI-ready context. Shared context needs a trust layer.

The correct strategy is not an open marketplace where anyone uploads anything. The correct strategy is a trusted registry and local package manager for AI-ready Context Packs, non-executable Skills, and Agent Kits, where every artifact is validated, scanned, signed, encrypted in storage, quarantined on install, locally re-scanned before activation, and reviewed before use.

A scanner is a gate, not a guarantee. The scanner can block known bad patterns, detect suspicious content, and enforce Contextarr policy. It cannot prove that arbitrary natural-language instructions are safe in all downstream agent runtimes.

## Registry Principles

- Registry before marketplace.
- Trust model before public uploads.
- Scanner before remote install.
- Quarantine before activation.
- Local re-scan before use.
- Human review before export or MCP exposure.
- Contextarr registry artifacts are not trusted merely because they are listed.
- A registry pass means the artifact passed the current Contextarr policy checks. It does not mean perfect safety.
- The registry is metadata, validation, signing, review, discovery, and controlled distribution.
- The marketplace is the later commercial layer for paid artifacts.

## Scope

The trust model may eventually apply to:

1. Context Packs.
2. Skills.
3. Agent Kits.
4. Export profiles.
5. Validation rule sets.
6. Redaction rule sets.
7. Templates.
8. Demo packs.
9. Registry policies.

It must not turn Contextarr into an agent runner, hosted vault, hidden network client, executable package runtime, or public marketplace before the trust model is mature.

## Trust Labels

- `local`: Created or maintained locally.
- `imported`: Brought in from a file, backup, importer, or registry flow.
- `scanned`: A scanner report exists for the current artifact hash.
- `policy_clean`: Passed current Contextarr policy with no known critical findings.
- `reviewed`: A human reviewed the artifact locally or through an approved registry process.
- `verified`: Signed, validated, scanned, reviewed, and approved by the relevant registry policy.
- `official`: Published by the Contextarr project or an approved official publisher.
- `deprecated`: Discouraged for new use but still inspectable.
- `blocked`: Not eligible for activation, export, or MCP exposure.
- `revoked`: Previously listed or verified, then revoked by policy, publisher, registry, or local user decision.

## Review Statuses

- `draft`
- `pending_review`
- `approved`
- `rejected`
- `blocked`
- `revoked`

## Registry Item Statuses

- `listed`
- `quarantined`
- `verified`
- `deprecated`
- `revoked`
- `blocked`

## Security Statuses

- `not_scanned`
- `scanning_failed`
- `policy_clean`
- `policy_warning`
- `critical_findings`
- `blocked`

## Registry Object Types

- `context_pack`
- `skill`
- `agent_kit`
- `export_profile`
- `validation_rule_set`
- `redaction_rule_set`
- `template`
- `demo_pack`
- `registry_policy`

## Public Registry Allowed Categories

1. Export profiles.
2. Redaction rule sets.
3. Validation rule sets.
4. Context Pack templates.
5. Agent Kit templates.
6. Official demo packs.
7. Public-safe documentation packs.
8. Non-executable Skills.
9. Public-safe Agent Kits using only public-safe Context Packs.
10. `llms.txt`, `AGENTS.md`, and `CLAUDE.md` export profiles.

## Public Registry Disallowed Categories

1. Executable packs.
2. Executable Skills.
3. Scripts.
4. Shell commands.
5. Browser automation.
6. Runtime plugins.
7. Hidden network fetches.
8. Remote instruction loading.
9. Credential prompts.
10. API keys.
11. Private keys.
12. Personal data packs.
13. Health, financial, child, or legal personal-data packs.
14. Scraped proprietary manuals.
15. Copyrighted third-party docs repackaged without permission.
16. Packs impersonating official vendors.
17. Packs with unclear or restricted license states unless explicitly marked and blocked from verified status.
18. Agent Kits that bundle private context.
19. Anything claiming Contextarr can execute actions.

## Activation Rule

Every imported registry item enters quarantine first. Only approved and activated content can be exported or exposed through MCP by default.

Activation is blocked by:

- critical scanner finding
- invalid schema
- signature mismatch
- revoked artifact
- missing required registry metadata
- blocked license state
- executable content
- hidden network or tool-execution claim

## Scanner Limitation

Contextarr can reduce risk with validation, scanners, signatures, revocation, encryption, quarantine, and review. It cannot prove that every possible downstream model, agent, or runtime will interpret natural-language content safely.
