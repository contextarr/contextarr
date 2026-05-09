# CLI Security Model

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating CLI modes, query commands, quarantine commands, or approved-only gates as shipped.

## 1. CLI does not execute pack content

Contextarr CLI reads, validates, indexes, renders, exports, queries, and reports on data-only pack content. It must not execute pack content.

## 2. CLI does not run shell commands from packs

Pack records, rules, manifests, export profiles, future Skills, future Agent Kits, and imported artifacts must not cause the CLI to run shell commands.

The validator may detect shell-like text as a security finding. Detection is not permission to execute it.

## 3. CLI does not run Skills

Skills are future non-executable instruction artifacts. Contextarr may validate, review, index, preview, pair, and export Skills in later phases. The CLI must not execute Skills.

## 4. CLI does not run Agent Kits

Agent Kits are future task-ready pairings of Context Packs and Skills. Contextarr prepares Agent Kits. It does not run them. The CLI must not become an Agent Kit runner.

## 5. CLI does not fetch remote content unless explicit future registry command is used

The CLI must not make hidden network calls. Future registry commands, if implemented, must be explicit, visible, documented, quarantine-first, and guarded by verification and revocation checks.

## 6. CLI redacts by default in agent mode

`--agent` defaults to redacted output. Agent-facing commands must assume least disclosure.

## 7. CLI excludes draft, unreviewed, blocked, and revoked content by default

Agent-facing and export-facing commands exclude:

- Draft content.
- Unreviewed content.
- Rejected content.
- Blocked content.
- Future revoked content.
- Invalid content.
- Imported drafts unless explicitly reviewed and approved.

## 8. Mutating commands require explicit command plus --yes

The CLI must separate read-only inspection from mutation. In non-interactive agent mode, mutating commands require an explicit mutating command and `--yes`.

Examples of mutating commands:

- `review mark-reviewed`.
- `review ignore`.
- `review reopen`.
- `quarantine activate`.
- `quarantine block`.
- `quarantine delete`.
- Future registry import activation.

## 9. Import commands use quarantine

Imports from untrusted local files, archives, future registry artifacts, future Skills, and future Agent Kits must enter quarantine or generated draft state before activation.

Import commands must not auto-activate. `--dry-run` must be available for safe inspection.

## 10. Export commands enforce redaction and review rules

Export commands must reuse shared export profile logic. They must enforce:

- Review status.
- Privacy mode.
- Redaction rules.
- Excluded tags.
- Export blockers.
- Target support.
- Output size limits.

Exports must not mutate pack files, fetch URLs, call AI APIs, upload data, execute pack content, or bypass redaction rules.

## 11. Query commands enforce approved-content-only rules

CLI query commands must use the same approved-content and redaction rules as API and MCP query surfaces. Draft, imported, blocked, revoked, invalid, and secret content must be excluded by default.

## 12. Output size limits prevent accidental dumping

Agent mode must bound output size. Commands should return summaries, result counts, and deterministic truncation or blocked errors rather than dumping entire private stores.

When output exceeds a configured limit, the command should exit with code 14 and a structured error.

## 13. Secrets must never be printed

Secrets must never be printed unless explicitly allowed by a future unsafe override. That unsafe override should not be implemented now.

Secret records, detected credential patterns, API tokens, private keys, and raw private source dumps must not appear in default CLI stdout, JSON output, logs, or diagnostics.

## Network visibility rule

The CLI never hides network calls. Current local commands should not fetch remote content. Future commands that need network access must use explicit command names, documented config, visible stderr diagnostics, and quarantine-first activation.
