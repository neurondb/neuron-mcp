/*-------------------------------------------------------------------------
 *
 * interfaces.go
 *    Logger interface for NeuronMCP
 *
 * Decouples components from concrete zerolog implementation for testing.
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/logging/interfaces.go
 *
 *-------------------------------------------------------------------------
 */

package logging

/* Logger provides structured logging; *Logger implements this interface */
type LoggerInterface interface {
	Debug(message string, metadata map[string]interface{})
	Info(message string, metadata map[string]interface{})
	Warn(message string, metadata map[string]interface{})
	Error(message string, err error, metadata map[string]interface{})
}
