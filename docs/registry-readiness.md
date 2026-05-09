# Registry Readiness

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating registry artifacts, scanner gates, signing, revocation, or quarantine as shipped.

## Purpose

Contextarr can plan for safe sharing without implementing a marketplace. Registry readiness means the artifact format, trust checks, quarantine flow, scanner policy, signing, revocation, and human review rules are defined before public distribution exists.

This document exists because no dedicated registry trust model document currently exists.

## Registry Before Marketplace

A registry is an artifact distribution and verification lane. A marketplace is discovery, reputation, payments, creator identity, moderation, and public-scale abuse handling. Contextarr should design registry safety before any marketplace behavior.

## Trust Model Before Public Uploads

The trust model must define:

- Artifact types.
- Manifest metadata.
- Required source maps.
- License metadata.
- Signing and checksum strategy.
- Scanner policy.
- Review status.
- Revocation status.
- Quarantine behavior.
- Local re-scan behavior.

## Scanner Before Remote Install

Remote artifacts must not become active until the scanner exists and runs locally. Scanner findings are gates and warnings, not promises of perfect safety.

Required statement:

```text
A registry pass means the artifact passed the current Contextarr policy checks. It does not mean perfect safety.
```

Do not claim 100 percent safe. Do not claim guaranteed protection from prompt injection.

## Quarantine Before Activation

Every registry artifact enters quarantine. Quarantined artifacts are not active, exportable, or MCP-visible by default.

## Local Re-Scan Before Use

Registry metadata is not enough. Contextarr must validate and scan the downloaded artifact locally before activation.

## Human Review Before Export Or MCP Exposure

Activation is not the same as trust. Imported records, future Skills, and future Agent Kits remain draft or unreviewed until a human approves them for export or MCP exposure.

## Official Starter Gallery

An official starter gallery can come before a public marketplace if:

- Artifacts are authored or reviewed by maintainers.
- Demo content is fake or public-safe.
- Artifacts are non-executable.
- Local quarantine and validation still apply.
- The gallery does not imply arbitrary community uploads.

## Verified Registry Prototype

A verified registry prototype should require:

- Signed artifacts.
- Checksums.
- Scanner report.
- License metadata.
- Source map.
- Revocation list.
- Local re-scan.
- Human activation.
- Clear "verified means policy-passed, not perfectly safe" language.

## Private Team Registry

A private team registry can be considered before a public marketplace if real users need controlled internal distribution. It must be authenticated, private, non-executable, quarantine-first, and review-gated.

## Public Marketplace Gates

Public marketplace work is blocked until:

- Context Packs have adoption.
- Export quality is proven.
- Pack maintenance behavior is understood.
- Quarantine exists.
- Scanner exists.
- Signing and revocation exist.
- Moderation and abuse handling are scoped.
- Anonymous public uploads are rejected.
- No executable artifact support exists.

## Non-Goals

- No public marketplace now.
- No anonymous uploads.
- No remote install with auto-activation.
- No marketplace payments.
- No executable packs, Skills, or Agent Kits.
- No claim of perfect prompt-injection detection.
