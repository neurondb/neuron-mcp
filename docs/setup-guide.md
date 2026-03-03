# NeuronMCP Setup Guide

Complete setup guide for NeuronMCP on macOS, Windows, and Linux.

## Prerequisites

- PostgreSQL 16, 17, or 18
- NeuronDB extension installed
- Go 1.23+ (for building from source)
- MCP-compatible client (Claude Desktop, etc.)

## Installation

### Build from Source

```bash
cd NeuronMCP
go build ./cmd/neurondb-mcp
```

The binary will be created at `./neurondb-mcp` (or `./neurondb-mcp.exe` on Windows).

### Using Pre-built Binary

Download the appropriate binary for your platform from releases.

## Configuration

### Environment Variables

Set these environment variables:

```bash
export NEURONDB_HOST=localhost
export NEURONDB_PORT=5432
export NEURONDB_DATABASE=neurondb
export NEURONDB_USER=neurondb
export NEURONDB_PASSWORD=your_password
```

### Configuration File

Create `mcp-config.json`:

```json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "database": "neurondb",
    "user": "neurondb",
    "password": "your_password"
  },
  "server": {
    "name": "neurondb-mcp-server",
    "version": "2.0.0"
  },
  "logging": {
    "level": "info",
    "format": "text"
  }
}
```

## Claude Desktop Setup

### Prerequisites

Before configuring Claude Desktop, you must install Python dependencies. Claude Desktop starts the MCP server automatically without running setup scripts, so all dependencies must be pre-installed.

**Run the setup script:**

```bash
cd NeuronMCP
./scripts/neuronmcp_setup_claude_desktop.sh
```

This script will:
- Check for Python 3.8+
- Install required packages (datasets, pandas, psycopg2-binary, etc.)
- Verify installation
- Optionally check embedding configuration

**Or install manually:**

```bash
cd NeuronMCP
pip install -r requirements.txt
```

**Verify installation:**

```bash
python3 -c "from datasets import load_dataset; print('OK')"
```

### macOS

1. **Install Python dependencies** (see Prerequisites above)

2. Create configuration file:
   ```bash
   mkdir -p ~/Library/Application\ Support/Claude
   cp claude_desktop_config.macos.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. Edit the configuration file and update the path to `neurondb-mcp`:
   ```json
   {
     "mcpServers": {
       "neurondb": {
         "command": "/path/to/neurondb-mcp",
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

4. Restart Claude Desktop

### Windows

1. **Install Python dependencies** (see Prerequisites above)

2. Create configuration file:
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

3. Copy content from `claude_desktop_config.windows.json` and update paths

4. Restart Claude Desktop

### Linux

1. **Install Python dependencies** (see Prerequisites above)

2. Create configuration file:
   ```bash
   mkdir -p ~/.config/Claude
   cp claude_desktop_config.linux.json ~/.config/Claude/claude_desktop_config.json
   ```

3. Edit the configuration file and update the path to `neurondb-mcp`

4. Restart Claude Desktop

## Testing

### Test Connection

```bash
./neurondb-mcp-client ./neurondb-mcp tools/list
```

### Test Tool Execution

```bash
./neurondb-mcp-client ./neurondb-mcp tools/call '{"name":"postgresql_version","arguments":{}}'
```

## Troubleshooting

### Database Connection Failed

1. Verify PostgreSQL is running:
   ```bash
   psql -h localhost -p 5432 -U neurondb -d neurondb -c "SELECT 1;"
   ```

2. Check environment variables:
   ```bash
   env | grep NEURONDB
   ```

3. Verify NeuronDB extension is installed:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'neurondb';
   ```

### Claude Desktop Not Connecting

1. Check configuration file path and format
2. Verify binary path is correct and executable
3. Check Claude Desktop logs
4. Test binary manually:
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | ./neurondb-mcp
   ```

### Python Dependencies Not Found

If you see errors like "No module named 'datasets'" when using dataset loading:

1. **Run the setup script:**
   ```bash
   cd NeuronMCP
   ./scripts/neuronmcp_setup_claude_desktop.sh
   ```

2. **Or install manually:**
   ```bash
   pip install -r NeuronMCP/requirements.txt
   ```

3. **Verify installation:**
   ```bash
   python3 -c "from datasets import load_dataset; import pandas; import psycopg2; print('All dependencies installed!')"
   ```

4. **Note:** When Claude Desktop starts the MCP server, it uses the system `python3` command. Make sure dependencies are installed in the same Python environment that `python3` points to.

### Embeddings Returning Zeros

If embeddings are all zeros when loading datasets:

1. **Check embedding API key:**
   ```sql
   SELECT current_setting('neurondb.llm_api_key', true);
   ```

2. **Set API key (for Hugging Face API):**
   ```sql
   ALTER SYSTEM SET neurondb.llm_api_key = 'your-api-key';
   SELECT pg_reload_conf();
   ```

3. **Or use session-level setting:**
   ```sql
   SET neurondb.llm_api_key = 'your-api-key';
   ```

4. **Verify embedding model configuration:**
   ```sql
   SHOW neurondb.llm_provider;
   SHOW neurondb.llm_endpoint;
   SHOW neurondb.llm_model;
   ```

5. **Test embedding generation:**
   ```sql
   SELECT embed_text('test text')::text;
   ```

   If this returns all zeros, the embedding service is not properly configured.

### Stdio Issues

- Ensure stdin/stdout are not redirected
- Use `-i` flag with Docker: `docker run -i --rm neurondb-mcp:latest`
- Do not pipe output: `./neurondb-mcp > output.log` (incorrect)

## Security

- Store credentials securely via environment variables
- Use TLS/SSL for encrypted database connections
- Run with non-root user in production
- No network endpoints (stdio only)

## Performance

- Connection pooling is enabled by default
- Query timeouts are set appropriately
- GPU acceleration is available when configured


