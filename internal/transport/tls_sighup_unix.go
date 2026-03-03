//go:build unix

package transport

import (
	"os"
	"os/signal"
	"syscall"
)

func init() {
	startSIGHUPReload = func(r *certReloader) {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGHUP)
		go func() {
			for range sigCh {
				r.reload()
			}
		}()
	}
}
