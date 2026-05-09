# Scanner Policy

Status: policy draft for the deterministic security scanner and future registry scanning.

The scanner enforces Contextarr policy for local imports, registry artifacts, and quarantine activation. A scanner is a gate, not a guarantee.

The current local foundation is intentionally narrow: deterministic text scanning, executable/script file detection, manifest policy checks, and redacted findings. It does not call AI models, fetch networks, execute files, or parse binary assets.

## Policy Goals

1. Block known critical findings.
2. Flag suspicious content for review.
3. Enforce data-only artifacts.
4. Prevent executable packs and executable Skills.
5. Prevent credential prompts and secret-like content.
6. Prevent hidden network fetches and remote instruction loading.
7. Prevent claims that Contextarr runs tools, executes code, or performs actions.
8. Keep findings deterministic and reviewable.

## Hard Blocking Scanner Codes

- `scan.secret.api_key`
- `scan.secret.private_key`
- `scan.secret.token`
- `scan.credential_request`
- `scan.shell_command`
- `scan.shell_pipe_to_shell`
- `scan.executable_file`
- `scan.script_file`
- `scan.remote_instruction_loading`
- `scan.hidden_network_fetch`
- `scan.browser_automation_claim`
- `scan.tool_execution_claim`
- `scan.contextarr_execution_claim`
- `scan.ignore_previous_instructions`
- `scan.silent_or_secret_instruction`
- `scan.exfiltration_instruction`
- `scan.hidden_unicode`
- `scan.obfuscated_payload`
- `scan.manifest_executable_code`
- `scan.manifest_requires_network`
- `scan.manifest_run_commands`
- `scan.manifest_network_access`
- `scan.agent_kit_executable_claim`

## Warning Scanner Codes

- `scan.suspicious_authority_claim`
- `scan.suspicious_mismatch`
- `scan.license_unknown`
- `scan.license_restricted`
- `scan.source_stale`
- `scan.public_pack_sensitive_tag`
- `scan.unreviewed_dependency`
- `scan.deprecated_dependency`
- `scan.large_context_warning`
- `scan.redaction_hit_warn`

## Recommended Actions

- `activate`: Allowed only for policy-clean, reviewed, valid artifacts.
- `quarantine`: Default for imported or registry-provided artifacts.
- `review`: Required when warnings exist or trust metadata is incomplete.
- `block`: Required for critical findings, signature mismatch, revoked artifacts, executable content, or invalid schema.

## Determinism Requirements

Scanner output must be stable for the same files, policy version, scanner version, and current-date input. Findings should be sorted by file, line, code, and id.

## Evidence Handling

Evidence snippets must be optional and redacted. They must not expose full secrets, private keys, tokens, raw private data, or full hidden instructions.

## Policy Clean Language

Use these statuses:

- policy clean
- no known critical findings
- verified
- signed and verified
- registry approved
- passed current Contextarr security policy
- blocked
- quarantined
- revoked

Do not claim that scanner output proves an artifact is safe in all downstream contexts.
