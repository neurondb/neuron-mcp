# NeuronMCP

<div align="center">

**Model Context Protocol server for NeuronDB PostgreSQL extension, implemented in Go**

Enables MCP-compatible clients to access NeuronDB vector search, ML algorithms, and RAG capabilities.

[![Go](https://img.shields.io/badge/Go-1.23+-00ADD8.svg)](https://golang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-blue.svg)](https://modelcontextprotocol.io/)
[![Version](https://img.shields.io/badge/version-3.0.0--devel-blue.svg)](https://github.com/neurondb/neurondb)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-neurondb.ai-brightgreen.svg)](https://www.neurondb.ai/docs/neuronmcp)

</div>

## Overview

NeuronMCP implements the Model Context Protocol using JSON-RPC 2.0 over stdio. It provides tools and resources for MCP clients to interact with NeuronDB, including vector operations, ML model training, and database schema management.

### Key Capabilities

- **MCP Protocol** — Full JSON-RPC 2.0 implementation with stdio, HTTP, and SSE transport
- **650+ Tools** — Vector ops, ML, RAG, PostgreSQL administration, debugging, composition, workflow, plugins. See [FEATURES.md](FEATURES.md).
- **Resources** — Real-time access to schema, models, indexes, and system stats
- **Enterprise Security** — JWT, API keys, OAuth2, rate limiting, and audit logging
- **High Performance** — TTL caching, connection pooling, and optimized query execution
- **Observability** — Prometheus metrics, structured logging, and health checks

## Table of Contents

<details>
<summary><strong>Expand full table of contents</strong></summary>

- [Overview](#overview)
  - [Key Capabilities](#key-capabilities)
- [Documentation](#documentation)
- [Tools and Claude Desktop](#tools-and-claude-desktop)
- [Official Documentation](#official-documentation)
- [Features](#features)
- [Architecture](#architecture)
  - [System Architecture](#system-architecture)
  - [MCP Protocol Flow](#mcp-protocol-flow)
  - [Tool Catalog Overview](#tool-catalog-overview)
- [Quick Start](#quick-start)
- [MCP Protocol](#mcp-protocol)
- [Configuration](#configuration)
- [Tools](#tools)
- [Resources](#resources)
- [Using with Claude Desktop](#using-with-claude-desktop)
- [Using with Other MCP Clients](#using-with-other-mcp-clients)
- [Documentation](#documentation-1)
- [System Requirements](#system-requirements)
- [Integration with NeuronDB](#integration-with-neurondb)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Support](#support)
- [License](#license)

</details>

---

## Documentation

- **[Features](docs/features.md)** - Complete feature list and capabilities
- **[Tool & Resource Catalog](docs/tool-resource-catalog.md)** - Complete catalog of all tools and resources
- **[Setup Guide](docs/neurondb-mcp-setup.md)** - Setup and configuration guide

## Tools and Claude Desktop

The server registers all available tools at startup (650+ tools: vector, ML, RAG, PostgreSQL administration, and more). There is no environment variable to limit or filter which tools are registered.

**Claude Desktop:** Some MCP clients, including Claude Desktop, may impose a limit on how many tools they display or use. If you hit that limit, use a different MCP client (e.g. the included `neuron-mcp-client`) or run the server in a context where the full tool set is needed. See [Setup Guide](docs/setup-guide.md) for Claude Desktop configuration.

Example configuration (use the path to your built binary, e.g. `./bin/neuron-mcp`):

```json
{
  "mcpServers": {
    "neurondb": {
      "command": "/path/to/neuron-mcp",
      "env": {
        "NEURONDB_HOST": "localhost",
        "NEURONDB_PORT": "5432",
        "NEURONDB_DATABASE": "neurondb",
        "NEURONDB_USER": "neurondb",
        "NEURONDB_PASSWORD": "your_password"
      }
    }
  }
}
```

## Official Documentation

**[https://www.neurondb.ai/docs/neuronmcp](https://www.neurondb.ai/docs/neuronmcp)** — Tool reference, Claude Desktop setup, and configuration.

## Features

<details>
<summary><strong>Complete Feature List</strong></summary>

| Feature | Description | Count |
|:--------|:------------|:-----|
| **MCP Protocol** | Full JSON-RPC 2.0 implementation with stdio, HTTP, and SSE transport | Yes |
| **Vector Operations** | Vector search (L2, cosine, inner product), embedding generation, indexing (HNSW, IVF), quantization | 100+ tools |
| **ML Tools** | ML pipeline: training, prediction, evaluation, AutoML, ONNX, time series (backed by NeuronDB; 25+ algorithm families) | Yes |
| **RAG Operations** | Document processing, context retrieval, response generation with multiple reranking methods | Yes |
| **PostgreSQL Tools** | Complete database control: DDL, DML, DCL, user/role management, backup/restore | 100+ tools |
| **Debugging Tools** | Debug tool calls, query plans, monitor connections and performance, trace requests | 5+ tools |
| **Composition Tools** | Tool chaining, parallel execution, conditional execution, retry logic | 4+ tools |
| **Workflow Tools** | Create, execute, monitor workflows | 4+ tools |
| **Plugin Tools** | Marketplace, hot reload, versioning, sandbox, testing, builder | 6+ tools |
| **Dataset Loading** | Load from HuggingFace, URLs, GitHub, S3, local files with auto-embedding | Yes |
| **Resources** | Schema, models, indexes, config, workers, stats with real-time subscriptions | 6+ resources |
| **Prompts Protocol** | Full prompts/list and prompts/get with template engine | Yes |
| **Sampling/Completions** | sampling/createMessage with streaming support | Yes |
| **Progress Tracking** | Long-running operation progress with progress/get | Yes |
| **Batch Operations** | Transactional batch tool calls (tools/call_batch) | Yes |
| **Tool Discovery** | Search and filter tools with categorization | Yes |
| **Middleware System** | Request validation, logging, timeouts, error handling, auth, rate limiting | Yes |
| **Security** | JWT, API keys, OAuth2, rate limiting, request validation, secure storage | Yes |
| **Performance** | TTL caching, connection pooling, optimized query execution | Yes |
| **Enterprise Features** | Prometheus metrics, webhooks, circuit breaker, retry, health checks | Yes |
| **Modular Architecture** | 19 independent packages with clean separation of concerns | Yes |

</details>

For a detailed comparison with other MCP servers, see [docs/tool-resource-catalog.md](docs/tool-resource-catalog.md) and the [MCP protocol spec](https://modelcontextprotocol.io/).

## Architecture

### System Architecture

```mermaid
graph TB
    subgraph CLIENT["MCP Clients"]
        CLAUDE[Claude Desktop]
        CUSTOM[Custom MCP Clients]
        CLI[CLI Tools]
    end
    
    subgraph MCP["NeuronMCP Server"]
        PROTOCOL[MCP Protocol Handler<br/>JSON-RPC 2.0]
        TOOLS[Tool Registry<br/>650+ Tools]
        RESOURCES[Resource Manager<br/>Schema, Models, Indexes]
        MIDDLEWARE[Middleware Pipeline<br/>Auth, Logging, Rate Limit]
        CACHE[TTL Cache<br/>Idempotency]
    end
    
    subgraph CATEGORIES["Tool Categories"]
        VEC[Vector Operations<br/>50+ tools]
        ML[ML Pipeline<br/>25+ algorithm families]
        RAG[RAG Operations<br/>Document processing]
        PG[PostgreSQL Tools<br/>100+ DDL/DML/DCL<br/>650+ total tools]
        DATASET[Dataset Loading<br/>HuggingFace, S3, GitHub]
    end
    
    subgraph DB["NeuronDB PostgreSQL"]
        VECTOR[Vector Search<br/>HNSW/IVF]
        EMBED[Embeddings<br/>Text/Image/Multimodal]
        ML_FUNC[ML Functions<br/>25+ algorithm families]
        ADMIN[PostgreSQL Admin<br/>Full DDL/DML/DCL]
    end
    
    CLAUDE -->|stdio| PROTOCOL
    CUSTOM -->|stdio/HTTP/SSE| PROTOCOL
    CLI -->|stdio| PROTOCOL
    
    PROTOCOL --> MIDDLEWARE
    MIDDLEWARE --> CACHE
    CACHE --> TOOLS
    CACHE --> RESOURCES
    
    TOOLS --> VEC
    TOOLS --> ML
    TOOLS --> RAG
    TOOLS --> PG
    TOOLS --> DATASET
    
    VEC --> VECTOR
    ML --> ML_FUNC
    RAG --> EMBED
    PG --> ADMIN
    DATASET --> VECTOR
    
    style CLIENT fill:#e3f2fd
    style MCP fill:#fff3e0
    style CATEGORIES fill:#f3e5f5
    style DB fill:#e8f5e9
```

### MCP Protocol Flow

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as NeuronMCP Server
    participant Tools as Tool Registry
    participant DB as NeuronDB
    
    Client->>Server: Initialize (JSON-RPC)
    Server-->>Client: Server Capabilities
    
    Client->>Server: tools/list
    Server->>Tools: Get available tools
    Tools-->>Server: Tool catalog
    Server-->>Client: Tool list (650+ tools)
    
    Client->>Server: tools/call {"name": "vector_search", ...}
    Server->>Server: Validate & authenticate
    Server->>Tools: Execute tool
    Tools->>DB: Execute SQL query
    DB-->>Tools: Query results
    Tools-->>Server: Tool response
    Server-->>Client: JSON-RPC response
    
    Note over Client,DB: Streaming supported via SSE
```

### Tool Catalog Overview

```mermaid
graph LR
    subgraph TOOLS["650+ Tools"]
        VEC_TOOLS[Vector Operations<br/>Search, Embeddings, Indexing]
        ML_TOOLS[ML Pipeline<br/>25+ algorithm families<br/>Training, Prediction, Evaluation]
        RAG_TOOLS[RAG Operations<br/>Document Processing<br/>Context Retrieval]
        PG_TOOLS[PostgreSQL Tools<br/>100+ tools<br/>DDL, DML, DCL, Admin]
        DATASET_TOOLS[Dataset Loading<br/>HuggingFace, S3, GitHub<br/>Auto-embedding]
    end
    
    style VEC_TOOLS fill:#ffebee
    style ML_TOOLS fill:#e8f5e9
    style RAG_TOOLS fill:#fff3e0
    style PG_TOOLS fill:#e3f2fd
    style DATASET_TOOLS fill:#f3e5f5
```

> Use the [Setup Guide](docs/setup-guide.md) for Claude Desktop. If your client limits the number of tools, use another MCP client such as the included `neuron-mcp-client`.

## Quick Start

### Prerequisites

<details>
<summary><strong>Prerequisites Checklist</strong></summary>

- [ ] PostgreSQL 16 or later installed
- [ ] NeuronDB extension installed and enabled
- [ ] Go 1.23 or later (for building from source)
- [ ] MCP-compatible client (e.g., Claude Desktop)
- [ ] API keys configured (for LLM models, if using embeddings/RAG)

</details>

### Database Setup

**Option 1: Using Docker Compose (recommended for quick start)**

If you have PostgreSQL with NeuronDB (e.g. from the [neurondb](https://github.com/neurondb/neurondb) repo Docker setup):

```bash
# Create extension if not already created
psql "postgresql://neurondb:neurondb@localhost:5433/neurondb" -c "CREATE EXTENSION IF NOT EXISTS neurondb;"
```

**Option 2: Native PostgreSQL Installation**

```bash
createdb neurondb
psql -d neurondb -c "CREATE EXTENSION neurondb;"
```

NeuronMCP can use an optional database schema for LLM model config, API keys, index templates, worker settings, and tool defaults. Run `./scripts/neuronmcp-setup.sh` from the repository root to set it up. See [neurondb-mcp-setup.md](docs/neurondb-mcp-setup.md) for details.

### Configuration

Create `mcp-config.json`:

```json
{
  "database": {
    "host": "localhost",
    "port": 5433,
    "database": "neurondb",
    "user": "neurondb",
    "password": "neurondb"
  },
  "server": {
    "name": "neurondb-mcp-server",
    "version": "2.0.0"
  },
  "logging": {
    "level": "info",
    "format": "text"
  },
  "features": {
    "vector": { "enabled": true },
    "ml": { "enabled": true },
    "analytics": { "enabled": true }
  }
}
```

Or use environment variables:

```bash
export NEURONDB_HOST=localhost
export NEURONDB_PORT=5432
export NEURONDB_DATABASE=neurondb
export NEURONDB_USER=neurondb
export NEURONDB_PASSWORD=neurondb
```

### Build and Run

#### Run the server

From the repository root:

```bash
make build
export NEURONDB_HOST=localhost NEURONDB_PORT=5432 NEURONDB_DATABASE=neurondb NEURONDB_USER=neurondb NEURONDB_PASSWORD=neurondb
./bin/neuron-mcp
```

Optional: pass a config file with `-c` or set `NEURONDB_MCP_CONFIG` to the path of your `mcp-config.json`.

Test: run the included client to list tools:

```bash
./bin/neuron-mcp-client ./bin/neuron-mcp tools/list
```

Or send a raw JSON-RPC initialize to confirm the server responds:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | ./bin/neuron-mcp
```

#### Automated Setup (recommended)

Use the setup script for database schema (optional LLM/config tables):

```bash
# From repository root
./scripts/neuronmcp-setup.sh

# With system service enabled (if supported)
./scripts/neuronmcp-setup.sh --enable-service
```

Use `scripts/neuronmcp-run.sh` or `scripts/neuronmcp-run-server.sh` to run the server.

#### Manual build (without Makefile)

```bash
go build -o bin/neuron-mcp ./cmd/neurondb-mcp
./bin/neuron-mcp
```

#### Using Docker

This repo does not include a `docker-compose.yml`. Build and run the image manually:

```bash
# From repository root
docker build -f docker/Dockerfile -t neurondb-mcp:latest .

docker run -i --rm \
  -e NEURONDB_HOST=localhost \
  -e NEURONDB_PORT=5432 \
  -e NEURONDB_DATABASE=neurondb \
  -e NEURONDB_USER=neurondb \
  -e NEURONDB_PASSWORD=neurondb \
  neurondb-mcp:latest
```

For full-stack Docker (NeuronDB + NeuronMCP), use the neurondb repository or deploy each component from its repo.

#### Running as a Service

For systemd (Linux) or launchd (macOS), see your system documentation or the [neurondb installation services guide](https://github.com/neurondb/neurondb/blob/main/docs/getting-started/installation-services.md) for patterns.

## MCP Protocol

NeuronMCP uses Model Context Protocol over stdio:

- Communication via stdin and stdout
- Messages follow JSON-RPC 2.0 format
- Clients initiate all requests
- Server responds with results or errors

Example request:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "vector_search",
    "arguments": {
      "query_vector": [0.1, 0.2, 0.3],
      "table": "documents",
      "limit": 10
    }
  }
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEURONDB_HOST` | `localhost` | Database hostname |
| `NEURONDB_PORT` | `5432` | Database port |
| `NEURONDB_DATABASE` | `neurondb` | Database name |
| `NEURONDB_USER` | `neurondb` | Database username |
| `NEURONDB_PASSWORD` | `neurondb` | Database password |
| `NEURONDB_CONNECTION_STRING` | - | Full connection string (overrides above) |
| `NEURONDB_MCP_CONFIG` | `mcp-config.json` | Path to config file |
| `NEURONDB_LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |
| `NEURONDB_LOG_FORMAT` | `text` | Log format (json, text) |
| `NEURONDB_LOG_OUTPUT` | `stderr` | Log output (stdout, stderr, file) |
| `NEURONDB_ENABLE_GPU` | `false` | Enable GPU acceleration |

### Configuration File

See `mcp-config.json.example` for complete configuration structure. Environment variables override configuration file values.

## Tools

NeuronMCP provides comprehensive tools covering all NeuronDB capabilities:

| Tool Category | Tools |
|---------------|-------|
| **Vector Operations** | `vector_search`, `vector_search_l2`, `vector_search_cosine`, `vector_search_inner_product`, `vector_search_l1`, `vector_search_hamming`, `vector_search_chebyshev`, `vector_search_minkowski`, `vector_similarity`, `vector_arithmetic`, `vector_distance`, `vector_similarity_unified` |
| **Vector Quantization** | `vector_quantize`, `quantization_analyze` (int8, fp16, binary, uint8, ternary, int4) |
| **Embeddings** | `generate_embedding`, `batch_embedding`, `embed_image`, `embed_multimodal`, `embed_cached`, `configure_embedding_model`, `get_embedding_model_config`, `list_embedding_model_configs`, `delete_embedding_model_config` |
| **Hybrid Search** | `hybrid_search`, `reciprocal_rank_fusion`, `semantic_keyword_search`, `multi_vector_search`, `faceted_vector_search`, `temporal_vector_search`, `diverse_vector_search` |
| **Reranking** | `rerank_cross_encoder`, `rerank_llm`, `rerank_cohere`, `rerank_colbert`, `rerank_ltr`, `rerank_ensemble` |
| **ML Operations** | `train_model`, `predict`, `predict_batch`, `evaluate_model`, `list_models`, `get_model_info`, `delete_model`, `export_model` |
| **Analytics** | `analyze_data`, `cluster_data`, `reduce_dimensionality`, `detect_outliers`, `quality_metrics`, `detect_drift`, `topic_discovery` |
| **Time Series** | `timeseries_analysis` (ARIMA, forecasting, seasonal decomposition) |
| **AutoML** | `automl` (model selection, hyperparameter tuning, auto training) |
| **ONNX** | `onnx_model` (import, export, info, predict) |
| **Index Management** | `create_hnsw_index`, `create_ivf_index`, `index_status`, `drop_index`, `tune_hnsw_index`, `tune_ivf_index` |
| **RAG Operations** | `process_document`, `retrieve_context`, `generate_response`, `chunk_document` |
| **Workers & GPU** | `worker_management`, `gpu_info` |
| **Vector Graph** | `vector_graph` (BFS, DFS, PageRank, community detection) |
| **Vecmap Operations** | `vecmap_operations` (distances, arithmetic, norm on sparse vectors) |
| **Dataset Loading** | `load_dataset` (HuggingFace, URLs, GitHub, S3, local files with auto-embedding) |
| **PostgreSQL (100+ tools)** | Complete PostgreSQL control: **DDL** (CREATE/ALTER/DROP for databases, schemas, tables, indexes, views, functions, triggers, sequences, types, domains, materialized views, partitions, foreign tables), **DML** (INSERT, UPDATE, DELETE, TRUNCATE, COPY), **DCL** (GRANT/REVOKE), **User/Role Management** (CREATE/ALTER/DROP USER/ROLE), **Backup/Recovery** (pg_dump/pg_restore), **Security** (SQL validation, permission checking, audit), plus all administration, monitoring, and statistics tools |

**Tool reference:** [Tool & Resource Catalog](docs/tool-resource-catalog.md). **PostgreSQL tools:** [docs/postgresql-tools.md](docs/postgresql-tools.md).

For example client usage and interaction transcripts, see [docs/examples/](docs/examples/).

### Dataset Loading Examples

The `load_dataset` tool supports multiple data sources with automatic schema detection, embedding generation, and index creation:

#### HuggingFace Datasets

```json
{
  "name": "load_dataset",
  "arguments": {
    "source_type": "huggingface",
    "source_path": "sentence-transformers/embedding-training-data",
    "split": "train",
    "limit": 10000,
    "auto_embed": true,
    "embedding_model": "default"
  }
}
```

#### URL Datasets (CSV, JSON, Parquet)

```json
{
  "name": "load_dataset",
  "arguments": {
    "source_type": "url",
    "source_path": "https://example.com/data.csv",
    "format": "csv",
    "auto_embed": true,
    "create_indexes": true
  }
}
```

#### GitHub Repositories

```json
{
  "name": "load_dataset",
  "arguments": {
    "source_type": "github",
    "source_path": "owner/repo/path/to/data.json",
    "auto_embed": true
  }
}
```

#### S3 Buckets

```json
{
  "name": "load_dataset",
  "arguments": {
    "source_type": "s3",
    "source_path": "s3://my-bucket/data.parquet",
    "auto_embed": true
  }
}
```

#### Local Files

```json
{
  "name": "load_dataset",
  "arguments": {
    "source_type": "local",
    "source_path": "/path/to/local/file.jsonl",
    "schema_name": "my_schema",
    "table_name": "my_table",
    "auto_embed": true
  }
}
```

**Key Features:**
- **Automatic Schema Detection**: Analyzes data types and creates optimized PostgreSQL tables
- **Auto-Embedding**: Automatically detects text columns and generates vector embeddings using NeuronDB
- **Index Creation**: Creates HNSW indexes for vectors, GIN indexes for full-text search
- **Batch Loading**: Efficient bulk loading with progress tracking
- **Multiple Formats**: Supports CSV, JSON, JSONL, Parquet, and HuggingFace datasets

## Resources

NeuronMCP exposes the following resources:

| Resource | Description |
|----------|-------------|
| `schema` | Database schema information |
| `models` | Available ML models |
| `indexes` | Vector index configurations |
| `config` | Server configuration |
| `workers` | Background worker status |
| `stats` | Database and system statistics |

## Using with Claude Desktop

NeuronMCP is fully compatible with Claude Desktop on macOS, Windows, and Linux.

Create Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**Linux:** `~/.config/Claude/claude_desktop_config.json`

See the example configuration files in this directory (`claude_desktop_config.*.json`) for platform-specific examples.

Example configuration:

```json
{
  "mcpServers": {
    "neurondb": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--network", "neurondb-network",
        "-e", "NEURONDB_HOST=neurondb-cpu",
        "-e", "NEURONDB_PORT=5432",
        "-e", "NEURONDB_DATABASE=neurondb",
        "-e", "NEURONDB_USER=neurondb",
        "-e", "NEURONDB_PASSWORD=neurondb",
        "neurondb-mcp:latest"
      ]
    }
  }
}
```

Or use local binary:

```json
{
  "mcpServers": {
    "neurondb": {
      "command": "/path/to/neuron-mcp",
      "env": {
        "NEURONDB_HOST": "localhost",
        "NEURONDB_PORT": "5432",
        "NEURONDB_DATABASE": "neurondb",
        "NEURONDB_USER": "neurondb",
        "NEURONDB_PASSWORD": "neurondb"
      }
    }
  }
}
```

Use the full path to your built binary (e.g. `/home/user/neuron-mcp/bin/neuron-mcp`).

Restart Claude Desktop after configuration changes.

## Using with Other MCP Clients

Run NeuronMCP interactively for testing:

```bash
./bin/neuron-mcp
```

Send JSON-RPC messages via stdin, receive responses via stdout.

### Using neuron-mcp-client

A simple MCP client that works like Claude Desktop. It handles the full MCP protocol including the initialize handshake.

Build the client (included in `make build`):

```bash
make build
```

Usage:

```bash
# Initialize and list tools
./bin/neuron-mcp-client ./bin/neuron-mcp tools/list

# Call a tool
./bin/neuron-mcp-client ./bin/neuron-mcp tools/call '{"name":"vector_search","arguments":{}}'

# List resources
./bin/neuron-mcp-client ./bin/neuron-mcp resources/list
```

The client automatically:
- Sends initialize request with proper headers (exactly like Claude Desktop)
- Reads initialize response
- Reads initialized notification
- Then sends your requests and reads responses

Test script:

```bash
cd src/client
./example_usage.sh
```

Or use the Python client:

```bash
cd src/client
python neurondb_mcp_client.py -c ../tests/neuronmcp_server.json -e "list_tools"
```

For Docker:

```bash
docker run -i --rm \
  -e NEURONDB_HOST=localhost \
  -e NEURONDB_PORT=5432 \
  -e NEURONDB_DATABASE=neurondb \
  -e NEURONDB_USER=neurondb \
  -e NEURONDB_PASSWORD=neurondb \
  neurondb-mcp:latest
```

Build the image first: `docker build -f docker/Dockerfile -t neurondb-mcp:latest .` from the repository root.

## Documentation

| Document | Description |
|----------|-------------|
| [docker/](docker/) | Dockerfile and entrypoint for container deployment |
| [MCP Specification](https://modelcontextprotocol.io/) | Model Context Protocol documentation |
| [Claude Desktop Config Examples](claude_desktop_config.json) | Example configurations for macOS, Linux, and Windows |

## System Requirements

| Component | Requirement |
|-----------|-------------|
| PostgreSQL | 16 or later |
| NeuronDB Extension | Installed and enabled ([install](https://github.com/neurondb/neurondb)) |
| Go | 1.23 or later (for building) |
| MCP Client | MCP-compatible client |

Related: [NeuronDB](https://github.com/neurondb/neurondb) (extension), [NeuronAgent](https://github.com/neurondb/neuron-agent) (agent runtime).

## Integration with NeuronDB

NeuronMCP requires PostgreSQL 16+ with the NeuronDB extension. Install NeuronDB first: [neurondb repository](https://github.com/neurondb/neurondb) ([Simple Start](https://github.com/neurondb/neurondb/blob/main/docs/getting-started/simple-start.md)). Full-stack deployment (NeuronDB + NeuronMCP + other components) is documented in each component’s repository.

## Troubleshooting

### Stdio Not Working

Ensure stdin and stdout are not redirected:

```bash
./bin/neuron-mcp  # Correct
./bin/neuron-mcp > output.log  # Incorrect - breaks MCP protocol
```

For Docker, use interactive mode:

```bash
docker run -i --rm neurondb-mcp:latest
```

### Database Connection Failed

Verify connection parameters:

```bash
psql -h localhost -p 5432 -U neurondb -d neurondb -c "SELECT 1;"
```

Check environment variables:

```bash
env | grep NEURONDB
```

### MCP Client Connection Issues

Verify container is running (if using Docker from another repo):

```bash
docker ps | grep neurondb-mcp
```

Test stdio manually:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | ./bin/neuron-mcp
```

Check client configuration file path and format.

### Configuration Issues

Verify config file path:

```bash
ls -la mcp-config.json
```

Check environment variable names (must start with `NEURONDB_`):

```bash
env | grep -E "^NEURONDB_"
```

## Security

- Database credentials stored securely via environment variables
- Supports TLS/SSL for encrypted database connections
- Non-root user in Docker containers
- No network endpoints (stdio only)

## Support

- **Documentation**: This README and the [docs](docs/) directory
- **GitHub Issues**: [Report issues](https://github.com/neurondb/neurondb/issues)
- **Email**: support@neurondb.ai

## License

See [LICENSE](LICENSE) for license information.

---

[Back to top](#neuronmcp)
