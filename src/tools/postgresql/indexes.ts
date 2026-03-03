/**
 * PostgreSQL indexes tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLIndexesTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_indexes",
			description: "List all PostgreSQL indexes with statistics (size, usage, scan counts)",
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
					include_system: {
						type: "boolean",
						default: false,
						description: "Include system indexes (pg_catalog, information_schema)",
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
		const includeSystem = params.include_system === true;

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
			if (!includeSystem) {
				conditions.push(`i.schemaname NOT IN ('pg_catalog', 'information_schema')`);
			}

			const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

			query = `
				SELECT 
					i.schemaname,
					i.tablename,
					i.indexname,
					i.indexdef,
					pg_relation_size(quote_ident(i.schemaname)||'.'||quote_ident(i.indexname)) AS index_size_bytes,
					pg_size_pretty(pg_relation_size(quote_ident(i.schemaname)||'.'||quote_ident(i.indexname))) AS index_size_pretty,
					COALESCE(s.idx_scan, 0) AS index_scans,
					COALESCE(s.idx_tup_read, 0) AS tuples_read,
					COALESCE(s.idx_tup_fetch, 0) AS tuples_fetched,
					i.tablespace
				FROM pg_indexes i
				LEFT JOIN pg_stat_user_indexes s ON s.schemaname = i.schemaname 
					AND s.relname = i.tablename 
					AND s.indexrelname = i.indexname
				${whereClause}
				ORDER BY i.schemaname, i.tablename, i.indexname
			`;

			const indexes = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL indexes listed", {
				count: indexes.length,
				schema,
				table,
				include_system: includeSystem,
			});

			return this.success(
				{
					indexes,
					count: indexes.length,
				},
				{ tool: "postgresql_indexes" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL indexes query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL indexes query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








