# Google Workspace Pack Demo Eval

Pack id: google-workspace-pack
Pack slug: google-workspace-pack

This deterministic fixture compares three ways to answer the same public-safe, pack-specific demo question.

The fixture is intentionally synthetic. It proves that a no-context answer is generic, raw notes are noisy, and a Contextarr export is grounded, scoped, source-aware, and safer. It does not call an AI service and does not contain private data.

## Files

- no-context-prompt.md asks for an answer without pack context.
- raw-notes-prompt.md asks with uncurated notes.
- contextarr-export-prompt.md asks with scoped Contextarr-style export context.
- expected-facts.yaml lists facts that should appear in the grounded answer.
- sensitive-facts.yaml lists fake-sensitive categories that must stay out of sample answers.
- scoring-rubric.yaml defines deterministic fixture scoring.
- report.json and report.md record the expected score ordering.