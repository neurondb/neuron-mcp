/*-------------------------------------------------------------------------
 *
 * safety_test.go
 *    Tests for safety package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/safety/safety_test.go
 *
 *-------------------------------------------------------------------------
 */

package safety

import (
	"testing"

	"github.com/neurondb/NeuronMCP/internal/logging"
)

func TestNewSafetyManager(t *testing.T) {
	sm := NewSafetyManager(SafetyModeReadOnly, nil, nil)
	if sm == nil {
		t.Fatal("NewSafetyManager returned nil")
	}
	if sm.GetMode() != SafetyModeReadOnly {
		t.Errorf("GetMode: got %s", sm.GetMode())
	}
}

func TestSafetyManager_ReadOnly_AllowsSelect(t *testing.T) {
	sm := NewSafetyManager(SafetyModeReadOnly, nil, &logging.Logger{})
	err := sm.ValidateStatement("SELECT 1", false)
	if err != nil {
		t.Errorf("SELECT should be allowed in read-only: %v", err)
	}
}

func TestSafetyManager_ReadOnly_RejectsInsert(t *testing.T) {
	sm := NewSafetyManager(SafetyModeReadOnly, nil, &logging.Logger{})
	err := sm.ValidateStatement("INSERT INTO t VALUES (1)", false)
	if err == nil {
		t.Error("INSERT should be rejected in read-only without allowWrite")
	}
}

func TestSafetyManager_ReadWrite_AllowsAll(t *testing.T) {
	sm := NewSafetyManager(SafetyModeReadWrite, nil, nil)
	for _, q := range []string{"SELECT 1", "INSERT INTO t VALUES (1)", "DELETE FROM t"} {
		err := sm.ValidateStatement(q, false)
		if err != nil {
			t.Errorf("ReadWrite should allow %q: %v", q, err)
		}
	}
}

func TestSafetyManager_EmptyQuery(t *testing.T) {
	sm := NewSafetyManager(SafetyModeReadWrite, nil, nil)
	err := sm.ValidateStatement("", false)
	if err == nil {
		t.Error("empty query should be rejected")
	}
}

func TestNewStatementAllowlist(t *testing.T) {
	al := NewStatementAllowlist([]string{"SELECT * FROM t", "WITH x AS (%)"})
	if al == nil {
		t.Fatal("NewStatementAllowlist returned nil")
	}
}

func TestStatementAllowlist_IsAllowed(t *testing.T) {
	al := NewStatementAllowlist([]string{"SELECT * FROM T"})
	if !al.IsAllowed("SELECT * FROM T") {
		t.Error("exact match should be allowed")
	}
	if !al.IsAllowed("SELECT 1") {
		t.Error("SELECT prefix should be allowed by default")
	}
	if al.IsAllowed("INSERT INTO t VALUES (1)") {
		t.Error("INSERT should not be allowed")
	}
}

func TestStatementAllowlist_AddStatement(t *testing.T) {
	al := NewStatementAllowlist(nil)
	al.AddStatement("UPDATE t SET x = 1")
	if !al.IsAllowed("UPDATE t SET x = 1") {
		t.Error("AddStatement should allow the statement")
	}
}
