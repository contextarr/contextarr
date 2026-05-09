# Context Pack v1 Abuse Cases

This document lists abuse cases that Context Pack v1 must reject, warn about, or explicitly keep out of scope before the v1 bridge PRD can be considered ready.

## Blocked Or Rejected

- A pack declares `containsExecutableCode: true`.
- A pack declares `requiresNetwork: true`.
- A pack asks for `permissions.runCommands: true`.
- A pack asks for `permissions.networkAccess: true`.
- A pack includes `.exe`, `.bat`, `.cmd`, `.ps1`, `.sh`, `.js`, `.ts`, `.py`, or other obvious executable/script files as pack content.
- A manifest, source map, export profile, rules file, or record contains credential-like patterns such as API keys or private tokens.
- A record contains shell-command text that appears to ask an assistant to run commands.
- An export profile includes records tagged `secret`, `never_export`, or `imported_draft` without an explicit safe exclusion path.
- A generated verifier artifact appears under a default indexed root and creates skipped packs, skipped Skills, skipped Agent Kits, or review items during clean rescan.
- An MCP client tries to mutate packs, write files, execute Skills, execute Agent Kits, run shell commands, fetch URLs, or expose local filesystem paths.
- A backup restore attempts to activate packs automatically, overwrite active packs, skip checksum verification, skip validation, or write outside the requested quarantine output root.

## Warn Or Review

- Missing source license metadata.
- Unknown or risky source license metadata.
- Stale source metadata.
- Missing source hashes.
- Missing README or weak documentation.
- Redaction `warn` hits.
- Export profile readiness warnings.
- Draft or imported content that is not reviewed.

## Out Of Scope Until A Decision Record

- Context Pack collectors.
- Composer save-as-pack for Context Packs.
- Signing implementation.
- Private team registry prototype.
- Public marketplace.
- Hosted cloud sync.
- Remote installs or package publishing.

These items may be planned, but they must not be implemented by accident while v1 core stabilization is in progress.
