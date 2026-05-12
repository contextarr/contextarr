# VLANs And Subnets Source Note

Segmentation note for a fictional UniFi-style network.

Segments are documented by purpose, not by address. This gives an AI enough context to reason about troubleshooting without exposing private addressing or controller exports.

| Segment class | Purpose | Default posture |
| --- | --- | --- |
| trusted | normal personal devices | access to shared services |
| services | local apps and infrastructure | limited inbound paths |
| guest | visitor access | internet-only |
| IoT | untrusted appliances | isolated from trusted devices |
| media | playback and casting devices | discovery is allowed only through documented media paths |
| lab | temporary experiments | no default access to management or trusted clients |
| operations | maintainer-only administration | used for review notes, not exported identifiers |

No private subnets or static mappings are included.

Synthetic review notes:

- If a traffic class is "camera status", it belongs with IoT telemetry and must not imply trusted-client access.
- If a traffic class is "casting discovery", it is evaluated against the media segment and should stay narrow.
- If a traffic class is "admin console", it requires operations ownership and human review.
- If a traffic class is "guest browsing", it remains internet-only and cannot discover local services.
