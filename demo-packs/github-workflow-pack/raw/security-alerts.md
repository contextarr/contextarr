# Security Alerts Source Note

Security handling note for a fictional project.

Alerts are triaged by exposure risk and whether the affected surface can leak context or imply execution. Dependency alerts are recorded separately from product-boundary issues such as unsafe paths or accidental private data in examples.

| Alert class | Expected response |
| --- | --- |
| dependency advisory | patch or document risk |
| source-path escape | block before release |
| public copy overclaim | patch wording before launch |

No real advisory IDs or private disclosure details are included.
