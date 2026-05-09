# Private Registry Requirements

Status: Phase 28 research document.

This document describes requirements for a possible private team registry after Contextarr core v1.0 readiness. It does not implement a registry, API, UI, upload flow, package publish flow, hosted service, marketplace, or sync system.

See [private-registry-policy.md](private-registry-policy.md), [registry-trust-model.md](registry-trust-model.md), [registry-artifact-format.md](registry-artifact-format.md), [security-scanner.md](security-scanner.md), [quarantine-install-flow.md](quarantine-install-flow.md), and [revocation-model.md](revocation-model.md) for the expanded Registry Trust Foundation.

## v1.0 Gate

The draft v1.0 bridge PRD freezes further Skills and Agent Kit expansion, and any registry prototype, until Context Pack core v1.0 readiness is explicitly accepted or superseded by a decision record.

Phase 29 must not begin just because this document exists.

## Purpose

A private registry, if ever approved, would help a known team exchange validated Context Packs, Skills, and Agent Kits inside a controlled local or private environment.

It is not:

- A public marketplace.
- A hosted package index.
- A monetization surface.
- A discovery platform.
- An automatic installer.
- A trust substitute.
- An execution runtime.

## Minimum Requirements

A private registry prototype would need:

1. Disabled-by-default operation.
2. Local/private storage only.
3. API-token protection.
4. No anonymous uploads.
5. No public discovery.
6. Validation before quarantine.
7. Manual review before activation.
8. Checksums for stored objects.
9. Audit log entries for local registry actions.
10. Clear revocation and block states.

## Supported Object Types

A future prototype may store:

- Context Packs.
- Skills.
- Agent Kits.

Generated Export Briefs should not be treated as registry source material.

## Intake Flow

A safe registry intake flow should be:

1. Receive or copy object files into an inactive intake area.
2. Compute checksums.
3. Validate object structure.
4. Scan for blocked files and unsafe patterns.
5. Store validation report.
6. Place object in quarantine.
7. Require explicit local review before activation.

No step should execute files, fetch URLs, call AI APIs, install dependencies, or run user-provided commands.

## Activation Flow

Activation should require:

- Passing validation.
- No critical safety findings.
- Explicit user or team approval.
- Recorded trust level.
- Recorded review timestamp.

Activation must not edit source files to make them pass.

## Storage Requirements

The registry root should be local/private and ignored by Git.

Potential future default:

```text
private-registry/
```

The registry must not store secrets, real private demo data, dependency folders, local databases meant to be rebuildable, generated exports, or telemetry logs.

## Audit Log Requirements

Audit logs should contain metadata only:

- Action.
- Object type.
- Object id.
- Checksum.
- Validation status.
- Actor label if locally configured.
- Timestamp.
- Result.

Audit logs should not store raw pack bodies, Skill instructions, Agent Kit contents, private source text, or full prompt exports.

## Security Requirements

A future private registry must preserve these rules:

- No executable content.
- No script activation.
- No shell execution.
- No network fetch during validation.
- No managed AI calls.
- No telemetry.
- No public uploads.
- No anonymous access.
- No automatic trust inheritance.

A scanner is a gate, not a guarantee. Private registry artifacts still require quarantine, local re-scan, validation, and human review before activation.

## Phase 29 Entry Criteria

Phase 29 should remain blocked until:

1. Context Pack core v1.0 readiness is accepted or a decision record explicitly changes sequencing.
2. The trust model is accepted.
3. Private registry threat model is reviewed.
4. Quarantine behavior is designed.
5. Validation-before-activation remains mandatory.
6. Marketplace behavior remains explicitly out of scope.
