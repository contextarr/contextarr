# Contextarr CLI

Command line interface for local Contextarr tooling.

Implemented:

- `contextarr validate <path>`
- `--format text|json`
- child pack directory validation, such as `contextarr validate demo-packs`
- `contextarr render <path> --out <path>`

The validator is read-only. The render command writes generated static HTML to the requested output folder and never mutates source pack files.
