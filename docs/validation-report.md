# Validation Report Contract

Status: v1 core contract candidate.

Contextarr validation is deterministic and read-only. It does not rewrite pack files, fetch URLs, call APIs, run scripts, execute pack content, or calculate live source data during validation.

## CLI

Use:

```bash
pnpm --filter @contextarr/cli contextarr validate <path> --json
```

`<path>` may be one Context Pack folder or a directory containing child pack folders.

Text output is for humans. JSON output is for automation.

## Report Shape

Every Context Pack result uses:

```text
schemaVersion: "contextarr.validation-report.v1"
```

Core fields:

- `packPath`: local path used during validation.
- `packId`: manifest id when the manifest can be read.
- `valid`: boolean.
- `validationStatus`: `valid`, `valid_with_warnings`, or `invalid`.
- `summary`: issue and readiness counters.
- `issues`: deterministic sorted validation issues.
- `redactionHits`: deterministic redaction warn-hit entries.
- `exportReadiness`: pack-level export readiness and per-profile readiness.

Directory validation wraps results in:

- `packPath`
- `targetPath`
- `valid`
- `results`
- `summary`

## Summary Counters

The v1 report keeps separate counters for:

- `errors`
- `warnings`
- `infos`
- `redactionHits`
- `exportProfilesReady`
- `exportProfilesWithWarnings`
- `exportProfilesBlocked`
- `staleSources`
- `licenseWarnings`
- `licenseMissing`
- `licenseUnknown`
- `licenseRisks`
- `docsWarnings`

License counters are intentionally separate so UI, CLI, and release checks can distinguish missing license data from unknown or risky licenses.

## Export Readiness

Allowed Context Pack export targets are:

- `chatgpt`
- `claude`
- `codex`
- `generic_markdown`
- `json`
- `agents_md`
- `claude_md`
- `llms_txt`

`json_records` may remain as a compatibility alias in older UI/API flows, but canonical Context Pack profile YAML should use `json`.

## Determinism

Validation reports must be stable across repeated runs when input files and the injected current date are the same.

Required deterministic behavior:

- Issues sort consistently.
- Redaction hits sort by file, pattern, then record id.
- Export profile readiness sorts by profile id.
- Stale-source tests use an injected fixed date instead of wall-clock time.

## Boundaries

Validation must not:

- execute code
- run shell commands
- fetch source URLs
- call AI APIs
- upload data
- mutate pack files
- trust imported draft content automatically

