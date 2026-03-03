/*-------------------------------------------------------------------------
 *
 * schemas.go
 *    Common output schemas for NeuronMCP tools
 *
 * Provides reusable output schema definitions for consistent tool responses.
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/tools/schemas.go
 *
 *-------------------------------------------------------------------------
 */

package tools

/* VectorSearchOutputSchema returns the output schema for vector search tools */
func VectorSearchOutputSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "array",
		"items": map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"id": map[string]interface{}{
					"type":        []interface{}{"string", "number"},
					"description": "Record identifier",
				},
				"distance": map[string]interface{}{
					"type":        "number",
					"description": "Distance/similarity score",
				},
				"vector": map[string]interface{}{
					"type":        "array",
					"items":       map[string]interface{}{"type": "number"},
					"description": "Vector embedding",
				},
			},
			"required": []interface{}{"id", "distance"},
		},
		"description": "Array of search results with id, distance, and optional vector",
	}
}

/* ModelInfoOutputSchema returns the output schema for model info tools */
func ModelInfoOutputSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"model_id": map[string]interface{}{
				"type":        "integer",
				"description": "Model identifier",
			},
			"model_name": map[string]interface{}{
				"type":        "string",
				"description": "Model name",
			},
			"algorithm": map[string]interface{}{
				"type":        "string",
				"description": "ML algorithm used",
			},
			"created_at": map[string]interface{}{
				"type":        "string",
				"format":      "date-time",
				"description": "Model creation timestamp",
			},
			"metrics": map[string]interface{}{
				"type":        "object",
				"description": "Model performance metrics",
			},
		},
		"required": []interface{}{"model_id", "model_name", "algorithm"},
	}
}

/* ListOutputSchema returns a generic list output schema */
func ListOutputSchema(itemSchema map[string]interface{}) map[string]interface{} {
	return map[string]interface{}{
		"type": "array",
		"items": itemSchema,
		"description": "List of items",
	}
}

/* SuccessOutputSchema returns a simple success output schema */
func SuccessOutputSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"success": map[string]interface{}{
				"type":        "boolean",
				"description": "Operation success status",
			},
			"message": map[string]interface{}{
				"type":        "string",
				"description": "Success message",
			},
		},
		"required": []interface{}{"success"},
	}
}

/* ErrorOutputSchema returns a standard error output schema */
func ErrorOutputSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"error": map[string]interface{}{
				"type":        "string",
				"description": "Error message",
			},
			"code": map[string]interface{}{
				"type":        "string",
				"description": "Error code",
			},
			"details": map[string]interface{}{
				"type":        "object",
				"description": "Additional error details",
			},
		},
		"required": []interface{}{"error"},
	}
}

/* QueryResultOutputSchema returns the output schema for SQL query execution tools */
func QueryResultOutputSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"success": map[string]interface{}{
				"type":        "boolean",
				"description": "Whether the query succeeded",
			},
			"data": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"rows": map[string]interface{}{
						"type":        "array",
						"items":      map[string]interface{}{"type": "object"},
						"description": "Result rows as array of objects",
					},
					"row_count": map[string]interface{}{
						"type":        "integer",
						"description": "Number of rows returned",
					},
					"columns": map[string]interface{}{
						"type":        "array",
						"items":      map[string]interface{}{"type": "string"},
						"description": "Column names",
					},
				},
				"description": "Query result payload",
			},
			"metadata": map[string]interface{}{
				"type":        "object",
				"description": "Tool metadata (tool name, timing, etc.)",
			},
		},
		"required": []interface{}{"success"},
	}
}

/* TableListOutputSchema returns the output schema for table list tools */
func TableListOutputSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"success": map[string]interface{}{
				"type":        "boolean",
				"description": "Whether the operation succeeded",
			},
			"data": map[string]interface{}{
				"type": "array",
				"items": map[string]interface{}{
					"type": "object",
					"properties": map[string]interface{}{
						"schema_name": map[string]interface{}{"type": "string", "description": "Schema name"},
						"table_name":  map[string]interface{}{"type": "string", "description": "Table name"},
						"table_type":  map[string]interface{}{"type": "string", "description": "Table type"},
					},
				},
				"description": "List of tables",
			},
			"metadata": map[string]interface{}{
				"type":        "object",
				"description": "Tool metadata",
			},
		},
		"required": []interface{}{"success", "data"},
	}
}












