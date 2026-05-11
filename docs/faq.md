# FAQ

## Is Contextarr Cloud Hosted?

No. The current product is local-first and self-hosted.

Public websites, docs, screenshots, download pages, and public-safe static demos can be hosted separately. The core app, pack storage, local SQLite index, imports, exports, and MCP surfaces stay local by default.

## Is SQLite The Source Of Truth?

No. SQLite is a derived, rebuildable index. Context Pack files are the source of truth.

## Can Contextarr Execute Skills Or Agent Kits?

No. Contextarr prepares, validates, previews, and exports data-only artifacts. It does not run agents, execute Skills, execute Agent Kits, run shell commands, or call tools.

## Can Contextarr Import Pre-Made Skills?

Current Skill importers can turn selected external inputs into private data-only Contextarr Native Skill drafts. They skip executable or script-like resources.

The intended future model is to preserve full External Skill Artifacts as untrusted originals, classify their risks, and optionally export compatible bundles with explicit warnings. Contextarr still will not execute them.

## Is Private Context Implemented?

Partly. Current privacy, redaction, draft/quarantine, `never_export`, and private MCP exclusion rules already protect sensitive content from default export and MCP paths.

The named Private Context UI, protected-pack unlock, app lock, and encrypted export/backup bundle flows are future work.

## Are Webhooks Planned?

Only as future app-level Local Event Hooks. Packs, Skills, Agent Kits, and MCP must not define or trigger webhooks.

## Can Contextarr Work With Vector Stores, Graph Databases, Or Graphify?

That is the intended future path through Derived Index Adapters, not a product pivot.

Contextarr should remain the canonical local context layer and produce redacted, source-mapped exports for external vector stores, graph databases, RAG tools, Graphify-style workflows, and agent runtimes. Those indexes are derived and rebuildable. Contextarr is not a vector database, graph engine, Graphify replacement, or managed RAG app.

See [derived-index-adapters.md](derived-index-adapters.md).

## Are Skills And Agent Kits Still Being Expanded?

No further Skills or Agent Kit expansion should happen until Context Pack core v1.0 readiness is explicitly accepted or superseded by a decision record.

## Is There A Marketplace?

No. Marketplace and public registry behavior are explicitly blocked.

## Can I Put Private Data In Demo Packs?

No. Committed demo packs and fixtures must remain fake and public-safe.

## How Do I Check The Core?

```bash
pnpm v1-core:verify
pnpm compatibility:verify
pnpm security:verify
```
