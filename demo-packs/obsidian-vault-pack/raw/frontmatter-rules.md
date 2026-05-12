# Frontmatter Rules Source Note

Metadata convention note for fictional Markdown records.

Frontmatter is used to separate source state from export state. Notes can be useful without being approved for AI output, so review status and privacy class are tracked separately.

| Field | Purpose |
| --- | --- |
| status | draft, reviewed, or stale |
| privacy | public-safe, private, or sensitive |
| source_ids | links the summary to source notes |
| freshness | indicates when context should be rechecked |

Additional synthetic taxonomy:

| Field | Demo values |
| --- | --- |
| review_status | draft, needs_review, approved, stale |
| note_kind | evergreen, project, daily, journal, import |
| export_class | public_brief, internal_reference, never_export |

The fictional vault treats missing privacy as review-needed. A `never_export` class or tag blocks export even when the note otherwise looks useful.

The convention is synthetic and does not copy a real vault schema.
