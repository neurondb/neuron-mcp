/**
 * PostgreSQL table size tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLTableSizeTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_table_size",
			description: "Get size of specific tables (with options for total, indexes, toast)",
			inputSchema: {
				type: "object",
				properties: {
					schema: {
						type: "string",
						description: "Schema name (optional, required if table is specified)",
					},
					table: {
						type: "string",
						description: "Table name (optional, if not specified returns all tables)",
					},
					include_indexes: {
						type: "boolean",
						default: true,
						description: "Include index sizes",
					},
					include_toast: {
						type: "boolean",
						default: true,
						description: "Include TOAST size",
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
		const includeIndexes = params.include_indexes !== false;
		const includeToast = params.include_toast !== false;

		try {
			let query: string;
			const queryParams: any[] = [];
			const conditions: string[] = [];

			if (schema && table) {
				conditions.push(`t.schemaname = $${queryParams.length + 1} AND t.tablename = $${queryParams.length + 2}`);
				queryParams.push(schema, table);
			} else if (schema) {
				conditions.push(`t.schemaname = $${queryParams.length + 1}`);
				queryParams.push(schema);
			} else if (table) {
				conditions.push(`t.tablename = $${queryParams.length + 1}`);
				queryParams.push(table);
			}

			if (conditions.length > 0) {
				conditions.push(`t.schemaname NOT IN ('pg_catalog', 'information_schema')`);
			} else {
				conditions.push(`t.schemaname NOT IN ('pg_catalog', 'information_schema')`);
			}

			const whereClause = `WHERE ${conditions.join(" AND ")}`;

			if (includeIndexes && includeToast) {
				query = `
					SELECT 
						t.schemaname,
						t.tablename,
						pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS total_size_bytes,
						pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS total_size_pretty,
						pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS table_size_bytes,
						pg_size_pretty(pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS table_size_pretty,
						pg_indexes_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS indexes_size_bytes,
						pg_size_pretty(pg_indexes_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS indexes_size_pretty,
						pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) - 
							pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) - 
							pg_indexes_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS toast_size_bytes,
						pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) - 
							pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) - 
							pg_indexes_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS toast_size_pretty
					FROM pg_tables t
					${whereClause}
					ORDER BY pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) DESC
				`;
			} else if (includeIndexes) {
				query = `
					SELECT 
						t.schemaname,
						t.tablename,
						pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) + 
							pg_indexes_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS total_size_bytes,
						pg_size_pretty(pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) + 
							pg_indexes_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS total_size_pretty,
						pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS table_size_bytes,
						pg_size_pretty(pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS table_size_pretty,
						pg_indexes_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS indexes_size_bytes,
						pg_size_pretty(pg_indexes_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS indexes_size_pretty
					FROM pg_tables t
					${whereClause}
					ORDER BY (pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) + 
						pg_indexes_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) DESC
				`;
			} else {
				query = `
					SELECT 
						t.schemaname,
						t.tablename,
						pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS table_size_bytes,
						pg_size_pretty(pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS table_size_pretty
					FROM pg_tables t
					${whereClause}
					ORDER BY pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) DESC
				`;
			}

			const sizes = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL table sizes retrieved", {
				count: sizes.length,
				schema,
				table,
			});

			return this.success(
				{
					table_sizes: sizes,
					count: sizes.length,
				},
				{ tool: "postgresql_table_size" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL table size query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL table size query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








