# Networks And Ports Source Note

Operator note from a fictional homelab container review.

Network boundaries are tracked by intent because generated compose summaries miss firewall context. Edge services may attach to a shared entry network, while databases and cache services stay on internal bridges. Host port exposure is reviewed manually before an export is shared.

| Network intent | Allowed service class | Notes |
| --- | --- | --- |
| edge | reverse proxy and public-safe status page | review before sharing |
| app-internal | app to app traffic | no direct host exposure |
| data-internal | stateful stores | restricted to dependent apps |
| ops-internal | monitoring and maintenance views | operator-only |

No real host ports, hostnames, or firewall rules are included.

Additional synthetic boundary examples:

| Reachability observation | Public-safe interpretation |
| --- | --- |
| App reaches proxy but not database | The app is probably attached to the edge or app boundary, not the data boundary. |
| Proxy reaches app but not database | This is expected when the proxy is limited to web routing. |
| Metrics service sees status but not contents | Ops visibility is intentionally narrower than data access. |
| Backup coordinator sees copy state | Coordination can happen without exporting secret values or host rules. |

The operator wants AI explanations to discuss network intent, not exact ports or live firewall changes.
