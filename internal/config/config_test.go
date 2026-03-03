package config

import (
	"os"
	"testing"
)

func TestGetDefaultConfig(t *testing.T) {
	cfg := GetDefaultConfig()
	if cfg == nil {
		t.Fatal("GetDefaultConfig() returned nil")
	}
	if cfg.Server.Name == nil || *cfg.Server.Name == "" {
		t.Error("default server name should be set")
	}
	if cfg.Database.Host == nil || *cfg.Database.Host != "localhost" {
		t.Error("default database host should be localhost")
	}
}

func TestMergeWithEnv_TLS(t *testing.T) {
	os.Setenv("NEURONMCP_TLS_CERT_FILE", "/tmp/cert.pem")
	os.Setenv("NEURONMCP_TLS_KEY_FILE", "/tmp/key.pem")
	defer func() {
		os.Unsetenv("NEURONMCP_TLS_CERT_FILE")
		os.Unsetenv("NEURONMCP_TLS_KEY_FILE")
	}()

	cfg := GetDefaultConfig()
	cfg.Server.HTTPTransport = &HTTPTransportConfig{Enabled: boolPtr(true)}
	merged := NewConfigLoader().MergeWithEnv(cfg)
	if merged.Server.HTTPTransport == nil || merged.Server.HTTPTransport.TLS == nil {
		t.Fatal("expected TLS config after merge")
	}
	if merged.Server.HTTPTransport.TLS.CertFile == nil || *merged.Server.HTTPTransport.TLS.CertFile != "/tmp/cert.pem" {
		t.Error("expected CertFile from env")
	}
	if merged.Server.HTTPTransport.TLS.KeyFile == nil || *merged.Server.HTTPTransport.TLS.KeyFile != "/tmp/key.pem" {
		t.Error("expected KeyFile from env")
	}
}

func boolPtr(b bool) *bool {
	return &b
}
