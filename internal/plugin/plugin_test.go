/*-------------------------------------------------------------------------
 *
 * plugin_test.go
 *    Tests for plugin package
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/plugin/plugin_test.go
 *
 *-------------------------------------------------------------------------
 */

package plugin

import (
	"context"
	"testing"
)

func TestNewPluginManager(t *testing.T) {
	pm := NewPluginManager()
	if pm == nil {
		t.Fatal("NewPluginManager returned nil")
	}
}

type mockPlugin struct {
	name string
}

func (m *mockPlugin) Name() string   { return m.name }
func (m *mockPlugin) Version() string { return "1.0" }
func (m *mockPlugin) Type() PluginType { return PluginTypeTool }
func (m *mockPlugin) Initialize(ctx context.Context, config map[string]interface{}) error {
	return nil
}
func (m *mockPlugin) Shutdown(ctx context.Context) error { return nil }

func TestPluginManager_RegisterPlugin(t *testing.T) {
	pm := NewPluginManager()
	err := pm.RegisterPlugin(&mockPlugin{name: "test"})
	if err != nil {
		t.Fatalf("RegisterPlugin: %v", err)
	}
	err = pm.RegisterPlugin(&mockPlugin{name: "test"})
	if err == nil {
		t.Fatal("expected error when registering duplicate plugin name")
	}
}
