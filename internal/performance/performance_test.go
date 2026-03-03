/*-------------------------------------------------------------------------
 *
 * performance_test.go
 *    Tests for performance package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/performance/performance_test.go
 *
 *-------------------------------------------------------------------------
 */

package performance

import (
	"testing"
)

func TestNewBenchmarkRunner(t *testing.T) {
	r := NewBenchmarkRunner()
	if r == nil {
		t.Fatal("NewBenchmarkRunner returned nil")
	}
}
