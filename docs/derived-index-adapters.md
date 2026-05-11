# Derived Index Adapters

Status: future export and integration direction.

Contextarr is not a vector database, graph database, code graph engine, Graphify replacement, or managed RAG app.

The integration path is derived index adapters: Contextarr remains the canonical, reviewed, source-backed context layer, while external retrieval and graph tools consume explicit redacted exports.

```text
Local files
  -> Contextarr Context Packs
  -> validation, health, review, redaction, source maps, freshness
  -> export profile
  -> external derived index
  -> vector store, graph database, RAG stack, Graphify, or agent runtime
```

## Product Boundary

Contextarr should prepare clean inputs for retrieval tools. It should not become the retrieval tool.

Build later:

- Derived export profiles for vector, RAG, and graph seed formats.
- CLI-first local file outputs.
- Recipes for importing those files into user-selected tools.
- Optional example adapter scripts after real demand exists.

Do not build:

- Built-in vector database.
- Built-in graph database.
- Built-in embedding service.
- AST or code graph engine.
- Generic hosted RAG app.
- External database sync service.
- Always-on indexer.
- Hidden embedding calls.
- Direct writes to Qdrant, Chroma, LanceDB, Neo4j, Kuzu, Graphify, or other external services from the core.

## Canonical Source Rule

Every downstream index is disposable and rebuildable. Context Packs remain the source of truth.

Derived index records must preserve enough identity and provenance for a downstream search result to point back to Contextarr:

- `packId`
- `recordId`
- `sourceIds`
- `reviewStatus`
- `privacy`
- `redactionMode`
- `freshness`
- `exportProfileId`
- `generatedAt`
- `contentHash`

If an agent retrieves a hit from a vector store or graph, the safer flow is to use those IDs to ask Contextarr for the current approved record or export preview instead of trusting stale copied text.

## Future Export Targets

Candidate target names:

- `vector_jsonl`
- `rag_markdown`
- `llamaindex_jsonl`
- `langchain_jsonl`
- `qdrant_jsonl`
- `chroma_jsonl`
- `graph_seed_json`
- `graph_edges_json`
- `graphify_seed`
- `neo4j_csv`
- `kuzu_csv`

These targets are not implemented in the current checkout. They should start as explicit CLI exports, not API writes to external databases.

Example future command shape:

```bash
contextarr export ai-workstation-pack --target vector_jsonl --privacy redacted --out dist/ai-workstation.vector.jsonl
contextarr export ai-workstation-pack --target graph_edges_json --privacy redacted --out dist/ai-workstation.graph.json
contextarr export contextarr-project-pack --target graphify_seed --privacy redacted --out .contextarr/graphify/contextarr-context.jsonl
```

## Record Shape

Future derived index records should be structured and source-mapped:

```json
{
  "schemaVersion": "contextarr.derived-index-record.v1",
  "packId": "ai-workstation-pack",
  "recordId": "ai-workstation.local-ai-stack",
  "recordTitle": "Local AI Stack",
  "recordType": "system_component",
  "body": "Approved redacted Markdown body...",
  "summary": "Short retrieval summary...",
  "tags": ["ai", "local", "inference"],
  "privacy": "public_safe",
  "reviewStatus": "approved",
  "confidence": "high",
  "freshness": "current",
  "sources": [
    {
      "sourceId": "lm-studio-docs",
      "title": "LM Studio Documentation",
      "trust": "official",
      "licenseStatus": "unknown"
    }
  ],
  "redaction": {
    "mode": "redacted",
    "warnings": []
  },
  "chunking": {
    "strategy": "record_section",
    "chunkId": "ai-workstation.local-ai-stack.summary"
  },
  "contentHash": "sha256:example"
}
```

Graph-oriented exports may add explicit edges:

```json
{
  "schemaVersion": "contextarr.derived-index-edge.v1",
  "from": "ai-workstation.local-ai-stack",
  "to": "ai-workstation.gpus",
  "type": "depends_on",
  "source": "contextarr_explicit_reference",
  "confidence": "high"
}
```

## Graphify Integration

Graphify and similar tools should remain downstream graph or codebase intelligence layers.

The intended relationship is:

- Graphify maps repo structure, files, code, docs, and multimodal project material.
- Contextarr maintains curated project, ops, product, user, workflow, handoff, and governance context.
- Agents can use both surfaces.
- Contextarr exports only reviewed, redacted, source-mapped derived seed data.

Contextarr should not compete with Graphify as a code graph engine.

## Phasing

### D1: Adapter Spec

Current phase: this document and master-plan placement.

Define:

- Derived index principles.
- Export schema.
- Chunking rules.
- Source map preservation.
- Redaction rules.
- No hidden embedding calls.
- No external database writes by default.

### D2: Export Profiles

Add export profiles for the first vector and graph seed formats after core export maturity remains stable.

### D3: CLI-First Output

Start with local files:

- JSONL for vector/RAG tools.
- JSON or CSV for graph seed data.
- Markdown corpus exports for simple local RAG tools.

No direct writes to external databases in this phase.

### D4: Recipes

Document copyable examples for importing Contextarr exports into:

- Qdrant.
- Chroma.
- LanceDB.
- LlamaIndex.
- LangChain.
- Neo4j.
- Kuzu.
- Graphify-adjacent workflows.

### D5: Optional Example Scripts

Only after demand:

- `examples/adapters/qdrant-import.ts`
- `examples/adapters/chroma-import.py`
- `examples/adapters/neo4j-import.cypher`
- `examples/adapters/kuzu-import.sql`

These stay examples, not core runtime behavior.

## Gate

Derived Index Adapters can graduate only if:

- Default exports remain redacted and review-aware.
- Draft, private, sensitive, secret, and `never_export` content stays excluded unless a future explicit policy allows it.
- Exports include provenance and content hashes.
- No hidden network calls or embedding calls are added.
- No external service credentials are required by the core.
- Contextarr can still delete and rebuild derived local state from source files.
