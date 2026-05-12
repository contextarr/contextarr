# Project Overview Source Note

Maintainer orientation note for a fictional Context Pack tooling repo.

The repository demonstrates a local-first context workflow: pack files are canonical, SQLite is derived state, and exports are generated artifacts. The public site should make the core loop obvious before introducing advanced preview objects.

| Surface | Role in the project |
| --- | --- |
| CLI | Validates packs and produces agent-readable output. |
| Dashboard | Lets humans inspect packs, records, health, and exports. |
| MCP | Serves approved context read-only. |

The overview is synthetic and contains no private repo names, customer names, or live service endpoints.

Additional fictional product texture:

| UI surface | Current concern | Safe implementation brief angle |
| --- | --- | --- |
| Review Inbox | Operators need to see which notes are ready for export. | Clarify readiness labels and empty states. |
| Pack Preview | Export summaries can look broader than the approved records. | Tighten wording and source attribution. |
| Brief Builder | Agents need bounded objectives for one UI fix at a time. | Include objective, scope, non-goals, and validation expectation. |
| Health Panel | Warnings should point to review state rather than imply live service failure. | Keep status copy precise and non-alarming. |

The project owner wants briefs to be useful to coding agents while staying detached from private repositories and deployment authority.
