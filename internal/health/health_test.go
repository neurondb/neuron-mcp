/*-------------------------------------------------------------------------
 *
 * health_test.go
 *    Tests for health package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/health/health_test.go
 *
 *-------------------------------------------------------------------------
 */

package health

import (
	"testing"
)

func TestNewChecker(t *testing.T) {
	c := NewChecker(nil, nil)
	if c == nil {
		t.Fatal("NewChecker returned nil")
	}
}
