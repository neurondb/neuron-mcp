/*-------------------------------------------------------------------------
 *
 * interfaces.go
 *    Database interfaces for NeuronMCP
 *
 * Defines Querier, Execer, and related types to decouple components from
 * concrete pgx implementation and enable testing with mocks.
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/database/interfaces.go
 *
 *-------------------------------------------------------------------------
 */

package database

import "context"

/* FieldDescription describes a result set column (thin copy of pgconn.FieldDescription) */
type FieldDescription struct {
	Name        string
	DataTypeOID uint32
}

/* Rows represents a query result set (thin interface over pgx.Rows) */
type Rows interface {
	Next() bool
	Scan(dest ...interface{}) error
	Close()
	Err() error
	FieldDescriptions() []FieldDescription
}

/* Row represents a single row (thin interface over pgx.Row) */
type Row interface {
	Scan(dest ...interface{}) error
}

/* CommandResult represents the result of an Exec (thin interface over pgconn.CommandTag) */
type CommandResult interface {
	RowsAffected() int64
}

/* Querier executes queries that return rows */
type Querier interface {
	Query(ctx context.Context, query string, args ...interface{}) (Rows, error)
	QueryRow(ctx context.Context, query string, args ...interface{}) Row
}

/* Execer executes commands that do not return rows */
type Execer interface {
	Exec(ctx context.Context, query string, args ...interface{}) (CommandResult, error)
}

/* TxBeginner starts a transaction */
type TxBeginner interface {
	Begin(ctx context.Context) (Tx, error)
}

/* Tx represents a database transaction */
type Tx interface {
	Commit(ctx context.Context) error
	Rollback(ctx context.Context) error
	Query(ctx context.Context, query string, args ...interface{}) (Rows, error)
	QueryRow(ctx context.Context, query string, args ...interface{}) Row
	Exec(ctx context.Context, query string, args ...interface{}) (CommandResult, error)
}
