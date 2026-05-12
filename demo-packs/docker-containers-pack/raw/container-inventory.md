# Container Inventory Source Note

Inventory note from a fictional self-hosted Docker environment.

The operator tracks containers by purpose, dependency class, and recovery importance. Container names are generalized so the pack can be shared without revealing private host naming conventions.

| Class | Typical examples | Recovery priority |
| --- | --- | --- |
| edge | proxy and access boundary services | high |
| data | databases and stateful stores | high |
| app | user-facing self-hosted apps | medium |
| utility | maintenance and report helpers | low |

The inventory intentionally omits image digests, private registry names, and environment values.

Additional fictional inventory detail:

| Synthetic name | Role | Dependency note |
| --- | --- | --- |
| edge-proxy-demo | Routes web traffic to approved app services | No direct database relationship. |
| media-catalog-demo | Builds searchable media metadata | Requires an approved data dependency. |
| notes-vault-demo | Stores private notes for a fictional household | Private-only unless review changes exposure. |
| metrics-shelf-demo | Summarizes health and retention-safe logs | Reads status, not raw secret material. |
| database-ledger-demo | Represents internal stateful storage | Data boundary only; no edge exposure. |

The operator uses this inventory to explain dependency class and recovery priority without sharing real container names.
