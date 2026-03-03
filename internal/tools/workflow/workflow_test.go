/*-------------------------------------------------------------------------
 *
 * workflow_test.go
 *    Tests for tools workflow package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/tools/workflow/workflow_test.go
 *
 *-------------------------------------------------------------------------
 */

package workflow

import (
	"testing"
	"time"
)

func TestNewManager(t *testing.T) {
	m := NewManager()
	if m == nil {
		t.Fatal("NewManager returned nil")
	}
}

func TestManager_RegisterWorkflow_Valid(t *testing.T) {
	m := NewManager()
	w := &Workflow{
		ID: "wf1", Name: "Test", Description: "Desc",
		Steps: []Step{{ID: "s1", Name: "Step1", Tool: "tool1"}},
		CreatedAt: time.Now(), UpdatedAt: time.Now(),
	}
	err := m.RegisterWorkflow(w)
	if err != nil {
		t.Fatalf("RegisterWorkflow: %v", err)
	}
}

func TestManager_RegisterWorkflow_Nil(t *testing.T) {
	m := NewManager()
	err := m.RegisterWorkflow(nil)
	if err == nil {
		t.Fatal("expected error for nil workflow")
	}
}

func TestManager_RegisterWorkflow_EmptyID(t *testing.T) {
	m := NewManager()
	err := m.RegisterWorkflow(&Workflow{ID: "", Name: "x", CreatedAt: time.Now(), UpdatedAt: time.Now()})
	if err == nil {
		t.Fatal("expected error for empty ID")
	}
}
