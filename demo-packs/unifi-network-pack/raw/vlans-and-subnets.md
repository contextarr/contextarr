# VLANs And Subnets Source Note

Segmentation note for a fictional UniFi-style network.

Segments are documented by purpose, not by address. This gives an AI enough context to reason about troubleshooting without exposing private addressing or controller exports.

| Segment class | Purpose | Default posture |
| --- | --- | --- |
| trusted | normal personal devices | access to shared services |
| services | local apps and infrastructure | limited inbound paths |
| guest | visitor access | internet-only |
| IoT | untrusted appliances | isolated from trusted devices |

No private subnets or static mappings are included.
