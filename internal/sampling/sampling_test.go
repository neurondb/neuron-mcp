/*-------------------------------------------------------------------------
 *
 * sampling_test.go
 *    Tests for sampling package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/sampling/sampling_test.go
 *
 *-------------------------------------------------------------------------
 */

package sampling

import (
	"testing"
)

func TestMessage_Structure(t *testing.T) {
	m := Message{Role: "user", Content: "hello"}
	if m.Role != "user" || m.Content != "hello" {
		t.Error("Message structure")
	}
}

func TestSamplingRequest_Structure(t *testing.T) {
	req := SamplingRequest{
		Messages: []Message{{Role: "user", Content: "hi"}},
		Model:    "test",
	}
	if len(req.Messages) != 1 || req.Model != "test" {
		t.Error("SamplingRequest structure")
	}
}
