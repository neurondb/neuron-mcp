/*-------------------------------------------------------------------------
 *
 * main_test.go
 *    Build and helper tests for neurondb-mcp-client
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/cmd/neurondb-mcp-client/main_test.go
 *
 *-------------------------------------------------------------------------
 */

package main

import (
	"os"
	"path/filepath"
	"testing"
)

/* TestBuild verifies the package compiles. Main packages have no exported API. */
func TestBuild(t *testing.T) {}

func TestSplitLines(t *testing.T) {
	lines := splitLines("a\nb\nc")
	if len(lines) != 3 || lines[0] != "a" || lines[1] != "b" || lines[2] != "c" {
		t.Errorf("splitLines: got %v", lines)
	}
	lines = splitLines("a\n\nb")
	if len(lines) != 3 || lines[1] != "" {
		t.Errorf("splitLines with empty: got %v", lines)
	}
}

func TestTrimSpace(t *testing.T) {
	if trimSpace("  x  ") != "x" {
		t.Error("trimSpace")
	}
	if trimSpace("x") != "x" {
		t.Error("trimSpace no change")
	}
}

func TestReadCommandsFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "cmds.txt")
	if err := os.WriteFile(path, []byte("list_tools\n# comment\nshow_schema\n"), 0644); err != nil {
		t.Fatal(err)
	}
	cmds, err := readCommandsFile(path)
	if err != nil {
		t.Fatalf("readCommandsFile: %v", err)
	}
	if len(cmds) != 2 {
		t.Errorf("expected 2 commands, got %v", cmds)
	}
	if cmds[0] != "list_tools" || cmds[1] != "show_schema" {
		t.Errorf("got %v", cmds)
	}
}
