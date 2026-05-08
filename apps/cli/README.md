# Contextarr CLI

Command line interface for local Contextarr tooling.

Implemented:

- `contextarr validate <path>`
- `contextarr validate-skill <path>`
- `contextarr validate-agent-kit <path>`
- `--format text|json`
- child object directory validation, such as `contextarr validate demo-packs`, `contextarr validate demo-skills`, or `contextarr validate-agent-kit demo-agent-kits`
- `contextarr render <path> --out <path>`
- `contextarr export <path> --profile <profile-id> --out <path>`
- `contextarr export <path> --all --out <path>`

Validation is read-only for Context Packs, Skills, and Agent Kits. Render and export commands write generated artifacts to the requested output folder and never mutate source files.
