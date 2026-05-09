# Marketplace Gates

Status: future gate list. No marketplace, payments, creator accounts, public registry, or paid artifacts are implemented by this document.

Marketplace is the later commercial layer for paid artifacts. Registry comes before marketplace. Trust model comes before public uploads.

## Marketplace Launch Gates

1. Context Pack schema stable.
2. Skill schema stable.
3. Agent Kit schema stable.
4. Scanner v1 tested against malicious fixtures.
5. Signing implemented.
6. Encrypted artifact storage implemented.
7. Quarantine install implemented.
8. Local re-scan implemented.
9. Revocation implemented.
10. Abuse reporting implemented.
11. Publisher verification implemented.
12. Manual review workflow implemented.
13. Public policy published.
14. Legal/license policy published.
15. No-execution policy enforced.
16. At least 50 verified official/community artifacts pass process.
17. At least 10 external users successfully import, review, and activate artifacts from registry without direct support.
18. Security review completed.
19. Incident response process documented.
20. Marketplace payments remain blocked until all gates pass.

## Marketplace Must Not Launch Until

- Public registry policy is proven.
- Signing and revocation work.
- Scanner policy has real malicious fixture coverage.
- Quarantine install is normal user behavior.
- Human review is part of activation.
- No-execution policy is technically enforced.
- Abuse and license processes exist.

## Current Product Boundary

Contextarr currently prepares context. It does not operate a marketplace, run agents, execute Skills, execute packs, host public artifacts, or process payments.
