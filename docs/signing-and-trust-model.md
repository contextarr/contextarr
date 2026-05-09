# Signing and Trust Model Research

Status: Phase 28 research document.

Contextarr is local-first and file-backed. This document researches a future trust model for Context Packs, Skills, and Agent Kits before any private registry prototype is considered.

This document is not an implementation plan for signing code, registry behavior, public marketplace behavior, package publishing, remote installation, or runtime execution.

## v1.0 Gate

The draft v1.0 bridge PRD keeps Context Packs as the core stabilization target. Further Skills or Agent Kit expansion and any registry prototype are frozen until Context Pack core v1.0 readiness is explicitly accepted or superseded by a decision record.

Phase 28 may define trust requirements. It must not implement registry behavior.

## Trust Goals

The future trust model should help a user answer:

1. What exact files am I reviewing?
2. Who claims authorship?
3. Has the content changed since review?
4. What validation report was produced?
5. What license, freshness, redaction, and export-readiness risks exist?
6. Can this object be quarantined before activation?
7. Can trust be revoked later?

## Trust Objects

The trust model should eventually apply to:

- Context Packs.
- Skills.
- Agent Kits.
- Export profiles.
- Source maps.
- Validation reports.
- Template-generated draft objects.

Export Briefs are generated artifacts. They may include provenance metadata, but they are not source of truth.

## Content Identity

A future trust system should use deterministic checksums over normalized file content.

Recommended research direction:

- Use a manifest-level content digest for the object.
- Use per-file digests for review and diagnostics.
- Exclude rebuildable local state such as SQLite files, generated exports, rendered HTML, caches, logs, and dependency folders.
- Include validation report metadata as an input to trust decisions, but do not treat a validation report as proof that content is safe.

Open questions:

- Whether newline normalization should be part of digesting.
- Whether file order should be lexical or manifest-defined.
- Whether generated docs inside a pack should be source files or ignored artifacts.

## Signatures

Signatures remain research-only for Phase 28.

A future signature model may include:

- A signed content digest.
- A signer identity.
- A signing timestamp.
- A validation report reference.
- Optional policy metadata, such as "reviewed for local use only."

Phase 28 must not add signing code, generated keys, production trust anchors, cryptographic verification libraries, or install flows.

## Author Identity

Future author identity should be explicit and non-automatic.

Possible identity fields:

- Author name.
- Author handle.
- Organization.
- Contact URL.
- Public key fingerprint.
- Review contact.

Identity fields must not create automatic trust. They are claims to review, not authorization.

## Trust Levels

Trust levels should remain conservative and human-readable:

- `unreviewed`: imported or newly created, not trusted for export or MCP exposure by default.
- `local_reviewed`: reviewed by the local user.
- `team_reviewed`: reviewed by an approved private team process.
- `blocked`: known unsafe or disallowed.
- `deprecated`: allowed for inspection, discouraged for active use.

Trust level changes should require an explicit local action. Contextarr should not infer trust from source location alone.

## Quarantine

Untrusted inbound content should enter quarantine before activation.

Quarantine expectations:

- Validate before making the object visible as active content.
- Preserve validation errors and warnings.
- Show blocked files and suspicious patterns.
- Prevent automatic export, MCP body exposure, template use, or kit inclusion until reviewed.
- Keep the original files readable for review.

Quarantine does not execute content and does not fetch remote resources.

## Revocation

A future trust model should support revocation without deleting local files.

Possible revocation signals:

- Blocked checksum.
- Blocked signer.
- Deprecated object version.
- License risk.
- Safety policy violation.
- User or team manual block.

Revoked content should stay inspectable but should not be export-ready or available for automatic inclusion.

## Validation Relationship

Validation and trust are related but separate.

Validation answers: "Does this object match Contextarr rules?"

Trust answers: "Should this user or team rely on this object?"

A valid object can still be untrusted. A trusted object can become blocked after new review findings.

## Safety Boundaries

The trust model must preserve these boundaries:

- No executable packs.
- No executable Skills.
- No Agent Kit runtime.
- No shell commands.
- No browser automation.
- No arbitrary scripts.
- No network fetching during validation or trust checks.
- No telemetry.
- No hosted cloud requirement.
- No public marketplace.
- No automatic activation of imported or registry-provided content.

## Future Decision Points

Before implementing signing or registry behavior, Contextarr needs explicit decisions on:

1. Whether checksums are enough for v1.0.
2. Whether signatures are needed before private team sharing.
3. Which identity format to support.
4. How local trust decisions are stored.
5. How revocation lists are represented.
6. Whether registry-like behavior is still blocked by the v1.0 bridge PRD.

