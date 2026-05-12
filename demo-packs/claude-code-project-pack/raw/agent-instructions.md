# Agent Instructions Source Note

Project maintainer note for fictional coding-agent contributors.

The agent is expected to inspect the current branch before editing, preserve user-authored changes, and keep fixes scoped to the requested behavior. If a task touches validation or export behavior, the matching tests and public contract notes should be checked in the same pass.

| Situation | Preferred handling |
| --- | --- |
| Unknown file ownership | Read surrounding context before editing. |
| Public copy change | Check implementation-status and known-limitations wording. |
| Pack-format change | Update fixtures and validator coverage together. |

The note is intentionally procedural but non-executable. It does not ask the agent to run shell content from a pack.
