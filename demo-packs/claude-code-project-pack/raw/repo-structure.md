# Repository Structure Source Note

Architecture note for a fictional monorepo layout.

The app is organized around separate packages for validation and export behavior, with apps for CLI, server, web dashboard, MCP, and public site. Demo packs and fixtures are treated as product proof, not throwaway samples.

| Area | Expected ownership |
| --- | --- |
| apps/site | Public launch pages and contract checks. |
| packages/pack-validator | Schema and source-path validation. |
| demo-packs | Public-safe examples used by dashboard and docs. |

When file moves are needed, public-surface verifiers should be updated in the same change.
