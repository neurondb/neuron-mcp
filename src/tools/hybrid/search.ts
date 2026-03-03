/**
 * Hybrid search tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class HybridSearchTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "hybrid_search",
			description: "Combine vector similarity and full-text search",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					query_vector: { type: "array", items: { type: "number" } },
					query_text: { type: "string" },
					text_column: { type: "string" },
					vector_column: { type: "string" },
					vector_weight: { type: "number", default: 0.7, minimum: 0, maximum: 1 },
					limit: { type: "number", default: 10, minimum: 1, maximum: 1000 },
				},
				required: ["table", "query_vector", "query_text", "text_column", "vector_column"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const {
				table,
				query_vector,
				query_text,
				text_column,
				vector_column,
				vector_weight = 0.7,
				limit = 10,
			} = params;
			const vectorStr = `[${query_vector.join(",")}]`;
			const query = `SELECT * FROM hybrid_search($1, $2::vector, $3, $4, $5, $6, $7)`;
			const results = await this.executor.executeQuery(query, [
				table,
				vectorStr,
				query_text,
				text_column,
				vector_column,
				vector_weight,
				limit,
			]);
			return this.success(results, { count: results.length, vector_weight });
		} catch (error) {
			this.logger.error("Hybrid search failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Hybrid search failed", "SEARCH_ERROR");
		}
	}
}





