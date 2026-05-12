# Coding Conventions Source Note

Local style note for a fictional TypeScript monorepo.

The project favors small modules, deterministic validation reports, and typed JSON response shapes. Public-facing wording should use current-status language instead of future promises. Tests should use stable fixture timestamps when a report contains generated dates.

| Area | Convention |
| --- | --- |
| API responses | Include schemaVersion when the object is durable or agent-facing. |
| Validators | Prefer explicit issue codes over prose-only failures. |
| Site copy | Keep launch claims tied to current routes and verified counts. |

Do not introduce a broad abstraction just to deduplicate a one-off launch page.
