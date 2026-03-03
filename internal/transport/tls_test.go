package transport

import (
	"testing"
)

func TestBuildTLSConfig_Disabled(t *testing.T) {
	cfg, err := BuildTLSConfig(&TLSConfigParams{Enabled: false})
	if err != nil {
		t.Fatalf("expected nil error when disabled: %v", err)
	}
	if cfg != nil {
		t.Fatal("expected nil config when disabled")
	}
}

func TestBuildTLSConfig_NilParams(t *testing.T) {
	cfg, err := BuildTLSConfig(nil)
	if err != nil {
		t.Fatalf("expected nil error for nil params: %v", err)
	}
	if cfg != nil {
		t.Fatal("expected nil config for nil params")
	}
}

func TestBuildTLSConfig_EnabledNoCert(t *testing.T) {
	_, err := BuildTLSConfig(&TLSConfigParams{Enabled: true})
	if err == nil {
		t.Fatal("expected error when TLS enabled but cert/key empty")
	}
}

func TestBuildTLSConfig_EnabledBadCertPath(t *testing.T) {
	_, err := BuildTLSConfig(&TLSConfigParams{
		Enabled:  true,
		CertFile: "/nonexistent/cert.pem",
		KeyFile:  "/nonexistent/key.pem",
	})
	if err == nil {
		t.Fatal("expected error when cert file does not exist")
	}
}
