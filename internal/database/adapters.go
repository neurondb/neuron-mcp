/*-------------------------------------------------------------------------
 *
 * adapters.go
 *    Adapters from pgx types to database interfaces
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/database/adapters.go
 *
 *-------------------------------------------------------------------------
 */

package database

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

/* rowsAdapter adapts pgx.Rows to database.Rows */
type rowsAdapter struct {
	pgx.Rows
}

/* FieldDescriptions returns column metadata for the result set */
func (r *rowsAdapter) FieldDescriptions() []FieldDescription {
	descs := r.Rows.FieldDescriptions()
	out := make([]FieldDescription, len(descs))
	for i, d := range descs {
		out[i] = FieldDescription{Name: string(d.Name), DataTypeOID: d.DataTypeOID}
	}
	return out
}

/* Ensure rowsAdapter implements Rows */
var _ Rows = (*rowsAdapter)(nil)

/* commandTagAdapter adapts pgconn.CommandTag to CommandResult */
type commandTagAdapter struct {
	pgconn.CommandTag
}

/* Ensure commandTagAdapter implements CommandResult (pgconn.CommandTag has RowsAffected() int64) */
var _ CommandResult = commandTagAdapter{}

/* txAdapter adapts pgx.Tx to database.Tx */
type txAdapter struct {
	tx pgx.Tx
}

/* NewTxAdapter wraps pgx.Tx as database.Tx */
func NewTxAdapter(tx pgx.Tx) Tx {
	if tx == nil {
		return nil
	}
	return &txAdapter{tx: tx}
}

/* Commit commits the transaction */
func (t *txAdapter) Commit(ctx context.Context) error {
	return t.tx.Commit(ctx)
}

/* Rollback rolls back the transaction */
func (t *txAdapter) Rollback(ctx context.Context) error {
	return t.tx.Rollback(ctx)
}

/* Query executes a query and returns rows */
func (t *txAdapter) Query(ctx context.Context, query string, args ...interface{}) (Rows, error) {
	rows, err := t.tx.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	return &rowsAdapter{Rows: rows}, nil
}

/* QueryRow executes a query and returns a single row */
func (t *txAdapter) QueryRow(ctx context.Context, query string, args ...interface{}) Row {
	return t.tx.QueryRow(ctx, query, args...)
}

/* Exec executes a command */
func (t *txAdapter) Exec(ctx context.Context, query string, args ...interface{}) (CommandResult, error) {
	tag, err := t.tx.Exec(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	return &commandTagAdapter{CommandTag: tag}, nil
}

/* Ensure txAdapter implements Tx */
var _ Tx = (*txAdapter)(nil)
