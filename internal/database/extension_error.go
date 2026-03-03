/*-------------------------------------------------------------------------
 *
 * extension_error.go
 *    Clear errors when NeuronDB/vector extension is missing
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/database/extension_error.go
 *
 *-------------------------------------------------------------------------
 */

package database

import (
	"errors"
	"fmt"
	"strings"
)

/* ErrExtensionMissing is returned when a required extension is not installed */
var ErrExtensionMissing = errors.New("required extension is not installed")

/* WrapExtensionError wraps query/exec errors that indicate missing NeuronDB or vector extension */
func WrapExtensionError(err error) error {
	if err == nil {
		return nil
	}
	msg := strings.ToLower(err.Error())
	/* Function does not exist (e.g. neurondb_* or vector_*) */
	if strings.Contains(msg, "does not exist") {
		if strings.Contains(msg, "neurondb") || strings.Contains(msg, "function neurondb_") {
			return fmt.Errorf("NeuronDB extension is not installed. Install it with: CREATE EXTENSION neurondb; %w", err)
		}
		if strings.Contains(msg, "type") && (strings.Contains(msg, "vector") || strings.Contains(msg, "17648")) {
			return fmt.Errorf("vector type not found. Install pgvector with: CREATE EXTENSION vector; (or use NeuronDB which includes vector support). %w", err)
		}
	}
	/* Relation "neurondb.xxx" does not exist */
	if strings.Contains(msg, "relation") && strings.Contains(msg, "neurondb") {
		return fmt.Errorf("NeuronDB schema or objects not found. Install the NeuronDB extension: CREATE EXTENSION neurondb; %w", err)
	}
	return err
}
