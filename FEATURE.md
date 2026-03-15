# NeuronMCP Feature Summary

Short summary. For the accurate, scoped feature list (full / partial / not present), see **[FEATURES.md](FEATURES.md)**.

---

## What this repository provides

**MCP server:** JSON-RPC 2.0 over stdio (and optional HTTP/SSE); tool list and tool call; resource catalog (schema, models, indexes, config, workers, stats). Compatible with Claude Desktop and other MCP clients.

**Tools:** The server registers all tools at startup via `RegisterAllTools()` (650+ tools in code). There are no environment variables to select subsets (e.g. no “essential” or “PostgreSQL-only” mode). Categories include: vector search and indexing, embeddings, RAG, ML (train/predict/evaluate, clustering, AutoML, ONNX), PostgreSQL administration (100+ tools), hybrid search, reranking, dataset loading, workflow, debugging, composition. See [FEATURES.md](FEATURES.md) and [docs/tool-resource-catalog.md](docs/tool-resource-catalog.md).

**Resources:** Table/schema/index listings, model metadata, index stats, configuration (current, GPU, LLM), worker status, overview/performance/usage statistics.

**Config:** Environment variables and optional JSON config file (`NEURONDB_MCP_CONFIG` or `-c`). Env vars: `NEURONDB_*` (connection, logging), `NEURONMCP_HTTP_*`, `NEURONMCP_TLS_*`, `NEURONMCP_METRICS_API_KEY`, etc. See [docs/setup-guide.md](docs/setup-guide.md) and config loader in code.

**Security:** DB auth, input validation, SQL injection protection, output validation.

**Prerequisites:** PostgreSQL 16+; vector/ML/RAG/embedding/index tools require a compatible extension (see setup docs).

**Not in this repo:** Built-in LLM/embedding models (delegated to database and external providers).

---

## Counts (reference)

- Total tools in `RegisterAllTools`: 650+ (all registered at startup; no env-based filtering).
- PostgreSQL-related tools: 100+.

---

## Documentation

- **Full feature list:** [FEATURES.md](FEATURES.md)
- **Setup:** [docs/setup-guide.md](docs/setup-guide.md)
- **Tool and resource catalog:** [docs/tool-resource-catalog.md](docs/tool-resource-catalog.md)
- **Overview:** [docs/overview.md](docs/overview.md)
- **README:** [README.md](README.md)

[README](README.md) · [FEATURES.md](FEATURES.md)
