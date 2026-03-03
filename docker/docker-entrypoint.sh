#!/bin/sh
# Docker entrypoint script for NeuronMCP
# Performs pre-start validation and initialization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Check if binary exists (check both package and source build locations)
BINARY=""
if [ -f "/usr/bin/neuronmcp" ]; then
    BINARY="/usr/bin/neuronmcp"
elif [ -f "/app/neuronmcp" ]; then
    BINARY="/app/neuronmcp"
fi

if [ -z "$BINARY" ]; then
    log_error "Binary not found in /usr/bin/neuronmcp or /app/neuronmcp!"
    exit 1
fi

if [ ! -x "$BINARY" ]; then
    log_error "Binary $BINARY is not executable!"
    exit 1
fi

log_info "Binary found and executable: $BINARY"

# Validate environment variables
if [ -z "${NEURONDB_HOST}" ] && [ -z "${NEURONDB_CONNECTION_STRING}" ]; then
    log_warn "NEURONDB_HOST not set, will use default or config file"
fi

if [ -z "${NEURONDB_DATABASE}" ] && [ -z "${NEURONDB_CONNECTION_STRING}" ]; then
    log_warn "NEURONDB_DATABASE not set, will use default or config file"
fi

# Optional: Test database connectivity (requires psql or similar)
# Uncomment if you want to verify database connection before starting
# if command -v psql >/dev/null 2>&1; then
#     log_info "Testing database connectivity..."
#     if [ -n "${NEURONDB_CONNECTION_STRING}" ]; then
#         CONN_STR="${NEURONDB_CONNECTION_STRING}"
#     else
#         CONN_STR="postgresql://${NEURONDB_USER:-neurondb}:${NEURONDB_PASSWORD:-neurondb}@${NEURONDB_HOST:-localhost}:${NEURONDB_PORT:-5432}/${NEURONDB_DATABASE:-neurondb}"
#     fi
#     
#     if psql "${CONN_STR}" -c "SELECT 1;" >/dev/null 2>&1; then
#         log_info "Database connection successful"
#     else
#         log_warn "Database connection test failed (continuing anyway)"
#     fi
# fi

# Validate config file if specified
if [ -n "${NEURONDB_MCP_CONFIG}" ] && [ -f "${NEURONDB_MCP_CONFIG}" ]; then
    log_info "Config file found: ${NEURONDB_MCP_CONFIG}"
    # Basic JSON validation (requires python3)
    if command -v python3 >/dev/null 2>&1; then
        if python3 -m json.tool "${NEURONDB_MCP_CONFIG}" >/dev/null 2>&1; then
            log_info "Config file is valid JSON"
        else
            log_error "Config file is not valid JSON: ${NEURONDB_MCP_CONFIG}"
            exit 1
        fi
    fi
elif [ -n "${NEURONDB_MCP_CONFIG}" ]; then
    log_warn "Config file specified but not found: ${NEURONDB_MCP_CONFIG}"
fi

# Log startup information
log_info "Starting NeuronMCP server..."
log_info "  Host: ${NEURONDB_HOST:-localhost}"
log_info "  Port: ${NEURONDB_PORT:-5433}"
log_info "  Database: ${NEURONDB_DATABASE:-neurondb}"
log_info "  User: ${NEURONDB_USER:-neurondb}"
log_info "  Log Level: ${NEURONDB_LOG_LEVEL:-info}"
log_info "  Log Format: ${NEURONDB_LOG_FORMAT:-text}"

# Run SQL setup scripts if they exist and database is accessible
SQL_DIR="/usr/share/neuronmcp/sql"
if [ -d "$SQL_DIR" ] && [ -n "$(ls -A $SQL_DIR/*.sql 2>/dev/null)" ]; then
    log_info "SQL setup scripts found, running database setup..."
    
    # Build connection string
    if [ -n "${NEURONDB_CONNECTION_STRING}" ]; then
        CONN_STR="${NEURONDB_CONNECTION_STRING}"
    else
        if [ -n "${NEURONDB_PASSWORD}" ]; then
            export PGPASSWORD="${NEURONDB_PASSWORD}"
        fi
        CONN_STR="postgresql://${NEURONDB_USER:-neurondb}:${NEURONDB_PASSWORD:-neurondb}@${NEURONDB_HOST:-localhost}:${NEURONDB_PORT:-5433}/${NEURONDB_DATABASE:-neurondb}"
    fi
    
    # Test database connection
    if command -v psql >/dev/null 2>&1; then
        log_info "Testing database connectivity..."
        if psql "$CONN_STR" -c "SELECT 1;" >/dev/null 2>&1; then
            log_info "Database connection successful"
            
            # Check if NeuronDB extension exists
            if psql "$CONN_STR" -tAc "SELECT 1 FROM pg_extension WHERE extname = 'neurondb'" | grep -q 1; then
                log_info "NeuronDB extension is installed"
            else
                log_warn "NeuronDB extension not found, attempting to create..."
                if psql "$CONN_STR" -c "CREATE EXTENSION IF NOT EXISTS neurondb;" 2>/dev/null; then
                    log_info "NeuronDB extension created"
                else
                    log_warn "Failed to create NeuronDB extension (continuing anyway)"
                fi
            fi
            
            # Check if NeuronMCP schema is already set up (idempotency check)
            SCHEMA_EXISTS=$(psql "$CONN_STR" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'neurondb' AND table_name = 'llm_providers'" 2>/dev/null || echo "0")
            
            if [ "$SCHEMA_EXISTS" = "1" ]; then
                log_info "NeuronMCP schema already exists, skipping setup (already initialized by NeuronDB)"
            else
                log_info "NeuronMCP schema not found, running setup..."
                
                # Run SQL setup scripts in order
                SCHEMA_FILE="$SQL_DIR/001_initial_schema.sql"
                FUNCTIONS_FILE="$SQL_DIR/002_functions.sql"
                
                if [ -f "$SCHEMA_FILE" ]; then
                    log_info "Running schema setup: $(basename $SCHEMA_FILE)"
                    if psql "$CONN_STR" -f "$SCHEMA_FILE" >/dev/null 2>&1; then
                        log_info "Schema setup completed"
                    else
                        log_warn "Schema setup had errors (checking if already applied)..."
                        # Try to show errors but don't fail
                        psql "$CONN_STR" -f "$SCHEMA_FILE" 2>&1 | grep -i "error\|already exists" | head -5 || true
                    fi
                fi
                
                if [ -f "$FUNCTIONS_FILE" ]; then
                    log_info "Running functions setup: $(basename $FUNCTIONS_FILE)"
                    if psql "$CONN_STR" -f "$FUNCTIONS_FILE" >/dev/null 2>&1; then
                        log_info "Functions setup completed"
                    else
                        log_warn "Functions setup had errors (checking if already applied)..."
                        # Try to show errors but don't fail
                        psql "$CONN_STR" -f "$FUNCTIONS_FILE" 2>&1 | grep -i "error\|already exists" | head -5 || true
                    fi
                fi
            fi
            
            log_info "Database setup completed"
        else
            log_warn "Database connection test failed (continuing anyway - may need manual setup)"
        fi
    else
        log_warn "psql not found, skipping SQL setup scripts"
    fi
else
    log_info "No SQL setup scripts found, skipping database setup"
fi

# Determine binary path (package installs to /usr/bin, source build to /app)
if [ -f "/usr/bin/neuronmcp" ]; then
    BINARY="/usr/bin/neuronmcp"
elif [ -f "/app/neuronmcp" ]; then
    BINARY="/app/neuronmcp"
else
    log_error "Binary not found in /usr/bin/neuronmcp or /app/neuronmcp"
    exit 1
fi

# Execute the binary with all arguments
exec "$BINARY" "$@"

