# Contextarr Export Prompt

Task: answer the pack-specific demo question for Product Line Pack.

Use only this scoped Contextarr export summary for pack fake-product-line-pack.

Sources:

- records/overview.md: Public-safe demo context for a fictional product line.
- records/operating-rules.md: Pack rules define which facts are safe for reuse and which boundaries require review.
- rules/redaction.yaml: Do not include private paths, credentials, secret values, account identifiers, or brand-endorsement claims.

Answer requirements:

- Cite source labels inline.
- Stay inside the task scope.
- Say when a detail is not present in the export.
- Exclude fake-sensitive categories.