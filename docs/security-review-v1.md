# Context Pack v1 Security Review Gate

Context Pack v1 readiness is blocked until the Context Pack core can pass a repeatable local security review. This gate covers the current file-backed validator, local API, static web preview, export preview, Composer preview, read-only MCP, and verifier hygiene.

The gate is intentionally local-first. It does not introduce signing code, registry behavior, hosted services, telemetry, marketplace discovery, runtime execution, browser automation, shell execution, or AI API calls.

## Required Command

```bash
pnpm security:verify
```

`security:verify` runs the v1 core gate, focused validator abuse tests, API tests, MCP tests, and the documentation checker for this security review.

## Security Claims

- Context Pack files are source of truth; SQLite is derived and rebuildable.
- Pack validation is read-only and deterministic.
- Demo packs must validate with 0 errors and 0 warnings.
- Packs cannot declare executable code, command execution, or network access for v1 activation.
- Obvious executable/script files in packs are validation errors.
- Credential-like and API-key-like content in metadata or record bodies is rejected.
- Shell-command-like record content is rejected by validator scanning.
- Export profiles must honor privacy mode, `never_export`, and redaction rules.
- Local API mutation remains limited to explicitly scoped local draft flows already implemented before the v1 freeze; Context Pack core activation remains validation-first.
- API token auth protects non-health API routes when `CONTEXTARR_API_TOKEN` is set.
- MCP remains stdio-only, read-only, non-executing, and path-redacted.
- Verifier artifacts must be written under ignored cache/output roots and must not pollute default rescans.

## Test Mapping

| Abuse area | Current proof |
| --- | --- |
| Shell-command text in records | `packages/pack-validator/src/security-fixtures.test.ts` checks `shell-command-content-pack` for `scan.shell_command`. |
| Credential/API-key-like content | `packages/pack-validator/src/security-fixtures.test.ts` checks `secret-content-pack` for `scan.credential_pattern`. |
| Script and executable files | `packages/pack-validator/src/security-fixtures.test.ts` checks `executable-file-pack` for `pack.executable_file` and `pack.script_file`. |
| Unsafe manifest permissions | `packages/pack-validator/src/security-fixtures.test.ts` checks `invalid-permissions-pack` for `manifest.executable_code`, `manifest.requires_network`, `manifest.run_commands`, and `manifest.network_access`. |
| Over-export and redaction behavior | `packages/export-profiles/src/index.test.ts` covers profile-driven excludes, privacy modes, and redaction behavior. |
| Optional API token auth | `apps/server/src/api.test.ts` covers protected API behavior. |
| Local path leakage | `apps/mcp/src/tools.test.ts` covers MCP omission/redaction of local paths. |
| MCP mutation attempts | `apps/mcp/src/protocol.test.ts` and `apps/mcp/src/tools.test.ts` cover read-only tool exposure. |
| Broad API binding | `apps/server/src/config.test.ts` covers local default host behavior; Docker binding remains explicit launch-preview configuration. |
| Unsafe import artifacts | `pnpm v1-core:verify` removes legacy smoke output and checks clean rescans with no skipped packs, Skills, Agent Kits, or verifier-generated review items. |
| Backup/restore bypass | Not implemented in v1 core yet; must be designed before implementation and must validate before activation. |

## Pass Criteria

- `pnpm security:verify` passes.
- No new Phase 29 registry behavior exists.
- No signing implementation exists.
- No public marketplace behavior exists.
- No executable Skills, Agent Kits, or Context Packs are introduced.
- No real private data, secrets, generated exports, local databases, imported drafts, private registry roots, or dependency folders are committed.
