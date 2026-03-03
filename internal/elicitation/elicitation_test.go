/*-------------------------------------------------------------------------
 *
 * elicitation_test.go
 *    Tests for elicitation package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/elicitation/elicitation_test.go
 *
 *-------------------------------------------------------------------------
 */

package elicitation

import (
	"context"
	"testing"

	"github.com/neurondb/NeuronMCP/internal/logging"
)

func TestNewManager(t *testing.T) {
	m := NewManager(nil)
	if m == nil {
		t.Fatal("NewManager returned nil")
	}
}

func TestRequestPrompt_EmptyMessage(t *testing.T) {
	m := NewManager(&logging.Logger{})
	_, err := m.RequestPrompt(context.Background(), "", "text")
	if err == nil {
		t.Fatal("expected error for empty message")
	}
}
