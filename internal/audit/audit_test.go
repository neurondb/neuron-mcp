/*-------------------------------------------------------------------------
 *
 * audit_test.go
 *    Tests for audit package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/audit/audit_test.go
 *
 *-------------------------------------------------------------------------
 */

package audit

import (
	"testing"
	"time"
)

func TestNewLogger(t *testing.T) {
	l := NewLogger(nil)
	if l == nil {
		t.Fatal("NewLogger returned nil")
	}
}

func TestLogRequest_NoPanic(t *testing.T) {
	l := NewLogger(nil)
	entry := AuditEntry{
		RequestID: "req1",
		Timestamp: time.Now(),
		Method:    "tools/call",
		Status:    "success",
		Duration:  time.Millisecond,
	}
	l.LogRequest(entry)
}
