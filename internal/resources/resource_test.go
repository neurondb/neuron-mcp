package resources

import (
	"testing"
)

func TestMatchURITemplate(t *testing.T) {
	tests := []struct {
		template  string
		uri       string
		wantOK    bool
		wantParam string
	}{
		{"neurondb://table/{name}/schema", "neurondb://table/my_table/schema", true, "my_table"},
		{"neurondb://table/{name}/schema", "neurondb://table/public.users/schema", true, "public.users"},
		{"neurondb://table/{name}/schema", "neurondb://tables", false, ""},
		{"neurondb://table/{name}/schema", "neurondb://table/schema", false, ""},
		{"neurondb://table/{name}/schema", "neurondb://table/a/b/schema", false, ""},
	}
	for _, tt := range tests {
		params, ok := matchURITemplate(tt.template, tt.uri)
		if ok != tt.wantOK {
			t.Errorf("matchURITemplate(%q, %q) ok=%v want %v", tt.template, tt.uri, ok, tt.wantOK)
			continue
		}
		if tt.wantOK && tt.wantParam != "" && params["name"] != tt.wantParam {
			t.Errorf("matchURITemplate(%q, %q) params[name]=%q want %q", tt.template, tt.uri, params["name"], tt.wantParam)
		}
	}
}
