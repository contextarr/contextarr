# Forbidden Actions Source Note

Safety note for fictional coding-agent work.

The project does not want agents to infer permission for public actions. Merge, release, deploy, registry, marketplace, package publication, and telemetry changes require separate explicit approval. When a task is about content or validation, the implementation should stay inside that lane.

| Boundary | Reason |
| --- | --- |
| No public launch action | Keeps review separate from publication. |
| No executable pack behavior | Context packs remain data, not automation. |
| No silent remote behavior | Local-first claims must remain inspectable. |

This source note intentionally avoids runnable examples or command snippets.
