#!/usr/bin/env bash
# build.sh - Build neuron-mcp (Go binaries)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROGNAME="${0##*/}"
cd "$SCRIPT_DIR"

usage() {
    cat <<EOF
neuron-mcp Build Script

Build NeuronDB MCP server and client Go binaries.

Usage: $PROGNAME [OPTIONS]

Options:
  -h, --help    Show this help and exit

Runs: make build
Produces: bin/neuron-mcp, bin/neuron-mcp-client

EOF
}

case "${1:-}" in
    -h|--help) usage; exit 0 ;;
esac

exec make build
