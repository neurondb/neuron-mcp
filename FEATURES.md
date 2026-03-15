# NeuronMCP Features

Capability matrix and feature reference for NeuronMCP.

| Status | Meaning |
|--------|--------|
| **Supported** | Feature is implemented and supported. |
| **Partial** | Feature has known limitations or dependencies (see section). |
| **Not supported** | Feature is out of scope. |

---

## Scope

NeuronMCP is an MCP (Model Context Protocol) server that exposes PostgreSQL and extension capabilities as MCP tools. This document lists its capabilities and support level by area.

---

## Summary

| Area | Capability | Status |
|------|------------|--------|
| MCP protocol | JSON-RPC 2.0, stdio transport, tool discovery, resources, tool execution | Supported |
| Tool count | 650+ tools when using full registration (`RegisterAllTools`) | Supported |
| Essential mode | 6 tools (PostgreSQL: version, execute_query, tables; vector: generate_embedding, vector_search; RAG: retrieve_context) for Claude Desktop 5-tool limit compatibility | Supported |
| PostgreSQL-only mode | 100+ PostgreSQL tools (no extension-specific tools) | Supported |
| Category-based selection | Register tools by category (e.g. vector, ml, rag, postgresql) | Supported |
| Vector tools | Search (L2, cosine, inner product, L1, Hamming, Chebyshev, Minkowski), similarity, index create, quantization, aggregates, batch distance, etc. | Supported |
| Embedding tools | Text, batch, image, multimodal, cached embeddings; model config CRUD | Supported |
| RAG tools | Process document, retrieve context, generate response; ingest, answer with citations, chunk; RAG evaluate, chat, hybrid, rerank, HyDE, graph, corrective, agentic, contextual, modular | Supported |
| ML tools | Train, predict, evaluate, list/get/delete models; batch predict; export; clustering, outliers, dimensionality reduction | Supported |
| Hybrid search tools | Hybrid search, text search, RRF, semantic+keyword, multi-vector, faceted, temporal, diverse | Supported |
| Rerank tools | Cross-encoder, LLM, Cohere, ColBERT, LTR, ensemble | Supported |
| Index tools | HNSW/IVF create, status, drop, tune | Supported |
| PostgreSQL tools | Version, stats, databases, connections, locks, replication, settings, extensions; tables, indexes, schemas, views, sequences, functions, triggers, constraints; users, roles, permissions; stats, sizes, vacuum, explain, query execution/cancel/kill, DDL/DML, backup, security/compliance, maintenance, HA; 100+ tools | Supported |
| Analytics tools | Analyze data, clustering, outliers, dimensionality reduction, quality metrics, drift detection, topic discovery | Supported |
| Time series / AutoML / ONNX | Time series tool, AutoML tool, ONNX tool | Supported |
| Debugging tools | Debug tool call, query plan, monitor connections, monitor performance, trace request | Supported |
| Composition tools | Tool chain, parallel, conditional, retry | Supported |
| Workflow tools | Create, execute, status, list workflows | Supported |
| Plugin tools | Marketplace, hot reload, versioning, sandbox, testing, builder | Supported |
| Resources | Schema (tables, indexes, etc.), models, indexes, config, workers, statistics | Supported |
| Config | Environment variables, config file, feature toggles, logging | Supported |
| Security | DB auth, input validation, SQL injection protection, output validation | Supported |

---

## Supported

**MCP protocol:** JSON-RPC 2.0 over stdio (and optional transports); tool list and tool call; resource catalog (schema, models, indexes, config, workers, stats). Compatible with Claude Desktop and other MCP clients.

**Registration modes:**
- **Essential:** 6 tools (fits Claude Desktop’s small tool limit).
- **PostgreSQL-only:** 100+ PostgreSQL tools, no NeuronDB-specific tools.
- **By category:** Register only selected categories (e.g. vector, ml, rag, postgresql).
- **Full:** 650+ tools (all vector, embedding, RAG, ML, hybrid, rerank, index, analytics, time series, AutoML, ONNX, graph, vecmap, dataset loading, workers, GPU, enterprise, PostgreSQL, debugging, composition, workflow, plugin tools).

**Vector:** Search (L2, cosine, inner product, L1, Hamming, Chebyshev, Minkowski), similarity, index creation, quantization (and analysis), aggregates, batch distance, normalize batch, similarity matrix, index statistics, dimension reduction, cluster analysis, anomaly detection, cache management.

**Embeddings:** Generate embedding, batch embedding, image embed, multimodal embed, cached embed; configure embedding model, get/list/delete model configs.

**RAG:** Process document, retrieve context, generate response; ingest documents, answer with citations, chunk document; RAG evaluate, chat, hybrid, rerank, HyDE, graph, corrective, agentic, contextual, modular.

**ML:** Train model, predict, evaluate, list models, get model info, delete model, predict batch, export model; cluster data, detect outliers, reduce dimensionality. Algorithm support depends on NeuronDB (e.g. classification, regression, clustering).

**Hybrid search:** Hybrid search, text search, reciprocal rank fusion, semantic+keyword, multi-vector, faceted, temporal, diverse.

**Rerank:** Cross-encoder, LLM, Cohere, ColBERT, LTR, ensemble.

**Index management:** Create HNSW/IVF index, index status, drop index, tune HNSW/IVF.

**PostgreSQL:** Large set of tools for server info, object listing, users/roles/permissions, performance/size/vacuum, administration, query execution and planning, database/schema/user/role management, DDL/DML, backup/restore, security/compliance, maintenance, high availability. Exact count in `internal/tools/register.go` (RegisterPostgreSQLOnlyTools and RegisterAllTools).

**Analytics:** Analyze data, cluster, outliers, dimensionality reduction, quality metrics, drift detection, topic discovery.

**Time series, AutoML, ONNX:** One tool each for time series, AutoML, and ONNX operations (backed by NeuronDB).

**Debugging:** Debug tool call, query plan, monitor connections, monitor performance, trace request.

**Composition:** Chain, parallel, conditional, retry.

**Workflow:** Create workflow, execute, status, list.

**Plugin:** Marketplace, hot reload, versioning, sandbox, testing, builder.

**Resources:** Table/schema/index listings and details, model listings and metadata, index listings and stats, configuration (current, GPU, LLM), worker listings and status, overview/performance/usage statistics.

**Configuration:** Environment variables, JSON config file, feature toggles, log level. Connection pooling to PostgreSQL.

**Safety:** Input validation, SQL injection protection, output validation; database authentication.

---

## Partial support

**Claude Desktop:** Default “5-tool limit” is addressed by essential mode (6 tools); for more tools, use category-based or full registration and note client limits.

**Database dependency:** All vector/ML/RAG/embedding/index tools require a running PostgreSQL instance with a compatible extension; behavior and algorithm set depend on that extension's version.

---

## Out of scope

- **Built-in LLM/embedding models:** Model execution is delegated to the database and external providers; NeuronMCP does not ship models.

---

## Counts (reference)

- **Total tools in RegisterAllTools:** 666 (see `internal/tools/register.go`). Documented as “650+ tools.”
- **Essential mode:** 6 tools.
- **PostgreSQL-only mode:** 100+ tools (exact count in register.go).

---

## Documentation

- [README](README.md)
- [Setup guide](docs/setup-guide.md)
- [Tool and resource catalog](docs/tool-resource-catalog.md)
- [Overview](docs/overview.md)

---

[Back to top](#neuronmcp-features) · [README](README.md)
