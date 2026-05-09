# Contextarr Threat Model

Status: lightweight public alpha threat model. Check [implementation-status.md](implementation-status.md) before treating planned scanner, quarantine, approved-only, signing, or registry behavior as shipped.

## Protected Assets

- Local pack files.
- Markdown records and frontmatter.
- Source maps and provenance metadata.
- Export profiles and generated exports.
- SQLite derived state.
- MCP query metadata.
- Local API token when configured.
- User private context outside this public repository.

## Trust Boundaries

| Boundary | Current expectation |
|---|---|
| Local filesystem | Pack files are trusted only after validation and review. |
| Demo packs | Must contain fake or public-safe data only. |
| Importers | Generate draft packs from local files and exports. Imported content is not approved by default. |
| Local API | Binds to `127.0.0.1` by default and can require a token. |
| Web dashboard | Uses the local API and sanitized Markdown rendering. |
| CLI | Deterministic local interface. It must not execute pack content. |
| MCP | Read-only stdio process with bounded, redaction-aware responses. |
| Docker preview | Local preview only. It binds the host port to `127.0.0.1`. |
| Future registry | Must not auto-activate downloaded artifacts. |

## Primary Threats

- Secrets or private data committed into public demo packs, docs, screenshots, fixtures, or exports.
- Malicious pack content attempting to smuggle shell commands, scripts, external resources, or prompt-injection instructions.
- Local API exposed beyond localhost without authentication and threat review.
- MCP returning more private context than intended.
- Imported data treated as approved before review.
- Generated exports copied into external tools without checking redaction warnings.
- Roadmap docs being mistaken for shipped security guarantees.
- Future registry or marketplace behavior outrunning validation, quarantine, scanner reports, signing, and review.

## Current Mitigations

- Packs are data-only and non-executable.
- Validator and runtime surfaces must not run pack content.
- Demo data policy requires fake or public-safe examples.
- SQLite is derived local state.
- Markdown rendering is sanitized.
- Local API binds to localhost by default.
- Optional API token support exists for protected API routes.
- MCP is stdio-only and read-only.
- MCP private access defaults to `false`.
- `.env` files and local generated output folders are ignored.
- Public docs repeatedly separate current behavior from planned behavior.

## Open Risks

- Approved-content-only export and MCP visibility are required gates but not fully complete everywhere. Track current status in [implementation-status.md](implementation-status.md).
- The first public release needs a clean CI run from the public repository state.
- GitHub branch protection, secret scanning, Dependabot alerts, and social preview configuration require manual repo settings.
- Screenshots need review before they are committed or linked from the README.

## Non-Goals

Contextarr does not try to provide:

- Perfect prompt-injection detection.
- Production security certification.
- Hosted private memory.
- Public marketplace safety guarantees.
- Remote execution safeguards for executable packs, because executable packs are out of scope.
