# Volumes And Storage Source Note

Storage note for a fictional Docker host.

The operator describes volume classes instead of exposing private mount paths. The useful context is which services hold durable data, which volumes can be recreated, and which areas should never be sent to a general AI chat.

| Storage class | Examples | Export posture |
| --- | --- | --- |
| durable-app-data | app databases and indexes | summarize only |
| cache | rebuildable caches | safe to describe |
| media-library | user-owned media paths | redacted |
| config | local service settings | summarize categories |

No private filesystem paths or media titles are included.
