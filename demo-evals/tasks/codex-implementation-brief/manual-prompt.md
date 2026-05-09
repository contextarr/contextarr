# Manual Prompt Baseline

Use this public-safe demo context:

- The fictional project separates apps, packages, docs, and fixtures.
- The agent should inspect files first, keep changes scoped, prefer existing patterns, verify locally, and report clearly.
- Development flow: inspect current state, make the smallest coherent change, add or update focused tests, run verification, and keep the handoff concise.
- Relevant checks can include typecheck, unit tests, fixture validation, and smoke checks.

Task: write a Codex-ready implementation brief for adding one small validation rule to a TypeScript project.
