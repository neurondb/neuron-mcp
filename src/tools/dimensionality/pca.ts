/**
 * PCA dimensionality reduction tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PCAFitTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "pca_fit",
			description: "Fit PCA model to data",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					vector_column: { type: "string" },
					n_components: { type: "number", minimum: 1, description: "Number of components" },
				},
				required: ["table", "vector_column", "n_components"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, vector_column, n_components } = params;
			const query = `SELECT compute_pca($1, $2, $3) AS pca_model`;
			const result = await this.executor.executeQueryOne(query, [table, vector_column, n_components]);
			return this.success(result, { n_components });
		} catch (error) {
			this.logger.error("PCA fit failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "PCA fit failed", "PCA_ERROR");
		}
	}
}

export class PCATransformTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "pca_transform",
			description: "Transform data using fitted PCA model",
			inputSchema: {
				type: "object",
				properties: {
					model_id: { type: "number", description: "PCA model ID" },
					vector: { type: "array", items: { type: "number" } },
				},
				required: ["model_id", "vector"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { model_id, vector } = params;
			const vStr = `[${vector.join(",")}]`;
			const query = `SELECT pca_transform($1::integer, $2::vector) AS transformed`;
			const result = await this.executor.executeQueryOne(query, [model_id, vStr]);
			return this.success(result, { model_id });
		} catch (error) {
			this.logger.error("PCA transform failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "PCA transform failed", "PCA_ERROR");
		}
	}
}





