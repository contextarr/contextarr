# Update Policy Source Note

Maintenance note for fictional self-hosted services.

Updates are grouped by blast radius. Low-risk dashboard-only services can move during routine maintenance. Stateful services require a recent backup marker and a rollback note. Edge services require a second look because mistakes can change exposure.

| Update class | Review needed |
| --- | --- |
| dashboard-only | basic smoke check |
| stateful app | backup marker and rollback owner |
| edge boundary | exposure review |

The policy records decision criteria and intentionally excludes commands.
