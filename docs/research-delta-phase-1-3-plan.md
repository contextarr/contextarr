# Research Delta Phase 1-3 Plan

Status note: Check [implementation-status.md](implementation-status.md) before treating any research-driven target, command, export target, scanner, or schema change as shipped.

## 1. Executive Decision

This document converts the local competitive GitHub research into Phase 1 to Phase 3 execution guidance for Contextarr. The Contextarr PRD remains the source of truth. Research patterns are accepted only when they strengthen the PRD direction: local-first, source-backed, non-executable context packs with validation, redaction, export readiness, and rebuildable derived indexes.

No third-party code, README text, docs text, scanner logic, MCP handlers, redaction logic, export templates, or product copy should be copied into Contextarr. Research findings are pattern inputs only.

### Accepted Now

Accept these recommendations for Phase 1 to Phase 3 because they sharpen existing PRD work without changing the product boundary:

- Export-profile emphasis: make target-specific profiles visible in schemas, demo fixtures, validation, and API summaries even before the full Phase 7 export engine.
- `llms_txt` export profile target: add it as an allowed profile target and demo fixture, not as a full renderer in Phase 1 to Phase 3.
- `agents_md` and `claude_md` export profile targets: add as fixtures and schema targets for AI-assistant handoff conventions.
- Stale-source metadata: track source freshness with explicit stale metadata and warning counts.
- Redaction hit reporting: include deterministic redaction warning hits in validation reports.
- Source license risk: make missing, unknown, copyleft, and restricted source license states visible in validation and pack health.
- Trust labels and counts: surface warning counts for license risk, stale sources, redaction warnings, and export readiness.
- Docs-quality warnings: warn when a pack lacks basic authoring docs such as `README.md`.
- SQLite rebuild proof: Phase 3 must prove the derived index can be deleted and rebuilt from pack folders.
- Validation JSON schema versioning: emit deterministic machine-readable validation reports.
- Contextarr-specific demo examples: use fake local demo content only, with examples that show repo handoff, support handoff, redaction, source freshness, and license risk.

### Deferred

Defer these recommendations because they belong to later PRD phases or require a stronger trust model:

- MCP snippets: useful, but Phase 8 only.
- Import dry-runs: useful, but Phase 9 only.
- Obsidian plugin: useful later, but not before importer and CLI stability.
- Static HTML renderer beyond a local validation-report placeholder: Phase 5+.
- Private registry or integration watchlist: later only, after local pack format, validation, and exports prove value.
- Embeddings or vector search: later optional derived index only; not Phase 1 to Phase 3.
- Cursor export target: defer until the Phase 7 export engine unless an existing implementation already supports it.

### Rejected For Phase 1 To Phase 3

Reject these outright for Phase 1 to Phase 3 because they violate the PRD or the research safety boundaries:

- Hosted cloud or hosted personal memory vault.
- Public marketplace, public registry, auto-publish, or public GEO pack hosting.
- Executable pack hooks, shell commands inside packs, install hooks, scripts, or network fetch hooks.
- Agent runtime features.
- Mutating MCP or MCP implementation of any kind.
- Generic chat UI.
- Embeddings, vector database, or generic RAG identity.
- Maintainer email or personal-profile harvesting.
- Third-party README-derived public docs.
- Third-party scanner logic, redaction logic, MCP handlers, export templates, or product copy.
- Skills and Agent Kits.

## 2. Phase 1 Delta: Pack Schema And Validator

Phase 1 remains Pack Schema and Validator. The research delta adds stronger provenance, license, freshness, redaction, export readiness, and deterministic report surfaces.

### Source Schema Additions

Extend each source in `sources/sources.yaml` with these optional fields. Source files may provide `license`, `license_url`, and an optional `license_status` hint, but the validator must derive and normalize the effective license status.

```ts
type SourceLicenseStatus =
  | "known_permissive"
  | "known_copyleft"
  | "known_restricted"
  | "unknown"
  | "not_applicable";

interface Source {
  id: string;
  type: string;
  title: string;
  url?: string;
  path?: string;
  retrieved_at?: string;
  license?: string;
  license_url?: string;
  license_status?: SourceLicenseStatus;
  license_notes?: string;
  content_hash_algorithm?: "sha256";
  content_hash?: string;
  hash_calculated_at?: string;
  last_checked_at?: string;
  stale_after_days?: number;
  stale_reason?: string;
  trust?: string;
  status?: string;
}
```

Rules:

- `license_status` in source files is only a hint. The validator normalizes it from `license`, `license_url`, and the optional hint before reporting or indexing it.
- The effective normalized `license_status` defaults to `unknown` when `license` is absent and `type` is not clearly manual/private.
- `known_permissive` is valid for common permissive labels such as `MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `CC0-1.0`, and equivalent fake demo labels.
- `known_copyleft` warns for labels including `GPL`, `AGPL`, `LGPL`, and equivalent fake demo labels.
- `known_restricted` warns for noncommercial, no-derivatives, proprietary, or unknown commercial-use labels.
- `not_applicable` is allowed for manual notes, synthetic demo notes, or internal-only sources where no external license applies.
- `content_hash_algorithm` is only `sha256` in Phase 1 to Phase 3.
- `content_hash`, when present, must be lowercase hex SHA-256.
- `hash_calculated_at`, `last_checked_at`, and `retrieved_at` must be offset-aware ISO datetimes.
- `stale_after_days` must be a positive integer.

### Export Profile Target Additions

Define the export target enum exactly:

```ts
type ExportProfileTarget =
  | "chatgpt"
  | "claude"
  | "codex"
  | "generic_markdown"
  | "json"
  | "agents_md"
  | "claude_md"
  | "llms_txt";
```

Rules:

- `target` must be one of the enum values above.
- `format` remains constrained to existing formats, with Phase 1 to Phase 3 expected mappings:
  - `chatgpt`: `markdown`
  - `claude`: `markdown`
  - `codex`: `markdown`
  - `generic_markdown`: `markdown`
  - `json`: `json`
  - `agents_md`: `markdown`
  - `claude_md`: `markdown`
  - `llms_txt`: `text`
- This phase validates profile shape only. It does not implement the Phase 7 export engine.

### Validation Report Schema

Add a deterministic machine-readable validation report shape:

```ts
interface ValidationReportV1 {
  schemaVersion: "contextarr.validation-report.v1";
  packPath: string;
  packId: string | null;
  valid: boolean;
  validationStatus: "valid" | "valid_with_warnings" | "invalid";
  summary: {
    errors: number;
    warnings: number;
    infos: number;
    redactionHits: number;
    exportProfilesReady: number;
    exportProfilesWithWarnings: number;
    exportProfilesBlocked: number;
    staleSources: number;
    licenseWarnings: number;
    licenseMissing: number;
    licenseUnknown: number;
    licenseRisks: number;
    docsWarnings: number;
  };
  issues: ValidationIssue[];
  redactionHits: RedactionHit[];
  exportReadiness: ExportReadinessReport;
}

interface RedactionHit {
  code: "redaction.hit_warn";
  severity: "warning";
  file: string;
  pattern: string;
  action: "warn";
  matchCount: number;
  recordId?: string;
}

interface ExportReadinessReport {
  status: "ready" | "ready_with_warnings" | "blocked";
  profiles: Array<{
    id: string;
    target: ExportProfileTarget | string;
    format: string;
    status: "ready" | "ready_with_warnings" | "blocked";
    blockingIssueCodes: string[];
    warningIssueCodes: string[];
  }>;
}
```

Determinism rules:

- Sort issues by severity rank, code, file, path, then message.
- Sort `redactionHits` by file, pattern, then record ID.
- Sort export readiness profiles by profile ID.
- Keep stable object keys in JSON output.
- Do not include runtime timestamps in the deterministic report unless a caller explicitly injects a timestamp outside the report object.
- Stale-source checks must accept an injected fixed current datetime. Tests must never depend on wall-clock time.

### Scanner Scope

Limit Phase 1 scanner parsing to:

- `contextarr-pack.json`.
- `sources/sources.yaml`.
- Files under `rules/`.
- Files under `exports/`.
- Root `README.md` and `CHANGELOG.md`.
- Markdown record files under the configured records directory.

Binary assets are not parsed for text patterns. Safe static assets such as cover images may be present, but executable or script-like files remain blocked unless a later PRD phase explicitly defines a safe allowlist.

### Validator Warnings

Add warning issues:

- `docs.readme_missing`: pack root lacks `README.md`.
- `docs.readme_minimal`: README exists but is empty or below a small minimum useful-content threshold.
- `source.license_missing`: source lacks `license` and has no usable license-status hint.
- `source.license_unknown`: normalized license status is `unknown`.
- `source.license_risk`: normalized license status is `known_copyleft` or `known_restricted`.
- `source.stale`: source has `status: stale`, expired `stale_after_days`, or a populated `stale_reason`.
- `redaction.hit_warn`: redaction rule with `action: warn` matched scannable text.
- `export_profile.readiness_warning`: export profile is structurally valid but includes warning-state records, redaction hits, stale sources, or license-risk sources.

### Validator Errors

Keep or add blocking error issues:

- `scan.credential_pattern`: obvious API key, token, password, or private-key pattern.
- `scan.shell_command`: obvious shell command pattern.
- `pack.executable_file`: executable or binary payload file.
- `pack.script_file`: script file in pack content.
- `manifest.executable_code`: `containsExecutableCode` is not false.
- `manifest.requires_network`: `requiresNetwork` is not false.
- `manifest.run_commands`: `permissions.runCommands` is not false.
- `manifest.network_access`: `permissions.networkAccess` is not false.
- `export_profile.schema`: export profile is invalid, including unsupported target.

### CLI JSON Output

The CLI must support:

```text
contextarr validate <path> --json
```

Rules:

- `--json` emits the deterministic `ValidationReportV1`.
- Existing human-readable validation output may remain the default.
- If an existing `--format json` path exists, keep it as a compatibility alias, but `--json` is required.

## 3. Phase 1 Tests

Add exact tests for the schema and validator:

- Valid pack passes:
  - Fixture: `valid-minimal-pack`.
  - Expect `valid=true`, `summary.errors=0`, and `validationStatus="valid"` or `"valid_with_warnings"` only if the fixture intentionally includes warnings.
- Missing README warns:
  - Fixture: `missing-readme-pack`.
  - Expect `valid=true`, one `docs.readme_missing` warning, and `summary.docsWarnings=1`.
- Missing source license warns:
  - Fixture: `missing-source-license-pack`.
  - Expect `valid=true`, one `source.license_missing` warning, `summary.licenseMissing=1`, and `summary.licenseWarnings=1`.
- Unknown license warns:
  - Fixture: `unknown-source-license-pack`.
  - Expect `valid=true`, one `source.license_unknown` warning, `summary.licenseUnknown=1`, and `summary.licenseWarnings=1`.
- Copyleft license warns:
  - Fixture: `copyleft-source-license-pack`.
  - Expect `valid=true`, one `source.license_risk` warning, normalized source `license_status="known_copyleft"`, `summary.licenseRisks=1`, and `summary.licenseWarnings=1`.
- Secret-like value blocks:
  - Fixture: `secret-content-pack`.
  - Expect `valid=false`, `scan.credential_pattern`, and `summary.errors > 0`.
- Shell command pattern blocks:
  - Fixture: `shell-command-content-pack`.
  - Expect `valid=false` and `scan.shell_command`.
- Executable file blocks:
  - Fixture: `executable-file-pack`.
  - Expect `valid=false` and `pack.executable_file` or `pack.script_file`.
- Invalid export profile blocks:
  - Fixture: `invalid-export-profile-pack`.
  - Expect `valid=false` and `export_profile.schema`.
- Redaction hit appears in report:
  - Fixture: `redaction-warning-pack`.
  - Include `rules/redaction.yaml` with a fake `action: warn` pattern and fake matching content.
  - Expect `valid=true`, `redaction.hit_warn`, one `redactionHits` entry, and `summary.redactionHits=1`.
- Validation JSON schema is deterministic:
  - Run validation twice against the deterministic fixture set.
  - Expect deep equality of the report objects after normalizing absolute `packPath` if needed.
  - Inject the same fixed current datetime for both runs.

## 4. Phase 2 Delta: Demo Packs

Phase 2 remains Demo Packs. The research delta makes demo packs prove export readiness, source licensing, stale-source handling, redaction warnings, and assistant handoff targets using fake public-safe content only.

### Demo Pack Requirements

For each of the five existing demo packs:

- Keep the current fake content, records, source count, and source-backed posture.
- Add `exports/agents-md.yaml`.
- Add `exports/claude-md.yaml`.
- Add `exports/llms-txt.yaml`.
- Normalize current generic Markdown profile target to `generic_markdown`.
- Normalize current JSON records profile target to `json`.
- Keep `chatgpt`, `claude`, and `codex` profiles.
- Add `examples/sample-agents-md.md`.
- Add `examples/sample-claude-md.md`.
- Add `examples/sample-llms-txt.txt`.
- Ensure examples use only original Contextarr demo content or newly written fake Contextarr demo content.
- Add source license examples:
  - At least one `known_permissive` source in every demo pack.
  - At least one synthetic `not_applicable` source across the demo pack set.
  - License-risk examples only in fixture packs, not clean public-safe demo packs.

Expected clean demo profile targets per pack:

```text
chatgpt
claude
codex
generic_markdown
json
agents_md
claude_md
llms_txt
```

### Validator Fixture Packs

Add or update fixture packs under validator test fixtures:

- `valid-minimal-pack`: deterministic clean valid pack.
- `missing-readme-pack`: valid pack with only `docs.readme_missing`.
- `missing-source-license-pack`: valid pack with only `source.license_missing`.
- `unknown-source-license-pack`: valid pack with only `source.license_unknown`.
- `copyleft-source-license-pack`: valid pack with only `source.license_risk`.
- `stale-source-pack`: valid pack with only `source.stale`.
- `redaction-warning-pack`: valid pack with one `redaction.hit_warn`.
- `shell-command-content-pack`: invalid pack with `scan.shell_command`.
- `executable-file-pack`: invalid pack with `pack.executable_file` or `pack.script_file`.
- `invalid-export-profile-pack`: invalid pack with `export_profile.schema`.
- `deterministic-validation-pack`: clean or warning-stable pack used for repeat JSON equality tests.

## 5. Phase 2 Tests

Add exact validation expectations:

- Five demo packs:
  - `valid=true`.
  - `summary.errors=0`.
  - `summary.warnings=0`.
  - Record counts remain unchanged from current demo content.
  - Source counts remain unchanged from current demo content.
  - Export profile count increases by three per pack, from 5 to 8.
  - Profile targets exactly match the expected clean demo target set.
- Missing README fixture:
  - `valid=true`.
  - Exactly one warning code: `docs.readme_missing`.
- Missing source license fixture:
  - `valid=true`.
  - Exactly one warning code: `source.license_missing`.
- Unknown source license fixture:
  - `valid=true`.
  - Exactly one warning code: `source.license_unknown`.
- Copyleft source license fixture:
  - `valid=true`.
  - Exactly one warning code: `source.license_risk`.
  - `summary.licenseRisks=1`.
  - `summary.licenseWarnings=1`.
- Stale source fixture:
  - `valid=true`.
  - Exactly one warning code: `source.stale`.
  - `summary.staleSources=1`.
  - Test injects a fixed current datetime; no stale expectation depends on wall-clock time.
- Redaction warning fixture:
  - `valid=true`.
  - Exactly one warning code: `redaction.hit_warn`.
  - One `redactionHits` entry.
  - `summary.redactionHits=1`.
- Shell command fixture:
  - `valid=false`.
  - Contains `scan.shell_command`.
- Executable fixture:
  - `valid=false`.
  - Contains `pack.executable_file` or `pack.script_file`.
- Invalid export profile fixture:
  - `valid=false`.
  - Contains `export_profile.schema`.
- Deterministic validation fixture:
  - Two repeated validation JSON reports compare equal.

## 6. Phase 3 Delta: Local Index And API

Phase 3 remains Local Index and API. The research delta adds derived fields and response shapes that expose validation, export readiness, redaction, stale-source, and license-risk state.

### SQLite Derived-Index Additions

Add derived fields. Do not make SQLite source of truth.

In `sources`:

- `license_status TEXT NOT NULL DEFAULT 'unknown'`
- `license_url TEXT`
- `license_notes TEXT`
- `content_hash_algorithm TEXT`
- `content_hash TEXT`
- `hash_calculated_at TEXT`
- `last_checked_at TEXT`
- `stale_after_days INTEGER`
- `stale_reason TEXT`

In `packs`:

- `validation_status TEXT NOT NULL`
- `export_readiness TEXT NOT NULL`
- `redaction_warning_count INTEGER NOT NULL DEFAULT 0`
- `stale_source_count INTEGER NOT NULL DEFAULT 0`
- `license_warning_count INTEGER NOT NULL DEFAULT 0`
- `license_missing_count INTEGER NOT NULL DEFAULT 0`
- `license_unknown_count INTEGER NOT NULL DEFAULT 0`
- `license_risk_count INTEGER NOT NULL DEFAULT 0`

In `pack_health`:

- `validation_status TEXT NOT NULL`
- `export_readiness TEXT NOT NULL`
- `redaction_warning_count INTEGER NOT NULL DEFAULT 0`
- `stale_source_count INTEGER NOT NULL DEFAULT 0`
- `license_warning_count INTEGER NOT NULL DEFAULT 0`
- `license_missing_count INTEGER NOT NULL DEFAULT 0`
- `license_unknown_count INTEGER NOT NULL DEFAULT 0`
- `license_risk_count INTEGER NOT NULL DEFAULT 0`

Rules:

- Invalid packs do not activate or index into `packs`.
- Skipped invalid packs remain visible only through skipped results and review metadata.
- Warning packs index normally with `validation_status="valid_with_warnings"`.
- Search indexes only records from valid indexed packs where `review_status="approved"`.
- Deleting the configured Contextarr SQLite database file, normally `./data/contextarr.db` via `CONTEXTARR_DATABASE_PATH`, and rebuilding from pack folders must recreate equivalent derived pack/source/record/profile rows, excluding event timestamps and mutable review-item statuses.

## 7. Phase 3 API Contract Additions

Add fields without removing existing response fields.

### `GET /api/packs`

Response:

```ts
{
  packs: Array<{
    id: string;
    name: string;
    version: string;
    description: string;
    type: string;
    visibility: string;
    trustLevel: string;
    healthScore: number;
    healthStatus: string;
    validationStatus: "valid" | "valid_with_warnings" | "invalid";
    exportReadiness: "ready" | "ready_with_warnings" | "blocked";
    validationErrors: number;
    validationWarnings: number;
    redactionWarningCount: number;
    staleSourceCount: number;
    licenseWarningCount: number;
    licenseMissingCount: number;
    licenseUnknownCount: number;
    licenseRiskCount: number;
    recordCount: number;
    sourceCount: number;
    exportProfileCount: number;
    reviewQueueCount: number;
    lastReviewedAt: string | null;
    updatedAt: string;
  }>;
}
```

### `GET /api/packs/:id`

Response additions:

```ts
{
  validation: {
    status: "valid" | "valid_with_warnings" | "invalid";
    errors: number;
    warnings: number;
    redactionWarningCount: number;
    staleSourceCount: number;
    licenseWarningCount: number;
    licenseMissingCount: number;
    licenseUnknownCount: number;
    licenseRiskCount: number;
  };
  exportReadiness: {
    status: "ready" | "ready_with_warnings" | "blocked";
    profilesReady: number;
    profilesWithWarnings: number;
    profilesBlocked: number;
    profiles: Array<{
      id: string;
      target: string;
      format: string;
      status: "ready" | "ready_with_warnings" | "blocked";
      warningIssueCodes: string[];
      blockingIssueCodes: string[];
    }>;
  };
  sources: Array<{
    id: string;
    type: string;
    title: string;
    url?: string;
    path?: string;
    retrievedAt?: string;
    license?: string;
    licenseStatus: string;
    licenseUrl?: string;
    licenseNotes?: string;
    contentHashAlgorithm?: string;
    contentHash?: string;
    hashCalculatedAt?: string;
    lastCheckedAt?: string;
    staleAfterDays?: number;
    staleReason?: string;
    trust?: string;
    status?: string;
  }>;
}
```

### `GET /api/packs/:id/records`

Each record summary includes:

```ts
{
  id: string;
  packId: string;
  title: string;
  type: string;
  confidence: string;
  sourceStatus: string;
  freshness: string;
  privacy: string;
  reviewStatus: string;
  tags: string[];
  sources: string[];
  redactionWarningCount: number;
  staleSourceCount: number;
  licenseWarningCount: number;
  licenseMissingCount: number;
  licenseUnknownCount: number;
  licenseRiskCount: number;
  filePath: string;
}
```

### `GET /api/records/:id`

Full record includes resolved sources with the added source metadata and record-level derived counts:

```ts
{
  id: string;
  packId: string;
  title: string;
  type: string;
  tags: string[];
  sourceStatus: string;
  freshness: string;
  privacy: string;
  reviewStatus: string;
  resolvedSources: Array<{
    id: string;
    licenseStatus: string;
    contentHash?: string;
    staleReason?: string;
  }>;
  redactionWarningCount: number;
  staleSourceCount: number;
  licenseWarningCount: number;
  licenseMissingCount: number;
  licenseUnknownCount: number;
  licenseRiskCount: number;
  body: string;
}
```

### `GET /api/search?q=`

Response remains stable:

```ts
{
  query: string;
  results: Array<{
    id: string;
    kind: "pack" | "record";
    title: string;
    snippet: string;
    packId?: string;
    validationStatus?: string;
    exportReadiness?: string;
  }>;
}
```

Rules:

- Empty query returns an empty results array.
- Search returns pack matches and approved record matches only.
- Search does not return invalid-pack records, draft records, rejected records, or skipped-pack content.

### `POST /api/rescan`

Response additions:

```ts
{
  ok: true;
  indexedAt: string;
  packsIndexed: number;
  packsSkipped: number;
  recordsIndexed: number;
  sourcesIndexed: number;
  exportProfilesIndexed: number;
  reviewItemsGenerated: number;
  redactionWarningCount: number;
  staleSourceCount: number;
  licenseWarningCount: number;
  licenseMissingCount: number;
  licenseUnknownCount: number;
  licenseRiskCount: number;
  skipped: Array<{
    packPath: string;
    packId?: string;
    issues: ValidationIssue[];
  }>;
}
```

## 8. Phase 3 Tests

Add exact tests:

- Load demo packs into SQLite:
  - Expect five demo packs indexed.
  - Expect unchanged record/source totals.
  - Expect export profile total increases from 25 to 40 after Phase 2.
  - Expect clean demo packs have `validationStatus="valid"`, `exportReadiness="ready"`, and zero redaction/stale/license-warning/license-risk counts.
- Rebuild SQLite from source folders:
  - Run rebuild twice against the same pack folder.
  - Expect no duplicate rows and stable counts.
- Delete database and rebuild equivalent deterministic state:
  - Build file database from demo packs.
  - Capture deterministic snapshot excluding event IDs/timestamps and mutable review statuses.
  - Delete database file.
  - Rebuild.
  - Expect snapshots equal.
- Search indexes approved records:
  - Query a known approved demo term.
  - Expect approved record results.
  - Add or use fixture with draft/rejected record.
  - Expect draft/rejected records are absent.
- Invalid packs do not activate:
  - Rebuild against validator fixtures.
  - Expect invalid packs in skipped metadata, not in `packs`.
- Warning packs are indexed with warning state:
  - Rebuild against warning fixture root.
  - Expect packs indexed.
  - Expect `validationStatus="valid_with_warnings"`.
  - Expect relevant count field equals `1`.

## 9. Explicit Non-Changes For Phase 1 To Phase 3

Do not implement these in Phase 1 to Phase 3:

- MCP snippets.
- MCP server implementation or changes.
- Import dry-runs.
- Importers, including Markdown, Obsidian, ChatGPT, or Claude imports.
- Obsidian plugin.
- Embeddings.
- Vector database.
- Public registry.
- Public marketplace.
- Public GEO pack hosting.
- Hosted cloud service.
- Cursor export target unless already implemented in the existing codebase.
- Static HTML renderer beyond a local validation-report placeholder.
- Generic chat UI.
- Agent runtime features.
- Skills.
- Agent Kits.
- Executable packs.
- Shell commands inside pack data.
- Network fetch hooks inside packs.
- Third-party repo content as public docs.

## 10. Updated Next Implementation Prompts

### Phase 1 Implementation Prompt

```text
You are Codex implementing Contextarr Phase 1 research-delta schema and validator changes.

Goal:
Add source license metadata, source hash/stale metadata, normalized export targets, deterministic validation report v1, redaction hit reporting, docs-quality warnings, export readiness reporting, and the required validator warnings/errors. Keep the PRD as source of truth.

Files to change:
- packages/schema/src/index.ts
- packages/schema/src/index.test.ts
- packages/pack-validator/src/index.ts
- packages/pack-validator/src/index.test.ts
- packages/pack-validator/test/fixtures/**
- apps/cli/src/index.ts and apps/cli/src/index.test.ts only if the current CLI cannot emit the deterministic JSON validation report required by tests.

Hard boundaries:
- Do not change demo packs except validator fixtures.
- Do not add importers.
- Do not add MCP.
- Do not add export rendering beyond validation/readiness metadata.
- Do not add embeddings, vector DB, hosted cloud, marketplace, Skills, Agent Kits, or executable packs.
- Do not copy third-party code, docs, scanner logic, redaction logic, MCP handlers, export templates, or product copy.

Acceptance criteria:
- Source schema accepts license/hash/stale fields and rejects invalid enum/hash/date shapes.
- Source files may provide `license`, `license_url`, and an optional `license_status` hint, but validator output uses a normalized derived status.
- Export profile schema accepts exactly chatgpt, claude, codex, generic_markdown, json, agents_md, claude_md, llms_txt.
- Cursor remains deferred unless an existing implementation already supports it.
- Validator emits deterministic ValidationReportV1 with schemaVersion contextarr.validation-report.v1.
- Validation summaries separate licenseWarnings, licenseMissing, licenseUnknown, and licenseRisks.
- Export readiness uses only ready, ready_with_warnings, and blocked.
- Missing README, source license risk, stale source, docs quality, and redaction warn hits are warnings.
- Credentials, shell commands, executable files, scripts, unsafe manifest permissions, and invalid export profiles are errors.
- Scanner parsing is limited to pack metadata, rules, export profiles, README/CHANGELOG text, and Markdown record files; binary assets are not parsed.
- Stale-source tests inject a fixed current datetime.
- CLI JSON output supports `contextarr validate <path> --json`.
- Report JSON output is deterministic across repeated validation runs and never depends on wall-clock time.

Tests to run:
- pnpm --filter @contextarr/schema test
- pnpm --filter @contextarr/pack-validator test
- pnpm --filter @contextarr/cli test
- pnpm phase1:verify

Final report format:
- Files changed
- Schema additions
- Validator warning/error codes added
- Fixtures added or updated
- Tests run and results
- Any deviations from docs/research-delta-phase-1-3-plan.md
```

### Phase 2 Implementation Prompt

```text
You are Codex implementing Contextarr Phase 2 research-delta demo-pack changes.

Goal:
Update demo packs and validator fixture packs so Phase 2 demonstrates export-profile readiness, source license metadata, llms_txt, agents_md, claude_md, stale-source warnings, redaction warnings, and license-risk warnings using fake public-safe Contextarr demo content only.

Files to change:
- demo-packs/**
- demo-packs/README.md
- packages/pack-validator/test/fixtures/**
- packages/pack-validator/src/demo-packs.test.ts
- packages/pack-validator/src/index.test.ts only for fixture expectation updates.

Hard boundaries:
- Do not change package source code unless a Phase 1 test expectation was missed and is required for demo validation.
- Do not add importers.
- Do not add MCP.
- Do not add full export rendering.
- Do not add static HTML renderer.
- Do not add embeddings, vector DB, hosted cloud, marketplace, Skills, Agent Kits, or executable packs.
- Do not use third-party README/docs/content as public demo content.

Acceptance criteria:
- Each of the five demo packs remains fake and public safe.
- Each demo pack has exactly eight export profile targets: chatgpt, claude, codex, generic_markdown, json, agents_md, claude_md, llms_txt.
- Each demo pack has sample outputs for agents_md, claude_md, and llms_txt under a pack-local examples folder.
- Clean demo packs validate with zero errors and zero warnings.
- Warning fixtures validate with the expected single warning code.
- Blocking fixtures fail with the expected error code.
- Redaction warning fixture includes one redaction hit.
- License-risk fixture reports licenseWarningCount=1 and licenseRiskCount=1.

Tests to run:
- pnpm --filter @contextarr/pack-validator test
- pnpm demo:validate
- pnpm phase2:verify

Final report format:
- Files changed
- Demo packs updated
- Fixture packs added or updated
- Validation expectations satisfied
- Tests run and results
- Any deviations from docs/research-delta-phase-1-3-plan.md
```

### Phase 3 Implementation Prompt

```text
You are Codex implementing Contextarr Phase 3 research-delta SQLite and API changes.

Goal:
Extend the rebuildable SQLite derived index and local API responses with source license status, source hash/stale metadata, validation status, export readiness, redaction warning count, stale source count, and separated license warning/missing/unknown/risk counts. Preserve SQLite as derived state from pack folders.

Files to change:
- apps/server/src/db.ts
- apps/server/src/types.ts
- apps/server/src/pack-loader.ts
- apps/server/src/indexer.ts
- apps/server/src/health.ts if health counts need to surface through existing health helpers.
- apps/server/src/api.ts
- apps/server/src/db.test.ts
- apps/server/src/indexer.test.ts
- apps/server/src/pack-loader.test.ts
- apps/server/src/api.test.ts

Hard boundaries:
- Do not change Phase 1 schema/validator except for integration fixes required by server tests.
- Do not change demo pack source content except temporary test fixtures inside tests.
- Do not add importers.
- Do not add MCP.
- Do not add mutating API endpoints.
- Do not add full export rendering, embeddings, vector DB, hosted cloud, marketplace, Skills, Agent Kits, or generic chat UI.

Acceptance criteria:
- SQLite stores derived source license/hash/stale metadata and pack warning/readiness counts.
- SQLite and API summaries separate licenseWarningCount, licenseMissingCount, licenseUnknownCount, and licenseRiskCount.
- Invalid packs are skipped and do not activate.
- Warning packs are indexed with validationStatus valid_with_warnings.
- Search indexes approved records only.
- API responses match docs/research-delta-phase-1-3-plan.md.
- Deleting the configured Contextarr database file (`./data/contextarr.db` by default through `CONTEXTARR_DATABASE_PATH`) and rebuilding from the same pack folders yields equivalent deterministic derived state, excluding event timestamps and mutable review statuses.

Tests to run:
- pnpm --filter @contextarr/server test
- pnpm phase3:verify

Final report format:
- Files changed
- SQLite fields added
- API response additions
- Search/indexing behavior changed
- Tests run and results
- Any deviations from docs/research-delta-phase-1-3-plan.md
```

## 11. Assumptions

- This document is a planning artifact only.
- The current PRD wins over research whenever they conflict.
- Existing later-phase artifacts in the repo are out of scope for this Phase 1 to Phase 3 delta. Do not delete or rewrite them as part of this plan.
- `llms_txt`, `agents_md`, and `claude_md` are schema/profile fixtures in Phase 1 to Phase 3, not full Phase 7 export engine implementations.
- Research reports remain private/local inputs. They should not be republished or paraphrased into public third-party-derived docs.
