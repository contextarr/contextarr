# Compose Files Source Note

Operator note for a fictional Docker host inventory.

Compose projects are grouped by service family rather than copied into the pack. The source owner keeps the actual compose files outside the demo pack and records only reviewable summaries: service class, exposure tier, storage tier, and maintenance owner.

| Project class | Example role | Exposure tier |
| --- | --- | --- |
| media | catalog and streaming services | internal dashboard |
| automation | scheduled local helpers | local-only |
| observability | logs and health summaries | operator-only |

No runnable compose snippets are included in this synthetic source.
