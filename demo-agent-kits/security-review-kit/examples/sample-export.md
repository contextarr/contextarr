# Security Review Kit Sample Export

## Kit Summary

Use this kit to prepare a deterministic security review brief with clear severity language.

## Task Goal

Identify safety-sensitive areas from demo context while preserving non-execution boundaries.

## Included Materials

Context Packs:
- claude-code-project-pack
- jellyfin-server-pack

Skills:
- security-review-skill
- homelab-troubleshooting-skill

## Example Output Shape

1. Situation summary.
2. Relevant context.
3. Suggested response or implementation outline.
4. Review checklist.
5. Open questions.

## Guardrails

- Focus on evidence and blast radius.
- Do not request secrets or credentials.
- Keep remediation suggestions reviewable.
