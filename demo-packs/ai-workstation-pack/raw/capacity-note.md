# Capacity Note Source Material

Operator note for a fictional local AI workstation.

Capacity is tracked by workload class rather than exact hardware telemetry. The pack needs enough context for planning model use, dashboard checks, and export guidance without exposing machine-specific identifiers.

| Workload class | Expected constraint | Review cue |
| --- | --- | --- |
| chat inference | memory headroom | check concurrent services |
| indexing | disk and CPU burst | schedule away from demos |
| web dashboard | low resource use | keep available during review |
| batch export | short CPU spike | safe for normal use |

No serial numbers, private paths, or live metrics are included.
