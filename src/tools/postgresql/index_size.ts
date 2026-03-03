/**
 * PostgreSQL index size tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLIndexSizeTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_index_size",
			description: "Get size of specific indexes",
			inputSchema: {
				type: "object",
				properties: {
					schema: {
						type: "string",
						description: "Filter by schema name (optional)",
					},
					table: {
						type: "string",
						description: "Filter by table name (optional)",
					},
					index: {
						type: "string",
						description: "Filter by index name (optional)",
					},
				},
				required: [],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		const schema = params.schema as string | undefined;
		const table = params.table as string | undefined;
		const index = params.index as string | undefined;

		try {
			let query: string;
			const queryParams: any[] = [];
			const conditions: string[] = [];

			if (schema) {
				conditions.push(`i.schemaname = $${queryParams.length + 1}`);
				queryParams.push(schema);
			}
			if (table) {
				conditions.push(`i.tablename = $${queryParams.length + 1}`);
				queryParams.push(table);
			}
			if (index) {
				conditions.push(`i.indexname = $${queryParams.length + 1}`);
				queryParams.push(index);
			}

			conditions.push(`i.schemaname NOT IN ('pg_catalog', 'information_schema')`);

			const whereClause = `WHERE ${conditions.join(" AND ")}`;

			query = `
				SELECT 
					i.schemaname,
					i.tablename,
					i.indexname,
					pg_relation_size(quote_ident(i.schemaname)||'.'||quote_ident(i.indexname)) AS index_size_bytes,
					pg_size_pretty(pg_relation_size(quote_ident(i.schemaname)||'.'||quote_ident(i.indexname))) AS index_size_pretty,
					i.indexdef
				FROM pg_indexes i
				${whereClause}
				ORDER BY pg_relation_size(quote_ident(i.schemaname)||'.'||quote_ident(i.indexname)) DESC
			`;

			const sizes = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL index sizes retrieved", {
				count: sizes.length,
				schema,
				table,
				index,
			});

			return this.success(
				{
					index_sizes: sizes,
					count: sizes.length,
				},
				{ tool: "postgresql_index_size" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL index size query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL index size query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








