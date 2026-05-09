# Contextarr PRD Addition: Encryption and Secrets Model

## 1. Purpose

Define how Contextarr handles encryption, secrets, sensitive briefs, export bundles, backups, and local key storage.

This document extends the PRD. It does not replace it.

## 2. Core Principle

Plain local files remain the default source of truth.

Encryption is used for sensitive derived artifacts, backups, local secrets, and optional high-sensitivity briefs.

Contextarr should not require full-vault encryption by default because it would weaken portability, search, rendering, Git workflows, Obsidian compatibility, and simple recovery.

## 3. Encryption Scope

Contextarr separates encryption decisions by artifact type instead of treating the whole vault as one security boundary.

1. Plain Context Pack files
   - Default state: plain local Markdown, JSON, and YAML.
   - Encryption posture: not encrypted by default.
   - Reason: these files are the portable, inspectable source of truth.
2. Derived SQLite index
   - Default state: local derived cache.
   - Encryption posture: not a required encrypted v1 architecture decision.
   - Reason: it can be deleted and rebuilt from validated pack files.
3. Export briefs
   - Default state: least-disclosure generated artifacts.
   - Encryption posture: plain by default unless the user chooses an encrypted export.
   - Reason: export safety depends first on review, redaction, validation, and profile selection.
4. Sensitive export bundles
   - Default state: optional high-sensitivity export path.
   - Encryption posture: may support envelope encryption.
   - Reason: contractor, legal, security, or private review bundles may need at-rest protection after redaction.
5. Backup archives
   - Default state: may be plain by default.
   - Encryption posture: must support encrypted archive export in the later backup/security phase.
   - Reason: backups can contain broad local project history and should have a user-chosen encryption option.
6. API/provider keys
   - Default state: never stored in Context Packs.
   - Encryption posture: use OS keychain or local credential manager.
   - Reason: secrets are runtime credentials, not pack content.
7. Local settings
   - Default state: local application configuration.
   - Encryption posture: plain unless a value is credential-like or explicitly secret-bearing.
   - Reason: non-secret settings should remain easy to inspect and recover.
8. Logs
   - Default state: local diagnostic artifacts.
   - Encryption posture: plain by default, with warnings where logs may contain sensitive filenames, pack identifiers, or local paths.
   - Reason: logs need reviewability, but should avoid secret values and unnecessary content capture.
9. MCP query logs
   - Default state: local diagnostic or audit artifacts if enabled.
   - Encryption posture: plain by default, with export warnings for sensitive prompts, filenames, or result snippets.
   - Reason: MCP activity can reveal intent and local context even when source content is not included.
10. Future team/private registry artifacts
    - Default state: future-only.
    - Encryption posture: evaluate per-artifact encryption, signed metadata, and access-control requirements later.
    - Reason: team/private registry behavior should not force hosted sync, hosted key management, or encrypted public registry assumptions into v1.

## 4. Default Rules

- Context Packs are plain Markdown, JSON, and YAML by default.
- SQLite is local derived state and can be deleted/rebuilt.
- Provider/API keys must never be stored in Context Packs.
- Provider/API keys should use OS keychain or local credential manager.
- Backups may be plain by default but must support encrypted archive export.
- Sensitive export bundles may use optional envelope encryption.
- Redaction remains required before export even when encryption is enabled.
- Encryption does not replace review, redaction, validation, or least-disclosure export.
- No hosted key management in v1.
- No telemetry.
- No automatic upload.

## 5. Recommended Tiers

Tier 0:
Plain Markdown/frontmatter packs.

Tier 1:
OS keychain for secrets.

Tier 2:
Encrypted backup archives.

Tier 3:
Encrypted sensitive briefs and export bundles.

Tier 4:
Optional per-pack encryption later.

Tier 5:
Hosted encrypted sync, rejected until a later business decision.

## 6. What Should Not Be Encrypted By Default

- All Context Pack source files
- All records
- All source maps
- Demo packs
- Validation reports unless user chooses encrypted export
- Static HTML render output unless user chooses encrypted archive
- SQLite database as a required default

## 7. What Should Support Optional Encryption

- Backup archives
- Export bundles
- Sensitive contractor briefs
- High-sensitivity review packages
- Local diagnostics bundles
- Future paid Studio project archives

## 8. Secrets Handling

Rules:

- No credentials in packs.
- No credentials in Skills.
- No credentials in Agent Kits.
- No credentials in exports unless explicitly included by user, which should warn or block by default.
- API keys should use OS keychain.
- `.env` files should be local only and excluded from packs, backups unless explicitly selected, and exports by default.
- Secret-like patterns should trigger validation or export warnings.

## 9. Backup Encryption

Encrypted backup archive requirements:

- User chooses encryption explicitly.
- User provides passphrase or local key.
- Passphrase is never stored in pack files.
- Restore validates all packs before activation.
- Restore does not bypass safety scans.
- Backup manifest includes algorithm metadata.
- Backup docs warn that losing the passphrase may make restore impossible.

## 10. Sensitive Brief Encryption

Sensitive brief/export bundle encryption requirements:

- Applies after redaction and validation.
- Does not allow draft or blocked content by default.
- Includes export metadata.
- Includes redaction summary.
- Includes validation summary.
- Uses envelope-style metadata so files can be identified without exposing content details where practical.

## 11. Future Optional Per-Pack Encryption

Per-pack encryption is later only.

Risks:

- breaks plain file readability
- weakens Git workflows
- complicates search
- complicates static rendering
- complicates MCP
- complicates imports
- complicates support

Allowed only after v1 if users strongly ask for it.

## 12. UI Requirements Later

Security or backup UI should show:

- what is encrypted
- what is plain
- where secrets are stored
- whether backups are encrypted
- whether exports are encrypted
- whether logs may include sensitive filenames
- how restore works
- passphrase warning
- redaction status before encryption

## 13. CLI Requirements Later

Future CLI examples:

```bash
contextarr backup --out ./backups/contextarr.zip
contextarr backup --encrypt --out ./backups/contextarr.enc.zip
contextarr restore ./backups/contextarr.enc.zip
contextarr export <pack-id> --profile contractor-redacted --encrypt --out ./exports/brief.enc.zip
```

## 14. Phase Placement

Do not implement in Phase 1 to Phase 3.

Planning only:

- Create this document now.

Implementation later:

- Phase 20 Security, Redaction, Backup, and Trust Hardening:
  - encrypted backup archive option
  - restore validation
  - key handling docs
- Later paid Studio:
  - better encryption UX
  - OS keychain integration
  - encrypted project archives
- Post-v1 only:
  - optional per-pack encryption
  - encrypted sync research

## 15. Non-Goals

This addition does not add:

- hosted cloud vault
- hosted sync
- managed key service
- full-vault encryption by default
- credentialed external connectors
- automatic upload
- telemetry
- encrypted public registry
- passphrase recovery service
- encryption as a replacement for redaction
- encryption as a replacement for validation

## 16. Success Criteria

This addition succeeds if:

- users know what is plain and what is encrypted
- Contextarr preserves plain local source files by default
- sensitive exports and backups can be encrypted later
- secrets are kept out of packs
- encryption does not break validation, rendering, export, or SQLite rebuildability
- no implementation leaks into Phase 1 to Phase 3
