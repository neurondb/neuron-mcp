/*-------------------------------------------------------------------------
 *
 * logger_test.go
 *    Tests for logging package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/logging/logger_test.go
 *
 *-------------------------------------------------------------------------
 */

package logging

import (
	"testing"

	"github.com/neurondb/NeuronMCP/internal/config"
)

func TestNewLogger(t *testing.T) {
	cfg := config.GetDefaultConfig().Logging
	if cfg.Level == "" {
		cfg.Level = "info"
	}
	logger := NewLogger(&cfg)
	if logger == nil {
		t.Fatal("NewLogger returned nil")
	}
	_ = logger.Close()
}

func TestLogger_Child(t *testing.T) {
	cfg := config.GetDefaultConfig().Logging
	if cfg.Level == "" {
		cfg.Level = "info"
	}
	logger := NewLogger(&cfg)
	defer logger.Close()
	child := logger.Child(map[string]interface{}{"key": "val"})
	if child == nil {
		t.Fatal("Child returned nil")
	}
}

func TestLogger_WithContext(t *testing.T) {
	cfg := config.GetDefaultConfig().Logging
	if cfg.Level == "" {
		cfg.Level = "info"
	}
	logger := NewLogger(&cfg)
	defer logger.Close()
	child := logger.WithContext(nil)
	if child != logger {
		t.Error("WithContext(nil) should return same logger")
	}
}
