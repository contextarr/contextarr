# Starter Context Packs And Object UI

This PRD addition defines curated local starter Context Packs and the Pack Library object UI needed to distinguish them from regular local or imported packs.

## Scope

- Starter packs are curated local examples that ship in this repository.
- Starter packs are not marketplace listings, public registry entries, remote installs, paid assets, endorsements, or live connectors.
- Third-party marks are identifiers only. They do not imply endorsement, partnership, official status, or source ownership.
- Context Packs remain the core knowledge object.
- Skills remain non-executable method objects.
- Agent Kits remain non-executable task-ready compositions.
- Export Briefs remain generated output, not source of truth.

## Manifest Metadata

Context Pack manifests may include:

- `starterPack?: boolean`
- `starterCategory?: string`
- `starterSortOrder?: number`

These fields are additive and do not replace existing brand metadata under `assets.brandId`, `assets.coverRecipe`, or `assets.logoVariant`.

## Approved Starter Set

The approved starter set contains exactly these 12 packs in deterministic order:

| Order | Pack | Brand ID | Category |
| --- | --- | --- | --- |
| 1 | OpenAI Prompt Engineering Pack | `openai` | `ai_prompting` |
| 2 | Claude Code Project Pack | `claude` | `ai_coding` |
| 3 | Google Workspace Pack | `google` | `productivity` |
| 4 | AWS Infrastructure Pack | `aws` | `cloud_infrastructure` |
| 5 | Jellyfin Media Server Pack | `jellyfin` | `self_hosted_media` |
| 6 | Docker Containers Pack | `docker` | `containers` |
| 7 | UniFi Network Pack | `unifi` | `networking` |
| 8 | VS Code Setup Pack | `vscode` | `development_environment` |
| 9 | GitHub Workflow Pack | `github` | `devops_collaboration` |
| 10 | Home Assistant Pack | `homeassistant` | `home_automation` |
| 11 | Tailscale VPN Pack | `tailscale` | `networking_security` |
| 12 | Obsidian Vault Pack | `obsidian` | `local_markdown_knowledge` |

## Quality Bar

Each starter pack must include 8 to 12 original public-safe records, all eight export targets, six sample outputs, and a source map using synthetic or locally authored source descriptions.

Starter packs must not contain copied third-party documentation, credentials, secrets, private hostnames, real private data, shell snippets, install hooks, or executable commands.

## UI And API

The local API supports `GET /api/packs`, `GET /api/packs?starter=true`, and `GET /api/packs?starterCategory=<category>`.

The Pack Library supports All Packs, Starter Packs, Local Packs, and Imported Packs.

The UI must not label third-party starter packs as `Official`. Brand cards can show third-party marks only as identifiers.

## Out Of Scope

Marketplace browsing, remote registry installation, creator accounts, payments, remote logo fetching, telemetry, agent execution, and live cloud/workspace/SaaS connectors are out of scope.
