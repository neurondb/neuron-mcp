/*-------------------------------------------------------------------------
 *
 * api_test.go
 *    Tests for API package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/api/api_test.go
 *
 *-------------------------------------------------------------------------
 */

package api

import (
	"testing"
)

func TestNewRESTWrapper(t *testing.T) {
	rw := NewRESTWrapper(nil, "/api")
	if rw == nil {
		t.Fatal("NewRESTWrapper returned nil")
	}
	if rw.basePath != "/api" {
		t.Errorf("basePath: got %s", rw.basePath)
	}
}
