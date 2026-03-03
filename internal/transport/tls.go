/*-------------------------------------------------------------------------
 *
 * tls.go
 *    TLS configuration and cert reload for HTTPS transport
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/transport/tls.go
 *
 *-------------------------------------------------------------------------
 */

package transport

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"os"
	"sync"
)

/* TLSConfigParams holds TLS configuration (filled from config or env) */
type TLSConfigParams struct {
	Enabled    bool
	CertFile   string
	KeyFile    string
	CAFile     string /* Client CA for mTLS */
	MinVersion string /* "1.2" or "1.3" */
	ClientAuth string /* "none", "request", "require" */
}

/* certReloader caches a TLS certificate and reloads on SIGHUP */
type certReloader struct {
	certFile string
	keyFile  string
	mu       sync.RWMutex
	cert     *tls.Certificate
}

func (r *certReloader) getCertificate() (*tls.Certificate, error) {
	r.mu.RLock()
	cert := r.cert
	r.mu.RUnlock()
	if cert != nil {
		return cert, nil
	}
	return r.load()
}

func (r *certReloader) load() (*tls.Certificate, error) {
	cert, err := tls.LoadX509KeyPair(r.certFile, r.keyFile)
	if err != nil {
		return nil, fmt.Errorf("load TLS cert: %w", err)
	}
	r.mu.Lock()
	r.cert = &cert
	r.mu.Unlock()
	return &cert, nil
}

func (r *certReloader) reload() {
	r.mu.Lock()
	r.cert = nil
	r.mu.Unlock()
}

/* BuildTLSConfig builds a *tls.Config from params. If cert/key files are set,
 * config uses GetCertificate so certs can be reloaded on SIGHUP. */
func BuildTLSConfig(params *TLSConfigParams) (*tls.Config, error) {
	if params == nil || !params.Enabled {
		return nil, nil
	}
	if params.CertFile == "" || params.KeyFile == "" {
		return nil, fmt.Errorf("TLS enabled but certFile and keyFile are required")
	}

	reloader := &certReloader{certFile: params.CertFile, keyFile: params.KeyFile}
	if _, err := reloader.load(); err != nil {
		return nil, err
	}

	minVersion := uint16(tls.VersionTLS12)
	switch params.MinVersion {
	case "1.3":
		minVersion = tls.VersionTLS13
	case "1.2", "":
		minVersion = tls.VersionTLS12
	default:
		/* default 1.2 */
	}

	cfg := &tls.Config{
		MinVersion:     minVersion,
		GetCertificate: func(_ *tls.ClientHelloInfo) (*tls.Certificate, error) { return reloader.getCertificate() },
	}

	/* Client auth for mTLS */
	if params.CAFile != "" {
		data, err := os.ReadFile(params.CAFile)
		if err != nil {
			return nil, fmt.Errorf("read client CA file: %w", err)
		}
		pool := x509.NewCertPool()
		if !pool.AppendCertsFromPEM(data) {
			return nil, fmt.Errorf("no valid client CA certs in %s", params.CAFile)
		}
		cfg.ClientCAs = pool
		switch params.ClientAuth {
		case "require":
			cfg.ClientAuth = tls.RequireAndVerifyClientCert
		case "request":
			cfg.ClientAuth = tls.VerifyClientCertIfGiven
		case "none", "":
			if params.CAFile != "" {
				cfg.ClientAuth = tls.VerifyClientCertIfGiven
			}
		default:
			cfg.ClientAuth = tls.NoClientCert
		}
	}

	/* Start SIGHUP handler for cert reload (Unix only, build-tagged) */
	startSIGHUPReload(reloader)

	return cfg, nil
}

/* startSIGHUPReload is set by tls_sighup_*.go build-tagged files; no-op default */
var startSIGHUPReload = func(_ *certReloader) {}
