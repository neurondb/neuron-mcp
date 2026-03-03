/**
 * Drift detection tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class DetectDataDriftTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "detect_data_drift",
			description: "Detect data drift between baseline and current datasets",
			inputSchema: {
				type: "object",
				properties: {
					baseline_table: { type: "string" },
					baseline_column: { type: "string" },
					current_table: { type: "string" },
					current_column: { type: "string" },
					threshold: { type: "number", default: 0.1, description: "Drift threshold" },
				},
				required: ["baseline_table", "baseline_column", "current_table", "current_column"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { baseline_table, baseline_column, current_table, current_column, threshold = 0.1 } = params;
			const query = `SELECT detect_distribution_divergence($1, $2, $3, $4, $5) AS drift_result`;
			const result = await this.executor.executeQueryOne(query, [
				baseline_table,
				baseline_column,
				current_table,
				current_column,
				threshold,
			]);
			return this.success(result, { threshold });
		} catch (error) {
			this.logger.error("Data drift detection failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Data drift detection failed",
				"DRIFT_ERROR"
			);
		}
	}
}





