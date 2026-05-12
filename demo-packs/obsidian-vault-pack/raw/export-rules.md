# Export Rules Source Note

Export policy note for a fictional Markdown vault.

Exports use reviewed records, not raw vault folders. Notes tagged as private, draft, personal, or source-only require review before they can appear in an AI brief.

| Tag class | Export behavior |
| --- | --- |
| project | eligible after source review |
| evergreen | eligible after freshness check |
| daily | excluded by default |
| private | excluded unless explicitly approved |

| Metadata signal | Reviewer action |
| --- | --- |
| draft or stale | keep out of AI briefs |
| imported | verify license and summarize only after approval |
| source-only | cite the reviewed record instead |
| never-export | block from every target |

The safe export path favors reviewed records with public-safe summaries. Raw note bodies, backlinks, private titles, personal planning notes, and copied third-party material stay out of generated context.

The note is about process and contains no private note text.
