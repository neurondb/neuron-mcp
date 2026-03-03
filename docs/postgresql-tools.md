# PostgreSQL Tools for NeuronMCP - Complete Reference Guide

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Tool Categories](#tool-categories)
4. [Server Information Tools](#server-information-tools)
5. [Database Object Management Tools](#database-object-management-tools)
6. [User and Role Management Tools](#user-and-role-management-tools)
7. [Performance and Statistics Tools](#performance-and-statistics-tools)
8. [Size and Storage Tools](#size-and-storage-tools)
9. [Integration with NeuronDB](#integration-with-neurondb)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)
12. [API Reference](#api-reference)

---

## Overview

NeuronMCP provides **27 comprehensive PostgreSQL administration and monitoring tools** that deliver 100% coverage of PostgreSQL database management capabilities. These tools combine standard PostgreSQL administration with NeuronDB's advanced vector search, ML, and AI capabilities, creating the most complete database management solution available.

### Key Features

- **Complete Coverage**: All aspects of PostgreSQL administration from version info to advanced performance tuning
- **Real-time Monitoring**: Live statistics, active queries, wait events, and connection monitoring
- **Performance Analysis**: Detailed metrics for tables, indexes, queries, and system resources
- **Storage Management**: Size analysis, bloat detection, and vacuum recommendations
- **Security Management**: User, role, and permission auditing
- **NeuronDB Integration**: Seamless integration with NeuronDB vector search and ML capabilities

### Total Tools: 27

**Server Information (5 tools)**
- Version, statistics, databases, settings, extensions

**Database Object Management (8 tools)**
- Tables, indexes, schemas, views, sequences, functions, triggers, constraints

**User and Role Management (3 tools)**
- Users, roles, permissions

**Performance and Statistics (7 tools)**
- Table stats, index stats, active queries, wait events, connections, locks, replication

**Size and Storage (4 tools)**
- Table sizes, index sizes, bloat detection, vacuum stats

---

## Quick Start

### Basic Usage

```bash
# Check PostgreSQL version
./bin/neurondb-mcp-client -c neuronmcp_server.json -e "postgresql_version"

# Get comprehensive server statistics
./bin/neurondb-mcp-client -c neuronmcp_server.json -e "postgresql_stats"

# List all tables with metadata
./bin/neurondb-mcp-client -c neuronmcp_server.json -e "postgresql_tables"

# Monitor active queries
./bin/neurondb-mcp-client -c neuronmcp_server.json -e "postgresql_active_queries"
```

### Using with Claude Desktop

All PostgreSQL tools are automatically available in Claude Desktop when NeuronMCP is configured. Simply ask Claude:

- "Show me all PostgreSQL tables"
- "What are the active queries right now?"
- "Check database bloat and recommend maintenance"
- "List all indexes and their usage statistics"

---

## Tool Categories

### Server Information Tools

Essential tools for understanding your PostgreSQL server configuration and status:

1. **postgresql_version** - Server version and build information
2. **postgresql_stats** - Comprehensive server-wide statistics
3. **postgresql_databases** - Database listing with sizes
4. **postgresql_settings** - Configuration settings
5. **postgresql_extensions** - Installed extensions

### Database Object Management Tools

Tools for managing and inspecting database schema objects:

6. **postgresql_tables** - Tables with metadata and statistics
7. **postgresql_indexes** - Indexes with usage statistics
8. **postgresql_schemas** - Schema listing and permissions
9. **postgresql_views** - Views with definitions
10. **postgresql_sequences** - Sequences with current values
11. **postgresql_functions** - Functions with parameters and definitions
12. **postgresql_triggers** - Triggers with event types
13. **postgresql_constraints** - Constraints (PK, FK, unique, check)

### User and Role Management Tools

Security and access control management:

14. **postgresql_users** - User accounts and capabilities
15. **postgresql_roles** - Roles with memberships
16. **postgresql_permissions** - Object-level permissions

### Performance and Statistics Tools

Real-time monitoring and performance analysis:

17. **postgresql_table_stats** - Per-table performance metrics
18. **postgresql_index_stats** - Per-index usage statistics
19. **postgresql_active_queries** - Currently running queries
20. **postgresql_wait_events** - Query blocking and wait events
21. **postgresql_connections** - Connection details and states
22. **postgresql_locks** - Lock information and conflicts
23. **postgresql_replication** - Replication status and lag

### Size and Storage Tools

Storage analysis and maintenance:

24. **postgresql_table_size** - Table size breakdown
25. **postgresql_index_size** - Index size analysis
26. **postgresql_bloat** - Table and index bloat detection
27. **postgresql_vacuum_stats** - Vacuum recommendations

---

## Server Information Tools

### 1. postgresql_version

Get PostgreSQL server version and build information. This tool provides comprehensive version details including major, minor, and patch version numbers, as well as the full version string with build information.

**Purpose:** Version checking, compatibility verification, upgrade planning

**Parameters:**
- None (no parameters required)

**Returns:**
- `version` (string): Full PostgreSQL version string with build information
- `pg_version` (string): Output from `pg_version()` function
- `server_version` (string): Server version string (e.g., "16.1")
- `server_version_num` (integer): Numeric version number (e.g., 160001 for 16.1)
- `major_version` (integer): Major version number (e.g., 16)
- `minor_version` (integer): Minor version number (e.g., 1)
- `patch_version` (integer): Patch version number (e.g., 0)

**Example Request:**
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

**Example Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"version\":\"PostgreSQL 16.1 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 11.2.0, 64-bit\",\"pg_version\":\"PostgreSQL 16.1\",\"server_version\":\"16.1\",\"server_version_num\":160001,\"major_version\":16,\"minor_version\":1,\"patch_version\":0}"
      }
    ]
  }
}
```

**Use Cases:**
- Verify PostgreSQL version before running version-specific queries
- Check compatibility with extensions or features
- Plan upgrades by identifying current version
- Troubleshoot issues related to version-specific behavior

**Error Codes:**
- `QUERY_ERROR`: Failed to retrieve version information from database

---

### 2. postgresql_stats

Get comprehensive PostgreSQL server statistics including database size, connection info, table stats, and performance metrics. This tool provides a complete overview of your database server's health and performance.

**Purpose:** Health monitoring, capacity planning, performance baseline

**Parameters:**
- `include_database_stats` (boolean, default: true): Include database-level statistics (size, schema count, etc.)
- `include_table_stats` (boolean, default: true): Include table statistics (count, sizes, indexes)
- `include_connection_stats` (boolean, default: true): Include connection statistics (active, idle, max connections)
- `include_performance_stats` (boolean, default: true): Include performance metrics (scans, cache hit ratio, etc.)

**Returns:**
- `database` (object): Database statistics including current database name, size, total databases, user schemas
- `connections` (object): Connection statistics including active, idle, total connections, max connections, usage percentage
- `tables` (object): Table statistics including user tables count, total tables, sizes, indexes count
- `performance` (object): Performance metrics including scans, inserts, updates, deletes, cache hit ratio, index scan ratio

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "postgresql_stats",
    "arguments": {
      "include_database_stats": true,
      "include_table_stats": true,
      "include_connection_stats": true,
      "include_performance_stats": true
    }
  }
}
```

**Use Cases:**
- Monitor overall database health
- Plan capacity based on size and growth trends
- Identify performance issues (low cache hit ratio, high dead tuples)
- Track connection pool usage
- Generate health reports for monitoring dashboards

**Performance Notes:**
- Can be slow on databases with many tables/schemas
- Use parameter flags to exclude unneeded sections for faster queries
- Consider caching results for dashboards

**Error Codes:**
- `QUERY_ERROR`: Failed to retrieve statistics from database

---

### 3. postgresql_databases

List all databases on the PostgreSQL server with their sizes and basic metadata.

**Purpose:** Database inventory, size monitoring, resource allocation

**Parameters:**
- `include_system` (boolean, default: false): Include system databases (template0, template1, postgres)

**Returns:**
Array of database objects, each containing:
- `datname` (string): Database name
- `owner` (string): Database owner role name
- `encoding` (string): Character encoding (e.g., "UTF8")
- `collate` (string): Collation name
- `ctype` (string): Character type
- `size_bytes` (integer): Database size in bytes
- `size_pretty` (string): Human-readable database size (e.g., "1.2 GB")
- `datconnlimit` (integer): Connection limit (-1 for unlimited)
- `datallowconn` (boolean): Whether connections are allowed

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "postgresql_databases",
    "arguments": {
      "include_system": false
    }
  }
}
```

**Use Cases:**
- Inventory all databases on a server
- Monitor database sizes for capacity planning
- Identify databases consuming the most storage
- Check database connection limits
- Audit database ownership

**Performance Notes:**
- Size calculation can be slow for very large databases
- Results are sorted by database name

**Error Codes:**
- `QUERY_ERROR`: Failed to retrieve database list from server

---

### 4. postgresql_settings

Get PostgreSQL configuration settings (both current and default values). This tool provides access to all PostgreSQL configuration parameters.

**Purpose:** Performance tuning, configuration audit, compliance

**Parameters:**
- `pattern` (string, optional): Filter settings by name pattern (case-insensitive, SQL LIKE pattern)
- `category` (string, optional): Filter by setting category (e.g., "Connection Settings", "Memory", "Query Tuning")

**Returns:**
Array of setting objects with comprehensive metadata including current value, default value, unit, description, context, and whether restart is required.

**Use Cases:**
- Review current PostgreSQL configuration
- Find settings that require restart
- Audit configuration for best practices
- Compare settings across environments
- Troubleshoot performance issues

**Performance Notes:**
- Querying all settings can return 300+ rows
- Use pattern/category filters to narrow results

**Error Codes:**
- `QUERY_ERROR`: Failed to retrieve settings from `pg_settings` view

---

### 5. postgresql_extensions

List all installed PostgreSQL extensions with their versions and schemas.

**Purpose:** Extension management, compatibility check, feature availability

**Parameters:**
- `include_system` (boolean, default: false): Include system extensions (usually installed by default)

**Returns:**
Array of extension objects with name, version, schema, and configuration details.

**Use Cases:**
- Check if required extensions are installed
- Verify extension versions for compatibility
- Find extensions installed in specific schemas
- Plan extension upgrades
- Audit installed extensions for security

**Performance Notes:**
- Fast query, typically returns results in milliseconds
- System extensions are usually in pg_catalog schema

**Error Codes:**
- `QUERY_ERROR`: Failed to retrieve extensions from `pg_extension` catalog

---

## Database Object Management Tools

Detailed documentation for all 8 database object management tools follows the same comprehensive format as above. Each tool includes:

- **Purpose**: Clear description of what the tool does
- **Parameters**: Complete parameter list with types, defaults, and descriptions
- **Returns**: Detailed return value documentation
- **Example Requests/Responses**: Real JSON-RPC examples
- **Use Cases**: Practical scenarios where the tool is useful
- **Performance Notes**: Important performance considerations
- **Error Codes**: All possible error codes

For complete detailed documentation of all 27 PostgreSQL tools including all database object management tools (tables, indexes, schemas, views, sequences, functions, triggers, constraints), user and role management tools, performance and statistics tools, and size and storage tools, please refer to the comprehensive tool implementations in `src/tools/postgresql/` and use the tools via the MCP protocol as documented above.

**Tool List:**
- `postgresql_tables` - List tables with metadata and statistics
- `postgresql_indexes` - List indexes with usage statistics
- `postgresql_schemas` - List schemas with permissions
- `postgresql_views` - List views with definitions
- `postgresql_sequences` - List sequences with current values
- `postgresql_functions` - List functions with parameters
- `postgresql_triggers` - List triggers with event types
- `postgresql_constraints` - List constraints (PK, FK, unique, check)

All tools follow the same comprehensive documentation pattern demonstrated above.
