# Trust and Provenance

Status note: Check [implementation-status.md](implementation-status.md) before treating trust artifacts, scanner reports, signing, revocation, quarantine, registry commands, or marketplace behavior as shipped.

## Purpose

The Trust and Provenance layer is a Good-to-Great planning addition for making Contextarr artifacts verifiable before they are shared, imported, activated, exported, or exposed to agents.

This document is docs-only. It does not implement hashing, lockfiles, provenance files, signing, revocation, registry commands, marketplace behavior, cloud services, or telemetry.

## Product Problem

Shared AI context artifacts are risky if users cannot inspect what they contain, where they came from, whether they changed, who reviewed them, whether they were scanned, and whether they were revoked.

Validation is necessary but not enough. Trust needs provenance.

## Trust Principles

- Provenance before registry.
- Quarantine before activation.
- Local re-validation before use.
- Human review before export or MCP exposure.
- Signatures later, after deterministic local reports are stable.
- Revocation later, before any public registry or marketplace.
- No perfect-safety claims.
- No executable artifact support.

## Future Trust Artifacts

Planned artifact types:

```text
contextarr-pack.lock
contextarr-provenance.json
contextarr-bom.json
validation-report.json
scanner-report.json
signature.sig
revocation.json
source-hashes.json
```

These files are planning concepts until explicitly implemented.

## Lockfile Concept

A future `contextarr-pack.lock` should freeze the exact manifest, records, sources, export profiles, rules, validation report, and scanner report used to generate or verify a pack.

Lockfiles should be deterministic and inspectable. They should not fetch remote data or activate content by themselves.

## Provenance Concept

A future `contextarr-provenance.json` should describe who authored, reviewed, generated, validated, signed, and exported an artifact.

Planned provenance fields include:

- Artifact ID.
- Artifact type.
- Version.
- Creator.
- Reviewer.
- Validator version.
- Scanner report reference, when scanner exists.
- Signature state, when signing exists.
- Source type.
- Trust level.
- Review status.

## Context BOM Concept

A future Context BOM is a bill of materials for a Contextarr artifact.

It should list:

- Manifest.
- Records.
- Sources.
- Export profiles.
- Rules.
- Assets.
- Dependencies.
- Licenses.
- Hashes.
- Review state.

## Signing and Revocation

Signing is later work. It should apply only after validation reports, scanner reports, pack hashes, source hashes, and BOM output are deterministic.

Future signable objects may include:

- Context Pack artifacts.
- Validation reports.
- Scanner reports.
- Export snapshots.
- Registry manifests.
- Context BOM files.

Revocation is also later work. Revocable objects may include registry artifact versions, publisher keys, official starter pack versions, verified template versions, and future Agent Kit template versions.

## Trust Labels

Future UI, CLI, and docs should clearly separate:

- Local: authored or maintained locally.
- Imported: brought in from another source and not yet trusted.
- Quarantined: present but inactive.
- Official: maintained by the Contextarr project.
- Verified: passed the current verification policy.
- Revoked: blocked by revocation state.

Verified must mean "passed the current Contextarr policy checks." It must not mean perfectly safe.

## Roadmap Placement

Good-to-Great trust phases are additive overlays:

- G10: Trust and Provenance design.
- G11: Source and pack hashes v0.
- G12: Lockfile and Context BOM v0.
- G13: Signed reports and provenance v0.

G11 through G13 must wait for explicit implementation scope. This G0 pass only documents the model.

## Non-Goals

Do not build in this pass:

- Pack hashing commands.
- Source hashing commands.
- Lockfile generation.
- Context BOM generation.
- Signing.
- Signature verification.
- Revocation lists.
- Public registry.
- Private registry.
- Marketplace payments.
- Anonymous uploads.
- Remote install with auto-activation.
- Hidden background revocation checks.
- Executable artifact support.

## Acceptance Criteria

This layer succeeds when future sharing can be evaluated through deterministic local evidence: validation status, source maps, hashes, scanner reports, provenance metadata, signatures, revocation state, quarantine status, and human review.
