# Alpha Screenshot Evidence

This folder contains reviewed screenshot evidence for the `v0.1.0-alpha.1` developer preview.

Do not commit generated screenshots unless they are explicitly reviewed and approved. Local scratch captures should remain outside the repository or in ignored local output folders.

Demo recording scratch files follow the same rule. Use `docs/demo-script.md` for the script-ready Wave 1 recording checklist, and keep any future local recording, transcript, or smoke evidence under `.contextarr-cache/demo-proof/<stamp>/` until review approval.

The reviewed alpha set lives in `docs/screenshots/v0.1.0-alpha.1/` and is verified by:

```bash
pnpm screenshots:verify
```

Required alpha screenshot slots:

- Pack Library grid.
- Dense table.
- Pack detail.
- Record detail with source map.
- Pack Health.
- Export preview.
- MCP or CLI output.
- Backup or security boundary view.
