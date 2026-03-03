# 🔌 NeuronMCP

<div align="center">

**Model Context Protocol (MCP) server with 600+ tools for NeuronDB**

[![Status](https://img.shields.io/badge/status-stable-brightgreen)](.)
[![Tools](https://img.shields.io/badge/tools-600+-green)](.)
[![Protocol](https://img.shields.io/badge/protocol-MCP-blue)](.)

</div>

---

> [!TIP]
> NeuronMCP provides a complete MCP protocol implementation. It includes 600+ tools for vector operations, ML, RAG, PostgreSQL administration, debugging, composition, workflow, plugins, and more.

---

## 📋 What It Is

NeuronMCP is a Model Context Protocol (MCP) server providing comprehensive tools and resources for MCP-compatible clients to interact with NeuronDB.

| Feature | Description | Status |
|---------|-------------|--------|
| **MCP Protocol Server** | Full JSON-RPC 2.0 implementation with stdio, HTTP, and SSE transport | ✅ Stable |
| **Tool Server** | 600+ tools covering vector operations, ML, RAG, PostgreSQL administration, dataset loading, debugging, composition, workflow, plugins, and more | ✅ Stable |
| **Resource Provider** | Schema, models, indexes, config, workers, and stats with real-time subscriptions | ✅ Stable |
| **Enterprise Platform** | Middleware system, authentication, caching, metrics, webhooks, and resilience features | ✅ Stable |

## Key Features & Modules

### MCP Protocol Implementation
- **JSON-RPC 2.0**: Full protocol implementation with stdio, HTTP, and SSE transport modes
- **Batch Operations**: Transactional batch tool calls (tools/call_batch) for efficient bulk operations
- **Progress Tracking**: Long-running operation progress with progress/get for monitoring
- **Tool Discovery**: Search and filter tools with categorization and metadata
- **Prompts Protocol**: Full prompts/list and prompts/get with template engine support
- **Sampling/Completions**: sampling/createMessage with streaming support for LLM interactions

### Vector Operations (100+ Tools)

Comprehensive vector operations: distance metrics (L2, cosine, inner product, etc.), HNSW and IVF indexes, embedding generation, index management, quantization, vector arithmetic, multi-vector search, hybrid search.

### ML Tools & Pipeline

Complete machine learning pipeline with 52+ algorithms: training, prediction, evaluation, AutoML, ONNX support, time series, analytics.

### RAG Operations

Document processing, context retrieval, response generation, reranking, hybrid retrieval.

### PostgreSQL Administration (100+ Tools)

Server information, database object management, user and role management, performance and statistics, backup and recovery, schema modification, and more.

### Dataset Loading

HuggingFace, URL sources, GitHub, S3, local files with auto-embedding and index creation.

### Middleware System

Validation, logging, timeout handling, error handling, authentication (JWT, API keys, OAuth2), rate limiting.

## Documentation

- **Main README**: [../README.md](../README.md)
- **Features**: [features.md](features.md)
- **Tool Catalog**: [tool-resource-catalog.md](tool-resource-catalog.md)
- **PostgreSQL Tools**: [postgresql-tools.md](postgresql-tools.md)
- **Setup Guide**: [setup-guide.md](setup-guide.md)
- **Examples**: [examples/](examples/)

## Docker

- Compose service: `neuronmcp` (plus GPU-profile variants)
- From repo root: `docker compose up -d neuronmcp`
- See: neuron-mcp repo `docker/` or deployment docs

## Quick Start

### Minimal Verification

```bash
# Test MCP server (requires MCP client)
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | ./neurondb-mcp
```

### Using with Claude Desktop

Create Claude Desktop configuration file. See [setup-guide.md](setup-guide.md) and [neurondb-mcp-setup.md](neurondb-mcp-setup.md) for complete setup instructions.

For complete setup instructions, see the **neuron-mcp** repo [README](../README.md).
