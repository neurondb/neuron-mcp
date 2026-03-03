# NeuronMCP Source

The NeuronMCP server is implemented in **Go** only. The canonical entrypoint is `cmd/neurondb-mcp`.

Build from repo root:

```bash
make build
# or: cd src && go build -o ../bin/neuron-mcp ./cmd/neurondb-mcp
```

A TypeScript implementation was previously present and has been removed; the Go implementation is the production server.
