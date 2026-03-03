/**
 * Outlier detection tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class DetectOutliersZScoreTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "detect_outliers_zscore",
			description: "Detect outliers using Z-score method",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					vector_column: { type: "string" },
					threshold: { type: "number", default: 3.0, description: "Z-score threshold" },
				},
				required: ["table", "vector_column"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, vector_column, threshold = 3.0 } = params;
			const query = `SELECT detect_outliers_zscore($1, $2, $3) AS outliers`;
			const result = await this.executor.executeQueryOne(query, [table, vector_column, threshold]);
			return this.success(result, { method: "zscore", threshold });
		} catch (error) {
			this.logger.error("Z-score outlier detection failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Z-score outlier detection failed",
				"OUTLIER_ERROR"
			);
		}
	}
}





