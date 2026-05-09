# Quarantine Install Flow

Status: future architecture. No remote install, public registry, marketplace, or auto-activation is implemented by this document.

Every imported registry item enters quarantine first.

## Flow

1. User chooses registry item.
2. Contextarr downloads metadata first, not artifact.
3. User reviews listing, manifest, validation report, scanner report, source summary, license, trust labels, changelog.
4. User imports artifact.
5. Contextarr verifies registry signature and publisher signature.
6. Contextarr verifies artifact hash.
7. Contextarr decrypts artifact if authorized.
8. Contextarr rescans locally.
9. Contextarr validates locally.
10. Contextarr stores item in quarantine.
11. User previews rendered content.
12. User approves activation.
13. Only approved and activated content can be exported or exposed through MCP by default.

## Activation Rules

- critical scanner finding blocks activation
- invalid schema blocks activation
- signature mismatch blocks activation
- revoked artifact blocks activation
- missing license blocks verified status
- unknown license can allow local quarantine but not verified activation
- unreviewed artifact cannot be exposed through MCP by default
- unreviewed artifact cannot be included in exports by default

## Quarantine State

Quarantine preserves:

- original artifact metadata
- artifact hash
- validation report
- scanner report
- source map summary
- license report
- review decision
- revocation state

Quarantine must not execute files, fetch URLs, install dependencies, run scripts, call AI APIs, or activate content automatically.

## Local Re-Scan

Registry scanner output is not enough. Contextarr must locally re-scan before activation because policies, scanner versions, revocation state, and local trust decisions can change.

## Review Before Use

Human review is required before export or MCP exposure. Review means the user or approved team process explicitly accepts the artifact for the current workspace and intended use.
