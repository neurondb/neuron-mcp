/*-------------------------------------------------------------------------
 *
 * scan.go
 *    Shared row scanning for tools and resources
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/database/scan.go
 *
 *-------------------------------------------------------------------------
 */

package database

import (
	"encoding/json"
	"fmt"
)

/* VectorTypeOID is the PostgreSQL OID for the vector type (NeuronDB/pgvector) */
const VectorTypeOID = 17648

/* ScanRowsToMaps scans all rows from Rows into a slice of maps */
func ScanRowsToMaps(rows Rows) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	rowNum := 0

	for rows.Next() {
		rowNum++
		row, err := ScanRowToMap(rows)
		if err != nil {
			fieldDescs := rows.FieldDescriptions()
			fieldNames := make([]string, len(fieldDescs))
			for i, desc := range fieldDescs {
				fieldNames[i] = desc.Name
			}
			return nil, fmt.Errorf("failed to scan row %d: expected columns=%v, error=%w", rowNum, fieldNames, err)
		}
		results = append(results, row)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error while iterating rows: scanned %d rows successfully before error, error=%w", len(results), err)
	}

	return results, nil
}

/* ScanRowToMap scans the current row (caller must have called Next()) into a map */
func ScanRowToMap(rows Rows) (map[string]interface{}, error) {
	fieldDescriptions := rows.FieldDescriptions()
	if len(fieldDescriptions) == 0 {
		return nil, fmt.Errorf("row has no columns: cannot scan empty result set")
	}

	values := make([]interface{}, len(fieldDescriptions))
	valuePointers := make([]interface{}, len(fieldDescriptions))
	fieldNames := make([]string, len(fieldDescriptions))
	textScanners := make([]*string, len(fieldDescriptions))

	for i, desc := range fieldDescriptions {
		fieldNames[i] = desc.Name
		if desc.DataTypeOID == VectorTypeOID || desc.Name == "embedding" || desc.Name == "vector" {
			textScanners[i] = new(string)
			valuePointers[i] = textScanners[i]
		} else {
			valuePointers[i] = &values[i]
		}
	}

	if err := rows.Scan(valuePointers...); err != nil {
		return nil, fmt.Errorf("failed to scan row values: columns=%v, error=%w", fieldNames, err)
	}

	for i, textScanner := range textScanners {
		if textScanner != nil {
			values[i] = *textScanner
		}
	}

	result := make(map[string]interface{})
	for i, desc := range fieldDescriptions {
		val := values[i]
		if bytes, ok := val.([]byte); ok {
			var jsonVal interface{}
			if err := json.Unmarshal(bytes, &jsonVal); err == nil {
				val = jsonVal
			} else {
				val = string(bytes)
			}
		}
		if val != nil {
			if str, ok := val.(string); ok {
				result[desc.Name] = str
			} else {
				result[desc.Name] = fmt.Sprintf("%v", val)
			}
		} else {
			result[desc.Name] = nil
		}
	}

	return result, nil
}
