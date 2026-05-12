# Firewall Notes Source Note

Firewall intent note for a fictional network.

Rules are described in plain-language intent, not copied as firewall exports. The important context is which zones should talk, which zones should never initiate access, and which exceptions require human review.

| Zone relation | Intent |
| --- | --- |
| trusted to services | allowed for normal administration |
| guest to internal | blocked except captive resources |
| IoT to trusted | blocked by default |
| operations to network gear | allowed only for maintainers |

The source avoids rule dumps, addresses, and live device names.
