/**
 * ML metrics and evaluation tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class CalculateAccuracyTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "calculate_accuracy",
			description: "Calculate classification accuracy",
			inputSchema: {
				type: "object",
				properties: {
					predictions_table: { type: "string" },
					ground_truth_table: { type: "string" },
					prediction_col: { type: "string" },
					truth_col: { type: "string" },
					id_col: { type: "string", description: "ID column to join tables" },
				},
				required: ["predictions_table", "ground_truth_table", "prediction_col", "truth_col", "id_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { predictions_table, ground_truth_table, prediction_col, truth_col, id_col } = params;
			const query = `
				SELECT 
					COUNT(*) FILTER (WHERE p.${this.db.escapeIdentifier(prediction_col)} = g.${this.db.escapeIdentifier(truth_col)})::float / COUNT(*) AS accuracy
				FROM ${this.db.escapeIdentifier(predictions_table)} p
				JOIN ${this.db.escapeIdentifier(ground_truth_table)} g ON p.${this.db.escapeIdentifier(id_col)} = g.${this.db.escapeIdentifier(id_col)}
			`;
			const result = await this.executor.executeQueryOne(query);
			return this.success(result);
		} catch (error) {
			this.logger.error("Accuracy calculation failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Accuracy calculation failed", "METRICS_ERROR");
		}
	}
}

export class CalculateRMSETool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "calculate_rmse",
			description: "Calculate Root Mean Squared Error",
			inputSchema: {
				type: "object",
				properties: {
					predictions_table: { type: "string" },
					ground_truth_table: { type: "string" },
					prediction_col: { type: "string" },
					truth_col: { type: "string" },
					id_col: { type: "string" },
				},
				required: ["predictions_table", "ground_truth_table", "prediction_col", "truth_col", "id_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { predictions_table, ground_truth_table, prediction_col, truth_col, id_col } = params;
			const query = `
				SELECT 
					SQRT(AVG(POWER(p.${this.db.escapeIdentifier(prediction_col)} - g.${this.db.escapeIdentifier(truth_col)}, 2))) AS rmse
				FROM ${this.db.escapeIdentifier(predictions_table)} p
				JOIN ${this.db.escapeIdentifier(ground_truth_table)} g ON p.${this.db.escapeIdentifier(id_col)} = g.${this.db.escapeIdentifier(id_col)}
			`;
			const result = await this.executor.executeQueryOne(query);
			return this.success(result);
		} catch (error) {
			this.logger.error("RMSE calculation failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "RMSE calculation failed", "METRICS_ERROR");
		}
	}
}

