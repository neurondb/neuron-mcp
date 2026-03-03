/*-------------------------------------------------------------------------
 *
 * debugging_test.go
 *    Tests for tools debugging package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/tools/debugging/debugging_test.go
 *
 *-------------------------------------------------------------------------
 */

package debugging

import (
	"testing"

	"github.com/neurondb/NeuronMCP/internal/logging"
)

func TestNewDebugToolCallTool(t *testing.T) {
	tool := NewDebugToolCallTool(nil, nil)
	if tool == nil {
		t.Fatal("NewDebugToolCallTool returned nil")
	}
	if tool.Name() != "debug_tool_call" {
		t.Errorf("Name: got %s", tool.Name())
	}
}

func TestNewDebugToolCallTool_WithLogger(t *testing.T) {
	tool := NewDebugToolCallTool(nil, &logging.Logger{})
	if tool == nil {
		t.Fatal("NewDebugToolCallTool returned nil")
	}
}
