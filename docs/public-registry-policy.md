# Public Registry Policy

Status: future policy. No public registry, public uploads, public discovery, marketplace, or payments are implemented by this document.

Trust model before public uploads. Registry before marketplace.

## Public Registry Requirements

1. No public anonymous uploads for verified listing.
2. Publisher identity required.
3. Manual review required for verified status.
4. Automated scanner required for all listings.
5. Human review required for official and verified listings.
6. Public preview required.
7. Source map required.
8. License required.
9. Changelog required.
10. No executable content.
11. No hidden network content.
12. No credential prompts.
13. No private personal data.
14. No scraped proprietary docs.
15. No impersonation.
16. Abuse report process required before launch.
17. Revocation process required before launch.
18. Marketplace payments are forbidden until public registry policy, signing, review, and revocation are proven.

## Allowed Categories

1. Export profiles.
2. Redaction rule sets.
3. Validation rule sets.
4. Context Pack templates.
5. Agent Kit templates.
6. Official demo packs.
7. Public-safe documentation packs.
8. Non-executable Skills.
9. Public-safe Agent Kits using only public-safe Context Packs.
10. `llms.txt`, `AGENTS.md`, and `CLAUDE.md` export profiles.

## Disallowed Categories

1. Executable packs.
2. Executable Skills.
3. Scripts.
4. Shell commands.
5. Browser automation.
6. Runtime plugins.
7. Hidden network fetches.
8. Remote instruction loading.
9. Credential prompts.
10. API keys.
11. Private keys.
12. Personal data packs.
13. Health, financial, child, or legal personal-data packs.
14. Scraped proprietary manuals.
15. Copyrighted third-party docs repackaged without permission.
16. Packs impersonating official vendors.
17. Packs with unclear or restricted license states unless explicitly marked and blocked from verified status.
18. Agent Kits that bundle private context.
19. Anything claiming Contextarr can execute actions.

## Listing Language

Use statuses such as `policy_clean`, `verified`, `signed and verified`, `registry approved`, `blocked`, `quarantined`, and `revoked`.

Do not use language that implies all downstream use is safe.
