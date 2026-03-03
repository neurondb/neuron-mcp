/**
 * PostgreSQL index statistics tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLIndexStatsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_index_stats",
			description: "Get detailed per-index statistics (scans, size, bloat)",
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

		try {
			let query: string;
			const queryParams: any[] = [];
			const conditions: string[] = [];

			if (schema) {
				conditions.push(`s.schemaname = $${queryParams.length + 1}`);
				queryParams.push(schema);
			}
			if (table) {
				conditions.push(`s.relname = $${queryParams.length + 1}`);
				queryParams.push(table);
			}

			const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

			query = `
				SELECT 
					s.schemaname,
					s.relname AS table_name,
					s.indexrelname AS index_name,
					s.idx_scan AS index_scans,
					s.idx_tup_read AS tuples_read,
					s.idx_tup_fetch AS tuples_fetched,
					pg_relation_size(s.schemaname||'.'||s.indexrelname) AS index_size_bytes,
					pg_size_pretty(pg_relation_size(s.schemaname||'.'||s.indexrelname)) AS index_size_pretty,
					i.idx_blks_read AS index_blocks_read,
					i.idx_blks_hit AS index_blocks_hit,
					CASE 
						WHEN (i.idx_blks_read + i.idx_blks_hit) > 0 
						THEN (i.idx_blks_hit::float / (i.idx_blks_read + i.idx_blks_hit) * 100)
						ELSE 0
					END AS cache_hit_ratio
				FROM pg_stat_user_indexes s
				LEFT JOIN pg_statio_user_indexes i ON i.indexrelid = s.indexrelid
				${whereClause}
				ORDER BY s.schemaname, s.relname, s.indexrelname
			`;

			const stats = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL index statistics retrieved", {
				count: stats.length,
				schema,
				table,
			});

			return this.success(
				{
					index_stats: stats,
					count: stats.length,
				},
				{ tool: "postgresql_index_stats" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL index statistics query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL index statistics query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








