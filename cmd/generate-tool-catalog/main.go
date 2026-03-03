/* generate-tool-catalog generates docs/tool-catalog.md from registered tool definitions */
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"

	"github.com/neurondb/NeuronMCP/internal/config"
	"github.com/neurondb/NeuronMCP/internal/database"
	"github.com/neurondb/NeuronMCP/internal/logging"
	"github.com/neurondb/NeuronMCP/internal/tools"
)

func main() {
	db := database.NewDatabase()
	logger := logging.NewLogger(&config.LoggingConfig{Level: "warn", Format: "text"})
	registry := tools.NewToolRegistry(db, logger)
	tools.RegisterAllTools(registry, db, logger)

	defs := registry.GetAllDefinitions()
	sort.Slice(defs, func(i, j int) bool { return defs[i].Name < defs[j].Name })

	out := os.Stdout
	if len(os.Args) > 1 {
		f, err := os.Create(os.Args[1])
		if err != nil {
			fmt.Fprintf(os.Stderr, "create file: %v\n", err)
			os.Exit(1)
		}
		defer f.Close()
		out = f
	}

	fmt.Fprintf(out, "# NeuronMCP Tool Catalog (auto-generated)\n\n")
	fmt.Fprintf(out, "Total tools: %d\n\n", len(defs))
	fmt.Fprintf(out, "| Name | Description | ReadOnly | Destructive | Idempotent |\n")
	fmt.Fprintf(out, "|------|-------------|----------|-------------|------------|\n")

	for _, d := range defs {
		ro := ""
		if d.Annotations.ReadOnly {
			ro = "✓"
		}
		dest := ""
		if d.Annotations.Destructive {
			dest = "✓"
		}
		idem := ""
		if d.Annotations.Idempotent {
			idem = "✓"
		}
		fmt.Fprintf(out, "| %s | %s | %s | %s | %s |\n",
			d.Name, truncate(d.Description, 60), ro, dest, idem)
	}

	fmt.Fprintf(out, "\n## Input schemas (JSON)\n\n")
	for _, d := range defs {
		fmt.Fprintf(out, "### %s\n\n", d.Name)
		if d.InputSchema != nil {
			b, _ := json.MarshalIndent(d.InputSchema, "", "  ")
			fmt.Fprintf(out, "```json\n%s\n```\n\n", string(b))
		}
	}
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-3] + "..."
}
