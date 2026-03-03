/*-------------------------------------------------------------------------
 *
 * observability_test.go
 *    Tests for observability package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/observability/observability_test.go
 *
 *-------------------------------------------------------------------------
 */

package observability

import (
	"context"
	"testing"
)

func TestGenerateRequestID(t *testing.T) {
	id := GenerateRequestID()
	if id == "" {
		t.Fatal("GenerateRequestID returned empty")
	}
	if !id.IsValid() {
		t.Error("request ID should be valid UUID")
	}
}

func TestWithRequestID_GetRequestIDFromContext(t *testing.T) {
	ctx := context.Background()
	id := GenerateRequestID()
	ctx = WithRequestID(ctx, id)
	got, ok := GetRequestIDFromContext(ctx)
	if !ok {
		t.Fatal("expected request ID in context")
	}
	if got != id {
		t.Errorf("got %s, want %s", got, id)
	}
}

func TestGetOrCreateRequestID_CreatesNew(t *testing.T) {
	ctx := context.Background()
	newCtx, id := GetOrCreateRequestID(ctx)
	if id == "" {
		t.Fatal("expected new request ID")
	}
	if newCtx == ctx {
		t.Error("context should be updated")
	}
}
