# Product Strategy

Status: idea harvest and product direction note. This document captures product ideas that should not be lost, but it does not supersede [implementation-status.md](implementation-status.md) for shipped behavior.

Build sequencing and idea intake live in [master-plan.md](master-plan.md).

## Category

The long-term category is:

```text
Contextarr is a local-first AI artifact gateway.
```

The public-alpha sentence stays narrower:

```text
Contextarr turns local files into validated, redaction-aware Context Packs you can export or serve through read-only MCP.
```

Use the wider category for roadmap and strategy. Use the narrower sentence when explaining the current product.

## Object Model

Contextarr should keep four first-class object types:

| Object | Meaning | Current status |
|---|---|---|
| Context Pack | Source-backed knowledge and constraints | Core |
| Skill | Reusable method and output procedure | Advanced preview |
| Agent Kit | Task-ready pairing of Context Packs and Skills | Advanced preview |
| Export Brief | Generated output for a target AI tool or human | Derived artifact |

The stable boundary remains:

```text
Contextarr prepares and serves artifacts.
Contextarr does not run agents, execute Skills, call tools, or perform actions.
```

## Harvested Ideas

| Idea | Disposition |
|---|---|
| Private Context | Keep. Add as a named product layer over private/protected packs and records, not as a separate personal memory vault. See [private-context.md](private-context.md). |
| Hosted Vercel/Netlify-style app | Split. Public website, docs, screenshots, downloads, and public-safe demos can be hosted. Core Contextarr stays local/self-hosted. |
| Private team registry with OAuth/OIDC | Later. Treat as a private Contextarr artifact registry for distribution, signing, access, revocation, and audit metadata. Do not turn the core app into a hosted vault. |
| Public registry | Later. Start with official and verified artifacts only, quarantine on pull, local validation before activation, no anonymous uploads, no auto-install, and no marketplace shortcut. |
| Marketplace | Maybe never. Only after registry trust, signing, revocation, abuse handling, license policy, and external user import/review behavior are proven. |
| MCP/API/CLI authority split | Keep. MCP remains read-only. API is local authenticated control. CLI is explicit local operator control. |
| Webhooks | Later, and app-level only. No pack-defined webhooks and no MCP webhooks. Use Local Event Hooks for metadata-only automation. See [local-event-hooks.md](local-event-hooks.md). |
| Skills as an organizer/server surface | Keep. Contextarr should organize, classify, preview, pair, export, and serve Skills without executing them. |
| External pre-made Skills | Keep, but as untrusted external artifacts. Preserve original folders later, classify risk, and export only with explicit compatibility warnings. See [external-skills.md](external-skills.md). |
| LiteLLM analogy | Useful internally. LiteLLM routes model access; Contextarr routes context, Skills, Agent Kits, and Export Briefs. Do not copy LiteLLM's execution-path role. |
| Adoption focus | Keep narrow. The next adoption win is still the smallest undeniable core loop: install, inspect starter packs, export useful briefs, query read-only MCP, and prove nothing executes. |

## Current Build Priority

Do now:

- Keep Context Pack core release gates healthy.
- Make public docs honest about Core Now versus Advanced Preview.
- Preserve the named future directions in docs so they can be resumed intentionally.
- Improve authoring, import review, exposure readiness, and export clarity around the current local loop.

Do not build now:

- Registry implementation.
- Marketplace implementation.
- Hosted core app.
- Runtime execution.
- Mutating MCP.
- Pack-defined hooks or webhooks.
- Full-vault encryption by default.

## Strategic Sequence

1. Local Context Pack core.
2. Strong exports, validation, redaction, health, and read-only MCP.
3. Private Context as a protected view over local artifacts.
4. External Skill artifact archive and compatibility reporting.
5. Saved Export Brief library and local evidence history.
6. Official starter ecosystem.
7. Private team registry.
8. Public verified registry.
9. Marketplace only if the trust model proves out.

## Adoption Test

The first public preview is working when a serious user can:

1. Clone and run Contextarr locally.
2. Understand a Context Pack from the dashboard.
3. Inspect source-backed records and health.
4. Export a useful ChatGPT, Claude, or Codex brief.
5. Query approved context through read-only MCP.
6. Create or import a local draft pack.
7. Trust that drafts, private records, and `never_export` content stay out of default exports and MCP.
