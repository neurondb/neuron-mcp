/*-------------------------------------------------------------------------
 *
 * builtin_test.go
 *    Tests for middleware builtin package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/middleware/builtin/builtin_test.go
 *
 *-------------------------------------------------------------------------
 */

package builtin

import (
	"testing"

	"github.com/neurondb/NeuronMCP/internal/logging"
)

func TestNewLoggingMiddleware(t *testing.T) {
	m := NewLoggingMiddleware(nil, true, true)
	if m == nil {
		t.Fatal("NewLoggingMiddleware returned nil")
	}
	if m.Name() != "logging" {
		t.Errorf("Name: got %s", m.Name())
	}
	if m.Order() != 2 {
		t.Errorf("Order: got %d", m.Order())
	}
}

func TestNewLoggingMiddleware_WithLogger(t *testing.T) {
	m := NewLoggingMiddleware(&logging.Logger{}, false, false)
	if m == nil {
		t.Fatal("NewLoggingMiddleware returned nil")
	}
}
