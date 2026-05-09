# Private Registry Policy

Status: future policy. No private registry implementation is added by this document.

A private registry is likely the first commercial registry path, but it remains post-v1 unless explicitly approved by decision record.

## Purpose

Private registry supports controlled internal sharing of:

1. Context Packs.
2. Non-executable Skills.
3. Agent Kit templates.
4. Team-approved export profiles.
5. Validation and redaction rule sets.

## Requirements

1. Private registry supports internal Context Packs, Skills, Agent Kit templates, and team-approved exports.
2. Private registry still requires scanning, signing, validation, quarantine, and local activation.
3. Private registry may allow private data but must never make it public.
4. Client-side encryption or tenant-managed keys should be researched before implementation.
5. Private registry is post-v1 unless explicitly approved by decision record.

## Security Boundaries

- No public discovery by default.
- No anonymous uploads.
- No automatic activation.
- No executable content.
- No hidden network behavior.
- No shell commands.
- No browser automation.
- No Agent Kit runtime.
- No telemetry.

## Private Data

Private registry may handle private team data only inside private registry policy and access controls. Public registry policy must never allow private personal data packs.

## Activation

Every private registry import still enters quarantine first. Local re-scan, validation, signature verification, and human review are required before activation.
