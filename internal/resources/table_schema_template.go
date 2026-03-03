/*-------------------------------------------------------------------------
 *
 * table_schema_template.go
 *    URI template resource for single table schema (neurondb://table/{name}/schema)
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/resources/table_schema_template.go
 *
 *-------------------------------------------------------------------------
 */

package resources

import (
	"context"
	"fmt"

	"github.com/neurondb/NeuronMCP/internal/database"
)

const tableSchemaURITemplate = "neurondb://table/{name}/schema"

/* NewTableSchemaTemplateHandler returns a handler for neurondb://table/{name}/schema */
func NewTableSchemaTemplateHandler(db *database.Database) func(ctx context.Context, params map[string]string) (interface{}, error) {
	return func(ctx context.Context, params map[string]string) (interface{}, error) {
		tableName := params["name"]
		if tableName == "" {
			return nil, fmt.Errorf("template parameter 'name' is required")
		}
		/* Support schema.table format */
		schema := "public"
		name := tableName
		if idx := indexOfDot(tableName); idx >= 0 {
			schema = tableName[:idx]
			name = tableName[idx+1:]
		}
		if !isValidIdentifier(schema) || !isValidIdentifier(name) {
			return nil, fmt.Errorf("invalid table name: %s", tableName)
		}
		base := NewBaseResource(db)
		query := `
			SELECT 
				column_name,
				ordinal_position,
				column_default,
				is_nullable,
				data_type,
				udt_name,
				character_maximum_length,
				numeric_precision,
				numeric_scale
			FROM information_schema.columns
			WHERE table_schema = $1 AND table_name = $2
			ORDER BY ordinal_position
		`
		rows, err := base.executeQuery(ctx, query, []interface{}{schema, name})
		if err != nil {
			return nil, fmt.Errorf("failed to query table schema: %w", err)
		}
		return map[string]interface{}{
			"schema":  schema,
			"table":   name,
			"columns": rows,
			"count":   len(rows),
		}, nil
	}
}

func indexOfDot(s string) int {
	for i, r := range s {
		if r == '.' {
			return i
		}
	}
	return -1
}
