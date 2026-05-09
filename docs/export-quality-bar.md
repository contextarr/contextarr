# Export Quality Bar

Status note: This document defines target requirements. Check [implementation-status.md](implementation-status.md) before treating any export target, flag, or gate as shipped.

## Why Exports Are The Product Proof

Exports are where Contextarr stops being a neat local database and becomes useful. If a power user would not prefer a Contextarr export over manually assembling a prompt, the product has not proven its core value.

Exports must be target-specific, deterministic, redaction-aware, source-backed, and concise enough to use directly.

## Minimum Target List

- ChatGPT.
- Claude.
- Codex.
- Claude Code.
- AGENTS.md.
- CLAUDE.md.
- llms.txt.
- Generic Markdown.
- JSON records.

Target requirement; not necessarily implemented in current code. Current supported targets are tracked in [implementation-status.md](implementation-status.md).

## Target-Specific Requirements

### Codex

Codex export must include:

- Task goal.
- Phase scope.
- Relevant context.
- Hard boundaries.
- Files likely involved.
- Commands to run.
- Tests to run.
- Acceptance criteria.
- Final report format.
- Explicit instruction to stop after requested phase.

### Claude

Claude export must include:

- Fuller context.
- Source-backed facts.
- Constraints.
- Do-not-assume section.
- Review status.
- Uncertainty and stale warnings.

### ChatGPT

ChatGPT export must include:

- Concise structured brief.
- Task context.
- Important facts.
- Constraints.
- Expected output.

### AGENTS.md And CLAUDE.md

AGENTS.md and CLAUDE.md outputs must be:

- Durable.
- Concise.
- Repo-specific.
- Not bloated with every record.
- Generated from approved pack content only.

### Generic Markdown

Generic Markdown exports must be human-readable, source-aware, and useful for copy/paste or static documentation.

### JSON Records

JSON exports must preserve stable record IDs, source references, review status, privacy state, freshness state, tags, and schema version.

### llms.txt

llms.txt output must be compact, public-safe by default, and focused on durable references rather than full private context dumps.

## Determinism Requirements

- Same pack, profile, privacy mode, and selected records must produce identical output.
- Records must be ordered by explicit profile order, then stable record ID if needed.
- Generated timestamps must be omitted unless the caller explicitly asks for them.
- JSON keys must be stable.
- Export warnings must be deterministic and sorted.

## Redaction Requirements

- Export profiles must honor privacy mode, excluded tags, redaction rules, and record review state.
- Secret, blocked, revoked, and restricted records must not export by default.
- Draft and imported records must not export by default.
- Redaction warnings must identify exact records, rules, and target profiles affected.
- Least-disclosure export is the default posture.

Target requirement; not necessarily implemented in current code. Approved-content-only export gating is a required completion gate, not a current global guarantee.

## Source Traceability Requirements

- Exports must include source summaries or source IDs where the target format allows.
- "Show why included" must be explainable from profile rules and record metadata.
- Export previews should link back to records and sources in UI phases that support it.
- Stale, unknown-license, and restricted-license sources must be visible in warnings.

## Token Estimate Requirements

- Each export preview should include estimated tokens or size.
- Warnings should appear before target limits are exceeded.
- Token estimates should not silently truncate content.
- Later export profiles may support deterministic pruning, but pruning rules must be visible.

## Export History Requirements

- Later phases should keep local export history metadata without storing secret content unnecessarily.
- History should record pack ID, profile ID, selected records, privacy mode, warnings, size, and content hash.
- Export history is local app state and not a hidden cloud sync surface.

## Export Diff Requirements

- Later phases should show differences between two generated exports from the same profile.
- Diffs should explain changes caused by record edits, source freshness, redaction changes, review status, or profile edits.
- Diff output should be local and should not require external AI.

## Acceptance Criteria

- Exports are successful only if a power user would prefer them over manually assembling a prompt.
- Each supported target has a purpose-built section order and wording.
- Approved content can export; draft, blocked, revoked, or restricted content is excluded by default.
- Export previews explain warnings before copy or download.
- CLI and UI outputs match for the same profile.
- Generated AGENTS.md and CLAUDE.md stay concise enough to live in a repo.
