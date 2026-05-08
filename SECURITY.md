# Security Policy

## Reporting a Vulnerability

Please report security issues to security@contextarr.com.

Do not include public exploit details, private data, credentials, or secret material in GitHub issues. A short description, affected version or commit, reproduction outline, and impact summary are enough to start.

## Security Boundaries

Contextarr is local-first, data-only, and human-review centered.

Context Packs must not contain:

- Executable packs.
- Scripts in packs.
- Shell commands in packs.
- Hidden network calls.
- Credentials, API keys, tokens, private keys, or recovery material.
- Real private user, customer, company, financial, or medical data in public demo packs.

The MCP server is read-only in v0/v1. It must not mutate files, run commands, call external services, or expose private record bodies unless an explicit local-only private access mode is enabled.

AI-drafted records require human review before they become approved pack content or are exported.

## Supported Versions

Contextarr is early-stage software and is not production ready. The v0.1 Docker Compose path is a local preview, not a hosted deployment recipe. Security reports against the default branch are welcome.
