/*
 * Tool registry manages MCP tool definitions and registration
 *
 * Provides thread-safe tool registration, lookup, and filtering
 * for MCP protocol compatibility.
 */

package tools

import (
	"fmt"
	"reflect"
	"regexp"
	"strings"
	"sync"

	"github.com/neurondb/NeuronMCP/internal/database"
	"github.com/neurondb/NeuronMCP/internal/logging"
	"github.com/neurondb/NeuronMCP/pkg/mcp"
)

/* Valid tool name pattern: alphanumeric, underscore, hyphen, max 100 chars */
var toolNamePattern = regexp.MustCompile(`^[a-zA-Z0-9_-]+$`)
const maxToolNameLength = 100

/* annotationsForToolName returns MCP hints based on tool name patterns */
func annotationsForToolName(name string) ToolAnnotations {
	nameLower := strings.ToLower(name)
	readOnly := false
	destructive := false
	idempotent := false
	/* Read-only: only prefix match so we don't mark create_/drop_ as read-only */
	readOnlyPrefixes := []string{"list_", "get_", "describe_", "show_", "explain_", "postgresql_version", "postgresql_stats", "postgresql_database_list", "postgresql_connections", "postgresql_locks", "postgresql_replication", "postgresql_settings", "postgresql_extensions", "postgresql_tables", "postgresql_indexes", "postgresql_schemas", "postgresql_views", "postgresql_sequences", "postgresql_functions", "postgresql_triggers", "postgresql_constraints", "postgresql_users", "postgresql_roles", "postgresql_permissions", "postgresql_table_stats", "postgresql_index_stats", "postgresql_active_queries", "postgresql_wait_events", "postgresql_table_size", "postgresql_index_size", "postgresql_bloat", "postgresql_vacuum_stats", "postgresql_transactions", "postgresql_slow_queries", "postgresql_cache_hit", "postgresql_buffer_stats", "postgresql_partitions", "postgresql_partition_stats", "postgresql_fdw_servers", "postgresql_fdw_tables", "postgresql_logical_replication_slots", "postgresql_query_plan", "postgresql_query_history", "postgresql_list_backups", "postgresql_verify_backup", "index_status", "list_models", "get_model_info", "evaluate_model", "analyze_data", "detect_outliers", "topic_discovery", "get_embedding_model_config", "list_embedding_model_configs", "quality_metrics", "drift_detection", "dataset_loading", "worker_management", "gpu_monitoring"}
	for _, p := range readOnlyPrefixes {
		if strings.HasPrefix(nameLower, p) {
			readOnly = true
			break
		}
	}
	/* Destructive: drop, delete, terminate, kill, cancel, reindex, restore */
	destructivePatterns := []string{"drop_", "delete_", "terminate", "kill_", "cancel_", "reindex", "restore_", "truncate"}
	for _, p := range destructivePatterns {
		if strings.Contains(nameLower, p) {
			destructive = true
			break
		}
	}
	/* Idempotent: reload_config, set_config, vacuum, analyze */
	idempotentPatterns := []string{"reload_config", "set_config", "vacuum", "analyze"}
	for _, p := range idempotentPatterns {
		if strings.Contains(nameLower, p) {
			idempotent = true
			break
		}
	}
	return ToolAnnotations{ReadOnly: readOnly, Destructive: destructive, Idempotent: idempotent}
}

/* applyAnnotationsToTool sets annotations on tool if it has SetAnnotations (e.g. *BaseTool or embedded) */
func applyAnnotationsToTool(tool Tool, ann ToolAnnotations) {
	if tool == nil {
		return
	}
	/* Direct *BaseTool or type that implements SetAnnotations */
	if setter, ok := tool.(interface{ SetAnnotations(ToolAnnotations) }); ok {
		setter.SetAnnotations(ann)
		return
	}
	/* Struct embedding *BaseTool: use reflection to find and set */
	rv := reflect.ValueOf(tool)
	if rv.Kind() == reflect.Ptr {
		rv = rv.Elem()
	}
	if rv.Kind() != reflect.Struct {
		return
	}
	baseType := reflect.TypeOf((*BaseTool)(nil))
	for i := 0; i < rv.NumField(); i++ {
		f := rv.Field(i)
		if f.Kind() == reflect.Ptr && f.Type() == baseType && !f.IsNil() {
			if base, ok := f.Interface().(*BaseTool); ok {
				base.SetAnnotations(ann)
			}
			return
		}
	}
}

/* ToolDefinition represents a tool's definition for MCP */
type ToolDefinition struct {
	Name         string                 `json:"name"`
	Description  string                 `json:"description"`
	InputSchema  map[string]interface{} `json:"inputSchema"`
	OutputSchema map[string]interface{} `json:"outputSchema,omitempty"`
	Version      string                 `json:"version,omitempty"`
	Deprecated   bool                   `json:"deprecated,omitempty"`
	Deprecation  *mcp.DeprecationInfo   `json:"deprecation,omitempty"`
	Annotations  ToolAnnotations        `json:"-"` /* MCP hints; set from Tool.Annotations() */
}

/* ToolRegistry manages tool registration and execution */
type ToolRegistry struct {
	tools      map[string]Tool
	definitions map[string]ToolDefinition
	mu         sync.RWMutex
	db         *database.Database
	logger     *logging.Logger
}

/* NewToolRegistry creates a new tool registry */
func NewToolRegistry(db *database.Database, logger *logging.Logger) *ToolRegistry {
	return &ToolRegistry{
		tools:       make(map[string]Tool),
		definitions: make(map[string]ToolDefinition),
		db:          db,
		logger:      logger,
	}
}

/* Register registers a tool */
func (r *ToolRegistry) Register(tool Tool) {
	if r == nil {
		panic("ToolRegistry is nil")
	}
	if tool == nil {
		if r.logger != nil {
			r.logger.Error("Cannot register nil tool", fmt.Errorf("tool is nil"), nil)
		}
		return
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	toolName := tool.Name()
	/* Apply MCP annotations by name pattern so list/get/drop etc. get correct hints */
	applyAnnotationsToTool(tool, annotationsForToolName(toolName))

	/* Validate tool name */
	if err := validateToolName(toolName); err != nil {
		if r.logger != nil {
			r.logger.Error("Invalid tool name", err, map[string]interface{}{
				"tool_name": toolName,
				"error":     err.Error(),
			})
		}
		return
	}

	/* Check for duplicate tool names and warn with detailed information */
	if existingTool, exists := r.tools[toolName]; exists {
		if r.logger != nil {
			existingVersion := existingTool.Version()
			newVersion := tool.Version()
			r.logger.Warn(fmt.Sprintf("Duplicate tool name detected: %s (overwriting existing tool)", toolName), map[string]interface{}{
				"tool_name":           toolName,
				"existing_description": existingTool.Description(),
				"existing_version":    existingVersion,
				"new_description":     tool.Description(),
				"new_version":         newVersion,
				"overwriting":         true,
			})
		}
	}

	/* Validate input schema */
	inputSchema := tool.InputSchema()
	if err := validateSchema(inputSchema, "input"); err != nil {
		if r.logger != nil {
			r.logger.Warn(fmt.Sprintf("Invalid input schema for tool %s: %s", toolName, err.Error()), map[string]interface{}{
				"tool_name": toolName,
				"error":     err.Error(),
			})
		}
		/* Use default schema if invalid */
		inputSchema = map[string]interface{}{
			"type":       "object",
			"properties": map[string]interface{}{},
		}
	}

	/* Validate output schema if provided */
	outputSchema := tool.OutputSchema()
	if outputSchema != nil {
		if err := validateSchema(outputSchema, "output"); err != nil {
			if r.logger != nil {
				r.logger.Warn(fmt.Sprintf("Invalid output schema for tool %s: %s", toolName, err.Error()), map[string]interface{}{
					"tool_name": toolName,
					"error":     err.Error(),
				})
			}
			/* Set to nil if invalid */
			outputSchema = nil
		}
	}

	definition := ToolDefinition{
		Name:         toolName,
		Description:  tool.Description(),
		InputSchema:  inputSchema,
		OutputSchema: outputSchema,
		Version:      tool.Version(),
		Deprecated:   tool.Deprecated(),
		Deprecation:  tool.Deprecation(),
		Annotations:   tool.Annotations(),
	}

	r.tools[toolName] = tool
	r.definitions[toolName] = definition
	if r.logger != nil {
		r.logger.Debug(fmt.Sprintf("Registered tool: %s (version: %s)", toolName, tool.Version()), nil)
	}
}

/* validateToolName validates a tool name */
func validateToolName(name string) error {
	if name == "" {
		return fmt.Errorf("tool name cannot be empty")
	}
	if len(name) > maxToolNameLength {
		return fmt.Errorf("tool name too long: %d characters (max: %d)", len(name), maxToolNameLength)
	}
	if !toolNamePattern.MatchString(name) {
		return fmt.Errorf("tool name contains invalid characters: '%s' (must match pattern: %s)", name, toolNamePattern.String())
	}
	return nil
}

/* validateSchema validates a JSON schema structure */
func validateSchema(schema map[string]interface{}, schemaType string) error {
	if schema == nil {
		return fmt.Errorf("%s schema cannot be nil", schemaType)
	}
	
	/* Check if type field exists and is valid */
	if typeVal, exists := schema["type"]; exists {
		if typeStr, ok := typeVal.(string); ok {
			validTypes := []string{"object", "array", "string", "number", "integer", "boolean", "null"}
			valid := false
			for _, vt := range validTypes {
				if typeStr == vt {
					valid = true
					break
				}
			}
			if !valid {
				return fmt.Errorf("invalid schema type: %s (must be one of: %v)", typeStr, validTypes)
			}
		} else {
			return fmt.Errorf("schema type must be a string, got: %T", typeVal)
		}
	}
	
	/* Validate properties if it exists */
	if properties, exists := schema["properties"]; exists {
		if propertiesMap, ok := properties.(map[string]interface{}); !ok {
			return fmt.Errorf("schema properties must be a map, got: %T", properties)
		} else {
			/* Validate each property */
			for propName, propSchema := range propertiesMap {
				if propSchemaMap, ok := propSchema.(map[string]interface{}); ok {
					if err := validateSchema(propSchemaMap, fmt.Sprintf("%s.property[%s]", schemaType, propName)); err != nil {
						return fmt.Errorf("invalid property schema for '%s': %w", propName, err)
					}
				}
			}
		}
	}
	
	return nil
}

/* RegisterAll registers multiple tools */
func (r *ToolRegistry) RegisterAll(tools []Tool) {
	for _, tool := range tools {
		r.Register(tool)
	}
}

/* GetTool retrieves a tool by name */
func (r *ToolRegistry) GetTool(name string) Tool {
	if r == nil {
		return nil
	}
	if name == "" {
		return nil
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.tools[name]
}

/* GetDefinition retrieves a tool definition by name */
func (r *ToolRegistry) GetDefinition(name string) (ToolDefinition, bool) {
	if r == nil || name == "" {
		return ToolDefinition{}, false
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	def, exists := r.definitions[name]
	return def, exists
}

/* GetAllDefinitions returns all tool definitions */
func (r *ToolRegistry) GetAllDefinitions() []ToolDefinition {
	if r == nil {
		return []ToolDefinition{}
	}
	r.mu.RLock()
	defer r.mu.RUnlock()

	definitions := make([]ToolDefinition, 0, len(r.definitions))
	for _, def := range r.definitions {
		definitions = append(definitions, def)
	}
	return definitions
}

/* GetAllToolNames returns all registered tool names */
func (r *ToolRegistry) GetAllToolNames() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	names := make([]string, 0, len(r.tools))
	for name := range r.tools {
		names = append(names, name)
	}
	return names
}

/* HasTool checks if a tool exists */
func (r *ToolRegistry) HasTool(name string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, exists := r.tools[name]
	return exists
}

/* Unregister removes a tool */
func (r *ToolRegistry) Unregister(name string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	removed := false
	if _, exists := r.tools[name]; exists {
		delete(r.tools, name)
		delete(r.definitions, name)
		removed = true
		if r.logger != nil {
			r.logger.Debug(fmt.Sprintf("Unregistered tool: %s", name), nil)
		}
	}
	return removed
}

/* Clear removes all tools */
func (r *ToolRegistry) Clear() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.tools = make(map[string]Tool)
	r.definitions = make(map[string]ToolDefinition)
}

/* GetCount returns the number of registered tools */
func (r *ToolRegistry) GetCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.tools)
}

/* Search searches for tools by name or description */
func (r *ToolRegistry) Search(query string, category string) []ToolDefinition {
	if r == nil {
		return []ToolDefinition{}
	}
	r.mu.RLock()
	defer r.mu.RUnlock()

	results := make([]ToolDefinition, 0)
	queryLower := strings.ToLower(strings.TrimSpace(query))
	categoryLower := strings.ToLower(strings.TrimSpace(category))

	for _, def := range r.definitions {
		/* Search in name */
		nameMatch := query == "" || containsIgnoreCase(def.Name, query) || containsIgnoreCase(def.Name, queryLower)

		/* Search in description */
		descMatch := query == "" || containsIgnoreCase(def.Description, query) || containsIgnoreCase(def.Description, queryLower)

		/* Category filter */
		categoryMatch := true
		if category != "" {
			/* Extract category from tool name prefix */
			categoryMatch = false
			toolNameLower := strings.ToLower(def.Name)
			if strings.HasPrefix(toolNameLower, categoryLower+"_") {
				categoryMatch = true
			}
			/* Also check if category matches common prefixes */
			categories := []string{"vector", "ml", "rag", "analytics", "indexing", "embedding", "hybrid", "rerank"}
			for _, cat := range categories {
				if categoryLower == cat && strings.HasPrefix(toolNameLower, cat+"_") {
					categoryMatch = true
					break
				}
			}
		}

		if (nameMatch || descMatch) && categoryMatch {
			results = append(results, def)
		}
	}

	return results
}

/* containsIgnoreCase checks if a string contains another (case-insensitive) */
func containsIgnoreCase(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || 
		strings.Contains(strings.ToLower(s), strings.ToLower(substr)))
}

