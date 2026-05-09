# Compatibility Policy

Status: v1.0 schema freeze candidate.

Compatibility work protects Context Pack users from surprise file-format breakage.

## Compatibility Targets

The v1 compatibility suite should cover:

- current demo packs
- valid minimal packs
- representative older valid packs
- warning-only packs
- blocking invalid packs
- deterministic validation reports

## Current Compatibility Gate

Run:

```bash
pnpm compatibility:verify
```

This gate validates current demo packs and compatibility fixtures against the v1 candidate behavior.

## Change Policy

Allowed without migration:

- new optional fields
- new derived API fields
- new docs
- stricter docs warnings when not blocking existing valid packs

Requires migration notes:

- new required fields
- changed enum values
- changed export target names
- changed validation report fields
- changed source metadata semantics

Blocked without explicit decision:

- executable pack behavior
- shell commands
- hidden network fetching
- marketplace or registry fields
- telemetry fields
- new product objects in Context Pack v1 scope

## Fixture Policy

Every compatibility-impacting change must add or update fixtures before the implementation is considered complete.

Fixture results should be deterministic with an injected fixed current date when stale-source rules are involved.

