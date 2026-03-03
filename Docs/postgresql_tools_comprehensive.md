# PostgreSQL Tools for NeuronMCP - Comprehensive Reference Guide

**Complete, detailed documentation for all 29 PostgreSQL administration tools**

---

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start Guide](#quick-start-guide)
3. [Tool Categories Overview](#tool-categories-overview)
4. [Server Information Tools (5 tools)](#server-information-tools)
5. [Database Object Management Tools (8 tools)](#database-object-management-tools)
6. [User and Role Management Tools (3 tools)](#user-and-role-management-tools)
7. [Performance and Statistics Tools (7 tools)](#performance-and-statistics-tools)
8. [Size and Storage Tools (6 tools)](#size-and-storage-tools)
9. [Integration with NeuronDB](#integration-with-neurondb)
10. [Use Cases and Workflows](#use-cases-and-workflows)
11. [Best Practices](#best-practices)
12. [Troubleshooting Guide](#troubleshooting-guide)
13. [API Reference](#api-reference)
14. [Examples Gallery](#examples-gallery)

---

## Introduction

NeuronMCP provides **29 comprehensive PostgreSQL administration and monitoring tools** that deliver **100% coverage** of PostgreSQL database management capabilities. These tools seamlessly combine standard PostgreSQL administration with NeuronDB's advanced vector search, machine learning, and AI capabilities, creating the most complete and powerful database management solution available.

### Why NeuronMCP PostgreSQL Tools?

- **Complete Coverage**: Every aspect of PostgreSQL administration from basic version info to advanced performance tuning
- **Real-time Monitoring**: Live statistics, active queries, wait events, and connection monitoring
- **Performance Analysis**: Detailed metrics for tables, indexes, queries, and system resources
- **Storage Management**: Size analysis, bloat detection, and vacuum recommendations
- **Security Management**: Comprehensive user, role, and permission auditing
- **NeuronDB Integration**: Seamless integration with NeuronDB vector search and ML capabilities
- **Operational focus**: Designed for day-to-day administration and monitoring
- **Easy to Use**: Simple, intuitive API accessible via MCP protocol

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  MCP Client                             │
│  (Claude Desktop, Custom Client, etc.)                 │
└────────────────────┬────────────────────────────────────┘
                     │ JSON-RPC 2.0 over stdio
┌────────────────────▼────────────────────────────────────┐
│              NeuronMCP Server                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │       PostgreSQL Tools (29 tools)                │  │
│  │  • Server Information                             │  │
│  │  • Object Management                               │  │
│  │  • User/Role Management                            │  │
│  │  • Performance Monitoring                          │  │
│  │  • Size and Storage                                │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ SQL Queries
┌────────────────────▼────────────────────────────────────┐
│         PostgreSQL + NeuronDB                          │
│  • PostgreSQL 16+                                      │
│  • NeuronDB Extension                                  │
│  • Vector Search, ML, AI                               │
└─────────────────────────────────────────────────────────┘
```

### Tool Statistics

- **Total Tools**: 29
- **Server Information**: 5 tools
- **Database Object Management**: 8 tools
- **User and Role Management**: 3 tools
- **Performance and Statistics**: 7 tools
- **Size and Storage**: 6 tools

---

## Quick Start Guide

### Prerequisites

1. **PostgreSQL 16 or later** installed and running
2. **NeuronDB extension** installed in your database
3. **NeuronMCP server** configured and running
4. **Database connection** configured in `neuronmcp_server.json`

### Basic Usage Examples

#### 1. Check PostgreSQL Version

```bash
# Using MCP client
./bin/neurondb-mcp-client -c neuronmcp_server.json -e "postgresql_version"

# Expected output
{
  "version": "PostgreSQL 16.1 on x86_64-pc-linux-gnu...",
  "server_version": "16.1",
  "major_version": 16,
  "minor_version": 1,
  "patch_version": 0
}
```

#### 2. Get Comprehensive Server Statistics

```bash
# Get all statistics
./bin/neurondb-mcp-client -c neuronmcp_server.json -e "postgresql_stats"

# Get only performance metrics
./bin/neurondb-mcp-client -c neuronmcp_server.json -e "postgresql_stats:include_database_stats=false,include_table_stats=false,include_connection_stats=false,include_performance_stats=true"
```

#### 3. List All Tables

```bash
# List all user tables
./bin/neurondb-mcp-client -c neuronmcp_server.json -e "postgresql_tables"

# List tables in specific schema
./bin/neurondb-mcp-client -c neuronmcp_server.json -e "postgresql_tables:schema=public"
```

#### 4. Monitor Active Queries

```bash
# Show only active queries
./bin/neurondb-mcp-client -c neuronmcp_server.json -e "postgresql_active_queries"

# Include idle queries too
./bin/neurondb-mcp-client -c neuronmcp_server.json -e "postgresql_active_queries:include_idle=true,limit=50"
```

### Using with Claude Desktop

All PostgreSQL tools are automatically available in Claude Desktop when NeuronMCP is configured. Simply ask Claude:

**Examples:**
- "Show me all PostgreSQL tables and their sizes"
- "What queries are currently running?"
- "Check database bloat and recommend maintenance actions"
- "List all indexes and show which ones are being used"
- "Show me connection statistics"
- "What are the performance metrics for the database?"

### JSON-RPC 2.0 Format

All tools use the standard MCP protocol format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "postgresql_version",
    "arguments": {}
  }
}
```

Response format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"version\":\"PostgreSQL 16.1...\",\"major_version\":16,...}"
      }
    ]
  }
}
```

---

## Tool Categories Overview

### Server Information Tools (5 tools)

Essential tools for understanding your PostgreSQL server configuration and status.

| Tool | Purpose | Key Use Cases |
|------|---------|---------------|
| `postgresql_version` | Get server version and build info | Version checking, compatibility verification |
| `postgresql_stats` | Comprehensive server-wide statistics | Health monitoring, capacity planning |
| `postgresql_databases` | List all databases with sizes | Database inventory, size monitoring |
| `postgresql_settings` | Configuration settings | Performance tuning, configuration audit |
| `postgresql_extensions` | Installed extensions | Extension management, compatibility check |

### Database Object Management Tools (8 tools)

Tools for managing and inspecting database schema objects.

| Tool | Purpose | Key Use Cases |
|------|---------|---------------|
| `postgresql_tables` | Tables with metadata and statistics | Schema exploration, table inventory |
| `postgresql_indexes` | Indexes with usage statistics | Index optimization, unused index detection |
| `postgresql_schemas` | Schema listing and permissions | Schema management, permission audit |
| `postgresql_views` | Views with definitions | View management, dependency tracking |
| `postgresql_sequences` | Sequences with current values | Sequence monitoring, ID generation tracking |
| `postgresql_functions` | Functions with parameters and definitions | Function inventory, code review |
| `postgresql_triggers` | Triggers with event types | Trigger audit, event tracking |
| `postgresql_constraints` | Constraints (PK, FK, unique, check) | Data integrity audit, constraint analysis |

### User and Role Management Tools (3 tools)

Security and access control management.

| Tool | Purpose | Key Use Cases |
|------|---------|---------------|
| `postgresql_users` | User accounts and capabilities | Security audit, user management |
| `postgresql_roles` | Roles with memberships | Role hierarchy, permission management |
| `postgresql_permissions` | Object-level permissions | Access control audit, security review |

### Performance and Statistics Tools (7 tools)

Real-time monitoring and performance analysis.

| Tool | Purpose | Key Use Cases |
|------|---------|---------------|
| `postgresql_table_stats` | Per-table performance metrics | Performance tuning, bottleneck identification |
| `postgresql_index_stats` | Per-index usage statistics | Index optimization, query performance |
| `postgresql_active_queries` | Currently running queries | Query monitoring, performance debugging |
| `postgresql_wait_events` | Query blocking and wait events | Lock detection, performance troubleshooting |
| `postgresql_connections` | Connection details and states | Connection pooling, resource management |
| `postgresql_locks` | Lock information and conflicts | Deadlock detection, concurrency analysis |
| `postgresql_replication` | Replication status and lag | High availability monitoring, replication health |

### Size and Storage Tools (6 tools)

Storage analysis and maintenance.

| Tool | Purpose | Key Use Cases |
|------|---------|---------------|
| `postgresql_table_size` | Table size breakdown | Capacity planning, storage optimization |
| `postgresql_index_size` | Index size analysis | Index size monitoring, storage management |
| `postgresql_bloat` | Table and index bloat detection | Maintenance planning, performance optimization |
| `postgresql_vacuum_stats` | Vacuum recommendations | Maintenance scheduling, performance tuning |

---







