/**
 * ML model prediction and inference tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PredictMLModelTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "predict_ml_model",
			description: "Predict using a trained ML model",
			inputSchema: {
				type: "object",
				properties: {
					model_id: { type: "number", description: "Model ID" },
					features: {
						type: "array",
						items: { type: "number" },
						description: "Feature vector",
					},
				},
				required: ["model_id", "features"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { model_id, features } = params;
			const featuresStr = `[${features.join(",")}]`;
			const query = `SELECT predict_ml_model($1::integer, $2::vector) AS prediction`;
			const result = await this.executor.executeQueryOne(query, [model_id, featuresStr]);
			return this.success(result, { model_id });
		} catch (error) {
			this.logger.error("ML model prediction failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "ML model prediction failed",
				"PREDICTION_ERROR"
			);
		}
	}
}

export class PredictBatchTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "predict_batch",
			description: "Batch prediction using a trained ML model",
			inputSchema: {
				type: "object",
				properties: {
					model_id: { type: "number" },
					features_array: {
						type: "array",
						items: {
							type: "array",
							items: { type: "number" },
						},
						description: "Array of feature vectors",
					},
				},
				required: ["model_id", "features_array"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { model_id, features_array } = params;
			// Convert array of arrays to array of vector strings
			const vectorStrings = features_array.map((vec: number[]) => `[${vec.join(",")}]`);
			const query = `
				SELECT array_agg(prediction) AS predictions
				FROM (
					SELECT predict_ml_model($1::integer, unnest($2::vector[])) AS prediction
				) subq
			`;
			const result = await this.executor.executeQueryOne(query, [model_id, vectorStrings]);
			return this.success(result, { model_id, count: features_array.length });
		} catch (error) {
			this.logger.error("Batch prediction failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Batch prediction failed", "PREDICTION_ERROR");
		}
	}
}

export class PredictProbaTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "predict_proba",
			description: "Get prediction probabilities for classification models",
			inputSchema: {
				type: "object",
				properties: {
					model_id: { type: "number" },
					features: { type: "array", items: { type: "number" } },
				},
				required: ["model_id", "features"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { model_id, features } = params;
			const featuresStr = `[${features.join(",")}]`;
			const query = `SELECT predict_proba_ml_model($1::integer, $2::vector) AS probabilities`;
			const result = await this.executor.executeQueryOne(query, [model_id, featuresStr]);
			return this.success(result, { model_id });
		} catch (error) {
			this.logger.error("Probability prediction failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Probability prediction failed",
				"PREDICTION_ERROR"
			);
		}
	}
}

export class PredictExplainTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "predict_explain",
			description: "Get model explanation for a prediction",
			inputSchema: {
				type: "object",
				properties: {
					model_id: { type: "number" },
					features: { type: "array", items: { type: "number" } },
				},
				required: ["model_id", "features"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { model_id, features } = params;
			const featuresStr = `[${features.join(",")}]`;
			const query = `SELECT explain_ml_model($1::integer, $2::vector) AS explanation`;
			const result = await this.executor.executeQueryOne(query, [model_id, featuresStr]);
			return this.success(result, { model_id });
		} catch (error) {
			this.logger.error("Model explanation failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Model explanation failed",
				"PREDICTION_ERROR"
			);
		}
	}
}





