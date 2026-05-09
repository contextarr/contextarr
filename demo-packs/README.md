# Demo Packs

Fake, public-safe demo packs for Contextarr.

These packs are data-only examples used to exercise the validator and provide later UI/API demo content.

Included packs:

- `ai-workstation-pack`
- `jellyfin-server-pack`
- `claude-code-project-pack`
- `internal-support-kb-pack`
- `fake-product-line-pack`

Each demo pack declares the current export-profile targets `chatgpt`, `claude`, `codex`, `markdown`, and `json_records`. The CLI can export those existing profiles by target alias:

```bash
pnpm --filter @contextarr/cli contextarr export demo-packs/ai-workstation-pack --target chatgpt --out generated-exports/ai-workstation
pnpm --filter @contextarr/cli contextarr export demo-packs/jellyfin-server-pack --target claude --out generated-exports/jellyfin-server
pnpm --filter @contextarr/cli contextarr export demo-packs/claude-code-project-pack --target codex --out generated-exports/claude-code-project
pnpm --filter @contextarr/cli contextarr export demo-packs/internal-support-kb-pack --target markdown --out generated-exports/internal-support
pnpm --filter @contextarr/cli contextarr export demo-packs/fake-product-line-pack --target json_records --out generated-exports/fake-product-line
```

Use `--profile <profile-id>` when you need a specific export profile id. Use `--all` to export every profile in a pack or demo-pack directory.

Validate them with:

```bash
pnpm demo:validate
```

The demo packs must not contain real private data, credentials, executable files, or scripts.
