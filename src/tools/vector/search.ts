/**
 * Vector search tools with all distance metrics
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class VectorSearchTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_search",
			description: "Perform vector similarity search using L2, cosine, inner product, L1, Hamming, Chebyshev, or Minkowski distance",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string", description: "Table name containing vectors" },
					vector_column: { type: "string", description: "Name of the vector column" },
					query_vector: {
						type: "array",
						items: { type: "number" },
						description: "Query vector for similarity search",
					},
					limit: { type: "number", default: 10, minimum: 1, maximum: 1000, description: "Maximum number of results" },
					distance_metric: {
						type: "string",
						enum: ["l2", "cosine", "inner_product", "l1", "hamming", "chebyshev", "minkowski"],
						default: "l2",
						description: "Distance metric to use",
					},
					additional_columns: {
						type: "array",
						items: { type: "string" },
						description: "Additional columns to return in results",
					},
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
			const {
				table,
				vector_column,
				query_vector,
				limit = 10,
				distance_metric = "l2",
				additional_columns = [],
			} = params;

			const results = await this.executor.executeVectorSearch(
				table,
				vector_column,
				query_vector,
				distance_metric,
				limit,
				additional_columns
			);

			return this.success(results, {
				count: results.length,
				distance_metric,
			});
		} catch (error) {
			this.logger.error("Vector search failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Vector search failed",
				"SEARCH_ERROR",
				{ error: String(error) }
			);
		}
	}
}

export class VectorSearchL2Tool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_search_l2",
			description: "Perform vector similarity search using L2 (Euclidean) distance",
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
			const results = await this.executor.executeVectorSearch(table, vector_column, query_vector, "l2", limit);
			return this.success(results, { count: results.length, distance_metric: "l2" });
		} catch (error) {
			this.logger.error("L2 vector search failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "L2 vector search failed", "SEARCH_ERROR");
		}
	}
}

export class VectorSearchCosineTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_search_cosine",
			description: "Perform vector similarity search using cosine distance",
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
			const results = await this.executor.executeVectorSearch(table, vector_column, query_vector, "cosine", limit);
			return this.success(results, { count: results.length, distance_metric: "cosine" });
		} catch (error) {
			this.logger.error("Cosine vector search failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Cosine vector search failed", "SEARCH_ERROR");
		}
	}
}

export class VectorSearchInnerProductTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_search_inner_product",
			description: "Perform vector similarity search using inner product distance",
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
				"inner_product",
				limit
			);
			return this.success(results, { count: results.length, distance_metric: "inner_product" });
		} catch (error) {
			this.logger.error("Inner product vector search failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Inner product vector search failed",
				"SEARCH_ERROR"
			);
		}
	}
}

