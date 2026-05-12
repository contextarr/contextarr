# Context Pack Anatomy

Status: explanatory launch-proof doc.

A Context Pack is a local, source-backed folder that turns scattered notes into reviewed AI context. The pack folder is the source of truth; generated indexes, rendered HTML, validation reports, and exports are derived artifacts.

## Folder Anatomy

```text
contextarr-pack.json
records/
raw/
sources/sources.yaml
rules/
exports/
examples/
```

## Manifest

`contextarr-pack.json` identifies the pack and declares its metadata. It is where a reviewer should find the pack id, name, version, description, trust posture, starter-pack status when applicable, and export-facing summary fields.

The manifest should not contain secrets, private credentials, or executable instructions.

## Records

`records/*.md` files are the reviewed context the AI should receive. Records should be concise, source-backed, and explicit about boundaries. A good record can be rendered for a human, exported to a target AI profile, and traced back to a source entry.

Records are not scripts. Contextarr validates and exports them; it does not execute them.

## Raw Sources

`raw/` holds public-safe source material for demo packs or local source notes for private packs. Raw sources are useful during review, but they are not automatically safer than records. The launch proof should show why raw notes alone can still confuse a model.

## Source Map

`sources/sources.yaml` maps records back to source material. This is one of the trust receipts that separates a Contextarr export from a pasted prompt. The source map helps a reviewer ask, "Where did this claim come from?"

## Rules

`rules/` contains validation, redaction, freshness, and review rules. Rules make the pack reviewable before it becomes export-ready. They also document what should be excluded, warned on, or checked by a human.

## Exports

`exports/` defines target profiles. Current demo packs cover ChatGPT, Claude, Codex, Markdown, JSON records, AGENTS.md, CLAUDE.md, and llms.txt. A Contextarr export should carry approved records, source context, and target-specific formatting together.

## Examples

`examples/` contains sample outputs and fixtures. Examples are review aids, not a promise that every user pack will have identical output.

## Human-Readable HTML

Contextarr can render packs into human-readable HTML so a reviewer can inspect approved records outside the dashboard. This is important for launch proof because it makes the pack understandable before an AI receives it.

Example:

```bash
pnpm --filter @contextarr/cli contextarr render demo-packs/ai-workstation-pack --out rendered/launch-proof-ai-workstation
```

## AI Export

An AI export is a derived artifact for a target tool. It is not a public publish action and it does not prove model correctness by itself. It proves the model received structured, reviewed context instead of a blank prompt or raw notes.

Example:

```bash
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --profile codex
```

## Read-Only MCP

The read-only MCP surface lets a compatible client query approved context. It must not mutate pack files, run shell commands, execute records, call external services, or widen access to draft/private content.

Example:

```bash
pnpm contextarr-mcp
```

## Validation Report

Validation is the pack's first proof receipt. It checks schema, required files, sources, rules, export profile shape, and other deterministic pack expectations.

Example:

```bash
pnpm --filter @contextarr/cli contextarr validate demo-packs/ai-workstation-pack --json
```

A valid report does not mean the pack is perfect. It means the pack has passed the deterministic local checks that make human review and AI handoff safer.
