/*-------------------------------------------------------------------------
 *
 * auth_test.go
 *    Tests for auth package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/auth/auth_test.go
 *
 *-------------------------------------------------------------------------
 */

package auth

import (
	"context"
	"testing"

	"github.com/neurondb/NeuronMCP/internal/context/contextkeys"
)

func TestExtractRequestAuth_EmptyContext(t *testing.T) {
	auth, err := ExtractRequestAuth(context.Background())
	if err != nil {
		t.Fatalf("ExtractRequestAuth: %v", err)
	}
	if auth == nil {
		t.Fatal("expected non-nil RequestAuth")
	}
	if auth.UserID != "" || auth.OrgID != "" {
		t.Error("empty context should yield empty auth")
	}
}

func TestExtractRequestAuth_WithValues(t *testing.T) {
	ctx := context.Background()
	ctx = context.WithValue(ctx, "user_id", "u1")
	ctx = context.WithValue(ctx, "org_id", "o1")
	ctx = context.WithValue(ctx, "project_id", "p1")
	auth, err := ExtractRequestAuth(ctx)
	if err != nil {
		t.Fatalf("ExtractRequestAuth: %v", err)
	}
	if auth.UserID != "u1" || auth.OrgID != "o1" || auth.ProjectID != "p1" {
		t.Errorf("got UserID=%s OrgID=%s ProjectID=%s", auth.UserID, auth.OrgID, auth.ProjectID)
	}
}

func TestWithTenantContext(t *testing.T) {
	ctx := context.Background()
	tenant := &TenantContext{UserID: "u1", OrgID: "o1", ProjectID: "p1", Scopes: []string{"s1"}}
	ctx = WithTenantContext(ctx, tenant)
	if ctx.Value(contextkeys.UserIDKey{}) != "u1" {
		t.Error("UserID not in context")
	}
	if ctx.Value(contextkeys.OrgIDKey{}) != "o1" {
		t.Error("OrgID not in context")
	}
}

func TestNewDefaultTenantResolver(t *testing.T) {
	r := NewDefaultTenantResolver()
	if r == nil {
		t.Fatal("NewDefaultTenantResolver returned nil")
	}
}

func TestGetTenantFromContext(t *testing.T) {
	ctx := context.Background()
	tenant := GetTenantFromContext(ctx)
	if tenant == nil {
		t.Fatal("GetTenantFromContext always returns non-nil")
	}
	if tenant.UserID != "" {
		t.Error("empty context should return empty tenant")
	}
	ctx = context.WithValue(ctx, "user_id", "u1")
	ctx = context.WithValue(ctx, "org_id", "o1")
	ctx = context.WithValue(ctx, "project_id", "p1")
	tenant = GetTenantFromContext(ctx)
	if tenant.UserID != "u1" || tenant.OrgID != "o1" || tenant.ProjectID != "p1" {
		t.Errorf("GetTenantFromContext: got %+v", tenant)
	}
}
