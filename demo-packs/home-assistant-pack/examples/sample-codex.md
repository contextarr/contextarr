# Home Assistant Pack - Codex Sample Brief

Sample preview for target: Codex.
Pack ID: `home-assistant-pack`.

## Scope

Use the approved records to update docs, examples, tests, dashboard copy, or review notes that refer to this fictional pack. Keep changes inside the repository and do not operate on live services.

## Affected Records

- `home-assistant-pack.automation-map` - Automation Map
- `home-assistant-pack.backup-plan` - Backup Plan
- `home-assistant-pack.dashboard-conventions` - Dashboard Conventions
- `home-assistant-pack.device-groups` - Device Groups
- `home-assistant-pack.home-overview` - Home Overview
- `home-assistant-pack.maintenance-routine` - Maintenance Routine
- `home-assistant-pack.network-boundaries` - Network Boundaries
- `home-assistant-pack.privacy-rules` - Privacy Rules

## Constraints

- Preserve the pack's public-safe, source-backed, non-executable boundaries.
- Do not add credentials, real account identifiers, hostnames, personal data, executable scripts, shell commands, live URLs, or direct connector behavior.
- Do not claim third-party endorsement. Third-party names are identifiers only.
- Keep raw sources as source material and records as reviewed summaries.

## Forbidden Actions

- No deployments, releases, package publishing, registry work, marketplace work, telemetry, cloud sync, or agent runtime behavior.
- No mutation of real systems, accounts, networks, repositories, or local user files outside the requested repo scope.

## Acceptance Criteria

- Changes cite the record IDs used.
- Output stays consistent with the pack manifest, source map, rules, and export profiles.
- Any uncertainty is called out instead of invented.
- Human-readable HTML, exports, CLI/API use, Docker preview, and read-only MCP remain framed as Contextarr outputs, not agent execution.

## Validation Checks

- Run pack validation if records, sources, rules, or exports change.
- Re-run public-surface or site checks if launch-facing copy changes.
- Use security/scanner checks when editing boundaries, sources, or examples.

## Final Report Format

- Records used
- Files changed
- Validation checks run
- Safety notes
- Remaining questions
