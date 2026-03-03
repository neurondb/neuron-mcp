/*-------------------------------------------------------------------------
 *
 * executor.go
 *    Query executor for NeuronMCP tools
 *
 * Provides database query execution functionality with timeouts and
 * error handling for all tool operations.
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/tools/executor.go
 *
 *-------------------------------------------------------------------------
 */

package tools

import (
	"context"
	"fmt"
	"time"

	"github.com/neurondb/NeuronMCP/internal/database"
)

const (
	DefaultQueryTimeout   = 60 * time.Second
	EmbeddingQueryTimeout = 120 * time.Second
	VectorSearchTimeout   = 30 * time.Second
)

/* QueryExecutor executes database queries for tools */
type QueryExecutor struct {
	db *database.Database
}

/* NewQueryExecutor creates a new query executor */
func NewQueryExecutor(db *database.Database) *QueryExecutor {
	return &QueryExecutor{db: db}
}

/* ExecuteVectorSearch executes a vector search query */
func (e *QueryExecutor) ExecuteVectorSearch(ctx context.Context, table, vectorColumn string, queryVector []interface{}, distanceMetric string, limit int, additionalColumns []interface{}) ([]map[string]interface{}, error) {
	return e.ExecuteVectorSearchWithMinkowski(ctx, table, vectorColumn, queryVector, distanceMetric, limit, additionalColumns, nil)
}

/* ExecuteVectorSearchWithMinkowski executes a vector search query with optional Minkowski p parameter */
func (e *QueryExecutor) ExecuteVectorSearchWithMinkowski(ctx context.Context, table, vectorColumn string, queryVector []interface{}, distanceMetric string, limit int, additionalColumns []interface{}, minkowskiP *float64) ([]map[string]interface{}, error) {
	if e.db == nil {
		return nil, fmt.Errorf("query executor database instance is nil: cannot execute vector search on table '%s', column '%s'", table, vectorColumn)
	}

	if !e.db.IsConnected() {
		return nil, fmt.Errorf("database connection not available: cannot execute vector search on table '%s', column '%s' (database connection pool is not initialized)", table, vectorColumn)
	}

	if table == "" {
		return nil, fmt.Errorf("table name is required for vector search: table parameter is empty")
	}

	if vectorColumn == "" {
		return nil, fmt.Errorf("vector column name is required for vector search: vector_column parameter is empty for table '%s'", table)
	}

	if len(queryVector) == 0 {
		return nil, fmt.Errorf("query vector cannot be empty: vector search on table '%s', column '%s' requires a non-empty query vector", table, vectorColumn)
	}

	vec := make([]float32, 0, len(queryVector))
	for i, v := range queryVector {
		if f, ok := v.(float64); ok {
			vec = append(vec, float32(f))
		} else if f, ok := v.(float32); ok {
			vec = append(vec, f)
		} else {
			return nil, fmt.Errorf("invalid vector element type at index %d: expected float64 or float32, got %T (value: %v) for vector search on table '%s', column '%s'", i, v, v, table, vectorColumn)
		}
	}

	cols := make([]string, 0, len(additionalColumns))
	for i, col := range additionalColumns {
		if str, ok := col.(string); ok {
			if str == "" {
				return nil, fmt.Errorf("additional column at index %d is empty string for vector search on table '%s', column '%s'", i, table, vectorColumn)
			}
			cols = append(cols, str)
		} else {
			return nil, fmt.Errorf("additional column at index %d has invalid type: expected string, got %T (value: %v) for vector search on table '%s', column '%s'", i, col, col, table, vectorColumn)
		}
	}

	validMetrics := map[string]bool{"l2": true, "cosine": true, "inner_product": true, "l1": true, "hamming": true, "chebyshev": true, "minkowski": true}
	if !validMetrics[distanceMetric] {
		return nil, fmt.Errorf("invalid distance metric '%s' for vector search on table '%s', column '%s': valid metrics are l2, cosine, inner_product, l1, hamming, chebyshev, minkowski", distanceMetric, table, vectorColumn)
	}

	if limit <= 0 {
		return nil, fmt.Errorf("invalid limit %d for vector search on table '%s', column '%s': limit must be greater than 0", limit, table, vectorColumn)
	}
	if limit > 10000 {
		return nil, fmt.Errorf("limit %d exceeds maximum allowed value of 10000 for vector search on table '%s', column '%s'", limit, table, vectorColumn)
	}

	qb := &database.QueryBuilder{}
	query, params := qb.VectorSearch(table, vectorColumn, vec, distanceMetric, limit, cols, minkowskiP)

	queryCtx, cancel := context.WithTimeout(ctx, VectorSearchTimeout)
	defer cancel()

	/* Check if context is already cancelled before executing query */
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("vector search cancelled: table='%s', vector_column='%s', distance_metric='%s', limit=%d, error=%w", table, vectorColumn, distanceMetric, limit, ctx.Err())
	default:
	}

	rows, err := e.db.Query(queryCtx, query, params...)
	if err != nil {
		if queryCtx.Err() != nil {
			return nil, fmt.Errorf("vector search timeout after %v: table='%s', vector_column='%s', distance_metric='%s', limit=%d, error=%w", VectorSearchTimeout, table, vectorColumn, distanceMetric, limit, queryCtx.Err())
		}
		/* Check if parent context was cancelled */
		if ctx.Err() != nil {
			return nil, fmt.Errorf("vector search cancelled: table='%s', vector_column='%s', distance_metric='%s', limit=%d, error=%w", table, vectorColumn, distanceMetric, limit, ctx.Err())
		}
		return nil, fmt.Errorf("vector search execution failed: table='%s', vector_column='%s', distance_metric='%s', limit=%d, vector_dimension=%d, additional_columns=%v, error=%w", table, vectorColumn, distanceMetric, limit, len(vec), cols, err)
	}
	defer rows.Close()

	/* Check context before scanning rows */
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("vector search cancelled during row scanning: table='%s', vector_column='%s', distance_metric='%s', limit=%d, error=%w", table, vectorColumn, distanceMetric, limit, ctx.Err())
	default:
	}

	results, err := database.ScanRowsToMaps(rows)
	if err != nil {
		return nil, fmt.Errorf("failed to scan vector search results: table='%s', vector_column='%s', distance_metric='%s', limit=%d, error=%w", table, vectorColumn, distanceMetric, limit, err)
	}

	return results, nil
}

/* ExecuteQuery executes a query and returns all rows */
func (e *QueryExecutor) ExecuteQuery(ctx context.Context, query string, params []interface{}) ([]map[string]interface{}, error) {
	if e.db == nil {
		return nil, fmt.Errorf("query executor database instance is nil: cannot execute query '%s' with %d parameters", query, len(params))
	}

	if !e.db.IsConnected() {
		return nil, fmt.Errorf("database connection not available: cannot execute query '%s' with %d parameters (database connection pool is not initialized)", query, len(params))
	}

	if query == "" {
		return nil, fmt.Errorf("query string is empty: cannot execute empty query")
	}

	queryCtx, cancel := context.WithTimeout(ctx, DefaultQueryTimeout)
	defer cancel()

	/* Check if context is already cancelled before executing query */
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("query cancelled: query='%s', parameter_count=%d, error=%w", query, len(params), ctx.Err())
	default:
	}

	rows, err := e.db.Query(queryCtx, query, params...)
	if err != nil {
		if queryCtx.Err() != nil {
			return nil, fmt.Errorf("query timeout after %v: query='%s', parameter_count=%d, error=%w", DefaultQueryTimeout, query, len(params), queryCtx.Err())
		}
		/* Check if parent context was cancelled */
		if ctx.Err() != nil {
			return nil, fmt.Errorf("query cancelled: query='%s', parameter_count=%d, error=%w", query, len(params), ctx.Err())
		}
		return nil, fmt.Errorf("query execution failed: query='%s', parameter_count=%d, parameters=%v, error=%w", query, len(params), params, err)
	}
	defer rows.Close()

	/* Check context before scanning rows */
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("query cancelled during row scanning: query='%s', parameter_count=%d, error=%w", query, len(params), ctx.Err())
	default:
	}

	results, err := database.ScanRowsToMaps(rows)
	if err != nil {
		return nil, fmt.Errorf("failed to scan query results: query='%s', parameter_count=%d, error=%w", query, len(params), err)
	}

	return results, nil
}

/* ExecuteQueryOne executes a query and returns a single row */
func (e *QueryExecutor) ExecuteQueryOne(ctx context.Context, query string, params []interface{}) (map[string]interface{}, error) {
	return e.ExecuteQueryOneWithTimeout(ctx, query, params, DefaultQueryTimeout)
}

/* ExecuteQueryOneWithTimeout executes a query with a specific timeout */
func (e *QueryExecutor) ExecuteQueryOneWithTimeout(ctx context.Context, query string, params []interface{}, timeout time.Duration) (map[string]interface{}, error) {
	if e.db == nil {
		return nil, fmt.Errorf("query executor database instance is nil: cannot execute single-row query '%s' with %d parameters", query, len(params))
	}

	if !e.db.IsConnected() {
		return nil, fmt.Errorf("database connection not available: cannot execute single-row query '%s' with %d parameters (database connection pool is not initialized)", query, len(params))
	}

	if query == "" {
		return nil, fmt.Errorf("query string is empty: cannot execute empty query for single row result")
	}

	queryCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	/* Check if context is already cancelled before executing query */
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("query cancelled: query='%s', parameter_count=%d, error=%w", query, len(params), ctx.Err())
	default:
	}

	rows, err := e.db.Query(queryCtx, query, params...)
	if err != nil {
		/* Check if error is due to context cancellation/timeout */
		if queryCtx.Err() != nil {
			return nil, fmt.Errorf("query timeout after %v: query='%s', parameter_count=%d, error=%w", timeout, query, len(params), queryCtx.Err())
		}
		/* Check if parent context was cancelled */
		if ctx.Err() != nil {
			return nil, fmt.Errorf("query cancelled: query='%s', parameter_count=%d, error=%w", query, len(params), ctx.Err())
		}
		return nil, fmt.Errorf("single-row query execution failed: query='%s', parameter_count=%d, parameters=%v, error=%w", query, len(params), params, err)
	}
	defer rows.Close()

	/* Check context before scanning */
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("query cancelled before scanning: query='%s', parameter_count=%d, error=%w", query, len(params), ctx.Err())
	default:
	}
	if queryCtx.Err() != nil {
		return nil, fmt.Errorf("query timeout after %v: query='%s', parameter_count=%d, error=%w", timeout, query, len(params), queryCtx.Err())
	}

	if !rows.Next() {
		return nil, fmt.Errorf("no rows returned from single-row query: query='%s', parameter_count=%d, parameters=%v (expected exactly one row)", query, len(params), params)
	}

	result, err := database.ScanRowToMap(rows)
	if err != nil {
		/* Check context again after scanning */
		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("query cancelled during row scanning: query='%s', parameter_count=%d, error=%w", query, len(params), ctx.Err())
		default:
		}
		if queryCtx.Err() != nil {
			return nil, fmt.Errorf("query timeout after %v during row scanning: query='%s', parameter_count=%d, error=%w", timeout, query, len(params), queryCtx.Err())
		}
		return nil, fmt.Errorf("failed to scan single row result: query='%s', parameter_count=%d, error=%w", query, len(params), err)
	}

	if rows.Next() {
		return nil, fmt.Errorf("multiple rows returned from single-row query: query='%s', parameter_count=%d, parameters=%v (expected exactly one row, got at least two)", query, len(params), params)
	}

	/* Final context check */
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("query cancelled: query='%s', parameter_count=%d, error=%w", query, len(params), ctx.Err())
	default:
	}
	if queryCtx.Err() != nil {
		return nil, fmt.Errorf("query timeout after %v: query='%s', parameter_count=%d, error=%w", timeout, query, len(params), queryCtx.Err())
	}

	return result, nil
}

/* Exec executes a query without returning rows (for DDL statements) */
func (e *QueryExecutor) Exec(ctx context.Context, query string, params []interface{}) error {
	if e.db == nil {
		return fmt.Errorf("query executor database instance is nil: cannot execute DDL query '%s' with %d parameters", query, len(params))
	}

	if !e.db.IsConnected() {
		return fmt.Errorf("database connection not available: cannot execute DDL query '%s' with %d parameters (database connection pool is not initialized)", query, len(params))
	}

	if query == "" {
		return fmt.Errorf("query string is empty: cannot execute empty DDL query")
	}

	/* Check if context is already cancelled before executing */
	select {
	case <-ctx.Done():
		return fmt.Errorf("query cancelled: query='%s', parameter_count=%d, error=%w", query, len(params), ctx.Err())
	default:
	}

	_, err := e.db.Exec(ctx, query, params...)
	if err != nil {
		/* Check if context was cancelled */
		if ctx.Err() != nil {
			return fmt.Errorf("query cancelled: query='%s', parameter_count=%d, error=%w", query, len(params), ctx.Err())
		}
		return fmt.Errorf("DDL query execution failed: query='%s', parameter_count=%d, parameters=%v, error=%w", query, len(params), params, err)
	}
	return nil
}
