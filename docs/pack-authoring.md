# Contextarr Pack Authoring

This guide is for making a first useful Contextarr pack: a small, local, data-only folder that captures context you would trust an assistant to read after review.

A good first pack is not a full knowledge base. Aim for 5 to 20 records around one job:

- a product or project overview
- a support workflow
- current known issues
- handoff notes for a team
- local setup and troubleshooting notes

Keep the first version boring and reviewable. Contextarr packs are local, non-executable data folders that can be validated, indexed, rendered, exported, and exposed through read-only MCP only after they are made active and meet exposure rules.

## Safety Boundaries

Preserve these boundaries while authoring:

- Keep pack files data-only.
- Do not include credentials, private keys, API tokens, recovery material, or live secrets.
- Do not add scripts, shell commands, auto-install steps, hidden actions, or executable resources.
- Keep `containsExecutableCode` and `requiresNetwork` set to `false` for v0 activation.
- Keep draft imports private, unreviewed, inactive, and tagged out of export until reviewed.
- Treat collector and importer output as drafts. Drafts are private, unreviewed, and excluded from export and MCP until reviewed and activated.
- Use fake, local-only, or public-safe data for examples that may be shared.
- Avoid absolute local paths in `sources/sources.yaml`; use relative labels or source notes when possible.

Drafts created by collectors and imports normally include `visibility: private`, `trustLevel: unreviewed`, record `privacy: private`, record `review_status: draft`, `imported_draft`, `never_export`, and unreviewed sources. That is intentional. Remove or change those values only as part of a deliberate review and activation pass.

## Required Shape

```text
my-pack/
  contextarr-pack.json
  README.md
  CHANGELOG.md
  LICENSE
  records/
  sources/sources.yaml
  exports/
  rules/validation.yaml
  rules/redaction.yaml
  rules/freshness.yaml
```

Records are Markdown files with frontmatter. Each record ID must be unique, must reference its pack ID, and should reference known sources from `sources/sources.yaml`.

Sources should include clear provenance. Source metadata can include optional license, hash, and freshness fields such as `license_status`, `content_hash`, `last_checked_at`, and `stale_after_days`. These fields are validated and indexed as derived readiness signals; Contextarr does not fetch source URLs or calculate hashes during validation.

## Choose A First-Pack Path

The adoption path is intentionally review-first:

1. Choose one starter path below.
2. Run the collector or local import to create a private draft.
3. Inspect the candidate in Draft Intake.
4. Prepare the activation plan and dry-run proof.
5. Activate only after human review.
6. Export a Codex or Claude brief from the active, reviewed pack.

Use one of these paths instead of starting from an empty directory by hand.

### 1. Blank Starter

Use this when the source material is still in your head or scattered across notes.

What it creates:

- one private overview record
- a valid draft pack scaffold
- draft-only review and export safeguards

Best first edit:

- Define the pack purpose, audience, source boundaries, and review checklist in `records/overview.md`.
- Add 2 to 5 more records only after the overview is clear.
- Add source entries as you add records, even if the source is a manual note.

Keep it inactive until the overview tells a reviewer what the pack is for, what data is allowed, and what should be excluded.

### 2. Markdown Folder

Use this when you already have a folder of `.md` or `.markdown` files.

Before running it:

- Move only the notes you want considered into a clean input folder.
- Remove secrets, customer-private details, raw logs, screenshots, and attachments.
- Split giant notes into focused files with clear titles.

After it writes a draft:

- Review each generated record title, tags, body, and source link.
- Delete noise records rather than trying to make everything fit.
- Keep records private and `review_status: draft` until a human has checked them.
- Keep `never_export` until the record is truly public-safe for the intended export profile.

### 3. Project Notes Collector

Use this for a local project folder with safe text-like notes such as Markdown, text, YAML, JSON, CSV, or logs.

This path is useful for turning messy project context into a review queue. It is not a code or secrets importer. Binary-looking files, common generated folders, unsupported files, oversized files, and attachments are skipped or warned about.

After it writes a draft:

- Treat warnings as part of the review packet.
- Convert raw notes into concise records with titles a future assistant can search.
- Replace machine-specific paths with human-readable source labels where possible.
- Remove stale notes, duplicate scratchpads, credentials, account identifiers, and private customer data before activation.

### 4. Support KB Starter

Use this when the first useful pack should help support, onboarding, or internal triage.

It starts with records for:

- known issues
- support workflow
- FAQ draft
- escalation notes

Make it useful by replacing placeholder text with:

- symptoms and workarounds
- escalation criteria
- customer-safe wording rules
- source-backed links to approved docs or tickets

Do not paste raw tickets, customer names, private account data, access tokens, or unreviewed incident logs. Keep examples fictional or public-safe.

### 5. Adapt A Starter Pack

Use this when an existing demo pack is close to what you need.

Do not edit a shared demo pack in place. Copy it into a draft or working pack folder, then change every identity field:

- `contextarr-pack.json`: `id`, `name`, `description`, `version`, `author`, `license`, `visibility`, `trustLevel`, timestamps, and safety fields.
- record frontmatter: `id`, `title`, `type`, `pack`, `tags`, `privacy`, `sources`, and `review_status`.
- `sources/sources.yaml`: source IDs, titles, paths, license status, freshness, and trust.
- export profiles: only keep profiles you intend to support after review.
- rules: align validation, redaction, and freshness rules to the new pack.

Keep the adapted pack private and unreviewed until every copied record has been replaced, verified, or deleted.

## Authoring Checklist

1. Pick one narrow audience and one job.
2. Create the draft using a collector or a copied starter.
3. Keep the pack local-only, data-only, and credential-free.
4. Review `contextarr-pack.json` for identity, trust, privacy, and safety declarations.
5. Review every record frontmatter block.
6. Confirm every record has at least one source.
7. Keep draft records private, unreviewed, and out of export until approved.
8. Run validation.
9. Hand the draft to Draft Intake for review, activation planning, and dry-run proof.
10. Activate only after review, then export a Codex or Claude brief from the active pack if the intended records meet review and exposure rules.

## Validate

```bash
pnpm --filter @contextarr/cli contextarr validate path/to/my-pack
pnpm --filter @contextarr/cli contextarr validate path/to/my-pack --json
```

Validation is read-only. It does not normalize files, execute scripts, fetch URLs, calculate source hashes, or rewrite pack content. JSON output uses `contextarr.validation-report.v1` for deterministic automation.

Avoid absolute local paths in `sources/sources.yaml`. The validator warns on them, and public API/export responses strip unsafe local paths rather than exposing workstation layout.

## Draft Intake Handoff

Collector output and other draft packs stay outside the active Pack Library until review. Use Draft Intake to inspect candidate metadata, validation summaries, scanner summaries, duplicate warnings, activation plans, dry-run proof, and local activation history.

Draft Intake activation is proof-gated and local. Review the candidate first, prepare the activation plan, generate dry-run proof, and apply activation only after the proof still matches the reviewed candidate. It does not approve content, publish content, generate exports, perform network access, or expose candidate records through MCP. Activation only moves or copies a reviewed candidate into the configured active packs root, records sanitized local evidence, and refreshes the derived local index.

After activation, exposure still depends on the pack and record review state, privacy, redaction, export profile readiness, and MCP/read-only exposure rules.

## Authoring Rules

- Use fake or public-safe data for public examples.
- Keep pack files data-only.
- Set `containsExecutableCode` and `requiresNetwork` to `false` for v0 activation.
- Do not include credentials, private keys, API tokens, recovery material, or real private data.
- Mark drafts and imports as private/unapproved until reviewed.
