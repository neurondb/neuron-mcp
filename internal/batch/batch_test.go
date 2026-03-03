/*-------------------------------------------------------------------------
 *
 * batch_test.go
 *    Tests for batch package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/batch/batch_test.go
 *
 *-------------------------------------------------------------------------
 */

package batch

import (
	"testing"
)

func TestNewProcessor(t *testing.T) {
	p := NewProcessor(nil, nil, nil)
	if p == nil {
		t.Fatal("NewProcessor returned nil")
	}
}

func TestBatchRequest_Structure(t *testing.T) {
	req := BatchRequest{
		Tools:       []ToolCall{{Name: "tool1", Arguments: map[string]interface{}{"a": 1}}},
		Transaction: false,
	}
	if len(req.Tools) != 1 || req.Tools[0].Name != "tool1" {
		t.Error("BatchRequest structure")
	}
}

func TestBatchResult_Structure(t *testing.T) {
	res := BatchResult{
		Results: []ToolResult{{Tool: "t1", Success: true}},
		Success: true,
	}
	if !res.Success || len(res.Results) != 1 {
		t.Error("BatchResult structure")
	}
}
