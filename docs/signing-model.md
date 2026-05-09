# Signing Model

Status: future architecture. No signing implementation, key generation, verification library, or trust network is added by this document.

Signing supports integrity and accountability. It does not prove content is safe.

## Required Future Concepts

1. Artifact hash.
2. Validation report hash.
3. Scanner report hash.
4. Publisher signature.
5. Registry signature.
6. Contextarr official signature for official packs.
7. Signature verification before import.
8. Signature verification before activation.
9. Signature mismatch forces block.
10. Unsigned artifact can only import as local unreviewed, never verified.

## Signing Inputs

A future signature should bind:

- artifact payload hash
- registry manifest hash
- validation report hash
- scanner report hash
- source map summary hash
- license report hash
- publisher id
- object type
- version
- compatible Contextarr versions

## Signature Roles

- Publisher signature: asserts publisher authorship over the artifact and attached reports.
- Registry signature: asserts the registry listed a specific artifact hash and review state.
- Official signature: asserts Contextarr official publication for official artifacts only.

## Verification Points

1. Before import.
2. Before decrypting an artifact payload when feasible.
3. Before local re-scan.
4. Before activation.
5. Before export or MCP exposure.

## Failure Behavior

- Signature mismatch: block.
- Missing signature for verified listing: block verified status.
- Unsigned local artifact: quarantine as `imported` and `pending_review`.
- Revoked key: mark affected artifacts `revoked` or `blocked` depending on policy.

## Non-Goals

- No signing code now.
- No production keys now.
- No remote trust network now.
- No public marketplace trust badges now.
- No claim that signing proves natural-language safety.
