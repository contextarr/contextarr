# Contextarr CLI

Command line interface for local Contextarr tooling.

Implemented:

- `contextarr validate <path>`
- `--format text|json`
- child pack directory validation, such as `contextarr validate demo-packs`
- `contextarr render <path> --out <path>`
- `contextarr export <path> --profile <profile-id> --out <path>`
- `contextarr export <path> --all --out <path>`

The validator is read-only. Render and export commands write generated artifacts to the requested output folder and never mutate source pack files.
