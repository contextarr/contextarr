# Device Inventory Source Note

Network inventory note for a fictional UniFi-style site.

Devices are tracked by role class rather than serial number. The pack needs enough context for troubleshooting advice while avoiding private identifiers, addresses, and live controller details.

| Role class | Examples | Review concern |
| --- | --- | --- |
| gateway | routing and WAN boundary | exposure and failover |
| switching | wired distribution | port role intent |
| access point | wireless coverage | client experience |
| client class | trusted, guest, IoT | segmentation |

No MAC addresses, serial numbers, controller URLs, or real site names are recorded.
