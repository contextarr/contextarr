# Product Line Pack - Codex Sample Brief

Sample preview for target: Codex.
Pack ID: `fake-product-line-pack`.

## Scope

Use the approved records to update docs, examples, tests, dashboard copy, or review notes that refer to this fictional pack. Keep changes inside the repository and do not operate on live services.

## Affected Records

- `fake-product-line.buyer-guide` - Buyer Guide
- `fake-product-line.compatibility-requirements` - Compatibility Requirements
- `fake-product-line.model-comparison` - Model Comparison
- `fake-product-line.packaging-tiers` - Packaging Tiers
- `fake-product-line.product-overview` - Product Overview
- `fake-product-line.release-notes` - Release Notes
- `fake-product-line.sales-support-faq` - Sales and Support FAQ
- `fake-product-line.support-matrix` - Support Matrix

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
