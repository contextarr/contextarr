# Claude Code Project Pack Demo Eval Report

Pack id: claude-code-project-pack
Pack slug: claude-code-project-pack

| Path | Score | Fixture result |
| --- | ---: | --- |
| no-context | 2 | Generic, weak, and unable to cite pack facts. |
| raw-notes | 6 | Finds some facts but is noisy and over-broad. |
| contextarr-export | 9 | Grounded, scoped, source-aware, and safer. |

The deterministic score ordering is contextarr-export > raw-notes > no-context. No AI service is called; these are fixed proof fixtures.