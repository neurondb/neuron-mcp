/*-------------------------------------------------------------------------
 *
 * keys_test.go
 *    Tests for context keys
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/context/contextkeys/keys_test.go
 *
 *-------------------------------------------------------------------------
 */

package contextkeys

import (
	"context"
	"testing"
)

func TestContextKeysTypesExist(t *testing.T) {
	/* Ensure key types can be used as context keys (no collision) */
	ctx := context.Background()
	ctx = context.WithValue(ctx, UserKey{}, "user")
	ctx = context.WithValue(ctx, UserIDKey{}, "uid")
	ctx = context.WithValue(ctx, OrgIDKey{}, "org")
	ctx = context.WithValue(ctx, ProjectIDKey{}, "proj")
	ctx = context.WithValue(ctx, ScopesKey{}, []string{"scope"})
	ctx = context.WithValue(ctx, AuditContextKey{}, nil)
	ctx = context.WithValue(ctx, HTTPMetadataKey{}, map[string]string{})
	if ctx == nil {
		t.Fatal("context should not be nil")
	}
}

func TestContextKeyRetrieval(t *testing.T) {
	ctx := context.Background()
	ctx = context.WithValue(ctx, UserIDKey{}, "user-123")
	v := ctx.Value(UserIDKey{})
	if v != "user-123" {
		t.Errorf("expected user-123, got %v", v)
	}
	if ctx.Value(UserKey{}) != nil {
		t.Error("UserKey should not be set")
	}
}
