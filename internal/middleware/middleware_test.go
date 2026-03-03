/*-------------------------------------------------------------------------
 *
 * middleware_test.go
 *    Tests for middleware package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/middleware/middleware_test.go
 *
 *-------------------------------------------------------------------------
 */

package middleware

import (
	"context"
	"testing"
)

func TestNewChain(t *testing.T) {
	c := NewChain(nil)
	if c == nil {
		t.Fatal("NewChain returned nil")
	}
}

func TestNewChain_EmptySlice(t *testing.T) {
	c := NewChain([]Middleware{})
	if c == nil {
		t.Fatal("NewChain returned nil")
	}
}

func TestExecute_NoMiddleware(t *testing.T) {
	c := NewChain(nil)
	ctx := context.Background()
	req := &MCPRequest{Method: "test"}
	resp, err := c.Execute(ctx, req, func(ctx context.Context, r *MCPRequest) (*MCPResponse, error) {
		return &MCPResponse{}, nil
	})
	if err != nil {
		t.Fatalf("Execute: %v", err)
	}
	if resp == nil {
		t.Fatal("expected non-nil response")
	}
}
