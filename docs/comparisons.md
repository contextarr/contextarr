# Comparisons

## Purpose

This document clarifies what Contextarr should complement and what it must not try to replace.

## Contextarr Vs ChatGPT Memory

Use the other tool when you want convenient personalization inside ChatGPT.

Use Contextarr when you need portable, inspectable, source-backed, redaction-aware context that can be exported to many tools.

How they can work together: Contextarr can produce a concise ChatGPT brief from approved pack content while ChatGPT memory handles lightweight personal preferences inside ChatGPT.

What Contextarr must not try to replace: ChatGPT's built-in personalization layer.

## Contextarr Vs Claude Memory

Use the other tool when Claude's native memory or project context is enough for one Claude workspace.

Use Contextarr when the same facts need to be reviewed, sourced, redacted, and reused across Claude, Codex, ChatGPT, MCP, Markdown, and repo instruction files.

How they can work together: Contextarr can generate Claude briefs with sources, stale warnings, uncertainty, and review status.

What Contextarr must not try to replace: Claude's native interface, project UX, or provider-side recall.

## Contextarr Vs CLAUDE.md

Use the other tool when a repo needs a concise Claude Code instruction file.

Use Contextarr when that file should be generated from approved, source-backed pack content and kept aligned with exports for other tools.

How they can work together: Contextarr should generate concise, durable `CLAUDE.md` output rather than bloating it with every record.

What Contextarr must not try to replace: Repo-local instruction files that are already the right final artifact for Claude Code.

## Contextarr Vs AGENTS.md

Use the other tool when a repo needs simple local agent instructions.

Use Contextarr when those instructions should come from a maintained pack with sources, review state, phase boundaries, and export readiness.

How they can work together: Contextarr can export repo-specific `AGENTS.md` guardrails from approved records.

What Contextarr must not try to replace: The lightweight convention of keeping agent guidance near the code.

## Contextarr Vs Obsidian

Use the other tool when you want a personal Markdown note editor, graph view, writing workspace, or PKM system.

Use Contextarr when you want to validate, review, redact, compile, render, and export approved context from Markdown sources.

How they can work together: Obsidian can remain the authoring environment while Contextarr imports or references Markdown as source material.

What Contextarr must not try to replace: Obsidian's note editing, linking, plugin, and personal knowledge management experience.

## Contextarr Vs Basic Memory Style Tools

Use the other tool when you want lightweight local memory notes exposed to an assistant.

Use Contextarr when you need structured packs, validation reports, source maps, license and freshness state, export profiles, and redaction-aware outputs.

How they can work together: Basic memory notes can become inputs or sources for draft Context Packs.

What Contextarr must not try to replace: Simple note capture for users who do not need structured pack readiness.

## Contextarr Vs Mem0/Zep/Graphiti Style Memory Layers

Use the other tool when an application needs runtime memory APIs, conversation memory, graph memory, or agent memory infrastructure.

Use Contextarr when humans need local, file-backed, reviewable context bundles with deterministic exports and read-only MCP.

How they can work together: A memory layer can consume exported Contextarr briefs or approved records, while Contextarr keeps the reviewed source bundle.

What Contextarr must not try to replace: Runtime application memory systems or hosted memory APIs.

## Contextarr Vs Generic RAG

Use the other tool when you need retrieval over large uncurated corpora, embeddings, semantic search, or chat over documents.

Use Contextarr when the winning artifact is a curated pack with source traceability, review status, redaction rules, and target-specific exports.

How they can work together: RAG can be an optional downstream or derived search layer later. Contextarr's source files and validation state remain the trusted control plane.

What Contextarr must not try to replace: Every document search or vector retrieval workflow.

## Contextarr Vs MCP Registries

Use the other tool when you need to discover MCP servers or tool connectors.

Use Contextarr when you need approved local context exposed through read-only tools, not a registry of executable integrations.

How they can work together: Contextarr can provide one safe local MCP server whose content comes from approved packs.

What Contextarr must not try to replace: MCP server discovery or tool ecosystem catalogs.

## Contextarr Vs Coding-Agent Repo Indexers

Use the other tool when the task is code navigation, symbol lookup, AST analysis, or direct repo understanding.

Use Contextarr when the task depends on cross-domain operational context, decisions, constraints, support processes, system facts, and portable AI briefs.

How they can work together: A coding agent can read code while Contextarr exports the project decisions, boundaries, workflow, and acceptance criteria that are not obvious from source files.

What Contextarr must not try to replace: Codex, Claude Code, Cursor, or any coding agent's native code index.

## Contextarr Vs Skill Marketplaces

Use the other tool when you want executable or provider-native skills managed by that ecosystem.

Use Contextarr when instructions and task kits need to be local, non-executable, source-backed, reviewed, and exported as briefs after Context Packs prove adoption.

How they can work together: Future Contextarr Skills can export instruction artifacts for downstream tools without becoming an execution runtime.

What Contextarr must not try to replace: Provider skill runtimes, public skill stores, or executable automation marketplaces.

## Conclusion

Contextarr should complement provider memory and coding agents. It should not pretend to replace them.
