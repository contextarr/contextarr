# Revocation Model

Status: future architecture. No registry revocation service or network refresh implementation is added by this document.

Revocation marks an artifact, publisher, version, signature, or policy state as no longer acceptable for default activation, export, or MCP exposure.

## Rules

1. Registry can revoke artifact versions.
2. Local Contextarr keeps a revocation list snapshot when checked.
3. No hidden network checks by default in local-first mode.
4. User can manually refresh registry metadata.
5. Revoked artifacts remain local but are marked revoked and blocked from export/MCP by default.
6. User can override only through explicit unsafe override setting, but do not implement override yet.

## Revocation Reason Codes

- `malware`
- `prompt_injection`
- `credential_exposure`
- `license_violation`
- `impersonation`
- `stale_critical`
- `publisher_compromise`
- `policy_violation`
- `user_report_confirmed`

## Local Behavior

When a revocation is known locally:

- set registry item status to `revoked`
- set review status to `revoked`
- block activation by default
- block exports by default
- block MCP exposure by default
- preserve local files for review and recovery
- show reason code and source of revocation metadata

## Refresh Boundary

Contextarr must not perform hidden network checks. In local-first mode, revocation refresh is explicit user action or explicit registry sync behavior in a future scoped phase.

## Revocation Is Not Deletion

Revocation does not delete local files automatically. It changes default trust behavior and forces explicit review.
