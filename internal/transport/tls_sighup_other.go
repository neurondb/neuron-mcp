//go:build !unix

package transport

func init() {
	/* SIGHUP not supported on this platform; startSIGHUPReload remains no-op */
}
