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
