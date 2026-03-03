/**
 * Vector indexing tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class CreateHNSWIndexTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "create_hnsw_index",
			description: "Create HNSW index for vector column",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string", description: "Table name" },
					vector_column: { type: "string", description: "Vector column name" },
					index_name: { type: "string", description: "Name for the index" },
					m: {
						type: "number",
						default: 16,
						minimum: 2,
						maximum: 128,
						description: "HNSW parameter M (connectivity)",
					},
					ef_construction: {
						type: "number",
						default: 200,
						minimum: 4,
						maximum: 2000,
						description: "HNSW parameter ef_construction",
					},
				},
				required: ["table", "vector_column", "index_name"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, vector_column, index_name, m = 16, ef_construction = 200 } = params;
			const query = `
				SELECT hnsw_create_index($1::text, $2::text, $3::text, $4::integer, $5::integer) AS result
			`;
			const result = await this.executor.executeQueryOne(query, [table, vector_column, index_name, m, ef_construction]);
			return this.success(result, { index_name, m, ef_construction });
		} catch (error) {
			this.logger.error("HNSW index creation failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "HNSW index creation failed",
				"INDEX_ERROR"
			);
		}
	}
}

export class DropIndexTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "drop_index",
			description: "Drop a vector index",
			inputSchema: {
				type: "object",
				properties: {
					index_name: { type: "string", description: "Name of the index to drop" },
				},
				required: ["index_name"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { index_name } = params;
			const query = `DROP INDEX IF EXISTS ${this.db.escapeIdentifier(index_name)}`;
			await this.executor.executeQuery(query);
			return this.success({ dropped: true }, { index_name });
		} catch (error) {
			this.logger.error("Index drop failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Index drop failed", "INDEX_ERROR");
		}
	}
}

export class IndexStatisticsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "index_statistics",
			description: "Get statistics for a vector index",
			inputSchema: {
				type: "object",
				properties: {
					index_name: { type: "string", description: "Name of the index" },
				},
				required: ["index_name"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { index_name } = params;
			const query = `
				SELECT 
					schemaname,
					tablename,
					indexname,
					indexdef
				FROM pg_indexes
				WHERE indexname = $1
			`;
			const result = await this.executor.executeQueryOne(query, [index_name]);
			if (!result) {
				return this.error("Index not found", "NOT_FOUND", { index_name });
			}
			return this.success(result, { index_name });
		} catch (error) {
			this.logger.error("Index statistics failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Index statistics failed",
				"INDEX_ERROR"
			);
		}
	}
}
