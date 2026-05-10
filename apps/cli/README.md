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
- `contextarr rescan`
- `contextarr list [all|packs|skills|agent-kits]`
- `contextarr inspect <id> --kind auto|pack|record|skill|agent-kit`
- `contextarr health [id] --kind auto|summary|pack|skill|agent-kit`
- `contextarr review --status open|ignored|accepted|reviewed|resolved|all`
- `contextarr review-candidates --source-kind all|draft_pack|composed_pack|imported_pack|restored_quarantine|unknown --status all|ready_for_review|invalid|blocked|duplicate_active_id`
- `contextarr brief [id] --kind auto|summary|pack|skill|agent-kit`
- `contextarr query <query> --type all|pack|record|skill|agent-kit`

Validation is read-only for Context Packs, Skills, and Agent Kits. `review-candidates` is read-only and reports sanitized metadata for untrusted draft/composed/quarantine Context Pack folders without indexing, activating, exporting, or returning record bodies. Render and export commands write generated artifacts to the requested output folder and never mutate source files.
