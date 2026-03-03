/*-------------------------------------------------------------------------
 *
 * ha_test.go
 *    Tests for HA package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/ha/ha_test.go
 *
 *-------------------------------------------------------------------------
 */

package ha

import (
	"testing"
)

func TestNewHealthChecker(t *testing.T) {
	h := NewHealthChecker()
	if h == nil {
		t.Fatal("NewHealthChecker returned nil")
	}
}

func TestHealthChecker_RegisterCheck(t *testing.T) {
	h := NewHealthChecker()
	h.RegisterCheck("test", func() (HealthStatus, string, map[string]interface{}) {
		return HealthStatusHealthy, "ok", nil
	})
}
