/**
 * PostgreSQL tables tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLTablesTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_tables",
			description: "List all PostgreSQL tables with metadata (schema, owner, size, row count)",
			inputSchema: {
				type: "object",
				properties: {
					schema: {
						type: "string",
						description: "Filter by schema name (optional)",
					},
					include_system: {
						type: "boolean",
						default: false,
						description: "Include system tables (pg_catalog, information_schema)",
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
		const includeSystem = params.include_system === true;

		try {
			let query: string;
			const queryParams: any[] = [];

			if (schema) {
				query = `
					SELECT 
						t.schemaname,
						t.tablename,
						t.tableowner,
						pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS total_size_bytes,
						pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS total_size_pretty,
						pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS table_size_bytes,
						pg_size_pretty(pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS table_size_pretty,
						COALESCE(s.n_live_tup, 0) AS row_count,
						t.tablespace
					FROM pg_tables t
					LEFT JOIN pg_stat_user_tables s ON s.schemaname = t.schemaname AND s.relname = t.tablename
					WHERE t.schemaname = $1
					ORDER BY t.schemaname, t.tablename
				`;
				queryParams.push(schema);
			} else if (includeSystem) {
				query = `
					SELECT 
						t.schemaname,
						t.tablename,
						t.tableowner,
						pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS total_size_bytes,
						pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS total_size_pretty,
						pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS table_size_bytes,
						pg_size_pretty(pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS table_size_pretty,
						COALESCE(s.n_live_tup, 0) AS row_count,
						t.tablespace
					FROM pg_tables t
					LEFT JOIN pg_stat_user_tables s ON s.schemaname = t.schemaname AND s.relname = t.tablename
					ORDER BY t.schemaname, t.tablename
				`;
			} else {
				query = `
					SELECT 
						t.schemaname,
						t.tablename,
						t.tableowner,
						pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS total_size_bytes,
						pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS total_size_pretty,
						pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename)) AS table_size_bytes,
						pg_size_pretty(pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS table_size_pretty,
						COALESCE(s.n_live_tup, 0) AS row_count,
						t.tablespace
					FROM pg_tables t
					LEFT JOIN pg_stat_user_tables s ON s.schemaname = t.schemaname AND s.relname = t.tablename
					WHERE t.schemaname NOT IN ('pg_catalog', 'information_schema')
					ORDER BY t.schemaname, t.tablename
				`;
			}

			const tables = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL tables listed", {
				count: tables.length,
				schema,
				include_system: includeSystem,
			});

			return this.success(
				{
					tables,
					count: tables.length,
				},
				{ tool: "postgresql_tables" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL tables query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL tables query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








