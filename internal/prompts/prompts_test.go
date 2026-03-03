/*-------------------------------------------------------------------------
 *
 * prompts_test.go
 *    Tests for prompts package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/prompts/prompts_test.go
 *
 *-------------------------------------------------------------------------
 */

package prompts

import (
	"testing"

	"github.com/neurondb/NeuronMCP/internal/logging"
)

func TestNewManager(t *testing.T) {
	m := NewManager(nil, nil)
	if m == nil {
		t.Fatal("NewManager returned nil")
	}
}

func TestManager_ListPrompts_NilManager(t *testing.T) {
	var m *Manager
	_, err := m.ListPrompts(nil)
	if err == nil {
		t.Fatal("expected error for nil manager")
	}
}

func TestManager_ListPrompts_NilContext(t *testing.T) {
	m := NewManager(nil, &logging.Logger{})
	_, err := m.ListPrompts(nil)
	if err == nil {
		t.Fatal("expected error for nil context")
	}
}
