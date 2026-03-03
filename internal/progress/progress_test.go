/*-------------------------------------------------------------------------
 *
 * progress_test.go
 *    Tests for progress package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/progress/progress_test.go
 *
 *-------------------------------------------------------------------------
 */

package progress

import (
	"testing"
)

func TestNewTracker(t *testing.T) {
	tr := NewTracker()
	if tr == nil {
		t.Fatal("NewTracker returned nil")
	}
}

func TestTracker_Start(t *testing.T) {
	tr := NewTracker()
	ps, err := tr.Start("job1", "Running")
	if err != nil {
		t.Fatalf("Start: %v", err)
	}
	if ps == nil || ps.ID != "job1" {
		t.Errorf("unexpected progress status: %+v", ps)
	}
}
