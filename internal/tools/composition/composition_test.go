/*-------------------------------------------------------------------------
 *
 * composition_test.go
 *    Tests for tools composition package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/tools/composition/composition_test.go
 *
 *-------------------------------------------------------------------------
 */

package composition

import (
	"testing"

	"github.com/neurondb/NeuronMCP/internal/logging"
)

func TestNewToolChainTool(t *testing.T) {
	tool := NewToolChainTool(nil, nil)
	if tool == nil {
		t.Fatal("NewToolChainTool returned nil")
	}
	if tool.Name() != "tool_chain" {
		t.Errorf("Name: got %s", tool.Name())
	}
}

func TestNewToolChainTool_WithLogger(t *testing.T) {
	tool := NewToolChainTool(nil, &logging.Logger{})
	if tool == nil {
		t.Fatal("NewToolChainTool returned nil")
	}
}
