# Multi-stage build for NeuronMCP
# Build arguments
ARG GO_VERSION=1.23
ARG VERSION=latest
ARG BUILD_DATE
ARG VCS_REF

FROM golang:${GO_VERSION}-bookworm AS builder

WORKDIR /build

# Copy go mod files first for better layer caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application with version information
ARG VERSION
ARG BUILD_DATE
ARG VCS_REF
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo \
    -ldflags="-w -s -X main.version=${VERSION} -X main.buildDate=${BUILD_DATE} -X main.vcsRef=${VCS_REF}" \
    -o neuronmcp ./cmd/neurondb-mcp

# Final stage - use Debian slim for better compatibility
FROM debian:bookworm-slim

# Build arguments for labels
ARG VERSION=latest
ARG BUILD_DATE
ARG VCS_REF

# Add metadata labels
LABEL org.opencontainers.image.title="NeuronMCP" \
      org.opencontainers.image.description="Model Context Protocol server for NeuronDB PostgreSQL extension" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="neurondb" \
      org.opencontainers.image.licenses="Proprietary" \
      org.opencontainers.image.source="https://github.com/neurondb/NeurondB" \
      maintainer="neurondb <admin@neurondb.com>"

# Install runtime dependencies including Python3 for dataset loading
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    tzdata \
    python3 \
    python3-pip \
    python3-psycopg2 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies for dataset loading
RUN pip3 install --no-cache-dir --break-system-packages \
    datasets \
    psycopg2-binary

# Create non-root user for security with home directory
RUN groupadd -r neuronmcp && useradd -r -g neuronmcp -u 1000 -m -d /home/neuronmcp neuronmcp && \
    chmod 755 /home/neuronmcp && \
    chown -R neuronmcp:neuronmcp /home/neuronmcp && \
    mkdir -p /tmp/hf_cache /tmp/hf_cache/datasets && \
    chown -R neuronmcp:neuronmcp /tmp/hf_cache

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/neuronmcp .

# Copy optional entrypoint script (can be overridden)
# Copy as root first, then set permissions
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chown root:root /usr/local/bin/docker-entrypoint.sh

# Change ownership of app directory to non-root user
RUN chown -R neuronmcp:neuronmcp /app

# Switch to non-root user
USER neuronmcp

# MCP protocol uses stdio, so we don't expose ports
# Keep stdin/stdout/stderr available for MCP communication

# Set entrypoint (can be overridden in docker-compose or runtime)
# The entrypoint script performs validation and then executes the binary
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["./neuronmcp"]

