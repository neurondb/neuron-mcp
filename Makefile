.PHONY: build clean test test-unit test-integration test-python test-all run build-client lint

build:
	go build -o bin/neuron-mcp ./cmd/neurondb-mcp
	go build -o bin/neuron-mcp-client ./cmd/neurondb-mcp-client

build-client:
	go build -o bin/neuron-mcp-client ./cmd/neurondb-mcp-client

clean:
	rm -rf bin/

test:
	@echo "Running all Go tests with race detector..."
	go test -race ./...

test-fast:
	@echo "Running all Go tests (fast mode, no race detector)..."
	go test ./...

lint:
	@echo "Running golangci-lint..."
	golangci-lint run ./...

test-unit:
	@echo "Running unit tests..."
	go test -short -race ./...

test-integration:
	@echo "Running integration tests..."
	go test -race ./...

test-python:
	@echo "Running Python tests..."
	@if [ ! -f neuronmcp_server.json ]; then \
		echo "Error: neuronmcp_server.json not found. Please create it first."; \
		exit 1; \
	fi
	python3 src/tests/run_all_tests.py

test-all: test test-python
	@echo "All tests completed"

run: build
	./bin/neuron-mcp

