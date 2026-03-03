/**
 * ML model management tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class GetModelInfoTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "get_model_info",
			description: "Get detailed information about a trained model",
			inputSchema: {
				type: "object",
				properties: {
					model_id: { type: "number", description: "Model ID" },
				},
				required: ["model_id"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { model_id } = params;
			const query = `
				SELECT * FROM neurondb.ml_models
				WHERE model_id = $1
			`;
			const result = await this.executor.executeQueryOne(query, [model_id]);
			if (!result) {
				return this.error("Model not found", "NOT_FOUND", { model_id });
			}
			return this.success(result, { model_id });
		} catch (error) {
			this.logger.error("Get model info failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Get model info failed", "MODEL_ERROR");
		}
	}
}

export class ListModelsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "list_models",
			description: "List all trained models",
			inputSchema: {
				type: "object",
				properties: {
					algorithm: {
						type: "string",
						description: "Filter by algorithm (optional)",
					},
					limit: { type: "number", default: 100, minimum: 1, maximum: 1000 },
				},
				required: [],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		try {
			const { algorithm, limit = 100 } = params;
			let query = `
				SELECT * FROM neurondb.ml_models
			`;
			const queryParams: any[] = [];

			if (algorithm) {
				query += ` WHERE algorithm = $1`;
				queryParams.push(algorithm);
			}

			query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1}`;
			queryParams.push(limit);

			const results = await this.executor.executeQuery(query, queryParams);
			return this.success(results, { count: results.length, algorithm: algorithm || "all" });
		} catch (error) {
			this.logger.error("List models failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "List models failed", "MODEL_ERROR");
		}
	}
}

export class DeleteModelTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "delete_model",
			description: "Delete a trained model",
			inputSchema: {
				type: "object",
				properties: {
					model_id: { type: "number" },
				},
				required: ["model_id"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { model_id } = params;
			const query = `DELETE FROM neurondb.ml_models WHERE model_id = $1 RETURNING model_id`;
			const result = await this.executor.executeQueryOne(query, [model_id]);
			if (!result) {
				return this.error("Model not found", "NOT_FOUND", { model_id });
			}
			return this.success({ deleted: true }, { model_id });
		} catch (error) {
			this.logger.error("Delete model failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Delete model failed", "MODEL_ERROR");
		}
	}
}

export class ModelMetricsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "model_metrics",
			description: "Get metrics for a trained model",
			inputSchema: {
				type: "object",
				properties: {
					model_id: { type: "number" },
				},
				required: ["model_id"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { model_id } = params;
			const query = `
				SELECT metrics FROM neurondb.ml_models
				WHERE model_id = $1
			`;
			const result = await this.executor.executeQueryOne(query, [model_id]);
			if (!result) {
				return this.error("Model not found", "NOT_FOUND", { model_id });
			}
			return this.success(result, { model_id });
		} catch (error) {
			this.logger.error("Get model metrics failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Get model metrics failed",
				"MODEL_ERROR"
			);
		}
	}
}





