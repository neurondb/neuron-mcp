/**
 * Remaining vector search tools (L1, Hamming, Chebyshev, Minkowski)
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class VectorSearchL1Tool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_search_l1",
			description: "Perform vector similarity search using L1 (Manhattan) distance",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					vector_column: { type: "string" },
					query_vector: { type: "array", items: { type: "number" } },
					limit: { type: "number", default: 10, minimum: 1, maximum: 1000 },
				},
				required: ["table", "vector_column", "query_vector"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, vector_column, query_vector, limit = 10 } = params;
			const results = await this.executor.executeVectorSearch(table, vector_column, query_vector, "l1", limit);
			return this.success(results, { count: results.length, distance_metric: "l1" });
		} catch (error) {
			this.logger.error("L1 vector search failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "L1 vector search failed", "SEARCH_ERROR");
		}
	}
}

export class VectorSearchHammingTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_search_hamming",
			description: "Perform vector similarity search using Hamming distance",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					vector_column: { type: "string" },
					query_vector: { type: "array", items: { type: "number" } },
					limit: { type: "number", default: 10, minimum: 1, maximum: 1000 },
				},
				required: ["table", "vector_column", "query_vector"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, vector_column, query_vector, limit = 10 } = params;
			const results = await this.executor.executeVectorSearch(
				table,
				vector_column,
				query_vector,
				"hamming",
				limit
			);
			return this.success(results, { count: results.length, distance_metric: "hamming" });
		} catch (error) {
			this.logger.error("Hamming vector search failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Hamming vector search failed",
				"SEARCH_ERROR"
			);
		}
	}
}

export class VectorSearchChebyshevTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_search_chebyshev",
			description: "Perform vector similarity search using Chebyshev distance",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					vector_column: { type: "string" },
					query_vector: { type: "array", items: { type: "number" } },
					limit: { type: "number", default: 10, minimum: 1, maximum: 1000 },
				},
				required: ["table", "vector_column", "query_vector"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, vector_column, query_vector, limit = 10 } = params;
			const results = await this.executor.executeVectorSearch(
				table,
				vector_column,
				query_vector,
				"chebyshev",
				limit
			);
			return this.success(results, { count: results.length, distance_metric: "chebyshev" });
		} catch (error) {
			this.logger.error("Chebyshev vector search failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Chebyshev vector search failed",
				"SEARCH_ERROR"
			);
		}
	}
}

export class VectorSearchMinkowskiTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_search_minkowski",
			description: "Perform vector similarity search using Minkowski distance",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					vector_column: { type: "string" },
					query_vector: { type: "array", items: { type: "number" } },
					p: {
						type: "number",
						default: 2,
						minimum: 1,
						description: "Minkowski parameter p (1=Manhattan, 2=Euclidean, infinity=Chebyshev)",
					},
					limit: { type: "number", default: 10, minimum: 1, maximum: 1000 },
				},
				required: ["table", "vector_column", "query_vector"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, vector_column, query_vector, p = 2, limit = 10 } = params;
			// Minkowski requires the p parameter, so we use the function directly
			const vStr = `[${query_vector.join(",")}]`;
			const query = `
				SELECT *, vector_minkowski_distance(${this.db.escapeIdentifier(vector_column)}, $1::vector, $2::double precision) AS distance
				FROM ${this.db.escapeIdentifier(table)}
				ORDER BY distance
				LIMIT $3
			`;
			const results = await this.executor.executeQuery(query, [vStr, p, limit]);
			return this.success(results, { count: results.length, distance_metric: "minkowski", p });
		} catch (error) {
			this.logger.error("Minkowski vector search failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Minkowski vector search failed",
				"SEARCH_ERROR"
			);
		}
	}
}





