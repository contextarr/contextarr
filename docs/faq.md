# Frequently Asked Questions

Simple answers about Contextarr, Context Packs, privacy, exports, read-only MCP, and the roadmap surfaces that stay non-executing.

## General

### What is Contextarr?

Contextarr is a local-first Context Pack system for preparing trusted AI context from files you control. It validates, renders, redacts, exports, and serves approved context to the AI tools you already use.

### What problem does Contextarr solve?

AI tools often start without the background that matters. Contextarr gives you a reusable way to maintain that context once, review it locally, and reuse the right version across assistants, coding agents, local tools, and read-only MCP.

### What does "arr" stand for?

In Contextarr, "arr" stands for **Assemble, Review, Route**.

Contextarr assembles trusted context from local sources, reviews it through validation, redaction, freshness, and human approval, then routes the right version through human-readable HTML, exports, CLI, API, Docker, and read-only MCP.

### Is Contextarr an AI chatbot or agent runner?

No. Contextarr prepares context. It does not replace ChatGPT, Claude, Codex, local agents, or IDE tools, and it does not run agents.

## Context Packs

### What is a Context Pack?

A Context Pack is a structured, source-backed bundle of AI-ready context. It can describe a project, system, product, workflow, knowledge base, support process, technical environment, or operating procedure.

### What goes inside a Context Pack?

A pack can include Markdown records, source maps, metadata, validation rules, redaction rules, export profiles, examples, and review status. It should not include credentials, secrets, executable scripts, or private data that does not need to be exported.

### Are Context Packs executable?

No. Context Packs are data-only. They are read, validated, rendered, and exported, but they do not run code, execute commands, make network calls, automate browsers, or perform actions.

### Are Context Packs human-readable?

Yes. Contextarr is built around local files, Markdown records, source maps, validation reports, and sanitized static HTML renders so humans can inspect context before handing it to AI tools.

## Privacy and Security

### Where is my data stored?

Contextarr uses local pack files as the source of truth. SQLite is a rebuildable local index for search, health, review queues, and dashboard state, not the canonical store.

### Does Contextarr upload my data?

No hidden upload is part of the product model. Nothing should leave your machine unless you explicitly export it, copy it, connect a downstream AI tool, or configure an integration.

### Does Contextarr collect telemetry?

No. Telemetry, product analytics, hidden tracking, and phone-home behavior are out of scope for the current product.

### Can I inspect what will be exported?

Yes. Export previews, redaction rules, source summaries, review state, and human-readable renders are core to the product loop.

## Exports and AI Tools

### What AI tools can Contextarr target?

Targets include ChatGPT, Codex, Claude, Claude Code, Gemini, Antigravity, Hermes, OpenClaw, local agents, generic Markdown, JSON records, AGENTS.md, CLAUDE.md, llms.txt, and read-only MCP clients.

### Why have different export formats?

Different tools need different context shapes. A coding agent may need implementation constraints and acceptance criteria, while a chatbot may need a cleaner brief. Export profiles keep those outputs target-ready.

### Can I use Contextarr without MCP?

Yes. MCP is useful, but Contextarr also supports human-readable HTML, local dashboard views, CLI workflows, local API access, Markdown exports, JSON records, AGENTS.md, CLAUDE.md, and llms.txt.

### What is read-only MCP?

Read-only MCP lets AI clients inspect approved Contextarr content without giving Contextarr permission to mutate files, run commands, call network services, or access secrets.

## Local Files and Source Ownership

### Why use local files as the source of truth?

Local files are portable, inspectable, versionable, and not locked inside a single AI provider. You can open them in an editor, store them in Git, back them up, render them, validate them, and export them.

### Can I rebuild the local database?

Yes. A core design goal is that the derived SQLite index can be rebuilt from pack folders.

### Does Contextarr replace Obsidian?

No. Contextarr can work with Markdown and Obsidian-style files, but its job is to turn context into reviewed, structured, AI-ready packs and exports.

## Review, Health, and Redaction

### What is Pack Health?

Pack Health shows whether a Context Pack is valid, reviewed, current, source-backed, safe, and export-ready. It can flag missing fields, stale sources, broken references, redaction warnings, or unreviewed drafts.

### Why does human review matter?

AI-drafted or imported context should not automatically become trusted context. Human review helps prevent stale facts, unsafe exports, sensitive-data leaks, and false confidence.

### What is redaction?

Redaction means masking, removing, or excluding sensitive information before an export, such as secrets, API keys, emails, customer details, private notes, internal URLs, or financial details.

## Skills, Agent Kits, and Roadmap

### What are Skills?

Native Contextarr Skills are future non-executing instruction artifacts that describe how an AI should perform a type of work. Imported external Skill artifacts may later contain scripts or assets from their source ecosystem, but Contextarr will preserve, scan, classify, and package them without mutation or execution.

### What are Agent Kits?

Agent Kits are future task-ready bundles that pair Context Packs, Skills, targets, and export rules. Context Packs tell AI what to know. Skills tell AI how to work. Agent Kits combine both for a task.

### Does Contextarr run Agent Kits?

No. Contextarr prepares and exports Agent Kits. Execution belongs to the downstream assistant, coding agent, IDE, or local agent runtime.

### Will Contextarr have a public marketplace?

Not early. Public registries and marketplaces create serious trust and supply-chain risk, so the current product focuses on the local Context Pack loop first.

## Setup and Open Source

### Do I need Docker?

Docker is the recommended local preview path for the public demo experience, but the repo also includes local development scripts for contributors.

### Is Contextarr open source?

Contextarr is intended to start with an inspectable open-source, self-hosted core: schemas, validators, pack format, dashboard, exports, CLI, and read-only MCP.

### Why should I trust Contextarr?

The trust model is local files, explicit validation, human review, redaction, source maps, human-readable rendering, no hidden execution, no telemetry, and read-only MCP.
