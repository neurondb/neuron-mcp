/*-------------------------------------------------------------------------
 *
 * reliability_test.go
 *    Tests for reliability package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/reliability/reliability_test.go
 *
 *-------------------------------------------------------------------------
 */

package reliability

import (
	"errors"
	"testing"
	"time"
)

func TestNewStructuredError(t *testing.T) {
	e := NewStructuredError(ErrorCodeTimeout, "timed out", map[string]interface{}{"key": "val"})
	if e == nil {
		t.Fatal("NewStructuredError returned nil")
	}
	if e.Code != ErrorCodeTimeout {
		t.Errorf("Code: got %s", e.Code)
	}
	if e.Message != "timed out" {
		t.Errorf("Message: got %s", e.Message)
	}
	if e.Error() != "timed out" {
		t.Errorf("Error(): got %s", e.Error())
	}
}

func TestStructuredErrorWithRequestID(t *testing.T) {
	e := NewStructuredError(ErrorCodeValidation, "bad input", nil).WithRequestID("req-1")
	if e.RequestID != "req-1" {
		t.Errorf("RequestID: got %s", e.RequestID)
	}
	if e.Details["request_id"] != "req-1" {
		t.Error("Details should contain request_id")
	}
}

func TestStructuredErrorWithOriginalError(t *testing.T) {
	orig := errors.New("underlying")
	e := NewStructuredError(ErrorCodeConnection, "conn failed", nil).WithOriginalError(orig)
	if e.OriginalError != orig {
		t.Error("OriginalError not set")
	}
	if e.Unwrap() != orig {
		t.Error("Unwrap should return OriginalError")
	}
}

func TestNewErrorClassifier(t *testing.T) {
	ec := NewErrorClassifier()
	if ec == nil {
		t.Fatal("NewErrorClassifier returned nil")
	}
}

func TestClassifyError_Timeout(t *testing.T) {
	ec := NewErrorClassifier()
	se := ec.ClassifyError(errors.New("context deadline exceeded"), "r1")
	if se == nil {
		t.Fatal("expected structured error")
	}
	if se.Code != ErrorCodeTimeout {
		t.Errorf("expected timeout code, got %s", se.Code)
	}
}

func TestClassifyError_Nil(t *testing.T) {
	ec := NewErrorClassifier()
	se := ec.ClassifyError(nil, "r1")
	if se != nil {
		t.Errorf("expected nil for nil error, got %v", se)
	}
}

func TestGetErrorCode(t *testing.T) {
	e := NewStructuredError(ErrorCodePermission, "denied", nil)
	if GetErrorCode(e) != ErrorCodePermission {
		t.Errorf("GetErrorCode: got %s", GetErrorCode(e))
	}
	if GetErrorCode(errors.New("raw")) != ErrorCodeInternal {
		t.Error("raw error should classify as Internal")
	}
}

func TestIsRetryableError(t *testing.T) {
	if !IsRetryableError(NewStructuredError(ErrorCodeTimeout, "t", nil)) {
		t.Error("timeout should be retryable")
	}
	if !IsRetryableError(NewStructuredError(ErrorCodeConnection, "c", nil)) {
		t.Error("connection should be retryable")
	}
	if IsRetryableError(NewStructuredError(ErrorCodeValidation, "v", nil)) {
		t.Error("validation should not be retryable")
	}
}

func TestNewRetryManager(t *testing.T) {
	rm := NewRetryManager(3, 0, 0, 0)
	if rm == nil {
		t.Fatal("NewRetryManager returned nil")
	}
	if rm.GetMaxRetries() != 3 {
		t.Errorf("GetMaxRetries: got %d", rm.GetMaxRetries())
	}
}

func TestRetryManager_IsIdempotent(t *testing.T) {
	rm := NewRetryManager(1, 0, 0, 0)
	if !rm.IsIdempotent("postgresql_execute_query") {
		t.Error("postgresql_execute_query should be idempotent")
	}
	rm.MarkIdempotent("custom_tool")
	if !rm.IsIdempotent("custom_tool") {
		t.Error("MarkIdempotent should mark tool as idempotent")
	}
}

func TestRetryManager_GetBackoff(t *testing.T) {
	rm := NewRetryManager(2, 100*time.Millisecond, time.Second, 2.0)
	d := rm.GetBackoff(0)
	if d != 100*time.Millisecond {
		t.Errorf("GetBackoff(0): got %v", d)
	}
}

func TestNewRetryableError(t *testing.T) {
	orig := errors.New("transient")
	err := NewRetryableError(orig)
	if err == nil {
		t.Fatal("NewRetryableError returned nil")
	}
	if err.Error() != "transient" {
		t.Errorf("Error(): got %s", err.Error())
	}
}

func TestClassifyError_Connection(t *testing.T) {
	ec := NewErrorClassifier()
	se := ec.ClassifyError(errors.New("connection refused"), "r1")
	if se == nil || se.Code != ErrorCodeConnection {
		t.Errorf("expected connection error, got %v", se)
	}
}

func TestClassifyError_Permission(t *testing.T) {
	ec := NewErrorClassifier()
	se := ec.ClassifyError(errors.New("permission denied"), "r1")
	if se == nil || se.Code != ErrorCodePermission {
		t.Errorf("expected permission error, got %v", se)
	}
}

func TestClassifyError_Validation(t *testing.T) {
	ec := NewErrorClassifier()
	se := ec.ClassifyError(errors.New("invalid parameter"), "r1")
	if se == nil || se.Code != ErrorCodeValidation {
		t.Errorf("expected validation error, got %v", se)
	}
}

func TestClassifyError_NotFound(t *testing.T) {
	ec := NewErrorClassifier()
	se := ec.ClassifyError(errors.New("table does not exist"), "r1")
	if se == nil || se.Code != ErrorCodeNotFound {
		t.Errorf("expected not found error, got %v", se)
	}
}

func TestClassifyError_Safety(t *testing.T) {
	ec := NewErrorClassifier()
	se := ec.ClassifyError(errors.New("read-only violation"), "r1")
	if se == nil || se.Code != ErrorCodeSafety {
		t.Errorf("expected safety error, got %v", se)
	}
}

func TestGetSuggestions_WithSuggestions(t *testing.T) {
	e := NewStructuredError(ErrorCodeTimeout, "t", nil).WithSuggestions("a", "b")
	sug := GetSuggestions(e)
	if len(sug) != 2 || sug[0] != "a" {
		t.Errorf("GetSuggestions: got %v", sug)
	}
}

func TestGetSuggestions_Generated(t *testing.T) {
	e := NewStructuredError(ErrorCodeConnection, "c", nil)
	sug := GetSuggestions(e)
	if len(sug) == 0 {
		t.Error("expected generated suggestions for connection error")
	}
}

func TestFormatError(t *testing.T) {
	e := NewStructuredError(ErrorCodeValidation, "bad input", nil)
	s := FormatError(e, "r1")
	if s != "bad input" {
		t.Errorf("FormatError: got %s", s)
	}
	s = FormatError(errors.New("raw"), "r1")
	if s == "" {
		t.Error("FormatError for raw error should classify and return message")
	}
}
