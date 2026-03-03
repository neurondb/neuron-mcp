/*-------------------------------------------------------------------------
 *
 * sdk_test.go
 *    Tests for SDK package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/sdk/sdk_test.go
 *
 *-------------------------------------------------------------------------
 */

package sdk

import (
	"testing"
)

func TestNewSDKGenerator(t *testing.T) {
	sg := NewSDKGenerator()
	if sg == nil {
		t.Fatal("NewSDKGenerator returned nil")
	}
}

func TestSDKGenerator_Generate_Python(t *testing.T) {
	sg := NewSDKGenerator()
	out, err := sg.Generate("python", []ToolDefinition{
		{Name: "tool1", Description: "Desc", InputSchema: map[string]interface{}{"type": "object"}},
	})
	if err != nil {
		t.Fatalf("Generate: %v", err)
	}
	if out == "" {
		t.Fatal("expected non-empty output")
	}
}

func TestSDKGenerator_Generate_UnknownLanguage(t *testing.T) {
	sg := NewSDKGenerator()
	_, err := sg.Generate("unknown", nil)
	if err == nil {
		t.Fatal("expected error for unknown language")
	}
}
