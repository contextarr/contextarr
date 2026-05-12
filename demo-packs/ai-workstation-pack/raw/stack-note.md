# Stack Note Source Material

Stack overview note for a fictional AI workstation.

The local stack includes a dashboard surface, CLI validation, export preview, static rendering, and read-only context serving. The source owner wants AI help to understand which surface is relevant before suggesting a fix.

| Stack layer | Role |
| --- | --- |
| local files | canonical pack source |
| SQLite index | rebuildable app state |
| dashboard | human inspection |
| exports | target-shaped artifacts |
| read-only MCP | approved context access |

The note avoids package versions and live service endpoints.

Additional synthetic operating detail:

| Demo surface | Healthy signal | Slow-inference relevance |
| --- | --- | --- |
| model-router-demo | Requests are assigned to the intended lane | First place to inspect when AI responses are slow |
| inference-shelf-demo | Queues remain short and model lanes are not saturated | Separates model pressure from dashboard issues |
| context-index-demo | Approved records appear in search after review | Relevant to stale context, not raw inference speed |
| export-preview-demo | Target briefs match current approved records | Relevant to bad briefs, not model latency |

The operator wants assistants to identify the likely layer from symptoms, not produce executable repair steps.
