# Private Context

Status: future product layer. Current Contextarr already has privacy fields, redacted exports, `never_export` tags, draft/quarantine gates, and private MCP exclusion defaults. This document names the product direction and records what still needs implementation.

## Product Line

```text
Private Context keeps sensitive context local, locked, reviewable, and export-safe.
```

Private Context is not a separate personal memory vault. It is a protected view and policy layer over Context Packs, records, Skills, Agent Kits, and Export Briefs.

## Current Primitives

Current repository behavior already supports part of the idea:

- Records and Skill documents have `privacy` values: `public_safe`, `internal`, `private`, `sensitive`, and `secret`.
- `secret`, `never_export`, `imported_draft`, and `ai_draft` content is excluded from default exposure paths.
- Redacted exports exclude private, internal, sensitive, secret, and redaction-tagged records by default.
- `CONTEXTARR_MCP_ALLOW_PRIVATE=false` is the MCP default.
- Draft, composed, imported, and restored quarantine content is not exposed through default export or MCP surfaces.
- `containsPersonalData` exists on Context Packs, Skills, and Agent Kits.

## Future Pack Modes

The UI should eventually expose simple modes:

| Mode | Meaning |
|---|---|
| Standard | Normal local artifact. |
| Private | Hidden from public-safe exports by default. |
| Protected | Requires unlock before view, export preview, API body access, or MCP private access. |
| Never Export | Visible locally but blocked from AI export unless the owner deliberately changes policy. |

These modes should compile down to explicit metadata and policy, not rely on UI labels alone.

Potential future metadata:

```yaml
privacy: private
privacy_class: sensitive
protected: true
unlock_required: true
export_default: redacted
mcp_access: denied
```

These fields are not part of the current v1 schema contract unless a later scoped phase adds them.

## UI Direction

Add a sidebar section named:

```text
Private Context
```

Do not use:

- Personal Info
- Personal Vault
- Memory Vault
- Life Vault

The section should filter private, sensitive, protected, and never-export artifacts without changing the underlying source-object model.

## Unlock And Storage Direction

Future protected mode should support:

- App lock for the local dashboard.
- Optional protected-pack unlock.
- Session timeout.
- OS keychain storage where practical.
- Passphrase fallback for Docker or CLI users.
- No raw private content in diagnostics.
- No raw MCP query or response logging.

Do not make full-vault encryption the default. Targeted protected artifacts, encrypted export bundles, encrypted backups, and clear unlock boundaries preserve search, rendering, Git workflows, and portability better than encrypting the whole working tree by default.

## Export Safety Check

Private Context should become visible in export preflight:

```text
Target: Codex
Privacy mode: Redacted
Private records included: 0
Sensitive records excluded: 7
Redaction warnings: 1
MCP access: denied for protected records
Output hash: available
```

This should be local metadata only. It must not upload diagnostics or export bodies.

## MCP Boundary

Protected records should not appear through MCP unless the user explicitly enables private MCP access and unlocks the relevant protected scope. Secret content should remain blocked even when private MCP access is enabled unless a later decision explicitly changes that rule.

## Phase Fit

- Now: document the named product layer and keep existing privacy/redaction gates healthy.
- Near term: add better Private Context filters, badges, and export-preflight counts.
- Later: app lock, protected-pack unlock, encrypted backup/export bundle support, restore safety checks.
- Post-v1: team policy and private registry interaction.

