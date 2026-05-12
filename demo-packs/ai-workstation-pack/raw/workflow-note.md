# Workflow Note Source Material

Workflow note for a fictional AI operator.

The preferred loop is assemble, review, route: collect local source material, validate and render it for human review, then create the right brief for the target tool. The same pack may support a dashboard view, a Markdown brief, or read-only MCP access.

| Step | Owner question |
| --- | --- |
| assemble | What local source backs this record? |
| review | Is it current, public-safe, and approved? |
| route | Which output shape fits the AI tool? |

The workflow note is descriptive and contains no task runner instructions.

Synthetic troubleshooting examples:

| Observation | Safe assistant conclusion |
| --- | --- |
| Chat UI feels slow but pack health is current | Inspect the model-serving lane before export preview. |
| Exported Markdown omits a newly approved record | Inspect export preview and source review state before inference. |
| Dashboard freshness warnings appear after a quiet week | Inspect review cadence before storage or networking. |

The source owner wants final answers to include a probable layer, supporting record, and remaining unknowns.
