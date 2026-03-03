/*-------------------------------------------------------------------------
 *
 * resource.go
 *    Database operations
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/resources/resource.go
 *
 *-------------------------------------------------------------------------
 */

package resources

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/neurondb/NeuronMCP/internal/database"
)

/* Resource is the interface that all resources must implement */
type Resource interface {
	URI() string
	Name() string
	Description() string
	MimeType() string
	GetContent(ctx context.Context) (interface{}, error)
}

/* BaseResource provides common functionality for resources */
type BaseResource struct {
	db *database.Database
}

/* NewBaseResource creates a new base resource */
func NewBaseResource(db *database.Database) *BaseResource {
	return &BaseResource{db: db}
}

/* executeQuery executes a query and returns results */
func (r *BaseResource) executeQuery(ctx context.Context, query string, params []interface{}) ([]map[string]interface{}, error) {
	rows, err := r.db.Query(ctx, query, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return database.ScanRowsToMaps(rows)
}

/* executeQueryOne executes a query and returns a single row */
func (r *BaseResource) executeQueryOne(ctx context.Context, query string, params []interface{}) (map[string]interface{}, error) {
	rows, err := r.db.Query(ctx, query, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, fmt.Errorf("no rows returned")
	}

	result, err := database.ScanRowToMap(rows)
	if err != nil {
		return nil, err
	}

	return result, rows.Err()
}

/* Manager manages all resources */
type Manager struct {
	resources           map[string]Resource
	templateResources   []templateResourceEntry
	db                  *database.Database
	subscriptionManager *SubscriptionManager
}

/* templateResourceEntry holds a URI template and a handler that accepts extracted params */
type templateResourceEntry struct {
	uriTemplate string
	name        string
	description string
	mimeType    string
	handler     func(ctx context.Context, params map[string]string) (interface{}, error)
}

/* Template param pattern: {paramName} */
var templateParamRegex = regexp.MustCompile(`^\{([a-zA-Z][a-zA-Z0-9_]*)\}$`)

/* NewManager creates a new resource manager */
func NewManager(db *database.Database) *Manager {
	m := &Manager{
		resources:           make(map[string]Resource),
		db:                  db,
		subscriptionManager: NewSubscriptionManager(),
	}

	/* Register built-in resources */
	m.Register(NewSchemaResource(db))
	m.Register(NewModelsResource(db))
	m.Register(NewIndexesResource(db))
	m.Register(NewConfigResource(db))
	m.Register(NewWorkersResource(db))
	m.Register(NewVectorStatsResource(db))
	m.Register(NewIndexHealthResource(db))
	m.Register(NewDatasetsResource(db))
	m.Register(NewCollectionsResource(db))

	/* URI template: neurondb://table/{name}/schema */
	m.RegisterTemplate(
		tableSchemaURITemplate,
		"Table schema",
		"Schema (columns) for a single table. Use neurondb://table/my_table/schema or neurondb://table/schema_name.table_name/schema",
		"application/json",
		NewTableSchemaTemplateHandler(db),
	)

	return m
}

/* Register registers a resource */
func (m *Manager) Register(resource Resource) {
	m.resources[resource.URI()] = resource
}

/* RegisterTemplate registers a parameterized resource with a URI template (e.g. neurondb://table/{name}/schema) */
func (m *Manager) RegisterTemplate(uriTemplate, name, description, mimeType string, handler func(ctx context.Context, params map[string]string) (interface{}, error)) {
	m.templateResources = append(m.templateResources, templateResourceEntry{
		uriTemplate: uriTemplate,
		name:        name,
		description: description,
		mimeType:    mimeType,
		handler:     handler,
	})
}

/* GetSubscriptionManager returns the subscription manager */
func (m *Manager) GetSubscriptionManager() *SubscriptionManager {
	return m.subscriptionManager
}

/* ListResources returns all registered resources (static + template) */
func (m *Manager) ListResources() []ResourceDefinition {
	definitions := make([]ResourceDefinition, 0, len(m.resources)+len(m.templateResources))
	for _, resource := range m.resources {
		definitions = append(definitions, ResourceDefinition{
			URI:         resource.URI(),
			Name:        resource.Name(),
			Description: resource.Description(),
			MimeType:    resource.MimeType(),
		})
	}
	for _, t := range m.templateResources {
		definitions = append(definitions, ResourceDefinition{
			URI:         t.uriTemplate,
			URITemplate: t.uriTemplate,
			Name:        t.name,
			Description: t.description,
			MimeType:    t.mimeType,
		})
	}
	return definitions
}

/* HandleResource handles a resource request (exact URI or URI template match) */
func (m *Manager) HandleResource(ctx context.Context, uri string) (*ReadResourceResponse, error) {
	/* Exact match first */
	resource, exists := m.resources[uri]
	if exists {
		content, err := resource.GetContent(ctx)
		if err != nil {
			return nil, err
		}
		contentJSON, err := json.MarshalIndent(content, "", "  ")
		if err != nil {
			return nil, err
		}
		return &ReadResourceResponse{
			Contents: []ResourceContent{
				{URI: resource.URI(), MimeType: resource.MimeType(), Text: string(contentJSON)},
			},
		}, nil
	}

	/* Try template match */
	for _, t := range m.templateResources {
		params, ok := matchURITemplate(t.uriTemplate, uri)
		if !ok {
			continue
		}
		content, err := t.handler(ctx, params)
		if err != nil {
			return nil, err
		}
		contentJSON, err := json.MarshalIndent(content, "", "  ")
		if err != nil {
			return nil, err
		}
		return &ReadResourceResponse{
			Contents: []ResourceContent{
				{URI: uri, MimeType: t.mimeType, Text: string(contentJSON)},
			},
		}, nil
	}

	return nil, &ResourceNotFoundError{URI: uri}
}

/* matchURITemplate matches uri against template (e.g. neurondb://table/{name}/schema), returns params or false */
func matchURITemplate(template, uri string) (map[string]string, bool) {
	tParts := strings.Split(template, "/")
	uParts := strings.Split(uri, "/")
	if len(tParts) != len(uParts) {
		return nil, false
	}
	params := make(map[string]string)
	for i, tSeg := range tParts {
		uSeg := uParts[i]
		if matches := templateParamRegex.FindStringSubmatch(tSeg); len(matches) == 2 {
			params[matches[1]] = uSeg
		} else if tSeg != uSeg {
			return nil, false
		}
	}
	return params, true
}

/* ResourceDefinition represents a resource definition */
type ResourceDefinition struct {
	URI         string `json:"uri"`
	URITemplate string `json:"uriTemplate,omitempty"`
	Name        string `json:"name"`
	Description string `json:"description"`
	MimeType    string `json:"mimeType"`
}

/* ReadResourceResponse represents a resource read response */
type ReadResourceResponse struct {
	Contents []ResourceContent `json:"contents"`
}

/* ResourceContent represents resource content */
type ResourceContent struct {
	URI      string `json:"uri"`
	MimeType string `json:"mimeType"`
	Text     string `json:"text"`
}

/* ResourceNotFoundError is returned when a resource is not found */
type ResourceNotFoundError struct {
	URI string
}

/* Error returns the error message */
func (e *ResourceNotFoundError) Error() string {
	return "resource not found: " + e.URI
}
