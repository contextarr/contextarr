# Agent Instructions Source Note

Project maintainer note for fictional coding-agent contributors.

The agent is expected to inspect the current branch before editing, preserve user-authored changes, and keep fixes scoped to the requested behavior. If a task touches validation or export behavior, the matching tests and public contract notes should be checked in the same pass.

| Situation | Preferred handling |
| --- | --- |
| Unknown file ownership | Read surrounding context before editing. |
| Public copy change | Check implementation-status and known-limitations wording. |
| Pack-format change | Update fixtures and validator coverage together. |

The note is intentionally procedural but non-executable. It does not ask the agent to run shell content from a pack.

Additional synthetic handoff details:

| Brief section | Expected content |
| --- | --- |
| Goal | A single user-visible UI behavior and why it matters. |
| Owned scope | The fictional surface or component group the agent may inspect. |
| Out of scope | Publishing, deployment, credentials, broad redesign, and unrelated cleanup. |
| Validation | A plain-language check that confirms the behavior, without embedding commands. |
| Final report | Changed files, improved behavior, checks performed, and concerns. |

The maintainer prefers specific implementation briefs over open-ended "improve the app" prompts.
