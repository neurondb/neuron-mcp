/*
 * Filter implements tool filtering logic for NeuronMCP
 *
 * Handles feature flag-based filtering and tool validation
 * for MCP protocol compatibility with different clients.
 */

package server

import (
	"github.com/neurondb/NeuronMCP/internal/config"
	"github.com/neurondb/NeuronMCP/internal/logging"
	"github.com/neurondb/NeuronMCP/internal/tools"
)

/* filterToolsByFeatures filters tools based on feature flags */
func (s *Server) filterToolsByFeatures(definitions []tools.ToolDefinition) []tools.ToolDefinition {
	if s == nil || s.config == nil {
		/* If config is not available, return all tools */
		return definitions
	}
	
	features := s.config.GetFeaturesConfig()
	filtered := make([]tools.ToolDefinition, 0, len(definitions))
	filteredOut := make([]string, 0)
	
	for _, def := range definitions {
		/* Skip tools with empty names */
		if def.Name == "" {
			if s.logger != nil {
				s.logger.Warn("Skipping tool with empty name in filter", map[string]interface{}{
					"description": def.Description,
				})
			}
			filteredOut = append(filteredOut, "<empty>")
			continue
		}
		
		if shouldIncludeTool(def.Name, features, s.logger) {
			filtered = append(filtered, def)
		} else {
			filteredOut = append(filteredOut, def.Name)
		}
	}
	
	if s.logger != nil && len(filteredOut) > 0 {
		s.logger.Debug("Tools filtered out by feature flags", map[string]interface{}{
			"filtered_count": len(filteredOut),
			"filtered_tools": filteredOut,
		})
	}
	
	return filtered
}

/* shouldIncludeTool determines if a tool should be included based on feature flags */
func shouldIncludeTool(toolName string, features *config.FeaturesConfig, logger *logging.Logger) bool {
	if toolName == "" {
		return false
	}
	
	/* If features config is nil, default to enabled for all tools */
	if features == nil {
		return true
	}
	
  /* PostgreSQL tools - always enabled by default */
	if isPostgreSQLTool(toolName) {
		return true
	}
	
  /* Vector tools - default to enabled if feature config exists and is enabled, or if no config (default enabled) */
	if isVectorTool(toolName) {
		if features.Vector == nil {
			return true
		}
		return features.Vector.Enabled
	}
	
  /* ML tools - default to enabled */
	if isMLTool(toolName) {
		if features.ML == nil {
			return true
		}
		return features.ML.Enabled
	}
	
  /* Analytics tools - default to enabled */
	if isAnalyticsTool(toolName) {
		if features.Analytics == nil {
			return true
		}
		return features.Analytics.Enabled
	}
	
  /* RAG tools - default to enabled */
	if isRAGTool(toolName) {
		if features.RAG == nil {
			return true
		}
		return features.RAG.Enabled
	}
	
  /* Project tools - default to enabled */
	if isProjectTool(toolName) {
		if features.Projects == nil {
			return true
		}
		return features.Projects.Enabled
	}
	
  /* GPU tools - default to enabled */
	if isGPUTool(toolName) {
		if features.GPU == nil {
			return true
		}
		return features.GPU.Enabled
	}
	
	/* Default to enabled for unknown tool categories */
	return true
}

/* Tool category checkers */
func isVectorTool(name string) bool {
	if name == "" {
		return false
	}
	/* Check for neurondb_ prefix first, then check for vector-related patterns */
	if len(name) >= 10 && name[:10] == "neurondb_" {
		vectorPatterns := []string{"vector_", "embed_", "generate_embedding", "batch_embedding", "create_hnsw_index", "create_ivf_index", "drop_index", "tune_hnsw", "tune_ivf", "index_status", "vector_similarity", "vector_distance", "vector_arithmetic", "vector_quantize", "hybrid_search", "semantic_keyword", "multi_vector", "faceted_vector", "temporal_vector", "diverse_vector", "text_search", "reciprocal_rank"}
		for _, pattern := range vectorPatterns {
			if len(name) >= 10+len(pattern) && name[10:10+len(pattern)] == pattern {
				return true
			}
		}
	}
	vectorPrefixes := []string{"vector_", "embed_", "multimodal_", "image_embed", "audio_embed"}
	for _, prefix := range vectorPrefixes {
		if len(name) >= len(prefix) && name[:len(prefix)] == prefix {
			return true
		}
	}
	return false
}

func isMLTool(name string) bool {
	if name == "" {
		return false
	}
	/* Check for neurondb_ prefix first */
	if len(name) >= 10 && name[:10] == "neurondb_" {
		mlPatterns := []string{"train_model", "predict", "evaluate_model", "list_models", "get_model_info", "delete_model", "export_model", "predict_batch", "automl", "onnx_model", "model_"}
		for _, pattern := range mlPatterns {
			if len(name) >= 10+len(pattern) && name[10:10+len(pattern)] == pattern {
				return true
			}
		}
	}
	mlPrefixes := []string{"train_", "predict_", "get_model_info", "list_models", "delete_model", "model_metrics", "ml_model_", "ml_ensemble"}
	for _, prefix := range mlPrefixes {
		if len(name) >= len(prefix) && name[:len(prefix)] == prefix {
			return true
		}
	}
	return false
}

func isAnalyticsTool(name string) bool {
	if name == "" {
		return false
	}
	/* Check for neurondb_ prefix first */
	if len(name) >= 10 && name[:10] == "neurondb_" {
		analyticsPatterns := []string{"cluster_data", "detect_outliers", "reduce_dimensionality", "analyze_data", "quality_metrics", "drift_detection", "topic_discovery", "timeseries"}
		for _, pattern := range analyticsPatterns {
			if len(name) >= 10+len(pattern) && name[10:10+len(pattern)] == pattern {
				return true
			}
		}
	}
	analyticsPrefixes := []string{"cluster_", "detect_", "vector_cluster", "vector_anomaly", "vector_dimension"}
	for _, prefix := range analyticsPrefixes {
		if len(name) >= len(prefix) && name[:len(prefix)] == prefix {
			return true
		}
	}
	return false
}

func isRAGTool(name string) bool {
	if name == "" {
		return false
	}
	/* Check for neurondb_ prefix first */
	if len(name) >= 10 && name[:10] == "neurondb_" {
		ragPatterns := []string{"process_document", "retrieve_context", "generate_response", "ingest_documents", "answer_with_citations", "chunk_document"}
		for _, pattern := range ragPatterns {
			if len(name) >= 10+len(pattern) && name[10:10+len(pattern)] == pattern {
				return true
			}
		}
	}
	ragPrefixes := []string{"rag_", "chunk_"}
	for _, prefix := range ragPrefixes {
		if len(name) >= len(prefix) && name[:len(prefix)] == prefix {
			return true
		}
	}
	return false
}

func isProjectTool(name string) bool {
	if name == "" {
		return false
	}
	projectPrefixes := []string{"create_ml_project", "list_ml_projects", "project_"}
	for _, prefix := range projectPrefixes {
		if len(name) >= len(prefix) && name[:len(prefix)] == prefix {
			return true
		}
	}
	return false
}

func isGPUTool(name string) bool {
	if name == "" {
		return false
	}
	/* Check for neurondb_ prefix first */
	if len(name) >= 10 && name[:10] == "neurondb_" {
		if len(name) >= 13 && name[10:13] == "gpu" {
			return true
		}
	}
	gpuPrefixes := []string{"gpu_"}
	for _, prefix := range gpuPrefixes {
		if len(name) >= len(prefix) && name[:len(prefix)] == prefix {
			return true
		}
	}
	return false
}

func isPostgreSQLTool(name string) bool {
	if name == "" {
		return false
	}
	return len(name) >= 11 && name[:11] == "postgresql_"
}

