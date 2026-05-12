# Firewall Notes Source Note

Firewall intent note for a fictional network.

Rules are described in plain-language intent, not copied as firewall exports. The important context is which zones should talk, which zones should never initiate access, and which exceptions require human review.

| Zone relation | Intent |
| --- | --- |
| trusted to services | allowed for normal administration |
| guest to internal | blocked except captive resources |
| IoT to trusted | blocked by default |
| operations to network gear | allowed only for maintainers |
| lab to services | temporary and reviewed by test owner |
| media to services | narrow discovery or playback support only |
| support to management | disabled unless an active review window exists |

The source avoids rule dumps, addresses, and live device names.

Synthetic rule-review texture:

- Each exception records a plain-English owner such as "media maintainer" or "lab reviewer".
- Review notes use traffic classes like "playback discovery", "device telemetry", and "maintenance status" instead of numeric details.
- Temporary paths are marked with a review window category rather than a real date from a live environment.
- A blocked path can still be useful context when it explains why an assistant should not recommend broad access.
