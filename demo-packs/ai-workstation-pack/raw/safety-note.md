# Safety Note Source Material

Safety boundary note for a fictional AI workstation.

The workstation can prepare context for many tools, but Contextarr itself should not become an executor. The pack records boundaries so exported briefs stay clear about what the downstream AI may know versus what it may do.

| Boundary | Pack-safe statement |
| --- | --- |
| actions | Contextarr prepares context only |
| private data | classify and redact before export |
| remote services | no hidden calls in pack handling |
| source files | user-owned and inspectable |

This is guidance for context preparation, not an automation policy engine.
