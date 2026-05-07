# @contextarr/renderer

Shared sanitized Markdown and static HTML renderer for Contextarr.

Implemented in Phase 5:

- browser-safe Markdown to HTML rendering
- sanitized output with no user JavaScript or external scripts
- static HTML rendering for one pack or a directory of packs

CLI usage:

```bash
pnpm --filter @contextarr/cli contextarr render demo-packs/ai-workstation-pack --out rendered/ai-workstation
pnpm --filter @contextarr/cli contextarr render demo-packs --out rendered/demo-packs
```
