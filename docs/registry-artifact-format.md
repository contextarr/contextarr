# Registry Artifact Format

Status: future architecture. No registry artifact build, upload, remote install, or public registry service exists today.

A registry artifact is a controlled distribution bundle for Contextarr objects. It is metadata first, artifact second. Registry artifacts are not trusted merely because they are listed.

## Bundle Layout

```text
registry-artifact/
  contextarr-registry-manifest.json
  artifact.zip.enc
  artifact.sha256
  validation-report.json
  scanner-report.json
  human-review.json
  signature.sig
  public-preview.html
  source-map-summary.json
  revocation.json
  license-report.json
```

`artifact.zip.enc` is an encrypted payload in hosted registry storage. Local-first Contextarr may inspect metadata before downloading or decrypting payloads.

## Manifest Fields

The registry manifest should include:

- `id`
- `objectType`
- `name`
- `version`
- `publisherId`
- `publisherDisplayName`
- `trustLevel`
- `reviewStatus`
- `securityStatus`
- `artifactHash`
- `validationReportHash`
- `scannerReportHash`
- `sourceMapHash`
- `scannerVersion`
- `schemaVersion`
- `signedAt`
- `reviewedAt`
- `expiresAt`, optional
- `revokedAt`, optional
- `revocationStatus`
- `compatibleContextarrVersions`
- `compatibleTargets`
- `license`
- `licenseStatus`
- `sourceCount`
- `recordCount` or `instructionCount`
- `dependencyIds`
- encryption metadata
- signature metadata

## Example Manifest

```json
{
  "schemaVersion": "contextarr.registry-manifest.v1",
  "id": "official.demo.ai-workstation-pack",
  "objectType": "context_pack",
  "name": "AI Workstation Pack",
  "version": "1.0.0",
  "publisherId": "contextarr-official",
  "publisherDisplayName": "Contextarr Project",
  "trustLevel": "official",
  "reviewStatus": "approved",
  "securityStatus": "policy_clean",
  "artifactHash": "sha256:4f8a7d7a5c2c6b1a9f3d1a0b9c8e7f6a5d4c3b2a190817161514131211100f0e",
  "validationReportHash": "sha256:8c5f11223344556677889900aabbccddeeff00112233445566778899aabbccdd",
  "scannerReportHash": "sha256:0f1e2d3c4b5a697887969594939291908f8e8d8c8b8a89888786858483828180",
  "sourceMapHash": "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "scannerVersion": "contextarr-security-scanner/0.1.0-policy-draft",
  "signedAt": "2026-05-09T00:00:00.000Z",
  "reviewedAt": "2026-05-09T00:00:00.000Z",
  "expiresAt": null,
  "revokedAt": null,
  "revocationStatus": "not_revoked",
  "compatibleContextarrVersions": ">=1.0.0 <2.0.0",
  "compatibleTargets": ["chatgpt", "claude", "codex", "generic_markdown", "read_only_mcp"],
  "license": "CC-BY-4.0",
  "licenseStatus": "known_permissive",
  "sourceCount": 5,
  "recordCount": 5,
  "instructionCount": null,
  "dependencyIds": [],
  "encryption": {
    "mode": "registry_at_rest",
    "algorithm": "age-or-equivalent-future-decision",
    "keyId": "registry-public-demo-key",
    "encryptedAt": "2026-05-09T00:00:00.000Z"
  },
  "signature": {
    "publisherSignature": "signature.sig",
    "registrySignature": "registry.signature.sig",
    "algorithm": "future-decision",
    "publicKeyId": "contextarr-official-demo-key"
  }
}
```

## Required Reports

Each registry artifact must reference:

1. A deterministic validation report.
2. A deterministic scanner report.
3. A human review report for verified or official status.
4. A license report.
5. A source map summary.
6. Revocation metadata.

## Trust Boundary

A signed and verified artifact means the artifact hash, validation report, scanner report, publisher identity, and registry review metadata match. It does not mean the artifact is safe in every downstream runtime.
