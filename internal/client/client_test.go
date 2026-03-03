/*-------------------------------------------------------------------------
 *
 * client_test.go
 *    Tests for client package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/client/client_test.go
 *
 *-------------------------------------------------------------------------
 */

package client

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadConfig_FileNotFound(t *testing.T) {
	_, err := LoadConfig("/nonexistent/path/neuronmcp.json", "server1")
	if err == nil {
		t.Fatal("expected error for missing file")
	}
}

func TestLoadConfig_InvalidPath(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")
	if err := os.WriteFile(path, []byte(`{"mcpServers":{}}`), 0644); err != nil {
		t.Fatal(err)
	}
	_, err := LoadConfig(path, "missing_server")
	if err == nil {
		t.Fatal("expected error when server name not in config")
	}
}

func TestLoadConfig_Success(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")
	cfg := `{"mcpServers":{"neurondb":{"command":"/bin/echo","env":{"K":"V"},"args":["a"]}}}`
	if err := os.WriteFile(path, []byte(cfg), 0644); err != nil {
		t.Fatal(err)
	}
	c, err := LoadConfig(path, "neurondb")
	if err != nil {
		t.Fatalf("LoadConfig: %v", err)
	}
	if c.Command != "/bin/echo" {
		t.Errorf("Command: got %s", c.Command)
	}
	if c.Env["K"] != "V" {
		t.Errorf("Env: got %v", c.Env)
	}
	if len(c.Args) != 1 || c.Args[0] != "a" {
		t.Errorf("Args: got %v", c.Args)
	}
}
