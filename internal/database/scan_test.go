package database

import (
	"testing"
)

/* mockRows implements Rows for testing */
type mockRows struct {
	rows   [][]interface{}
	fields []FieldDescription
	index  int
	closed bool
	err    error
}

func (m *mockRows) Next() bool {
	if m.closed || m.index >= len(m.rows) {
		return false
	}
	m.index++
	return m.index <= len(m.rows)
}

func (m *mockRows) Scan(dest ...interface{}) error {
	if m.index == 0 || m.index > len(m.rows) {
		return nil
	}
	row := m.rows[m.index-1]
	for i, d := range dest {
		if i >= len(row) {
			break
		}
		switch p := d.(type) {
		case *string:
			if s, ok := row[i].(string); ok {
				*p = s
			}
		case *int:
			if n, ok := row[i].(int); ok {
				*p = n
			}
		case *interface{}:
			*p = row[i]
		}
	}
	return nil
}

func (m *mockRows) Close() {
	m.closed = true
}

func (m *mockRows) Err() error {
	return m.err
}

func (m *mockRows) FieldDescriptions() []FieldDescription {
	return m.fields
}

func TestScanRowsToMaps(t *testing.T) {
	rows := &mockRows{
		fields: []FieldDescription{
			{Name: "id", DataTypeOID: 23},
			{Name: "name", DataTypeOID: 1043},
		},
		rows: [][]interface{}{
			{1, "alice"},
			{2, "bob"},
		},
	}
	defer rows.Close()

	maps, err := ScanRowsToMaps(rows)
	if err != nil {
		t.Fatalf("ScanRowsToMaps: %v", err)
	}
	if len(maps) != 2 {
		t.Errorf("expected 2 rows, got %d", len(maps))
	}
	if maps[0]["name"] != "alice" || maps[1]["name"] != "bob" {
		t.Errorf("unexpected row data: %v", maps)
	}
}

func TestScanRowsToMaps_Empty(t *testing.T) {
	rows := &mockRows{
		fields: []FieldDescription{{Name: "x", DataTypeOID: 23}},
		rows:   [][]interface{}{},
	}
	defer rows.Close()

	maps, err := ScanRowsToMaps(rows)
	if err != nil {
		t.Fatalf("ScanRowsToMaps empty: %v", err)
	}
	if len(maps) != 0 {
		t.Errorf("expected 0 rows, got %d", len(maps))
	}
}
