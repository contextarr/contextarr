# Security Scanner

Status: future package design. `packages/security-scanner` is not implemented by this document.

The future security scanner is a deterministic local policy gate for Contextarr registry artifacts, imports, backups, and draft objects. It should help Contextarr block known bad patterns, suspicious instructions, executable files, credential requests, and policy violations before content is activated, exported, or exposed through MCP.

A scanner is a gate, not a guarantee.

## Future Package

Future package path:

```text
packages/security-scanner
```

Planned files if implementation is later approved:

```text
packages/security-scanner/
  package.json
  src/index.ts
  src/types.ts
  src/report.ts
  src/policies.ts
  src/index.test.ts
```

Do not add this package until a scoped implementation phase explicitly permits it.

## Scanner Scope

The scanner should eventually scan:

1. `contextarr-pack.json`
2. `contextarr-skill.json`
3. `contextarr-agent-kit.json`
4. Markdown records
5. Skill instructions
6. examples
7. export profiles
8. validation rules
9. redaction rules
10. freshness rules
11. `sources.yaml`
12. `README.md`
13. `CHANGELOG.md`
14. registry manifest
15. zip manifest
16. safe text files in allowed paths

The scanner must not parse binary assets for text patterns in early versions.

The scanner must block executable or script-like files unless explicitly allowed by a future signed policy. For v0 and v1, no executable content is allowed.

## SecurityScannerReportV1

```json
{
  "schemaVersion": "contextarr.security-scanner-report.v1",
  "artifactId": "string",
  "artifactType": "context_pack | skill | agent_kit | export_profile | validation_rule_set | redaction_rule_set | template",
  "artifactVersion": "string",
  "scannerVersion": "string",
  "status": "policy_clean | policy_warning | critical_findings | blocked | scanning_failed",
  "summary": {
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "info": 0,
    "secretHits": 0,
    "shellCommandHits": 0,
    "promptInjectionHits": 0,
    "hiddenInstructionHits": 0,
    "networkInstructionHits": 0,
    "executableFileHits": 0,
    "licenseWarnings": 0,
    "sourceWarnings": 0
  },
  "findings": [],
  "limitations": [],
  "recommendedAction": "activate | quarantine | review | block"
}
```

## Finding Fields

- `id`
- `code`
- `severity`
- `category`
- `file`
- `path`
- `line`, optional
- `message`
- `evidenceSnippet`, optional and redacted
- `recommendedAction`
- `blocking`
- `ruleId`
- `confidence`

## Finding Categories

- `secret`
- `credential_request`
- `shell_command`
- `executable_file`
- `script_file`
- `prompt_injection`
- `hidden_instruction`
- `network_instruction`
- `remote_instruction_loading`
- `obfuscation`
- `unicode_invisible_text`
- `source_license`
- `stale_source`
- `dependency`
- `unsafe_claim`
- `agent_kit_pairing`
- `review_status`
- `manifest_policy`
- `redaction`
- `unknown`

## Early Pattern Examples

Allowed future early scanner patterns may include:

- credential-like strings
- private key block markers
- curl pipe to shell
- wget pipe to shell
- ignore previous instructions
- do not tell the user
- secretly
- exfiltrate
- run this command
- chmod +x
- powershell encoded command
- base64 decode plus shell execution

These examples are not a comprehensive rule set.

## Scanner Limitations

1. Prompt injection cannot be perfectly solved by pattern matching.
2. LLM-assisted scanning may help but cannot prove safety.
3. Registry verification reduces risk, but local quarantine and human review remain required.
4. The safest policy is no executable content and read-only downstream exposure.
5. Contextarr verification does not imply downstream agent runtime safety.
