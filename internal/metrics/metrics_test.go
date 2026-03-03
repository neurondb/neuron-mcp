/*-------------------------------------------------------------------------
 *
 * metrics_test.go
 *    Tests for metrics package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/metrics/metrics_test.go
 *
 *-------------------------------------------------------------------------
 */

package metrics

import (
	"testing"
)

func TestNewCollector(t *testing.T) {
	c := NewCollector()
	if c == nil {
		t.Fatal("NewCollector returned nil")
	}
}

func TestNewCollectorWithDB(t *testing.T) {
	c := NewCollectorWithDB(nil)
	if c == nil {
		t.Fatal("NewCollectorWithDB returned nil")
	}
}
