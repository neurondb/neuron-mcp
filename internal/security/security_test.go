/*-------------------------------------------------------------------------
 *
 * security_test.go
 *    Tests for security package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/security/security_test.go
 *
 *-------------------------------------------------------------------------
 */

package security

import (
	"errors"
	"strings"
	"testing"
)

func TestSanitizeError_Nil(t *testing.T) {
	if SanitizeError(nil) != nil {
		t.Error("SanitizeError(nil) should return nil")
	}
}

func TestSanitizeString_RedactsPassword(t *testing.T) {
	in := "connection failed: password=secret123"
	out := SanitizeString(in)
	if out == in {
		t.Error("expected password to be redacted")
	}
	if out != "connection failed: [password redacted]" {
		t.Errorf("unexpected output: %s", out)
	}
}

func TestSanitizeString_SafeMessage(t *testing.T) {
	in := "normal error message"
	out := SanitizeString(in)
	if out != in {
		t.Errorf("safe message should be unchanged: %s", out)
	}
}

func TestSanitizeError_PreservesNonSensitive(t *testing.T) {
	err := errors.New("query failed: syntax error")
	out := SanitizeError(err)
	if out != err {
		t.Error("non-sensitive error should be unchanged")
	}
}

func TestSanitizeString_ConnectionString(t *testing.T) {
	in := "connect postgresql://user:secret@host/db"
	out := SanitizeString(in)
	if out != "connect postgresql://[connection string redacted]" {
		t.Errorf("unexpected: %s", out)
	}
}

func TestSanitizeString_APIToken(t *testing.T) {
	in := "api_key=sk-12345"
	out := SanitizeString(in)
	if out != "[api key redacted]" {
		t.Errorf("unexpected: %s", out)
	}
}

func TestSanitizeString_Email(t *testing.T) {
	in := "user@example.com"
	out := SanitizeString(in)
	if out != "[email redacted]" {
		t.Errorf("unexpected: %s", out)
	}
}

func TestSanitizeError_ReturnsNewErrorWhenRedacted(t *testing.T) {
	err := errors.New("password=secret123")
	out := SanitizeError(err)
	if out == err {
		t.Error("expected new error when message was redacted")
	}
	if out.Error() != "[password redacted]" {
		t.Errorf("unexpected: %s", out.Error())
	}
}

func TestSanitizeErrorWithContext(t *testing.T) {
	err := errors.New("connection failed")
	out := SanitizeErrorWithContext(err, map[string]interface{}{"host": "localhost", "port": 5432})
	if out == nil {
		t.Fatal("expected non-nil error")
	}
	if !strings.Contains(out.Error(), "connection failed") || !strings.Contains(out.Error(), "context:") {
		t.Errorf("expected message with context: %s", out.Error())
	}
	out = SanitizeErrorWithContext(err, map[string]interface{}{"attempt": 1})
	if out == nil {
		t.Fatal("expected non-nil error")
	}
	if !strings.Contains(out.Error(), "context:") {
		t.Errorf("expected context in message: %s", out.Error())
	}
}
