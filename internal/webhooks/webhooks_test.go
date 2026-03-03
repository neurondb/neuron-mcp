/*-------------------------------------------------------------------------
 *
 * webhooks_test.go
 *    Tests for webhooks package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/webhooks/webhooks_test.go
 *
 *-------------------------------------------------------------------------
 */

package webhooks

import (
	"testing"
	"time"
)

func TestNewManager(t *testing.T) {
	m := NewManager()
	if m == nil {
		t.Fatal("NewManager returned nil")
	}
}

func TestManager_Register_Valid(t *testing.T) {
	m := NewManager()
	w := &Webhook{
		ID:     "w1",
		URL:    "http://localhost/callback",
		Events: []string{"tool.call"},
	}
	err := m.Register(w)
	if err != nil {
		t.Fatalf("Register: %v", err)
	}
}

func TestManager_Register_NilWebhook(t *testing.T) {
	m := NewManager()
	err := m.Register(nil)
	if err == nil {
		t.Fatal("expected error for nil webhook")
	}
}

func TestManager_Register_EmptyID(t *testing.T) {
	m := NewManager()
	err := m.Register(&Webhook{ID: "", URL: "http://x", Events: []string{"e"}})
	if err == nil {
		t.Fatal("expected error for empty ID")
	}
}

func TestWebhookEvent_Structure(t *testing.T) {
	ev := WebhookEvent{
		Type:      "tool.call",
		Timestamp: time.Now(),
		Data:      map[string]interface{}{"tool": "t1"},
	}
	if ev.Type != "tool.call" || ev.Data["tool"] != "t1" {
		t.Error("WebhookEvent structure")
	}
}
