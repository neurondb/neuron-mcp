/**
 * Tool registry integration - registers all tools
 */

import { ToolRegistry } from "./registry.js";
import { Database } from "../database/connection.js";
import { Logger } from "../logging/logger.js";

// Vector tools
import * as VectorTools from "./vector/index.js";

// ML tools
import * as MLTools from "./ml/index.js";

// Analytics tools
import * as AnalyticsTools from "./analytics/index.js";

// GPU tools
import * as GPUTools from "./gpu/index.js";

// PostgreSQL tools
import * as PostgreSQLTools from "./postgresql/index.js";

/**
 * Register all tools with the registry
 */
export function registerAllTools(registry: ToolRegistry, db: Database, logger: Logger): void {
	// Vector tools
	registry.register(new VectorTools.VectorSearchTool(db, logger));
	registry.register(new VectorTools.VectorSearchL2Tool(db, logger));
	registry.register(new VectorTools.VectorSearchCosineTool(db, logger));
	registry.register(new VectorTools.VectorSearchInnerProductTool(db, logger));
	registry.register(new VectorTools.VectorSearchL1Tool(db, logger));
	registry.register(new VectorTools.VectorSearchHammingTool(db, logger));
	registry.register(new VectorTools.VectorSearchChebyshevTool(db, logger));
	registry.register(new VectorTools.VectorSearchMinkowskiTool(db, logger));

	registry.register(new VectorTools.GenerateEmbeddingTool(db, logger));
	registry.register(new VectorTools.BatchEmbeddingTool(db, logger));
	registry.register(new VectorTools.EmbedImageTool(db, logger));
	registry.register(new VectorTools.EmbedMultimodalTool(db, logger));
	registry.register(new VectorTools.EmbedCachedTool(db, logger));

	registry.register(new VectorTools.ConfigureEmbeddingModelTool(db, logger));
	registry.register(new VectorTools.GetEmbeddingModelConfigTool(db, logger));
	registry.register(new VectorTools.ListEmbeddingModelConfigsTool(db, logger));
	registry.register(new VectorTools.DeleteEmbeddingModelConfigTool(db, logger));

	registry.register(new VectorTools.VectorAddTool(db, logger));
	registry.register(new VectorTools.VectorNormTool(db, logger));
	registry.register(new VectorTools.VectorNormalizeTool(db, logger));
	registry.register(new VectorTools.VectorDotProductTool(db, logger));
	registry.register(new VectorTools.VectorSubtractTool(db, logger));
	registry.register(new VectorTools.VectorMultiplyTool(db, logger));
	registry.register(new VectorTools.VectorDivideTool(db, logger));
	registry.register(new VectorTools.VectorConcatTool(db, logger));
	registry.register(new VectorTools.VectorMinTool(db, logger));
	registry.register(new VectorTools.VectorMaxTool(db, logger));
	registry.register(new VectorTools.VectorAbsTool(db, logger));
	registry.register(new VectorTools.VectorNegateTool(db, logger));

	registry.register(new VectorTools.CreateHNSWIndexTool(db, logger));
	registry.register(new VectorTools.DropIndexTool(db, logger));
	registry.register(new VectorTools.IndexStatisticsTool(db, logger));

	// ML training tools
	registry.register(new MLTools.TrainLinearRegressionTool(db, logger));
	registry.register(new MLTools.TrainRidgeRegressionTool(db, logger));
	registry.register(new MLTools.TrainLassoRegressionTool(db, logger));
	registry.register(new MLTools.TrainLogisticRegressionTool(db, logger));
	registry.register(new MLTools.TrainRandomForestTool(db, logger));
	registry.register(new MLTools.TrainSVMTool(db, logger));
	registry.register(new MLTools.TrainKNNTool(db, logger));
	registry.register(new MLTools.TrainDecisionTreeTool(db, logger));
	registry.register(new MLTools.TrainNaiveBayesTool(db, logger));
	registry.register(new MLTools.TrainXGBoostTool(db, logger));
	registry.register(new MLTools.TrainLightGBMTool(db, logger));
	registry.register(new MLTools.TrainCatBoostTool(db, logger));

	// ML prediction tools
	registry.register(new MLTools.PredictMLModelTool(db, logger));
	registry.register(new MLTools.PredictBatchTool(db, logger));
	registry.register(new MLTools.PredictProbaTool(db, logger));
	registry.register(new MLTools.PredictExplainTool(db, logger));

	// ML management tools
	registry.register(new MLTools.GetModelInfoTool(db, logger));
	registry.register(new MLTools.ListModelsTool(db, logger));
	registry.register(new MLTools.DeleteModelTool(db, logger));
	registry.register(new MLTools.ModelMetricsTool(db, logger));

	// Analytics tools
	registry.register(new AnalyticsTools.ClusterKMeansTool(db, logger));
	registry.register(new AnalyticsTools.ClusterMiniBatchKMeansTool(db, logger));
	registry.register(new AnalyticsTools.ClusterGMMTool(db, logger));
	registry.register(new AnalyticsTools.ClusterDBSCANTool(db, logger));
	registry.register(new AnalyticsTools.ClusterHierarchicalTool(db, logger));
	registry.register(new AnalyticsTools.DetectOutliersZScoreTool(db, logger));

	// GPU tools
	registry.register(new GPUTools.GPUInfoTool(db, logger));
	registry.register(new GPUTools.GPUStatusTool(db, logger));

	// Hybrid search tools
	import("./hybrid/index.js").then((HybridTools) => {
		registry.register(new HybridTools.HybridSearchTool(db, logger));
	});

	// RAG tools
	import("./rag/index.js").then((RAGTools) => {
		registry.register(new RAGTools.RAGChunkTextTool(db, logger));
	});

	// Project tools
	import("./projects/index.js").then((ProjectTools) => {
		registry.register(new ProjectTools.CreateMLProjectTool(db, logger));
		registry.register(new ProjectTools.ListMLProjectsTool(db, logger));
	});

	// Worker tools
	import("./workers/index.js").then((WorkerTools) => {
		registry.register(new WorkerTools.WorkerStatusTool(db, logger));
	});

	// Reranking tools
	import("./reranking/index.js").then((RerankingTools) => {
		registry.register(new RerankingTools.RerankCrossEncoderTool(db, logger));
		registry.register(new RerankingTools.RerankFlashTool(db, logger));
	});

	// Quantization tools
	import("./quantization/index.js").then((QuantizationTools) => {
		registry.register(new QuantizationTools.QuantizeFP8Tool(db, logger));
		registry.register(new QuantizationTools.AnalyzeFP8Tool(db, logger));
	});

	// Dimensionality reduction tools
	import("./dimensionality/index.js").then((DimensionalityTools) => {
		registry.register(new DimensionalityTools.PCAFitTool(db, logger));
		registry.register(new DimensionalityTools.PCATransformTool(db, logger));
	});

	// Metrics tools
	import("./metrics/index.js").then((MetricsTools) => {
		registry.register(new MetricsTools.CalculateAccuracyTool(db, logger));
		registry.register(new MetricsTools.CalculateRMSETool(db, logger));
	});

	// Drift detection tools
	import("./drift/index.js").then((DriftTools) => {
		registry.register(new DriftTools.DetectDataDriftTool(db, logger));
	});

	// PostgreSQL tools
	registry.register(new PostgreSQLTools.PostgreSQLVersionTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLStatsTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLDatabaseListTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLConnectionsTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLLocksTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLReplicationTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLSettingsTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLExtensionsTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLTablesTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLIndexesTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLSchemasTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLViewsTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLSequencesTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLFunctionsTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLTriggersTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLUsersTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLRolesTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLPermissionsTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLTableStatsTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLIndexStatsTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLActiveQueriesTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLWaitEventsTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLTableSizeTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLIndexSizeTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLConstraintsTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLBloatTool(db, logger));
	registry.register(new PostgreSQLTools.PostgreSQLVacuumStatsTool(db, logger));
}

