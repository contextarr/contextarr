# Contextarr Importers

Local-only draft pack and draft Skill importers for Contextarr.

Phase 9 supports:

- local folders
- Markdown folders
- Obsidian-style vaults
- ChatGPT export files or zips
- Claude export files or zips

Importers write draft packs only. They do not fetch URLs, call APIs, execute files, upload data, or approve imported records.

Phase 26 supports draft Skill imports for:

- local folders
- Markdown folders
- prompt templates
- Claude Skill folders
- ChatGPT prompt JSON exports

Skill imports write private, unreviewed draft Skills only. They block executable/script-like files, shell-command patterns, credential-like content, unsafe filenames, external calls, uploads, and approval behavior.
